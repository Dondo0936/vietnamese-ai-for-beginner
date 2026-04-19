"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Car,
  Gauge,
  Clock,
  Satellite,
  TrendingDown,
  Layers,
  Wifi,
  WifiOff,
  AlertTriangle,
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
  StepReveal,
  InlineChallenge,
  Callout,
  MiniSummary,
  TopicLink,
  CodeBlock,
} from "@/components/interactive";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";

export const metadata: TopicMeta = {
  slug: "data-preprocessing-in-uber-eta",
  title: "Data Preprocessing in Uber ETA",
  titleVi: "Tiền xử lý trong ETA của Uber",
  description:
    "Uber nhận về hàng tỷ điểm GPS mỗi ngày — bẩn, lệch, mất tín hiệu, múi giờ khác nhau. Đi qua từng bước dọn dẹp để thấy một vệt GPS biến từ chấm loạn thành đường đi thật.",
  category: "foundations",
  tags: ["preprocessing", "eta-prediction", "application"],
  difficulty: "intermediate",
  relatedSlugs: ["data-preprocessing"],
  vizType: "interactive",
  applicationOf: "data-preprocessing",
  featuredApp: {
    name: "Uber",
    productFeature: "DeepETA",
    company: "Uber Technologies",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "DeepETA: How Uber Predicts Arrival Times Using Deep Learning",
      publisher: "Uber Engineering Blog",
      url: "https://www.uber.com/us/en/blog/deepeta-how-uber-predicts-arrival-times/",
      date: "2022-01",
      kind: "engineering-blog",
    },
    {
      title: "DeeprETA: An ETA Post-processing System at Scale",
      publisher: "arXiv (Uber AI)",
      url: "https://arxiv.org/pdf/2206.02127",
      date: "2022-06",
      kind: "paper",
    },
    {
      title: "Rethinking GPS: Engineering Next-Gen Location at Uber",
      publisher: "Uber Engineering Blog",
      url: "https://www.uber.com/us/en/blog/rethinking-gps/",
      date: "2023-08",
      kind: "engineering-blog",
    },
    {
      title: "Enhancing the Quality of Uber's Maps with Metrics Computation",
      publisher: "Uber Engineering Blog",
      url: "https://www.uber.com/us/en/blog/maps-metrics-computation/",
      date: "2022-04",
      kind: "engineering-blog",
    },
  ],
  tocSections: [
    { id: "hero", labelVi: "Công ty nào?" },
    { id: "problem", labelVi: "Vấn đề" },
    { id: "mechanism", labelVi: "Cách giải quyết" },
    { id: "tryIt", labelVi: "Thử tự tay" },
    { id: "metrics", labelVi: "Con số thật" },
    { id: "counterfactual", labelVi: "Nếu không có" },
  ],
};

/* ────────────────────────────────────────────────────────────
   Dữ liệu mô phỏng — một chuyến đi ngắn trong nội thành.
   Mỗi "bước dọn dẹp" sẽ chiếu một lớp khác lên cùng một tập điểm.
   ──────────────────────────────────────────────────────────── */

type GpsPoint = {
  t: number;        // timestamp tương đối (giây)
  lat: number;      // toạ độ x trên SVG (đơn vị tự chọn)
  lon: number;      // toạ độ y trên SVG
  dup?: boolean;    // điểm trùng (ping 2 lần)
  gap?: boolean;    // mất tín hiệu trước điểm này
  tz?: "UTC" | "local"; // minh hoạ cho bước đổi múi giờ
};

/* Đường đi "thật" — sạch, là mục tiêu cuối */
const CLEAN_PATH: GpsPoint[] = [
  { t: 0, lat: 60, lon: 260 },
  { t: 15, lat: 90, lon: 240 },
  { t: 30, lat: 125, lon: 218 },
  { t: 45, lat: 160, lon: 200 },
  { t: 60, lat: 195, lon: 180 },
  { t: 75, lat: 228, lon: 160 },
  { t: 90, lat: 262, lon: 142 },
  { t: 105, lat: 295, lon: 122 },
  { t: 120, lat: 328, lon: 102 },
  { t: 135, lat: 362, lon: 82 },
  { t: 150, lat: 395, lon: 68 },
];

/* Dữ liệu GPS thô — đã thêm nhiễu, trùng, gap, timezone sai */
const RAW_POINTS: GpsPoint[] = [
  { t: 0, lat: 60, lon: 260, tz: "local" },
  { t: 3, lat: 75, lon: 278, tz: "local" },             // nhiễu urban canyon
  { t: 15, lat: 90, lon: 240, tz: "UTC" },               // múi giờ khác
  { t: 15, lat: 90, lon: 240, dup: true, tz: "UTC" },    // duplicate
  { t: 30, lat: 122, lon: 205, tz: "UTC" },
  { t: 45, lat: 154, lon: 210, tz: "UTC" },              // lệch
  { t: 60, lat: 190, lon: 188, tz: "UTC" },
  { t: 75, lat: 215, lon: 188, tz: "local" },            // lệch
  { t: 105, lat: 295, lon: 122, gap: true, tz: "local" },// mất 30 s
  { t: 120, lat: 330, lon: 95, tz: "local" },            // nhiễu
  { t: 135, lat: 360, lon: 84, tz: "local" },
  { t: 150, lat: 395, lon: 68, tz: "local" },
  { t: 150, lat: 480, lon: 20, tz: "local" },            // outlier cực đoan
];

/* ────────────────────────────────────────────────────────────
   Quiz — ≥ 3 câu tiếng Việt, giải thích chi tiết
   ──────────────────────────────────────────────────────────── */

const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Tín hiệu GPS ở trung tâm thành phố hay bị lệch 20–50 m vì sao?",
    options: [
      "Điện thoại hết pin",
      "Hiệu ứng urban canyon — tín hiệu bật qua lại giữa các toà nhà cao tầng trước khi đến máy thu",
      "GPS chỉ hoạt động ngoài trời ở vùng nông thôn",
      "Vì Uber cố tình thêm nhiễu để bảo mật",
    ],
    correct: 1,
    explanation:
      "Urban canyon: tín hiệu từ vệ tinh bật qua các toà nhà trước khi đến điện thoại, thời gian di chuyển bị sai → vị trí tính ra lệch 20–50 m. Uber dùng map-matching (HMM) để 'kéo' điểm GPS về đoạn đường gần nhất. Hết pin làm mất tín hiệu, không phải lệch.",
  },
  {
    question:
      "Trong hầm đỗ xe, GPS không có tín hiệu. Uber xử lý thế nào?",
    options: [
      "Huỷ chuyến",
      "Chờ lái xe ra khỏi hầm",
      "Dùng sensor fusion — kết hợp gia tốc kế, con quay hồi chuyển, và áp kế trên điện thoại để ước lượng vị trí",
      "Đoán bừa bằng toạ độ trung tâm thành phố",
    ],
    correct: 2,
    explanation:
      "Khi GPS mất, điện thoại vẫn có các cảm biến khác. Gia tốc kế đo chuyển động, con quay hồi chuyển đo quay, áp kế đo độ cao — kết hợp lại cho ước lượng khá tốt vị trí dù không có tín hiệu vệ tinh. Đây là kỹ thuật 'điền missing' ở quy mô production, thay vì đơn thuần điền mean.",
  },
  {
    question:
      "Uber chia giá trị liên tục (khoảng cách, giờ trong ngày) thành nhóm (bucket) trước khi đưa vào DeepETA. Lý do chính?",
    options: [
      "Để tiết kiệm bộ nhớ",
      "Để model học pattern tốt hơn và giảm ảnh hưởng của ngoại lai — giờ 17:00 và 17:05 coi như một nhóm 'giờ cao điểm'",
      "Vì model không đọc được số thực",
      "Vì Python không hỗ trợ số thực trên GPU",
    ],
    correct: 1,
    explanation:
      "Bucketing (rời rạc hoá) là một dạng feature engineering: giá trị gần nhau được gộp thành một nhóm, giảm nhiễu và ảnh hưởng của ngoại lai. DeepETA thực nghiệm cho thấy bucketing đặc trưng liên tục cho accuracy tốt hơn dùng raw — đặc biệt với dữ liệu giao thông có nhiều biến động cục bộ.",
  },
  {
    question:
      "Nếu bỏ qua toàn bộ bước tiền xử lý GPS, ETA của Uber sẽ như thế nào?",
    options: [
      "Chính xác hơn — model tự biết lọc",
      "Không đổi — preprocessing chỉ làm đẹp",
      "Sai lệch hàng chục phút vì nhiễu urban canyon, điểm trùng, mất tín hiệu làm model 'nghĩ' lái xe đứng yên / nhảy teleport",
      "Pin điện thoại nhanh hết hơn",
    ],
    correct: 2,
    explanation:
      "Đây là nền tảng của mọi hệ thống ML sản xuất: model chỉ tốt bằng dữ liệu vào. Nhiễu GPS 50 m lặp lại mỗi giây → hàng triệu điểm sai → ETA có thể lệch 20–30 phút. Ngược lại, pipeline sạch đưa sai số vị trí xuống dưới 5 m và dung hoà cả gap, giúp ETA sai lệch chỉ vài chục giây.",
  },
  {
    question:
      "DeepETA chạy feature real-time trong mili-giây qua Kafka. Đâu KHÔNG phải đặc trưng thời gian thực điển hình?",
    options: [
      "Tốc độ trung bình của từng đoạn đường hiện tại",
      "Năm sinh của lái xe",
      "Thời gian đã đi qua segment trước",
      "Loại chuyến đi (giao hàng / đi chung / chuyến riêng)",
    ],
    correct: 1,
    explanation:
      "Real-time feature là các đại lượng thay đổi theo thời gian của chuyến đi: tốc độ trung bình segment, thời gian đã đi qua segment, loại chuyến. Năm sinh lái xe là thông tin tĩnh, không liên quan đến ETA — không nằm trong pipeline feature real-time.",
  },
];

/* ────────────────────────────────────────────────────────────
   COMPONENT CHÍNH
   ──────────────────────────────────────────────────────────── */

type CleanStep = "raw" | "dedupe" | "interp" | "tz" | "snap";

const STEP_ORDER: CleanStep[] = ["raw", "dedupe", "interp", "tz", "snap"];

const STEP_META: Record<
  CleanStep,
  { label: string; subtitle: string; color: string; icon: typeof MapPin }
> = {
  raw: {
    label: "Raw",
    subtitle: "GPS thô — 13 điểm, loạn và lệch",
    color: "#ef4444",
    icon: Satellite,
  },
  dedupe: {
    label: "Dedupe",
    subtitle: "Bỏ điểm trùng cùng timestamp",
    color: "#f59e0b",
    icon: Layers,
  },
  interp: {
    label: "Interpolate",
    subtitle: "Lấp chỗ mất tín hiệu bằng nội suy",
    color: "#3b82f6",
    icon: WifiOff,
  },
  tz: {
    label: "Convert TZ",
    subtitle: "Đưa mọi timestamp về 1 múi giờ",
    color: "#8b5cf6",
    icon: Clock,
  },
  snap: {
    label: "Map-match",
    subtitle: "Kéo mỗi điểm về đoạn đường gần nhất",
    color: "#10b981",
    icon: MapPin,
  },
};

export default function DataPreprocessingInUberEta() {
  const [step, setStep] = useState<CleanStep>("raw");
  const [featureChoice, setFeatureChoice] = useState<"hour" | "dow" | "dist">(
    "hour",
  );

  const pointsToShow = useMemo(() => {
    const idx = STEP_ORDER.indexOf(step);
    let points = [...RAW_POINTS];

    if (idx >= 1) {
      points = points.filter((p, i, arr) => {
        if (!p.dup) return true;
        return (
          arr.findIndex((q) => q.t === p.t && q.lat === p.lat && !q.dup) === -1
        );
      });
    }

    if (idx >= 2) {
      const filled: GpsPoint[] = [];
      for (let i = 0; i < points.length; i++) {
        filled.push(points[i]);
        const next = points[i + 1];
        if (next && next.t - points[i].t > 20) {
          filled.push({
            t: (points[i].t + next.t) / 2,
            lat: (points[i].lat + next.lat) / 2,
            lon: (points[i].lon + next.lon) / 2,
            tz: next.tz,
          });
        }
      }
      points = filled;
    }

    if (idx >= 3) {
      points = points.map((p) => ({ ...p, tz: "local" as const }));
    }

    if (idx >= 4) {
      points = points.map((p) => {
        const closest = CLEAN_PATH.reduce((best, c) => {
          const dBest =
            (best.lat - p.lat) ** 2 + (best.lon - p.lon) ** 2;
          const dNow = (c.lat - p.lat) ** 2 + (c.lon - p.lon) ** 2;
          return dNow < dBest ? c : best;
        }, CLEAN_PATH[0]);
        return {
          ...p,
          lat: closest.lat,
          lon: closest.lon,
        };
      });
      points = points.filter(
        (p, i, arr) =>
          i === 0 ||
          p.lat !== arr[i - 1].lat ||
          p.lon !== arr[i - 1].lon,
      );
    }

    return points;
  }, [step]);

  /* Thống kê để hiển thị ở banner bên dưới */
  const pointCount = pointsToShow.length;
  const dupCount = pointsToShow.filter((p) => p.dup).length;
  const tzMixed =
    new Set(pointsToShow.map((p) => p.tz ?? "local")).size > 1;

  /* ETA giả lập — sai số giảm dần theo số bước */
  const etaError = useMemo(() => {
    const order = STEP_ORDER.indexOf(step);
    const errs = [23, 17, 11, 7, 2];
    return errs[order] ?? errs[0];
  }, [step]);

  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Tiền xử lý dữ liệu"
    >
      {/* ━━━ HERO ━━━ */}
      <ApplicationHero
        parentTitleVi="Tiền xử lý dữ liệu"
        topicSlug="data-preprocessing-in-uber-eta"
      >
        <div className="not-prose mb-5 flex flex-wrap gap-2">
          <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1">
            <Car size={14} className="text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              Uber — DeepETA
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-sky-500/10 border border-sky-500/30 px-3 py-1">
            <Satellite size={14} className="text-sky-600" />
            <span className="text-xs font-semibold text-sky-700 dark:text-sky-300">
              Hàng tỷ điểm GPS / ngày
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1">
            <Clock size={14} className="text-amber-600" />
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
              Độ trễ xử lý &lt; 100 ms
            </span>
          </div>
        </div>

        <p>
          Bạn mở ứng dụng Uber, màn hình hiện &ldquo;Tài xế đến trong 4
          phút.&rdquo; Con số đó không phải đoán mò — nó đến từ DeepETA, hệ
          thống học sâu của Uber, phục vụ hàng triệu chuyến đi mỗi ngày ở hơn
          10.000 thành phố.
        </p>
        <p>
          Trước khi bất kỳ mô hình nào chạy, Uber phải giải bài toán &ldquo;rửa
          rau&rdquo;: dữ liệu GPS từ hàng triệu điện thoại bị nhiễu, toạ độ
          nhảy giữa các toà nhà cao tầng, mất tín hiệu trong hầm, và múi giờ
          lộn xộn giữa các chuyến. Không có bước tiền xử lý, ETA có thể sai
          hàng chục phút.
        </p>
      </ApplicationHero>

      {/* ━━━ PROBLEM ━━━ */}
      <ApplicationProblem topicSlug="data-preprocessing-in-uber-eta">
        <p>
          Mỗi chiếc điện thoại trong chuyến đi liên tục gửi toạ độ về Uber.
          Nhưng tín hiệu thô cực kỳ bẩn:
        </p>
        <div className="not-prose my-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <ProblemCard
            icon={Satellite}
            title="Urban canyon"
            color="#ef4444"
            body="Tín hiệu từ vệ tinh bật qua các toà nhà trước khi đến điện thoại → vị trí lệch 20–50 m giữa phố cổ hoặc khu đô thị mới."
          />
          <ProblemCard
            icon={WifiOff}
            title="Mất tín hiệu"
            color="#f59e0b"
            body="Hầm đỗ xe, garage ngầm, đường hầm → GPS mất hàng chục giây. Chuỗi toạ độ xuất hiện 'lỗ đen' mà model không biết cách xử lý."
          />
          <ProblemCard
            icon={Layers}
            title="Điểm trùng lặp"
            color="#3b82f6"
            body="Điện thoại gửi cùng toạ độ 2–3 lần do lỗi mạng / retry. Nếu đếm cả điểm trùng, model nghĩ xe đang đứng yên."
          />
          <ProblemCard
            icon={Clock}
            title="Múi giờ lộn xộn"
            color="#8b5cf6"
            body="Có thiết bị gửi UTC, có thiết bị gửi giờ thành phố. Trừ nhầm múi giờ → sai giờ đón 7 tiếng."
          />
        </div>
        <p>
          Giao thông thì biến động liên tục: một tai nạn có thể biến đoạn 5
          phút thành 30 phút. &ldquo;Garbage in, garbage out&rdquo; — nếu
          không làm sạch, DeepETA không thể dự đoán sát thực tế.
        </p>
      </ApplicationProblem>

      {/* ━━━ MECHANISM ━━━ */}
      <ApplicationMechanism
        parentTitleVi="Tiền xử lý dữ liệu"
        topicSlug="data-preprocessing-in-uber-eta"
      >
        <Beat step={1}>
          <p>
            <strong>Khử nhiễu GPS bằng map-matching.</strong> GPS thô báo bạn
            đang đứng giữa toà nhà, nhưng thực ra bạn đang đi trên đường. Uber
            dùng Hidden Markov Model (HMM — mô hình Markov ẩn) để &ldquo;kéo&rdquo;
            mỗi điểm về đoạn đường gần nhất trong bản đồ. Hệ thống có hai
            tầng: online matcher cho hiển thị thời gian thực, và offline
            reprocess chạy lại chính xác hơn để huấn luyện model. Bước này
            giảm sai số vị trí từ 50–100 m xuống dưới 5 m.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>Xử lý missing bằng sensor fusion.</strong> Khi GPS mất
            tín hiệu (hầm, garage), Uber không &ldquo;bỏ qua&rdquo; như một
            imputer thông thường. Thay vào đó, hệ thống kết hợp gia tốc kế,
            con quay hồi chuyển, và áp kế trên điện thoại để ước lượng vị trí
            — giống như đi với la bàn khi bạn bịt mắt. Đây là cách &ldquo;điền
            missing&rdquo; ở quy mô công nghiệp.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>Feature discretization (rời rạc hoá đặc trưng).</strong>{" "}
            DeepETA không dùng giá trị liên tục trực tiếp. Khoảng cách, giờ
            trong ngày, ngày trong tuần đều được gộp thành bucket (nhóm).
            Toạ độ (lat, lon) được mã hoá vào lưới đa phân giải — trung tâm
            Manhattan cần ô lưới nhỏ, vùng ngoại ô dùng ô to. Thực nghiệm của
            Uber cho thấy bucketing giúp model học pattern tốt hơn raw value.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>Feature real-time qua Kafka.</strong> Mỗi yêu cầu ETA cần
            đặc trưng cập nhật trong mili-giây: tốc độ trung bình từng đoạn
            đường (tính từ stream GPS của mọi tài xế), thời gian đã đi qua
            segment, và đặc trưng hiệu chỉnh phân biệt loại chuyến (giao
            hàng, đi chung, chuyến riêng). Pipeline này chạy trên Kafka với
            độ trễ dưới 100 ms.
          </p>
        </Beat>
      </ApplicationMechanism>

      {/* ━━━ TRY IT — sandbox GPS + feature engineering ━━━ */}
      <ApplicationTryIt topicSlug="data-preprocessing-in-uber-eta">
        <div className="space-y-6">
          {/* ── Sandbox 1: làm sạch vệt GPS ── */}
          <div>
            <h3 className="text-base font-semibold text-foreground mb-2">
              Sandbox 1 — Chạy lại từng bước làm sạch một vệt GPS
            </h3>
            <p className="text-sm text-muted mb-3 leading-relaxed">
              Bấm qua các tab dưới đây. Mỗi lần bấm, bạn sẽ thấy vệt GPS từ
              &ldquo;loạn xạ&rdquo; dần dần gọn lại thành một đường đi có
              thật. Quan sát số điểm, số duplicate, và sai số ETA thay đổi
              như thế nào.
            </p>

            {/* Thanh chọn bước */}
            <div className="flex flex-wrap gap-2 mb-3">
              {STEP_ORDER.map((s) => {
                const meta = STEP_META[s];
                const Icon = meta.icon;
                const active = s === step;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStep(s)}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors border"
                    style={{
                      borderColor: active ? meta.color : "var(--border)",
                      backgroundColor: active
                        ? meta.color + "22"
                        : "var(--bg-card)",
                      color: active ? meta.color : "var(--text-muted)",
                    }}
                  >
                    <Icon size={13} />
                    {meta.label}
                  </button>
                );
              })}
            </div>

            {/* Canvas chính */}
            <div
              className="rounded-xl border-2 bg-card p-4"
              style={{ borderColor: STEP_META[step].color + "66" }}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-[11px] font-semibold text-tertiary uppercase tracking-wide">
                    Bản đồ nội thành (giản lược)
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {STEP_META[step].subtitle}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-tertiary">Sai số ETA mô phỏng</p>
                  <motion.p
                    key={etaError}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-xl font-bold tabular-nums"
                    style={{ color: STEP_META[step].color }}
                  >
                    ± {etaError} phút
                  </motion.p>
                </div>
              </div>

              <GpsMap
                raw={step === "raw" ? RAW_POINTS : null}
                current={pointsToShow}
                showClean={step === "snap"}
                color={STEP_META[step].color}
              />

              {/* Banner trạng thái */}
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                <StatPill
                  icon={MapPin}
                  label="Số điểm"
                  value={String(pointCount)}
                  color="#64748b"
                />
                <StatPill
                  icon={Layers}
                  label="Duplicate"
                  value={String(dupCount)}
                  color={dupCount > 0 ? "#f59e0b" : "#10b981"}
                />
                <StatPill
                  icon={tzMixed ? Wifi : Clock}
                  label="Múi giờ"
                  value={tzMixed ? "Lộn xộn" : "Đồng nhất"}
                  color={tzMixed ? "#ef4444" : "#10b981"}
                />
                <StatPill
                  icon={TrendingDown}
                  label="Sai số"
                  value={`${etaError} phút`}
                  color={STEP_META[step].color}
                />
              </div>
            </div>

            <Callout variant="insight" title="Điều cần quan sát">
              Ở bước <code>raw</code>, sai số ETA lên tới ±23 phút — lý do mà
              app giao hàng những năm 2010 liên tục &ldquo;đánh lừa&rdquo;
              khách. Khi toàn bộ pipeline chạy xong, sai số rớt còn ±2 phút,
              gần sát khoảng Uber công bố trên blog DeepETA.
            </Callout>
          </div>

          {/* ── Sandbox 2: Feature engineering cho chuyến đi ── */}
          <div>
            <h3 className="text-base font-semibold text-foreground mb-2">
              Sandbox 2 — Feature engineering trên từng chuyến đi
            </h3>
            <p className="text-sm text-muted mb-3 leading-relaxed">
              Chọn một đặc trưng, xem Uber rời rạc hoá giá trị liên tục thành
              nhóm thế nào. Mỗi cột là một &ldquo;bucket&rdquo; — số chuyến đi
              được đếm vào ô tương ứng.
            </p>

            <div className="flex flex-wrap gap-2 mb-3">
              {(
                [
                  { key: "hour", label: "Giờ trong ngày", icon: Clock },
                  { key: "dow", label: "Ngày trong tuần", icon: Layers },
                  { key: "dist", label: "Khoảng cách", icon: MapPin },
                ] as const
              ).map((f) => {
                const Icon = f.icon;
                const active = f.key === featureChoice;
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFeatureChoice(f.key)}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      active
                        ? "border-accent bg-accent-light text-accent-dark"
                        : "border-border bg-card text-muted hover:text-foreground"
                    }`}
                  >
                    <Icon size={13} />
                    {f.label}
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <FeatureBuckets choice={featureChoice} />
            </div>

            <Callout variant="tip" title="Vì sao phải rời rạc hoá?">
              Giờ 17:02 và 17:05 chẳng khác gì nhau về mặt giao thông — cả hai
              đều là &ldquo;giờ cao điểm&rdquo;. Gộp thành bucket giúp model
              ổn định hơn trước nhiễu nhỏ và đếm đủ dữ liệu mỗi nhóm để học
              pattern. Ngược lại, tọa độ trung tâm Manhattan cần bucket nhỏ
              vì mật độ chuyến đi rất cao — Uber dùng lưới đa phân giải.
            </Callout>
          </div>

          {/* ── Sandbox 3: Step reveal pipeline vận hành ── */}
          <div>
            <h3 className="text-base font-semibold text-foreground mb-2">
              Sandbox 3 — Pipeline từ GPS tới ETA, theo thứ tự
            </h3>
            <p className="text-sm text-muted mb-3 leading-relaxed">
              Bấm &ldquo;Tiếp tục&rdquo; để mở từng giai đoạn. Đây là bộ
              khung mà mọi ứng dụng vị trí thời gian thực (Grab, Gojek, Lyft,
              ShopeeFood) đều có, dù chi tiết khác nhau.
            </p>

            <StepReveal
              labels={[
                "1. Ingest GPS",
                "2. Dedupe + TZ",
                "3. Sensor fusion",
                "4. Map-match",
                "5. Feature bucket",
                "6. ETA inference",
              ]}
            >
              {[
                <PipelineStage
                  key="1"
                  color="#64748b"
                  title="Thu dữ liệu GPS và context"
                  body="Mỗi chuyến đi bắn hàng chục nghìn điểm GPS, kèm tốc độ, hướng, ID chuyến, loại chuyến (giao hàng / đi chung / chuyến riêng). Stream đi vào Kafka với độ trễ ms."
                />,
                <PipelineStage
                  key="2"
                  color="#f59e0b"
                  title="Bỏ duplicate, chuẩn hoá múi giờ"
                  body="Hai điểm cùng timestamp và toạ độ → giữ một. Mọi timestamp chuyển sang UTC rồi sang giờ thành phố để phân tích giờ cao điểm."
                />,
                <PipelineStage
                  key="3"
                  color="#3b82f6"
                  title="Sensor fusion cho đoạn mất tín hiệu"
                  body="Khi GPS mất (hầm, garage), kết hợp gia tốc kế + con quay + áp kế trên thiết bị để nội suy vị trí. Sai số thấp hơn nhiều so với 'đoán bằng điểm cuối'."
                />,
                <PipelineStage
                  key="4"
                  color="#8b5cf6"
                  title="Map-matching bằng HMM"
                  body="Mỗi điểm GPS được 'kéo' về đoạn đường gần nhất trong bản đồ. Hidden Markov Model chọn chuỗi đoạn đường hợp lý nhất với dữ liệu quan sát."
                />,
                <PipelineStage
                  key="5"
                  color="#10b981"
                  title="Rời rạc hoá feature"
                  body="Khoảng cách → bucket. Giờ → bucket 30 phút. Toạ độ → lưới đa phân giải. Đây là bước cuối trước khi đưa dữ liệu vào model."
                />,
                <PipelineStage
                  key="6"
                  color="#ec4899"
                  title="Inference DeepETA + post-processing"
                  body="Model dự đoán thời gian đi qua từng segment. Post-processor (DeeprETA) hiệu chỉnh với ngữ cảnh chuyến đi rồi trả về con số hiển thị cho người dùng."
                />,
              ]}
            </StepReveal>
          </div>

          {/* ── Code snippet 1: dedupe + timezone ── */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">
              Đoạn pandas ngắn mô phỏng bước 2 của pipeline
            </h4>
            <CodeBlock language="python" title="dedupe + chuẩn hoá múi giờ">
{`import pandas as pd

gps = pd.read_parquet("trip_gps.parquet")
gps = gps.drop_duplicates(subset=["trip_id", "ts", "lat", "lon"])
gps["ts"] = pd.to_datetime(gps["ts"], utc=True)
gps["ts_local"] = gps["ts"].dt.tz_convert("Asia/Ho_Chi_Minh")`}
            </CodeBlock>
          </div>

          {/* ── Code snippet 2: feature bucket ── */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">
              Đoạn pandas cho bước rời rạc hoá đặc trưng
            </h4>
            <CodeBlock language="python" title="bucket giờ + khoảng cách">
{`gps["hour_bucket"]  = (gps["ts_local"].dt.hour // 2).astype("int8")
gps["dow_bucket"]   = gps["ts_local"].dt.dayofweek.astype("int8")
gps["dist_bucket"]  = pd.cut(
    gps["distance_km"], bins=[0, 1, 3, 7, 15, 50], labels=[0, 1, 2, 3, 4]
).astype("int8")`}
            </CodeBlock>
          </div>

          {/* ── Challenges ── */}
          <div>
            <h3 className="text-base font-semibold text-foreground mb-2">
              Thử thách nhanh
            </h3>
            <InlineChallenge
              question="Tài xế của bạn chạy vào một hầm đỗ xe 500 m. GPS mất tín hiệu suốt 45 giây. Hệ thống Uber sẽ làm gì?"
              options={[
                "Hiển thị chuyến đi bị ngắt cho khách",
                "Tự động huỷ chuyến",
                "Kết hợp gia tốc kế + con quay hồi chuyển trên điện thoại để nội suy vị trí, rồi khi GPS có lại thì chốt điểm bằng map-matching",
                "Chờ 45 giây không làm gì",
              ]}
              correct={2}
              explanation="Đây là kỹ thuật sensor fusion — một dạng 'điền missing' ở quy mô production. Điện thoại có rất nhiều cảm biến, chỉ riêng GPS không đủ. Khi tín hiệu vệ tinh có lại, map-matching chuẩn hoá toàn bộ chuỗi điểm vừa nội suy để tránh drift tích luỹ."
            />

            <div className="mt-4">
              <InlineChallenge
                question="DeepETA biến cột 'giờ đặt chuyến' thành 48 bucket (mỗi bucket 30 phút). Lợi ích quan trọng nhất?"
                options={[
                  "Giảm kích thước model",
                  "Model học được pattern giờ cao điểm ổn định hơn so với giá trị float — và bớt nhạy với nhiễu nhỏ (17:02 vs 17:05 là cùng một bucket)",
                  "Tránh phải dùng GPU",
                  "Bỏ qua bước quan trọng khác",
                ]}
                correct={1}
                explanation="Bucketing là một dạng regularisation nhẹ: cùng nhóm giá trị gần nhau về ý nghĩa, giảm variance và ảnh hưởng ngoại lai. DeepETA thực nghiệm cho thấy bucketing giờ / khoảng cách cho accuracy tốt hơn raw — đặc biệt khi dữ liệu có nhiều nhiễu do GPS."
              />
            </div>

            <div className="mt-4">
              <InlineChallenge
                question="Vì sao Uber phải giữ 2 tầng: online matcher và offline reprocess cho map-matching?"
                options={[
                  "Để tốn gấp đôi tiền server",
                  "Online matcher chạy nhanh (ms) cho hiển thị real-time; offline reprocess chạy kỹ hơn (phút) với nhiều context để sinh dữ liệu huấn luyện sạch — hai vai trò khác nhau",
                  "Vì chỉ có một thuật toán HMM",
                  "Vì Uber dùng nhiều nhà cung cấp GPS",
                ]}
                correct={1}
                explanation="Đây là kiến trúc phổ biến trong ML production: fast path (ưu tiên độ trễ, chấp nhận sai số lớn hơn) và slow path (ưu tiên độ chính xác, không bị giới hạn latency). Online matcher phục vụ người dùng ngay, offline reprocess tạo training data để model học."
              />
            </div>
          </div>

          {/* ── Mini summary ── */}
          <MiniSummary
            title="Bốn điều Uber dạy cho pipeline tiền xử lý của bạn"
            points={[
              "GPS thô bẩn hơn bạn tưởng — map-matching giảm sai số vị trí từ 50–100 m xuống dưới 5 m.",
              "Missing values không chỉ điền bằng mean — sensor fusion là 'điền missing' ở quy mô production.",
              "Rời rạc hoá đặc trưng (bucketing) không phải thủ thuật — DeepETA đo được accuracy tốt hơn raw.",
              "Feature real-time qua Kafka: bước tiền xử lý không dừng khi train xong, mà chạy liên tục khi serve.",
            ]}
          />

          {/* Quiz */}
          <div>
            <h3 className="text-base font-semibold text-foreground mb-2">
              Kiểm tra hiểu biết
            </h3>
            <QuizSection questions={quizQuestions} />
          </div>
        </div>
      </ApplicationTryIt>

      {/* ━━━ METRICS ━━━ */}
      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="data-preprocessing-in-uber-eta"
      >
        <Metric
          value="DeepETA giảm sai số trung bình so với routing engine truyền thống, triển khai trên hơn 10.000 thành phố"
          sourceRef={1}
        />
        <Metric
          value="Xử lý hàng tỷ điểm GPS mỗi ngày, sau khử nhiễu sai số giảm từ 50–100 m xuống dưới 5 m"
          sourceRef={3}
        />
        <Metric
          value="Feature discretization (bucketing) cho accuracy tốt hơn dùng giá trị liên tục trực tiếp"
          sourceRef={1}
        />
        <Metric
          value="Pipeline real-time feature computation xử lý với độ trễ dưới 100 ms qua Kafka"
          sourceRef={2}
        />
      </ApplicationMetrics>

      {/* ━━━ COUNTERFACTUAL ━━━ */}
      <ApplicationCounterfactual
        parentTitleVi="Tiền xử lý dữ liệu"
        topicSlug="data-preprocessing-in-uber-eta"
      >
        <p>
          Bỏ qua bước tiền xử lý, GPS nhiễu sẽ khiến model nghĩ tài xế đang ở
          toà nhà bên cạnh thay vì trên đường — ETA có thể sai hàng chục phút.
          Ngoại lai (tốc độ 300 km/h do GPS nhảy) kéo lệch mọi thống kê trung
          bình. Dữ liệu thiếu trong hầm và garage tạo &ldquo;lỗ đen&rdquo;,
          khiến model không thể tính thời gian qua đoạn.
        </p>
        <p>
          Tiền xử lý biến dữ liệu thô đầy nhiễu thành đầu vào sạch: map
          matching sửa vị trí, sensor fusion lấp lỗ hổng, bucketing chuẩn hoá
          thang đo, và pipeline real-time đảm bảo đặc trưng luôn mới. Đây là
          lý do 80% công sức ML nằm ở xử lý dữ liệu — muốn luyện tập thêm kỹ
          năng pandas cốt lõi, ghé{" "}
          <TopicLink slug="data-preprocessing">Tiền xử lý dữ liệu</TopicLink>
          {" "}và{" "}
          <TopicLink slug="python-for-ml">Python cho ML</TopicLink>.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}

/* ────────────────────────────────────────────────────────────
   HELPER COMPONENTS
   ──────────────────────────────────────────────────────────── */

function ProblemCard({
  icon: Icon,
  title,
  body,
  color,
}: {
  icon: typeof MapPin;
  title: string;
  body: string;
  color: string;
}) {
  return (
    <div
      className="rounded-xl border bg-card p-4 space-y-2"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="flex items-center gap-2">
        <Icon size={16} style={{ color }} />
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      <p className="text-xs text-foreground/80 leading-relaxed">{body}</p>
    </div>
  );
}

function GpsMap({
  raw,
  current,
  showClean,
  color,
}: {
  raw: GpsPoint[] | null;
  current: GpsPoint[];
  showClean: boolean;
  color: string;
}) {
  const W = 460;
  const H = 300;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg bg-surface/40">
      {/* Đường phố giả lập (grid) */}
      {[60, 110, 160, 210, 260].map((y) => (
        <line
          key={`h-${y}`}
          x1={20}
          x2={W - 20}
          y1={y}
          y2={y}
          stroke="var(--border)"
          strokeWidth={0.5}
          strokeDasharray="3,4"
          opacity={0.35}
        />
      ))}
      {[80, 160, 240, 320, 400].map((x) => (
        <line
          key={`v-${x}`}
          x1={x}
          x2={x}
          y1={30}
          y2={H - 20}
          stroke="var(--border)"
          strokeWidth={0.5}
          strokeDasharray="3,4"
          opacity={0.35}
        />
      ))}

      {/* Đường đi sạch (ground truth) — luôn có, mờ mờ */}
      <polyline
        points={CLEAN_PATH.map((p) => `${p.lat},${p.lon}`).join(" ")}
        fill="none"
        stroke="#10b981"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={showClean ? 0.9 : 0.18}
        strokeDasharray={showClean ? undefined : "4,4"}
      />

      {/* Raw points mờ nền — chỉ ở bước raw */}
      {raw?.map((p, i) => (
        <circle
          key={`raw-${i}`}
          cx={p.lat}
          cy={p.lon}
          r={4}
          fill="#94a3b8"
          opacity={0.3}
        />
      ))}

      {/* Current cleaned points — chuyển mượt */}
      <AnimatePresence>
        {current.map((p, i) => (
          <motion.circle
            key={`cur-${i}-${p.lat}-${p.lon}`}
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{ opacity: p.dup ? 0.35 : 0.95, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, delay: i * 0.015 }}
            cx={p.lat}
            cy={p.lon}
            r={p.dup ? 6 : 4.5}
            fill={color}
            stroke="white"
            strokeWidth={1}
          />
        ))}
      </AnimatePresence>

      {/* Line qua các current points */}
      <motion.polyline
        points={current.map((p) => `${p.lat},${p.lon}`).join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={0.55}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6 }}
      />

      {/* Legend */}
      <g transform={`translate(20, ${H - 14})`}>
        <circle cx={0} cy={0} r={3} fill="#94a3b8" opacity={0.4} />
        <text x={8} y={3} fontSize={9} fill="var(--text-tertiary)">
          Điểm GPS thô
        </text>
        <circle cx={100} cy={0} r={3} fill={color} />
        <text x={108} y={3} fontSize={9} fill="var(--text-tertiary)">
          Sau {STEP_META.snap.label === (raw ? "?" : "?") ? "" : ""}bước hiện tại
        </text>
        <line
          x1={230}
          x2={245}
          y1={0}
          y2={0}
          stroke="#10b981"
          strokeWidth={2}
          strokeDasharray={showClean ? undefined : "4,4"}
        />
        <text x={250} y={3} fontSize={9} fill="var(--text-tertiary)">
          Đường đi thật trên bản đồ
        </text>
      </g>
    </svg>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface/60 px-3 py-2 flex items-center gap-2">
      <Icon size={12} style={{ color }} />
      <div className="flex flex-col">
        <span className="text-[9px] text-tertiary uppercase leading-none">
          {label}
        </span>
        <span
          className="text-xs font-semibold leading-tight"
          style={{ color }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

function FeatureBuckets({
  choice,
}: {
  choice: "hour" | "dow" | "dist";
}) {
  /* Dữ liệu minh hoạ — 1 ngày chuyến đi giả lập */
  const buckets: { label: string; count: number; highlight?: boolean }[] = (() => {
    if (choice === "hour") {
      return [
        { label: "0-2", count: 4 },
        { label: "2-4", count: 3 },
        { label: "4-6", count: 6 },
        { label: "6-8", count: 18, highlight: true },
        { label: "8-10", count: 14 },
        { label: "10-12", count: 11 },
        { label: "12-14", count: 13 },
        { label: "14-16", count: 10 },
        { label: "16-18", count: 22, highlight: true },
        { label: "18-20", count: 19 },
        { label: "20-22", count: 12 },
        { label: "22-24", count: 7 },
      ];
    }
    if (choice === "dow") {
      return [
        { label: "Hai", count: 16 },
        { label: "Ba", count: 15 },
        { label: "Tư", count: 17 },
        { label: "Năm", count: 18 },
        { label: "Sáu", count: 24, highlight: true },
        { label: "Bảy", count: 22, highlight: true },
        { label: "CN", count: 14 },
      ];
    }
    return [
      { label: "<1 km", count: 9 },
      { label: "1-3 km", count: 28, highlight: true },
      { label: "3-7 km", count: 21 },
      { label: "7-15 km", count: 12 },
      { label: "15-50 km", count: 4 },
    ];
  })();
  const maxCount = Math.max(...buckets.map((b) => b.count));

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2 h-48">
        {buckets.map((b) => {
          const h = (b.count / maxCount) * 100;
          return (
            <div
              key={b.label}
              className="flex-1 flex flex-col items-center justify-end"
            >
              <span className="text-[10px] text-muted tabular-nums mb-1">
                {b.count}
              </span>
              <motion.div
                layout
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{
                  type: "spring",
                  stiffness: 160,
                  damping: 18,
                }}
                style={{
                  backgroundColor: b.highlight ? "#3b82f6" : "#94a3b8",
                  opacity: b.highlight ? 1 : 0.55,
                }}
                className="w-full rounded-t-md"
              />
              <span className="text-[9px] text-tertiary mt-1 whitespace-nowrap">
                {b.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 text-[11px] text-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-blue-500" />
          Bucket giờ cao điểm / ngày cuối tuần / khoảng cách thường gặp
        </span>
        <span className="flex items-center gap-1">
          <AlertTriangle size={10} className="text-amber-500" />
          Model học &ldquo;giờ cao điểm&rdquo; chứ không phải &ldquo;17:02&rdquo;
        </span>
      </div>
    </div>
  );
}

function PipelineStage({
  color,
  title,
  body,
}: {
  color: string;
  title: string;
  body: string;
}) {
  return (
    <div
      className="rounded-xl border bg-card p-4 space-y-1"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div className="flex items-center gap-2">
        <Gauge size={14} style={{ color }} />
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      <p className="text-xs text-foreground/85 leading-relaxed pl-6">{body}</p>
    </div>
  );
}
