"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Film,
  TreePine,
  Layers,
  Sparkles,
  TrendingDown,
  CircleDot,
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
import ApplicationTryIt from "@/components/application/ApplicationTryIt";
import {
  SliderGroup,
  StepReveal,
  InlineChallenge,
  Callout,
  MiniSummary,
  TopicLink,
} from "@/components/interactive";

export const metadata: TopicMeta = {
  slug: "bias-variance-in-netflix-prize",
  title: "Bias-Variance in the Netflix Prize",
  titleVi: "Bias-Variance trong Netflix Prize",
  description:
    "Netflix Prize 1 triệu đô: vì sao đội thắng cần 800+ mô hình gộp lại? Câu chuyện kinh điển về ensemble và giới hạn của việc giảm variance trong thực tế.",
  category: "classic-ml",
  tags: ["ensemble", "recommendation", "competition", "application"],
  difficulty: "intermediate",
  relatedSlugs: ["bias-variance"],
  vizType: "interactive",
  applicationOf: "bias-variance",
  featuredApp: {
    name: "Netflix",
    productFeature: "Netflix Prize",
    company: "Netflix Inc.",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "The BellKor Solution to the Netflix Grand Prize",
      publisher: "BellKor Team (AT&T Labs)",
      url: "https://www.netflixprize.com/assets/GrandPrize2009_BPC_BellKor.pdf",
      date: "2009-09",
      kind: "paper",
    },
    {
      title:
        "Why Netflix Never Implemented The Algorithm That Won The Netflix $1 Million Challenge",
      publisher: "Techdirt",
      url: "https://www.techdirt.com/2012/04/13/why-netflix-never-implemented-algorithm-that-won-netflix-1-million-challenge/",
      date: "2012-04",
      kind: "news",
    },
    {
      title:
        "The Netflix Prize and Production Machine Learning Systems: An Insider Look",
      publisher: "Xavier Amatriain, ACM RecSys",
      url: "https://dl.acm.org/doi/10.1145/2507157.2507163",
      date: "2013-10",
      kind: "paper",
    },
  ],
  tocSections: [
    { id: "hero", labelVi: "Cuộc thi" },
    { id: "problem", labelVi: "Vấn đề" },
    { id: "mechanism", labelVi: "Cách giải quyết" },
    { id: "tryIt", labelVi: "Thử tự tay" },
    { id: "metrics", labelVi: "Con số thật" },
    { id: "counterfactual", labelVi: "Nếu không có" },
  ],
};

/* ────────────────────────────────────────────────────────────
   DỮ LIỆU — 4 mô hình trong "model zoo"
   ──────────────────────────────────────────────────────────── */

type ModelEntry = {
  id: "linear" | "tree" | "deep" | "ensemble";
  name: string;
  vi: string;
  shortVi: string;
  icon: typeof Film;
  color: string;
  rmse: number;
  biasLevel: number; // 0–100 (100 = very biased)
  varianceLevel: number; // 0–100
  description: string;
  whyLikeThis: string;
};

const MODELS: ModelEntry[] = [
  {
    id: "linear",
    name: "Linear baseline",
    vi: "Hồi quy tuyến tính",
    shortVi: "Tuyến tính",
    icon: TrendingDown,
    color: "#3b82f6",
    rmse: 0.9525,
    biasLevel: 85,
    varianceLevel: 10,
    description:
      "Baseline kinh điển: dự đoán điểm phim bằng trung bình người dùng + trung bình phim + hằng số tương tác.",
    whyLikeThis:
      "Bias cao — giả định tất cả sở thích là cộng tuyến tính, bỏ qua tương tác phức tạp. Variance rất thấp — fit như nhau dù có hay không vài ngàn review lẻ.",
  },
  {
    id: "tree",
    name: "Decision tree",
    vi: "Cây quyết định",
    shortVi: "Cây QĐ",
    icon: TreePine,
    color: "#10b981",
    rmse: 0.8978,
    biasLevel: 50,
    varianceLevel: 45,
    description:
      "Cây phân nhánh theo đặc trưng (thể loại, thập niên, người dùng đã xem…) để tách nhóm người có sở thích giống nhau.",
    whyLikeThis:
      "Bias trung bình — cây bắt được tương tác, nhưng chỉ dạng bậc thang. Variance trung bình — chia ngẫu nhiên chút đã ảnh hưởng cây.",
  },
  {
    id: "deep",
    name: "Deep matrix factorization",
    vi: "Deep MF (SVD + mạng nơ-ron)",
    shortVi: "Deep MF",
    icon: Layers,
    color: "#a855f7",
    rmse: 0.872,
    biasLevel: 25,
    varianceLevel: 70,
    description:
      "SVD biến mỗi người và mỗi phim thành vector, sau đó một mạng nơ-ron nhỏ học cách ghép hai vector ra điểm dự đoán.",
    whyLikeThis:
      "Bias thấp — đủ linh hoạt để nắm các cụm sở thích ngách. Variance cao — thay đổi seed huấn luyện là cho RMSE khác.",
  },
  {
    id: "ensemble",
    name: "Ensemble (800+ mô hình)",
    vi: "Ensemble 800+ mô hình",
    shortVi: "Ensemble",
    icon: Sparkles,
    color: "#f59e0b",
    rmse: 0.8554,
    biasLevel: 20,
    varianceLevel: 20,
    description:
      "Đội thắng BellKor's Pragmatic Chaos gom hơn 800 mô hình khác nhau và lấy trung bình có trọng số để triệt tiêu nhiễu.",
    whyLikeThis:
      "Bias thấp như deep MF — giữ được khả năng bắt mẫu phức tạp. Variance giảm mạnh — nhờ hiệu ứng 'lỗi của mỗi mô hình lệch ngẫu nhiên sẽ bù trừ nhau khi trung bình'.",
  },
];

/* ────────────────────────────────────────────────────────────
   Scatter data — predicted vs actual cho mỗi mô hình
   (scatter giả lập, nhưng có structure: RMSE nhỏ hơn ⇒ điểm
   bám sát đường chéo hơn)
   ──────────────────────────────────────────────────────────── */

function seededRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function gaussian(rng: () => number): number {
  const u1 = Math.max(1e-9, rng());
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function generateScatterForModel(model: ModelEntry): Array<{
  actual: number;
  predicted: number;
}> {
  const rng = seededRng(17 + model.id.charCodeAt(0));
  const points: Array<{ actual: number; predicted: number }> = [];
  for (let i = 0; i < 120; i++) {
    const actual = 1 + Math.round(rng() * 4); // 1..5 stars
    const biasShift = ((model.biasLevel / 100) - 0.5) * 0.4;
    const varShift = (model.varianceLevel / 100) * 1.1;
    const predicted = Math.max(
      0.5,
      Math.min(5.5, actual + biasShift + gaussian(rng) * varShift)
    );
    points.push({ actual, predicted });
  }
  return points;
}

/* ────────────────────────────────────────────────────────────
   COMPONENT — SCATTER PLOT (predicted vs actual)
   ──────────────────────────────────────────────────────────── */

function ScatterPlot({ model }: { model: ModelEntry }) {
  const points = useMemo(() => generateScatterForModel(model), [model]);
  const W = 280;
  const H = 220;
  const padL = 36;
  const padR = 10;
  const padT = 10;
  const padB = 28;
  const xAt = (v: number) => padL + ((v - 0.5) / 5) * (W - padL - padR);
  const yAt = (v: number) => padT + (1 - (v - 0.5) / 5) * (H - padT - padB);

  return (
    <div className="space-y-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Scatter plot cho ${model.vi}`}>
        {/* Grid */}
        {[1, 2, 3, 4, 5].map((v) => (
          <g key={v}>
            <line x1={padL} y1={yAt(v)} x2={W - padR} y2={yAt(v)} stroke="currentColor" className="text-border" strokeWidth={0.4} />
            <text x={padL - 4} y={yAt(v) + 3} fontSize={8} fill="currentColor" className="text-muted" textAnchor="end">
              {v}
            </text>
            <text x={xAt(v)} y={H - 10} fontSize={8} fill="currentColor" className="text-muted" textAnchor="middle">
              {v}
            </text>
          </g>
        ))}
        {/* Diagonal y = x */}
        <line
          x1={xAt(0.5)}
          y1={yAt(0.5)}
          x2={xAt(5.5)}
          y2={yAt(5.5)}
          stroke="#94a3b8"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
        {/* Points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={xAt(p.actual)}
            cy={yAt(p.predicted)}
            r={2.8}
            fill={model.color}
            opacity={0.5}
          />
        ))}
        {/* Axes labels */}
        <text x={W / 2} y={H - 2} fontSize={9} fill="currentColor" className="text-muted" textAnchor="middle">
          Điểm thực tế (sao)
        </text>
        <text
          x={8}
          y={H / 2}
          fontSize={9}
          fill="currentColor"
          className="text-muted"
          textAnchor="middle"
          transform={`rotate(-90, 8, ${H / 2})`}
        >
          Dự đoán (sao)
        </text>
      </svg>
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-muted">
          <span className="inline-block h-0.5 w-4 border-t border-dashed border-[#94a3b8]" />
          Điểm hoàn hảo: nằm trên đường chéo
        </span>
        <span className="tabular-nums font-mono" style={{ color: model.color }}>
          RMSE = {model.rmse.toFixed(4)}
        </span>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   COMPONENT — Blending 2 models visualisation
   ──────────────────────────────────────────────────────────── */

function BlendVisualization({ values }: { values: Record<string, number> }) {
  const weightDeep = values.blend / 100; // weight for deep model
  const weightTree = 1 - weightDeep;
  const modelA = MODELS[1]; // tree
  const modelC = MODELS[2]; // deep

  const blendedRMSE = useMemo(() => {
    // Simple model: blended RMSE² ≈ w_t² · RMSE_t² + w_d² · RMSE_d² + 2 · w_t · w_d · ρ · RMSE_t · RMSE_d
    // For demonstration, assume mild negative correlation ρ = 0.4 between error vectors
    const rhoErr = 0.4;
    const varBlend =
      weightTree * weightTree * modelA.rmse * modelA.rmse +
      weightDeep * weightDeep * modelC.rmse * modelC.rmse +
      2 * weightTree * weightDeep * rhoErr * modelA.rmse * modelC.rmse;
    return Math.sqrt(Math.max(0.001, varBlend));
  }, [weightTree, weightDeep, modelA, modelC]);

  const isBetter = blendedRMSE < modelA.rmse && blendedRMSE < modelC.rmse;

  return (
    <div className="w-full space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-lg border p-3"
          style={{ borderLeft: `4px solid ${modelA.color}` }}
        >
          <div className="text-[11px] font-semibold text-muted uppercase mb-1">
            {modelA.vi}
          </div>
          <div className="text-base font-bold" style={{ color: modelA.color }}>
            {Math.round(weightTree * 100)}%
          </div>
          <div className="text-[11px] text-muted">
            RMSE riêng: {modelA.rmse.toFixed(4)}
          </div>
        </div>
        <div
          className="rounded-lg border p-3"
          style={{ borderLeft: `4px solid ${modelC.color}` }}
        >
          <div className="text-[11px] font-semibold text-muted uppercase mb-1">
            {modelC.vi}
          </div>
          <div className="text-base font-bold" style={{ color: modelC.color }}>
            {Math.round(weightDeep * 100)}%
          </div>
          <div className="text-[11px] text-muted">
            RMSE riêng: {modelC.rmse.toFixed(4)}
          </div>
        </div>
      </div>

      {/* Bar: visualize weight split */}
      <div className="h-6 rounded-full overflow-hidden bg-surface border border-border flex">
        <motion.div
          className="h-full"
          style={{ backgroundColor: modelA.color }}
          animate={{ width: `${weightTree * 100}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
        />
        <motion.div
          className="h-full"
          style={{ backgroundColor: modelC.color }}
          animate={{ width: `${weightDeep * 100}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
        />
      </div>

      <div
        className="rounded-xl border-2 p-4 text-center"
        style={{
          borderColor: isBetter ? "#10b981" : "#94a3b8",
          backgroundColor: isBetter ? "#10b98115" : "#94a3b815",
        }}
      >
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          RMSE của bản ensemble
        </div>
        <motion.div
          key={blendedRMSE.toFixed(4)}
          initial={{ scale: 1.2, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="text-3xl font-bold tabular-nums"
          style={{ color: isBetter ? "#10b981" : "#64748b" }}
        >
          {blendedRMSE.toFixed(4)}
        </motion.div>
        <div className="text-[11px] text-muted mt-1">
          {isBetter ? (
            <>
              <Sparkles className="inline h-3 w-3 text-emerald-500" /> Bản trộn tốt hơn cả hai mô
              hình riêng
            </>
          ) : (
            <>Hãy thử tỉ lệ khác — ở vùng 40–60% thường cho kết quả tốt nhất</>
          )}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   TIMELINE EVENT
   ──────────────────────────────────────────────────────────── */

function TimelineEvent({
  date,
  title,
  body,
  color,
}: {
  date: string;
  title: string;
  body: string;
  color: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="shrink-0 mt-1 h-8 w-8 rounded-full flex items-center justify-center font-bold text-[10px] text-white"
        style={{ backgroundColor: color }}
      >
        <CircleDot size={14} />
      </div>
      <div className="flex-1 rounded-xl border border-border bg-card p-3">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-sm font-semibold text-foreground">{title}</span>
          <span
            className="text-[11px] tabular-nums font-mono px-2 py-0.5 rounded-full"
            style={{ backgroundColor: color + "22", color }}
          >
            {date}
          </span>
        </div>
        <p className="text-xs text-foreground/80 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   TRADEOFF BAR — simple vs ensemble
   ──────────────────────────────────────────────────────────── */

function TradeoffBar({
  label,
  valueSimple,
  valueEnsemble,
  unit,
  preferred,
  color,
}: {
  label: string;
  valueSimple: number;
  valueEnsemble: number;
  unit: string;
  preferred: string;
  color: string;
}) {
  const max = Math.max(valueSimple, valueEnsemble, 1);
  const wSimple = (valueSimple / max) * 100;
  const wEns = (valueEnsemble / max) * 100;
  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-2">
      <div className="text-xs font-semibold text-foreground">{label}</div>
      <div className="space-y-1.5">
        <div>
          <div className="flex items-center justify-between text-[11px] mb-0.5">
            <span className="text-muted">SVD + RBM</span>
            <span className="tabular-nums font-mono" style={{ color: "#3b82f6" }}>
              {valueSimple}
              {unit}
            </span>
          </div>
          <div className="h-2 rounded-full bg-surface overflow-hidden">
            <motion.div
              className="h-full"
              style={{ backgroundColor: "#3b82f6" }}
              animate={{ width: `${wSimple}%` }}
              transition={{ type: "spring", stiffness: 160, damping: 22 }}
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-[11px] mb-0.5">
            <span className="text-muted">Ensemble 800+</span>
            <span className="tabular-nums font-mono" style={{ color: "#f59e0b" }}>
              {valueEnsemble}
              {unit}
            </span>
          </div>
          <div className="h-2 rounded-full bg-surface overflow-hidden">
            <motion.div
              className="h-full"
              style={{ backgroundColor: "#f59e0b" }}
              animate={{ width: `${wEns}%` }}
              transition={{ type: "spring", stiffness: 160, damping: 22 }}
            />
          </div>
        </div>
      </div>
      <div
        className="text-[11px] font-semibold"
        style={{ color }}
      >
        {preferred}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   COMPONENT CHÍNH
   ════════════════════════════════════════════════════════════ */

export default function BiasVarianceInNetflixPrize() {
  const [activeModel, setActiveModel] = useState<ModelEntry["id"]>("linear");
  const model = MODELS.find((m) => m.id === activeModel)!;

  return (
    <ApplicationLayout metadata={metadata} parentTitleVi="Bias và Variance">
      <ApplicationHero
        parentTitleVi="Bias và Variance"
        topicSlug="bias-variance-in-netflix-prize"
      >
        <p>
          Năm 2006, Netflix công bố giải thưởng <strong>1 triệu đô-la</strong> cho bất kỳ đội nào
          cải thiện hệ thống gợi ý phim thêm 10%. Ba năm sau, hơn <strong>40 000 đội từ 186 quốc
          gia</strong> vẫn đang thử. Đội chiến thắng &mdash; BellKor&apos;s Pragmatic Chaos &mdash;
          nộp bài chỉ sớm hơn đội nhì đúng <em>22 phút</em>. Cả hai đội đều cán mốc RMSE 0,8554 sau
          khi gộp hơn 800 mô hình.
        </p>
        <p>
          Vì sao để giảm 10% RMSE người ta phải gộp 800 mô hình? Vì sao Netflix <em>không triển khai</em>{" "}
          giải pháp thắng cuộc? Toàn bộ câu chuyện là một lớp học sống động về{" "}
          <TopicLink slug="bias-variance">Bias và Variance</TopicLink> và giới hạn thực tế của
          ensemble khi chi phí tính toán cũng quan trọng như độ chính xác.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="bias-variance-in-netflix-prize">
        <p>
          Hệ thống gợi ý ban đầu của Netflix là <em>Cinematch</em>: tương quan người dùng theo đánh
          giá phim. RMSE (root mean squared error — sai số bình phương trung bình) của Cinematch là{" "}
          <strong>0,9525</strong> trên tập kiểm tra. Netflix đặt mục tiêu: đạt RMSE ≤ 0,8572 — cải
          thiện đúng 10% — để nhận 1 triệu đô-la.
        </p>
        <p>
          Vấn đề cốt lõi: <strong>mỗi mô hình đơn lẻ đều mắc kẹt</strong>. Mô hình đơn giản (hồi
          quy tuyến tính) có bias cao — không bắt được tương tác phức tạp giữa sở thích người xem.
          Mô hình phức tạp (deep matrix factorization) có variance cao — kết quả dao động mạnh giữa
          các tập huấn luyện khác nhau. Hạ cả hai cùng lúc là điều không thể với một mô hình — nhưng
          ensemble thì có thể.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Bias và Variance"
        topicSlug="bias-variance-in-netflix-prize"
      >
        <Beat step={1}>
          <p>
            <strong>SVD đơn lẻ: bias cao, cải thiện ~7%.</strong> Bước đầu tiên, các đội dùng SVD
            (Singular Value Decomposition &mdash; phân rã giá trị suy biến, phương pháp nén ma trận
            đánh giá thành vector ngắn gọn). SVD giảm RMSE khoảng 7%. Nhưng nó vẫn giả định sở thích
            người dùng tuân theo công thức cộng tuyến tính — còn bias đáng kể.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>Bổ sung RBM và kNN: giảm bias, tăng variance.</strong> Các đội thêm RBM
            (Restricted Boltzmann Machine &mdash; mạng Boltzmann giới hạn, một loại mô hình xác
            suất học tương tác ẩn) và kNN (k láng giềng gần nhất &mdash; tìm người dùng có sở thích
            giống bạn). Mỗi mô hình mới bắt được thêm các mẫu nhỏ, nhưng đi kèm variance cao hơn —
            nhạy với dữ liệu huấn luyện.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>Blending 107 mô hình: triệt variance bằng trung bình.</strong> Đội BellKor
            (AT&T Labs) kết hợp 107 mô hình bằng kỹ thuật blending (pha trộn — dùng hồi quy tuyến
            tính trên chính các dự đoán để gán trọng số tối ưu cho từng mô hình). Khi lỗi của mỗi
            mô hình lệch ngẫu nhiên theo các hướng khác nhau, trung bình hoá triệt tiêu phần lớn
            nhiễu — đây chính là nguyên lý cốt lõi của giảm variance.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>Grand Prize: 800+ mô hình, RMSE 0,8554.</strong> Để đạt 10,06% cải thiện, đội
            chiến thắng &ldquo;BellKor&apos;s Pragmatic Chaos&rdquo; hợp nhất ba siêu đội thành một,
            dùng tổng cộng <em>hơn 800 mô hình</em>. Khoảnh khắc quyết định: họ nộp bài chỉ 22 phút
            trước đội The Ensemble — cả hai đều cán cùng RMSE. Chênh lệch quy ra từng giây.
          </p>
        </Beat>
        <Beat step={5}>
          <p>
            <strong>Thực tế: Netflix chỉ triển khai 2 thuật toán.</strong> Netflix sau đó tiết lộ:
            chỉ SVD và RBM đã cho 99% lợi ích. 800+ mô hình còn lại cải thiện thêm vài phần trăm
            RMSE cuối nhưng tăng chi phí tính toán và phức tạp vận hành lên <em>hàng chục lần</em>.
            Đây là bài học kinh điển: <strong>giảm variance bằng ensemble có thể không đáng trong
            sản xuất thực tế</strong> — lý thuyết luôn cần đối chiếu với ràng buộc kinh doanh.
          </p>
        </Beat>
      </ApplicationMechanism>

      {/* ── THỬ TỰ TAY: MODEL ZOO + BLENDING SIMULATOR ── */}
      <ApplicationTryIt topicSlug="bias-variance-in-netflix-prize">
        <h3 className="text-base font-semibold text-foreground mb-2">
          Model zoo — bốn mô hình thi đấu trên cùng tập dữ liệu
        </h3>
        <p className="text-sm text-muted leading-relaxed mb-4">
          Bấm vào một mô hình để xem biểu đồ <em>dự đoán vs thực tế</em>. Mô hình tốt = các chấm bám
          sát đường chéo. Quan sát cách bias (lệch tâm) và variance (rải) thay đổi khi bạn đi từ
          mô hình đơn giản đến ensemble.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {MODELS.map((m) => {
            const Icon = m.icon;
            const active = m.id === activeModel;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveModel(m.id)}
                className="text-left rounded-xl border-2 p-3 transition-all"
                style={{
                  borderColor: active ? m.color : "var(--border)",
                  backgroundColor: active ? m.color + "15" : "var(--bg-card)",
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={14} style={{ color: m.color }} />
                  <span className="text-xs font-bold text-foreground">
                    {m.shortVi}
                  </span>
                </div>
                <div className="text-[10px] text-muted">
                  RMSE{" "}
                  <span className="tabular-nums font-mono" style={{ color: m.color }}>
                    {m.rmse.toFixed(4)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div
            className="rounded-xl border bg-card p-4"
            style={{ borderLeft: `4px solid ${model.color}` }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={model.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <ScatterPlot model={model} />
              </motion.div>
            </AnimatePresence>
          </div>
          <div
            className="rounded-xl border bg-card p-4 space-y-3"
            style={{ borderLeft: `4px solid ${model.color}` }}
          >
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-tertiary">
                Mô hình
              </div>
              <div
                className="text-base font-bold mt-0.5"
                style={{ color: model.color }}
              >
                {model.vi}
              </div>
            </div>
            <p className="text-sm text-foreground/85 leading-relaxed">
              {model.description}
            </p>

            {/* Bias / Variance bars */}
            <div className="space-y-2">
              <div>
                <div className="flex items-center justify-between text-[11px] mb-0.5">
                  <span className="text-muted">Bias</span>
                  <span className="tabular-nums text-blue-600">
                    {model.biasLevel}/100
                  </span>
                </div>
                <div className="h-2 rounded-full bg-surface overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-500"
                    animate={{ width: `${model.biasLevel}%` }}
                    transition={{ type: "spring", stiffness: 200, damping: 22 }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-[11px] mb-0.5">
                  <span className="text-muted">Variance</span>
                  <span className="tabular-nums text-amber-600">
                    {model.varianceLevel}/100
                  </span>
                </div>
                <div className="h-2 rounded-full bg-surface overflow-hidden">
                  <motion.div
                    className="h-full bg-amber-500"
                    animate={{ width: `${model.varianceLevel}%` }}
                    transition={{ type: "spring", stiffness: 200, damping: 22 }}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-surface/60 border border-border p-3">
              <p className="text-xs text-foreground/85 leading-relaxed">
                <strong className="text-foreground">Vì sao kết quả như vậy: </strong>
                {model.whyLikeThis}
              </p>
            </div>
          </div>
        </div>

        {/* Loss curve progression */}
        <div className="rounded-xl border border-border bg-card p-4 mb-6">
          <h4 className="text-sm font-semibold text-foreground mb-3">
            Từng bước đi xuống đáy RMSE
          </h4>
          <div className="space-y-2">
            {MODELS.map((m, i) => {
              const isTarget = m.rmse <= 0.8572;
              return (
                <div key={m.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs" style={{ backgroundColor: m.color + "22", color: m.color }}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-foreground">
                        {m.vi}
                      </span>
                      <span
                        className="text-xs tabular-nums font-mono"
                        style={{ color: m.color }}
                      >
                        RMSE {m.rmse.toFixed(4)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-surface overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: m.color }}
                        animate={{ width: `${100 - ((m.rmse - 0.84) / 0.13) * 100}%` }}
                        transition={{ type: "spring", stiffness: 150, damping: 22, delay: i * 0.05 }}
                      />
                    </div>
                  </div>
                  {isTarget && (
                    <Trophy size={16} className="text-amber-500 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted leading-relaxed mt-3 italic">
            Đường đỏ mờ ở mức RMSE 0,8572 là &ldquo;vạch đích&rdquo; 10% — chỉ ensemble mới vượt qua.
          </p>
        </div>

        <h3 className="text-base font-semibold text-foreground mb-2">
          Tự tay trộn hai mô hình — sức mạnh của ensemble đơn giản
        </h3>
        <p className="text-sm text-muted leading-relaxed mb-4">
          Kéo thanh để quyết định bao nhiêu phần trăm trọng số đổ cho Deep MF, phần còn lại cho cây
          quyết định. Quan sát: thường <strong>một tỉ lệ 40–60%</strong> cho RMSE thấp hơn cả hai mô
          hình riêng. Đây chính là nguyên lý ensemble cơ bản nhất.
        </p>

        <SliderGroup
          title="Kéo thanh để trộn trọng số hai mô hình"
          sliders={[
            {
              key: "blend",
              label: "Trọng số cho Deep MF (phần còn lại cho Cây quyết định)",
              min: 0,
              max: 100,
              step: 5,
              defaultValue: 50,
              unit: "%",
            },
          ]}
          visualization={(values) => <BlendVisualization values={values} />}
        />

        <div className="mt-6">
          <InlineChallenge
            question="Vì sao trộn 50/50 thường cho RMSE thấp hơn từng mô hình riêng?"
            options={[
              "Vì Deep MF luôn đúng hơn, chỉ cần hạ trọng số cây xuống thấp",
              "Vì lỗi của hai mô hình lệch theo các hướng khác nhau, trung bình hoá triệt tiêu phần lớn nhiễu ngẫu nhiên",
              "Vì RMSE là số dương, luôn nhỏ dần khi cộng vào",
              "Vì random seed 50 là con số may mắn",
            ]}
            correct={1}
            explanation="Nguyên tắc cốt lõi của ensemble: nếu hai mô hình có lỗi độc lập, variance của trung bình sẽ chỉ bằng một nửa variance của từng mô hình. Trong thực tế lỗi không hoàn toàn độc lập, nhưng vẫn có tương quan âm đủ để trung bình tốt hơn. Đây là vì sao Netflix Prize cần tới 800+ mô hình — càng nhiều góc nhìn khác nhau, variance càng triệt tiêu hiệu quả."
          />
        </div>

        <div className="mt-4">
          <InlineChallenge
            question="Netflix cuối cùng chỉ triển khai SVD + RBM, bỏ qua 800+ mô hình của đội thắng. Lý do chính là gì?"
            options={[
              "Vì các mô hình khác chạy sai",
              "Vì Netflix không có bản quyền",
              "Vì chi phí tính toán và vận hành 800+ mô hình vượt xa lợi ích cải thiện vài phần trăm RMSE cuối — bài học về 'đủ tốt' so với 'tối ưu'",
              "Vì đội thắng không chia sẻ code",
            ]}
            correct={2}
            explanation="RMSE 0,8554 đẹp trên bảng xếp hạng, nhưng chạy 800 mô hình cho 100 triệu người dùng thì tốn GPU/CPU khủng khiếp, dễ bị lỗi và cực khó bảo trì. 99% lợi ích đã đến từ SVD + RBM. Đây là nguyên tắc sản xuất kinh điển: tối ưu 'đủ dùng' thường thắng tối ưu 'tuyệt đối'. Cùng tư tưởng này có trong bài toán linear vs deep learning — khi baseline đạt 85%, deep chỉ thêm 0–15% và thường không đáng."
          />
        </div>

        <Callout variant="insight" title="Hai quy luật rút ra từ Netflix Prize">
          <ol className="list-decimal pl-5 space-y-1 mt-1">
            <li>
              <strong>Ensemble có giới hạn giảm dần.</strong> Từ 1 &rarr; 10 mô hình, RMSE giảm
              nhanh. Từ 10 &rarr; 100, giảm vừa. Từ 100 &rarr; 800, chỉ giảm vài phần trăm. Càng nhiều
              mô hình càng khó đem lại lợi ích thêm.
            </li>
            <li>
              <strong>&ldquo;Thắng cuộc thi&rdquo; khác &ldquo;thắng sản xuất&rdquo;.</strong> RMSE
              thấp nhất trong benchmark không đồng nghĩa tối ưu với chi phí vận hành, thời gian chạy,
              khả năng debug. Nhiều công ty đã mất tiền vì deploy thẳng mô hình &ldquo;trạng thái nghệ
              thuật&rdquo; mà không cân nhắc những ràng buộc này.
            </li>
          </ol>
        </Callout>

        {/* Ensemble intuition — step-by-step */}
        <div className="mt-8">
          <h3 className="text-base font-semibold text-foreground mb-2">
            Vì sao &ldquo;lấy trung bình&rdquo; lại mạnh đến thế?
          </h3>
          <p className="text-sm text-muted leading-relaxed mb-4">
            Mỗi bước dưới đây là một mảnh ghép của nguyên lý ensemble. Đọc chậm, vì khi bạn hiểu
            đoạn này, bạn đã hiểu 90% vì sao Random Forest, XGBoost, và cả các mạng AI sinh ảnh hiện
            đại đều dùng &ldquo;trung bình nhiều đầu ra&rdquo; ở một dạng nào đó.
          </p>

          <StepReveal
            labels={[
              "Bước 1 — mỗi mô hình có lỗi riêng",
              "Bước 2 — lỗi đó lệch ngẫu nhiên",
              "Bước 3 — trung bình triệt nhiễu",
              "Bước 4 — nhưng bias vẫn còn",
            ]}
          >
            {[
              <div key="e1" className="rounded-lg bg-surface/60 border border-border p-4">
                <p className="text-sm text-foreground leading-relaxed">
                  Giả sử mô hình <strong>SVD</strong> dự đoán 3,7 sao cho phim A. Mô hình{" "}
                  <strong>RBM</strong> dự đoán 4,2 sao. Mô hình <strong>kNN</strong> dự đoán 3,5
                  sao. Thực tế người dùng chấm 4 sao — cả ba đều sai, mỗi mô hình sai một kiểu.
                </p>
              </div>,
              <div key="e2" className="rounded-lg bg-surface/60 border border-border p-4">
                <p className="text-sm text-foreground leading-relaxed">
                  Chìa khoá là: các sai lệch <em>không theo cùng hướng</em>. SVD bỏ qua thể loại
                  hiếm, RBM quá nhạy với người dùng thiểu số, kNN mắc kẹt ở các cluster cũ. Mỗi mô
                  hình sai theo cách riêng. Đây là <em>tính độc lập</em> của lỗi — thứ mà ensemble
                  cần.
                </p>
              </div>,
              <div key="e3" className="rounded-lg bg-surface/60 border border-border p-4">
                <p className="text-sm text-foreground leading-relaxed">
                  Trung bình ba dự đoán: (3,7 + 4,2 + 3,5) / 3 = 3,8 sao. Gần hơn giá trị thật 4
                  sao hơn mọi mô hình riêng lẻ. Toán học đứng sau điều này: nếu sai số độc lập và có
                  trung bình gần 0, variance của <em>trung bình n mô hình</em> chỉ bằng <em>1/n</em>{" "}
                  variance của một mô hình.
                </p>
              </div>,
              <div key="e4" className="rounded-lg bg-surface/60 border border-border p-4">
                <p className="text-sm text-foreground leading-relaxed">
                  Nhưng có một <strong>giới hạn</strong>: nếu cả ba mô hình đều bị bias cùng hướng
                  (ví dụ: tất cả đều dự đoán thấp hơn sự thật 0,3 sao), trung bình vẫn lệch 0,3 sao.
                  Ensemble giảm <em>variance</em>, không giảm <em>bias</em>. Vì vậy đội Netflix kết
                  hợp những mô hình <em>khác nhau về bản chất</em> — để bias của chúng cũng phân tán.
                </p>
              </div>,
            ]}
          </StepReveal>
        </div>

        {/* Competition timeline — narrative */}
        <div className="mt-8">
          <h3 className="text-base font-semibold text-foreground mb-2">
            Dòng thời gian: ba năm, một triệu đô, hai mươi hai phút
          </h3>
          <p className="text-sm text-muted leading-relaxed mb-4">
            Câu chuyện Netflix Prize còn kịch tính hơn cả mô hình vì nó kéo dài 3 năm với nhiều khúc
            ngoặt. Dưới đây là bốn cột mốc quan trọng nhất.
          </p>
          <div className="space-y-3">
            <TimelineEvent
              date="10/2006"
              title="Netflix công bố giải thưởng"
              body="1 triệu đô-la cho đội cải thiện RMSE ≥ 10%. Dữ liệu: 100 triệu đánh giá từ 480 000 người dùng cho 17 770 phim — một trong các bộ dữ liệu công khai lớn nhất thời đó."
              color="#3b82f6"
            />
            <TimelineEvent
              date="10/2007"
              title="Progress Prize lần 1 — BellKor đạt 8,43%"
              body="Đội AT&T Labs đi đầu với kỹ thuật SVD cải tiến + RBM. Nhưng còn cách mốc 10% khá xa — cần thêm các mô hình mới."
              color="#10b981"
            />
            <TimelineEvent
              date="06/2009"
              title="Three teams merge into one"
              body="Ba đội hàng đầu — BellKor, BigChaos, Pragmatic Theory — hợp nhất thành BellKor's Pragmatic Chaos để tận dụng lẫn nhau. Quyết định này rút ngắn đường đến mốc 10%."
              color="#a855f7"
            />
            <TimelineEvent
              date="26/07/2009 18:42 UTC"
              title="Hai đội cán đích cùng lúc"
              body="BellKor's Pragmatic Chaos nộp bài với RMSE 0,8554. Đúng 20 phút sau, The Ensemble nộp kết quả giống hệt. BellKor thắng vì nộp trước. Giải thưởng được trao tháng 9/2009."
              color="#f59e0b"
            />
          </div>
        </div>

        {/* Three-way performance comparison with a simple chart */}
        <div className="mt-8">
          <h3 className="text-base font-semibold text-foreground mb-2">
            Ba con số quan trọng để quyết định deploy hay không
          </h3>
          <p className="text-sm text-muted leading-relaxed mb-4">
            Khi đặt lên bàn cân giữa SVD + RBM và ensemble 800+, Netflix nhìn vào ba trục — không
            chỉ RMSE. Đây là dạng đánh giá mà mọi đội ML trưởng thành đều phải làm trước khi
            &ldquo;đưa vào sản xuất&rdquo;.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <TradeoffBar
              label="Cải thiện RMSE so với baseline"
              valueSimple={7}
              valueEnsemble={10}
              unit="%"
              preferred="Ensemble tốt hơn một chút"
              color="#f59e0b"
            />
            <TradeoffBar
              label="Chi phí tính toán hàng tháng"
              valueSimple={1}
              valueEnsemble={20}
              unit="× baseline"
              preferred="Đơn giản rẻ hơn rất nhiều"
              color="#ef4444"
            />
            <TradeoffBar
              label="Dễ bảo trì và debug"
              valueSimple={9}
              valueEnsemble={3}
              unit="/10"
              preferred="Đơn giản dễ vận hành"
              color="#10b981"
            />
          </div>
          <Callout variant="info" title="Netflix chọn gì cuối cùng?">
            Kết quả: Netflix triển khai phiên bản gọn với SVD + RBM, đạt ~99% lợi ích so với
            ensemble đầy đủ nhưng rẻ gấp 20 lần để chạy. Đây là một case study kinh điển cho câu
            chuyện &ldquo;đủ tốt thắng tuyệt đối&rdquo; trong sản xuất ML.
          </Callout>
        </div>
      </ApplicationTryIt>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="bias-variance-in-netflix-prize"
      >
        <Metric
          value="RMSE ban đầu (Cinematch): 0,9525 → RMSE thắng cuộc: 0,8554 — cải thiện 10,06%"
          sourceRef={1}
        />
        <Metric
          value="Giải pháp Grand Prize kết hợp hơn 800 mô hình khác nhau"
          sourceRef={1}
        />
        <Metric
          value="Đội thắng nộp bài sớm hơn đội nhì chỉ 22 phút — cả hai đạt cùng RMSE"
          sourceRef={2}
        />
        <Metric
          value="Netflix chỉ triển khai SVD + RBM: 2 thuật toán đủ cho 99% lợi ích"
          sourceRef={3}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Bias và Variance"
        topicSlug="bias-variance-in-netflix-prize"
      >
        <p>
          Không hiểu đánh đổi bias–variance, các đội thi sẽ mắc kẹt ở hai đầu: hoặc dùng một mô hình
          đơn giản và chấp nhận RMSE 0,95 (bias cao), hoặc xây mô hình cực phức tạp rồi thất vọng
          khi nó hoạt động kém trên dữ liệu mới (variance cao). Không ai vượt qua được ngưỡng 10%.
        </p>
        <p>
          Hiểu đánh đổi bias–variance mở ra lối thoát: kết hợp nhiều mô hình khác nhau (ensemble) để
          giảm variance mà không tăng bias. Nhưng bài học Netflix cũng cho thấy mặt trái: ensemble
          quá lớn có thể &ldquo;thắng cuộc thi nhưng thua sản xuất&rdquo; — một lời nhắc rằng lý
          thuyết luôn cần đối chiếu với ràng buộc vận hành. Đây là lý do các công ty công nghệ lớn
          luôn dành một khe thời gian cho câu hỏi: <em>tối ưu thêm 1% RMSE có xứng với chi phí chạy
          thêm 100 GPU?</em>
        </p>
      </ApplicationCounterfactual>

      {/* Bottom summary */}
      <section className="mb-10">
        <MiniSummary
          title="4 bài học từ Netflix Prize"
          points={[
            "Ensemble giảm variance mạnh: lỗi của nhiều mô hình lệch theo hướng khác nhau sẽ triệt tiêu khi lấy trung bình.",
            "Ensemble không giảm được bias: nếu toàn bộ mô hình đều đơn giản, trung bình vẫn đơn giản.",
            "Lợi ích giảm dần: từ 10 mô hình lên 800, RMSE chỉ cải thiện vài phần trăm — không phải tuyến tính.",
            "Thắng benchmark khác thắng sản xuất: RMSE tốt nhất chưa chắc là mô hình hợp lý để triển khai 24/7.",
          ]}
        />
        <div className="mt-4 flex items-center justify-center text-xs text-muted gap-2">
          <CircleDot size={12} />
          <Film size={12} />
          <span>Một cuộc thi 3 năm, 40 000 đội — kết thúc bằng cú bấm nút cách nhau 22 phút.</span>
        </div>
      </section>
    </ApplicationLayout>
  );
}
