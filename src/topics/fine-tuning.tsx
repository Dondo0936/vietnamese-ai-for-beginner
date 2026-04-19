"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  Callout,
  CollapsibleDetail,
  MiniSummary,
  CodeBlock,
  LessonSection,
  LaTeX,
  TopicLink,
  ProgressSteps,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "fine-tuning",
  title: "Fine-tuning",
  titleVi: "Fine-tuning - Tinh chỉnh mô hình",
  description:
    "Quá trình huấn luyện thêm mô hình đã pre-train trên dữ liệu chuyên biệt để thực hiện tác vụ cụ thể.",
  category: "training-optimization",
  tags: ["fine-tuning", "transfer-learning", "training", "specialization"],
  difficulty: "intermediate",
  relatedSlugs: ["lora", "qlora", "fine-tuning-vs-prompting"],
  vizType: "interactive",
};

/* ============================================================
 *  Data model for the PEFT comparison visualization
 * ============================================================ */
type PeftMethod = "full" | "lora" | "adapter" | "prefix";

interface PeftDef {
  id: PeftMethod;
  label: string;
  labelEn: string;
  color: string;
  year: string;
  /**
   * Approximate percentage of the total backbone parameters that are
   * actually updated. These are illustrative defaults for a 7B LLaMA-class
   * model. LoRA at rank=8 ≈ 0.1–0.5% depending on target modules.
   */
  trainablePctDefault: number;
  /** Approximate VRAM fraction vs. full fine-tuning (0-1). */
  vramFraction: number;
  /** Accuracy retained vs full FT on GLUE/MMLU-like benchmarks (%). */
  accuracyRetained: number;
  /** Short description shown on the panel. */
  description: string;
}

const PEFT_METHODS: Record<PeftMethod, PeftDef> = {
  full: {
    id: "full",
    label: "Full FT",
    labelEn: "Full Fine-Tuning",
    color: "#ef4444",
    year: "gốc",
    trainablePctDefault: 100,
    vramFraction: 1.0,
    accuracyRetained: 100,
    description:
      "Cập nhật toàn bộ trọng số. Hiệu quả cao nhất, nhưng yêu cầu ~16× VRAM so với chạy inference.",
  },
  lora: {
    id: "lora",
    label: "LoRA",
    labelEn: "Low-Rank Adaptation",
    color: "#22c55e",
    year: "2021",
    trainablePctDefault: 0.3,
    vramFraction: 0.18,
    accuracyRetained: 99,
    description:
      "Chèn ma trận low-rank A·B song song với W. Đóng băng W, chỉ học A & B. Gần như không mất accuracy.",
  },
  adapter: {
    id: "adapter",
    label: "Adapter",
    labelEn: "Adapter Tuning",
    color: "#3b82f6",
    year: "2019",
    trainablePctDefault: 1.0,
    vramFraction: 0.25,
    accuracyRetained: 97,
    description:
      "Chèn module MLP nhỏ (down-up projection) sau mỗi lớp Transformer. Học module, đóng băng backbone.",
  },
  prefix: {
    id: "prefix",
    label: "Prefix Tuning",
    labelEn: "Prefix / Prompt Tuning",
    color: "#8b5cf6",
    year: "2021",
    trainablePctDefault: 0.1,
    vramFraction: 0.12,
    accuracyRetained: 92,
    description:
      "Thêm các vector 'prefix' học được vào đầu chuỗi ở mỗi lớp attention. Nhẹ nhất, nhưng yếu hơn LoRA.",
  },
};

const PEFT_ORDER: PeftMethod[] = ["full", "lora", "adapter", "prefix"];

/* ============================================================
 *  Accuracy vs trainable-% curve (cartoonised but directionally
 *  correct — more parameters tends to raise ceiling with diminishing
 *  returns, PEFT methods live far to the left of the curve).
 * ============================================================ */
interface CurvePoint {
  pct: number; // % trainable
  acc: number; // % accuracy retained vs full FT
}

function buildAccuracyCurve(): CurvePoint[] {
  const pts: CurvePoint[] = [];
  for (let i = 0; i <= 100; i++) {
    const pct = 0.01 * Math.pow(10, (i / 100) * 4); // 0.01% → 100% log-scale
    const acc = 100 - 30 * Math.exp(-pct / 0.8); // steep rise, plateau
    pts.push({ pct, acc });
  }
  return pts;
}

const ACCURACY_CURVE = buildAccuracyCurve();

/* ============================================================
 *  Main component
 * ============================================================ */
export default function FineTuningTopic() {
  /* ---------- State: PEFT explorer ---------- */
  const [method, setMethod] = useState<PeftMethod>("lora");
  const [trainablePct, setTrainablePct] = useState(0.3);
  const [loraRank, setLoraRank] = useState(8);

  /* ---------- State: classic trainer lab ---------- */
  const [dataSize, setDataSize] = useState(5000);
  const [learningRate, setLearningRate] = useState(2);
  const [epochs, setEpochs] = useState(3);

  const activeDef = PEFT_METHODS[method];

  /* ---------- Derived: VRAM estimate for a 7B model ----------
   * Full FT rough breakdown (Adam optimizer, fp16 weights):
   *   - Weights: 14 GB
   *   - Gradients: 14 GB
   *   - Adam states (m, v in fp32): 56 GB
   *   - Activations: ~10 GB
   *   Total: ~94 GB → we scale to 100 for display.
   *
   * PEFT methods only pay gradient + Adam-state cost on the trainable subset,
   * while frozen weights can even stay in int8/int4.
   */
  const vramEstimate = useMemo(() => {
    const base = 100; // full FT reference
    const fraction = activeDef.vramFraction;
    const fromTrainable = (trainablePct / 100) * 60;
    const frozen = base * fraction * 0.8;
    const total = Math.max(
      12,
      Math.min(110, frozen + fromTrainable + 8 /* activations */),
    );
    return {
      full: Math.round(total),
      frozen: Math.round(frozen),
      trainable: Math.round(fromTrainable),
      overhead: 8,
    };
  }, [activeDef, trainablePct]);

  /* ---------- Derived: accuracy estimate ---------- */
  const accuracyEstimate = useMemo(() => {
    // Interpolate from the curve then modulate by method
    const target = ACCURACY_CURVE.find((p) => p.pct >= trainablePct);
    const baseAcc = target ? target.acc : 100;
    const methodFactor = activeDef.accuracyRetained / 100;
    return Math.max(55, Math.min(100, baseAcc * methodFactor));
  }, [trainablePct, activeDef]);

  /* ---------- Classic trainer-lab result ---------- */
  const result = useMemo(() => {
    const baseQuality = 60;
    const dataEffect = Math.min(dataSize / 1000, 20) * 1.5;
    const lrPenalty = learningRate > 5 ? (learningRate - 5) * 3 : 0;
    const epochBonus = Math.min(epochs, 5) * 2;
    const epochPenalty = epochs > 5 ? (epochs - 5) * 2.5 : 0;
    const quality = Math.min(
      98,
      Math.max(40, baseQuality + dataEffect + epochBonus - lrPenalty - epochPenalty),
    );
    const overfitRisk =
      epochs > 5 || learningRate > 5
        ? "Cao"
        : epochs > 3 || learningRate > 3
          ? "Trung bình"
          : "Thấp";
    const forgettingRisk =
      learningRate > 4 ? "Cao" : learningRate > 2 ? "Trung bình" : "Thấp";
    return {
      quality: quality.toFixed(1),
      overfitRisk,
      forgettingRisk,
    };
  }, [dataSize, learningRate, epochs]);

  /* ---------- Reset callback ---------- */
  const resetPeft = useCallback(() => {
    setMethod("lora");
    setTrainablePct(0.3);
    setLoraRank(8);
  }, []);

  /* ============================================================
   *  Weight-matrix heatmap for the four methods
   * ============================================================ */
  const GRID = 8; // 8x8 mock weight matrix
  const weightCells = useMemo(() => {
    const cells: { r: number; c: number; active: boolean }[] = [];
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        let active = false;
        if (method === "full") {
          active = true;
        } else if (method === "lora") {
          // Only the "rank" columns of A and rows of B are active — show as
          // a narrow vertical/horizontal stripe.
          active = c < Math.max(1, Math.round((loraRank / 64) * GRID));
        } else if (method === "adapter") {
          // Adapters = extra side modules; inside the main matrix, nothing
          // is updated. We represent adapters as cells outside the grid.
          active = false;
        } else if (method === "prefix") {
          // Prefix = extra tokens prepended; inside the main matrix, nothing
          // is updated.
          active = false;
        }
        cells.push({ r, c, active });
      }
    }
    return cells;
  }, [method, loraRank]);

  /* ============================================================
   *  Quiz — 8 questions, mix of MCQ and fill-in-the-blank
   * ============================================================ */
  const quizQuestions: QuizQuestion[] = [
    {
      question: "Tại sao fine-tuning hiệu quả hơn huấn luyện từ đầu?",
      options: [
        "Vì fine-tuning dùng GPU mạnh hơn",
        "Vì mô hình đã có kiến thức nền từ pre-training, chỉ cần học thêm kiến thức chuyên biệt",
        "Vì fine-tuning không cần dữ liệu",
        "Vì fine-tuning chỉ thay đổi lớp cuối cùng",
      ],
      correct: 1,
      explanation:
        "Transfer learning cho phép tận dụng kiến thức đã học từ hàng tỷ token. Chỉ cần vài nghìn mẫu chuyên biệt là đủ để mô hình thích ứng.",
    },
    {
      question:
        "Khi nào KHÔNG nên fine-tune mà nên dùng prompt engineering thay thế?",
      options: [
        "Khi có ít hơn 10 mẫu dữ liệu và tác vụ đơn giản",
        "Khi muốn mô hình chuyên sâu về y khoa",
        "Khi cần mô hình nói tiếng Việt tốt hơn",
        "Khi có ngân sách lớn và dữ liệu phong phú",
      ],
      correct: 0,
      explanation:
        "Với tác vụ đơn giản và ít dữ liệu, prompt engineering (few-shot) thường đủ tốt và rẻ hơn nhiều so với fine-tuning.",
    },
    {
      question: "Catastrophic forgetting trong fine-tuning là gì?",
      options: [
        "Mô hình quên mất kiến thức pre-train khi học kiến thức mới quá mạnh",
        "Mô hình chạy quá chậm sau fine-tuning",
        "Mô hình không học được gì mới",
        "Dữ liệu fine-tuning bị mất trong quá trình huấn luyện",
      ],
      correct: 0,
      explanation:
        "Catastrophic forgetting xảy ra khi trọng số thay đổi quá nhiều, phá hủy kiến thức nền. Giải pháp: learning rate nhỏ, LoRA, hoặc regularization.",
    },
    {
      type: "fill-blank",
      question:
        "Có hai cách tinh chỉnh chính: {blank} fine-tuning cập nhật tất cả trọng số, trong khi {blank} fine-tuning chỉ cập nhật một phần nhỏ (ví dụ LoRA, Adapter).",
      blanks: [
        { answer: "full", accept: ["toàn bộ", "full-ft"] },
        { answer: "parameter-efficient", accept: ["peft", "parameter efficient"] },
      ],
      explanation:
        "Full fine-tuning cập nhật toàn bộ θ — mạnh nhưng tốn bộ nhớ. PEFT (Parameter-Efficient Fine-Tuning) như LoRA chỉ học một lượng nhỏ tham số mới, giảm 99% VRAM mà vẫn hiệu quả.",
    },
    {
      question:
        "LoRA phân rã cập nhật trọng số ΔW thành hai ma trận nhỏ A (d × r) và B (r × d). Với r << d, điều này có nghĩa là gì?",
      options: [
        "Số tham số học = r² — phụ thuộc bình phương rank",
        "Số tham số học = 2 × d × r — tuyến tính với rank, nhỏ hơn d² rất nhiều",
        "Số tham số học = d² — như full fine-tuning",
        "Số tham số học = 1 — chỉ một scalar duy nhất",
      ],
      correct: 1,
      explanation:
        "A và B có kích thước d×r và r×d, tổng là 2·d·r. Với d = 4096 và r = 8, ta có 65.536 tham số thay vì d² = 16.777.216 — tiết kiệm khoảng 256 lần.",
    },
    {
      type: "fill-blank",
      question:
        "Một LLM 7B fine-tune bằng Adam cần lưu: weights, gradients và hai trạng thái Adam (m, v). Tỉ lệ VRAM xấp xỉ {blank}× so với chỉ weights. Đó là lý do full FT cần GPU rất lớn, còn LoRA chỉ cần ~{blank}% VRAM đó.",
      blanks: [
        { answer: "4", accept: ["4x", "bốn", "4 lần"] },
        { answer: "20", accept: ["15", "10", "20%", "15-20"] },
      ],
      explanation:
        "Weights + grads + m + v = 4 bản sao (thực tế 3.5–4× tuỳ fp16/fp32). LoRA đóng băng weights gốc (có thể giữ ở int8/int4) và chỉ lưu grad/Adam cho rank-r adapter — thường còn ~15–20% VRAM của full FT.",
    },
    {
      question:
        "Bạn muốn triển khai 10 model chuyên biệt (y khoa, luật, tài chính, ...) từ cùng một backbone LLaMA 3. Phương pháp nào tiết kiệm dung lượng lưu trữ nhất?",
      options: [
        "Full fine-tune 10 lần → 10 bản sao full-size (140 GB/model × 10)",
        "LoRA 10 lần → 10 adapter rất nhỏ (~60 MB/model) + 1 backbone duy nhất",
        "Prompt tuning 10 lần → 10 prompt embeddings, cần backbone riêng mỗi lần",
        "Prefix tuning kết hợp full fine-tune",
      ],
      correct: 1,
      explanation:
        "Lợi thế rất lớn của LoRA khi multi-tenant: backbone dùng chung, mỗi domain chỉ thêm 1 file adapter vài chục MB. Trong inference có thể nạp adapter động (hot-swap) mà không cần tải lại 140 GB.",
    },
    {
      question:
        "Bạn fine-tune LLaMA trên 100 ví dụ y khoa với lr=5e-4 (gấp 25× so với khuyến nghị) trong 20 epoch. Mô hình nói tiếng Anh rất kỳ cục sau đó. Nguyên nhân chính là gì?",
      options: [
        "Dữ liệu quá nhiều — nên giảm xuống 10 mẫu",
        "Catastrophic forgetting + overfitting — lr quá lớn phá kiến thức ngôn ngữ, 20 epoch làm model nhớ vẹt 100 ví dụ",
        "GPU không đủ mạnh — cần H100",
        "Tokenizer bị hỏng",
      ],
      correct: 1,
      explanation:
        "Hai vấn đề cộng hưởng: learning rate 5e-4 quá lớn cho fine-tuning → trọng số thay đổi mạnh, phá vỡ kiến thức pre-train (catastrophic forgetting); 20 epoch trên 100 mẫu → model thuộc lòng dữ liệu (overfitting). Giải pháp: lr 1–5e-5, 2–3 epoch, và/hoặc dùng LoRA để hạn chế biên độ cập nhật.",
    },
  ];

  /* ============================================================
   *  RENDER
   * ============================================================ */
  return (
    <>
      {/* =====================================================
       *  STEP 1: PREDICTION
       * ===================================================== */}
      <LessonSection step={1} totalSteps={10} label="Dự đoán">
        <div className="mb-4">
          <ProgressSteps
            current={1}
            total={10}
            labels={[
              "Dự đoán",
              "PEFT lab",
              "Accuracy vs params",
              "VRAM",
              "Aha",
              "Thử thách",
              "Trainer lab",
              "Giải thích",
              "Lịch sử & Cạm bẫy",
              "Kiểm tra",
            ]}
          />
        </div>

        <PredictionGate
          question="Bạn có mô hình GPT-4 biết mọi thứ. Bạn muốn nó trở thành chuyên gia y khoa. Cách nào hiệu quả nhất?"
          options={[
            "Huấn luyện lại từ đầu trên dữ liệu y khoa (tốn 100 triệu USD)",
            "Cho mô hình đọc thêm vài nghìn tài liệu y khoa (fine-tuning)",
            "Chỉ cần viết prompt 'Hãy trả lời như bác sĩ' là đủ",
          ]}
          correct={1}
          explanation="Fine-tuning tận dụng kiến thức đã có và chỉ cần dữ liệu chuyên biệt nhỏ. Huấn luyện lại quá tốn kém, còn chỉ prompt thì chưa đủ sâu cho chuyên môn y khoa."
        >
          <p className="text-sm text-muted mt-2">
            Hãy cùng khám phá <strong>tại sao</strong> fine-tuning là bước nhảy
            vọt, và nhất là: tại sao{" "}
            <strong>parameter-efficient fine-tuning</strong> (LoRA, Adapter,
            Prefix) đã thay thế full fine-tuning trong hầu hết ứng dụng thực tế.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* =====================================================
       *  STEP 2: PEFT VISUALIZATION — 4 methods side by side
       * ===================================================== */}
      <LessonSection step={2} totalSteps={10} label="PEFT lab">
        <VisualizationSection topicSlug={metadata.slug}>
          <h3 className="text-base font-semibold text-foreground mb-1">
            Parameter-Efficient Fine-Tuning: 4 phương pháp
          </h3>
          <p className="text-sm text-muted mb-4">
            Đỏ = trọng số được cập nhật (trainable). Xám = đóng băng (frozen).
            Chọn phương pháp và điều chỉnh tỉ lệ trainable để xem mạng thay đổi
            thế nào.
          </p>

          {/* Method pills */}
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {PEFT_ORDER.map((m) => {
              const d = PEFT_METHODS[m];
              const isActive = method === m;
              return (
                <button
                  key={m}
                  onClick={() => {
                    setMethod(m);
                    setTrainablePct(d.trainablePctDefault);
                  }}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                    isActive
                      ? "text-white shadow-md"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                  style={isActive ? { backgroundColor: d.color } : {}}
                >
                  {d.label}
                </button>
              );
            })}
            <button
              onClick={resetPeft}
              className="rounded-lg px-3 py-2 text-xs text-muted hover:text-foreground underline-offset-2 hover:underline"
            >
              Đặt lại
            </button>
          </div>

          {/* Weight-matrix SVG */}
          <svg viewBox="0 0 700 360" className="w-full max-w-3xl mx-auto">
            <defs>
              <marker id="ft-arrow" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
              </marker>
            </defs>

            {/* Backbone — frozen or trainable depending on method */}
            <text x="180" y="24" textAnchor="middle" fill="var(--text-primary)" fontSize="13" fontWeight="bold">
              Trọng số backbone W (d × d)
            </text>

            <g transform="translate(80, 40)">
              {weightCells.map((cell, i) => {
                const size = 26;
                const gap = 2;
                const x = cell.c * (size + gap);
                const y = cell.r * (size + gap);
                const fill = cell.active ? activeDef.color : "var(--bg-surface)";
                const stroke = cell.active ? activeDef.color : "var(--border)";
                return (
                  <motion.rect
                    key={i} x={x} y={y} width={size} height={size} rx="3"
                    fill={fill} stroke={stroke} strokeWidth="0.5" initial={false}
                    animate={{ fill, opacity: cell.active ? 0.9 : 0.35 }}
                    transition={{ duration: 0.3 }}
                  />
                );
              })}
            </g>

            {/* Legend for the matrix */}
            <g transform="translate(80, 300)">
              <rect width="18" height="12" fill={activeDef.color} opacity="0.9" rx="2" />
              <text x="24" y="10" fill="var(--text-tertiary)" fontSize="11">đang học</text>
              <rect x="110" width="18" height="12" fill="var(--bg-surface)" stroke="var(--border)" opacity="0.4" rx="2" />
              <text x="134" y="10" fill="var(--text-tertiary)" fontSize="11">đóng băng</text>
            </g>

            {/* Method-specific side module */}
            {method === "lora" && (
              <g transform="translate(360, 60)">
                <text x="120" y="-14" textAnchor="middle" fill={activeDef.color} fontSize="12" fontWeight="bold">
                  LoRA: ΔW = B · A (rank r = {loraRank})
                </text>
                <rect width="60" height="180" fill={activeDef.color} opacity="0.85" rx="4" />
                <text x="30" y="100" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">A</text>
                <text x="30" y="120" textAnchor="middle" fill="white" fontSize="11">d × r</text>
                <text x="75" y="95" fill="var(--text-tertiary)" fontSize="20">×</text>
                <rect x="100" width="180" height="60" fill={activeDef.color} opacity="0.85" rx="4" />
                <text x="190" y="38" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">B</text>
                <text x="190" y="52" textAnchor="middle" fill="white" fontSize="11">r × d</text>
                <text x="120" y="200" fill="var(--text-tertiary)" fontSize="11">Tham số học: 2 · d · r</text>
                <text x="120" y="216" fill="var(--text-tertiary)" fontSize="11">→ chỉ ~0.1–1% của W</text>
              </g>
            )}

            {method === "adapter" && (
              <g transform="translate(360, 60)">
                <text x="120" y="-14" textAnchor="middle" fill={activeDef.color} fontSize="12" fontWeight="bold">
                  Adapter: module MLP nhỏ chèn cạnh mỗi lớp
                </text>
                <rect width="220" height="42" fill={activeDef.color} opacity="0.85" rx="4" />
                <text x="110" y="27" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">Down-projection (d → k)</text>
                <rect y="50" width="220" height="34" fill="var(--bg-card)" rx="4" />
                <text x="110" y="71" textAnchor="middle" fill="var(--text-tertiary)" fontSize="11">ReLU / GELU</text>
                <rect y="90" width="220" height="42" fill={activeDef.color} opacity="0.85" rx="4" />
                <text x="110" y="117" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">Up-projection (k → d)</text>
                <line x1="-30" y1="60" x2="-10" y2="60" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#ft-arrow)" />
                <line x1="225" y1="60" x2="250" y2="60" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#ft-arrow)" />
                <text x="100" y="160" fill="var(--text-tertiary)" fontSize="11">Backbone đóng băng, chỉ học Adapter</text>
              </g>
            )}

            {method === "prefix" && (
              <g transform="translate(360, 60)">
                <text x="120" y="-14" textAnchor="middle" fill={activeDef.color} fontSize="12" fontWeight="bold">
                  Prefix: vector học được gắn vào đầu chuỗi
                </text>
                {Array.from({ length: 6 }).map((_, i) => (
                  <rect key={i} x={i * 28} width="24" height="30" fill={activeDef.color} opacity="0.85" rx="3" />
                ))}
                {Array.from({ length: 8 }).map((_, i) => (
                  <rect key={i} x={180 + i * 28} width="24" height="30" fill="var(--bg-surface)" stroke="var(--border)" opacity="0.4" rx="3" />
                ))}
                <text x="85" y="52" textAnchor="middle" fill={activeDef.color} fontSize="11">prefix P</text>
                <text x="280" y="52" textAnchor="middle" fill="var(--text-tertiary)" fontSize="11">token thật (đóng băng)</text>
                <text x="50" y="120" fill="var(--text-tertiary)" fontSize="11">Tham số học: chỉ các vector prefix ở mỗi lớp</text>
                <text x="50" y="134" fill="var(--text-tertiary)" fontSize="11">→ ~0.01–0.1% của W</text>
              </g>
            )}

            {method === "full" && (
              <g transform="translate(360, 120)">
                <text x="150" y="0" textAnchor="middle" fill={activeDef.color} fontSize="14" fontWeight="bold">Mọi ô trong W đều đỏ</text>
                <text x="150" y="22" textAnchor="middle" fill="var(--text-tertiary)" fontSize="11">100% tham số được cập nhật</text>
                <text x="150" y="46" textAnchor="middle" fill="var(--text-tertiary)" fontSize="11">→ cần ~16× VRAM so với inference</text>
                <text x="150" y="66" textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="bold">Mạnh nhất — nhưng đắt nhất</text>
              </g>
            )}
          </svg>

          {/* Method info card */}
          <div className="rounded-lg border border-border bg-background/40 p-4 text-sm">
            <p className="font-semibold" style={{ color: activeDef.color }}>
              {activeDef.labelEn} · {activeDef.year}
            </p>
            <p className="text-muted mt-1">{activeDef.description}</p>
          </div>

          {/* Controls: trainable % + optional rank for LoRA */}
          <div className="space-y-4 max-w-md mx-auto mt-5">
            <div className="space-y-1">
              <label className="text-sm text-muted">
                Tỉ lệ tham số học:{" "}
                <strong className="text-foreground">
                  {trainablePct.toFixed(2)}%
                </strong>
              </label>
              <input
                type="range"
                min={0.01}
                max={100}
                step={0.01}
                value={trainablePct}
                onChange={(e) => setTrainablePct(parseFloat(e.target.value))}
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-[10px] text-muted">
                <span>0.01%</span>
                <span>1%</span>
                <span>100%</span>
              </div>
            </div>

            {method === "lora" && (
              <div className="space-y-1">
                <label className="text-sm text-muted">
                  LoRA rank r ={" "}
                  <strong className="text-foreground">{loraRank}</strong>
                </label>
                <input
                  type="range"
                  min={1}
                  max={64}
                  step={1}
                  value={loraRank}
                  onChange={(e) => setLoraRank(Number(e.target.value))}
                  className="w-full accent-accent"
                />
                <div className="flex justify-between text-[10px] text-muted">
                  <span>r = 1</span>
                  <span>r = 8 (thường dùng)</span>
                  <span>r = 64</span>
                </div>
              </div>
            )}
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* =====================================================
       *  STEP 3: ACCURACY vs TRAINABLE % TRADEOFF CHART
       * ===================================================== */}
      <LessonSection step={3} totalSteps={10} label="Accuracy vs params">
        <VisualizationSection topicSlug={metadata.slug}>
          <h3 className="text-base font-semibold text-foreground mb-1">
            Accuracy vs tham số học (log scale)
          </h3>
          <p className="text-sm text-muted mb-4">
            Càng nhiều tham số học, accuracy càng tăng — nhưng đường cong bão
            hoà rất sớm. LoRA chỉ dùng 0.1–1% tham số đã đạt ~99% accuracy của
            full FT.
          </p>

          <svg viewBox="0 0 700 320" className="w-full max-w-3xl mx-auto">
            {/* Axes */}
            <line x1="60" y1="260" x2="660" y2="260" stroke="#475569" strokeWidth="1" />
            <line x1="60" y1="40" x2="60" y2="260" stroke="#475569" strokeWidth="1" />

            {/* Y-axis labels: accuracy */}
            {[60, 70, 80, 90, 100].map((v) => {
              const y = 260 - ((v - 60) / 40) * 220;
              return (
                <g key={v}>
                  <line x1="55" y1={y} x2="60" y2={y} stroke="#64748b" strokeWidth="1" />
                  <text x="50" y={y + 4} textAnchor="end" fill="#64748b" fontSize="11">{v}%</text>
                </g>
              );
            })}

            {/* X-axis labels: log scale 0.01 → 100 */}
            {[0.01, 0.1, 1, 10, 100].map((v) => {
              const logVal = Math.log10(v / 0.01) / 4;
              const x = 60 + logVal * 600;
              return (
                <g key={v}>
                  <line x1={x} y1="260" x2={x} y2="265" stroke="#64748b" strokeWidth="1" />
                  <text x={x} y="280" textAnchor="middle" fill="#64748b" fontSize="11">{v}%</text>
                </g>
              );
            })}

            <text x="360" y="304" textAnchor="middle" fill="var(--text-tertiary)" fontSize="11">% tham số học (log)</text>
            <text x="18" y="150" textAnchor="middle" fill="var(--text-tertiary)" fontSize="11" transform="rotate(-90 18 150)">Accuracy (%)</text>

            {/* Curve */}
            <polyline
              points={ACCURACY_CURVE.map((p) => {
                const logVal = Math.log10(p.pct / 0.01) / 4;
                const x = 60 + Math.max(0, Math.min(1, logVal)) * 600;
                const y = 260 - ((p.acc - 60) / 40) * 220;
                return `${x},${y}`;
              }).join(" ")}
              fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4,4" opacity={0.6}
            />

            {/* Method markers */}
            {PEFT_ORDER.map((m) => {
              const d = PEFT_METHODS[m];
              const pct = d.trainablePctDefault;
              const logVal = Math.log10(pct / 0.01) / 4;
              const x = 60 + Math.max(0, Math.min(1, logVal)) * 600;
              const y = 260 - ((d.accuracyRetained - 60) / 40) * 220;
              return (
                <g key={m}>
                  <circle cx={x} cy={y} r={method === m ? 9 : 6} fill={d.color} stroke="white" strokeWidth="2" opacity={method === m ? 1 : 0.75} />
                  <text x={x} y={y - 14} textAnchor="middle" fill={d.color} fontSize="11" fontWeight="bold">{d.label}</text>
                  <text x={x} y={y + 22} textAnchor="middle" fill="var(--text-tertiary)" fontSize="11">
                    {pct}% · {d.accuracyRetained}%
                  </text>
                </g>
              );
            })}

            {/* Current trainable-% marker (interactive) */}
            {(() => {
              const logVal = Math.log10(trainablePct / 0.01) / 4;
              const x = 60 + Math.max(0, Math.min(1, logVal)) * 600;
              const y = 260 - ((accuracyEstimate - 60) / 40) * 220;
              return (
                <g>
                  <line x1={x} y1="40" x2={x} y2="260" stroke={activeDef.color} strokeWidth="1" strokeDasharray="3,3" opacity={0.5} />
                  <circle cx={x} cy={y} r="5" fill="white" stroke={activeDef.color} strokeWidth="2.5" />
                </g>
              );
            })()}
          </svg>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p
                className="text-lg font-bold"
                style={{ color: activeDef.color }}
              >
                {accuracyEstimate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted">Accuracy ước tính</p>
            </div>
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className="text-lg font-bold text-foreground">
                {trainablePct.toFixed(2)}%
              </p>
              <p className="text-xs text-muted">Tham số học</p>
            </div>
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className="text-lg font-bold text-foreground">
                {(100 / Math.max(0.01, trainablePct)).toFixed(0)}×
              </p>
              <p className="text-xs text-muted">Tiết kiệm so với full FT</p>
            </div>
          </div>
        </VisualizationSection>

        <Callout variant="insight" title="Vì sao đường cong bão hoà sớm?">
          Trong paper LoRA (2021), Hu và cộng sự chứng minh: cập nhật cần thiết
          ΔW thường có <em>rank hiệu dụng rất thấp</em>. Điều này nghĩa là chỉ
          cần một không gian con nhỏ (r = 4–16) để biểu diễn &quot;sự thay
          đổi&quot; — không cần đụng đến toàn bộ ma trận d × d.
        </Callout>
      </LessonSection>

      {/* =====================================================
       *  STEP 4: VRAM BAR CHART
       * ===================================================== */}
      <LessonSection step={4} totalSteps={10} label="VRAM">
        <VisualizationSection topicSlug={metadata.slug}>
          <h3 className="text-base font-semibold text-foreground mb-1">
            VRAM sử dụng: LLaMA-7B (ước lượng)
          </h3>
          <p className="text-sm text-muted mb-4">
            Tham chiếu: full FT trên 7B LLaMA cần ~80–100 GB VRAM (fp16 + Adam).
            LoRA có thể chạy trên 1 GPU 24 GB. QLoRA đẩy xuống dưới 16 GB.
          </p>

          <div className="space-y-3">
            {PEFT_ORDER.map((m) => {
              const d = PEFT_METHODS[m];
              const vramGB = Math.round(d.vramFraction * 100);
              const widthPct = vramGB; // 0-100
              const active = method === m;
              return (
                <div key={m} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span
                      className={`font-semibold ${active ? "" : "text-muted"}`}
                      style={{ color: active ? d.color : undefined }}
                    >
                      {d.label}
                    </span>
                    <span className="text-muted">
                      ~{vramGB} GB · {d.accuracyRetained}% accuracy
                    </span>
                  </div>
                  <div className="h-5 bg-surface/50 rounded-sm relative overflow-hidden">
                    <motion.div
                      className="h-full rounded-sm"
                      style={{ backgroundColor: d.color, opacity: 0.85 }}
                      initial={{ width: 0 }}
                      animate={{ width: `${widthPct}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                    {active && (
                      <div
                        className="absolute top-0 bottom-0 border-r-2"
                        style={{
                          right: `${100 - widthPct}%`,
                          borderColor: d.color,
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-lg border border-border bg-background/40 p-4 text-sm">
            <p className="font-semibold text-foreground mb-2">
              Chi tiết cho phương pháp đang chọn ({activeDef.label}):
            </p>
            <ul className="space-y-1 text-muted">
              <li>
                Trọng số đóng băng:{" "}
                <strong className="text-foreground">
                  ~{vramEstimate.frozen} GB
                </strong>
              </li>
              <li>
                Gradient + Adam cho phần học:{" "}
                <strong className="text-foreground">
                  ~{vramEstimate.trainable} GB
                </strong>
              </li>
              <li>
                Activations &amp; overhead:{" "}
                <strong className="text-foreground">
                  ~{vramEstimate.overhead} GB
                </strong>
              </li>
              <li className="pt-1 border-t border-border">
                Tổng:{" "}
                <strong className="text-foreground">
                  ~{vramEstimate.full} GB
                </strong>
              </li>
            </ul>
          </div>
        </VisualizationSection>

        <Callout variant="tip" title="QLoRA — khi VRAM quá ít">
          <TopicLink slug="qlora">QLoRA</TopicLink> kết hợp LoRA với lượng tử
          hoá 4-bit cho backbone. Kết quả: fine-tune LLaMA-65B chỉ với một GPU
          48 GB, gần như không mất accuracy. Đây là điểm đột phá giúp cá nhân
          (không phải chỉ big tech) fine-tune được các mô hình cỡ lớn.
        </Callout>
      </LessonSection>

      {/* =====================================================
       *  STEP 5: AHA MOMENT
       * ===================================================== */}
      <LessonSection step={5} totalSteps={10} label="Aha">
        <AhaMoment>
          <p>
            <strong>Fine-tuning</strong> không phải dạy mô hình kiến thức mới từ
            con số 0 — mà là{" "}
            <strong>kích hoạt và chuyên biệt hoá</strong> kiến thức mà nó đã biết
            sẵn. Giống như bác sĩ đa khoa đã hiểu cơ thể người, chỉ cần học thêm
            chuyên khoa tim mạch thay vì vào lại trường y từ năm nhất.
          </p>
          <p className="mt-3">
            Điểm then chốt của PEFT:{" "}
            <em>cập nhật cần thiết ΔW có rank hiệu dụng rất thấp</em>. Nghĩa là
            phần kiến thức mới mà model cần học thực ra rất nhỏ — và LoRA chính
            là cách khai thác sự thật đó để tiết kiệm 99% bộ nhớ mà vẫn giữ gần
            như toàn bộ chất lượng.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* =====================================================
       *  STEP 6: INLINE CHALLENGES
       * ===================================================== */}
      <LessonSection step={6} totalSteps={10} label="Thử thách">
        <div className="space-y-5">
          <InlineChallenge
            question="Bạn fine-tune mô hình trên 500 mẫu dữ liệu pháp lý trong 20 epoch. Mô hình đạt 99% trên dữ liệu huấn luyện nhưng chỉ 60% trên dữ liệu mới. Vấn đề là gì?"
            options={[
              "Dữ liệu không đủ đa dạng và mô hình đã overfitting",
              "Learning rate quá nhỏ",
              "Mô hình gốc quá yếu",
              "Cần thêm GPU mạnh hơn",
            ]}
            correct={0}
            explanation="500 mẫu + 20 epoch = overfitting điển hình. Mô hình 'thuộc bài' thay vì 'hiểu bài'. Giải pháp: thêm dữ liệu, giảm epoch (3-5), hoặc dùng LoRA để hạn chế số tham số thay đổi."
          />

          <InlineChallenge
            question="Công ty bạn có 5 sản phẩm cần chatbot chuyên biệt. Ngân sách GPU hạn chế. Kiến trúc triển khai nào hợp lý nhất?"
            options={[
              "5 lần full fine-tune → lưu 5 model đầy đủ (5 × 140 GB) trên 5 máy chủ khác nhau",
              "1 backbone dùng chung + 5 LoRA adapter nhỏ, hot-swap trong runtime",
              "Không fine-tune, chỉ dùng prompt dài cho mọi sản phẩm",
              "Dùng 5 model bất kỳ khác nhau từ Hugging Face",
            ]}
            correct={1}
            explanation="Multi-LoRA là pattern phổ biến nhất hiện tại (Mistral AI, OpenAI fine-tuning API đều dựa trên ý tưởng này). Backbone nằm trong VRAM một lần, adapter chỉ vài chục MB có thể đổi nhanh giữa các request."
          />
        </div>
      </LessonSection>

      {/* =====================================================
       *  STEP 7: CLASSIC TRAINER LAB
       * ===================================================== */}
      <LessonSection step={7} totalSteps={10} label="Trainer lab">
        <VisualizationSection topicSlug={metadata.slug}>
          <h3 className="text-base font-semibold text-foreground mb-1">
            Phòng thí nghiệm Trainer
          </h3>
          <p className="text-sm text-muted mb-4">
            Điều chỉnh 3 tham số và quan sát chất lượng mô hình thay đổi. Đây là
            các hyperparameter quan trọng nhất khi gọi{" "}
            <code>Trainer.train()</code> trong Hugging Face.
          </p>

          <div className="space-y-4 max-w-lg mx-auto">
            <div className="space-y-1">
              <label className="text-sm text-muted">
                Số lượng dữ liệu:{" "}
                <strong className="text-foreground">
                  {dataSize.toLocaleString()}
                </strong>{" "}
                mẫu
              </label>
              <input
                type="range"
                min={100}
                max={50000}
                step={100}
                value={dataSize}
                onChange={(e) => setDataSize(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-surface accent-accent cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted">
                <span>100</span>
                <span>50.000</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-muted">
                Learning rate:{" "}
                <strong className="text-foreground">{learningRate}e-5</strong>
              </label>
              <input
                type="range"
                min={0.1}
                max={10}
                step={0.1}
                value={learningRate}
                onChange={(e) => setLearningRate(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-surface accent-accent cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted">
                <span>0.1e-5 (rất nhỏ)</span>
                <span>10e-5 (rất lớn)</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-muted">
                Số epoch:{" "}
                <strong className="text-foreground">{epochs}</strong>
              </label>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={epochs}
                onChange={(e) => setEpochs(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-surface accent-accent cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted">
                <span>1</span>
                <span>10</span>
              </div>
            </div>
          </div>

          {/* Results dashboard */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mt-6">
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p
                className={`text-lg font-bold ${
                  Number(result.quality) > 85
                    ? "text-green-400"
                    : Number(result.quality) > 70
                      ? "text-yellow-400"
                      : "text-red-400"
                }`}
              >
                {result.quality}%
              </p>
              <p className="text-xs text-muted">Chất lượng ước tính</p>
            </div>
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p
                className={`text-lg font-bold ${
                  result.overfitRisk === "Thấp"
                    ? "text-green-400"
                    : result.overfitRisk === "Trung bình"
                      ? "text-yellow-400"
                      : "text-red-400"
                }`}
              >
                {result.overfitRisk}
              </p>
              <p className="text-xs text-muted">Nguy cơ overfitting</p>
            </div>
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p
                className={`text-lg font-bold ${
                  result.forgettingRisk === "Thấp"
                    ? "text-green-400"
                    : result.forgettingRisk === "Trung bình"
                      ? "text-yellow-400"
                      : "text-red-400"
                }`}
              >
                {result.forgettingRisk}
              </p>
              <p className="text-xs text-muted">Nguy cơ quên kiến thức cũ</p>
            </div>
          </div>

          <Callout variant="tip" title="Thử nghiệm">
            Tăng learning rate lên 8-10 và quan sát nguy cơ quên kiến thức cũ
            tăng vọt. Đây chính là catastrophic forgetting! Ngược lại, hạ lr
            xuống 0.1 và tăng epoch — model học rất chậm, rủi ro overfit ít
            hơn nhưng có thể không đủ thời gian để thích ứng.
          </Callout>
        </VisualizationSection>
      </LessonSection>

      {/* =====================================================
       *  STEP 8: EXPLANATION / DEEP DIVE
       * ===================================================== */}
      <LessonSection step={8} totalSteps={10} label="Giải thích">
        <ExplanationSection>
          <p>
            <strong>Fine-tuning</strong> là quá trình huấn luyện thêm một mô hình
            đã được pre-train trên tập dữ liệu chuyên biệt nhỏ hơn, nhằm thích
            ứng mô hình cho tác vụ hoặc lĩnh vực cụ thể. Về mặt toán học:
          </p>

          <LaTeX block>
            {
              "\\theta^* = \\arg\\min_\\theta \\sum_{(x,y) \\in D_{\\text{ft}}} \\mathcal{L}(f_\\theta(x), y)"
            }
          </LaTeX>

          <p>
            Trong đó <LaTeX>{"\\theta"}</LaTeX> được khởi tạo từ trọng số
            pre-train thay vì ngẫu nhiên. Đây chính là sức mạnh của{" "}
            <strong>transfer learning</strong> — không phải bắt đầu từ số 0. So
            với <TopicLink slug="prompt-engineering">prompt engineering</TopicLink>
            , fine-tuning thay đổi trọng số mô hình vĩnh viễn (xem thêm{" "}
            <TopicLink slug="fine-tuning-vs-prompting">
              Fine-tuning vs Prompting
            </TopicLink>
            ).
          </p>

          <p>
            <strong>LoRA re-formulation.</strong> Thay vì học toàn bộ ΔW ∈
            ℝ<sup>d×d</sup>, LoRA giả định ΔW có rank thấp và phân rã:
          </p>

          <LaTeX block>{"\\Delta W = B \\cdot A, \\quad A \\in \\mathbb{R}^{r \\times d},\\; B \\in \\mathbb{R}^{d \\times r}, \\quad r \\ll d"}</LaTeX>

          <p>
            Trong forward pass: <LaTeX>{"h = W x + B A x"}</LaTeX>. Khi fine-tune
            xong, có thể <em>merge</em> <LaTeX>{"W' = W + BA"}</LaTeX> để không
            tăng chi phí inference.
          </p>

          <p>Các loại fine-tuning phổ biến:</p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>Full Fine-tuning:</strong> Cập nhật tất cả trọng số. Hiệu
              quả nhất nhưng tốn bộ nhớ GPU và dễ overfitting trên tập nhỏ.
            </li>
            <li>
              <strong>SFT (Supervised Fine-Tuning):</strong> Huấn luyện trên các
              cặp (instruction, response) để mô hình học cách tuân theo chỉ dẫn.
              Bước đầu của <TopicLink slug="rlhf">RLHF</TopicLink>.
            </li>
            <li>
              <strong>PEFT (Parameter-Efficient):</strong> Chỉ cập nhật một phần
              nhỏ trọng số — <TopicLink slug="lora">LoRA</TopicLink>, Adapter,
              Prefix, Prompt Tuning. Tiết kiệm bộ nhớ đáng kể.
            </li>
            <li>
              <strong>DPO / Alignment:</strong> Sau SFT, dùng pairwise
              preferences để căn chỉnh hành vi (
              <TopicLink slug="dpo">DPO</TopicLink>, RLHF, GRPO).
            </li>
          </ul>

          <CodeBlock language="python" title="fine_tune_full.py">
{`from transformers import AutoModelForCausalLM, Trainer, TrainingArguments
from datasets import load_dataset

# Tải mô hình đã pre-train
model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-3-8B")

# Chuẩn bị dữ liệu chuyên biệt
dataset = load_dataset("json", data_files="medical_qa.jsonl")

# Fine-tune với learning rate nhỏ (tránh phá vỡ kiến thức cũ)
args = TrainingArguments(
    output_dir="./llama-medical",
    learning_rate=2e-5,           # Nhỏ hơn pre-training 10-100x
    num_train_epochs=3,           # Ít epoch tránh overfitting
    per_device_train_batch_size=4,
    warmup_ratio=0.03,
    lr_scheduler_type="cosine",
    gradient_checkpointing=True,  # Tiết kiệm VRAM
    bf16=True,                    # Mixed precision
)

trainer = Trainer(model=model, train_dataset=dataset["train"], args=args)
trainer.train()
trainer.save_model()`}
          </CodeBlock>

          <CodeBlock language="python" title="fine_tune_lora.py">
{`from transformers import AutoModelForCausalLM
from peft import LoraConfig, get_peft_model, TaskType

# Tải backbone và "đóng băng" trọng số
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-3-8B",
    load_in_4bit=True,  # → QLoRA: backbone 4-bit, adapter fp16
)

# Chèn LoRA adapter
lora_config = LoraConfig(
    task_type=TaskType.CAUSAL_LM,
    r=8,                # rank — càng lớn càng nhiều tham số
    lora_alpha=16,      # scaling
    lora_dropout=0.05,
    target_modules=["q_proj", "v_proj"],  # chỉ attention Q, V
)
model = get_peft_model(model, lora_config)

# Chỉ 0.1–0.3% tham số được học
model.print_trainable_parameters()
# → trainable params: 8,388,608 || all params: 8,038,274,048
#   || trainable%: 0.104

# Phần còn lại giống Trainer thông thường:
trainer.train()
model.save_pretrained("./llama-medical-lora")  # ~65 MB, không phải 14 GB!`}
          </CodeBlock>

          <Callout variant="warning" title="Catastrophic forgetting">
            Khi learning rate quá lớn hoặc fine-tune quá lâu, mô hình có thể
            quên kiến thức nền. Giống như bác sĩ tim mạch quá chuyên sâu đến mức
            quên kiến thức cơ bản về hô hấp. Giải pháp: dùng learning rate nhỏ
            (1-5e-5), ít epoch (2-5), hoặc PEFT như{" "}
            <TopicLink slug="qlora">QLoRA</TopicLink>.
          </Callout>

          <Callout variant="insight" title="Khi nào chọn phương pháp nào?">
            <strong>Full FT:</strong> khi có ≥ 100K mẫu chất lượng cao và đủ
            GPU. <strong>LoRA:</strong> mặc định trong hầu hết trường hợp thực
            tế (adapter nhỏ, multi-tenant, hot-swap).{" "}
            <strong>QLoRA:</strong> khi VRAM rất eo hẹp.{" "}
            <strong>Prefix/Prompt tuning:</strong> cho bài toán nhẹ, muốn nhỏ
            nhất có thể — thường kém hơn LoRA 2–5% accuracy nhưng triển khai rất
            gọn.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* =====================================================
       *  STEP 9: COLLAPSIBLE DETAILS — HISTORY + PITFALLS
       * ===================================================== */}
      <LessonSection step={9} totalSteps={10} label="Lịch sử & Cạm bẫy">
        <div className="space-y-3">
          <CollapsibleDetail title="Lịch sử: từ ULMFiT đến LoRA">
            <div className="space-y-3 text-sm text-foreground/80 leading-relaxed">
              <p>
                <strong>2018 — ULMFiT (Howard &amp; Ruder).</strong> Bài báo
                &quot;Universal Language Model Fine-Tuning&quot; giới thiệu ý
                tưởng: dùng chung một language model được pre-train trên
                Wikipedia, rồi fine-tune cho các tác vụ downstream (phân loại,
                NER, ...). Đây là bước đầu của kỷ nguyên transfer learning trong
                NLP.
              </p>
              <p>
                <strong>2018 — BERT (Devlin và cộng sự).</strong> Chuẩn hoá quy
                trình &quot;pre-train + fine-tune&quot; cho Transformer. Mỗi tác
                vụ GLUE đều được giải bằng cách gắn thêm vài lớp phân loại lên
                BERT rồi fine-tune toàn bộ.
              </p>
              <p>
                <strong>2019 — Adapter (Houlsby và cộng sự).</strong> Nhận thấy
                fine-tune toàn bộ BERT cho mỗi tác vụ rất tốn kém, nhóm Google
                chèn các module MLP nhỏ (adapter) giữa các lớp Transformer. Kết
                quả: gần như giữ nguyên accuracy với 3% tham số.
              </p>
              <p>
                <strong>2020 — GPT-3 &amp; few-shot.</strong> OpenAI chứng minh
                model đủ lớn có thể làm nhiều tác vụ chỉ bằng prompt, không cần
                fine-tune. Điều này không xoá bỏ fine-tuning — nó chuyển
                fine-tuning từ &quot;bắt buộc&quot; thành &quot;khi cần chuyên
                sâu&quot;.
              </p>
              <p>
                <strong>2021 — Prefix/Prompt Tuning (Li &amp; Liang; Lester).</strong>{" "}
                Hai bài báo gần như đồng thời: thay vì học trọng số, học một
                chuỗi vector &quot;prefix&quot; ở đầu mỗi lớp attention. Cực kỳ
                ít tham số.
              </p>
              <p>
                <strong>2021 — LoRA (Hu và cộng sự, Microsoft).</strong>{" "}
                Low-Rank Adaptation: ΔW = B·A với rank r thấp. Hiệu quả gần như
                full FT, chỉ 0.1% tham số. Trở thành phương pháp PEFT phổ biến
                nhất.
              </p>
              <p>
                <strong>2023 — QLoRA (Dettmers và cộng sự).</strong> Kết hợp
                LoRA với lượng tử hoá 4-bit NF4 cho backbone. Fine-tune LLaMA-65B
                trên một GPU 48 GB — bước ngoặt giúp cộng đồng open-source đuổi
                kịp các phòng thí nghiệm lớn.
              </p>
              <p>
                <strong>2023–2024 — DPO, IPO, KTO.</strong> Thay thế RLHF truyền
                thống bằng loss function đơn giản hơn. Thường chạy trên model đã
                SFT → kết hợp SFT (fine-tune) + DPO là công thức đào tạo chuẩn
                cho các model instruction-tuned hiện đại (Zephyr, Tulu,
                Mistral-Instruct).
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="Cạm bẫy phổ biến khi fine-tune LLM">
            <div className="space-y-3 text-sm text-foreground/80 leading-relaxed">
              <p>
                <strong>1. Dữ liệu bẩn hơn bạn nghĩ.</strong> Fine-tuning là
                &quot;rác vào, rác ra&quot;. 500 mẫu sạch tốt hơn 50K mẫu nhiễu.
                Hãy dành phần lớn thời gian cho <em>data curation</em>: loại bỏ
                trùng lặp, PII, hallucination, format sai.
              </p>
              <p>
                <strong>2. Learning rate quá lớn.</strong> Pre-training dùng lr
                1e-4, fine-tune cần nhỏ hơn 10–100 lần: 1–5e-5 cho full FT, có
                thể cao hơn (1e-4 → 3e-4) cho LoRA vì chỉ cập nhật adapter nhỏ.
              </p>
              <p>
                <strong>3. Quá nhiều epoch.</strong> Với dataset &lt; 10K mẫu,
                2–3 epoch thường là tối ưu. 10+ epoch → overfit nghiêm trọng.
                Theo dõi eval loss, dừng sớm khi nó tăng trở lại.
              </p>
              <p>
                <strong>4. Bỏ qua validation set.</strong> Luôn giữ lại 10–20%
                dữ liệu làm validation — không phải chỉ để chấm điểm cuối cùng
                mà để <em>early stopping</em>.
              </p>
              <p>
                <strong>5. Quên kiểm tra format prompt.</strong> Mỗi họ model
                có template riêng (LLaMA-3: <code>&lt;|begin_of_text|&gt;</code>
                ...; Mistral: <code>[INST]...[/INST]</code>). Fine-tune với
                template sai → model &quot;vỡ&quot;, đôi khi không còn biết
                dừng.
              </p>
              <p>
                <strong>6. Chọn LoRA rank sai.</strong> r = 4–8 cho hầu hết tác
                vụ; r = 16–64 cho miền rất khác (ví dụ chuyển từ tiếng Anh sang
                tiếng Việt chuyên ngành). Rank quá lớn không cải thiện và lãng
                phí tham số; quá nhỏ → model không học đủ.
              </p>
              <p>
                <strong>7. Bỏ qua evaluate trên task gốc.</strong> Fine-tune
                thường <em>cải thiện</em> task mục tiêu nhưng <em>làm giảm</em>{" "}
                khả năng trên task khác. Luôn chạy MMLU / HellaSwag / TruthfulQA
                trước và sau fine-tune để đo catastrophic forgetting.
              </p>
              <p>
                <strong>8. Không deduplicate train vs eval.</strong> Một vài mẫu
                trùng giữa train và test đã đủ để đẩy accuracy &quot;ảo&quot;
                lên rất cao. Chạy MinHash hoặc cosine similarity để lọc.
              </p>
            </div>
          </CollapsibleDetail>
        </div>
      </LessonSection>

      {/* =====================================================
       *  STEP 10: SUMMARY + QUIZ
       * ===================================================== */}
      <LessonSection step={10} totalSteps={10} label="Tóm tắt & Kiểm tra">
        <MiniSummary
          title="Những điều cần nhớ về Fine-tuning"
          points={[
            "Fine-tuning là huấn luyện thêm mô hình pre-train trên dữ liệu chuyên biệt — tận dụng transfer learning thay vì học từ đầu. Chi phí giảm từ hàng trăm triệu USD xuống hàng trăm USD.",
            "Ba tham số huấn luyện quan trọng: số lượng dữ liệu (càng đa dạng càng tốt), learning rate (nhỏ: 1-5e-5), số epoch (ít: 2-5).",
            "Catastrophic forgetting: lr quá lớn hoặc fine-tune quá lâu → mô hình quên kiến thức cũ. Luôn đo lại accuracy trên task gốc trước và sau fine-tune.",
            "PEFT là mặc định hiện đại: LoRA (phổ biến nhất, 0.1–1% tham số), Adapter (chèn module nhỏ), Prefix Tuning (thêm vector học được). Thường đạt ≥ 97% accuracy của full FT.",
            "LoRA = ΔW chia thành hai ma trận low-rank B·A. Tiết kiệm VRAM 80–90% và cho phép multi-tenant: nhiều adapter cùng một backbone, hot-swap trong runtime.",
            "Quy trình hiện đại cho instruction-following LLM: pre-train → SFT (fine-tune có nhãn) → DPO/RLHF (alignment). Ứng dụng phổ biến: chatbot chuyên ngành, copilot, domain expert.",
          ]}
        />

        <div className="mt-6">
          <QuizSection questions={quizQuestions} />
        </div>
      </LessonSection>
    </>
  );
}
