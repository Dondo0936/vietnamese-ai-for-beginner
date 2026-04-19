"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserRound,
  HeartPulse,
  ShieldCheck,
  Check,
  X,
  RefreshCw,
} from "lucide-react";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  LessonSection,
  TopicLink,
  StepReveal,
  ToggleCompare,
  LaTeX,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "confusion-matrix",
  title: "Confusion Matrix",
  titleVi: "Ma trận nhầm lẫn",
  description:
    "Mô hình đoán 'có bệnh' — đúng hay sai đáng quan tâm thế nào? Bốn loại kết quả và cách ma trận 2×2 phân loại chúng.",
  category: "classic-ml",
  tags: ["evaluation", "classification", "metrics"],
  difficulty: "intermediate",
  relatedSlugs: ["logistic-regression", "cross-validation", "naive-bayes"],
  vizType: "interactive",
};

/* ────────────────────────────────────────────────────────────
   DỮ LIỆU — 20 bệnh nhân với điểm nguy cơ (score) của mô hình
   và nhãn thực tế (có bệnh / không). Dữ liệu được thiết kế để
   khi kéo ngưỡng, các ô TP/FP/FN/TN thay đổi nhịp nhàng.
   ──────────────────────────────────────────────────────────── */

type Patient = {
  id: number;
  score: number;   // điểm nguy cơ mô hình đưa ra (0 – 1)
  isSick: boolean; // sự thật
};

const PATIENTS: Patient[] = [
  { id: 1, score: 0.92, isSick: true },
  { id: 2, score: 0.88, isSick: true },
  { id: 3, score: 0.83, isSick: true },
  { id: 4, score: 0.78, isSick: true },
  { id: 5, score: 0.72, isSick: false }, // dễ báo nhầm
  { id: 6, score: 0.68, isSick: true },
  { id: 7, score: 0.63, isSick: false },
  { id: 8, score: 0.58, isSick: true },
  { id: 9, score: 0.55, isSick: false },
  { id: 10, score: 0.51, isSick: true },  // ca ranh giới
  { id: 11, score: 0.48, isSick: false },
  { id: 12, score: 0.44, isSick: true },  // ca dễ bỏ sót
  { id: 13, score: 0.40, isSick: false },
  { id: 14, score: 0.36, isSick: false },
  { id: 15, score: 0.31, isSick: false },
  { id: 16, score: 0.26, isSick: true },  // ca dễ bỏ sót
  { id: 17, score: 0.21, isSick: false },
  { id: 18, score: 0.16, isSick: false },
  { id: 19, score: 0.11, isSick: false },
  { id: 20, score: 0.06, isSick: false },
];

type Category = "TP" | "FP" | "FN" | "TN";

function categorize(patient: Patient, threshold: number): Category {
  const predictedSick = patient.score >= threshold;
  if (predictedSick && patient.isSick) return "TP";
  if (predictedSick && !patient.isSick) return "FP";
  if (!predictedSick && patient.isSick) return "FN";
  return "TN";
}

const CATEGORY_META: Record<
  Category,
  { label: string; color: string; bg: string; description: string }
> = {
  TP: {
    label: "Đoán có bệnh — đúng",
    color: "#10b981",
    bg: "#d1fae5",
    description: "Đoán 'có bệnh' và thực tế có bệnh — bắt đúng ca cần chữa.",
  },
  FP: {
    label: "Báo động giả",
    color: "#f59e0b",
    bg: "#fef3c7",
    description:
      "Đoán 'có bệnh' nhưng thực tế không bệnh — làm bệnh nhân lo và tốn xét nghiệm.",
  },
  FN: {
    label: "Bỏ sót",
    color: "#ef4444",
    bg: "#fee2e2",
    description:
      "Đoán 'không bệnh' nhưng thực tế có bệnh — nguy hiểm, bệnh nhân về nhà không được chữa.",
  },
  TN: {
    label: "Đoán không bệnh — đúng",
    color: "#3b82f6",
    bg: "#dbeafe",
    description:
      "Đoán 'không bệnh' và thực tế không bệnh — cho bệnh nhân yên tâm ra về.",
  },
};

/* ────────────────────────────────────────────────────────────
   TÍNH CHỈ SỐ
   ──────────────────────────────────────────────────────────── */

type Stats = {
  tp: number;
  fp: number;
  fn: number;
  tn: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
};

function computeStats(threshold: number): Stats {
  let tp = 0;
  let fp = 0;
  let fn = 0;
  let tn = 0;
  for (const p of PATIENTS) {
    const c = categorize(p, threshold);
    if (c === "TP") tp += 1;
    else if (c === "FP") fp += 1;
    else if (c === "FN") fn += 1;
    else tn += 1;
  }
  const total = tp + fp + fn + tn;
  const accuracy = total > 0 ? (tp + tn) / total : 0;
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 =
    precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  return { tp, fp, fn, tn, accuracy, precision, recall, f1 };
}

/* ────────────────────────────────────────────────────────────
   QUIZ
   ──────────────────────────────────────────────────────────── */

const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Một bộ lọc spam đạt 99% accuracy trên 1000 email, nhưng chỉ 12 email thực sự là spam. Nếu nó luôn đoán 'không spam', accuracy sẽ là bao nhiêu?",
    options: ["50%", "98.8%", "12%", "100%"],
    correct: 1,
    explanation:
      "988/1000 email là ham, luôn đoán 'không spam' bắt đúng 988 ca — tức 98.8% accuracy. Nhưng mô hình này bỏ sót toàn bộ 12 spam. Đây là lý do chúng ta cần ma trận nhầm lẫn và các chỉ số như Recall.",
  },
  {
    question:
      "Bạn xây dựng hệ thống sàng lọc ung thư giai đoạn sớm. Loại lỗi nào nguy hiểm hơn?",
    options: [
      "FP (báo động giả) — vì tốn thêm xét nghiệm kiểm tra",
      "FN (bỏ sót) — vì bệnh nhân về nhà không được chữa, có thể di căn",
      "Cả hai như nhau — mọi lỗi đều tệ",
      "Không có loại nào nguy hiểm — mô hình luôn đúng",
    ],
    correct: 1,
    explanation:
      "FN (bỏ sót) nguy hiểm hơn trong sàng lọc ung thư: bệnh nhân tin mình khoẻ, bỏ qua thời gian vàng. FP chỉ tốn thêm một lượt xét nghiệm xác nhận. Vì vậy hệ thống y tế ưu tiên recall cao — chấp nhận báo động giả để không bỏ sót.",
  },
  {
    question: "F1 là gì?",
    options: [
      "Trung bình cộng của Precision và Recall",
      "Trung bình điều hoà của Precision và Recall — phạt mạnh nếu một trong hai thấp",
      "Tỉ lệ dự đoán đúng trên tổng",
      "Điểm tin cậy cao nhất của mô hình",
    ],
    correct: 1,
    explanation:
      "F1 = 2·(P·R)/(P+R) là trung bình điều hoà. Nếu P hoặc R gần 0, F1 cũng gần 0. Nó hữu ích khi bạn muốn một con số duy nhất cân bằng cả hai.",
  },
  {
    type: "fill-blank",
    question:
      "Khi mô hình đoán DƯƠNG nhưng thực tế ÂM, đó là {blank}. Khi đoán ÂM nhưng thực tế DƯƠNG, đó là {blank}.",
    blanks: [
      { answer: "FP", accept: ["False Positive", "false positive", "báo động giả"] },
      { answer: "FN", accept: ["False Negative", "false negative", "bỏ sót"] },
    ],
    explanation:
      "FP = báo động giả, FN = bỏ sót. Hai loại lỗi này tốn chi phí khác nhau tuỳ bài toán — việc chọn metric phải xuất phát từ chi phí thật trong tình huống cụ thể.",
  },
  {
    question:
      "Bạn tăng ngưỡng (threshold) từ 0.3 lên 0.8. Chuyện gì xảy ra với Precision và Recall?",
    options: [
      "Cả hai đều tăng",
      "Precision tăng, Recall giảm",
      "Precision giảm, Recall tăng",
      "Cả hai đều giảm",
    ],
    correct: 1,
    explanation:
      "Ngưỡng cao → mô hình 'khó tính' → ít dự đoán dương → ít báo nhầm (Precision tăng) nhưng cũng bỏ sót thêm ca thật (Recall giảm). Đây là bản chất của đánh đổi Precision–Recall.",
  },
  {
    question:
      "Với xét nghiệm nhanh HIV sàng lọc diện rộng, nên ưu tiên metric nào?",
    options: [
      "Precision — vì báo dương tính giả tổn thương tâm lý nặng",
      "Recall — tuyệt đối không được bỏ sót ca nhiễm (sau đó có xét nghiệm xác nhận)",
      "Accuracy tuyệt đối",
      "Không cần metric, chỉ cần mô hình chạy nhanh",
    ],
    correct: 1,
    explanation:
      "HIV cần phát hiện sớm. Vì đã có Western blot xác nhận ở bước hai, xét nghiệm sàng lọc được thiết kế recall cực cao — chấp nhận FP để không bỏ sót ai. Đây là chiến lược 'lưới lớn rồi lọc'.",
  },
];

/* ════════════════════════════════════════════════════════════
   COMPONENT CHÍNH
   ════════════════════════════════════════════════════════════ */

export default function ConfusionMatrixTopic() {
  const [threshold, setThreshold] = useState(0.5);
  const stats = useMemo(() => computeStats(threshold), [threshold]);

  // Tính mô tả trạng thái ngưỡng
  const thresholdMode =
    threshold <= 0.3
      ? "Lưới rất rộng — bắt gần hết ca bệnh, nhiều báo động giả"
      : threshold <= 0.55
        ? "Cân bằng — mặc định ban đầu"
        : threshold <= 0.8
          ? "Khó tính — chỉ báo khi rất chắc, bỏ sót tăng"
          : "Quá khó tính — hầu như không báo ai, bỏ sót rất nhiều";

  const thresholdColor =
    threshold <= 0.3
      ? "#10b981"
      : threshold <= 0.55
        ? "#3b82f6"
        : threshold <= 0.8
          ? "#f59e0b"
          : "#ef4444";

  return (
    <>
      {/* ━━━ BƯỚC 1 — HOOK / DỰ ĐOÁN ━━━ */}
      <LessonSection step={1} totalSteps={8} label="Thử đoán">
        <PredictionGate
          question="Một bệnh viện có mô hình sàng lọc ung thư đạt 99% accuracy. Chỉ 2 trong 100 bệnh nhân thực sự mắc bệnh. Bạn có yên tâm với con số 99% đó?"
          options={[
            "Có — 99% rất cao, mô hình rất tốt.",
            "Không — vì nếu mô hình luôn đoán 'không bệnh', nó đã đạt 98% accuracy mà không bắt được ai.",
            "Tuỳ — cần biết mô hình chạy nhanh hay chậm.",
            "Không đủ dữ liệu để kết luận về model.",
          ]}
          correct={1}
          explanation="Đúng. Chỉ 2% bệnh nhân thật sự bệnh, nên 'luôn đoán khoẻ' vô tình đạt 98% — nhưng bỏ sót toàn bộ 2 ca bệnh. Accuracy không đủ để đánh giá. Ta cần xem mô hình sai ở đâu, không chỉ sai bao nhiêu — và đó chính là nhiệm vụ của ma trận nhầm lẫn."
        >
          <p className="text-sm text-muted mt-4 leading-relaxed">
            Bài hôm nay sẽ cho bạn chạm vào đúng bốn ô của ma trận đó. Bạn sẽ kéo một thanh ngưỡng
            và thấy 20 bệnh nhân nhảy qua lại giữa bốn ô — hiểu ngay vì sao mô hình &ldquo;khó tính&rdquo;
            khác với mô hình &ldquo;rộng lượng&rdquo;.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ BƯỚC 2 — ẨN DỤ BẰNG HÌNH ẢNH ━━━ */}
      <LessonSection step={2} totalSteps={8} label="Hiểu bằng hình ảnh">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <HeartPulse size={20} className="text-accent" /> Bốn loại kết quả khi mô hình phán đoán
          </h3>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Hãy tưởng tượng bạn là bác sĩ đang dùng một mô hình AI hỗ trợ. Với mỗi bệnh nhân, có đúng
            <strong> hai câu hỏi </strong>
            quan trọng: &ldquo;mô hình dự đoán <em>có bệnh</em> hay <em>không</em>?&rdquo; và
            &ldquo;thực tế bệnh nhân có bệnh hay không?&rdquo;. Hai câu hỏi × hai đáp án = bốn ô.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            {(Object.keys(CATEGORY_META) as Category[]).map((key) => {
              const meta = CATEGORY_META[key];
              return (
                <div
                  key={key}
                  className="rounded-xl border p-4 space-y-1.5"
                  style={{ borderLeft: `4px solid ${meta.color}`, backgroundColor: meta.bg + "55" }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full tabular-nums"
                      style={{ backgroundColor: meta.color + "22", color: meta.color }}
                    >
                      {key}
                    </span>
                    <span className="text-sm font-semibold text-foreground">{meta.label}</span>
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed">{meta.description}</p>
                </div>
              );
            })}
          </div>

          <p className="text-sm text-foreground/85 leading-relaxed">
            Lưu ý cách gọi tên: chữ <strong>T/F</strong> ở đầu nói về &ldquo;mô hình đoán có đúng không&rdquo;, chữ
            <strong> P/N </strong>
            nói về &ldquo;mô hình đoán gì&rdquo;. TP = đoán dương + đúng. FP = đoán dương + sai. Một mẹo ghi nhớ: chữ
            thứ hai (P/N) luôn là <em>dự đoán</em> của mô hình.
          </p>
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 3 — TRỰC QUAN HOÁ CHÍNH ━━━ */}
      <LessonSection step={3} totalSteps={8} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <p className="text-sm text-muted mb-4 leading-relaxed">
            Dưới đây là <strong>20 bệnh nhân</strong>. Mỗi người có một <em>điểm nguy cơ</em> do mô
            hình tính ra, từ 0 (chắc chắn khoẻ) đến 1 (chắc chắn bệnh). Bạn đặt một ngưỡng — ai vượt
            ngưỡng thì gán là &ldquo;có bệnh&rdquo;. Kéo thanh trượt và quan sát từng bệnh nhân nhảy qua lại giữa bốn ô.
          </p>

          {/* ── Slider ngưỡng ── */}
          <div className="rounded-xl border border-border bg-surface/60 p-4 mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-foreground">
                Ngưỡng quyết định
              </label>
              <span
                className="font-mono text-sm font-bold px-2 py-0.5 rounded-full tabular-nums"
                style={{
                  backgroundColor: thresholdColor + "22",
                  color: thresholdColor,
                }}
              >
                T = {threshold.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={0.05}
              max={0.95}
              step={0.01}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              aria-label="Ngưỡng"
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #10b981 0%, #3b82f6 40%, #f59e0b 70%, #ef4444 100%)`,
              }}
            />
            <div className="flex justify-between mt-1.5 text-[10px] text-tertiary">
              <span>0.05 — lưới rất rộng</span>
              <span>0.50 — mặc định</span>
              <span>0.95 — chỉ ca hiển nhiên</span>
            </div>
            <p className="text-xs text-muted mt-2 text-center italic">
              {thresholdMode}
            </p>
          </div>

          {/* ── Hàng bệnh nhân ── */}
          <div className="rounded-xl border border-border bg-card/50 p-4 mb-5">
            <p className="text-[11px] font-semibold text-tertiary uppercase tracking-wide mb-3">
              20 bệnh nhân — mỗi biểu tượng là một ca thật
            </p>
            <div className="grid grid-cols-10 gap-2">
              {PATIENTS.map((p) => {
                const c = categorize(p, threshold);
                const meta = CATEGORY_META[c];
                return (
                  <motion.div
                    key={p.id}
                    layout
                    className="flex flex-col items-center rounded-lg border p-1.5"
                    animate={{
                      backgroundColor: meta.bg,
                      borderColor: meta.color,
                    }}
                    transition={{ duration: 0.25 }}
                    title={`Bệnh nhân #${p.id} — điểm ${p.score.toFixed(2)} · ${
                      p.isSick ? "thực tế BỆNH" : "thực tế KHOẺ"
                    } · mô hình: ${c}`}
                  >
                    <UserRound size={18} style={{ color: meta.color }} />
                    <span
                      className="text-[9px] font-bold mt-0.5 tabular-nums"
                      style={{ color: meta.color }}
                    >
                      {p.score.toFixed(2)}
                    </span>
                    <span
                      className="text-[8px] font-bold mt-0.5 tabular-nums"
                      style={{ color: meta.color }}
                    >
                      {c}
                    </span>
                  </motion.div>
                );
              })}
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-3 text-[10px]">
              {(Object.keys(CATEGORY_META) as Category[]).map((key) => {
                const meta = CATEGORY_META[key];
                return (
                  <div key={key} className="flex items-center gap-1">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                    <span className="text-muted">
                      <strong style={{ color: meta.color }}>{key}</strong> — {meta.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Ma trận 2x2 sống động ── */}
          <div className="rounded-xl border border-border bg-card/50 p-4 mb-5">
            <p className="text-[11px] font-semibold text-tertiary uppercase tracking-wide mb-3 text-center">
              Ma trận nhầm lẫn 2 × 2
            </p>
            <div className="grid grid-cols-[auto_1fr_1fr] gap-1.5 max-w-md mx-auto">
              <div />
              <div className="text-[11px] font-bold text-center text-emerald-600">
                Thực tế: BỆNH
              </div>
              <div className="text-[11px] font-bold text-center text-blue-600">
                Thực tế: KHOẺ
              </div>
              <div className="text-[11px] font-bold text-right pr-2 self-center text-emerald-600">
                Đoán: BỆNH
              </div>
              <MatrixCell category="TP" count={stats.tp} />
              <MatrixCell category="FP" count={stats.fp} />
              <div className="text-[11px] font-bold text-right pr-2 self-center text-blue-600">
                Đoán: KHOẺ
              </div>
              <MatrixCell category="FN" count={stats.fn} />
              <MatrixCell category="TN" count={stats.tn} />
            </div>
          </div>

          {/* ── Các chỉ số ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <MetricCard
              label="Accuracy"
              value={stats.accuracy}
              hint="Đoán đúng bao nhiêu phần trăm?"
              color="#64748b"
            />
            <MetricCard
              label="Precision"
              value={stats.precision}
              hint="Khi báo có bệnh, đúng bao nhiêu?"
              color="#10b981"
            />
            <MetricCard
              label="Recall"
              value={stats.recall}
              hint="Bắt được bao nhiêu ca bệnh thật?"
              color="#3b82f6"
            />
            <MetricCard
              label="F1"
              value={stats.f1}
              hint="Cân bằng Precision và Recall"
              color="#a855f7"
            />
          </div>

          <Callout variant="insight" title="Quan sát quan trọng khi kéo thanh">
            Khi ngưỡng <strong>thấp</strong> (T ≤ 0.3): Precision giảm vì báo nhầm nhiều (FP cao), nhưng Recall
            gần 100% — bạn bắt gần hết người bệnh. Khi ngưỡng <strong>cao</strong> (T ≥ 0.8): Precision cao
            (hầu như đoán là chắc chắn đúng) nhưng Recall giảm — nhiều bệnh nhân thật bị bỏ sót. Không có con số
            &ldquo;đúng&rdquo; tuyệt đối — nó phụ thuộc chi phí thật của FP và FN trong bài toán cụ thể.
          </Callout>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 4 — AHA ━━━ */}
      <LessonSection step={4} totalSteps={8} label="Khoảnh khắc hiểu">
        <AhaMoment>
          Một con số <strong>Accuracy</strong> không cho bạn biết mô hình đang <em>sai ở đâu</em>.
          Mô hình có thể đạt 99% accuracy mà vẫn vô dụng nếu nó bỏ sót 100% ca bệnh.
          <br />
          <br />
          Ma trận 2 × 2 chia lỗi thành <strong>hai loại khác nhau về chất</strong>: báo động giả (FP) và
          bỏ sót (FN). Hai loại này thường có <strong>chi phí không cân bằng</strong>. Biết lỗi nào đắt hơn,
          bạn biết phải chỉnh ngưỡng bên nào.
        </AhaMoment>
      </LessonSection>

      {/* ━━━ BƯỚC 5 — ĐI SÂU: CHI PHÍ KHÔNG CÂN BẰNG ━━━ */}
      <LessonSection step={5} totalSteps={8} label="Đi sâu">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-foreground mb-2">
            Khi nào ưu tiên Recall, khi nào ưu tiên Precision?
          </h3>
          <p className="text-sm text-muted leading-relaxed mb-4">
            Hai bài toán dưới đây có vẻ giống nhau, nhưng chi phí lỗi hoàn toàn khác. Bấm qua lại để
            cảm nhận vì sao một con số metric không đủ.
          </p>
          <ToggleCompare
            labelA="Ưu tiên Recall"
            labelB="Ưu tiên Precision"
            description="Hai tình huống — hai cách cân bằng khác nhau."
            childA={
              <div className="space-y-3 text-sm text-foreground/85 leading-relaxed">
                <div className="flex items-start gap-3">
                  <HeartPulse className="text-rose-500 shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="font-semibold text-foreground">
                      Sàng lọc ung thư
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      Bỏ sót (FN) = bệnh nhân tin mình khoẻ, ung thư di căn, có thể tử vong. Báo
                      động giả (FP) chỉ tốn thêm một lượt xét nghiệm xác nhận.
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-800 p-3">
                  <p className="text-xs text-rose-700 dark:text-rose-300">
                    <strong>Chiến lược:</strong> hạ ngưỡng xuống thấp, chấp nhận nhiều FP để bảo đảm{" "}
                    <strong>Recall cao</strong>. Mô hình sàng lọc thường chỉ là bước đầu — đội y tế
                    sẽ kiểm tra kỹ những ca báo dương.
                  </p>
                </div>
              </div>
            }
            childB={
              <div className="space-y-3 text-sm text-foreground/85 leading-relaxed">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="font-semibold text-foreground">
                      Gợi ý sản phẩm trên trang chủ Tiki
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      FP = gợi ý món khách không thích, lãng phí slot quý giá và làm phiền khách.
                      FN = không gợi ý dù khách có thể thích, chỉ là cơ hội bán hàng bị bỏ qua.
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-3">
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    <strong>Chiến lược:</strong> nâng ngưỡng cao, chỉ gợi ý những món{" "}
                    <strong>rất chắc chắn</strong> khách sẽ thích — ưu tiên Precision cao, chấp nhận
                    bỏ sót nhiều cơ hội.
                  </p>
                </div>
              </div>
            }
          />
        </div>

        {/* Real-world matrix table: four industries side by side */}
        <div className="mt-6">
          <h3 className="text-base font-semibold text-foreground mb-2">
            Bốn bài toán thực tế — cùng công cụ, bốn chiến lược khác nhau
          </h3>
          <p className="text-sm text-muted leading-relaxed mb-3">
            Mỗi ngành nghề có cấu trúc chi phí FP / FN riêng. Bảng dưới đây tóm tắt cách bốn lĩnh
            vực quen thuộc chọn metric ưu tiên và vì sao.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <IndustryCase
              emoji="🏥"
              name="Sàng lọc ung thư"
              fpCost="Thêm một lượt xét nghiệm xác nhận"
              fnCost="Bỏ sót bệnh nhân — có thể tử vong"
              priority="Recall cao"
              color="#ef4444"
            />
            <IndustryCase
              emoji="📨"
              name="Lọc spam email công ty"
              fpCost="Xoá nhầm email khách hàng quan trọng"
              fnCost="Spam lọt vào hộp thư — bất tiện nhưng không nguy hiểm"
              priority="Precision cao"
              color="#10b981"
            />
            <IndustryCase
              emoji="💳"
              name="Phát hiện gian lận thẻ"
              fpCost="Chặn giao dịch thật — khách bực, có thể đổi ngân hàng"
              fnCost="Để lọt gian lận — thẻ bị hack, thiệt hại tiền thật"
              priority="Cân bằng F-beta (β≈0.5) — ưu tiên Precision nhẹ"
              color="#f59e0b"
            />
            <IndustryCase
              emoji="🚨"
              name="Cảnh báo cháy rừng"
              fpCost="Triển khai xe cứu hoả không cần thiết (tốn nhân lực)"
              fnCost="Bỏ sót đám cháy — thiệt hại rất lớn, bất khả hồi phục"
              priority="Recall rất cao"
              color="#dc2626"
            />
          </div>
        </div>

        <div className="mt-5">
          <h3 className="text-base font-semibold text-foreground mb-2">
            Bốn bước đọc một ma trận nhầm lẫn lạ
          </h3>
          <p className="text-sm text-muted leading-relaxed mb-3">
            Khi bạn gặp một báo cáo mô hình mới, đây là thứ tự bạn nên kiểm tra:
          </p>
          <StepReveal
            labels={[
              "Bước 1: Nhìn FN",
              "Bước 2: Nhìn FP",
              "Bước 3: So sánh chi phí",
              "Bước 4: Chỉnh ngưỡng",
            ]}
          >
            {[
              <div
                key="s1"
                className="rounded-lg bg-surface/60 border border-border p-4"
              >
                <p className="text-sm text-foreground leading-relaxed">
                  <strong>Có bao nhiêu ca bệnh bị bỏ sót?</strong> Đây là con số quan trọng nhất
                  trong y tế, an ninh, phát hiện gian lận. Nếu FN quá cao, bạn biết ngay rằng mô
                  hình đang quá dè dặt.
                </p>
              </div>,
              <div
                key="s2"
                className="rounded-lg bg-surface/60 border border-border p-4"
              >
                <p className="text-sm text-foreground leading-relaxed">
                  <strong>Bao nhiêu ca bị báo nhầm?</strong> Mỗi FP có cái giá: bệnh nhân lo lắng,
                  khách hàng phàn nàn, email quan trọng bị xoá. Đếm xem con số này có chấp nhận
                  được không.
                </p>
              </div>,
              <div
                key="s3"
                className="rounded-lg bg-surface/60 border border-border p-4"
              >
                <p className="text-sm text-foreground leading-relaxed">
                  <strong>Chi phí FP và FN có cân bằng không?</strong> Nếu một FN = 10 FP về tổn
                  thất thật, mô hình tối ưu Accuracy sẽ cho kết quả tệ. Bạn cần chọn metric khớp
                  với chi phí — thường là Recall, Precision, hoặc F-beta.
                </p>
              </div>,
              <div
                key="s4"
                className="rounded-lg bg-surface/60 border border-border p-4"
              >
                <p className="text-sm text-foreground leading-relaxed">
                  <strong>Kéo ngưỡng theo hướng cần thiết.</strong> Bỏ sót nhiều quá &rArr; hạ
                  ngưỡng. Báo nhầm nhiều quá &rArr; nâng ngưỡng. Đừng đổi mô hình trước khi thử
                  điều chỉnh thanh trượt này — đó là cách rẻ nhất.
                </p>
              </div>,
            ]}
          </StepReveal>
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 6 — THỬ THÁCH ━━━ */}
      <LessonSection step={6} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Với xét nghiệm nhanh HIV cho mục đích sàng lọc diện rộng ở cộng đồng, bạn nên ưu tiên metric nào?"
          options={[
            "Precision — vì báo dương tính giả gây tổn thương tâm lý",
            "Recall — tuyệt đối không bỏ sót ca nhiễm (xét nghiệm xác nhận sẽ làm sau)",
            "Accuracy đơn thuần",
            "Không quan trọng — mô hình nào cũng được",
          ]}
          correct={1}
          explanation="HIV cần phát hiện càng sớm càng tốt. Sau xét nghiệm nhanh dương tính, sẽ có Western blot/PCR xác nhận — nên FP có thể sửa được. Nhưng FN (bỏ sót) khiến người nhiễm tiếp tục lây và không được điều trị. Vì vậy xét nghiệm sàng lọc thường được thiết kế Recall cực cao (~99%), chấp nhận Precision thấp hơn một chút."
        />

        <div className="mt-5">
          <InlineChallenge
            question="Một nhóm phát hiện gian lận thẻ tín dụng thấy mô hình đang chặn nhầm 30% giao dịch hợp pháp (FP cao) nhưng vẫn để lọt 5% gian lận (FN thấp). Họ nên làm gì trước?"
            options={[
              "Nâng ngưỡng để giảm FP — khách hàng đang bị làm phiền quá mức",
              "Hạ ngưỡng để giảm FN — lọt gian lận là tuyệt đối không được",
              "Đổi sang mô hình hoàn toàn khác",
              "Không làm gì — 5% lọt là chấp nhận được",
            ]}
            correct={0}
            explanation="30% FP là thảm hoạ trải nghiệm: khách hàng bị chặn thẻ khi mua cà phê, họ sẽ đổi ngân hàng. Trong khi 5% FN đã ở mức thấp và có hệ thống kiểm tra thứ cấp (SMS xác nhận, khoá thẻ chờ) bắt những ca lọt. Chỉnh ngưỡng cao lên là việc rẻ nhất — đổi mô hình là lựa chọn cuối cùng, sau khi mọi thanh trượt đều đã thử."
          />
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 7 — GIẢI THÍCH (công thức + trực quan) ━━━ */}
      <LessonSection step={7} totalSteps={8} label="Giải thích">
        <ExplanationSection topicSlug={metadata.slug}>
          <p className="leading-relaxed">
            Bốn ô TP, FP, FN, TN sinh ra ba chỉ số thường dùng nhất. Mỗi công thức đi kèm một câu
            giải thích bằng tiếng Việt thường ngày — bạn không cần nhớ công thức nếu nhớ ý nghĩa.
          </p>

          <div className="rounded-xl border border-border bg-surface/40 p-5 my-4 space-y-5">
            {/* Precision */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  Precision
                </span>
                <span className="text-xs text-muted">(độ chính xác của dự đoán dương)</span>
              </div>
              <LaTeX block>
                {"\\text{Precision} = \\frac{TP}{TP + FP}"}
              </LaTeX>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Trong <strong>mọi lần mô hình báo có bệnh</strong>, bao nhiêu phần trăm là đúng?
                Precision cao = mô hình ít báo nhầm.
              </p>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-muted">Ví dụ hình dung:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="h-5 w-5 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: i <= 4 ? "#10b981" : "#f59e0b",
                        color: "white",
                      }}
                    >
                      {i <= 4 ? <Check size={12} /> : <X size={12} />}
                    </div>
                  ))}
                </div>
                <span className="text-[11px] text-muted">
                  Mô hình báo 5 ca → 4 đúng, 1 nhầm → Precision = 4/5 = 80%.
                </span>
              </div>
            </div>

            {/* Recall */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  Recall
                </span>
                <span className="text-xs text-muted">(tỉ lệ bắt được ca bệnh)</span>
              </div>
              <LaTeX block>
                {"\\text{Recall} = \\frac{TP}{TP + FN}"}
              </LaTeX>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Trong <strong>tất cả người thực sự có bệnh</strong>, bao nhiêu phần trăm bị mô
                hình bắt được? Recall cao = mô hình ít bỏ sót.
              </p>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-muted">Ví dụ hình dung:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="h-5 w-5 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: i <= 3 ? "#3b82f6" : "#ef4444",
                        color: "white",
                      }}
                    >
                      <UserRound size={12} />
                    </div>
                  ))}
                </div>
                <span className="text-[11px] text-muted">
                  Có 5 người bệnh → mô hình bắt được 3, bỏ sót 2 → Recall = 3/5 = 60%.
                </span>
              </div>
            </div>

            {/* F1 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                  F1
                </span>
                <span className="text-xs text-muted">(một con số cân bằng cả hai)</span>
              </div>
              <LaTeX block>
                {"F_1 = 2 \\cdot \\frac{\\text{Precision} \\cdot \\text{Recall}}{\\text{Precision} + \\text{Recall}}"}
              </LaTeX>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Trung bình điều hoà của Precision và Recall. Nếu một trong hai rất thấp, F1 cũng
                sẽ thấp — khác với trung bình cộng (bị lừa khi một bên cao bù một bên thấp).
              </p>
              <div className="mt-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-2">
                <p className="text-[11px] text-purple-700 dark:text-purple-300">
                  Ví dụ: Precision = 0.9, Recall = 0.1. Trung bình cộng = 0.5 (nghe tốt), nhưng F1
                  = 0.18 (phản ánh đúng việc mô hình bỏ sót 90% ca bệnh).
                </p>
              </div>
            </div>
          </div>

          {/* Venn-like visual: which cells does each metric 'see'? */}
          <div className="rounded-xl border border-border bg-surface/40 p-5 my-6">
            <p className="text-sm font-semibold text-foreground mb-3">
              Mỗi chỉ số nhìn vào một phần khác của ma trận
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <MetricFocus
                title="Precision"
                color="#10b981"
                highlight={["TP", "FP"]}
                note="Nhìn cột 'đoán dương' — cộng TP và FP, hỏi tỉ lệ đúng."
              />
              <MetricFocus
                title="Recall"
                color="#3b82f6"
                highlight={["TP", "FN"]}
                note="Nhìn hàng 'thực tế dương' — cộng TP và FN, hỏi bắt được bao nhiêu."
              />
              <MetricFocus
                title="Accuracy"
                color="#a855f7"
                highlight={["TP", "TN"]}
                note="Nhìn đường chéo — tỉ lệ cả TP và TN trên tổng."
              />
            </div>
            <p className="text-xs text-muted leading-relaxed mt-3 italic">
              Vì Precision và Recall nhìn các phần khác nhau của ma trận, chúng có thể cùng cao,
              cùng thấp, hoặc ngược chiều — phụ thuộc cách mô hình phân bố lỗi. Luôn xem cả ba con
              số để tránh mù điểm.
            </p>
          </div>

          {/* Cost-based decision helper */}
          <h4 className="text-sm font-semibold text-foreground mt-6 mb-2">
            Công thức ngón tay cái: khi FP và FN có chi phí khác nhau
          </h4>
          <p className="text-sm leading-relaxed">
            Nếu một lỗi FN tốn chi phí <strong>C<sub>FN</sub></strong> và một lỗi FP tốn{" "}
            <strong>C<sub>FP</sub></strong>, chi phí kỳ vọng trên mỗi dự đoán là:
          </p>
          <div className="rounded-xl border border-border bg-surface/40 p-4 my-3 text-center">
            <span className="font-mono text-sm text-foreground">
              Cost = C<sub>FN</sub> × (số ca FN) + C<sub>FP</sub> × (số ca FP)
            </span>
          </div>
          <p className="text-sm leading-relaxed">
            Khi bạn không chắc &ldquo;nên ưu tiên Precision hay Recall&rdquo;, hãy ước lượng hai con
            số <strong>C<sub>FN</sub></strong> và <strong>C<sub>FP</sub></strong>:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
            <CostExample
              title="Sàng lọc ung thư"
              cFn="10 000 (tổn thương sức khoẻ nặng, mất thời gian vàng)"
              cFp="200 (một lượt xét nghiệm bổ sung)"
              conclusion="C_FN / C_FP = 50 → hạ ngưỡng, ưu tiên Recall rất cao."
              color="#ef4444"
            />
            <CostExample
              title="Gợi ý sản phẩm"
              cFn="1 (chỉ là cơ hội bán hàng bị bỏ qua)"
              cFp="5 (slot gợi ý trên trang chủ là tài nguyên khan hiếm)"
              conclusion="C_FN / C_FP ≈ 0.2 → nâng ngưỡng, ưu tiên Precision cao."
              color="#10b981"
            />
          </div>

          <Callout variant="warning" title="Bẫy Accuracy với dữ liệu mất cân bằng">
            Với dữ liệu mà lớp dương chỉ chiếm 1–5% (spam, gian lận, bệnh hiếm), mô hình luôn đoán
            &ldquo;âm&rdquo; đạt 95–99% accuracy nhưng Recall = 0%. Đây là <strong>sai lầm tuyển dụng ML</strong>
            phổ biến nhất. Luôn đi kèm Precision, Recall, F1 — và với dữ liệu rất mất cân bằng, xem cả{" "}
            <TopicLink slug="cross-validation">cross-validation</TopicLink> để đảm bảo ổn định.
          </Callout>

          <Callout variant="info" title="Nhiều lớp, không chỉ 2 × 2">
            Với K lớp (ví dụ phân loại chữ số 0–9), ma trận là K × K. Mỗi hàng là lớp thực tế, mỗi
            cột là lớp dự đoán. Precision/Recall/F1 tính riêng cho mỗi lớp, rồi tổng hợp bằng{" "}
            <em>macro-average</em> (trung bình đều) hoặc <em>weighted-average</em> (có trọng số theo
            số mẫu).
          </Callout>

          <p className="mt-4 leading-relaxed">
            Ma trận nhầm lẫn là cánh cửa đầu tiên để hiểu hiệu suất phân loại. Khi bạn đã quen, hãy
            xem thêm{" "}
            <TopicLink slug="logistic-regression">hồi quy logistic</TopicLink> — mô hình sinh ra
            điểm xác suất mà chúng ta đang đặt ngưỡng ở đây. Sau đó{" "}
            <TopicLink slug="cross-validation">cross-validation</TopicLink> giúp bạn ước lượng các
            chỉ số một cách ổn định, không bị lừa bởi một tập test may mắn.
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 8 — TÓM TẮT + QUIZ ━━━ */}
      <LessonSection step={8} totalSteps={8} label="Tóm tắt & Kiểm tra">
        <MiniSummary
          title="5 điều cần nhớ về ma trận nhầm lẫn"
          points={[
            "Mỗi dự đoán rơi vào đúng một trong bốn ô: TP, FP, FN, TN. Ma trận này là nguồn gốc của mọi chỉ số.",
            "Accuracy có thể lừa bạn khi dữ liệu mất cân bằng — hãy luôn nhìn Precision, Recall cùng lúc.",
            "Precision = 'khi tôi báo dương, tôi đúng bao nhiêu?'. Recall = 'trong các ca dương thật, tôi bắt được bao nhiêu?'.",
            "Ngưỡng là cái nút trực tiếp: nâng lên → Precision tăng, Recall giảm. Hạ xuống → Recall tăng, Precision giảm.",
            "Chọn metric khớp chi phí thật: y tế → Recall, gợi ý sản phẩm → Precision, nhiều bài toán chung → F1.",
          ]}
        />

        <Callout variant="tip" title="Xem ứng dụng thực tế">
          Câu chuyện COVID-19 RT-PCR và nghịch lý sàng lọc diện rộng:{" "}
          <TopicLink slug="confusion-matrix-in-medical-testing">
            Ma trận nhầm lẫn trong xét nghiệm y tế
          </TopicLink>
          .
        </Callout>

        <QuizSection questions={quizQuestions} />

        <div className="mt-6 flex items-center justify-center">
          <div className="flex items-center gap-2 text-xs text-muted">
            <RefreshCw size={12} />
            Bạn có thể làm lại quiz bất cứ lúc nào.
          </div>
        </div>
      </LessonSection>
    </>
  );
}

/* ────────────────────────────────────────────────────────────
   COMPONENT PHỤ — IndustryCase
   ──────────────────────────────────────────────────────────── */

function IndustryCase({
  emoji,
  name,
  fpCost,
  fnCost,
  priority,
  color,
}: {
  emoji: string;
  name: string;
  fpCost: string;
  fnCost: string;
  priority: string;
  color: string;
}) {
  return (
    <div
      className="rounded-xl border p-3 space-y-2 bg-card"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl">{emoji}</span>
        <span className="text-sm font-semibold text-foreground">{name}</span>
      </div>
      <div className="text-[11px] text-foreground/80 leading-relaxed space-y-1">
        <p>
          <strong className="text-amber-600">Chi phí FP:</strong> {fpCost}
        </p>
        <p>
          <strong className="text-red-600">Chi phí FN:</strong> {fnCost}
        </p>
      </div>
      <div
        className="text-[11px] font-bold px-2 py-1 rounded-full inline-block"
        style={{ backgroundColor: color + "22", color }}
      >
        Chiến lược: {priority}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   COMPONENT PHỤ — MetricFocus: mini 2x2 highlighting cells
   ──────────────────────────────────────────────────────────── */

function MetricFocus({
  title,
  color,
  highlight,
  note,
}: {
  title: string;
  color: string;
  highlight: Category[];
  note: string;
}) {
  return (
    <div className="rounded-xl border p-3 bg-card" style={{ borderColor: color + "55" }}>
      <div className="flex items-center gap-2 mb-2">
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: color + "22", color }}
        >
          {title}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1.5 mb-2">
        {(["TP", "FP", "FN", "TN"] as Category[]).map((cell) => {
          const isHighlight = highlight.includes(cell);
          return (
            <div
              key={cell}
              className="rounded border p-2 text-center text-[10px] font-bold"
              style={{
                borderColor: isHighlight ? color : "var(--border)",
                backgroundColor: isHighlight ? color + "22" : "var(--bg-surface)",
                color: isHighlight ? color : "var(--text-muted)",
                opacity: isHighlight ? 1 : 0.45,
              }}
            >
              {cell}
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-foreground/75 leading-relaxed">{note}</p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   COMPONENT PHỤ — CostExample
   ──────────────────────────────────────────────────────────── */

function CostExample({
  title,
  cFn,
  cFp,
  conclusion,
  color,
}: {
  title: string;
  cFn: string;
  cFp: string;
  conclusion: string;
  color: string;
}) {
  return (
    <div
      className="rounded-xl border p-3 space-y-2"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div className="text-sm font-semibold text-foreground">{title}</div>
      <div className="text-[11px] text-foreground/80 leading-relaxed space-y-1">
        <p>
          <strong className="text-red-600">C<sub>FN</sub>:</strong> {cFn}
        </p>
        <p>
          <strong className="text-amber-600">C<sub>FP</sub>:</strong> {cFp}
        </p>
      </div>
      <p className="text-[11px] font-semibold" style={{ color }}>
        {conclusion}
      </p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   COMPONENT PHỤ — ô ma trận
   ──────────────────────────────────────────────────────────── */

function MatrixCell({
  category,
  count,
}: {
  category: Category;
  count: number;
}) {
  const meta = CATEGORY_META[category];
  return (
    <motion.div
      layout
      className="rounded-lg border-2 p-3 text-center min-h-[86px] flex flex-col justify-center"
      style={{
        borderColor: meta.color,
        backgroundColor: meta.bg + "55",
      }}
      transition={{ duration: 0.25 }}
    >
      <div
        className="text-[10px] font-bold uppercase tracking-wide"
        style={{ color: meta.color }}
      >
        {category}
      </div>
      <motion.div
        key={count}
        initial={{ scale: 1.3, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="text-2xl font-bold my-0.5"
        style={{ color: meta.color }}
      >
        {count}
      </motion.div>
      <div className="text-[10px] text-foreground/70 leading-tight">
        {meta.label}
      </div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────
   COMPONENT PHỤ — thẻ chỉ số
   ──────────────────────────────────────────────────────────── */

function MetricCard({
  label,
  value,
  hint,
  color,
}: {
  label: string;
  value: number;
  hint: string;
  color: string;
}) {
  return (
    <div
      className="rounded-lg border p-3 bg-card"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div className="text-xs font-semibold text-muted uppercase tracking-wide">
        {label}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={value.toFixed(2)}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="text-xl font-bold tabular-nums"
          style={{ color }}
        >
          {(value * 100).toFixed(1)}%
        </motion.div>
      </AnimatePresence>
      <div className="text-[10px] text-muted leading-tight mt-0.5">
        {hint}
      </div>
    </div>
  );
}
