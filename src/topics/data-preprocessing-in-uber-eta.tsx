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
    "Uber nhận về hàng tỷ điểm GPS mỗi ngày. Tín hiệu bẩn, lệch, mất sóng, múi giờ lộn xộn. Đi qua từng bước dọn dẹp để thấy một vệt GPS biến từ chấm loạn thành đường đi thật.",
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
    { id: "problem", labelVi: "Vấn đề thật" },
    { id: "mechanism", labelVi: "Uber giải ra sao" },
    { id: "tryIt", labelVi: "Thử tự tay" },
    { id: "metrics", labelVi: "Con số thật" },
    { id: "counterfactual", labelVi: "Nếu bỏ bước này" },
  ],
};

/* ────────────────────────────────────────────────────────────
   Dữ liệu mô phỏng cho một chuyến đi ngắn trong nội thành.
   Mỗi "bước dọn dẹp" chiếu một lớp khác lên cùng một tập điểm.
   ──────────────────────────────────────────────────────────── */

type GpsPoint = {
  t: number;        // timestamp tương đối (giây)
  lat: number;      // toạ độ x trên SVG (đơn vị tự chọn)
  lon: number;      // toạ độ y trên SVG
  dup?: boolean;    // điểm trùng (ping 2 lần)
  gap?: boolean;    // mất tín hiệu trước điểm này
  tz?: "UTC" | "local"; // minh hoạ cho bước đổi múi giờ
  inferred?: boolean;   // điểm được nội suy để lấp gap
  rawLat?: number;      // toạ độ trước map-match
  rawLon?: number;
};

/* Đường đi "thật": sạch, là mục tiêu cuối */
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

/* Dữ liệu GPS thô: đã thêm nhiễu, trùng, gap, timezone sai */
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
  { t: 150, lat: 430, lon: 35, tz: "local" },            // outlier cực đoan
];

/* ────────────────────────────────────────────────────────────
   Quiz: ≥ 3 câu tiếng Việt, giải thích chi tiết
   ──────────────────────────────────────────────────────────── */

const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Vì sao tín hiệu GPS ở trung tâm thành phố hay bị lệch 20-50 m?",
    options: [
      "Điện thoại hết pin",
      "Hiệu ứng urban canyon: tín hiệu bật qua lại giữa các toà nhà cao tầng trước khi đến máy thu",
      "GPS chỉ hoạt động ngoài trời ở vùng nông thôn",
      "Vì Uber cố tình thêm nhiễu để bảo mật",
    ],
    correct: 1,
    explanation:
      "Urban canyon: tín hiệu vệ tinh bật qua các toà nhà cao tầng trước khi đến điện thoại. Thời gian di chuyển bị sai, nên vị trí tính ra lệch 20-50 m. Uber dùng map-matching (HMM) để 'kéo' điểm GPS về đoạn đường gần nhất. Hết pin chỉ làm mất tín hiệu, không gây lệch.",
  },
  {
    question:
      "Trong hầm đỗ xe, GPS không có tín hiệu. Uber xử lý thế nào?",
    options: [
      "Huỷ chuyến",
      "Chờ lái xe ra khỏi hầm",
      "Dùng sensor fusion: kết hợp gia tốc kế, con quay hồi chuyển, và áp kế trên điện thoại để ước lượng vị trí",
      "Đoán bừa bằng toạ độ trung tâm thành phố",
    ],
    correct: 2,
    explanation:
      "Khi GPS mất, điện thoại vẫn còn các cảm biến khác. Gia tốc kế đo chuyển động, con quay hồi chuyển đo quay, áp kế đo độ cao. Kết hợp ba nguồn cho ước lượng khá sát vị trí dù không có tín hiệu vệ tinh. Đây là cách điền missing ở quy mô production, không chỉ dừng ở việc điền giá trị trung bình.",
  },
  {
    question:
      "Uber chia giá trị liên tục (khoảng cách, giờ trong ngày) thành nhóm (bucket) trước khi đưa vào DeepETA. Lý do chính?",
    options: [
      "Để tiết kiệm bộ nhớ",
      "Giúp model học mẫu ổn định hơn và giảm ảnh hưởng của ngoại lai. Giờ 17:00 và 17:05 cùng nằm trong nhóm 'giờ cao điểm'",
      "Vì model không đọc được số thực",
      "Vì Python không hỗ trợ số thực trên GPU",
    ],
    correct: 1,
    explanation:
      "Bucketing (rời rạc hoá) là một dạng feature engineering. Các giá trị gần nhau được gộp thành một nhóm, giảm nhiễu và ảnh hưởng của ngoại lai. DeepETA thực nghiệm cho thấy bucketing đặc trưng liên tục cho độ chính xác cao hơn so với dùng giá trị thô, đặc biệt với dữ liệu giao thông có nhiều biến động cục bộ.",
  },
  {
    question:
      "Nếu bỏ qua toàn bộ bước tiền xử lý GPS, ETA của Uber sẽ ra sao?",
    options: [
      "Chính xác hơn vì model tự biết lọc",
      "Không đổi, preprocessing chỉ làm đẹp dữ liệu",
      "Sai lệch hàng chục phút vì nhiễu urban canyon, điểm trùng và đoạn mất tín hiệu khiến model nghĩ lái xe đứng yên hoặc nhảy teleport",
      "Pin điện thoại nhanh hết hơn",
    ],
    correct: 2,
    explanation:
      "Đây là nền tảng của mọi hệ thống ML production: model chỉ tốt bằng dữ liệu vào. Nhiễu GPS 50 m lặp lại mỗi giây thành hàng triệu điểm sai, kéo theo ETA lệch 20-30 phút. Ngược lại, pipeline sạch đưa sai số vị trí xuống dưới 5 m và lấp luôn các đoạn mất tín hiệu, giúp ETA chỉ lệch vài chục giây.",
  },
  {
    question:
      "DeepETA chạy real-time feature trong mili-giây qua Kafka. Đâu KHÔNG phải đặc trưng thời gian thực điển hình?",
    options: [
      "Tốc độ trung bình của từng đoạn đường hiện tại",
      "Năm sinh của lái xe",
      "Thời gian đã đi qua segment trước",
      "Loại chuyến đi (giao hàng, đi chung, chuyến riêng)",
    ],
    correct: 1,
    explanation:
      "Real-time feature là các đại lượng thay đổi theo thời gian của chuyến đi: tốc độ trung bình segment, thời gian đã đi qua segment, loại chuyến. Năm sinh lái xe là thông tin tĩnh, không liên quan đến ETA, nên không nằm trong pipeline real-time feature.",
  },
];

/* ────────────────────────────────────────────────────────────
   COMPONENT CHÍNH
   ──────────────────────────────────────────────────────────── */


type CleanStep = "raw" | "dedupe" | "interp" | "tz" | "snap";

const STEP_ORDER: CleanStep[] = ["raw", "dedupe", "interp", "tz", "snap"];

const STEP_META: Record<
  CleanStep,
  {
    label: string;
    subtitle: string;
    detail: string;
    color: string;
    icon: typeof MapPin;
  }
> = {
  raw: {
    label: "Raw",
    subtitle: "GPS thô: 13 điểm, có trùng, lệch, mất tín hiệu và múi giờ lẫn lộn",
    detail:
      "Đây là dữ liệu ban đầu từ điện thoại. Model chưa nên học trực tiếp từ chuỗi này vì có lỗi ở cả vị trí lẫn thời gian.",
    color: "#ef4444",
    icon: Satellite,
  },
  dedupe: {
    label: "Dedupe",
    subtitle: "Bỏ điểm trùng cùng timestamp",
    detail:
      "Bước này chủ yếu đổi số điểm, không đổi hình dạng đường đi. Nếu không bỏ trùng, model có thể hiểu nhầm xe đang đứng yên lâu hơn thực tế.",
    color: "#f59e0b",
    icon: Layers,
  },
  interp: {
    label: "Interpolate",
    subtitle: "Lấp chỗ mất tín hiệu bằng nội suy",
    detail:
      "Điểm vòng trắng là điểm được ước lượng giữa hai lần GPS bắt được tín hiệu. Nó giúp chuỗi không bị đứt đoạn trước khi map-match.",
    color: "#3b82f6",
    icon: WifiOff,
  },
  tz: {
    label: "Convert TZ",
    subtitle: "Đưa mọi timestamp về 1 múi giờ",
    detail:
      "Bước này sửa metadata thời gian, nên bản đồ gần như không đổi. Thứ cần nhìn là trạng thái múi giờ chuyển từ lẫn lộn sang đồng nhất.",
    color: "#8b5cf6",
    icon: Clock,
  },
  snap: {
    label: "Map-match",
    subtitle: "Kéo mỗi điểm về đoạn đường gần nhất",
    detail:
      "Các đường nét đứt cho thấy mỗi điểm được kéo từ vị trí GPS quan sát về đường đi hợp lý trên bản đồ.",
    color: "#10b981",
    icon: MapPin,
  },
};

const STEP_CHANGE_COPY: Record<
  CleanStep,
  { before: string; action: string; after: string; note: string }
> = {
  raw: {
    before: "13 ping GPS",
    action: "Đánh dấu lỗi",
    after: "Chưa đưa vào model",
    note: "Bản đồ hiển thị các lỗi đầu vào: điểm trùng, đoạn mất tín hiệu, điểm lệch và múi giờ lẫn lộn.",
  },
  dedupe: {
    before: "13 điểm, 1 điểm trùng",
    action: "Bỏ ping cùng t=15s",
    after: "12 điểm, duplicate = 0",
    note: "Hình dạng đường gần như giữ nguyên, nhưng chuỗi thời gian không còn làm model tưởng xe đứng yên.",
  },
  interp: {
    before: "Mất tín hiệu 30s",
    action: "Thêm điểm t=90s",
    after: "Chuỗi liền mạch hơn",
    note: "Điểm vòng trắng là dữ liệu ước lượng. Nó không phải GPS thật, nhưng giúp model thấy xe vẫn đang di chuyển.",
  },
  tz: {
    before: "UTC + giờ local",
    action: "Chuẩn hoá timestamp",
    after: "Tất cả cùng 1 múi giờ",
    note: "Bản đồ không nên đổi ở bước này. Phần đổi nằm ở cột thời gian, nên mini timeline được đưa lên mặt bản đồ.",
  },
  snap: {
    before: "GPS lệch khỏi đường",
    action: "Map-match",
    after: "Điểm nằm trên tuyến hợp lý",
    note: "Đây mới là bước hình học lớn: toạ độ được kéo về đoạn đường gần nhất.",
  },
};

const STEP_OBSERVATION: Record<CleanStep, string> = {
  raw: "Bước raw cho thấy vấn đề gốc: chuỗi GPS có lỗi vị trí, lỗi thời gian và đoạn mất tín hiệu cùng lúc. Nếu đưa thẳng vào model, ETA dễ lệch mạnh.",
  dedupe:
    "Dedupe là bước nhỏ nhưng quan trọng: bỏ ping trùng cùng timestamp. Bản đồ không đổi nhiều, nhưng bộ đếm duplicate về 0 và chuỗi thời gian bớt gây hiểu nhầm.",
  interp:
    "Interpolate thêm một điểm ước lượng giữa hai ping cách nhau 30 giây. Người học cần thấy đây là dữ liệu được tạo ra để lấp khoảng trống, không phải GPS thật.",
  tz: "Convert TZ không sửa vị trí. Nó sửa ý nghĩa của thời gian: 17:05 UTC và 17:05 giờ địa phương là hai thời điểm rất khác nhau nếu dùng để học giờ cao điểm.",
  snap: "Map-match là bước làm thay đổi hình học rõ nhất: các điểm GPS lệch được kéo về đường hợp lý, nên sai số ETA giảm mạnh nhất ở cuối pipeline.",
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
            inferred: true,
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
          rawLat: p.lat,
          rawLon: p.lon,
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

  /* ETA giả lập: sai số giảm dần theo số bước */
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
              Uber · DeepETA
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
          Bạn mở ứng dụng Uber. Màn hình hiện &ldquo;Tài xế đến trong 4
          phút.&rdquo; Con số đó không phải đoán mò. Nó đến từ DeepETA, hệ
          thống deep learning của Uber, phục vụ hàng triệu chuyến đi mỗi
          ngày ở hơn 10.000 thành phố.
        </p>
        <p>
          Trước khi bất kỳ model nào chạy, Uber phải làm sạch dữ liệu đầu
          vào. Dữ liệu GPS từ hàng triệu điện thoại bị nhiễu, toạ độ nhảy
          giữa các toà nhà cao tầng, mất tín hiệu trong hầm, múi giờ lộn xộn
          giữa các chuyến. Không có bước tiền xử lý, ETA có thể sai hàng chục
          phút.
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
            body="Tín hiệu vệ tinh bật qua các toà nhà cao tầng trước khi đến điện thoại. Vị trí lệch 20-50 m ở phố cổ hoặc khu đô thị mới."
          />
          <ProblemCard
            icon={WifiOff}
            title="Mất tín hiệu"
            color="#f59e0b"
            body="Hầm đỗ xe, garage ngầm, đường hầm: GPS mất hàng chục giây. Chuỗi toạ độ bị đứt đoạn, khiến model không biết xe đã đi qua đâu."
          />
          <ProblemCard
            icon={Layers}
            title="Điểm trùng lặp"
            color="#3b82f6"
            body="Điện thoại gửi cùng toạ độ 2-3 lần do lỗi mạng hoặc retry. Nếu đếm cả điểm trùng, model nghĩ xe đang đứng yên."
          />
          <ProblemCard
            icon={Clock}
            title="Múi giờ lộn xộn"
            color="#8b5cf6"
            body="Có thiết bị gửi UTC, có thiết bị gửi giờ thành phố. Trừ nhầm múi giờ là sai giờ đón 7 tiếng."
          />
        </div>
        <p>
          Giao thông thì biến động liên tục. Một vụ tai nạn có thể kéo đoạn 5
          phút thành 30 phút. Garbage in, garbage out: nếu không làm sạch,
          DeepETA không thể dự đoán sát thực tế.
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
            dùng Hidden Markov Model (HMM, mô hình Markov ẩn) để
            &ldquo;kéo&rdquo; mỗi điểm về đoạn đường gần nhất trong bản đồ.
            Hệ thống có hai tầng: online matcher chạy nhanh để hiển thị thời
            gian thực, và offline reprocess chạy kỹ hơn để sinh dữ liệu huấn
            luyện sạch cho model. Bước này giảm sai số vị trí từ 50-100 m
            xuống dưới 5 m.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>Xử lý missing bằng sensor fusion.</strong> Khi GPS mất
            tín hiệu (hầm, garage), Uber không &ldquo;bỏ qua&rdquo; như một
            imputer thông thường. Thay vào đó, hệ thống kết hợp gia tốc kế,
            con quay hồi chuyển và áp kế trên điện thoại để ước lượng vị trí,
            giống như đi với la bàn khi bịt mắt. Đây là cách điền missing ở
            quy mô công nghiệp.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>Feature discretization (rời rạc hoá đặc trưng).</strong>{" "}
            DeepETA không dùng giá trị liên tục trực tiếp. Khoảng cách, giờ
            trong ngày, ngày trong tuần đều được gộp thành bucket (nhóm).
            Toạ độ (lat, lon) được mã hoá vào lưới đa phân giải. Trung tâm
            Manhattan cần ô lưới nhỏ, còn vùng ngoại ô dùng ô to. Thực nghiệm
            của Uber cho thấy bucketing giúp model học mẫu ổn định hơn so
            với giá trị thô.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>Real-time feature qua Kafka.</strong> Mỗi yêu cầu ETA cần
            đặc trưng cập nhật trong mili-giây: tốc độ trung bình từng đoạn
            đường (tính từ stream GPS của mọi tài xế), thời gian đã đi qua
            segment, và đặc trưng phân biệt loại chuyến (giao hàng, đi chung,
            chuyến riêng). Pipeline này chạy trên Kafka với độ trễ dưới 100 ms.
          </p>
        </Beat>
      </ApplicationMechanism>

      {/* ━━━ TRY IT: sandbox GPS + feature engineering ━━━ */}
      <ApplicationTryIt topicSlug="data-preprocessing-in-uber-eta">
        <div className="space-y-6">
          {/* ── Sandbox 1: làm sạch vệt GPS ── */}
          <div>
            <h3 className="text-base font-semibold text-foreground mb-2">
              Sandbox 1. Chạy lại từng bước làm sạch một vệt GPS
            </h3>
            <p className="text-sm text-muted mb-3 leading-relaxed">
              Bấm qua từng bước để xem lỗi nào được sửa. Có bước đổi hình
              dạng đường đi, có bước chỉ đổi số điểm hoặc metadata thời gian,
              nên phần mô tả dưới bản đồ sẽ nói rõ điều vừa xảy ra.
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
              <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-tertiary uppercase tracking-wide">
                    Bản đồ nội thành (giản lược)
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {STEP_META[step].subtitle}
                  </p>
                  <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">
                    {STEP_META[step].detail}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-[10px] text-tertiary">Sai số ETA mô phỏng</p>
                  <motion.p
                    key={etaError}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="whitespace-nowrap text-xl font-bold tabular-nums"
                    style={{ color: STEP_META[step].color }}
                  >
                    ± {etaError} phút
                  </motion.p>
                </div>
              </div>

              <StepChangeStrip step={step} color={STEP_META[step].color} />

              <GpsMap
                raw={step === "raw" ? null : RAW_POINTS}
                current={pointsToShow}
                showClean={step === "snap"}
                step={step}
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

            <Callout variant="insight" title="Điều cần quan sát ở bước này">
              {STEP_OBSERVATION[step]}
            </Callout>
          </div>

          {/* ── Sandbox 2: Feature engineering cho chuyến đi ── */}
          <div>
            <h3 className="text-base font-semibold text-foreground mb-2">
              Sandbox 2. Feature engineering trên từng chuyến đi
            </h3>
            <p className="text-sm text-muted mb-3 leading-relaxed">
              Chọn một đặc trưng để thấy giá trị thô được đưa vào bucket nào.
              Biểu đồ bên dưới cho biết dữ liệu huấn luyện có bao nhiêu chuyến
              trong từng bucket.
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
              Giờ 17:02 và 17:05 chẳng khác gì nhau về mặt giao thông. Cả hai
              đều thuộc &ldquo;giờ cao điểm&rdquo;. Gộp thành bucket giúp model
              ổn định hơn trước nhiễu nhỏ và đếm đủ dữ liệu mỗi nhóm để học
              mẫu ổn định. Ngược lại, toạ độ trung tâm Manhattan cần bucket nhỏ
              vì mật độ chuyến đi rất cao, nên Uber dùng lưới đa phân giải.
            </Callout>
          </div>

          {/* ── Sandbox 3: Step reveal pipeline vận hành ── */}
          <div>
            <h3 className="text-base font-semibold text-foreground mb-2">
              Sandbox 3. Pipeline từ GPS tới ETA, theo thứ tự
            </h3>
            <p className="text-sm text-muted mb-3 leading-relaxed">
              Bấm &ldquo;Tiếp tục&rdquo; để mở từng giai đoạn. Đây là bộ
              khung mà mọi ứng dụng vị trí thời gian thực (Grab, Gojek, Lyft,
              ShopeeFood) đều có, dù chi tiết mỗi nơi mỗi khác.
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
              explanation="Đây là kỹ thuật sensor fusion, một dạng điền missing ở quy mô production. Điện thoại có rất nhiều cảm biến, chỉ riêng GPS không đủ. Khi tín hiệu vệ tinh có lại, map-matching chuẩn hoá toàn bộ chuỗi điểm vừa nội suy để tránh drift tích luỹ."
            />

            <div className="mt-4">
              <InlineChallenge
                question="DeepETA biến cột 'giờ đặt chuyến' thành 48 bucket (mỗi bucket 30 phút). Lợi ích quan trọng nhất?"
                options={[
                  "Giảm kích thước model",
                  "Model học được mẫu giờ cao điểm ổn định hơn so với giá trị float, đồng thời bớt nhạy với nhiễu nhỏ (17:02 và 17:05 cùng rơi vào một bucket)",
                  "Tránh phải dùng GPU",
                  "Bỏ qua bước quan trọng khác",
                ]}
                correct={1}
                explanation="Bucketing là một dạng regularisation nhẹ: gộp các giá trị gần nhau về ý nghĩa, giảm variance và ảnh hưởng ngoại lai. Thực nghiệm của Uber cho thấy bucketing giờ và khoảng cách cho độ chính xác tốt hơn dùng giá trị thô, nhất là khi dữ liệu nhiều nhiễu do GPS."
              />
            </div>

            <div className="mt-4">
              <InlineChallenge
                question="Vì sao Uber phải giữ 2 tầng: online matcher và offline reprocess cho map-matching?"
                options={[
                  "Để tốn gấp đôi tiền server",
                  "Online matcher chạy nhanh (ms) cho hiển thị real-time. Offline reprocess chạy kỹ hơn (phút) với nhiều context để sinh dữ liệu huấn luyện sạch. Hai vai trò khác nhau",
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
              "GPS thô có nhiều lỗi hơn vẻ ngoài của nó. Map-matching kéo sai số vị trí từ 50-100 m xuống dưới 5 m.",
              "Missing values không chỉ điền bằng mean. Sensor fusion là cách điền missing ở quy mô production.",
              "Rời rạc hoá đặc trưng (bucketing) không phải thủ thuật. DeepETA đo được độ chính xác tốt hơn so với dùng giá trị thô.",
              "Feature real-time qua Kafka: bước tiền xử lý không dừng khi huấn luyện xong, mà chạy liên tục khi serve.",
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
          value="Xử lý hàng tỷ điểm GPS mỗi ngày, sau khử nhiễu sai số giảm từ 50-100 m xuống dưới 5 m"
          sourceRef={3}
        />
        <Metric
          value="Feature discretization (bucketing) cho độ chính xác tốt hơn so với dùng giá trị liên tục trực tiếp"
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
          toà nhà bên cạnh thay vì trên đường. ETA có thể sai hàng chục phút.
          Ngoại lai (tốc độ 300 km/h do GPS nhảy) kéo lệch mọi thống kê trung
          bình. Dữ liệu thiếu trong hầm và garage làm đứt chuỗi toạ độ, khiến
          model không thể tính thời gian qua đoạn.
        </p>
        <p>
          Tiền xử lý biến dữ liệu thô đầy nhiễu thành đầu vào sạch: map
          matching sửa vị trí, sensor fusion lấp lỗ hổng, bucketing chuẩn hoá
          thang đo, và pipeline real-time đảm bảo đặc trưng luôn mới. Đây là
          lý do 80% công sức ML nằm ở xử lý dữ liệu. Muốn luyện thêm kỹ năng
          pandas cốt lõi, ghé{" "}
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

function StepChangeStrip({
  step,
  color,
}: {
  step: CleanStep;
  color: string;
}) {
  const copy = STEP_CHANGE_COPY[step];
  const parts = [
    { label: "Trước", value: copy.before },
    { label: "Thao tác", value: copy.action },
    { label: "Sau", value: copy.after },
  ];

  return (
    <div className="mb-3 border-y border-border/70 py-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-stretch">
        {parts.map((part, index) => (
          <div key={part.label} className="contents">
            {index > 0 && (
              <div className="hidden items-center justify-center px-1 text-tertiary sm:flex">
                →
              </div>
            )}
            <div className="rounded-md border border-border bg-surface/50 px-3 py-2">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-tertiary">
                {part.label}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-foreground">
                {part.value}
              </p>
            </div>
          </div>
        ))}
      </div>
      <p
        className="mt-2 border-l-2 pl-2 text-xs leading-relaxed text-muted"
        style={{ borderColor: color }}
      >
        {copy.note}
      </p>
    </div>
  );
}

function GpsMap({
  raw,
  current,
  showClean,
  step,
  color,
}: {
  raw: GpsPoint[] | null;
  current: GpsPoint[];
  showClean: boolean;
  step: CleanStep;
  color: string;
}) {
  const W = 460;
  const H = 300;
  const duplicatePoint = RAW_POINTS.find((p) => p.dup);
  const rawGapStart = RAW_POINTS.find((p) => p.t === 75);
  const rawGapEnd = RAW_POINTS.find((p) => p.gap);
  const inferredPoint = current.find((p) => p.inferred);
  const outlierPoint = RAW_POINTS[RAW_POINTS.length - 1];

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

      {/* Đường đi sạch (ground truth): luôn có, mờ mờ */}
      <polyline
        points={CLEAN_PATH.map((p) => `${p.lat},${p.lon}`).join(" ")}
        fill="none"
        stroke="#10b981"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={showClean ? 0.9 : 0.18}
        strokeDasharray={showClean ? undefined : "4,4"}
      />

      {/* Raw points mờ nền: giữ lại để so sánh sau mỗi bước */}
      {raw?.map((p, i) => (
        <circle
          key={`raw-${i}`}
          cx={p.lat}
          cy={p.lon}
          r={4}
          fill="#94a3b8"
          opacity={0.22}
        />
      ))}

      {step === "raw" && rawGapStart && rawGapEnd && (
        <>
          <circle
            cx={duplicatePoint?.lat ?? 90}
            cy={duplicatePoint?.lon ?? 240}
            r={10}
            fill="none"
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="3,2"
          />
          <line
            x1={rawGapStart.lat}
            y1={rawGapStart.lon}
            x2={rawGapEnd.lat}
            y2={rawGapEnd.lon}
            stroke="#f59e0b"
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray="6,5"
            opacity={0.36}
          />
          <circle
            cx={outlierPoint.lat}
            cy={outlierPoint.lon}
            r={9}
            fill="#ef4444"
            opacity={0.18}
          />
        </>
      )}

      {step === "dedupe" && duplicatePoint && (
        <>
          <circle
            cx={duplicatePoint.lat}
            cy={duplicatePoint.lon}
            r={12}
            fill="#f59e0b"
            opacity={0.14}
          />
          <line
            x1={duplicatePoint.lat - 7}
            y1={duplicatePoint.lon - 7}
            x2={duplicatePoint.lat + 7}
            y2={duplicatePoint.lon + 7}
            stroke="#f59e0b"
            strokeWidth={2.4}
            strokeLinecap="round"
          />
          <line
            x1={duplicatePoint.lat + 7}
            y1={duplicatePoint.lon - 7}
            x2={duplicatePoint.lat - 7}
            y2={duplicatePoint.lon + 7}
            stroke="#f59e0b"
            strokeWidth={2.4}
            strokeLinecap="round"
          />
        </>
      )}

      {step === "interp" && rawGapStart && rawGapEnd && inferredPoint && (
        <>
          <line
            x1={rawGapStart.lat}
            y1={rawGapStart.lon}
            x2={rawGapEnd.lat}
            y2={rawGapEnd.lon}
            stroke="#3b82f6"
            strokeWidth={7}
            strokeLinecap="round"
            strokeDasharray="8,6"
            opacity={0.32}
          />
          <circle
            cx={inferredPoint.lat}
            cy={inferredPoint.lon}
            r={14}
            fill="#3b82f6"
            opacity={0.12}
          />
        </>
      )}

      {step === "tz" && (
        <g transform="translate(24, 28)">
          <rect
            width={170}
            height={62}
            rx={10}
            fill="var(--bg-card)"
            stroke="#8b5cf6"
            strokeWidth={1.4}
            opacity={0.96}
          />
          <text x={12} y={20} fontSize={10} fontWeight={700} fill="#8b5cf6">
            TIME NORMALIZATION
          </text>
          <text x={12} y={38} fontSize={11} fill="var(--text-primary)">
            UTC + local → local
          </text>
          <text x={12} y={54} fontSize={10} fill="var(--text-tertiary)">
            5 timestamp UTC đã đổi
          </text>
        </g>
      )}

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

      {/* Đường kéo điểm GPS về road segment khi map-match */}
      {current.map((p, i) => {
        if (
          p.rawLat == null ||
          p.rawLon == null ||
          (p.rawLat === p.lat && p.rawLon === p.lon)
        ) {
          return null;
        }

        return (
          <motion.line
            key={`snap-${i}-${p.rawLat}-${p.rawLon}`}
            x1={p.rawLat}
            y1={p.rawLon}
            x2={p.lat}
            y2={p.lon}
            stroke={color}
            strokeWidth={1.4}
            strokeDasharray="3,4"
            opacity={0.45}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.35, delay: i * 0.015 }}
          />
        );
      })}

      {/* Current cleaned points: chuyển mượt */}
      <AnimatePresence>
        {current.map((p, i) => (
          <motion.circle
            key={`cur-${i}-${p.lat}-${p.lon}-${p.inferred ? "i" : "o"}`}
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{ opacity: p.dup ? 0.35 : 0.95, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, delay: i * 0.015 }}
            cx={p.lat}
            cy={p.lon}
            r={p.inferred ? 6 : p.dup ? 6 : 4.5}
            fill={p.inferred ? "var(--bg-card)" : color}
            stroke={p.inferred ? color : "white"}
            strokeWidth={p.inferred ? 2 : 1}
            strokeDasharray={p.inferred ? "3,2" : undefined}
          />
        ))}
      </AnimatePresence>

      {step === "raw" && (
        <>
          <IssueTag x={102} y={225} color="#ef4444" label="trùng t=15s" />
          <IssueTag x={235} y={145} color="#f59e0b" label="mất 30s" />
          <IssueTag x={332} y={48} color="#ef4444" label="outlier" />
          <IssueTag x={142} y={198} color="#8b5cf6" label="UTC lẫn local" />
        </>
      )}

      {step === "dedupe" && (
        <IssueTag x={106} y={226} color="#f59e0b" label="đã bỏ 1 ping" />
      )}

      {step === "interp" && (
        <IssueTag x={266} y={138} color="#3b82f6" label="thêm t=90s" />
      )}

      {/* Legend */}
      <g transform={`translate(20, ${H - 14})`}>
        <circle cx={0} cy={0} r={3} fill="#94a3b8" opacity={0.4} />
        <text x={8} y={3} fontSize={11} fill="var(--text-tertiary)">
          Điểm GPS thô
        </text>
        <circle cx={100} cy={0} r={3} fill={color} />
        <text x={108} y={3} fontSize={11} fill="var(--text-tertiary)">
          Sau bước hiện tại
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
        <text x={250} y={3} fontSize={11} fill="var(--text-tertiary)">
          Đường đi thật trên bản đồ
        </text>
      </g>
    </svg>
  );
}

function IssueTag({
  x,
  y,
  color,
  label,
}: {
  x: number;
  y: number;
  color: string;
  label: string;
}) {
  const width = Math.max(56, label.length * 6.4 + 18);
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect
        width={width}
        height={18}
        rx={9}
        fill={color}
        opacity={0.16}
        stroke={color}
        strokeWidth={1}
      />
      <text
        x={9}
        y={12}
        fontSize={10}
        fontWeight={700}
        fill={color}
      >
        {label}
      </text>
    </g>
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
  const transformCopy = {
    hour: {
      rawLabel: "Giá trị thô",
      rawValue: "17:05",
      bucketLabel: "Bucket",
      bucketValue: "16-18",
      modelLabel: "Model nhận",
      modelValue: "giờ cao điểm chiều",
      note:
        "17:02, 17:05 và 17:20 khác nhau vài phút, nhưng tín hiệu giao thông gần giống nhau. Gộp vào một bucket giúp model học xu hướng thay vì ghi nhớ từng phút.",
    },
    dow: {
      rawLabel: "Giá trị thô",
      rawValue: "Thứ Sáu",
      bucketLabel: "Bucket",
      bucketValue: "Sáu",
      modelLabel: "Model nhận",
      modelValue: "nhu cầu cuối tuần",
      note:
        "Ngày trong tuần là tín hiệu rời rạc tự nhiên. Chuyến tối thứ Sáu thường giống nhau hơn so với một ngày làm việc bình thường.",
    },
    dist: {
      rawLabel: "Giá trị thô",
      rawValue: "2,4 km",
      bucketLabel: "Bucket",
      bucketValue: "1-3 km",
      modelLabel: "Model nhận",
      modelValue: "chuyến ngắn",
      note:
        "2,1 km và 2,8 km không cần là hai tín hiệu hoàn toàn khác nhau. Bucket khoảng cách giảm nhiễu và làm dữ liệu trong mỗi nhóm đủ dày để học.",
    },
  } satisfies Record<
    "hour" | "dow" | "dist",
    {
      rawLabel: string;
      rawValue: string;
      bucketLabel: string;
      bucketValue: string;
      modelLabel: string;
      modelValue: string;
      note: string;
    }
  >;
  const copy = transformCopy[choice];

  /* Dữ liệu minh hoạ: 1 ngày chuyến đi giả lập */
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
    <div className="space-y-4">
      <div className="border-b border-border pb-3">
        <div className="grid grid-cols-1 gap-2 text-xs sm:flex sm:flex-wrap sm:items-center">
          {[
            { label: copy.rawLabel, value: copy.rawValue },
            { label: copy.bucketLabel, value: copy.bucketValue },
            { label: copy.modelLabel, value: copy.modelValue },
          ].map((item, index) => (
            <div key={item.label} className="flex items-start gap-2">
              {index > 0 && (
                <span className="hidden px-1 pt-4 text-tertiary sm:inline" aria-hidden="true">
                  →
                </span>
              )}
              <div className="min-w-[112px]">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-tertiary">
                  {item.label}
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted">{copy.note}</p>
      </div>

      <div className="flex h-48 items-end gap-2">
        {buckets.map((b) => {
          const h = (b.count / maxCount) * 100;
          const selected = b.label === copy.bucketValue;
          return (
            <div
              key={b.label}
              className="flex h-full flex-1 flex-col items-center justify-end"
            >
              <span className="text-[10px] text-muted tabular-nums mb-1">
                {b.count}
              </span>
              <div className="flex h-36 w-full items-end">
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
                    backgroundColor: selected
                      ? "#2563eb"
                      : b.highlight
                        ? "#0f766e"
                        : "#94a3b8",
                    opacity: selected || b.highlight ? 1 : 0.55,
                  }}
                  className="min-h-0.5 w-full rounded-t-md"
                />
              </div>
              <span className="text-[9px] text-tertiary mt-1 whitespace-nowrap">
                {b.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-blue-600" />
          Bucket của ví dụ đang xét
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-teal-700" />
          Bucket có nhiều dữ liệu huấn luyện
        </span>
        <span className="flex items-center gap-1">
          <AlertTriangle size={10} className="text-amber-500" />
          Model học nhóm tín hiệu, không ghi nhớ từng giá trị nhỏ lẻ
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
