"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Thermometer, Sparkles, Dice5, Target, Flame, Snowflake } from "lucide-react";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  LaTeX,
  SliderGroup,
  SplitView,
  LessonSection,
  TopicLink,
  ProgressSteps,
  CollapsibleDetail,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "temperature",
  title: "Temperature",
  titleVi: "Temperature — Nhiệt độ sinh văn bản",
  description:
    "Tham số kiểm soát mức độ ngẫu nhiên khi mô hình chọn từ tiếp theo — ảnh hưởng đến sự sáng tạo và chính xác.",
  category: "llm-concepts",
  tags: ["temperature", "sampling", "llm", "generation"],
  difficulty: "beginner",
  relatedSlugs: ["top-k-top-p", "hallucination", "prompt-engineering"],
  vizType: "interactive",
};

/* ────────────────────────────────────────────────────────────
   DỮ LIỆU: logits thô — điểm số mà mô hình gán cho mỗi token
   trước khi đi qua softmax để thành xác suất.
   ──────────────────────────────────────────────────────────── */
const WORDS = ["phở", "cơm", "bún", "bánh mì", "xôi"];
const BASE_LOGITS = [3.5, 2.8, 2.0, 1.5, 0.8];

const COLORS = ["#0D9488", "#2563EB", "#7C3AED", "#D97706", "#DC2626"];

/**
 * Softmax với temperature. Đây là công thức cốt lõi:
 *   P(w_i) = exp(z_i / T) / Σ exp(z_j / T)
 *
 * - T → 0 : phân phối sụp về argmax (chỉ token cao nhất).
 * - T = 1 : softmax "chuẩn".
 * - T → ∞ : phân phối tiến về uniform (đều).
 *
 * Dùng kỹ thuật "trừ max" để tránh tràn số khi exp.
 */
function softmaxWithTemp(logits: number[], temp: number): number[] {
  if (temp <= 0.01) {
    const maxIdx = logits.indexOf(Math.max(...logits));
    return logits.map((_, i) => (i === maxIdx ? 1 : 0));
  }
  const scaled = logits.map((l) => l / temp);
  const maxScaled = Math.max(...scaled);
  const exps = scaled.map((l) => Math.exp(l - maxScaled));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

/** Entropy Shannon (bits) — đo "độ phẳng" của phân phối. */
function entropy(probs: number[]): number {
  return -probs.reduce((acc, p) => acc + (p > 0 ? p * Math.log2(p) : 0), 0);
}

/* ────────────────────────────────────────────────────────────
   DEMO: 3 mức sinh câu thực tế với cùng prefix
   ──────────────────────────────────────────────────────────── */
const SENTENCE_START = "Sáng nay tôi ăn";

const GENERATIONS: Record<"low" | "medium" | "high", string[]> = {
  low: [
    "Sáng nay tôi ăn phở bò. Nước dùng nóng hổi, thơm mùi quế.",
    "Sáng nay tôi ăn phở gà. Gà luộc mềm, nước trong vắt.",
    "Sáng nay tôi ăn phở bò tái. Quán quen đầu ngõ, như mọi ngày.",
  ],
  medium: [
    "Sáng nay tôi ăn cơm tấm sườn bì chả. Miếng sườn nướng vàng ươm trên than hồng.",
    "Sáng nay tôi ăn bún chả Hà Nội. Thịt nướng thơm lừng quyện nước mắm chua ngọt.",
    "Sáng nay tôi ăn bánh cuốn Thanh Trì. Lá bánh mỏng tang, nhân thịt vừa miệng.",
  ],
  high: [
    "Sáng nay tôi ăn sương sớm trên đồi chè. Giọt sương tan trên lưỡi như trà ướp hương nhài.",
    "Sáng nay tôi ăn một bản nhạc — nốt do rải trên lát bánh mì nướng vàng giòn.",
    "Sáng nay tôi ăn ánh nắng xuyên qua rèm cửa. Chén cháo trắng sáng như trăng rằm.",
  ],
};

/* Ví dụ use-case để gợi ý người dùng chọn temperature phù hợp. */
const USE_CASES: { task: string; recommended: number; why: string; icon: string }[] = [
  {
    task: "Sinh code Python/TypeScript",
    recommended: 0.1,
    why: "Code có cú pháp cứng — lệch một ký tự là lỗi. Cần chọn token xác suất cao.",
    icon: "💻",
  },
  {
    task: "Trích xuất trường JSON từ hoá đơn",
    recommended: 0.0,
    why: "Output phải deterministic để pipeline xuôi dòng có thể parse.",
    icon: "📄",
  },
  {
    task: "Tóm tắt bài báo khoa học",
    recommended: 0.4,
    why: "Cần trung thành với nội dung gốc nhưng diễn đạt mạch lạc.",
    icon: "📰",
  },
  {
    task: "Viết email công việc",
    recommended: 0.6,
    why: "Cân bằng giữa rõ ràng và không khô khan như máy.",
    icon: "✉️",
  },
  {
    task: "Brainstorm slogan quảng cáo",
    recommended: 1.1,
    why: "Muốn đa dạng, bất ngờ — chấp nhận vài phương án dở để tìm ra 1 viên ngọc.",
    icon: "💡",
  },
  {
    task: "Sáng tác thơ lục bát",
    recommended: 1.3,
    why: "Sáng tạo ngôn từ là mục tiêu. Nhưng nếu quá cao → vô nghĩa.",
    icon: "📜",
  },
];

/* Các mốc "trạng thái nhiệt" — nhãn mô tả cho mỗi khoảng T. */
type TempBand = "frozen" | "cool" | "warm" | "hot" | "molten";
function bandFromTemp(t: number): TempBand {
  if (t <= 0.05) return "frozen";
  if (t <= 0.4) return "cool";
  if (t <= 0.9) return "warm";
  if (t <= 1.4) return "hot";
  return "molten";
}

const BAND_META: Record<TempBand, { label: string; desc: string; color: string; emoji: string }> = {
  frozen: {
    label: "Đông cứng",
    desc: "Luôn chọn token xác suất cao nhất. Output giống hệt nhau mỗi lần.",
    color: "#3b82f6",
    emoji: "🧊",
  },
  cool: {
    label: "Lạnh — an toàn",
    desc: "Ít ngẫu nhiên. Phù hợp code, trích xuất dữ liệu, phân loại.",
    color: "#06b6d4",
    emoji: "❄️",
  },
  warm: {
    label: "Ấm — cân bằng",
    desc: "Mặc định cho hội thoại, email, Q&A. Đa dạng vừa phải.",
    color: "#f59e0b",
    emoji: "🌤️",
  },
  hot: {
    label: "Nóng — sáng tạo",
    desc: "Nhiều biến thể. Phù hợp viết quảng cáo, brainstorm, sáng tác.",
    color: "#ef4444",
    emoji: "🔥",
  },
  molten: {
    label: "Nung chảy — hỗn loạn",
    desc: "Gần như uniform. Thường cho ra văn bản vô nghĩa — ít khi hữu dụng.",
    color: "#dc2626",
    emoji: "💥",
  },
};

/* ────────────────────────────────────────────────────────────
   QUIZ — 7 câu, pha trộn MCQ và điền chỗ trống
   ──────────────────────────────────────────────────────────── */
const quizQuestions: QuizQuestion[] = [
  {
    question: "Temperature = 0 có nghĩa là gì?",
    options: [
      "AI không hoạt động",
      "AI luôn chọn từ có xác suất cao nhất — output cố định, không ngẫu nhiên",
      "AI sinh văn bản nhanh hơn",
      "AI trả lời bằng tiếng Anh",
    ],
    correct: 1,
    explanation:
      "Temperature = 0 khiến softmax trở thành argmax: luôn chọn từ xác suất cao nhất. Cùng input → cùng output mỗi lần (giả sử không có random seed khác).",
  },
  {
    question: "Khi nào nên dùng temperature cao (0.9–1.3)?",
    options: [
      "Viết code sản xuất",
      "Trả lời câu hỏi khoa học cần độ chính xác cao",
      "Sáng tác thơ, brainstorm slogan, viết truyện",
      "Trích xuất dữ liệu từ bảng CSV",
    ],
    correct: 2,
    explanation:
      "Temperature cao làm phân phối phẳng hơn → mở rộng không gian lựa chọn, tăng đa dạng. Đây là điều bạn muốn khi cần ý tưởng mới, không phải khi cần đáp án chính xác.",
  },
  {
    question: "Temperature tác động lên phần nào của LLM?",
    options: [
      "Kích thước mô hình (số tham số)",
      "Phân phối xác suất của token kế tiếp (chia logits trước softmax)",
      "Tốc độ xử lý GPU",
      "Độ dài context window",
    ],
    correct: 1,
    explanation:
      "Temperature chỉ là hằng số chia logits: P(w) = softmax(logit/T). Nó không ảnh hưởng kích thước, tốc độ, hay context — chỉ điều chỉnh độ nhọn của phân phối sampling.",
  },
  {
    question: "Điều gì xảy ra với entropy của phân phối khi T tăng từ 0.5 lên 2.0?",
    options: [
      "Entropy giảm — phân phối nhọn hơn",
      "Entropy tăng — phân phối phẳng hơn, gần uniform hơn",
      "Entropy không đổi",
      "Entropy dao động ngẫu nhiên",
    ],
    correct: 1,
    explanation:
      "Entropy đo 'độ không chắc chắn'. T cao làm phân phối phẳng hơn → entropy tiệm cận log₂(N) (uniform). T → 0 làm entropy tiệm cận 0 (xác định hoàn toàn).",
  },
  {
    question:
      "Một startup dùng LLM tóm tắt báo cáo tài chính. Khách hàng phản ánh rằng cùng một báo cáo lại cho các tóm tắt khác nhau mỗi lần chạy. Nguyên nhân gốc có thể là gì?",
    options: [
      "Báo cáo thay đổi giữa các lần gọi",
      "LLM bị hỏng",
      "Temperature đang được đặt quá cao — nên hạ xuống 0 hoặc 0.1 cho task trích xuất/tóm tắt",
      "Cần dùng mô hình khác ngay lập tức",
    ],
    correct: 2,
    explanation:
      "Tóm tắt tài chính là task cần ổn định, có thể kiểm toán. Temperature mặc định (1.0) cho output biến thiên. Hạ xuống gần 0 để đảm bảo kết quả lặp lại được.",
  },
  {
    type: "code",
    question: "Điền vào đoạn softmax có temperature: chia logits cho T rồi đưa vào softmax.",
    codeTemplate:
      "import numpy as np\n# Softmax với temperature\nscaled = logits / ___\nexps = np.exp(scaled - scaled.max())\nprobs = exps / exps.___()",
    language: "python",
    blanks: [
      { answer: "T", accept: ["temperature", "temp", "t"] },
      { answer: "sum", accept: [] },
    ],
    explanation:
      "Softmax với temperature: P(w_i) = exp(z_i / T) / Σ exp(z_j / T). Trừ max trước exp là mẹo tránh tràn số, không làm thay đổi kết quả vì hằng số triệt tiêu.",
  },
  {
    question:
      "Với logits = [3.5, 2.8, 2.0, 1.5, 0.8] và T = 1, token nào có xác suất cao nhất?",
    options: [
      "Token đầu tiên (logit 3.5) — khoảng 48%",
      "Token cuối (logit 0.8)",
      "Tất cả đều bằng nhau",
      "Không thể biết nếu chưa chạy",
    ],
    correct: 0,
    explanation:
      "Softmax giữ nguyên thứ tự ranking của logits. Logit lớn nhất → xác suất lớn nhất. Với khoảng cách 0.7 giữa top-1 và top-2, softmax(T=1) ~ 48% cho top-1.",
  },
];

/* ────────────────────────────────────────────────────────────
   COMPONENT CHÍNH
   ──────────────────────────────────────────────────────────── */
export default function TemperatureTopic() {
  const [temp, setTemp] = useState(1.0);
  const [genMode, setGenMode] = useState<"low" | "medium" | "high">("medium");
  const [genIdx, setGenIdx] = useState(0);
  const [rollCount, setRollCount] = useState(0);
  const [showEntropy, setShowEntropy] = useState(true);

  const probs = useMemo(() => softmaxWithTemp(BASE_LOGITS, temp), [temp]);
  const H = useMemo(() => entropy(probs), [probs]);
  const Hmax = useMemo(() => Math.log2(WORDS.length), []);
  const band = bandFromTemp(temp);
  const bandInfo = BAND_META[band];

  const tempLabel =
    temp <= 0.3
      ? "Rất thấp — luôn chọn từ an toàn nhất"
      : temp <= 0.7
        ? "Thấp — ít ngẫu nhiên, khá ổn định"
        : temp <= 1.0
          ? "Mặc định — cân bằng sáng tạo và ổn định"
          : temp <= 1.5
            ? "Cao — nhiều ngẫu nhiên, sáng tạo hơn"
            : "Rất cao — gần như ngẫu nhiên, có thể vô nghĩa";

  const regenerate = useCallback(() => {
    const key = temp <= 0.3 ? "low" : temp <= 1.0 ? "medium" : "high";
    setGenMode(key);
    setGenIdx((i) => (i + 1) % 3);
    setRollCount((c) => c + 1);
  }, [temp]);

  /* Mô phỏng sampling: chọn index theo phân phối xác suất. */
  const [sampled, setSampled] = useState<number[]>([]);
  const rollDice = useCallback(() => {
    const r = Math.random();
    let cum = 0;
    for (let i = 0; i < probs.length; i++) {
      cum += probs[i];
      if (r <= cum) {
        setSampled((prev) => [...prev.slice(-11), i]);
        return;
      }
    }
    setSampled((prev) => [...prev.slice(-11), probs.length - 1]);
  }, [probs]);

  useEffect(() => {
    setSampled([]);
  }, [temp]);

  return (
    <>
      {/* ━━━ HOOK — Dự đoán trước khi học ━━━ */}
      <LessonSection step={1} totalSteps={8} label="Thử đoán">
        <PredictionGate
          question="Bạn yêu cầu AI hoàn thành câu: 'Sáng nay tôi ăn ___'. Chạy 3 lần — nhưng AI trả lời khác nhau mỗi lần! Tại sao cùng câu hỏi mà kết quả khác nhau?"
          options={[
            "AI bị lỗi",
            "AI dùng một tham số 'ngẫu nhiên' gọi là temperature để thay đổi kết quả",
            "AI tìm kiếm trên Internet mỗi lần",
            "AI quên câu trả lời trước đó",
          ]}
          correct={1}
          explanation="Chính xác! Temperature là tham số điều chỉnh mức độ 'ngẫu nhiên' khi AI chọn từ tiếp theo. Temperature thấp → luôn chọn 'phở' (an toàn). Temperature cao → có thể chọn 'xôi', 'bánh mì', hay thậm chí 'ánh nắng' (sáng tạo bất ngờ)!"
        >
          <p className="text-sm text-muted mt-4">
            Hãy tự mình kéo thanh temperature và xem xác suất chọn từ thay đổi trực tiếp.
            Đây là tham số duy nhất bạn cần điều chỉnh để thay đổi tính cách của LLM.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ LIÊN HỆ ĐỜI SỐNG ━━━ */}
      <LessonSection step={2} totalSteps={8} label="Liên hệ">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Flame size={18} className="text-accent" /> Núm chỉnh vị cho quán phở
          </h3>
          <p className="text-sm text-foreground/80 leading-relaxed">
            Hãy tưởng tượng một quán phở có <strong>núm chỉnh vị</strong>. Vặn về mức "0": đầu bếp
            luôn nấu công thức gốc, tô nào cũng giống hệt tô nào — khách quen thì hài lòng, nhưng
            không có bất ngờ. Vặn lên "1": đầu bếp thay đổi chút ít — hôm nay thêm lát hành tây,
            mai bớt chút mắm — vẫn là phở, vẫn ngon, nhưng có cá tính riêng từng tô.
          </p>
          <p className="text-sm text-foreground/80 leading-relaxed">
            Vặn lên "1.5": đầu bếp bắt đầu thử nghiệm — thêm gừng nướng, đổi rau thơm. Có tô tuyệt
            vời, có tô khách bỏ dở. Vặn về "2": đầu bếp ngẫu hứng hoàn toàn — phở gà với kim chi,
            phở bò rưới caramel. Có thể là đặc sản lạ, có thể là thảm hoạ ẩm thực.
          </p>
          <p className="text-sm text-foreground/80 leading-relaxed">
            Temperature trong LLM hoạt động y như vậy. Nó không thay đổi "đầu bếp" (mô hình), không
            thay đổi "nguyên liệu" (context), chỉ thay đổi <strong>mức độ sẵn sàng chấp nhận rủi
            ro</strong>{" "}khi chọn nguyên liệu kế tiếp. Thấp = an toàn, lặp lại. Cao = sáng tạo,
            không dự đoán được.
          </p>
          <p className="text-sm text-foreground/80 leading-relaxed italic text-muted">
            Vấn đề không phải "temperature nào là tốt nhất" — mà là "task của tôi cần độ sáng tạo
            bao nhiêu". Code cần 0. Thơ cần 1.2. Email cần 0.6. Đó là nghề của kỹ sư prompt.
          </p>
        </div>
      </LessonSection>

      {/* ━━━ KHÁM PHÁ — Biểu đồ xác suất trực tiếp ━━━ */}
      <LessonSection step={3} totalSteps={8} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
            <div>
              <h3 className="text-base font-semibold text-foreground mb-0.5">
                Xác suất chọn từ tiếp theo
              </h3>
              <p className="text-sm text-muted">
                Câu: &quot;{SENTENCE_START}{" "}___&quot; — kéo temperature để thấy phân phối biến dạng.
              </p>
            </div>
            <div
              className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5"
              style={{ backgroundColor: bandInfo.color + "20", color: bandInfo.color }}
            >
              <span>{bandInfo.emoji}</span>
              <span>{bandInfo.label}</span>
            </div>
          </div>

          {/* Biểu đồ thanh chính */}
          <svg viewBox="0 0 500 260" className="w-full max-w-lg mx-auto mb-2">
            {/* Trục y với các mốc 0 / 25 / 50 / 75 / 100% */}
            {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
              const y = 210 - frac * 160;
              return (
                <g key={frac}>
                  <line x1={60} y1={y} x2={460} y2={y} stroke="var(--border)" strokeWidth={0.5} strokeDasharray="2,3" opacity={0.5} />
                  <text x={54} y={y + 3} textAnchor="end" fontSize={9} fill="var(--text-tertiary)">
                    {Math.round(frac * 100)}%
                  </text>
                </g>
              );
            })}
            {/* Trục x */}
            <line x1={60} y1={210} x2={460} y2={210} stroke="var(--border)" strokeWidth={1} />

            {WORDS.map((word, i) => {
              const barWidth = 60;
              const gap = 20;
              const x = 80 + i * (barWidth + gap);
              const maxHeight = 160;
              const height = probs[i] * maxHeight;
              const y = 210 - height;

              return (
                <g key={word}>
                  <motion.rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={height}
                    rx={4}
                    fill={COLORS[i]}
                    initial={false}
                    animate={{ y, height }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                  <motion.text
                    x={x + barWidth / 2}
                    y={y - 6}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight={600}
                    fill="var(--text-primary)"
                    initial={false}
                    animate={{ y: y - 6 }}
                  >
                    {(probs[i] * 100).toFixed(1)}%
                  </motion.text>
                  <text
                    x={x + barWidth / 2}
                    y={228}
                    textAnchor="middle"
                    fontSize={12}
                    fill="var(--text-secondary)"
                  >
                    {word}
                  </text>
                  <text
                    x={x + barWidth / 2}
                    y={244}
                    textAnchor="middle"
                    fontSize={9}
                    fill="var(--text-tertiary)"
                  >
                    z={BASE_LOGITS[i].toFixed(1)}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Thanh temperature */}
          <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Thermometer size={16} className="text-accent" />
                <span className="text-sm font-medium text-foreground">Temperature T</span>
              </div>
              <span className="text-sm font-bold text-accent tabular-nums">{temp.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={2}
              step={0.05}
              value={temp}
              onChange={(e) => setTemp(parseFloat(e.target.value))}
              className="w-full h-2 rounded-full appearance-none bg-surface accent-accent cursor-pointer"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-tertiary flex items-center gap-0.5">
                <Snowflake size={9} /> 0 (cố định)
              </span>
              <span className="text-[10px] text-tertiary">1 (mặc định)</span>
              <span className="text-[10px] text-tertiary flex items-center gap-0.5">
                <Flame size={9} /> 2 (rất ngẫu nhiên)
              </span>
            </div>
            <p className="text-xs text-muted mt-2 text-center italic">{tempLabel}</p>
          </div>

          {/* Panel phụ: entropy + sampling */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 max-w-lg mx-auto">
            <div className="rounded-lg bg-surface/50 border border-border p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-foreground">Entropy Shannon</span>
                <button
                  type="button"
                  onClick={() => setShowEntropy((v) => !v)}
                  className="text-[10px] text-accent hover:underline"
                >
                  {showEntropy ? "ẩn" : "hiện"}
                </button>
              </div>
              {showEntropy && (
                <>
                  <div className="relative h-2 rounded-full bg-border overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 to-orange-500 rounded-full"
                      animate={{ width: `${(H / Hmax) * 100}%` }}
                      transition={{ type: "spring", stiffness: 200, damping: 25 }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-[10px] text-tertiary">
                    <span>H = {H.toFixed(3)} bits</span>
                    <span>Hmax = {Hmax.toFixed(3)} bits</span>
                  </div>
                  <p className="text-[10px] text-muted mt-1.5 leading-snug">
                    H thấp → phân phối nhọn (xác định). H cao → phân phối phẳng (ngẫu nhiên).
                  </p>
                </>
              )}
            </div>

            <div className="rounded-lg bg-surface/50 border border-border p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-foreground flex items-center gap-1">
                  <Dice5 size={12} /> Lấy mẫu
                </span>
                <button
                  type="button"
                  onClick={rollDice}
                  className="text-[10px] bg-accent text-white px-2 py-0.5 rounded-md hover:bg-accent-dark"
                >
                  Gieo
                </button>
              </div>
              <div className="flex flex-wrap gap-1 min-h-[32px]">
                <AnimatePresence>
                  {sampled.map((idx, i) => (
                    <motion.span
                      key={`${i}-${idx}`}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                      style={{ backgroundColor: COLORS[idx] + "30", color: COLORS[idx] }}
                    >
                      {WORDS[idx]}
                    </motion.span>
                  ))}
                </AnimatePresence>
                {sampled.length === 0 && (
                  <span className="text-[10px] text-tertiary italic">
                    Nhấn "Gieo" để lấy mẫu theo phân phối hiện tại.
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted mt-1.5 leading-snug">
                Gieo nhiều lần: T thấp → hầu hết ra &quot;phở&quot;. T cao → mọi từ đều xuất hiện.
              </p>
            </div>
          </div>

          {/* Diễn giải band hiện tại */}
          <div
            className="mt-3 max-w-lg mx-auto rounded-lg p-3 text-xs leading-relaxed"
            style={{
              backgroundColor: bandInfo.color + "10",
              borderLeft: `3px solid ${bandInfo.color}`,
              color: "var(--text-primary)",
            }}
          >
            <strong style={{ color: bandInfo.color }}>
              {bandInfo.emoji} {bandInfo.label}:
            </strong>{" "}
            {bandInfo.desc}
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ AHA MOMENT ━━━ */}
      <LessonSection step={4} totalSteps={8} label="Khoảnh khắc hiểu">
        <AhaMoment>
          Temperature kiểm soát <strong>độ nhọn</strong>{" "}của phân phối xác suất.
          Thấp → phân phối nhọn, luôn chọn từ xác suất cao nhất.
          Cao → phân phối phẳng, mọi từ đều có cơ hội — sáng tạo nhưng rủi ro hơn.
          <br />
          <br />
          Nhớ một công thức: <LaTeX>{"P(w_i) \\propto e^{z_i / T}"}</LaTeX>. Chia logit cho T trước
          softmax — thế thôi. Cả bí ẩn nằm trong phép chia đơn giản này.
        </AhaMoment>
      </LessonSection>

      {/* ━━━ ĐI SÂU — So sánh output thực tế ━━━ */}
      <LessonSection step={5} totalSteps={8} label="Đi sâu">
        <h3 className="text-base font-semibold text-foreground mb-3">
          Output thực tế ở 3 mức temperature
        </h3>

        <SplitView
          leftLabel="Temperature = 0.2 (An toàn)"
          rightLabel="Temperature = 1.5 (Sáng tạo)"
          left={
            <div className="space-y-2">
              {GENERATIONS.low.map((gen, i) => (
                <p
                  key={i}
                  className="text-xs text-foreground/80 leading-relaxed border-b border-border pb-2 last:border-0"
                >
                  {gen}
                </p>
              ))}
              <p className="text-[10px] text-tertiary italic">
                3 lần chạy → gần như giống nhau (luôn chọn &quot;phở&quot;)
              </p>
            </div>
          }
          right={
            <div className="space-y-2">
              {GENERATIONS.high.map((gen, i) => (
                <p
                  key={i}
                  className="text-xs text-foreground/80 leading-relaxed border-b border-border pb-2 last:border-0"
                >
                  {gen}
                </p>
              ))}
              <p className="text-[10px] text-tertiary italic">
                3 lần chạy → rất khác nhau, sáng tạo nhưng có thể vô nghĩa
              </p>
            </div>
          }
        />

        {/* Bảng gợi ý use-case */}
        <div className="mt-5 rounded-xl border border-border bg-card p-4">
          <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
            <Target size={14} className="text-accent" /> Gợi ý temperature theo tác vụ
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {USE_CASES.map((uc) => (
              <div
                key={uc.task}
                className="flex items-start gap-2 rounded-lg bg-surface/50 border border-border p-2.5"
              >
                <span className="text-lg leading-none shrink-0 mt-0.5">{uc.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-foreground truncate">{uc.task}</span>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded tabular-nums shrink-0"
                      style={{
                        backgroundColor: BAND_META[bandFromTemp(uc.recommended)].color + "20",
                        color: BAND_META[bandFromTemp(uc.recommended)].color,
                      }}
                    >
                      T = {uc.recommended.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted mt-1 leading-snug">{uc.why}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Regenerate button */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={regenerate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent text-white text-xs font-medium px-3 py-1.5 hover:bg-accent-dark"
          >
            <Sparkles size={12} />
            Sinh lại ví dụ (T={temp.toFixed(1)})
          </button>
          <span className="text-[10px] text-tertiary">Đã sinh {rollCount} lần</span>
        </div>
        {rollCount > 0 && (
          <p className="mt-2 text-xs text-foreground/80 leading-relaxed italic text-center">
            “{GENERATIONS[genMode][genIdx]}”
          </p>
        )}
      </LessonSection>

      {/* ━━━ THỬ THÁCH ━━━ */}
      <LessonSection step={6} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Bạn muốn AI viết code Python chính xác. Nên đặt temperature bao nhiêu?"
          options={[
            "Temperature = 1.5 (sáng tạo tối đa)",
            "Temperature = 0–0.2 (chính xác, ít ngẫu nhiên)",
            "Temperature = 1.0 (mặc định)",
            "Không quan trọng, temperature không ảnh hưởng code",
          ]}
          correct={1}
          explanation="Code cần chính xác, không cần sáng tạo. Temperature thấp (0–0.2) giúp AI chọn token có xác suất cao nhất, giảm lỗi. Đó là lý do Cursor và GitHub Copilot thường dùng temperature rất thấp."
        />

        <div className="mt-4">
          <InlineChallenge
            question="Bạn chạy LLM với T=0 và vẫn thấy output khác nhau giữa các lần. Nguyên nhân khả dĩ nhất?"
            options={[
              "T=0 vẫn luôn random — không có cách nào khắc phục",
              "Hai token cùng logit cao nhất, tie-break khác nhau; hoặc pipeline có random ở tầng khác (tokenizer, batching)",
              "Mô hình đang học",
              "GPU quá nóng",
            ]}
            correct={1}
            explanation="T=0 chỉ làm deterministic phép chọn sau softmax. Nếu có hai logit sát nhau, tie-break có thể khác. Hơn nữa, non-determinism có thể đến từ floating-point ở các cuộn batch khác nhau. Đặt seed + T=0 vẫn chưa đảm bảo bit-identical với mọi backend."
          />
        </div>

        <div className="mt-4">
          <InlineChallenge
            question="Nếu bạn muốn output luôn giống nhau (reproducible) cho cùng một prompt, bạn phải làm gì?"
            options={[
              "Đặt temperature = 1",
              "Đặt temperature = 0 và (với nhiều API) cung cấp seed cố định",
              "Gửi request vào ban đêm",
              "Tăng max_tokens",
            ]}
            correct={1}
            explanation="Temperature = 0 làm argmax. Kết hợp seed cố định (ở các API hỗ trợ như OpenAI) giúp tăng khả năng lặp lại. Với Claude, T=0 thường đủ cho phần lớn tình huống thực tiễn."
          />
        </div>
      </LessonSection>

      {/* ━━━ GIẢI THÍCH CHÍNH THỨC ━━━ */}
      <LessonSection step={7} totalSteps={8} label="Giải thích">
        <ExplanationSection>
          <p>
            <strong>Temperature</strong> là tham số chia logits (điểm thô) trước khi đưa vào hàm
            softmax để tạo phân phối xác suất trên từ vựng. Nó thường đi kèm với{" "}
            <TopicLink slug="top-k-top-p">top-k / top-p sampling</TopicLink> để kiểm soát độ đa dạng
            output, và là một công cụ quan trọng trong{" "}
            <TopicLink slug="prompt-engineering">prompt engineering</TopicLink> để cân bằng giữa
            sáng tạo và chính xác.
          </p>

          <Callout variant="insight" title="Công thức Softmax có Temperature">
            <LaTeX block>
              {"P(w_i \\mid \\text{context}) = \\frac{\\exp(z_i / T)}{\\sum_{j=1}^{|V|} \\exp(z_j / T)}"}
            </LaTeX>
            <p className="text-sm mt-2">
              Trong đó <LaTeX>{"z_i"}</LaTeX> là logit (điểm thô) của từ <LaTeX>{"w_i"}</LaTeX>,{" "}
              <LaTeX>{"T"}</LaTeX> là temperature, và <LaTeX>{"|V|"}</LaTeX> là kích thước từ vựng.
            </p>
          </Callout>

          <p>
            <strong>Ba chế độ giới hạn:</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>
              <LaTeX>{"T \\to 0^{+}"}</LaTeX>: phân phối sụp về argmax — phương thức
              &quot;greedy decoding&quot;.
            </li>
            <li>
              <LaTeX>{"T = 1"}</LaTeX>: phân phối softmax &quot;chuẩn&quot; — trung thành với
              mô hình.
            </li>
            <li>
              <LaTeX>{"T \\to \\infty"}</LaTeX>: phân phối tiệm cận uniform — hoàn toàn ngẫu
              nhiên.
            </li>
          </ul>

          <ProgressSteps
            current={4}
            total={4}
            labels={[
              "Tính logits từ mô hình",
              "Chia logits cho T",
              "Áp softmax để có xác suất",
              "Lấy mẫu theo phân phối (hoặc argmax)",
            ]}
          />

          <p className="text-sm mt-4">
            <strong>Hướng dẫn chọn temperature:</strong>
          </p>
          <div className="overflow-x-auto my-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 text-muted font-medium">Temperature</th>
                  <th className="text-left py-2 pr-4 text-muted font-medium">Đặc điểm</th>
                  <th className="text-left py-2 text-muted font-medium">Dùng khi</th>
                </tr>
              </thead>
              <tbody className="text-foreground/80">
                <tr className="border-b border-border">
                  <td className="py-2 pr-4 font-medium">0 – 0.3</td>
                  <td className="py-2 pr-4">Cố định, chính xác</td>
                  <td className="py-2">Code, data extraction, phân loại, unit test</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 pr-4 font-medium">0.4 – 0.8</td>
                  <td className="py-2 pr-4">Cân bằng</td>
                  <td className="py-2">Viết email, tóm tắt, Q&A, hội thoại</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 pr-4 font-medium">0.9 – 1.3</td>
                  <td className="py-2 pr-4">Sáng tạo, đa dạng</td>
                  <td className="py-2">Thơ, quảng cáo, brainstorm, truyện ngắn</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium">&gt; 1.5</td>
                  <td className="py-2 pr-4">Gần ngẫu nhiên</td>
                  <td className="py-2">Thường không hữu ích — output vô nghĩa</td>
                </tr>
              </tbody>
            </table>
          </div>

          <CodeBlock language="python" title="temperature_demo.py — so sánh hai mức">{`from anthropic import Anthropic

client = Anthropic()

def ask(prompt: str, temperature: float) -> str:
    """Gọi Claude với temperature tuỳ chỉnh."""
    resp = client.messages.create(
        model="claude-sonnet-4-20250514",
        temperature=temperature,
        max_tokens=80,
        messages=[{"role": "user", "content": prompt}],
    )
    return resp.content[0].text

# Temperature thấp — ổn định, chính xác
for i in range(3):
    print(f"[T=0.1 #{i}]", ask("2 + 2 = ?", 0.1))

# Temperature cao — sáng tạo, đa dạng
for i in range(3):
    print(f"[T=1.2 #{i}]", ask("Viết 1 câu thơ về Hà Nội mùa thu", 1.2))`}</CodeBlock>

          <CodeBlock language="python" title="implementation.py — cách cài đặt từ số 0">{`import numpy as np

def softmax_with_temperature(logits: np.ndarray, T: float) -> np.ndarray:
    """
    Softmax có temperature.
    - T → 0: argmax (greedy)
    - T = 1: softmax chuẩn
    - T → ∞: uniform
    """
    if T <= 1e-6:
        # Tránh chia cho 0 — trả về one-hot trên argmax
        out = np.zeros_like(logits, dtype=float)
        out[np.argmax(logits)] = 1.0
        return out

    # Chia logits cho T
    scaled = logits / T
    # Trừ max để ổn định số học (không đổi kết quả)
    scaled = scaled - scaled.max()
    # Exp và chuẩn hoá
    exps = np.exp(scaled)
    return exps / exps.sum()


def sample_token(probs: np.ndarray, rng: np.random.Generator) -> int:
    """Chọn một index theo phân phối probs."""
    return int(rng.choice(len(probs), p=probs))


# Ví dụ: 5 token với logits cho trước
logits = np.array([3.5, 2.8, 2.0, 1.5, 0.8])
rng = np.random.default_rng(42)

for T in [0.1, 0.7, 1.5]:
    probs = softmax_with_temperature(logits, T)
    counts = np.zeros(5, dtype=int)
    for _ in range(1000):
        counts[sample_token(probs, rng)] += 1
    print(f"T={T}: probs={probs.round(3)} | counts/1000={counts}")`}</CodeBlock>

          <CodeBlock language="python" title="entropy.py — đo độ phẳng của phân phối">{`import numpy as np

def entropy_bits(probs: np.ndarray) -> float:
    """Entropy Shannon tính bằng bits."""
    p = probs[probs > 0]
    return float(-(p * np.log2(p)).sum())


logits = np.array([3.5, 2.8, 2.0, 1.5, 0.8])
H_max = np.log2(len(logits))  # Entropy cực đại khi uniform

for T in [0.01, 0.3, 0.7, 1.0, 1.5, 2.5]:
    probs = softmax_with_temperature(logits, T)
    H = entropy_bits(probs)
    print(f"T={T:<5} H={H:.3f} bits ({100 * H / H_max:.1f}% của Hmax)")`}</CodeBlock>

          <Callout variant="info" title="Temperature vs. Top-k vs. Top-p">
            Ba tham số sampling thường bị nhầm:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                <strong>Temperature</strong>: làm cong lại phân phối (thay đổi độ nhọn).
              </li>
              <li>
                <strong>Top-k</strong>: chỉ giữ k token cao nhất, bỏ phần đuôi.
              </li>
              <li>
                <strong>Top-p (nucleus)</strong>: giữ token cho đến khi tổng xác suất ≥ p.
              </li>
            </ul>
            Ba cái thường dùng cùng nhau. Xem{" "}
            <TopicLink slug="top-k-top-p">Top-k / Top-p</TopicLink> để hiểu sự phối hợp.
          </Callout>

          <Callout variant="tip" title="Mẹo thực chiến">
            Khi gỡ lỗi output của LLM, <em>đầu tiên</em> hãy đặt <code>temperature=0</code>. Nếu
            output vẫn xấu → vấn đề ở prompt hoặc mô hình, không phải random. Chỉ tăng temperature
            khi bạn đã chắc prompt đúng và muốn đa dạng hoá.
          </Callout>

          <Callout variant="warning" title="Cảnh báo với task đánh giá / phân loại">
            Với task bắt đầu bằng &quot;Hãy đánh giá...&quot; hoặc &quot;Phân loại...&quot; (LLM as
            judge), <strong>luôn đặt T=0</strong>. Temperature cao sẽ làm điểm số dao động giữa các
            lần chạy — phá vỡ tính tái lập của benchmark.
          </Callout>

          <Callout variant="insight" title="Vì sao công thức lại là chia cho T, không phải nhân?">
            Suy nghĩ theo hướng &quot;làm phẳng&quot;: khi T lớn, logits lớn/nhỏ đều được co về gần
            0 (chia cho số lớn). Sau exp, sự chênh lệch giữa các token bị nén — phân phối phẳng
            hơn. Ngược lại, T nhỏ phóng đại chênh lệch — phân phối nhọn hơn. Phép chia là cách tự
            nhiên nhất để tạo hiệu ứng co giãn này.
          </Callout>

          <CollapsibleDetail title="Lịch sử & nguồn gốc từ vật lý thống kê">
            <p className="text-sm leading-relaxed">
              Tên &quot;temperature&quot; mượn từ phân bố Boltzmann trong vật lý thống kê:{" "}
              <LaTeX>{"P(s) \\propto e^{-E(s)/(k_B T)}"}</LaTeX>, với <LaTeX>{"E(s)"}</LaTeX> là
              năng lượng trạng thái và <LaTeX>{"T"}</LaTeX> là nhiệt độ. Khi nhiệt độ cao, hệ có
              khuynh hướng phân bố trên nhiều trạng thái (hỗn loạn). Khi nhiệt độ thấp, hệ tập
              trung ở trạng thái năng lượng thấp nhất (có trật tự).
            </p>
            <p className="text-sm leading-relaxed mt-2">
              Áp dụng vào mạng neural, &quot;năng lượng&quot; tương đương âm-logit, và nhiệt độ
              điều khiển độ chắc chắn. Bài báo Hinton về knowledge distillation (2015) là nơi
              temperature được đưa vào deep learning lần đầu với mục đích &quot;làm mềm&quot; phân
              phối teacher để student học được cả các tín hiệu yếu.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Temperature trong knowledge distillation">
            <p className="text-sm leading-relaxed">
              Trong distillation, model nhỏ (student) học từ model lớn (teacher). Nếu teacher đã
              quá chắc chắn (T=1, argmax ~ 99%), student gần như chỉ thấy one-hot — mất tín hiệu
              phong phú trong các lớp &quot;gần đúng&quot;. Giải pháp: chạy teacher với T=5 hoặc
              T=10 để &quot;mềm hoá&quot; phân phối. Student học với cùng T. Sau đó ở inference,
              student chạy với T=1.
            </p>
            <p className="text-sm leading-relaxed mt-2">
              Công thức loss distillation thường là:{" "}
              <LaTeX>{"\\mathcal{L} = \\alpha \\cdot \\text{CE}(y, p_s) + (1-\\alpha) \\cdot T^2 \\cdot \\text{KL}(p_t^{(T)} \\Vert p_s^{(T)})"}</LaTeX>
              , với <LaTeX>{"T^2"}</LaTeX> là hệ số cân bằng gradient.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Temperature scaling cho calibration">
            <p className="text-sm leading-relaxed">
              Mạng neural hiện đại thường <em>over-confident</em>: dự đoán xác suất 95% nhưng thực
              tế chỉ đúng 75%. Guo et al. 2017 đề xuất &quot;Temperature scaling&quot;: sau khi
              huấn luyện, học một T duy nhất trên tập validation để chia logits, sao cho phân phối
              được calibrated — expected calibration error (ECE) nhỏ nhất. Đây là kỹ thuật post-hoc
              cực kỳ đơn giản, không cần retrain, mà hiệu quả cho các tác vụ quan trọng như y tế,
              tài chính.
            </p>
          </CollapsibleDetail>

          <p className="text-sm mt-4">
            <strong>Ứng dụng thực tế:</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>
              <strong>Copilot / Cursor</strong>: T ~ 0.1–0.2 cho hoàn thành code chính xác.
            </li>
            <li>
              <strong>ChatGPT / Claude.ai</strong>: T mặc định ~ 0.7–1.0 cho hội thoại tự nhiên.
            </li>
            <li>
              <strong>AI Dungeon / NovelAI</strong>: T ~ 0.9–1.3 cho sáng tác truyện, kết hợp top-p
              để tránh từ vô nghĩa.
            </li>
            <li>
              <strong>AlphaGo / RL</strong>: temperature annealing — bắt đầu cao (exploration) rồi
              hạ dần về 0 (exploitation) khi huấn luyện xong.
            </li>
            <li>
              <strong>LLM as judge</strong>: T=0 bắt buộc để điểm số nhất quán giữa các lần chấm.
            </li>
            <li>
              <strong>Distillation</strong>: T cao trên teacher để học sinh hấp thụ dark knowledge.
            </li>
          </ul>

          <p className="text-sm mt-4">
            <strong>Bẫy thường gặp:</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>
              <strong>Tin rằng T=0 = deterministic tuyệt đối</strong>: sai. Floating point + tie
              logits + batching có thể gây bất định ngay cả khi T=0. Muốn hoàn toàn lặp lại cần
              seed + môi trường giống nhau.
            </li>
            <li>
              <strong>Dùng T quá cao cho task lý luận</strong>: LLM có thể &quot;ảo giác&quot;
              (hallucinate) nhiều hơn khi T cao, vì nó sẵn sàng chọn token có xác suất thấp — và
              token sai thường nằm ở đó.
            </li>
            <li>
              <strong>Dùng T quá thấp cho hội thoại</strong>: làm bot trở nên cứng nhắc, lặp lại,
              và dễ mắc kẹt trong các cụm từ yêu thích của mô hình.
            </li>
            <li>
              <strong>Kết hợp T cao với top-p=1.0</strong>: gần như chắc chắn cho output vô nghĩa
              vì mở cửa cho toàn bộ từ vựng, kể cả các token rất hiếm.
            </li>
            <li>
              <strong>Không phân biệt T của sampler với T của distillation</strong>: chúng khác
              nhau về mục đích và cách tối ưu.
            </li>
          </ul>

          <p className="text-sm mt-4">
            <strong>So với các phương án khác:</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>
              <strong>Beam search</strong>: không dùng temperature, duy trì top-B chuỗi rồi chọn
              chuỗi có likelihood cao nhất. Phù hợp dịch máy, không phù hợp sáng tạo.
            </li>
            <li>
              <strong>Top-k sampling</strong>: cắt đuôi cố định. Đơn giản nhưng không phản ánh được
              độ tự tin thay đổi theo ngữ cảnh.
            </li>
            <li>
              <strong>Top-p (nucleus)</strong>: cắt đuôi thích ứng — giữ đủ token để tổng xác suất
              ≥ p. Thường được ưa dùng cùng temperature.
            </li>
            <li>
              <strong>Typical sampling</strong>: chọn token có information content gần entropy
              trung bình. Hiếm dùng trong sản phẩm.
            </li>
            <li>
              <strong>Min-p sampling</strong>: giữ token có xác suất ≥ p × max. Phương pháp mới hơn
              của cộng đồng open-source.
            </li>
          </ul>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ TÓM TẮT + QUIZ ━━━ */}
      <LessonSection step={8} totalSteps={8} label="Tổng kết">
        <MiniSummary
          points={[
            "Temperature chia logits trước softmax: T thấp → phân phối nhọn (chính xác), T cao → phẳng (sáng tạo)",
            "T = 0: luôn chọn từ xác suất cao nhất → output gần như cố định, dùng cho code và trích xuất dữ liệu",
            "T = 0.5–0.8: cân bằng, dùng cho email, tóm tắt, hỏi đáp, hội thoại",
            "T > 1.0: nhiều ngẫu nhiên, dùng cho sáng tác, brainstorm — nhưng tăng nguy cơ hallucination",
            "Entropy là thước đo khách quan cho độ phẳng: thấp = xác định, cao = hỗn loạn",
            "Temperature thường được dùng cùng top-k / top-p để kiểm soát cả độ nhọn lẫn phần đuôi",
          ]}
        />

        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
