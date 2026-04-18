"use client";
import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { PredictionGate, AhaMoment, InlineChallenge, Callout, CollapsibleDetail,
  MiniSummary, CodeBlock, LessonSection, LaTeX, TopicLink, ProgressSteps } from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

/* ─────────────────────────────────────────────────────────────
   METADATA — GPT topic
   Giữ nguyên slug, mở rộng trải nghiệm viz: autoregressive gen
   + attention heatmap + sampling (temp/top-k/top-p) + scaling law
   ───────────────────────────────────────────────────────────── */
export const metadata: TopicMeta = {
  slug: "gpt",
  title: "GPT",
  titleVi: "GPT - Mô hình ngôn ngữ tự hồi quy",
  description:
    "Mô hình ngôn ngữ sinh văn bản bằng cách dự đoán từ tiếp theo dựa trên các từ trước đó, nền tảng của ChatGPT.",
  category: "nlp",
  tags: ["nlp", "transformer", "language-model"],
  difficulty: "advanced",
  relatedSlugs: ["transformer", "attention-mechanism", "bert"],
  vizType: "interactive",
};

/* ─────────────────────────────────────────────────────────────
   CONSTANTS — Tokenize "Tôi yêu" rồi autoregressive generate
   Mô phỏng quá trình 1 layer attention + softmax-based sampling
   trên top-10 token candidates.
   ───────────────────────────────────────────────────────────── */
const TOTAL_STEPS = 10;

// Prompt ban đầu — đã được tokenize (mỗi phần tử là 1 token)
// Trong GPT thật, tokenizer BPE sẽ chia thành subwords; ở đây ta
// dùng từ nguyên cho dễ hình dung với người Việt.
const PROMPT_TOKENS = ["Tôi", "yêu"] as const;

// Mỗi step sinh = (context tokens so far, top-10 candidates với logits)
// Ta pre-compute 6 bước để tạo ra câu "Tôi yêu em rất nhiều và mãi mãi"
interface GenStep {
  // Token đã có sẵn trước khi bước này sinh
  context: string[];
  // Attention weights: context[i] nhận bao nhiêu "sự chú ý"
  // (giả lập - tổng = 1.0)
  attention: number[];
  // Top-10 ứng viên cho token tiếp theo, kèm logit
  candidates: { token: string; logit: number }[];
  // Token cuối cùng được sample (phụ thuộc temperature/top-k/top-p)
  // Chúng ta dùng index 0 (argmax) làm mặc định để hiển thị
  sampledIdx: number;
}

const GEN_STEPS: GenStep[] = [
  {
    context: ["Tôi", "yêu"],
    attention: [0.35, 0.65],
    candidates: [
      { token: "em", logit: 4.2 },
      { token: "bạn", logit: 3.8 },
      { token: "cô", logit: 2.9 },
      { token: "anh", logit: 2.5 },
      { token: "người", logit: 2.2 },
      { token: "gia đình", logit: 2.0 },
      { token: "Việt Nam", logit: 1.7 },
      { token: "cuộc sống", logit: 1.5 },
      { token: "đất nước", logit: 1.2 },
      { token: "mẹ", logit: 0.9 },
    ],
    sampledIdx: 0,
  },
  {
    context: ["Tôi", "yêu", "em"],
    attention: [0.22, 0.28, 0.50],
    candidates: [
      { token: "rất", logit: 3.9 },
      { token: "nhiều", logit: 3.5 },
      { token: "mãi", logit: 3.2 },
      { token: "suốt", logit: 2.8 },
      { token: "hơn", logit: 2.5 },
      { token: "từ", logit: 2.1 },
      { token: ",", logit: 1.9 },
      { token: "như", logit: 1.6 },
      { token: "đến", logit: 1.4 },
      { token: "!", logit: 1.1 },
    ],
    sampledIdx: 0,
  },
  {
    context: ["Tôi", "yêu", "em", "rất"],
    attention: [0.12, 0.18, 0.35, 0.35],
    candidates: [
      { token: "nhiều", logit: 5.1 },
      { token: "lâu", logit: 3.2 },
      { token: "sâu", logit: 2.8 },
      { token: "thật", logit: 2.5 },
      { token: "đậm", logit: 2.0 },
      { token: "mãnh liệt", logit: 1.7 },
      { token: "tha thiết", logit: 1.4 },
      { token: "chân thành", logit: 1.2 },
      { token: "nồng nàn", logit: 0.9 },
      { token: "dịu dàng", logit: 0.6 },
    ],
    sampledIdx: 0,
  },
  {
    context: ["Tôi", "yêu", "em", "rất", "nhiều"],
    attention: [0.08, 0.12, 0.25, 0.25, 0.30],
    candidates: [
      { token: "và", logit: 3.8 },
      { token: ",", logit: 3.5 },
      { token: ".", logit: 3.0 },
      { token: "nên", logit: 2.7 },
      { token: "vì", logit: 2.4 },
      { token: "dù", logit: 2.1 },
      { token: "hơn", logit: 1.8 },
      { token: "như", logit: 1.5 },
      { token: "lắm", logit: 1.2 },
      { token: "!", logit: 0.9 },
    ],
    sampledIdx: 0,
  },
  {
    context: ["Tôi", "yêu", "em", "rất", "nhiều", "và"],
    attention: [0.05, 0.10, 0.20, 0.18, 0.22, 0.25],
    candidates: [
      { token: "mãi", logit: 3.6 },
      { token: "sẽ", logit: 3.3 },
      { token: "luôn", logit: 3.0 },
      { token: "không", logit: 2.6 },
      { token: "tin", logit: 2.3 },
      { token: "mong", logit: 2.0 },
      { token: "hy vọng", logit: 1.7 },
      { token: "cả", logit: 1.4 },
      { token: "sẵn sàng", logit: 1.1 },
      { token: "chỉ", logit: 0.8 },
    ],
    sampledIdx: 0,
  },
  {
    context: ["Tôi", "yêu", "em", "rất", "nhiều", "và", "mãi"],
    attention: [0.04, 0.08, 0.17, 0.15, 0.18, 0.18, 0.20],
    candidates: [
      { token: "mãi", logit: 4.5 },
      { token: "không", logit: 3.1 },
      { token: "sẽ", logit: 2.8 },
      { token: "yêu", logit: 2.5 },
      { token: "bên", logit: 2.2 },
      { token: "cùng", logit: 1.9 },
      { token: "chỉ", logit: 1.6 },
      { token: "là", logit: 1.3 },
      { token: "thuộc", logit: 1.0 },
      { token: "dành", logit: 0.7 },
    ],
    sampledIdx: 0,
  },
];

// Mô phỏng scaling law data: model size (params) vs perplexity
// Dựa trên Kaplan et al. (2020) "Scaling Laws for Neural Language Models"
interface ScalingPoint {
  name: string;
  params: number; // million
  perplexity: number;
  year: number;
}

const SCALING_DATA: ScalingPoint[] = [
  { name: "GPT-1", params: 117, perplexity: 35.8, year: 2018 },
  { name: "GPT-2 S", params: 124, perplexity: 29.4, year: 2019 },
  { name: "GPT-2 M", params: 355, perplexity: 22.8, year: 2019 },
  { name: "GPT-2 L", params: 774, perplexity: 19.9, year: 2019 },
  { name: "GPT-2 XL", params: 1558, perplexity: 17.5, year: 2019 },
  { name: "GPT-3 S", params: 2700, perplexity: 15.2, year: 2020 },
  { name: "GPT-3 M", params: 6700, perplexity: 12.8, year: 2020 },
  { name: "GPT-3 L", params: 13000, perplexity: 11.0, year: 2020 },
  { name: "GPT-3 XL", params: 175000, perplexity: 8.63, year: 2020 },
  { name: "GPT-4", params: 1000000, perplexity: 5.2, year: 2023 },
];

/* ─────────────────────────────────────────────────────────────
   QUIZ — 8 câu
   ───────────────────────────────────────────────────────────── */
const QUIZ: QuizQuestion[] = [
  {
    question: "GPT và BERT đều dùng Transformer. Điểm khác biệt cốt lõi là gì?",
    options: [
      "GPT lớn hơn BERT",
      "GPT đọc MỘT CHIỀU (trái→phải, masked attention), BERT đọc HAI CHIỀU",
      "BERT không dùng attention",
      "GPT không có pre-training",
    ],
    correct: 1,
    explanation:
      "GPT dùng Transformer Decoder (masked/causal attention, chỉ nhìn trái→phải). BERT dùng Transformer Encoder (nhìn cả hai hướng). GPT giỏi SINH, BERT giỏi HIỂU.",
  },
  {
    question: "Mục tiêu huấn luyện của GPT là gì?",
    options: [
      "Đoán từ bị che (masked language model)",
      "Dự đoán token TIẾP THEO dựa trên các token trước đó (autoregressive LM)",
      "Phân loại câu theo sentiment",
      "Dịch ngôn ngữ song ngữ",
    ],
    correct: 1,
    explanation:
      "GPT tối đa P(w_t | w_1, ..., w_{t-1}) — xác suất từ tiếp theo. Mục tiêu đơn giản này khi scale lên tạo ra khả năng phi thường (in-context learning, reasoning).",
  },
  {
    question:
      "Temperature = 0.1 vs temperature = 1.5 khác nhau thế nào khi sampling?",
    options: [
      "Temperature không ảnh hưởng gì đến chất lượng",
      "Temperature thấp → phân phối sharper (argmax-like, lặp lại, an toàn); cao → phân phối flatter (sáng tạo, bất ngờ, đôi khi vô nghĩa)",
      "Temperature cao chạy nhanh hơn",
      "Temperature thay đổi số layer của model",
    ],
    correct: 1,
    explanation:
      "Softmax với temperature: p_i = exp(l_i/T) / Σ exp(l_j/T). T nhỏ → một token thống trị. T lớn → xác suất trải đều. T=0 tương đương argmax (greedy decode).",
  },
  {
    question:
      "Top-k = 5 nghĩa là gì trong sampling?",
    options: [
      "Chỉ train model với 5 layer",
      "Chỉ xét TOP 5 token có xác suất cao nhất, tái chuẩn hoá rồi sample từ đó",
      "Sinh ra 5 câu hoàn chỉnh song song",
      "Dùng beam search với width = 5",
    ],
    correct: 1,
    explanation:
      "Top-k sampling: lấy k token có logit cao nhất, zero-out phần còn lại, chuẩn hoá softmax, rồi sample. Loại bỏ đuôi dài (long tail) các token cực ít khả năng — tránh model output rác.",
  },
  {
    question: "GPT-3 có 175 tỷ tham số. Tại sao scale lớn lại quan trọng?",
    options: [
      "Nhiều tham số = chạy nhanh hơn",
      "Scaling laws: loss giảm theo power law với kích thước model + dữ liệu + compute; khả năng mới xuất hiện (emergent abilities)",
      "Chỉ cần bộ nhớ lớn là đủ, không có khác biệt chất",
      "Số tham số không quan trọng, chỉ kiến trúc",
    ],
    correct: 1,
    explanation:
      "Kaplan et al. 2020: loss = (N_c/N)^α — tỉ lệ power law với N=params. GPT-3 175B hiện khả năng few-shot learning, viết code, suy luận — điều GPT-2 (1.5B) không làm được. Đây là emergent abilities.",
  },
  {
    type: "fill-blank",
    question:
      "GPT thuộc kiến trúc {blank}-only Transformer và sinh văn bản theo cách {blank} (mỗi token mới phụ thuộc vào toàn bộ token trước đó).",
    blanks: [
      { answer: "decoder", accept: ["Decoder"] },
      { answer: "autoregressive", accept: ["tự hồi quy", "auto-regressive"] },
    ],
    explanation:
      "GPT là decoder-only Transformer (không có encoder stack) và sinh token theo kiểu autoregressive — P(w_t | w_1, ..., w_{t-1}). Khác với BERT (encoder-only, non-autoregressive masked LM).",
  },
  {
    question:
      "Top-p = 0.9 (nucleus sampling) hoạt động ra sao?",
    options: [
      "Sample từ top 90% token ngẫu nhiên",
      "Sort token theo xác suất, cộng dồn từ cao đến thấp cho đến khi đạt 0.9; sample từ nhóm đó",
      "Luôn chọn token có logit ≥ 0.9",
      "Temperature = 0.9",
    ],
    correct: 1,
    explanation:
      "Nucleus sampling (Holtzman et al. 2019): chọn nhóm token NHỎ NHẤT mà tổng xác suất ≥ p. Khác top-k ở chỗ kích thước nhóm thay đổi động: nếu model tự tin (1 token áp đảo), nhóm nhỏ; nếu không chắc, nhóm lớn — linh hoạt hơn top-k.",
  },
  {
    question:
      "Causal mask trong GPT attention được biểu diễn ra sao trong self-attention?",
    options: [
      "Cộng +∞ vào attention score với token tương lai",
      "Cộng −∞ (hoặc rất âm) vào attention score với vị trí j > i, rồi softmax → các vị trí này có xác suất ≈ 0",
      "Nhân với 0 trước softmax",
      "Xoá hoàn toàn key và value tương lai",
    ],
    correct: 1,
    explanation:
      "Mask M_ij = 0 nếu j ≤ i, −∞ nếu j > i. Sau softmax(QK^T/√d + M), các vị trí tương lai có xác suất = 0 → token hiện tại không 'nhìn' vào chúng. Đây là triangular causal mask.",
  },
];

/* ─────────────────────────────────────────────────────────────
   HELPER — Softmax với temperature và top-k / top-p filter
   Trả về phân phối xác suất đã normalize
   ───────────────────────────────────────────────────────────── */
function applySampling(
  logits: number[],
  temperature: number,
  topK: number,
  topP: number
): number[] {
  // 1) chia temperature
  const T = Math.max(0.01, temperature);
  const scaled = logits.map((l) => l / T);

  // 2) top-k filter: giữ topK giá trị cao nhất
  const indexed = scaled.map((v, i) => ({ v, i }));
  indexed.sort((a, b) => b.v - a.v);
  const topKSet = new Set(indexed.slice(0, topK).map((x) => x.i));

  // 3) softmax trên toàn bộ, sau đó mask
  const maxV = Math.max(...scaled);
  const expVals = scaled.map((v) => Math.exp(v - maxV));
  const masked = expVals.map((v, i) => (topKSet.has(i) ? v : 0));
  const sum = masked.reduce((s, v) => s + v, 0) || 1;
  let probs = masked.map((v) => v / sum);

  // 4) top-p (nucleus) filter: giữ nhóm token tổng ≥ topP
  const sortedByProb = probs
    .map((p, i) => ({ p, i }))
    .sort((a, b) => b.p - a.p);
  let cum = 0;
  const keep = new Set<number>();
  for (const { p, i } of sortedByProb) {
    keep.add(i);
    cum += p;
    if (cum >= topP) break;
  }
  probs = probs.map((p, i) => (keep.has(i) ? p : 0));
  const s2 = probs.reduce((s, v) => s + v, 0) || 1;
  probs = probs.map((p) => p / s2);

  return probs;
}

// Tính log10 an toàn
function log10(x: number): number {
  return Math.log(Math.max(1e-9, x)) / Math.LN10;
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────────────────────── */
export default function GptTopic() {
  // State: bước sinh hiện tại (0..GEN_STEPS.length-1)
  const [stepIdx, setStepIdx] = useState<number>(0);

  // State: sampling hyperparameters
  const [temperature, setTemperature] = useState<number>(1.0);
  const [topK, setTopK] = useState<number>(10);
  const [topP, setTopP] = useState<number>(1.0);

  // State: token nào đang được hover trong context (để highlight attention)
  const [hoverCtx, setHoverCtx] = useState<number | null>(null);

  // State: điểm scaling law đang hover
  const [hoverScale, setHoverScale] = useState<number | null>(null);

  const currentStep = GEN_STEPS[stepIdx];

  /* ── Tính phân phối xác suất sau sampling ── */
  const probabilities = useMemo(() => {
    return applySampling(
      currentStep.candidates.map((c) => c.logit),
      temperature,
      topK,
      topP
    );
  }, [currentStep, temperature, topK, topP]);

  /* ── Tokens đã sinh được (tích luỹ qua các step) ── */
  const generatedSoFar = useMemo(() => {
    const tokens: string[] = [...PROMPT_TOKENS];
    for (let i = 0; i <= stepIdx; i++) {
      const sampled =
        GEN_STEPS[i].candidates[GEN_STEPS[i].sampledIdx]?.token ?? "?";
      tokens.push(sampled);
    }
    return tokens;
  }, [stepIdx]);

  /* ── Reset sampling params ── */
  const resetSampling = useCallback(() => {
    setTemperature(1.0);
    setTopK(10);
    setTopP(1.0);
  }, []);

  /* ── Scaling law chart range ── */
  const scaleXMin = log10(100);       // 100M
  const scaleXMax = log10(2_000_000); // 2T
  const scaleYMin = 4;
  const scaleYMax = 40;

  return (
    <>
      {/* ─────────────────────────────────────────────────
          STEP 1 — PredictionGate
          ───────────────────────────────────────────────── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Thử thách">
        <PredictionGate
          question={`"Tôi yêu ___" — hãy đoán token tiếp theo mà GPT có khả năng sinh ra nhất!`}
          options={['"em"', '"toán học"', '"xe máy"']}
          correct={0}
          explanation={`Với prompt "Tôi yêu", GPT tính xác suất cho từng token trong vocab (~50K tokens với GPT-2). "em" có xác suất cao nhất vì pattern "Tôi yêu em..." xuất hiện cực nhiều trong training data. Nhưng quan trọng: GPT KHÔNG đơn giản là memorize — nó học pattern P(token | context) và tổng quát hoá. Đó là lý do nó viết được câu chưa từng thấy.`}
        />
        <div className="mt-4">
          <ProgressSteps
            current={1}
            total={TOTAL_STEPS}
            labels={[
              "Đoán trước",
              "Autoregressive gen",
              "A-ha",
              "Thử nhanh",
              "Sampling",
              "Scaling law",
              "Thử nâng cao",
              "Lý thuyết",
              "Tóm tắt",
              "Kiểm tra",
            ]}
          />
        </div>
      </LessonSection>

      {/* ─────────────────────────────────────────────────
          STEP 2 — Visualization chính: autoregressive generation
          - Tokenized input "Tôi yêu"
          - Attention heatmap
          - Top-10 next-token distribution
          - Sample → repeat
          ───────────────────────────────────────────────── */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          GPT sinh văn bản theo kiểu <strong>autoregressive</strong>: mỗi bước
          nó đọc toàn bộ context đã có, tính attention, xuất ra một phân phối
          xác suất trên toàn bộ từ vựng (~50K tokens với GPT-2, ~100K với
          GPT-4), sample một token, và lặp lại. Kéo thanh trượt để xem từng
          bước.
        </p>

        <VisualizationSection>
          <div className="space-y-5">
            {/* ── Bước hiện tại ── */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted">
                Bước sinh:{" "}
                <span className="text-accent font-bold">{stepIdx + 1}</span> /{" "}
                {GEN_STEPS.length}
              </label>
              <button
                type="button"
                onClick={() => setStepIdx(0)}
                className="text-xs text-muted hover:text-accent underline"
              >
                Về đầu
              </button>
            </div>
            <input
              type="range"
              min={0}
              max={GEN_STEPS.length - 1}
              step={1}
              value={stepIdx}
              onChange={(e) => setStepIdx(parseInt(e.target.value))}
              className="w-full accent-accent"
            />

            {/* ── Sequence hiển thị ── */}
            <div className="rounded-lg border border-border bg-background/40 p-4">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                Sequence (prompt + generated)
              </p>
              <div className="flex flex-wrap gap-1.5 justify-center min-h-[40px]">
                {generatedSoFar.map((tok, i) => {
                  const isPrompt = i < PROMPT_TOKENS.length;
                  const isLatest = i === generatedSoFar.length - 1;
                  return (
                    <motion.span
                      key={`${i}-${tok}`}
                      initial={
                        isLatest ? { scale: 0.7, opacity: 0 } : undefined
                      }
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className={`rounded-md px-2.5 py-1 text-sm font-medium ${
                        isPrompt
                          ? "bg-accent/20 text-accent border border-accent/40"
                          : isLatest
                          ? "bg-green-500 text-white"
                          : "bg-green-500/20 text-green-400 border border-green-500/40"
                      }`}
                    >
                      {tok}
                    </motion.span>
                  );
                })}
                <span className="rounded-md px-2.5 py-1 text-sm font-medium bg-yellow-500/20 text-yellow-500 border border-yellow-500/40 border-dashed animate-pulse">
                  ?
                </span>
              </div>
              <p className="text-[11px] text-muted text-center mt-2">
                <span className="inline-block w-3 h-3 rounded bg-accent/30 border border-accent/40 mr-1 align-middle" />
                Prompt gốc{" "}
                <span className="inline-block w-3 h-3 rounded bg-green-500/30 border border-green-500/40 mx-1 ml-3 align-middle" />
                Đã sinh{" "}
                <span className="inline-block w-3 h-3 rounded bg-yellow-500/30 border border-yellow-500/40 mx-1 ml-3 align-middle" />
                Đang dự đoán
              </p>
            </div>

            {/* ── Attention heatmap ── */}
            <div className="rounded-lg border border-border bg-background/40 p-4">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                Attention trên context (token hiện tại nhìn vào đâu?)
              </p>
              <div className="space-y-1.5">
                {currentStep.context.map((tok, i) => {
                  const w = currentStep.attention[i];
                  const isHover = hoverCtx === i;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 cursor-default"
                      onMouseEnter={() => setHoverCtx(i)}
                      onMouseLeave={() => setHoverCtx(null)}
                    >
                      <span
                        className={`w-20 text-right text-sm font-semibold transition-colors ${
                          isHover ? "text-accent" : "text-foreground"
                        }`}
                      >
                        {tok}
                      </span>
                      <div className="flex-1 h-6 rounded bg-surface overflow-hidden relative">
                        <motion.div
                          className="h-full rounded"
                          style={{
                            backgroundColor: `rgba(168, 85, 247, ${
                              0.3 + w * 0.7
                            })`,
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${w * 100}%` }}
                          transition={{ duration: 0.4, delay: i * 0.05 }}
                        />
                        <span className="absolute inset-0 flex items-center px-2 text-[11px] font-semibold text-white mix-blend-difference">
                          {(w * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted mt-2 italic">
                Attention cho biết khi dự đoán token tiếp theo, model {`"`}nhìn{`"`}
                vào token nào trong context nhiều nhất. Thường các token gần sẽ
                có trọng số cao hơn, nhưng không phải luôn luôn — tuỳ pattern
                cú pháp.
              </p>
            </div>

            {/* ── Causal mask mini viz ── */}
            <div className="rounded-lg border border-border bg-background/40 p-4">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                Causal mask — GPT chỉ nhìn về quá khứ
              </p>
              <div className="flex justify-center gap-0.5">
                {Array.from({ length: 7 }).map((_, row) => (
                  <div key={row} className="flex flex-col gap-0.5">
                    {Array.from({ length: 7 }).map((_, col) => {
                      const visible = col <= row;
                      return (
                        <div
                          key={col}
                          className={`w-5 h-5 rounded-sm transition-colors ${
                            visible
                              ? "bg-purple-500/60"
                              : "bg-surface border border-border"
                          }`}
                          title={
                            visible
                              ? `pos ${row} nhìn pos ${col}`
                              : `pos ${row} KHÔNG nhìn pos ${col} (tương lai)`
                          }
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted text-center mt-2">
                Ma trận tam giác dưới: ô xanh = được phép, ô xám = bị mask −∞.
                Đây là lý do GPT chỉ sinh được text theo chiều trái→phải.
              </p>
            </div>

            {/* ── Top-10 next token distribution ── */}
            <div className="rounded-lg border border-border bg-background/40 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-muted uppercase tracking-wide">
                  Top-10 token ứng viên (sau khi áp sampling)
                </p>
                <span className="text-[11px] text-muted">
                  T={temperature.toFixed(2)} · k={topK} · p={topP.toFixed(2)}
                </span>
              </div>
              <div className="space-y-1.5">
                {currentStep.candidates.map((c, i) => {
                  const p = probabilities[i];
                  const isZero = p < 0.001;
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-8 text-right text-[11px] font-mono text-muted">
                        #{i + 1}
                      </span>
                      <span
                        className={`w-28 text-right text-sm font-medium ${
                          isZero ? "text-muted line-through" : "text-foreground"
                        }`}
                      >
                        {c.token}
                      </span>
                      <span className="w-12 text-right text-[10px] font-mono text-muted">
                        {c.logit.toFixed(2)}
                      </span>
                      <div className="flex-1 h-4 rounded-full bg-surface overflow-hidden relative">
                        <motion.div
                          className="h-full rounded-full"
                          style={{
                            backgroundColor:
                              i === 0
                                ? "#22c55e"
                                : i === 1
                                ? "#3b82f6"
                                : i === 2
                                ? "#8b5cf6"
                                : "#64748b",
                          }}
                          initial={false}
                          animate={{ width: `${p * 100}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <span className="w-14 text-right text-[10px] font-mono text-muted">
                        {(p * 100).toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted mt-3 italic">
                Logit → chia temperature → softmax → top-k filter → top-p filter
                → sample. Với T=0.01, gần như luôn chọn #1 (greedy). Với T=2.0
                và top-p=0.95, model có thể chọn bất ngờ hơn.
              </p>
            </div>

            {/* ── Sampling controls ── */}
            <div className="rounded-lg border border-border bg-background/40 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted uppercase tracking-wide">
                  Điều khiển sampling
                </p>
                <button
                  type="button"
                  onClick={resetSampling}
                  className="text-xs text-muted hover:text-accent underline"
                >
                  Reset về mặc định
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted">
                    Temperature:{" "}
                    <strong className="text-accent">
                      {temperature.toFixed(2)}
                    </strong>
                  </span>
                  <span className="text-muted">
                    {temperature < 0.3
                      ? "Đơn điệu"
                      : temperature < 0.8
                      ? "Thận trọng"
                      : temperature < 1.2
                      ? "Cân bằng"
                      : temperature < 1.8
                      ? "Sáng tạo"
                      : "Hỗn loạn"}
                  </span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={2.0}
                  step={0.05}
                  value={temperature}
                  onChange={(e) =>
                    setTemperature(parseFloat(e.target.value))
                  }
                  className="w-full accent-accent"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted">
                    Top-k:{" "}
                    <strong className="text-accent">{topK}</strong>
                  </span>
                  <span className="text-muted">
                    Chỉ xét {topK} token có xác suất cao nhất
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={topK}
                  onChange={(e) => setTopK(parseInt(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted">
                    Top-p:{" "}
                    <strong className="text-accent">{topP.toFixed(2)}</strong>
                  </span>
                  <span className="text-muted">
                    Nucleus — tổng xác suất tích luỹ ≥ p
                  </span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  value={topP}
                  onChange={(e) => setTopP(parseFloat(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>

              <div className="rounded bg-surface/60 p-3">
                <p className="text-[11px] text-muted">
                  <strong className="text-foreground">Preset nhanh:</strong>
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTemperature(0.1);
                      setTopK(1);
                      setTopP(1.0);
                    }}
                    className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-[11px] hover:bg-blue-500/30"
                  >
                    Greedy (T=0.1, k=1)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTemperature(0.7);
                      setTopK(10);
                      setTopP(0.9);
                    }}
                    className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-[11px] hover:bg-green-500/30"
                  >
                    Cân bằng (T=0.7, p=0.9)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTemperature(1.5);
                      setTopK(10);
                      setTopP(0.95);
                    }}
                    className="px-2 py-1 rounded bg-purple-500/20 text-purple-400 text-[11px] hover:bg-purple-500/30"
                  >
                    Sáng tạo (T=1.5, p=0.95)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ─────────────────────────────────────────────────
          STEP 3 — AhaMoment
          ───────────────────────────────────────────────── */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          <p>
            <strong>GPT</strong> chỉ làm MỘT VIỆC: dự đoán token tiếp theo.
            Nhưng khi được huấn luyện trên hàng tỷ câu với mục tiêu{" "}
            <LaTeX>{`\\max \\log P(w_t | w_{<t})`}</LaTeX>, nó {'"'}hiểu{'"'}{" "}
            ngôn ngữ đủ sâu để viết văn, trả lời câu hỏi, viết code, giải toán —
            và thậm chí reason qua nhiều bước!
          </p>
          <p className="text-sm text-muted mt-1">
            Như người kể chuyện giỏi: chỉ dựa vào những gì đã nói để tiếp tục,
            nhưng nhờ đọc hàng tỷ câu chuyện nên kể rất mạch lạc. Và khi đủ
            lớn, nó xuất hiện những khả năng mà không ai hard-code được — đó
            chính là <em>emergent abilities</em>.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ─────────────────────────────────────────────────
          STEP 4 — InlineChallenge #1
          ───────────────────────────────────────────────── */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <InlineChallenge
          question="GPT đọc một chiều (trái→phải) nên lý thuyết KHÔNG giỏi HIỂU ngữ cảnh bằng BERT. Nhưng tại sao ChatGPT lại trả lời câu hỏi rất tốt?"
          options={[
            "ChatGPT dùng BERT bên trong",
            "GPT đủ lớn (100B+ params) + fine-tune bằng RLHF → khả năng hiểu và reasoning xuất hiện (emergent), scale giải quyết phần lớn vấn đề",
            "ChatGPT không thật sự hiểu, chỉ copy-paste từ internet",
          ]}
          correct={1}
          explanation="Scaling laws + RLHF: khi model đủ lớn + đủ dữ liệu + RLHF alignment, khả năng mới xuất hiện (emergent abilities). GPT-4 với hàng trăm tỷ params có thể suy luận, viết code, giải toán — dù cốt lõi vẫn chỉ 'dự đoán token tiếp theo'. Chain-of-Thought prompting cũng khai thác khả năng reasoning từ LM objective đơn giản này."
        />
      </LessonSection>

      {/* ─────────────────────────────────────────────────
          STEP 5 — Callouts sampling strategies
          ───────────────────────────────────────────────── */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Sampling sâu hơn">
        <div className="space-y-4">
          <Callout variant="insight" title="Công thức softmax với temperature">
            <p>
              Logit là đầu ra thô của layer cuối (trước softmax). Sampling:
            </p>
            <LaTeX block>{`P(w_i) = \\frac{\\exp(l_i / T)}{\\sum_{j} \\exp(l_j / T)}`}</LaTeX>
            <p className="mt-2 text-sm">
              <strong>T → 0:</strong> phân phối sharper, gần như argmax (greedy).{" "}
              <strong>T = 1:</strong> softmax chuẩn.{" "}
              <strong>T → ∞:</strong> phân phối uniform (chọn ngẫu nhiên).
            </p>
          </Callout>

          <Callout variant="info" title="Khi nào dùng gì?">
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>
                <strong>T=0 / Greedy:</strong> Trích xuất thông tin, code
                completion — cần ổn định.
              </li>
              <li>
                <strong>T=0.7, top-p=0.9:</strong> Mặc định ChatGPT — cân bằng
                fluency và đa dạng.
              </li>
              <li>
                <strong>T=1.0+, top-p=0.95:</strong> Brainstorm, viết văn sáng
                tạo — chấp nhận surprise.
              </li>
              <li>
                <strong>T=2.0+:</strong> Thường tạo văn bản vô nghĩa — tránh trừ
                khi nghiên cứu.
              </li>
            </ul>
          </Callout>

          <Callout variant="tip" title="Beam search: lựa chọn quan trọng khác">
            <p>
              Khác với sampling, <strong>beam search</strong> duy trì k{" "}
              ứng viên sequence tốt nhất ở mỗi bước và chọn sequence có xác
              suất tích luỹ cao nhất. Dùng cho dịch máy, tóm tắt (cần kết quả
              đúng hơn sáng tạo). Nhưng beam search thường tạo câu lặp lại và
              {' "'}an toàn quá{'"'} nên ChatGPT không dùng — ưu tiên sampling.
            </p>
          </Callout>

          <Callout variant="warning" title="Cẩn thận với temperature quá cao">
            <p>
              Khi T {'>'} 1.5, phân phối trở nên gần uniform: model có thể chọn
              cả token có logit thấp → xuất hiện {'"'}hallucination{'"'} hoặc văn
              bản phi logic. Top-p = 0.95 giúp kiềm chế điều này (cắt long tail)
              nhưng không loại bỏ hoàn toàn.
            </p>
          </Callout>
        </div>
      </LessonSection>

      {/* ─────────────────────────────────────────────────
          STEP 6 — Scaling law viz
          ───────────────────────────────────────────────── */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Scaling law">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Một trong những khám phá quan trọng nhất của NLP hiện đại:{" "}
          <strong>perplexity giảm theo power law</strong> với kích thước model
          (khi dữ liệu và compute tương xứng). Đây là biểu đồ log-log cho các
          thế hệ GPT:
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-background/40 p-4">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3 text-center">
                Model size (params) vs Perplexity (WikiText) — log-log
              </p>

              <div className="relative w-full max-w-2xl mx-auto">
                <svg viewBox="0 0 400 240" className="w-full h-auto">
                  {/* Background */}
                  <rect
                    x={40}
                    y={10}
                    width={350}
                    height={200}
                    fill="currentColor"
                    className="text-surface"
                    opacity={0.3}
                    rx={4}
                  />

                  {/* Grid lines - horizontal */}
                  {[5, 10, 20, 40].map((p) => {
                    const y =
                      10 +
                      ((log10(scaleYMax) - log10(p)) /
                        (log10(scaleYMax) - log10(scaleYMin))) *
                        200;
                    return (
                      <g key={p}>
                        <line
                          x1={40}
                          y1={y}
                          x2={390}
                          y2={y}
                          stroke="currentColor"
                          className="text-border"
                          strokeWidth={0.5}
                          strokeDasharray="2 2"
                        />
                        <text
                          x={36}
                          y={y + 3}
                          textAnchor="end"
                          className="fill-current text-muted text-[9px]"
                        >
                          {p}
                        </text>
                      </g>
                    );
                  })}

                  {/* Grid lines - vertical */}
                  {[
                    { v: 100, label: "100M" },
                    { v: 1000, label: "1B" },
                    { v: 10000, label: "10B" },
                    { v: 100000, label: "100B" },
                    { v: 1000000, label: "1T" },
                  ].map((g) => {
                    const x =
                      40 +
                      ((log10(g.v) - scaleXMin) / (scaleXMax - scaleXMin)) *
                        350;
                    return (
                      <g key={g.v}>
                        <line
                          x1={x}
                          y1={10}
                          x2={x}
                          y2={210}
                          stroke="currentColor"
                          className="text-border"
                          strokeWidth={0.5}
                          strokeDasharray="2 2"
                        />
                        <text
                          x={x}
                          y={222}
                          textAnchor="middle"
                          className="fill-current text-muted text-[9px]"
                        >
                          {g.label}
                        </text>
                      </g>
                    );
                  })}

                  {/* Power-law fit line */}
                  <polyline
                    fill="none"
                    stroke="#a78bfa"
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                    opacity={0.6}
                    points={SCALING_DATA.map((d) => {
                      const x =
                        40 +
                        ((log10(d.params) - scaleXMin) /
                          (scaleXMax - scaleXMin)) *
                          350;
                      const y =
                        10 +
                        ((log10(scaleYMax) - log10(d.perplexity)) /
                          (log10(scaleYMax) - log10(scaleYMin))) *
                          200;
                      return `${x},${y}`;
                    }).join(" ")}
                  />

                  {/* Data points */}
                  {SCALING_DATA.map((d, i) => {
                    const x =
                      40 +
                      ((log10(d.params) - scaleXMin) /
                        (scaleXMax - scaleXMin)) *
                        350;
                    const y =
                      10 +
                      ((log10(scaleYMax) - log10(d.perplexity)) /
                        (log10(scaleYMax) - log10(scaleYMin))) *
                        200;
                    const isHover = hoverScale === i;
                    return (
                      <g
                        key={d.name}
                        onMouseEnter={() => setHoverScale(i)}
                        onMouseLeave={() => setHoverScale(null)}
                        className="cursor-pointer"
                      >
                        <circle
                          cx={x}
                          cy={y}
                          r={isHover ? 6 : 4}
                          fill={
                            d.year === 2018
                              ? "#3b82f6"
                              : d.year === 2019
                              ? "#22c55e"
                              : d.year === 2020
                              ? "#f59e0b"
                              : "#ef4444"
                          }
                          stroke="white"
                          strokeWidth={isHover ? 2 : 1}
                        />
                        {isHover && (
                          <g>
                            <rect
                              x={x + 8}
                              y={y - 28}
                              width={86}
                              height={24}
                              rx={3}
                              fill="currentColor"
                              className="text-foreground"
                              opacity={0.92}
                            />
                            <text
                              x={x + 14}
                              y={y - 14}
                              className="fill-background text-[10px] font-bold"
                            >
                              {d.name}
                            </text>
                            <text
                              x={x + 14}
                              y={y - 5}
                              className="fill-background text-[9px]"
                            >
                              ppl={d.perplexity}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}

                  {/* Axis labels */}
                  <text
                    x={215}
                    y={236}
                    textAnchor="middle"
                    className="fill-current text-muted text-[10px] font-semibold"
                  >
                    Số tham số (log scale)
                  </text>
                  <text
                    x={14}
                    y={110}
                    textAnchor="middle"
                    transform="rotate(-90 14 110)"
                    className="fill-current text-muted text-[10px] font-semibold"
                  >
                    Perplexity (thấp = tốt, log scale)
                  </text>
                </svg>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 justify-center text-[11px] text-muted mt-2">
                {[
                  { y: 2018, c: "#3b82f6", n: "GPT-1" },
                  { y: 2019, c: "#22c55e", n: "GPT-2" },
                  { y: 2020, c: "#f59e0b", n: "GPT-3" },
                  { y: 2023, c: "#ef4444", n: "GPT-4" },
                ].map((e) => (
                  <div key={e.y} className="flex items-center gap-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: e.c }}
                    />
                    {e.n} ({e.y})
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-muted text-center italic mt-3">
                Đường gạch tím: mô hình power-law L(N) ∝ N^(−α). Mỗi thế hệ
                mới tiếp tục trượt xuống — chưa có bằng chứng saturate.
              </p>
            </div>

            <CollapsibleDetail title="Chi tiết: Kaplan scaling law">
              <div className="space-y-2 text-sm text-foreground">
                <p>
                  Kaplan et al. (2020) chứng minh loss của language model tuân
                  theo power law với:
                </p>
                <LaTeX block>{`L(N) = \\left(\\frac{N_c}{N}\\right)^{\\alpha_N}, \\quad \\alpha_N \\approx 0.076`}</LaTeX>
                <p>
                  Tương tự cho dataset size D và compute C. Nếu cả ba tăng cùng
                  tỷ lệ, loss tiếp tục giảm theo power law — <strong>ít nhất</strong>{" "}
                  trên 7 bậc độ lớn. Đây là nền tảng cho việc OpenAI/DeepMind/
                  Anthropic liên tục build model lớn hơn.
                </p>
                <p>
                  Chinchilla paper (Hoffmann et al. 2022) refine thêm: với
                  budget compute cố định, tỷ lệ tối ưu params:tokens ≈ 1:20
                  (GPT-3 175B thiếu data, Chinchilla 70B dùng 1.4T tokens cho
                  kết quả tốt hơn).
                </p>
              </div>
            </CollapsibleDetail>

            <CollapsibleDetail title="Emergent abilities — tại sao quan trọng?">
              <div className="space-y-2 text-sm text-foreground">
                <p>
                  Wei et al. (2022) quan sát: một số tác vụ (arithmetic 3
                  chữ số, word unscrambling, multi-step reasoning) có{" "}
                  <strong>phase transition</strong>: model nhỏ random; model
                  trung bình vẫn gần random; nhưng vượt qua một ngưỡng (~10B
                  params), performance nhảy vọt.
                </p>
                <p>
                  Ví dụ: GPT-2 (1.5B) không giải được 25 + 37. GPT-3 (175B)
                  giải được 85% bài 3-digit addition. Từ đó sinh ra các thành
                  tựu như:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>In-context learning (few-shot)</li>
                  <li>Chain-of-Thought reasoning</li>
                  <li>Code generation (Codex, Copilot)</li>
                  <li>Instruction following (sau RLHF)</li>
                </ul>
                <p>
                  Tranh cãi: có người cho rằng đó là artifact của metric
                  (Schaeffer et al. 2023 — {'"'}Are Emergent Abilities a Mirage?
                  {'"'}). Dù vậy, thực tế dùng LLM cho thấy scale tạo ra khả
                  năng mà model nhỏ không có.
                </p>
              </div>
            </CollapsibleDetail>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ─────────────────────────────────────────────────
          STEP 7 — InlineChallenge #2
          ───────────────────────────────────────────────── */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Thử thách nâng cao">
        <InlineChallenge
          question="Bạn muốn model tạo một đoạn code Python chính xác theo spec. Chọn sampling nào phù hợp nhất?"
          options={[
            "T=1.5, top-p=0.95 — để model sáng tạo",
            "T=0.1 (gần greedy), top-k=1 hoặc top-p thấp — ưu tiên ổn định, đúng syntax, đúng spec",
            "T=2.0, top-k=50 — để thử nhiều hướng",
          ]}
          correct={1}
          explanation="Code cần đúng (syntax + logic), không cần sáng tạo. Greedy hoặc T≈0.1 giảm khả năng model chọn token kỳ lạ. GitHub Copilot dùng T≈0.2–0.3. Ngược lại, creative writing (thơ, truyện) nên T≈0.8–1.0 với top-p=0.9 để tránh lặp lại."
        />
      </LessonSection>

      {/* ─────────────────────────────────────────────────
          STEP 8 — Explanation đầy đủ
          ───────────────────────────────────────────────── */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>GPT</strong> (Generative Pre-trained Transformer, OpenAI
            2018) dùng <TopicLink slug="transformer">Transformer</TopicLink>{" "}
            Decoder với{" "}
            <TopicLink slug="self-attention">self-attention</TopicLink>{" "}
            dạng masked (causal) để sinh văn bản tự hồi quy — dự đoán token
            tiếp theo dựa trên tất cả token trước đó. Trước khi mô hình xử lý,
            văn bản được chia nhỏ bằng{" "}
            <TopicLink slug="tokenization">tokenization</TopicLink> (BPE / SentencePiece)
            thành các subword token. So với{" "}
            <TopicLink slug="bert">BERT</TopicLink> (encoder hai chiều), GPT tối
            ưu cho việc sinh văn bản thay vì hiểu toàn câu.
          </p>

          <Callout variant="insight" title="Mục tiêu huấn luyện: language modeling">
            <p>Tối đa xác suất chuỗi (log-likelihood):</p>
            <LaTeX block>{`\\mathcal{L}(\\theta) = \\sum_{t=1}^{T} \\log P(w_t \\mid w_1, w_2, \\ldots, w_{t-1}; \\theta)`}</LaTeX>
            <p className="mt-2 text-sm">
              Với mỗi token, model xuất ra phân phối xác suất trên toàn bộ
              vocab (50K–100K tokens). Loss là cross-entropy giữa distribution
              dự đoán và one-hot ground truth. Gradient truyền ngược qua mọi
              layer.
            </p>
          </Callout>

          <Callout variant="info" title="Softmax với temperature (công thức)">
            <LaTeX block>{`P(w_i) = \\frac{\\exp(l_i / T)}{\\sum_{j=1}^{|V|} \\exp(l_j / T)}`}</LaTeX>
            <p className="mt-2 text-sm">
              <LaTeX>{`l_i`}</LaTeX> là logit cho token i,{" "}
              <LaTeX>{`T`}</LaTeX> là temperature, và |V| là kích thước vocab.
              Đây là công thức CỐT LÕI của sampling trong mọi LLM hiện đại.
            </p>
          </Callout>

          <Callout variant="info" title="Hành trình Scale: GPT → GPT-4">
            <div className="space-y-2 text-sm">
              <p>
                <strong>GPT-1 (2018):</strong> 117M params, 12 layers, trained
                on BooksCorpus (~5GB) — chứng minh pre-training + fine-tuning
                vượt trội.
              </p>
              <p>
                <strong>GPT-2 (2019):</strong> 1.5B params, 48 layers, 40GB
                WebText — sinh text giống người; OpenAI ban đầu không release
                vì lo ngại misuse.
              </p>
              <p>
                <strong>GPT-3 (2020):</strong> 175B params, 96 layers, 570GB
                filtered Common Crawl — xuất hiện few-shot learning, viết code,
                giải toán đơn giản.
              </p>
              <p>
                <strong>GPT-3.5 / ChatGPT (2022):</strong> + RLHF (Reinforcement
                Learning from Human Feedback) — model biết follow instruction,
                từ chối câu hỏi độc hại.
              </p>
              <p>
                <strong>GPT-4 (2023):</strong> Ước tính ~1T+ params (MoE) —
                multimodal (vision), reasoning phức tạp, pass bar exam ở top
                10%.
              </p>
            </div>
          </Callout>

          <CodeBlock language="python" title="gpt2_generation_demo.py">
{`"""
Sinh văn bản tiếng Việt với Hugging Face Transformers.
Yêu cầu: pip install transformers torch
"""
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM

# ─── 1. Load model và tokenizer ───
# Dùng GPT-2 (nếu có Vietnamese version: VietAI/gpt-neo-1.3B-vietnamese-news)
model_name = "gpt2"  # hoặc "VietAI/gpt-j-6B-vietnamese-news"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name)
model.eval()

# ─── 2. Tokenize prompt ───
prompt = "Tôi yêu"
input_ids = tokenizer.encode(prompt, return_tensors="pt")
print(f"Token IDs: {input_ids.tolist()}")
print(f"Tokens: {tokenizer.convert_ids_to_tokens(input_ids[0])}")

# ─── 3. Generation với các strategy khác nhau ───
# 3a. Greedy decode (deterministic, lặp lại)
with torch.no_grad():
    out_greedy = model.generate(
        input_ids,
        max_length=30,
        do_sample=False,        # greedy
    )
print("Greedy:", tokenizer.decode(out_greedy[0], skip_special_tokens=True))

# 3b. Temperature + top-k + top-p (ChatGPT style)
with torch.no_grad():
    out_sampled = model.generate(
        input_ids,
        max_length=30,
        do_sample=True,
        temperature=0.7,        # cân bằng
        top_k=50,               # chỉ xét 50 token cao nhất
        top_p=0.9,              # nucleus sampling
        num_return_sequences=3, # tạo 3 biến thể
    )
for i, seq in enumerate(out_sampled):
    print(f"Sample {i+1}:", tokenizer.decode(seq, skip_special_tokens=True))

# 3c. Beam search (ổn định hơn, cho dịch/tóm tắt)
with torch.no_grad():
    out_beam = model.generate(
        input_ids,
        max_length=30,
        num_beams=5,
        early_stopping=True,
        no_repeat_ngram_size=2, # tránh lặp bigram
    )
print("Beam:", tokenizer.decode(out_beam[0], skip_special_tokens=True))`}
          </CodeBlock>

          <CodeBlock language="python" title="manual_sampling.py">
{`"""
Tự implement softmax sampling với temperature + top-k + top-p.
Giúp hiểu rõ chuyện gì xảy ra bên trong .generate().
"""
import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModelForCausalLM

tokenizer = AutoTokenizer.from_pretrained("gpt2")
model = AutoModelForCausalLM.from_pretrained("gpt2")
model.eval()

def sample_next_token(logits, temperature=1.0, top_k=50, top_p=0.9):
    """Áp dụng sampling pipeline chuẩn."""
    # Chia temperature
    logits = logits / temperature

    # Top-k: giữ k token cao nhất
    if top_k > 0:
        top_k_vals, _ = torch.topk(logits, top_k)
        thresh = top_k_vals[..., -1, None]
        logits = torch.where(logits < thresh, torch.full_like(logits, -float("inf")), logits)

    # Top-p (nucleus)
    sorted_logits, sorted_idx = torch.sort(logits, descending=True)
    sorted_probs = F.softmax(sorted_logits, dim=-1)
    cum_probs = torch.cumsum(sorted_probs, dim=-1)
    sorted_mask = cum_probs > top_p
    sorted_mask[..., 1:] = sorted_mask[..., :-1].clone()
    sorted_mask[..., 0] = False
    idx_to_remove = sorted_mask.scatter(-1, sorted_idx, sorted_mask)
    logits = logits.masked_fill(idx_to_remove, -float("inf"))

    # Softmax → sample
    probs = F.softmax(logits, dim=-1)
    next_token = torch.multinomial(probs, num_samples=1)
    return next_token

# ─── Autoregressive loop ───
prompt = "Tôi yêu"
input_ids = tokenizer.encode(prompt, return_tensors="pt")
generated = input_ids.clone()

for step in range(20):
    with torch.no_grad():
        outputs = model(generated)
        # logits của token cuối cùng
        logits = outputs.logits[:, -1, :]  # shape: [batch, vocab]

    # Sample
    next_token = sample_next_token(logits, temperature=0.8, top_k=40, top_p=0.95)
    generated = torch.cat([generated, next_token], dim=-1)

    # Dừng nếu gặp EOS
    if next_token.item() == tokenizer.eos_token_id:
        break

print(tokenizer.decode(generated[0], skip_special_tokens=True))
# Ví dụ output: "Tôi yêu em rất nhiều và mãi mãi bên em..."`}
          </CodeBlock>

          <Callout variant="tip" title="Sau pre-training: RLHF và alignment">
            <p>
              ChatGPT không chỉ là GPT-3 raw. Nó trải qua 3 giai đoạn:
              <strong> (1) pre-training</strong> (next-token prediction trên
              corpus khổng lồ), <strong>(2) supervised fine-tuning (SFT)</strong>{" "}
              (human viết câu trả lời lý tưởng), <strong>(3) RLHF</strong>{" "}
              (human rank nhiều output → train reward model → PPO). Nhờ vậy
              model biết follow instruction, từ chối nội dung độc hại, và trả
              lời hữu ích — không chỉ là {'"'}autocomplete thông minh{'"'}.
            </p>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ─────────────────────────────────────────────────
          STEP 9 — MiniSummary (6 điểm)
          ───────────────────────────────────────────────── */}
      <LessonSection step={9} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về GPT"
          points={[
            "GPT = Transformer Decoder-only đọc MỘT CHIỀU (trái→phải) với causal mask, tối đa P(w_t | w_<t) — autoregressive language modeling.",
            "Mỗi bước sinh: context → self-attention → logits → softmax(l/T) → top-k / top-p filter → sample → lặp lại cho đến EOS hoặc max_length.",
            "Causal mask = ma trận tam giác dưới với −∞ ở trên đường chéo → token hiện tại KHÔNG nhìn thấy token tương lai.",
            "Temperature điều khiển 'độ sáng tạo': T thấp → greedy/ổn định (code); T cao → đa dạng/bất ngờ (creative writing). Top-k và top-p cắt long tail.",
            "Scaling laws (Kaplan 2020): loss giảm theo power law với N (params), D (tokens), C (compute) — GPT-1 117M → GPT-4 ~1T, perplexity từ 35.8 → 5.2.",
            "GPT giỏi SINH; BERT giỏi HIỂU. ChatGPT = GPT + SFT + RLHF — từ 'autocomplete' thô thành assistant follow-instruction an toàn và hữu ích.",
          ]}
        />
      </LessonSection>

      {/* ─────────────────────────────────────────────────
          STEP 10 — Quiz
          ───────────────────────────────────────────────── */}
      <LessonSection step={10} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
