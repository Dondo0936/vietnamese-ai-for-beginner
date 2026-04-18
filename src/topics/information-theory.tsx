"use client";

import { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  LaTeX,
  TopicLink,
  CollapsibleDetail,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// METADATA — giữ nguyên schema cũ để index/search hoạt động
// ─────────────────────────────────────────────────────────────────────────────
export const metadata: TopicMeta = {
  slug: "information-theory",
  title: "Information Theory",
  titleVi: "Lý thuyết thông tin",
  description:
    "Entropy, cross-entropy và KL divergence — đo lường thông tin và so sánh phân phối xác suất",
  category: "math-foundations",
  tags: ["entropy", "kl-divergence", "cross-entropy"],
  difficulty: "intermediate",
  relatedSlugs: ["loss-functions", "probability-statistics", "vae"],
  vizType: "interactive",
  tocSections: [{ id: "explanation", labelVi: "Giải thích" }],
};

const TOTAL_STEPS = 5;

// ─────────────────────────────────────────────────────────────────────────────
// PRESETS cho Entropy Explorer
// ─────────────────────────────────────────────────────────────────────────────
// Mỗi preset đại diện cho một "loại" phân phối xác suất để người học
// chuyển qua lại và quan sát entropy thay đổi.
type Preset = {
  id: string;
  label: string;
  probs: number[];
  note: string;
};

const PRESETS: Preset[] = [
  {
    id: "uniform",
    label: "Đồng đều (max entropy)",
    probs: [0.25, 0.25, 0.25, 0.25],
    note: "4 sự kiện đồng khả năng — bất định tối đa, H = 2 bit.",
  },
  {
    id: "peaked",
    label: "Peaked (gần chắc chắn)",
    probs: [0.85, 0.07, 0.05, 0.03],
    note: "1 sự kiện chiếm ưu thế — entropy thấp, dễ dự đoán.",
  },
  {
    id: "bimodal",
    label: "Bimodal (2 đỉnh)",
    probs: [0.45, 0.45, 0.05, 0.05],
    note: "Hai sự kiện đồng ưu thế — entropy trung bình-cao.",
  },
  {
    id: "skewed",
    label: "Lệch (skewed)",
    probs: [0.6, 0.2, 0.15, 0.05],
    note: "Phân phối lệch dần — thường gặp trong dữ liệu thực.",
  },
  {
    id: "deterministic",
    label: "Chắc chắn (H = 0)",
    probs: [1, 0, 0, 0],
    note: "Xác suất 1 cho 1 sự kiện — không có bất định, H = 0.",
  },
];

// Nhãn cho từng lớp/sự kiện. Dùng màu để phân biệt khi vẽ bars.
const CLASS_LABELS = ["A", "B", "C", "D"] as const;
const CLASS_COLORS = [
  "bg-accent",
  "bg-blue-500",
  "bg-amber-500",
  "bg-green-500",
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// HÀM TOÁN — entropy, cross-entropy, KL divergence
// ─────────────────────────────────────────────────────────────────────────────
// Tất cả đều dùng log2 để đơn vị là "bit" — trực quan hơn cho người học.
// Với nat, chỉ cần chia cho ln(2).
const LN2 = Math.log(2);
const EPS = 1e-12; // tránh log(0)

function log2(x: number) {
  return Math.log(x + EPS) / LN2;
}

// Shannon entropy: H(p) = -Σ p_i * log2(p_i)
function entropy(p: number[]): number {
  return -p.reduce((sum, pi) => (pi > 0 ? sum + pi * log2(pi) : sum), 0);
}

// Cross-entropy: H(p, q) = -Σ p_i * log2(q_i)
// Nếu q_i = 0 trong khi p_i > 0 → infinite. Ta gán một giá trị rất lớn để UI không break.
function crossEntropy(p: number[], q: number[]): number {
  let s = 0;
  for (let i = 0; i < p.length; i++) {
    if (p[i] > 0) {
      if (q[i] <= 0) return Infinity;
      s += p[i] * log2(q[i]);
    }
  }
  return -s;
}

// KL divergence: D(p || q) = Σ p_i * log2(p_i / q_i) = H(p, q) - H(p)
function klDivergence(p: number[], q: number[]): number {
  const ce = crossEntropy(p, q);
  if (!isFinite(ce)) return Infinity;
  return ce - entropy(p);
}

// Chuẩn hoá: đảm bảo tổng = 1. Dùng mỗi lần người dùng sửa thanh slider.
function normalize(probs: number[]): number[] {
  const s = probs.reduce((a, b) => a + b, 0);
  if (s <= 0) return probs.map(() => 1 / probs.length);
  return probs.map((p) => p / s);
}

// Surprise (self-information) của một sự kiện: -log2(p).
// Sự kiện hiếm → surprise lớn. Sự kiện chắc chắn → surprise 0.
function surprise(pi: number): number {
  if (pi <= 0) return Infinity;
  return -log2(pi);
}

// Format số có dấu phẩy đẹp, dùng "—" cho NaN/Infinity.
function fmt(n: number, digits = 3): string {
  if (!isFinite(n)) return "∞";
  return n.toFixed(digits);
}

// Sampling từ phân phối p — dùng cho "random sampler" bên dưới.
// Trả về chỉ số lớp được chọn.
function sample(p: number[]): number {
  const r = Math.random();
  let cum = 0;
  for (let i = 0; i < p.length; i++) {
    cum += p[i];
    if (r < cum) return i;
  }
  return p.length - 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// QUIZ — 8 CÂU HỎI
// ─────────────────────────────────────────────────────────────────────────────
function useQuizQuestions(): QuizQuestion[] {
  return useMemo<QuizQuestion[]>(
    () => [
      {
        question: "Entropy H(X) cao nghĩa là gì?",
        options: [
          "Data có nhiều noise",
          "Độ bất định cao: khó dự đoán kết quả. Đồng xu công bằng H = 1 bit (bất định nhất). Đồng xu 2 mặt giống nhau: H = 0 (chắc chắn)",
          "Model tốt",
        ],
        correct: 1,
        explanation:
          "Entropy = độ bất định / lượng thông tin trung bình. H cao = bất định cao = cần nhiều bit để mã hoá. Đồng xu: H = 1. Xúc xắc: H ≈ 2.58. Sự kiện chắc chắn: H = 0. Trong ML: decision tree chọn feature giảm entropy nhiều nhất (information gain).",
      },
      {
        question: "Cross-Entropy H(p, q) đo gì?",
        options: [
          "Entropy của p",
          "Số bits cần để mã hoá data từ phân phối p DÙNG phân phối q. Càng gần: CE thấp. Càng xa: CE cao. Đây là loss function cho classification!",
          "Entropy của q",
        ],
        correct: 1,
        explanation:
          "H(p, q) = -Σ p·log(q). Nếu q = p (model perfect): H(p, q) = H(p) (minimum). Nếu q khác p: H(p, q) > H(p). Phần thừa chính là KL divergence = H(p, q) - H(p). Minimize CE loss = làm q (model) gần p (true distribution) nhất có thể.",
      },
      {
        question: "KL Divergence KL(p || q) dùng cho gì?",
        options: [
          "Tính khoảng cách Euclid",
          "Đo sự khác biệt giữa 2 phân phối. KL = 0: giống hệt. KL lớn: rất khác. Dùng trong: VAE loss, data drift detection, distillation.",
          "Tính trung bình",
        ],
        correct: 1,
        explanation:
          "KL(p || q) = Σ p·log(p/q) = H(p, q) − H(p). KHÔNG đối xứng: KL(p || q) ≠ KL(q || p). Ứng dụng: (1) VAE: KL(q(z|x) || p(z)) ≈ 0 → latent ~ prior; (2) distillation: KL(student || teacher) → student học từ teacher; (3) data drift: KL(train || production) → phát hiện drift.",
      },
      {
        type: "fill-blank",
        question:
          "Entropy H(X) đạt giá trị {blank} khi tất cả sự kiện có xác suất bằng nhau (bất định tối đa), và đạt {blank} khi một sự kiện chắc chắn xảy ra (xác suất = 1).",
        blanks: [
          { answer: "cực đại", accept: ["maximum", "max", "lớn nhất", "cao nhất"] },
          { answer: "0", accept: ["0 bit", "bằng 0", "giá trị 0"] },
        ],
        explanation:
          "Entropy = độ bất định trung bình. Khi tất cả sự kiện đồng xác suất (ví dụ: xúc xắc công bằng), không thể dự đoán → entropy cực đại. Khi một sự kiện chắc chắn xảy ra (P = 1), không có gì để dự đoán → H = −1·log(1) = 0.",
      },
      {
        question:
          "Một mô hình dự đoán chắc chắn nhãn sai (q gán xác suất 0 cho class đúng). Cross-entropy loss sẽ như thế nào?",
        options: [
          "Bằng 0",
          "Bằng entropy của p",
          "Vô cùng lớn (∞) — đây là lý do ta clip log(q) hoặc dùng label smoothing",
          "Không đổi",
        ],
        correct: 2,
        explanation:
          "Khi q(class đúng) = 0, −log(q) = ∞ → CE loss bằng ∞ → gradient nổ. Trong thực hành: label smoothing, clipping, hoặc dùng softmax đảm bảo q > 0 tại mọi vị trí.",
      },
      {
        question: "KL divergence có đối xứng không?",
        options: [
          "Có — KL(p || q) = KL(q || p) luôn luôn",
          "Không — KL(p || q) nói chung khác KL(q || p). Nó là 'divergence', không phải 'metric'.",
          "Chỉ đối xứng khi p và q là Gaussian",
        ],
        correct: 1,
        explanation:
          "KL divergence không thoả bất đẳng thức tam giác và không đối xứng, nên không phải metric. Để đo khoảng cách đối xứng, dùng Jensen–Shannon divergence: JSD(p, q) = ½KL(p || m) + ½KL(q || m) với m = (p+q)/2.",
      },
      {
        question:
          "Trong classification với one-hot true label, tại sao cross-entropy loss đơn giản thành −log(q[class đúng])?",
        options: [
          "Vì p là one-hot, tất cả p_i = 0 trừ class đúng; các số hạng khác triệt tiêu",
          "Vì cross-entropy luôn bằng −log(q)",
          "Vì entropy của one-hot khác 0",
        ],
        correct: 0,
        explanation:
          "Với one-hot p, chỉ một p_i = 1 còn lại = 0. H(p, q) = −Σ p_i·log(q_i) = −log(q[class đúng]). Đây là công thức quen thuộc trong PyTorch/TensorFlow.",
      },
      {
        question: "Giữa entropy, cross-entropy và KL: quan hệ nào đúng?",
        options: [
          "H(p, q) = H(p) + KL(p || q)",
          "H(p, q) = H(p) − KL(p || q)",
          "H(p, q) = KL(p || q) − H(p)",
          "H(p, q) = H(q) + KL(q || p)",
        ],
        correct: 0,
        explanation:
          "Đẳng thức cơ bản: H(p, q) = H(p) + KL(p || q). Vì H(p) không phụ thuộc model → minimize CE tương đương minimize KL. Đây là lý do CE và KL thường được dùng hoán đổi trong ML.",
      },
    ],
    [],
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT CHÍNH
// ─────────────────────────────────────────────────────────────────────────────
export default function InformationTheoryTopic() {
  const quizQuestions = useQuizQuestions();

  // Phân phối p do người dùng chỉnh (true distribution)
  const [p, setP] = useState<number[]>(() => [0.25, 0.25, 0.25, 0.25]);

  // Phân phối q do người dùng chỉnh (model prediction)
  const [q, setQ] = useState<number[]>(() => [0.5, 0.2, 0.2, 0.1]);

  // Kết quả sampling gần nhất (dùng cho random sampler)
  const [lastSample, setLastSample] = useState<{ idx: number; surp: number } | null>(null);

  // ── Tính các đại lượng cốt lõi ──
  const Hp = useMemo(() => entropy(p), [p]);
  const Hq = useMemo(() => entropy(q), [q]);
  const CE = useMemo(() => crossEntropy(p, q), [p, q]);
  const KL = useMemo(() => klDivergence(p, q), [p, q]);
  const Hmax = log2(p.length); // entropy tối đa của phân phối 4 class

  // ── Xử lý điều chỉnh thanh slider ──
  const onSlidePi = useCallback(
    (i: number, value: number) => {
      setP((prev) => {
        const next = [...prev];
        next[i] = Math.max(0, Math.min(1, value));
        return normalize(next);
      });
    },
    [],
  );

  const onSlideQi = useCallback(
    (i: number, value: number) => {
      setQ((prev) => {
        const next = [...prev];
        next[i] = Math.max(0, Math.min(1, value));
        return normalize(next);
      });
    },
    [],
  );

  const applyPreset = useCallback((target: "p" | "q", preset: Preset) => {
    if (target === "p") setP([...preset.probs]);
    else setQ([...preset.probs]);
  }, []);

  const doSample = useCallback(() => {
    const idx = sample(p);
    setLastSample({ idx, surp: surprise(p[idx]) });
  }, [p]);

  // ── Render ──
  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 1 — DỰ ĐOÁN
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="2 sự kiện: (A) Ngày mai mặt trời mọc, (B) Ngày mai có động đất. Sự kiện nào chứa NHIỀU THÔNG TIN hơn khi xảy ra?"
          options={[
            "A — vì quan trọng hơn",
            "B — sự kiện HIẾM có nhiều thông tin hơn sự kiện chắc chắn. 'Mặt trời mọc' = 0 thông tin (ai cũng biết). 'Động đất' = nhiều thông tin (bất ngờ).",
            "Bằng nhau",
          ]}
          correct={1}
          explanation="Information = −log P. Mặt trời mọc: P ≈ 1 → −log(1) = 0 bits (không có thông tin mới). Động đất: P ≈ 0.001 → −log(0.001) ≈ 10 bits (rất nhiều thông tin). Tin tức báo chí chỉ đưa tin BẤT NGỜ vì nó có nhiều thông tin. Đây là trực giác của Shannon!"
        >
          <p className="text-sm text-muted mt-2">
            Bên dưới bạn sẽ có một entropy explorer để tự tay tạo phân phối và nhìn các đại lượng
            entropy / cross-entropy / KL-divergence thay đổi trong thời gian thực.
          </p>
        </PredictionGate>

        <div className="mt-6 rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-2">
            Phép so sánh — đóng gói tin nhắn
          </h3>
          <p className="text-sm text-muted leading-relaxed">
            Tưởng tượng bạn phải gửi các bản tin thời tiết qua điện báo tính tiền theo ký tự.
            Nếu nơi bạn gửi đi luôn nắng, một tin &quot;hôm nay nắng&quot; chiếm 99% số bản tin —
            bạn có thể mã hoá nó chỉ bằng 1 ký tự, còn &quot;tuyết&quot;, &quot;bão&quot; hay
            &quot;sương mù&quot; (hiếm) có thể chấp nhận mã dài. Ngược lại, nếu mỗi loại thời
            tiết xuất hiện với xác suất bằng nhau, bạn buộc phải dùng mã dài hơn cho tất cả.
          </p>
          <p className="mt-3 text-sm text-muted leading-relaxed">
            <strong>Entropy</strong> chính là số bit trung bình ít nhất để mã hoá một bản tin,{" "}
            <strong>cross-entropy</strong> là số bit thực tế khi bạn dùng sai &quot;bảng
            mã&quot; (dùng bảng của phân phối q nhưng tin sinh ra từ p), và{" "}
            <strong>KL divergence</strong> là phần phí phạm do dùng sai bảng mã.
          </p>
        </div>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 2 — KHÁM PHÁ: ENTROPY EXPLORER
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <h3 className="text-base font-semibold text-foreground mb-1">
            Entropy explorer — điều chỉnh p và q để cảm nhận ba đại lượng
          </h3>
          <p className="text-sm text-muted mb-5">
            Hai phân phối 4 lớp (A, B, C, D). <strong>p</strong> là phân phối &quot;thật&quot;
            (ground truth). <strong>q</strong> là &quot;model&quot; của bạn. Các đại lượng bên
            phải cập nhật ngay khi bạn kéo thanh.
          </p>

          {/* ── Khối 1: tóm tắt 4 số liệu ──────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard label="H(p)" value={fmt(Hp)} unit="bit" hint="Entropy của p" />
            <StatCard label="H(q)" value={fmt(Hq)} unit="bit" hint="Entropy của q" />
            <StatCard
              label="H(p,q)"
              value={fmt(CE)}
              unit="bit"
              hint="Cross-entropy (loss)"
            />
            <StatCard
              label="KL(p‖q)"
              value={fmt(KL)}
              unit="bit"
              hint="Độ khác biệt p và q"
            />
          </div>

          {/* ── Khối 2: hai editor song song ──────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <DistributionEditor
              title="p — phân phối thật"
              subtitle="Ground truth (dữ liệu)"
              probs={p}
              onChange={onSlidePi}
              presets={PRESETS}
              onPreset={(pr) => applyPreset("p", pr)}
              H={Hp}
              Hmax={Hmax}
            />

            <DistributionEditor
              title="q — model dự đoán"
              subtitle="Model output (softmax)"
              probs={q}
              onChange={onSlideQi}
              presets={PRESETS}
              onPreset={(pr) => applyPreset("q", pr)}
              H={Hq}
              Hmax={Hmax}
            />
          </div>

          {/* ── Khối 3: thanh trực quan H(p) so với H_max ─────────── */}
          <div className="mt-6 rounded-lg border border-border bg-surface/30 p-4">
            <p className="text-xs text-muted mb-2">
              Tiến độ entropy của p so với entropy tối đa (log₂ 4 = 2 bit):
            </p>
            <div className="h-3 w-full rounded-full bg-surface overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-accent"
                animate={{ width: `${Math.min(100, (Hp / Hmax) * 100)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="mt-2 text-xs text-muted">
              H(p) = {fmt(Hp)} bit / H<sub>max</sub> = {fmt(Hmax)} bit. Khi p đồng đều, thanh
              chạm 100%. Khi p tập trung về một class, thanh tụt về 0%.
            </p>
          </div>

          {/* ── Khối 4: Quan hệ H(p,q) = H(p) + KL ───────────────── */}
          <div className="mt-5 rounded-lg border border-border bg-card p-4">
            <h4 className="text-sm font-semibold text-foreground mb-2">
              Quan hệ then chốt
            </h4>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
              <span className="rounded bg-accent/10 px-2 py-1 font-mono text-accent">
                H(p,q) = {fmt(CE)}
              </span>
              <span className="text-muted">=</span>
              <span className="rounded bg-blue-500/10 px-2 py-1 font-mono text-blue-600 dark:text-blue-400">
                H(p) = {fmt(Hp)}
              </span>
              <span className="text-muted">+</span>
              <span className="rounded bg-amber-500/10 px-2 py-1 font-mono text-amber-600 dark:text-amber-400">
                KL(p‖q) = {fmt(KL)}
              </span>
            </div>
            <p className="mt-3 text-xs text-muted leading-relaxed">
              H(p) là phần &quot;không thể giảm&quot; (entropy sẵn có của dữ liệu). KL(p‖q) là
              phần &quot;phí phạm&quot; do model chưa khớp. Khi train, gradient descent chỉ có
              thể chạm vào phần KL. Đây là lý do minimize cross-entropy tương đương minimize
              KL.
            </p>
          </div>

          {/* ── Khối 5: Random sampler — hiển thị surprise ───────── */}
          <div className="mt-5 rounded-lg border border-border bg-surface/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-foreground">
                Random sampler — rút 1 mẫu từ p
              </h4>
              <button
                type="button"
                onClick={doSample}
                className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-dark transition-colors"
              >
                Rút mẫu
              </button>
            </div>

            <AnimatePresence mode="wait">
              {lastSample ? (
                <motion.div
                  key={`${lastSample.idx}-${lastSample.surp}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-lg border border-border bg-card p-3 text-sm"
                >
                  <p>
                    Lớp trúng: <strong className="text-accent">{CLASS_LABELS[lastSample.idx]}</strong>{" "}
                    (p = {fmt(p[lastSample.idx])})
                  </p>
                  <p className="mt-1 text-muted">
                    Surprise của mẫu này = −log₂(p) ={" "}
                    <strong className="text-foreground">{fmt(lastSample.surp)} bit</strong>.{" "}
                    {lastSample.surp < 1
                      ? "Mẫu phổ biến, ít bất ngờ."
                      : lastSample.surp < 3
                      ? "Mẫu có độ hiếm trung bình."
                      : "Mẫu hiếm, rất bất ngờ — nhiều thông tin."}
                  </p>
                </motion.div>
              ) : (
                <p className="text-sm text-muted">
                  Nhấn nút &quot;Rút mẫu&quot; để xem một sự kiện hiếm có bao nhiêu bit thông
                  tin.
                </p>
              )}
            </AnimatePresence>
          </div>

          {/* ── Khối 6: gợi ý thử nghiệm ──────────────────────────── */}
          <div className="mt-5 rounded-lg border border-dashed border-border bg-surface/20 p-4">
            <h4 className="text-sm font-semibold text-foreground mb-2">Thử nghiệm nhanh</h4>
            <ul className="list-disc list-inside space-y-1 text-xs text-muted">
              <li>
                Đặt p = uniform, q = peaked: xem KL tăng vọt — model quá tự tin sai.
              </li>
              <li>
                Đặt p = q (cả hai cùng một preset): KL = 0, H(p, q) = H(p) (minimum).
              </li>
              <li>
                Đặt p = one-hot (H(p) = 0): cross-entropy = −log₂ q[class đúng], đúng với công
                thức CE-loss cho classification.
              </li>
              <li>
                Đẩy một q_i về 0 trong khi p_i {">"} 0: CE = ∞, KL = ∞ — đây là &quot;log-sum
                trap&quot; khi train không có label smoothing.
              </li>
            </ul>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 3 — AHA MOMENT
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Entropy = <strong>độ bất định trung bình</strong>. Cross-Entropy ={" "}
            <strong>loss function của classification</strong>. KL Divergence ={" "}
            <strong>độ khác biệt giữa 2 phân phối</strong>. Ba concept này xuất hiện KHẮP NƠI
            trong ML: decision trees (information gain), neural networks (CE loss), VAE (KL
            loss), distillation (KL student → teacher). <strong>Information Theory là ngôn
            ngữ chung của ML hiện đại.</strong>
          </p>
        </AhaMoment>

        {/* ── Thử thách 1 ─────────────────────────────────────────── */}
        <div className="mt-6">
          <InlineChallenge
            question="Đồng xu công bằng: P(H) = P(T) = 0.5. Đồng xu gian lận: P(H) = 0.9, P(T) = 0.1. Entropy nào cao hơn?"
            options={[
              "Đồng xu công bằng: H = −0.5·log(0.5)·2 = 1 bit (bất định nhất, cao nhất)",
              "Đồng xu gian lận: bất định hơn vì gần 1 → cao hơn",
              "Bằng nhau",
            ]}
            correct={0}
            explanation="Công bằng: H = −0.5·log₂(0.5) − 0.5·log₂(0.5) = 1 bit (maximum entropy cho binary). Gian lận: H = −0.9·log₂(0.9) − 0.1·log₂(0.1) ≈ 0.47 bit (ít bất định vì gần như chắc chắn H). Entropy max khi ĐỒNG ĐỀU (bất định nhất). Max entropy = hardest to predict."
          />
        </div>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 4 — THỬ THÁCH 2 + GIẢI THÍCH + TÓM TẮT
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách & Giải thích">
        <InlineChallenge
          question="Bạn huấn luyện một bộ phân loại 10 lớp. Trên một mẫu, model dự đoán q = softmax cực kỳ đồng đều (gần 0.1 cho mọi lớp). Nhãn thật là class 3. Cross-entropy loss cho mẫu này xấp xỉ bao nhiêu?"
          options={[
            "≈ 0 — vì model không có lỗi rõ ràng",
            "≈ log₂(10) ≈ 3.32 bit — model hoàn toàn không có thông tin nên loss bằng entropy của uniform",
            "≈ ∞ vì q quá phẳng",
          ]}
          correct={1}
          explanation="Với one-hot true label, CE loss = −log q[class đúng] = −log(0.1) = log(10) ≈ 2.30 nat ≈ 3.32 bit. Đây là baseline 'ngu nhất an toàn' — mọi model chưa học đều cho loss ở ngưỡng này."
        />

        <div className="mt-6">
          <ExplanationSection topicSlug={metadata.slug}>
            <p>
              <strong>Information Theory</strong> (Shannon, 1948) đo lường thông tin và bất định
              — nền tảng của loss functions và nhiều thuật toán ML, bao gồm{" "}
              <TopicLink slug="decision-trees">cây quyết định</TopicLink> (dùng information
              gain) và các mô hình{" "}
              <TopicLink slug="probability-statistics">xác suất thống kê</TopicLink>. Mục tiêu
              của phần này là giúp bạn đọc được 3 công thức dưới đây một cách trực giác — chúng
              xuất hiện liên tục trong mọi bài báo ML.
            </p>

            <p>
              <strong>Information (self-information):</strong> đo độ bất ngờ của một sự kiện.
            </p>
            <LaTeX block>
              {"I(x) = -\\log_2 P(x) \\quad \\text{(bits — sự kiện hiếm có nhiều thông tin)}"}
            </LaTeX>

            <p>
              <strong>Entropy H(X):</strong> giá trị kỳ vọng của self-information trên toàn phân
              phối — nói cách khác là &quot;độ bất định trung bình&quot;.
            </p>
            <LaTeX block>
              {"H(X) = -\\sum_{x} P(x) \\log_2 P(x) \\quad \\text{(cao = bất định, thấp = chắc chắn)}"}
            </LaTeX>

            <p>
              <strong>Cross-entropy H(p, q):</strong> chi phí trung bình (theo bit) để mã hoá
              mẫu từ phân phối p bằng mã tối ưu của phân phối q.
            </p>
            <LaTeX block>
              {"H(p, q) = -\\sum_{x} p(x) \\log q(x) = H(p) + D_{KL}(p \\| q)"}
            </LaTeX>

            <p>
              <strong>KL divergence D<sub>KL</sub>(p ‖ q):</strong> phần chi phí dư so với tối
              ưu H(p).
            </p>
            <LaTeX block>
              {"D_{KL}(p \\| q) = \\sum_{x} p(x) \\log \\frac{p(x)}{q(x)} \\geq 0 \\quad \\text{(= 0 iff } p = q)"}
            </LaTeX>

            <Callout variant="tip" title="Cross-entropy = loss function">
              Minimize CE H(p, q) = minimize KL(p ‖ q) + H(p). Vì H(p) là hằng số với dữ liệu
              cho trước → minimize CE tương đương minimize KL = làm q (model) gần p (true) nhất.
              Đây là lý do CE là default loss cho classification! Kết hợp với{" "}
              <TopicLink slug="cross-validation">kiểm định chéo</TopicLink> để đánh giá model ổn
              định hơn.
            </Callout>

            <Callout variant="insight" title="Trực giác 'coding': vì sao đơn vị là bit?">
              Shannon chứng minh rằng số bit trung bình ngắn nhất cần dùng để mã hoá một ký tự
              sinh ra từ phân phối p chính là H(p). Nếu bạn dùng sai bảng mã (của q thay vì p),
              số bit trung bình thực tế là H(p, q) — và phần phụ trội là KL(p ‖ q). Trong ML,
              &quot;bảng mã&quot; đồng nghĩa với &quot;mô hình xác suất&quot;, và &quot;phí
              phạm&quot; chính là &quot;loss&quot;.
            </Callout>

            <Callout variant="warning" title="KL không đối xứng">
              KL(p ‖ q) ≠ KL(q ‖ p). Chọn thứ tự có ý nghĩa: KL(p ‖ q) &quot;phạt&quot; nặng các
              chỗ p có mass mà q gán gần 0 (mode-covering). KL(q ‖ p) &quot;phạt&quot; nặng các
              chỗ q có mass nhưng p gán gần 0 (mode-seeking). VAE dùng KL(q ‖ p); RL dùng
              KL(π_old ‖ π_new) — không thể đổi ngẫu nhiên.
            </Callout>

            <Callout variant="info" title="Jensen–Shannon và đối xứng hoá">
              Nếu cần một &quot;khoảng cách&quot; đối xứng giữa p và q, hãy dùng Jensen–Shannon
              divergence: JSD(p, q) = ½KL(p ‖ m) + ½KL(q ‖ m) với m = (p + q)/2. JSD có tính
              chất đẹp: đối xứng, luôn hữu hạn, và <em>căn bậc hai</em> của JSD là một metric
              thực sự.
            </Callout>

            <p>
              <strong>Ví dụ code — tính entropy, cross-entropy, KL với SciPy:</strong>
            </p>
            <CodeBlock language="python" title="info_theory_scipy.py">{`import numpy as np
from scipy.stats import entropy  # scipy dùng log tự nhiên mặc định

# Entropy (đổi base=2 để ra bit)
p_fair   = [0.5, 0.5]
p_biased = [0.9, 0.1]
print(f"Entropy fair   : {entropy(p_fair,   base=2):.3f} bit")   # 1.000
print(f"Entropy biased : {entropy(p_biased, base=2):.3f} bit")   # 0.469

# Cross-entropy (classification loss, one-hot y_true)
y_true = np.array([1, 0, 0])       # class 0 là đúng
y_pred = np.array([0.7, 0.2, 0.1]) # model output
ce = -np.sum(y_true * np.log(y_pred + 1e-12))
print(f"CE loss: {ce:.4f} nat")    # 0.3567

# KL divergence — scipy.stats.entropy(p, q) = KL(p || q) (natural log)
p = np.array([0.4, 0.3, 0.3])
q = np.array([0.5, 0.3, 0.2])
kl_nat = entropy(p, q)             # nat
kl_bit = entropy(p, q, base=2)     # bit
print(f"KL(p||q) = {kl_nat:.4f} nat = {kl_bit:.4f} bit")

# Ứng dụng 1: data drift detection
def drift_score(train_hist, prod_hist, eps=1e-12):
    p = np.asarray(train_hist) + eps
    q = np.asarray(prod_hist)  + eps
    p = p / p.sum(); q = q / q.sum()
    return entropy(p, q, base=2)   # càng lớn → drift càng nhiều

# Ứng dụng 2: VAE loss = reconstruction + KL(q(z|x) || p(z))
# Với p(z) = N(0, I) và q(z|x) = N(mu, sigma^2):
def kl_gaussian_standard(mu, logvar):
    # Công thức đóng cho KL(N(mu, sigma^2) || N(0, 1))
    return 0.5 * np.sum(mu**2 + np.exp(logvar) - 1 - logvar)`}</CodeBlock>

            <p>
              <strong>Ví dụ code — tính trực tiếp bằng NumPy thuần (không cần SciPy):</strong>
            </p>
            <CodeBlock language="python" title="info_theory_numpy.py">{`import numpy as np

EPS = 1e-12

def shannon_entropy(p, base=2):
    p = np.asarray(p) + EPS
    return -(p * (np.log(p) / np.log(base))).sum()

def cross_entropy(p, q, base=2):
    p = np.asarray(p) + EPS
    q = np.asarray(q) + EPS
    return -(p * (np.log(q) / np.log(base))).sum()

def kl_divergence(p, q, base=2):
    p = np.asarray(p) + EPS
    q = np.asarray(q) + EPS
    return (p * (np.log(p / q) / np.log(base))).sum()

# Kiểm định tính chất: H(p, q) = H(p) + KL(p || q)
p = np.array([0.4, 0.3, 0.3])
q = np.array([0.5, 0.3, 0.2])
assert np.isclose(
    cross_entropy(p, q),
    shannon_entropy(p) + kl_divergence(p, q),
)

# PyTorch: F.cross_entropy kết hợp log_softmax + NLL đã xử lý ổn định số.
# Không tự dùng log trên softmax — dễ underflow!`}</CodeBlock>

            <CollapsibleDetail title="Chi tiết nâng cao — nguồn gốc của công thức H">
              <div className="space-y-3 text-sm text-foreground">
                <p>
                  Shannon đặt 3 tiên đề cho hàm đo bất định H của một phân phối rời rạc:
                </p>
                <ol className="list-decimal list-inside space-y-1.5 pl-2">
                  <li>
                    H liên tục theo các xác suất p_i.
                  </li>
                  <li>
                    Nếu tất cả n sự kiện đồng khả năng, H tăng khi n tăng.
                  </li>
                  <li>
                    Phân rã: khi một sự kiện được chia thành 2 tiểu sự kiện, H tổng bằng tổng
                    có trọng số của các tiểu H.
                  </li>
                </ol>
                <p>
                  Shannon chứng minh duy nhất một dạng hàm thoả cả 3 tiên đề (tới hằng số):
                  H(p) = −K·Σ p_i·log p_i. Chọn K = 1 và base = 2 cho đơn vị bit, ta có entropy
                  quen thuộc.
                </p>
                <p>
                  Bất đẳng thức Gibbs cho ta KL(p ‖ q) ≥ 0 với đẳng thức khi và chỉ khi p = q —
                  đây là nền tảng chứng minh rằng minimize CE dẫn đến model đúng (khi đủ dữ
                  liệu và dung lượng).
                </p>
              </div>
            </CollapsibleDetail>

            <CollapsibleDetail title="So sánh CE với các loss khác (MSE, Hinge)">
              <div className="space-y-3 text-sm text-foreground">
                <p>
                  Khi nào chọn CE, khi nào chọn MSE?
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-2">
                  <li>
                    <strong>CE cho classification:</strong> giả định output là xác suất
                    (softmax/sigmoid). Gradient dạng (q − p) rất &quot;sạch&quot; và không bị
                    vanish ở vùng q gần 0/1. Đây là lý do cross-entropy được chuẩn hoá cho
                    NN classification.
                  </li>
                  <li>
                    <strong>MSE cho regression:</strong> giả định noise Gaussian trên output
                    liên tục. Nếu dùng MSE với softmax cho classification, gradient bị ép nhỏ
                    khi output sai → training chậm.
                  </li>
                  <li>
                    <strong>Hinge loss (SVM):</strong> không dựa trên xác suất, tối ưu hoá
                    margin. Không dùng cho probabilistic output.
                  </li>
                </ul>
                <p>
                  Một cách nhìn: CE = log-likelihood negative của Bernoulli/Categorical. MSE =
                  log-likelihood negative của Gaussian. Chọn loss = chọn giả định noise của bài
                  toán.
                </p>
              </div>
            </CollapsibleDetail>

            <p>
              <strong>Ứng dụng trong ML:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-sm">
              <li>
                <strong>Loss functions:</strong> CE là loss chuẩn cho classification (cả binary
                và multi-class). Mọi framework (PyTorch, TF, JAX) đều có implementation ổn định
                số.
              </li>
              <li>
                <strong>Decision trees:</strong> ID3, C4.5 dùng information gain (giảm entropy
                sau khi split) để chọn feature quan trọng. Gini impurity là biến thể gần giống.
              </li>
              <li>
                <strong>VAE:</strong> ELBO = reconstruction loss + KL(q(z|x) ‖ p(z)). KL kéo
                latent về prior, giúp sinh mẫu mượt.
              </li>
              <li>
                <strong>Knowledge distillation:</strong> student network minimize KL(student ‖
                teacher) trên logits softmax — học cả xác suất sai giúp student tổng quát hoá
                tốt.
              </li>
              <li>
                <strong>RL / policy gradient:</strong> PPO giới hạn KL giữa policy cũ và mới để
                tránh update quá mạnh.
              </li>
              <li>
                <strong>Data drift detection:</strong> theo dõi KL(train ‖ production) theo thời
                gian. Vượt ngưỡng → cảnh báo retrain.
              </li>
              <li>
                <strong>Mutual information:</strong> I(X; Y) = H(X) − H(X|Y) — đo độ liên hệ
                giữa 2 biến, dùng trong feature selection và representation learning (InfoNCE,
                MINE).
              </li>
              <li>
                <strong>Compression:</strong> Huffman coding, arithmetic coding — các thuật toán
                mã hoá không tổn hao đạt tối thiểu H(p) bit/ký tự.
              </li>
            </ul>

            <p>
              <strong>Các lỗi phổ biến cần tránh:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-sm">
              <li>
                <strong>Log của 0:</strong> khi q_i = 0 trong khi p_i {">"} 0, CE = ∞. Luôn clamp
                q ≥ ε nhỏ (ví dụ 1e-7) hoặc dùng log_softmax + NLL thay vì softmax + log.
              </li>
              <li>
                <strong>Nhầm cơ số log:</strong> bit dùng log₂, nat dùng ln. Chuyển đổi: 1 nat ≈
                1.443 bit. Nếu so kết quả với paper khác, hãy kiểm tra đơn vị.
              </li>
              <li>
                <strong>KL đối xứng hoá ngây thơ:</strong> (KL(p‖q) + KL(q‖p))/2 không phải
                metric. Dùng JSD nếu cần tính chất đối xứng.
              </li>
              <li>
                <strong>Coi KL như khoảng cách Euclid:</strong> KL không thoả bất đẳng thức tam
                giác. Không thể dùng KL như một metric không gian.
              </li>
              <li>
                <strong>Label smoothing quá mạnh:</strong> kéo p từ one-hot về gần uniform làm
                entropy target cao → CE không về 0 dù model đúng 100%. Cần cân đối.
              </li>
              <li>
                <strong>Tính entropy trên xác suất chưa chuẩn hoá:</strong> luôn đảm bảo tổng
                p_i = 1 trước khi tính.
              </li>
              <li>
                <strong>Confuse entropy với variance:</strong> entropy đo bất định về giá trị
                xuất hiện, variance đo độ phân tán quanh trung bình. Hai khái niệm khác nhau.
              </li>
            </ul>

            <p>
              <strong>Checklist nhanh khi debug CE loss:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-1.5 pl-2 text-sm">
              <li>
                In ra q[class đúng] cho 10 mẫu đầu. Nếu toàn gần 0.1 (với 10 class), model chưa
                học gì — kiểm tra data loader / learning rate.
              </li>
              <li>
                Kiểm tra loss khởi đầu ≈ log(num_classes). Nếu thấp hơn → có thể data leakage.
              </li>
              <li>
                Theo dõi KL giữa predicted distribution và uniform — tăng dần theo epoch là dấu
                hiệu model &quot;tự tin hơn&quot;.
              </li>
              <li>
                Cẩn thận label smoothing: luôn log cả &quot;CE với smooth label&quot; và &quot;CE
                với hard label&quot; để tách nhiễu.
              </li>
            </ol>

            <Callout variant="tip" title="Mẹo thực dụng">
              Khi thấy CE loss bỗng bật lên NaN, 90% là do log(0) ở đâu đó trong pipeline. Kiểm
              tra: (1) softmax có nan không, (2) có clip q vào [ε, 1 − ε] trước log chưa, (3)
              gradient có bị nổ do learning rate quá lớn không. Dùng torch.autograd.set_detect_anomaly(True)
              để bắt điểm phát sinh.
            </Callout>

            <p>
              <strong>Bảng đổi đơn vị — bit vs nat vs ban/Hartley:</strong>
            </p>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead className="bg-surface/40 text-tertiary">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Đơn vị</th>
                    <th className="text-left px-3 py-2 font-medium">Log base</th>
                    <th className="text-left px-3 py-2 font-medium">Khi nào dùng</th>
                    <th className="text-left px-3 py-2 font-medium">Quy đổi về bit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-card">
                    <td className="px-3 py-2 font-semibold text-foreground">bit (shannon)</td>
                    <td className="px-3 py-2 font-mono">2</td>
                    <td className="px-3 py-2 text-muted">Trực giác coding, CS, ML</td>
                    <td className="px-3 py-2 font-mono">× 1</td>
                  </tr>
                  <tr className="bg-surface/20">
                    <td className="px-3 py-2 font-semibold text-foreground">nat</td>
                    <td className="px-3 py-2 font-mono">e</td>
                    <td className="px-3 py-2 text-muted">Toán học, giải tích, mặc định của scipy/torch</td>
                    <td className="px-3 py-2 font-mono">× 1.4427</td>
                  </tr>
                  <tr className="bg-card">
                    <td className="px-3 py-2 font-semibold text-foreground">ban (hartley)</td>
                    <td className="px-3 py-2 font-mono">10</td>
                    <td className="px-3 py-2 text-muted">Tin sinh học, genetics</td>
                    <td className="px-3 py-2 font-mono">× 3.3219</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-4">
              <strong>Mutual information — mối quan hệ giữa hai biến:</strong>
            </p>

            <LaTeX block>
              {"I(X; Y) = \\sum_{x,y} p(x, y) \\log \\frac{p(x, y)}{p(x) p(y)} = H(X) - H(X \\mid Y)"}
            </LaTeX>

            <p>
              Mutual information I(X; Y) đo lượng thông tin mà quan sát Y cho bạn về X (và
              ngược lại, do đối xứng). Nó bằng 0 iff X và Y độc lập. Đây là khái niệm nền của
              nhiều kỹ thuật self-supervised learning (InfoNCE trong CLIP, SimCLR, MINE).
            </p>

            <Callout variant="info" title="Từ CE đến mutual information">
              Khi train contrastive learning (SimCLR, CLIP), loss InfoNCE là một lower-bound của
              mutual information giữa positive pair. Tức là model học &quot;biểu diễn càng nhiều
              thông tin chung giữa 2 view càng tốt&quot;. Information theory xuất hiện ngay cả
              ở các phương pháp tưởng chừng không liên quan.
            </Callout>

            <p>
              <strong>Cheat-sheet các công thức hay dùng:</strong>
            </p>

            <ul className="list-disc list-inside space-y-1.5 pl-2 text-sm">
              <li>
                <code>0 ≤ H(p) ≤ log n</code>, với n là số class.
              </li>
              <li>
                <code>H(p, q) ≥ H(p)</code>, đẳng thức khi p = q.
              </li>
              <li>
                <code>D_KL(p ‖ q) ≥ 0</code>, đẳng thức khi p = q (Gibbs inequality).
              </li>
              <li>
                <code>H(X, Y) = H(X) + H(Y | X) = H(Y) + H(X | Y)</code> (chain rule).
              </li>
              <li>
                <code>I(X; Y) ≥ 0</code>, đẳng thức khi X và Y độc lập.
              </li>
              <li>
                <code>I(X; Y) = H(X) + H(Y) − H(X, Y)</code>.
              </li>
              <li>
                <code>H(p) = E_p[−log p(X)]</code> — entropy là kỳ vọng self-information.
              </li>
              <li>
                <code>D_KL(p ‖ q) = E_p[log p − log q]</code> — KL là kỳ vọng log-ratio.
              </li>
            </ul>

            <p>
              <strong>Câu hỏi thường gặp:</strong>
            </p>

            <div className="space-y-3 text-sm">
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="font-semibold text-foreground mb-1">
                  Q1: Entropy có luôn dương không? Có thể âm không?
                </p>
                <p className="text-muted">
                  Với phân phối rời rạc, H ≥ 0 luôn luôn (vì p_i ≤ 1 ⇒ log p_i ≤ 0). Với phân
                  phối liên tục (differential entropy), H có thể âm — ví dụ Gaussian với σ nhỏ.
                  Điều này là một trong những điểm &quot;bẫy&quot; khi chuyển giữa rời rạc và
                  liên tục.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="font-semibold text-foreground mb-1">
                  Q2: Vì sao KL(p ‖ q) và KL(q ‖ p) khác nhau về ý nghĩa thực hành?
                </p>
                <p className="text-muted">
                  KL(p ‖ q) &quot;mean-seeking&quot; — q phải cover mọi mode của p để tránh phạt
                  nặng. KL(q ‖ p) &quot;mode-seeking&quot; — q có thể tập trung vào một mode của
                  p và bỏ qua các mode khác. Khi học biến phân (VAE), đây là quyết định quan
                  trọng.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="font-semibold text-foreground mb-1">
                  Q3: Tại sao PyTorch gọi là <code>CrossEntropyLoss</code> nhưng nhận logits
                  thô chứ không phải xác suất?
                </p>
                <p className="text-muted">
                  Để đảm bảo ổn định số. <code>F.cross_entropy(logits, target)</code> nội bộ
                  kết hợp <code>log_softmax + NLLLoss</code> — tránh tính <code>log(softmax(x))</code>
                  riêng biệt (dễ underflow). Quy tắc: <em>không bao giờ</em> tự apply softmax
                  trước khi vào cross-entropy trong PyTorch.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="font-semibold text-foreground mb-1">
                  Q4: Liệu có thể dùng entropy để phát hiện out-of-distribution không?
                </p>
                <p className="text-muted">
                  Có — nhiều phương pháp OOD detection dùng entropy của predicted softmax như
                  tín hiệu. Mẫu in-distribution thường cho entropy thấp (model tự tin), OOD cho
                  entropy cao. Tuy vậy, model neural network thường &quot;tự tin sai&quot; trên
                  OOD — nên thường kết hợp với temperature scaling hoặc các phương pháp như
                  energy-based.
                </p>
              </div>
            </div>

            <p className="mt-4">
              <strong>Đọc thêm:</strong>
            </p>

            <ul className="list-disc list-inside space-y-1.5 pl-2 text-sm">
              <li>
                Cover &amp; Thomas, <em>Elements of Information Theory</em> — sách giáo khoa
                chuẩn mực, phần 2 (entropy + chain rule) và phần 8 (differential entropy) là
                cần thiết.
              </li>
              <li>
                MacKay, <em>Information Theory, Inference, and Learning Algorithms</em> — miễn
                phí online, cầu nối giữa IT và ML, cực kỳ trực quan.
              </li>
              <li>
                Shannon, <em>A Mathematical Theory of Communication</em> (1948) — bản gốc, vẫn
                rất đáng đọc sau 75 năm.
              </li>
              <li>
                <TopicLink slug="loss-functions">Loss functions</TopicLink> — xem cách CE hoạt
                động trong thực hành.
              </li>
              <li>
                <TopicLink slug="vae">VAE</TopicLink> — xem KL divergence xuất hiện như một
                regularizer.
              </li>
            </ul>
          </ExplanationSection>
        </div>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 5 — TÓM TẮT + QUIZ
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Tóm tắt & Kiểm tra">
        <MiniSummary
          points={[
            "Information I(x) = −log P(x): sự kiện hiếm = nhiều thông tin; sự kiện chắc chắn = 0 thông tin.",
            "Entropy H(X) = độ bất định trung bình. Max khi đồng đều. Decision tree dùng information gain.",
            "Cross-entropy H(p, q) = loss function cho classification. Minimize CE = làm model gần true distribution.",
            "KL(p ‖ q) ≥ 0, = 0 iff p = q. Không đối xứng. Dùng trong VAE, distillation, drift detection.",
            "Đẳng thức then chốt: H(p, q) = H(p) + KL(p ‖ q). Training chỉ giảm KL — H(p) là bất biến.",
            "Information Theory là ngôn ngữ chung của ML: loss functions, decision trees, compression, coding.",
          ]}
        />

        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS — nhỏ, cục bộ
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  unit,
  hint,
}: {
  label: string;
  value: string;
  unit: string;
  hint: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold text-muted">{label}</span>
        <span className="text-xs text-tertiary">{unit}</span>
      </div>
      <div className="mt-1 text-xl font-bold text-foreground font-mono">{value}</div>
      <div className="mt-1 text-[11px] text-muted">{hint}</div>
    </div>
  );
}

function DistributionEditor({
  title,
  subtitle,
  probs,
  onChange,
  presets,
  onPreset,
  H,
  Hmax,
}: {
  title: string;
  subtitle: string;
  probs: number[];
  onChange: (i: number, value: number) => void;
  presets: Preset[];
  onPreset: (p: Preset) => void;
  H: number;
  Hmax: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          <p className="text-[11px] text-muted">{subtitle}</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted">H</div>
          <div className="text-sm font-mono font-bold text-accent">{fmt(H)}</div>
        </div>
      </div>

      {/* Bars + sliders */}
      <div className="space-y-2 mb-4">
        {probs.map((pi, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-foreground">
                Lớp {CLASS_LABELS[i]}
              </span>
              <span className="font-mono text-muted">{fmt(pi)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-4 rounded-full bg-surface overflow-hidden">
                <motion.div
                  className={`h-full ${CLASS_COLORS[i]}`}
                  animate={{ width: `${pi * 100}%` }}
                  transition={{ duration: 0.15 }}
                />
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={pi}
              onChange={(e) => onChange(i, parseFloat(e.target.value))}
              className="w-full accent-accent"
              aria-label={`Xác suất lớp ${CLASS_LABELS[i]}`}
            />
          </div>
        ))}
      </div>

      {/* Preset buttons */}
      <div>
        <p className="text-[11px] text-muted mb-2">Preset nhanh:</p>
        <div className="flex flex-wrap gap-1.5">
          {presets.map((pr) => (
            <button
              key={pr.id}
              type="button"
              onClick={() => onPreset(pr)}
              className="rounded border border-border bg-surface/40 px-2 py-1 text-[11px] text-muted hover:text-foreground hover:border-accent/40 transition-colors"
              title={pr.note}
            >
              {pr.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mini indicator — H / Hmax */}
      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex items-center justify-between text-[11px] text-muted">
          <span>H / H_max</span>
          <span className="font-mono">
            {fmt(H)} / {fmt(Hmax)}
          </span>
        </div>
        <div className="mt-1 h-1.5 w-full rounded-full bg-surface overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-accent"
            animate={{ width: `${Math.min(100, (H / Hmax) * 100)}%` }}
            transition={{ duration: 0.15 }}
          />
        </div>
      </div>
    </div>
  );
}
