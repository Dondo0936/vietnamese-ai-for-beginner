"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Compass,
  Dice5,
  TrendingUp,
  BarChart3,
  BookOpen,
  CheckCircle2,
  RotateCcw,
  Heart,
  Sparkles,
} from "lucide-react";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  TopicLink,
  MatchPairs,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "math-readiness",
  title: "Math Readiness for ML",
  titleVi: "Toán cần biết — đừng lo",
  description:
    "Bốn ngôi sao Bắc Đẩu của Machine Learning: đại số tuyến tính, xác suất, đạo hàm, thống kê. Không cần giỏi toán — chỉ cần biết chúng để làm gì.",
  category: "foundations",
  tags: ["functions", "notation", "summation", "prerequisites"],
  difficulty: "beginner",
  relatedSlugs: ["what-is-ml", "vectors-and-matrices", "data-and-datasets"],
  vizType: "interactive",
};

const TOTAL_STEPS = 7;

/* ══════════════════════════════════════════════════════════════
   DỮ LIỆU: 4 ngôi sao Bắc Đẩu + vị trí trên chòm
   ══════════════════════════════════════════════════════════════ */

type StarId = "linalg" | "prob" | "deriv" | "stats";

interface StarInfo {
  id: StarId;
  name: string;
  subtitle: string;
  icon: typeof Compass;
  /** Vị trí SVG (viewBox 500 × 360) */
  x: number;
  y: number;
  color: string;
  /** Một câu mô tả ngắn — dùng làm tagline */
  tagline: string;
  /** Ẩn dụ đời thường */
  analogy: string;
  /** Chúng xuất hiện ở đâu trong ML */
  whereInML: string;
  /** Mức yêu cầu cho người mới */
  needLevel: "biết sơ qua" | "nhớ kiến thức cấp 3" | "quen mặt là đủ";
  /** Ví dụ cụ thể đời thường */
  example: string;
}

const STARS: StarInfo[] = [
  {
    id: "linalg",
    name: "Đại số tuyến tính",
    subtitle: "Vector & ma trận",
    icon: Compass,
    x: 130,
    y: 100,
    color: "#3b82f6",
    tagline: "Ngôn ngữ để mô tả mọi thứ bằng con số.",
    analogy:
      "Giống tọa độ trên Google Maps: một địa điểm = một cặp số (kinh độ, vĩ độ). Một bức ảnh = một dãy dài toàn số. Một bài hát = một dãy khác.",
    whereInML:
      "Dữ liệu nào vào máy cũng phải thành dãy số. Ảnh, văn bản, âm thanh — tất cả trở thành vector. Ma trận là bảng chứa nhiều vector xếp cạnh nhau.",
    needLevel: "quen mặt là đủ",
    example:
      "Ảnh chân dung → ảnh trở thành lưới số 28×28 pixel = một ma trận. Cộng hai vector giống như ghép hai danh sách lại cột một.",
  },
  {
    id: "prob",
    name: "Xác suất",
    subtitle: "Khả năng xảy ra của sự kiện",
    icon: Dice5,
    x: 370,
    y: 90,
    color: "#10b981",
    tagline: "Máy không chắc chắn — nó đo độ chắc bằng xác suất.",
    analogy:
      "Bạn xem thời tiết: &ldquo;70% khả năng có mưa&rdquo;. Đó là xác suất. Máy ML cũng nói kiểu đó: &ldquo;95% đây là ảnh mèo&rdquo;.",
    whereInML:
      "Khi máy đoán, nó không nói &ldquo;đây là mèo&rdquo; chắc nịch mà nói &ldquo;mèo với độ chắc 0.95&rdquo;. Số càng gần 1 = càng tin. Gần 0.5 = đang lưỡng lự.",
    needLevel: "biết sơ qua",
    example:
      "Tung đồng xu 100 lần được 53 lần ngửa → xác suất ngửa ≈ 0.53. Dự đoán thời tiết, khám bệnh, chatbot — tất cả đều chạy trên xác suất.",
  },
  {
    id: "deriv",
    name: "Đạo hàm",
    subtitle: "Độ dốc — bạn đang đi lên hay xuống",
    icon: TrendingUp,
    x: 130,
    y: 260,
    color: "#f59e0b",
    tagline: "Công cụ để tự sửa sai khi máy đang học.",
    analogy:
      "Bạn đang leo núi trong sương mù. Không thấy đỉnh, nhưng biết chân đang nghiêng về hướng nào. Đạo hàm cho biết hướng dốc — đi ngược hướng dốc là tới thấp nhất.",
    whereInML:
      "Lỗi của mô hình là một cái &ldquo;đồi&rdquo;. Máy muốn xuống đáy (lỗi thấp nhất). Đạo hàm cho biết nên bước theo hướng nào. Đây là linh hồn của huấn luyện.",
    needLevel: "biết sơ qua",
    example:
      "Xe máy đang chạy, bạn nhìn đồng hồ tốc độ tăng dần — đạo hàm đang dương. Đang phanh, đồng hồ giảm — đạo hàm âm. Đó là toàn bộ ý tưởng.",
  },
  {
    id: "stats",
    name: "Thống kê",
    subtitle: "Rút ra kết luận từ dữ liệu",
    icon: BarChart3,
    x: 370,
    y: 270,
    color: "#a855f7",
    tagline: "Đọc được câu chuyện dữ liệu đang kể.",
    analogy:
      "Giáo viên nhìn điểm thi của cả lớp: trung bình bao nhiêu, lệch nhau thế nào, có ai thi 0 điểm không. Đó là thống kê — tóm gọn hàng nghìn số thành vài con số có ý nghĩa.",
    whereInML:
      "Trước khi huấn luyện, bạn phải biết dữ liệu có gì: bao nhiêu ví dụ, phân bố ra sao, có sai lệch không. Sau khi huấn luyện, cần đo mô hình đúng bao nhiêu phần trăm.",
    needLevel: "nhớ kiến thức cấp 3",
    example:
      "Trung bình cộng điểm, giá trị cao nhất và thấp nhất, bao nhiêu phần trăm học sinh đậu. Tất cả những điều bạn học lớp 10 là đủ để bắt đầu.",
  },
];

/* ══════════════════════════════════════════════════════════════
   Tự đánh giá — mỗi ô là một mini-quiz biết/chưa biết
   ══════════════════════════════════════════════════════════════ */

type SelfAssessState = Record<string, "known" | "unsure" | "nope" | null>;

interface SelfAssessItem {
  id: string;
  q: string;
  starRelated: StarId;
}

const SELF_ASSESS: SelfAssessItem[] = [
  {
    id: "coord",
    q: "Bạn biết mặt phẳng tọa độ là gì không? (trục x, trục y, điểm có tọa độ (2, 3))",
    starRelated: "linalg",
  },
  {
    id: "avg",
    q: "Bạn tính được trung bình cộng của 5 số chứ? (ví dụ: 6, 7, 8, 9, 10)",
    starRelated: "stats",
  },
  {
    id: "prob",
    q: "Bạn hiểu &ldquo;70% khả năng có mưa&rdquo; nghĩa là gì chứ?",
    starRelated: "prob",
  },
  {
    id: "slope",
    q: "Bạn phân biệt được đường đi lên dốc với đường đi xuống dốc không?",
    starRelated: "deriv",
  },
  {
    id: "func",
    q: "Công thức y = 2x + 1: cho x = 3 thì y bằng bao nhiêu?",
    starRelated: "linalg",
  },
  {
    id: "sum",
    q: "Cộng 3 + 5 + 7 + 9 = bao nhiêu? (không dùng máy tính)",
    starRelated: "stats",
  },
];

/* ══════════════════════════════════════════════════════════════
   COMPONENT PHỤ: Chòm sao Bắc Đẩu có thể bấm
   ══════════════════════════════════════════════════════════════ */

function ConstellationMap({
  active,
  onSelect,
  visited,
}: {
  active: StarId | null;
  onSelect: (id: StarId) => void;
  visited: Set<StarId>;
}) {
  return (
    <div className="relative">
      <svg
        viewBox="0 0 500 360"
        className="w-full rounded-xl border border-border"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(30, 41, 59, 0.98) 0%, rgba(2, 6, 23, 1) 75%)",
        }}
      >
        <defs>
          <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="60%" stopColor="white" stopOpacity="0.3" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Rải sao nền nhỏ */}
        {Array.from({ length: 40 }).map((_, i) => {
          const cx = (i * 317.21) % 500;
          const cy = (i * 119.73) % 360;
          const r = 0.6 + ((i * 7) % 5) * 0.25;
          const op = 0.2 + ((i * 13) % 6) * 0.1;
          return (
            <circle
              key={`bg-${i}`}
              cx={cx}
              cy={cy}
              r={r}
              fill="white"
              opacity={op}
            />
          );
        })}

        {/* Đường nối các sao chính */}
        {STARS.map((s, i) => {
          const next = STARS[(i + 1) % STARS.length];
          return (
            <line
              key={`line-${s.id}-${next.id}`}
              x1={s.x}
              y1={s.y}
              x2={next.x}
              y2={next.y}
              stroke="white"
              strokeWidth="0.6"
              strokeDasharray="3,4"
              opacity="0.25"
            />
          );
        })}

        {/* Các sao chính */}
        {STARS.map((s) => {
          const isActive = active === s.id;
          const wasVisited = visited.has(s.id);
          const baseR = isActive ? 14 : wasVisited ? 11 : 10;

          return (
            <g
              key={s.id}
              onClick={() => onSelect(s.id)}
              style={{ cursor: "pointer" }}
            >
              {/* Glow halo */}
              <motion.circle
                cx={s.x}
                cy={s.y}
                r={baseR + 14}
                fill="url(#starGlow)"
                opacity={isActive ? 0.8 : 0.35}
                animate={{
                  scale: isActive ? [1, 1.15, 1] : 1,
                }}
                transition={{
                  duration: 2.5,
                  repeat: isActive ? Infinity : 0,
                  ease: "easeInOut",
                }}
              />

              {/* Sao chính */}
              <motion.circle
                cx={s.x}
                cy={s.y}
                r={baseR}
                fill={s.color}
                stroke="white"
                strokeWidth="1.5"
                animate={{
                  r: isActive ? [baseR, baseR + 2, baseR] : baseR,
                }}
                transition={{
                  duration: 1.5,
                  repeat: isActive ? Infinity : 0,
                  ease: "easeInOut",
                }}
              />

              {/* Tick nếu đã ghé */}
              {wasVisited && !isActive && (
                <circle
                  cx={s.x + baseR - 2}
                  cy={s.y - baseR + 2}
                  r={4}
                  fill="#22c55e"
                  stroke="white"
                  strokeWidth="1"
                />
              )}

              {/* Tên sao */}
              <text
                x={s.x}
                y={s.y + baseR + 20}
                textAnchor="middle"
                fontSize="13"
                fontWeight="700"
                fill="white"
                style={{ pointerEvents: "none" }}
              >
                {s.name}
              </text>
              <text
                x={s.x}
                y={s.y + baseR + 36}
                textAnchor="middle"
                fontSize="11"
                fill="rgba(255,255,255,0.6)"
                style={{ pointerEvents: "none" }}
              >
                {s.subtitle}
              </text>
            </g>
          );
        })}

        {/* Ghi chú giữa chòm */}
        <text
          x="250"
          y="185"
          textAnchor="middle"
          fontSize="11"
          fill="rgba(255,255,255,0.5)"
          fontStyle="italic"
        >
          Bấm vào một ngôi sao để biết chi tiết
        </text>
      </svg>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   COMPONENT PHỤ: Bảng chi tiết khi bấm một sao
   ══════════════════════════════════════════════════════════════ */

function StarDetail({ star }: { star: StarInfo }) {
  const Icon = star.icon;
  const levelColor =
    star.needLevel === "quen mặt là đủ"
      ? "#22c55e"
      : star.needLevel === "biết sơ qua"
        ? "#84cc16"
        : "#f59e0b";

  return (
    <motion.div
      key={star.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border-2 p-5 space-y-4"
      style={{
        borderColor: star.color + "66",
        backgroundColor: star.color + "0d",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: star.color + "22" }}
        >
          <Icon size={22} style={{ color: star.color }} />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground leading-tight">
            {star.name}
          </h3>
          <p className="text-xs text-muted">{star.subtitle}</p>
        </div>
        <span
          className="ml-auto text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap"
          style={{
            backgroundColor: levelColor + "22",
            color: levelColor,
          }}
        >
          {star.needLevel}
        </span>
      </div>

      <p
        className="text-sm font-semibold leading-relaxed"
        style={{ color: star.color }}
      >
        &ldquo;{star.tagline}&rdquo;
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-card p-3 space-y-1.5">
          <p className="text-[11px] font-semibold text-tertiary uppercase tracking-wide">
            Ẩn dụ đời thường
          </p>
          <p className="text-xs text-foreground/85 leading-relaxed">
            {star.analogy}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 space-y-1.5">
          <p className="text-[11px] font-semibold text-tertiary uppercase tracking-wide">
            Dùng ở đâu trong ML
          </p>
          <p className="text-xs text-foreground/85 leading-relaxed">
            {star.whereInML}
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-card border border-border p-3">
        <p className="text-[11px] font-semibold text-tertiary uppercase tracking-wide mb-1.5">
          Ví dụ cụ thể
        </p>
        <p className="text-xs text-foreground/85 leading-relaxed">
          {star.example}
        </p>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   COMPONENT PHỤ: Tự đánh giá
   ══════════════════════════════════════════════════════════════ */

function SelfAssessment() {
  const [answers, setAnswers] = useState<SelfAssessState>(
    () =>
      Object.fromEntries(SELF_ASSESS.map((q) => [q.id, null])) as SelfAssessState,
  );

  const answered = Object.values(answers).filter((v) => v !== null).length;
  const knownCount = Object.values(answers).filter(
    (v) => v === "known",
  ).length;
  const nopeCount = Object.values(answers).filter((v) => v === "nope").length;

  let advice = "";
  let adviceColor = "";
  if (answered === SELF_ASSESS.length) {
    if (knownCount >= 5) {
      advice =
        "Xuất sắc! Bạn có nền tảng rất vững. Học ML sẽ rất thoải mái cho bạn.";
      adviceColor = "#22c55e";
    } else if (knownCount >= 3) {
      advice =
        "Ổn rồi. Vài chỗ chưa chắc — nhưng hoàn toàn đủ để bắt đầu. Các bài tiếp theo sẽ ôn lại khi cần.";
      adviceColor = "#84cc16";
    } else {
      advice =
        "Đừng nản! ML không cần giỏi toán — cần quen mặt. Mỗi khi gặp ký hiệu lạ, bạn chỉ cần hỏi 'cái này dùng để làm gì?' — không cần chứng minh được.";
      adviceColor = "#f59e0b";
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen size={18} className="text-accent" />
        <h3 className="text-base font-semibold text-foreground">
          Bạn biết đến đâu rồi?
        </h3>
      </div>
      <p className="text-sm text-muted leading-relaxed">
        Sáu câu hỏi nhỏ để tự kiểm tra. Đừng lo đúng sai — chỉ bấm cái
        bạn cảm thấy thật. Cuối cùng sẽ có lời khuyên dựa trên kết quả.
      </p>

      <div className="space-y-2.5">
        {SELF_ASSESS.map((q, i) => {
          const ans = answers[q.id];
          return (
            <div
              key={q.id}
              className={`rounded-lg border p-3 transition-colors ${
                ans
                  ? "border-accent/40 bg-accent-light/30"
                  : "border-border bg-surface"
              }`}
            >
              <p className="text-sm text-foreground/90 mb-2 leading-relaxed">
                <span className="font-semibold text-accent mr-2">
                  #{i + 1}
                </span>
                {q.q}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { key: "known" as const, label: "Biết chắc", color: "#22c55e" },
                    { key: "unsure" as const, label: "Mơ hồ", color: "#f59e0b" },
                    { key: "nope" as const, label: "Chưa biết", color: "#ef4444" },
                  ] as const
                ).map((opt) => {
                  const selected = ans === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() =>
                        setAnswers((prev) => ({
                          ...prev,
                          [q.id]: prev[q.id] === opt.key ? null : opt.key,
                        }))
                      }
                      className="rounded-lg border px-2 py-1.5 text-xs font-medium transition-all"
                      style={
                        selected
                          ? {
                              borderColor: opt.color,
                              backgroundColor: opt.color + "22",
                              color: opt.color,
                            }
                          : undefined
                      }
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tổng kết */}
      <div className="rounded-lg border border-border bg-surface p-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted">
            Đã trả lời: {answered}/{SELF_ASSESS.length}
          </span>
          {answered > 0 && (
            <span className="text-muted">
              Biết chắc: <strong className="text-emerald-500">{knownCount}</strong>
              {" · "}Chưa:{" "}
              <strong className="text-rose-500">{nopeCount}</strong>
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {SELF_ASSESS.map((q) => {
            const a = answers[q.id];
            const color =
              a === "known"
                ? "#22c55e"
                : a === "unsure"
                  ? "#f59e0b"
                  : a === "nope"
                    ? "#ef4444"
                    : "var(--border)";
            return (
              <div
                key={q.id}
                className="h-2 flex-1 rounded-full transition-colors"
                style={{ backgroundColor: color }}
              />
            );
          })}
        </div>

        <AnimatePresence>
          {advice && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-xs font-medium leading-relaxed pt-2"
              style={{ color: adviceColor }}
            >
              <Sparkles size={12} className="inline mr-1" />
              {advice}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   COMPONENT CHÍNH
   ══════════════════════════════════════════════════════════════ */

export default function MathReadinessTopic() {
  const [activeStar, setActiveStar] = useState<StarId | null>("linalg");
  const [visited, setVisited] = useState<Set<StarId>>(new Set(["linalg"]));

  const activeInfo = useMemo(
    () => STARS.find((s) => s.id === activeStar),
    [activeStar],
  );

  function handleSelect(id: StarId) {
    setActiveStar(id);
    setVisited((prev) => new Set(prev).add(id));
  }

  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          "Bốn ngôi sao Bắc Đẩu của Machine Learning là gì?",
        options: [
          "Cộng, trừ, nhân, chia",
          "Đại số tuyến tính, xác suất, đạo hàm, thống kê",
          "Hình học, lượng giác, số học, đại số",
          "Python, SQL, Excel, Git",
        ],
        correct: 1,
        explanation:
          "Bốn khái niệm này gần như xuất hiện trong mọi mô hình ML. Không cần giỏi, nhưng cần quen mặt và biết chúng dùng để làm gì.",
      },
      {
        question:
          "Ảnh 28x28 pixel đen trắng được biểu diễn trong máy tính như thế nào?",
        options: [
          "Một chuỗi ký tự",
          "Một ma trận 28x28 số, mỗi số thể hiện độ sáng của một pixel",
          "Một file video",
          "Một câu văn mô tả ảnh",
        ],
        correct: 1,
        explanation:
          "Máy nhìn mọi thứ bằng số. Ảnh 28x28 = ma trận 28x28 con số. Đây là lý do đại số tuyến tính (vector, ma trận) là ngôi sao số một — vì dữ liệu nào cũng phải trở thành dãy số.",
      },
      {
        question:
          "Khi mô hình ML đưa ra dự đoán, nó thường trả về điều gì?",
        options: [
          "Chỉ có đáp án đúng — không bao giờ sai",
          "Xác suất hoặc độ tin cậy (ví dụ 0.87 = 87% chắc chắn)",
          "Một câu tiếng Anh",
          "Số phức",
        ],
        correct: 1,
        explanation:
          "Máy ML không nói chắc nịch — nó nói độ chắc. &ldquo;Đây là ảnh mèo với độ tin 0.95&rdquo;. Đó là lý do xác suất là ngôi sao quan trọng thứ hai.",
      },
      {
        question:
          "Đạo hàm (độ dốc) được dùng để làm gì trong ML?",
        options: [
          "Để đo chiều cao mô hình",
          "Để máy biết đi theo hướng nào thì lỗi giảm — giống leo núi trong sương mù",
          "Để vẽ đồ thị đẹp",
          "Không dùng, chỉ có trong sách toán",
        ],
        correct: 1,
        explanation:
          "Huấn luyện ML thực chất là đi tìm điểm thấp nhất của đồi lỗi. Đạo hàm chỉ hướng đi — đi ngược dốc là xuống. Đây chính là thuật toán &ldquo;gradient descent&rdquo; mà bạn sẽ nghe nhiều.",
      },
      {
        type: "fill-blank",
        question:
          "Khi huấn luyện xong, ta cần đo xem mô hình đúng bao nhiêu phần trăm trên dữ liệu mới. Việc đo đạc này thuộc về {blank}.",
        blanks: [
          {
            answer: "thống kê",
            accept: ["thong ke", "statistics", "thống kê"],
          },
        ],
        explanation:
          "Thống kê là ngôi sao thứ tư. Nó không chỉ giúp bạn hiểu dữ liệu trước huấn luyện mà còn đánh giá mô hình sau khi huấn luyện xong.",
      },
      {
        question:
          "Bạn muốn bắt đầu học ML nhưng không giỏi toán. Lời khuyên nào hợp lý nhất?",
        options: [
          "Bỏ ý định — không giỏi toán thì không học được",
          "Học bốn khái niệm ở mức hiểu ý — không cần chứng minh công thức — và học dần khi gặp lại ở các bài sau",
          "Học toán ba năm trước khi đụng đến ML",
          "Chỉ học Python, bỏ hết toán",
        ],
        correct: 1,
        explanation:
          "Đây là cách của hầu hết người làm ML hiện nay. Biết để làm gì > biết chứng minh. Khi gặp lại trong bài sau, kiến thức sẽ dần sâu hơn một cách tự nhiên.",
      },
      {
        question:
          "Khẳng định nào là SAI về mối quan hệ giữa toán và ML?",
        options: [
          "Hiểu toán sâu giúp bạn tạo ra mô hình mới, không chỉ dùng mô hình có sẵn",
          "Đa số công việc ML thực tế dùng thư viện có sẵn, không yêu cầu chứng minh công thức",
          "Không biết chút toán nào thì không thể bắt đầu học ML",
          "Nhiều công việc ML phổ biến cần bạn hiểu ý các khái niệm, không cần viết công thức tay",
        ],
        correct: 2,
        explanation:
          "Sai ở câu C. Bạn chỉ cần &ldquo;quen mặt&rdquo; các khái niệm — không cần tính tay giải phương trình. Rất nhiều lập trình viên ML đã từng &ldquo;sợ toán&rdquo; hồi trung học.",
      },
    ],
    [],
  );

  return (
    <>
      {/* ══════════════════ BƯỚC 1 — HOOK ══════════════════ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Bắt đầu">
        <div className="rounded-2xl border-2 border-accent/30 bg-gradient-to-br from-surface via-accent-light/40 to-surface p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/15">
              <Heart size={24} className="text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground leading-tight">
                Đừng lo — bạn không cần giỏi toán để học ML.
              </h3>
              <p className="text-sm text-muted mt-1">
                Nhưng có <strong>bốn ngôi sao Bắc Đẩu</strong> bạn cần
                nhìn mặt và biết dùng để làm gì.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 text-sm text-foreground/90 leading-relaxed space-y-2">
            <p>
              Rất nhiều bạn trẻ nghĩ: &ldquo;Tôi dốt toán, ML không phải
              cho tôi&rdquo;. Sai rồi. Làm ML phổ thông giống như lái xe:
              bạn cần biết vô-lăng, chân ga, chân phanh là gì — không cần
              hiểu piston và hộp số hoạt động ra sao.
            </p>
            <p>
              Trong bài này bạn sẽ gặp bốn khái niệm quan trọng nhất. Với
              mỗi khái niệm, bạn chỉ cần biết:{" "}
              <em>&ldquo;Cái này tên là gì, nó dùng để làm gì trong
              ML?&rdquo;</em>
            </p>
          </div>
        </div>
      </LessonSection>

      {/* ══════════════════ BƯỚC 2 — DỰ ĐOÁN ══════════════════ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Thử đoán">
        <PredictionGate
          question="Bạn được cho bốn mảnh toán. Mảnh nào bạn sẽ ÍT khi gặp nhất trong công việc ML đời thường (không phải nghiên cứu hàn lâm)?"
          options={[
            "Vector và ma trận — để biểu diễn dữ liệu và ảnh",
            "Đạo hàm — để hiểu mô hình 'học' theo hướng nào",
            "Xác suất và thống kê — để đánh giá mô hình và hiểu dữ liệu",
            "Chứng minh chặt chẽ theo dạng epsilon-delta của giải tích",
          ]}
          correct={3}
          explanation="Ba mảnh đầu xuất hiện mỗi ngày khi làm ML công nghiệp; chúng là 'vocab' bạn đọc mọi tài liệu. Chứng minh epsilon-delta là nền tảng hàn lâm — đẹp, quan trọng cho nhà nghiên cứu — nhưng người viết app ML hiếm khi phải viết lại. Mục tiêu của bài là giúp bạn quen mặt ba mảnh đầu ở mức hiểu ý."
        >
          <p className="text-sm text-muted mt-3 leading-relaxed">
            Tiếp theo, mình sẽ vẽ cho bạn chòm sao Bắc Đẩu của ML —
            bốn điểm mốc dẫn đường.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ══════════════════ BƯỚC 3 — REVEAL (Chòm sao) ══════════════════ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <Star size={18} className="text-accent" />
              <h3 className="text-base font-semibold text-foreground">
                Chòm sao Bắc Đẩu — bấm vào từng ngôi sao
              </h3>
            </div>
            <p className="text-sm text-muted leading-relaxed">
              Mỗi ngôi sao là một nhóm khái niệm. Bấm vào để biết:{" "}
              <em>nó là gì, giống cái gì ngoài đời, và dùng ở đâu trong
              ML</em>. Dấu xanh nhỏ xuất hiện khi bạn đã ghé qua.
            </p>

            <ConstellationMap
              active={activeStar}
              onSelect={handleSelect}
              visited={visited}
            />

            <AnimatePresence mode="wait">
              {activeInfo && <StarDetail star={activeInfo} />}
            </AnimatePresence>

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted">
                Đã ghé: {visited.size}/{STARS.length}{" "}
                {visited.size === STARS.length && (
                  <CheckCircle2
                    size={12}
                    className="inline text-emerald-500"
                  />
                )}
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveStar(null);
                  setVisited(new Set());
                }}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted hover:bg-surface-hover transition-colors"
              >
                <RotateCcw size={12} />
                Bắt đầu lại
              </button>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ══════════════════ BƯỚC 4 — DEEPEN (Tự đánh giá) ══════════════════ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Tự kiểm">
        <SelfAssessment />
      </LessonSection>

      {/* ══════════════════ BƯỚC 5 — CHALLENGE (Match + Challenge) ══════════════════ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-foreground">
              Ghép: công việc ML ↔ ngôi sao toán cần dùng
            </h3>
            <p className="text-sm text-muted leading-relaxed">
              Với mỗi công việc ML thật dưới đây, ngôi sao nào được dùng
              nhiều nhất? Kéo để ghép:
            </p>
            <MatchPairs
              instruction="Ghép mỗi công việc ML (Cột A) với ngôi sao toán học chủ đạo (Cột B)."
              pairs={[
                {
                  left: "Biểu diễn một ảnh chân dung thành bảng số",
                  right: "Đại số tuyến tính — ảnh thành ma trận pixel",
                },
                {
                  left: "Tính khả năng đây là email rác",
                  right: "Xác suất — trả về một số từ 0 đến 1",
                },
                {
                  left: "Máy tự sửa khi đoán sai trong quá trình học",
                  right: "Đạo hàm — biết đi hướng nào để lỗi giảm",
                },
                {
                  left: "Đo xem mô hình đúng bao nhiêu % trên 1000 ảnh test",
                  right: "Thống kê — tóm gọn kết quả nhiều lần đo",
                },
              ]}
            />
          </div>

          <InlineChallenge
            question="Khi huấn luyện mô hình, máy liên tục đoán sai → chỉnh → đoán lại. Việc chọn HƯỚNG chỉnh dựa trên ngôi sao nào?"
            options={[
              "Đại số tuyến tính",
              "Xác suất",
              "Đạo hàm",
              "Thống kê",
            ]}
            correct={2}
            explanation="Đạo hàm (độ dốc) chỉ cho máy biết đi theo hướng nào thì lỗi giảm nhanh nhất. Đây là ý tưởng cốt lõi của gradient descent — thuật toán chạy đằng sau mọi mô hình deep learning."
          />

          <InlineChallenge
            question="Bạn nhập ảnh chó vào app, app báo 'đây là chó với độ tin 0.98'. Con số 0.98 đến từ đâu?"
            options={[
              "Đạo hàm",
              "Xác suất — ước lượng máy về độ chắc chắn",
              "Thống kê mô tả",
              "Đại số tuyến tính",
            ]}
            correct={1}
            explanation="Mọi mô hình ML đều trả lời bằng xác suất. 0.98 nghĩa là 'tôi 98% tin đây là chó, 2% còn lại để ngỏ'. Không bao giờ có câu trả lời 100% tuyệt đối — đó là bản chất của ML."
          />

          <InlineChallenge
            question="Giảng viên kiểm tra app y tế: cho 500 bệnh nhân thật, đếm số lần app đoán đúng, tính tỉ lệ. Hoạt động này thuộc ngôi sao nào?"
            options={[
              "Đại số tuyến tính",
              "Xác suất",
              "Đạo hàm",
              "Thống kê mô tả",
            ]}
            correct={3}
            explanation="Đây là thống kê mô tả — đo đạc, đếm, tính trung bình trên một mẫu thật. Mọi báo cáo kết quả mô hình đều cần thống kê để người đọc biết tin bao nhiêu."
          />
        </div>
      </LessonSection>

      {/* ══════════════════ BƯỚC 6 — GIẢI THÍCH + AHA + TÓM TẮT ══════════════════ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Gắn kết">
        <AhaMoment>
          <p className="leading-relaxed">
            Bốn ngôi sao không đứng riêng lẻ —{" "}
            <strong>chúng là bốn ngôn ngữ</strong> mà ML dùng để nói
            chuyện với dữ liệu.
          </p>
          <p className="mt-2 text-sm font-normal text-muted">
            Dữ liệu bước vào bằng <strong>đại số tuyến tính</strong> →
            máy đoán bằng <strong>xác suất</strong> → sửa sai bằng{" "}
            <strong>đạo hàm</strong> → đánh giá bằng <strong>thống kê</strong>.
          </p>
        </AhaMoment>

        <div className="mt-6">
          <ExplanationSection topicSlug={metadata.slug}>
            <p className="text-sm leading-relaxed">
              Bạn không cần học sâu từng nhánh để bắt đầu. Mỗi bài sau
              trong chuỗi này sẽ chạm tới một ngôi sao ở mức vừa đủ — khi
              bạn cần, không phải khi nó còn xa. Cách làm này gọi là{" "}
              <em>just-in-time learning</em>: học đúng lúc cần.
            </p>

            <Callout variant="insight" title="Ba nguyên tắc vàng khi học toán ML">
              <ol className="list-decimal pl-5 space-y-1.5 text-sm">
                <li>
                  <strong>Hiểu ý trước, công thức sau.</strong> Biết
                  &ldquo;đạo hàm để làm gì&rdquo; quan trọng hơn biết
                  đạo hàm của sin x bằng cos x.
                </li>
                <li>
                  <strong>Hình dung trước khi tính.</strong> Mọi công
                  thức đều có một hình ảnh tương ứng. Tìm cho được hình
                  ảnh đó, tính toán theo sau.
                </li>
                <li>
                  <strong>Gặp lại là cơ hội.</strong> Không hiểu ngay
                  lần đầu là bình thường. Bài sau sẽ gặp lại, sâu hơn
                  một chút — dần bạn sẽ thấm.
                </li>
              </ol>
            </Callout>

            <Callout variant="tip" title="Lộ trình nhẹ nhàng">
              Không cần phải biết tất cả bốn ngôi sao trước khi học ML.
              Thứ tự tự nhiên:
              <ol className="list-decimal pl-5 space-y-0.5 text-sm mt-2">
                <li>Quen với đại số tuyến tính (ảnh = bảng số).</li>
                <li>
                  Làm quen với xác suất qua các ví dụ (chatbot, dự đoán
                  thời tiết).
                </li>
                <li>
                  Hiểu đạo hàm qua ẩn dụ &ldquo;leo núi&rdquo; — không
                  cần tính tay.
                </li>
                <li>
                  Học thống kê khi đánh giá mô hình (trung bình, sai số,
                  accuracy).
                </li>
              </ol>
            </Callout>

            <p className="text-sm leading-relaxed">
              Sau bài này, hãy tiếp tục tới{" "}
              <TopicLink slug="data-and-datasets">
                dữ liệu và tập dữ liệu
              </TopicLink>{" "}
              — nơi bạn sẽ thấy ngôi sao &ldquo;đại số tuyến tính&rdquo;
              được dùng thật để sắp xếp dữ liệu. Hoặc quay lại{" "}
              <TopicLink slug="what-is-ml">
                Machine Learning là gì?
              </TopicLink>{" "}
              nếu bạn muốn ôn lại nền tảng.
            </p>
          </ExplanationSection>
        </div>

        <div className="mt-6">
          <MiniSummary
            title="Bốn điều mang theo"
            points={[
              "Không cần giỏi toán để học ML — cần biết bốn ngôi sao dùng để làm gì.",
              "Đại số tuyến tính: ngôn ngữ biến mọi thứ thành số (ảnh, văn bản, âm thanh → vector/ma trận).",
              "Xác suất: máy ML luôn trả lời bằng độ tin cậy, không phải chắc nịch.",
              "Đạo hàm: la bàn trong sương mù — chỉ hướng đi để lỗi giảm khi máy đang học.",
              "Thống kê: đọc câu chuyện của dữ liệu trước và sau khi huấn luyện.",
            ]}
          />
        </div>
      </LessonSection>

      {/* ══════════════════ BƯỚC 7 — QUIZ ══════════════════ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
