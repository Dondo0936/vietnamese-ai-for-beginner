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

/* ============================================================================
 * METADATA
 * ==========================================================================*/

export const metadata: TopicMeta = {
  slug: "attention-mechanism",
  title: "Attention Mechanism",
  titleVi: "Attention - Cơ chế chú ý",
  description:
    "Cơ chế cho phép mô hình tập trung vào các phần quan trọng nhất của đầu vào khi tạo ra mỗi phần đầu ra.",
  category: "nlp",
  tags: ["nlp", "attention", "architecture"],
  difficulty: "intermediate",
  relatedSlugs: ["seq2seq", "self-attention", "transformer"],
  vizType: "interactive",
};

/* ============================================================================
 * CONSTANTS — Ví dụ câu tiếng Việt 5 token
 * ==========================================================================*/

const TOTAL_STEPS = 8;

// Câu nguồn 5 token (theo yêu cầu)
const TOKENS = ["Tôi", "yêu", "Việt", "Nam", "quá"] as const;
type TokenIndex = 0 | 1 | 2 | 3 | 4;

// Ma trận điểm "thô" (logits) trước softmax — dạng Q · K^T
// Hàng i = attention của token i hướng ra 5 token khác.
// Giá trị được chọn sao cho phản ánh ngữ nghĩa hợp lý trong tiếng Việt:
//  - "Tôi"  chú ý vào chính nó + "yêu"
//  - "yêu"  chú ý vào "Tôi" (chủ ngữ) + "Việt" "Nam" (tân ngữ)
//  - "Việt" chú ý mạnh vào "Nam" (cặp từ ghép)
//  - "Nam"  chú ý mạnh vào "Việt"
//  - "quá"  chú ý vào động từ "yêu" (bổ nghĩa)
const RAW_SCORES: number[][] = [
  [3.0, 2.2, 0.4, 0.3, 0.2], // Tôi
  [2.0, 2.8, 1.9, 1.8, 0.6], // yêu
  [0.3, 1.4, 2.5, 3.4, 0.2], // Việt
  [0.4, 1.3, 3.3, 2.6, 0.3], // Nam
  [0.2, 2.9, 1.0, 0.9, 1.8], // quá
];

// Vector "value" 3-chiều giả lập cho mỗi token (chỉ để vẽ vector tổng hợp)
const VALUE_VECS: number[][] = [
  [0.9, 0.1, 0.2], // Tôi    — nhân vật
  [0.3, 0.9, 0.2], // yêu    — cảm xúc
  [0.1, 0.2, 0.9], // Việt   — địa danh
  [0.1, 0.1, 0.9], // Nam    — địa danh
  [0.2, 0.7, 0.4], // quá    — mức độ
];

const VALUE_LABELS = ["người", "cảm xúc", "địa danh"];

/* ============================================================================
 * QUIZ — 8 câu
 * ==========================================================================*/

const QUIZ: QuizQuestion[] = [
  {
    question:
      "Attention weights cho 'Nam' trên câu 'Tôi yêu Việt Nam quá' là [0.02, 0.04, 0.55, 0.36, 0.03]. Điều này nói lên điều gì?",
    options: [
      "Mô hình đang bỏ qua hoàn toàn câu nguồn.",
      "Khi xử lí 'Nam', mô hình chú ý nhiều nhất vào 'Việt' và 'Nam' — hai thành phần của cụm 'Việt Nam'.",
      "Mô hình chú ý đều nhau vào mọi token.",
      "Đây là lỗi — attention luôn phải là one-hot.",
    ],
    correct: 1,
    explanation:
      "Tổng 0.55 + 0.36 = 0.91 dồn vào 'Việt' và 'Nam' — vì hai token này cùng tạo thành cụm từ ghép 'Việt Nam'. Đây chính là bản chất của attention: mỗi token tự chọn ai đáng để 'nhìn'.",
  },
  {
    question: "Attention giải quyết vấn đề nào của Seq2Seq cổ điển?",
    options: [
      "Seq2Seq không dùng neural network.",
      "Bottleneck: một context vector cố định không đủ chứa ý nghĩa câu dài.",
      "Seq2Seq chạy quá nhanh.",
      "Seq2Seq không có encoder.",
    ],
    correct: 1,
    explanation:
      "Seq2Seq nén toàn bộ câu nguồn vào một vector duy nhất, dễ mất thông tin khi câu dài. Attention để decoder 'nhìn lại' MỌI vị trí encoder trong lúc sinh từ.",
  },
  {
    question: "Trong scaled dot-product attention, tại sao phải chia cho √d_k?",
    options: [
      "Để tăng tốc GPU.",
      "Để giữ phương sai của dot-product ổn định — nếu không, gradient softmax gần như bằng 0.",
      "Để đảm bảo tổng attention bằng 1.",
      "Chỉ là thói quen, không có ý nghĩa.",
    ],
    correct: 1,
    explanation:
      "Với Q, K chuẩn hóa, var(Q·K) ≈ d_k. Khi d_k lớn (64, 128), logits lớn → softmax bão hòa → gradient ~0. Chia √d_k kéo logits về thang hợp lí.",
  },
  {
    question: "Tổng tất cả attention weights cho một truy vấn (một hàng) luôn bằng bao nhiêu?",
    options: ["0", "0.5", "1", "Tùy ngữ cảnh"],
    correct: 2,
    explanation:
      "Softmax biến điểm thành phân phối xác suất — tổng luôn = 1. Giống chia 100% sự chú ý cho các vị trí nguồn.",
  },
  {
    question:
      "Khi tăng temperature T trong softmax (score / T), phân phối attention sẽ thay đổi thế nào?",
    options: [
      "Sắc nét hơn — dồn vào một token duy nhất.",
      "Phẳng hơn — attention dàn đều ra mọi token.",
      "Không đổi.",
      "Đảo ngược thành argmin.",
    ],
    correct: 1,
    explanation:
      "T lớn làm logits nhỏ lại → softmax gần đều. T → 0 ngược lại, biến softmax thành argmax (one-hot). Temperature là 'cần số' kiểm soát độ 'quyết đoán' của attention.",
  },
  {
    type: "fill-blank",
    question:
      "Scaled dot-product attention dùng ba tensor: {blank} (truy vấn) hỏi, {blank} (khóa) so khớp, và {blank} (giá trị) được tổng hợp.",
    blanks: [
      { answer: "query", accept: ["Query", "Q", "truy vấn"] },
      { answer: "key", accept: ["Key", "K", "khóa"] },
      { answer: "value", accept: ["Value", "V", "giá trị"] },
    ],
    explanation:
      "Công thức Attention(Q, K, V) = softmax(QK^T / √d_k) · V — hạt nhân của Transformer.",
  },
  {
    question:
      "Self-attention khác cross-attention ở điểm nào?",
    options: [
      "Self-attention không dùng softmax.",
      "Self-attention lấy Q, K, V từ cùng một chuỗi; cross-attention lấy Q từ decoder, K/V từ encoder.",
      "Cross-attention chỉ dùng cho ảnh.",
      "Hai cái giống hệt nhau.",
    ],
    correct: 1,
    explanation:
      "Self-attention: mỗi token trong một chuỗi nhìn vào các token khác trong CHÍNH chuỗi đó. Cross-attention nối decoder ↔ encoder.",
  },
  {
    question:
      "Ma trận attention cho câu 5 token có kích thước bao nhiêu (một đầu, chưa batch)?",
    options: ["5 × 3", "5 × 5", "3 × 5", "25 × 25"],
    correct: 1,
    explanation:
      "Với seq_len = 5, Q ∈ R^{5×d_k}, K ∈ R^{5×d_k} → QK^T ∈ R^{5×5}. Mỗi hàng là phân phối attention của 1 query trên 5 key.",
  },
];

/* ============================================================================
 * UTILITIES — softmax, color scale
 * ==========================================================================*/

function softmax(scores: number[], temperature: number): number[] {
  const T = Math.max(temperature, 0.05);
  const adjusted = scores.map((s) => s / T);
  const maxScore = Math.max(...adjusted);
  const exps = adjusted.map((s) => Math.exp(s - maxScore));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

// Heatmap color: weight 0 → pale surface, weight 1 → accent yellow
function weightColor(w: number): string {
  // Dùng HSL: 45° (amber/yellow), saturation tỉ lệ w
  const lightness = 95 - w * 55; // 95% → 40%
  const saturation = 60 + w * 35; // 60% → 95%
  return `hsl(45, ${saturation}%, ${lightness}%)`;
}

function textColorOn(w: number): string {
  return w > 0.5 ? "#1f2937" : "#64748b";
}

/* ============================================================================
 * MAIN COMPONENT
 * ==========================================================================*/

export default function AttentionMechanismTopic() {
  // Query token được chọn (hàng hiện tại của ma trận attention)
  const [queryIdx, setQueryIdx] = useState<TokenIndex>(1); // "yêu"
  const [temperature, setTemperature] = useState(1.0);
  // Bước animation (0 = QK^T, 1 = softmax, 2 = weighted V)
  const [stage, setStage] = useState<0 | 1 | 2>(2);

  const rawRow = useMemo(() => RAW_SCORES[queryIdx], [queryIdx]);

  const attentionRow = useMemo(
    () => softmax(rawRow, temperature),
    [rawRow, temperature],
  );

  // Weighted value vector = Σ α_j · V_j
  const contextVec = useMemo(() => {
    const out = [0, 0, 0];
    for (let j = 0; j < TOKENS.length; j++) {
      for (let k = 0; k < 3; k++) {
        out[k] += attentionRow[j] * VALUE_VECS[j][k];
      }
    }
    return out;
  }, [attentionRow]);

  const topAttentionIdx = useMemo(
    () => attentionRow.indexOf(Math.max(...attentionRow)),
    [attentionRow],
  );

  const entropy = useMemo(() => {
    return -attentionRow.reduce(
      (acc, p) => acc + (p > 0 ? p * Math.log2(p) : 0),
      0,
    );
  }, [attentionRow]);

  // Mọi hàng softmax cho heatmap đầy đủ
  const fullMatrix = useMemo(() => {
    return RAW_SCORES.map((row) => softmax(row, temperature));
  }, [temperature]);

  const handleQueryClick = useCallback((i: number) => {
    setQueryIdx(i as TokenIndex);
  }, []);

  const handleStageAdvance = useCallback(() => {
    setStage((s) => ((s + 1) % 3) as 0 | 1 | 2);
  }, []);

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════════
       * STEP 1 — HOOK: dự đoán ai chú ý vào ai
       * ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Thử thách mở đầu">
        <p className="text-sm text-foreground leading-relaxed mb-3">
          Trước khi nhìn vào công thức, hãy thử tưởng tượng bạn là phiên dịch viên.
          Bạn đang đọc câu <em>&quot;Tôi yêu Việt Nam quá&quot;</em> và chuẩn bị
          dịch từng từ ra tiếng Anh. Khi bạn chạm tới từ
          <strong> &quot;Nam&quot;</strong>, mắt bạn lập tức liếc về đâu?
        </p>
        <PredictionGate
          question={`Khi dịch token "Nam", não bạn ưu tiên NHÌN VÀO đâu nhất trong câu nguồn?`}
          options={[
            '"Tôi" — vì đứng đầu câu, là chủ ngữ.',
            '"Việt" — vì ghép với "Nam" tạo thành tên riêng "Việt Nam".',
            '"quá" — vì nó bổ nghĩa cho cả câu.',
          ]}
          correct={1}
          explanation={`Chính xác! Để dịch "Nam" thành "Vietnam", não bạn phải đọc kèm "Việt" — hai token này tạo thành một đơn vị ngữ nghĩa. Attention trong neural network làm đúng việc đó: nó học ra rằng token "Nam" nên "nhìn" vào "Việt" với trọng số cao.`}
        />
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════════════
       * STEP 2 — DISCOVER: Interactive Attention Heatmap
       * ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá ma trận chú ý">
        <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-foreground leading-relaxed">
            Chạm vào một token để xem nó <em>chú ý</em> vào những token nào.
            Kéo slider để điều chỉnh <strong>temperature</strong> của softmax.
          </p>
          <ProgressSteps
            current={stage + 1}
            total={3}
            labels={["Q · K^T", "softmax", "Σ α·V"]}
          />
        </div>

        <VisualizationSection topicSlug={metadata.slug}>
          <div className="space-y-5">
            {/* ─────────── Token selector row ─────────── */}
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                Chọn Query token (hàng trong ma trận)
              </p>
              <div className="flex gap-2 flex-wrap">
                {TOKENS.map((tok, i) => (
                  <button
                    key={tok}
                    type="button"
                    onClick={() => handleQueryClick(i)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                      queryIdx === i
                        ? "bg-accent text-white ring-2 ring-accent/40 scale-105 shadow-sm"
                        : "bg-card border border-border text-muted hover:text-foreground hover:border-accent/50"
                    }`}
                    aria-pressed={queryIdx === i}
                  >
                    {tok}
                  </button>
                ))}
              </div>
            </div>

            {/* ─────────── Full 5×5 Heatmap ─────────── */}
            <div
              className="rounded-xl border border-border bg-background/40 p-4"
              role="img"
              aria-label={`Ma trận attention 5×5. Query hiện tại "${TOKENS[queryIdx]}" chú ý mạnh nhất vào "${TOKENS[topAttentionIdx]}" (${(attentionRow[topAttentionIdx]*100).toFixed(0)}%).`}
            >
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3 text-center">
                Ma trận attention 5×5 (hàng = query, cột = key)
              </p>

              <div className="flex items-start gap-2">
                {/* Row labels */}
                <div className="flex flex-col gap-1 pt-7">
                  {TOKENS.map((tok, i) => (
                    <div
                      key={`rl-${tok}`}
                      className={`h-10 w-14 flex items-center justify-end pr-2 text-xs font-semibold ${
                        i === queryIdx ? "text-accent" : "text-muted"
                      }`}
                    >
                      {tok}
                    </div>
                  ))}
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-x-auto">
                  {/* Col labels */}
                  <div className="flex gap-1 mb-1">
                    {TOKENS.map((tok, j) => (
                      <div
                        key={`cl-${tok}`}
                        className={`h-6 flex-1 min-w-[52px] flex items-center justify-center text-xs font-semibold ${
                          j === topAttentionIdx
                            ? "text-accent"
                            : "text-muted"
                        }`}
                      >
                        {tok}
                      </div>
                    ))}
                  </div>

                  {/* Cells */}
                  <div className="space-y-1">
                    {fullMatrix.map((row, i) => (
                      <div key={`row-${i}`} className="flex gap-1">
                        {row.map((w, j) => {
                          const isActiveRow = i === queryIdx;
                          const bg = weightColor(w);
                          const fg = textColorOn(w);
                          return (
                            <motion.div
                              key={`cell-${i}-${j}`}
                              className={`h-10 flex-1 min-w-[52px] rounded-md flex items-center justify-center text-[11px] font-semibold tabular-nums cursor-pointer transition-all ${
                                isActiveRow
                                  ? "ring-2 ring-accent/60"
                                  : "opacity-60 hover:opacity-90"
                              }`}
                              style={{ backgroundColor: bg, color: fg }}
                              animate={{
                                scale: isActiveRow ? 1.02 : 1,
                              }}
                              transition={{ duration: 0.2 }}
                              onClick={() => handleQueryClick(i)}
                              title={`${TOKENS[i]} → ${TOKENS[j]}: ${(w * 100).toFixed(1)}%`}
                            >
                              {(w * 100).toFixed(0)}
                            </motion.div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <p className="mt-3 text-[11px] text-muted text-center">
                Số trong ô = xác suất attention (%). Hàng đang chọn được viền
                accent. Tổng mỗi hàng = 100%.
              </p>
            </div>

            {/* ─────────── Focused row: query → all keys ─────────── */}
            <div className="rounded-xl border border-border bg-background/40 p-4">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
                Attention của <span className="text-accent">&quot;{TOKENS[queryIdx]}&quot;</span>{" "}
                trên 5 token
              </p>

              <div className="space-y-2">
                {TOKENS.map((tok, j) => {
                  const w = attentionRow[j];
                  const isMax = j === topAttentionIdx;
                  return (
                    <div key={`bar-${tok}`} className="flex items-center gap-3">
                      <span
                        className={`w-16 text-right text-sm font-medium transition-all ${
                          isMax
                            ? "text-accent font-bold"
                            : "text-foreground"
                        }`}
                      >
                        {tok}
                      </span>
                      <div className="flex-1 h-7 rounded-md bg-surface overflow-hidden relative">
                        <motion.div
                          className="h-full rounded-md"
                          style={{ backgroundColor: weightColor(w) }}
                          initial={{ width: 0 }}
                          animate={{ width: `${w * 100}%` }}
                          transition={{ duration: 0.45, ease: "easeOut" }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-foreground">
                          {(w * 100).toFixed(1)}%
                        </span>
                      </div>
                      <span className="w-14 text-[11px] text-muted font-mono">
                        raw={rawRow[j].toFixed(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ─────────── Temperature slider ─────────── */}
            <div className="rounded-xl border border-border bg-background/60 p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-sm font-semibold text-foreground">
                  Softmax temperature T
                </label>
                <div className="flex items-center gap-2 text-[11px] text-muted">
                  <span>
                    Entropy ={" "}
                    <span className="font-mono text-foreground">
                      {entropy.toFixed(2)} bits
                    </span>
                  </span>
                  <span>·</span>
                  <span>
                    argmax ={" "}
                    <span className="font-mono text-accent">
                      {TOKENS[topAttentionIdx]}
                    </span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] text-muted w-12">sắc nét</span>
                <input
                  type="range"
                  min={0.1}
                  max={5}
                  step={0.1}
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  className="flex-1 accent-accent"
                  aria-label="Temperature"
                />
                <span className="text-[11px] text-muted w-12 text-right">phẳng</span>
                <span className="w-14 text-center text-sm font-bold text-accent tabular-nums">
                  T = {temperature.toFixed(1)}
                </span>
              </div>

              <p className="text-[11px] text-muted leading-relaxed">
                T nhỏ (→ 0): softmax hội tụ về argmax (one-hot, quyết đoán).
                T lớn (→ ∞): phân phối phẳng (do dự, chú ý đều). Transformer
                dùng mặc định T = 1 sau khi đã chia √d_k.
              </p>
            </div>

            {/* ─────────── 3-stage animation: QK^T → softmax → Σα·V ─────── */}
            <div className="rounded-xl border border-border bg-background/40 p-4 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-xs font-semibold text-muted uppercase tracking-wide">
                  Ba bước của scaled dot-product attention
                </p>
                <button
                  type="button"
                  onClick={handleStageAdvance}
                  className="text-[11px] px-3 py-1.5 rounded-md bg-accent text-white font-semibold hover:bg-accent/90 transition"
                >
                  Bước kế tiếp →
                </button>
              </div>

              {/* Stage 0: raw scores */}
              <div
                className={`rounded-lg border p-3 transition-all ${
                  stage === 0
                    ? "border-blue-500/60 bg-blue-500/10"
                    : "border-border/50 opacity-60"
                }`}
              >
                <p className="text-[11px] font-semibold text-blue-500 mb-2">
                  ① Điểm thô e<sub>ij</sub> = Q<sub>i</sub> · K<sub>j</sub>^T / √d_k
                </p>
                <div className="flex gap-1">
                  {rawRow.map((s, j) => (
                    <div
                      key={`raw-${j}`}
                      className="flex-1 h-8 rounded bg-blue-500/15 flex items-center justify-center text-[11px] font-mono text-blue-500"
                    >
                      {s.toFixed(2)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Stage 1: softmax */}
              <div
                className={`rounded-lg border p-3 transition-all ${
                  stage === 1
                    ? "border-amber-500/60 bg-amber-500/10"
                    : "border-border/50 opacity-60"
                }`}
              >
                <p className="text-[11px] font-semibold text-amber-500 mb-2">
                  ② α<sub>ij</sub> = softmax(e<sub>ij</sub>) — tổng = 1
                </p>
                <div className="flex gap-1">
                  {attentionRow.map((w, j) => (
                    <div
                      key={`soft-${j}`}
                      className="flex-1 h-8 rounded flex items-center justify-center text-[11px] font-mono font-semibold"
                      style={{
                        backgroundColor: weightColor(w),
                        color: textColorOn(w),
                      }}
                    >
                      {(w * 100).toFixed(0)}%
                    </div>
                  ))}
                </div>
              </div>

              {/* Stage 2: weighted sum of V */}
              <div
                className={`rounded-lg border p-3 transition-all ${
                  stage === 2
                    ? "border-green-500/60 bg-green-500/10"
                    : "border-border/50 opacity-60"
                }`}
              >
                <p className="text-[11px] font-semibold text-green-500 mb-2">
                  ③ context<sub>i</sub> = Σ<sub>j</sub> α<sub>ij</sub> · V<sub>j</sub>
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1 flex-1">
                    {VALUE_LABELS.map((lbl, k) => (
                      <div key={`v-${k}`} className="flex items-center gap-2">
                        <span className="w-16 text-[10px] text-muted text-right">
                          {lbl}
                        </span>
                        <div className="flex-1 h-4 rounded bg-surface overflow-hidden relative">
                          <motion.div
                            className="h-full bg-green-500/70"
                            initial={{ width: 0 }}
                            animate={{ width: `${contextVec[k] * 100}%` }}
                            transition={{
                              duration: 0.4,
                              delay: k * 0.05,
                            }}
                          />
                        </div>
                        <span className="w-10 text-[10px] font-mono text-green-500">
                          {contextVec[k].toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-muted mt-2">
                  Vector ngữ cảnh của <strong>&quot;{TOKENS[queryIdx]}&quot;</strong>{" "}
                  là hỗn hợp có trọng số của 5 vector value. Đây chính là output
                  attention sẽ truyền sang lớp kế.
                </p>
              </div>
            </div>

            {/* ─────────── Takeaway ─────────── */}
            <div className="rounded-lg bg-background/60 border border-border p-3 text-center">
              <p className="text-sm text-muted leading-relaxed">
                Khi xử lí{" "}
                <strong className="text-accent">
                  &quot;{TOKENS[queryIdx]}&quot;
                </strong>
                , mô hình chú ý nhất vào{" "}
                <strong className="text-accent">
                  &quot;{TOKENS[topAttentionIdx]}&quot;
                </strong>{" "}
                ({(attentionRow[topAttentionIdx] * 100).toFixed(1)}%). Tổng
                weights = {attentionRow.reduce((a, b) => a + b, 0).toFixed(2)}.
              </p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════════════
       * STEP 3 — AHA MOMENT
       * ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          <p>
            <strong>Attention</strong> biến mỗi token thành một <em>người hỏi</em>
            . Token đặt câu hỏi (query), so sánh với mọi token khác (key) để
            quyết định <strong>mình nên nghe ai</strong>. Câu trả lời không phải
            là một từ, mà là một <em>hỗn hợp có trọng số</em> của giá trị các
            token khác.
          </p>
          <p className="text-sm text-muted mt-2">
            Đây là lí do cơ chế này giải bài toán phụ thuộc xa (long-range
            dependency) mà RNN vật vã suốt thập kỉ — bất kể hai token cách nhau
            bao xa, attention chỉ mất một phép nhân ma trận để kết nối chúng.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════════════
       * STEP 4 — FIRST CHALLENGE
       * ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách nhanh 1">
        <InlineChallenge
          question="Một hàng attention weights cộng lại bằng 1.07. Điều gì đã sai?"
          options={[
            "Bình thường — đôi khi softmax cho tổng hơi lớn.",
            "Chắc chắn có lỗi — softmax luôn cho tổng chính xác bằng 1 theo định nghĩa.",
            "Đúng rồi — tổng không nhất thiết phải bằng 1.",
          ]}
          correct={1}
          explanation="Softmax định nghĩa là exp(x_i) / Σ exp(x_j). Dù điểm thô thế nào, mẫu số chuẩn hoá → tổng phải bằng 1 chính xác (bỏ qua lỗi float). 1.07 → lỗi implementation."
        />
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════════════
       * STEP 5 — 3-STEP PROCESS với công thức
       * ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Quy trình 3 bước">
        <div className="space-y-3">
          {[
            {
              step: "1. Tính điểm (Score)",
              desc: "So sánh query với mỗi key để ra điểm 'tương thích'.",
              formula: "e_{ij} = \\frac{Q_i \\cdot K_j^\\top}{\\sqrt{d_k}}",
              color: "#3b82f6",
            },
            {
              step: "2. Softmax (Normalize)",
              desc: "Biến điểm thành phân phối xác suất — tổng = 1.",
              formula:
                "\\alpha_{ij} = \\frac{\\exp(e_{ij})}{\\sum_k \\exp(e_{ik})}",
              color: "#f59e0b",
            },
            {
              step: "3. Tổng có trọng số giá trị",
              desc: "Kết hợp các value vector theo trọng số α.",
              formula: "\\text{context}_i = \\sum_j \\alpha_{ij} \\, V_j",
              color: "#22c55e",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-xl border p-4 space-y-2"
              style={{ borderColor: item.color + "40" }}
            >
              <p
                className="text-sm font-semibold"
                style={{ color: item.color }}
              >
                {item.step}
              </p>
              <p className="text-sm text-foreground">{item.desc}</p>
              <LaTeX block>{item.formula}</LaTeX>
            </div>
          ))}
        </div>

        <Callout variant="warning" title="Đừng quên masking trong decoder">
          <p>
            Khi attention được dùng trong decoder của Transformer (sinh văn bản
            từ trái sang phải), ta phải <strong>mask</strong> các key ở tương
            lai: điểm e<sub>ij</sub> với j &gt; i được đặt bằng −∞ trước softmax
            → α = 0. Nếu không làm vậy, mô hình &quot;gian lận&quot; bằng cách
            nhìn vào đáp án.
          </p>
        </Callout>
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════════════
       * STEP 6 — EXPLANATION + Callouts + Collapsibles + CodeBlock
       * ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Lý thuyết sâu">
        <ExplanationSection>
          <p>
            Cơ chế <strong>Attention</strong> được giới thiệu bởi Bahdanau và
            đồng nghiệp (2014) cho bài toán dịch máy. Ý tưởng ban đầu: cho
            decoder của mô hình{" "}
            <TopicLink slug="seq2seq">Seq2Seq</TopicLink> &quot;nhìn lại&quot;
            mọi trạng thái ẩn của encoder thay vì chỉ dùng một context vector.
            Ba năm sau, Vaswani et al. (2017) trong bài{" "}
            <em>&quot;Attention is All You Need&quot;</em> tổng quát hoá thành{" "}
            <TopicLink slug="self-attention">self-attention</TopicLink>: token
            nhìn vào chính chuỗi của mình. Đây là nền tảng của{" "}
            <TopicLink slug="transformer">Transformer</TopicLink>, GPT, BERT, và
            mọi LLM hiện đại.
          </p>

          <Callout variant="insight" title="Ba biến thể attention lịch sử">
            <div className="space-y-2 text-sm">
              <p>
                <strong>Additive (Bahdanau 2014):</strong>{" "}
                <LaTeX>{`\\text{score}(s, h) = v^{\\top} \\tanh(W_1 s + W_2 h)`}</LaTeX>
                {" "}— học qua mạng MLP nhỏ, linh hoạt nhưng chậm.
              </p>
              <p>
                <strong>Dot-product (Luong 2015):</strong>{" "}
                <LaTeX>{`\\text{score}(s, h) = s^{\\top} h`}</LaTeX>
                {" "}— đơn giản, nhanh, nhưng không ổn định khi d lớn.
              </p>
              <p>
                <strong>Scaled dot-product (Transformer 2017):</strong>{" "}
                <LaTeX>{`\\text{score}(Q, K) = \\frac{Q K^{\\top}}{\\sqrt{d_k}}`}</LaTeX>
                {" "}— chia √d_k giải quyết vấn đề variance bùng nổ.
              </p>
            </div>
          </Callout>

          <Callout variant="info" title="Attention → Self-Attention → Multi-Head">
            <div className="space-y-2 text-sm">
              <p>
                <strong>Attention cổ điển:</strong> Q từ decoder, K/V từ
                encoder. Gọi là <em>cross-attention</em>.
              </p>
              <p>
                <strong>Self-Attention:</strong> Q, K, V đều từ cùng một chuỗi —
                mỗi token nhìn vào tất cả token khác trong chính nó.
              </p>
              <p>
                <strong>Multi-Head:</strong> chạy h đầu attention song song,
                mỗi đầu có W_Q, W_K, W_V riêng → học nhiều loại quan hệ cùng
                lúc (ngữ pháp, ngữ nghĩa, đồng quy chiếu...).
              </p>
            </div>
          </Callout>

          <Callout variant="warning" title="Độ phức tạp O(n²) của attention">
            <p>
              Ma trận attention có kích thước n × n (với n = độ dài chuỗi) →
              bộ nhớ và thời gian tính đều O(n²). Đây là lí do LLM bị giới hạn
              context. Các biến thể như FlashAttention, Linear Attention,
              Sliding Window Attention (Longformer) giảm xuống O(n log n) hoặc
              O(n).
            </p>
          </Callout>

          <Callout variant="tip" title="Debug attention trong thực tế">
            <p>
              Khi mô hình dịch sai, visualize ma trận attention là bước đầu
              tiên. Nếu thấy mô hình chú ý sai chỗ — ví dụ khi dịch
              &quot;bank&quot; (ngân hàng) mà attention dồn vào
              &quot;river&quot; thay vì &quot;money&quot; — bạn biết vấn đề
              nằm ở chỗ học, không phải ở decoder. BertViz và các công cụ như
              <code> exbert </code> hay <code>attention-viewer</code> cho phép
              &quot;mổ&quot; từng đầu attention của các mô hình pre-trained.
            </p>
          </Callout>

          <p className="mt-4">
            Một cách nhìn hữu ích: xem attention như một <strong>hệ thống
            truy vấn cơ sở dữ liệu mềm</strong>. Query giống như câu truy vấn
            SQL. Key giống như chỉ mục (index) của mỗi hàng. Value là nội
            dung. Khác biệt duy nhất: thay vì trả về một hàng duy nhất khớp
            chính xác, attention trả về một <em>hỗn hợp mờ</em> — trọng số
            theo độ khớp giữa query và key.
          </p>

          <p>
            Cụ thể hơn, trong self-attention của Transformer:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>
              <strong>Q = X · W_Q</strong>: mỗi token biến thành một câu hỏi.
            </li>
            <li>
              <strong>K = X · W_K</strong>: mỗi token biến thành một &quot;nhãn&quot;
              mô tả chính nó.
            </li>
            <li>
              <strong>V = X · W_V</strong>: mỗi token biến thành một &quot;nội
              dung&quot; sẵn sàng được tổng hợp.
            </li>
            <li>
              Ba ma trận W_Q, W_K, W_V được học qua backprop — mạng tự quyết
              định thế nào là &quot;khớp&quot;.
            </li>
          </ul>

          <CollapsibleDetail title="Tại sao lại cần chia √d_k? (chi tiết toán)">
            <div className="space-y-3 text-sm">
              <p>
                Giả sử Q, K có các thành phần độc lập, kì vọng 0, phương sai 1.
                Khi đó dot product{" "}
                <LaTeX>{`Q \\cdot K = \\sum_{i=1}^{d_k} Q_i K_i`}</LaTeX> có
                phương sai = d_k (tổng của d_k biến độc lập với var = 1).
              </p>
              <p>
                Cụ thể:{" "}
                <LaTeX>{`\\mathbb{E}[Q_i K_i] = \\mathbb{E}[Q_i]\\,\\mathbb{E}[K_i] = 0`}</LaTeX>
                {" "}(do độc lập), và{" "}
                <LaTeX>{`\\text{Var}(Q_i K_i) = \\mathbb{E}[Q_i^2]\\,\\mathbb{E}[K_i^2] = 1`}</LaTeX>
                . Tổng d_k số hạng độc lập → phương sai cộng lại bằng d_k.
              </p>
              <p>
                Với d_k = 64, std ≈ 8. Softmax trên logits độ lớn ±8 → xác
                suất bão hòa sát 0 hoặc 1 → gradient gần như 0. Chia √d_k kéo
                std về 1, giữ softmax ở vùng &quot;có gradient&quot;.
              </p>
              <p>
                Thử thực nghiệm (trong paper gốc Transformer): train không
                chia √d_k trên d_k = 512 — loss gần như không giảm sau epoch
                1. Thêm scale → loss giảm mượt từ epoch đầu.
              </p>
              <LaTeX block>{`\\text{Var}(Q \\cdot K) = d_k \\;\\implies\\; \\text{Var}\\!\\left(\\frac{Q \\cdot K}{\\sqrt{d_k}}\\right) = 1`}</LaTeX>
              <p className="text-muted">
                Một câu hỏi hay: tại sao không dùng LayerNorm lên logits?
                Trả lời: được — một số biến thể (NormFormer, SubFormer) làm
                vậy. Nhưng chia √d_k rẻ hơn nhiều và đủ ổn với khởi tạo
                Xavier / He.
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="Multi-Head attention: vì sao lại chia đầu?">
            <div className="space-y-3 text-sm">
              <p>
                Một đầu attention duy nhất bị ép phải học một &quot;kiểu&quot;
                quan hệ. Ví dụ, đầu có thể học cú pháp chủ-vị nhưng bỏ qua
                quan hệ đồng quy chiếu (coreference), hoặc ngược lại — và
                không có cách nào ép nó làm cả hai cùng lúc một cách cân bằng.
              </p>
              <p>
                Multi-head chia không gian d thành h đầu, mỗi đầu có d_k = d/h
                chiều. Mỗi đầu có các ma trận chiếu W_Q^(h), W_K^(h), W_V^(h)
                riêng → có thể phát triển &quot;sở trường&quot; khác nhau. Khi
                phân tích GPT-2 (Clark et al. 2019), người ta quan sát thấy:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Đầu A</strong> học quan hệ chủ ngữ ↔ động từ (SVO).
                </li>
                <li>
                  <strong>Đầu B</strong> học đồng quy chiếu (&quot;he&quot; →
                  &quot;John&quot;).
                </li>
                <li>
                  <strong>Đầu C</strong> nhìn vào token kế liền (copy
                  pattern — kiểu n-gram).
                </li>
                <li>
                  <strong>Đầu D</strong> chú ý vào token đặc biệt như [CLS],
                  dấu chấm câu (&quot;no-op&quot; attention).
                </li>
                <li>
                  <strong>Đầu E</strong> chú ý theo khoảng cách cố định (chu
                  kì — giống convolution).
                </li>
              </ul>
              <p>
                Output h đầu được concat lại thành vector d chiều, rồi đi qua
                một ma trận chiếu W_O cuối. Tức là mạng <em>tổng hợp</em>
                nhiều góc nhìn thành một biểu diễn duy nhất.
              </p>
              <LaTeX block>{`\\text{MultiHead}(Q,K,V) = \\text{Concat}(\\text{head}_1,\\dots,\\text{head}_h) W^O`}</LaTeX>
              <LaTeX block>{`\\text{head}_i = \\text{Attention}(Q W_i^Q, K W_i^K, V W_i^V)`}</LaTeX>
              <p className="text-muted">
                Một nghịch lí thú vị: các nghiên cứu gần đây (Michel et al.
                2019) cho thấy nhiều đầu có thể <em>prune</em> đi mà model
                hầu như không giảm chất lượng — gợi ý rằng multi-head thực
                chất đóng vai trò như một dạng regularization / over-parameter
                giúp model dễ train hơn.
              </p>
            </div>
          </CollapsibleDetail>

          <CodeBlock language="python" title="attention_from_scratch.py">
{`import torch
import torch.nn as nn
import torch.nn.functional as F
import math


class ScaledDotProductAttention(nn.Module):
    """Attention(Q, K, V) = softmax(QK^T / sqrt(d_k)) V."""

    def forward(self, q, k, v, mask=None):
        # q: [B, H, L_q, d_k]
        # k: [B, H, L_k, d_k]
        # v: [B, H, L_k, d_v]
        d_k = q.size(-1)

        # 1) Raw scores = Q · K^T / sqrt(d_k)
        scores = torch.matmul(q, k.transpose(-2, -1)) / math.sqrt(d_k)
        # scores: [B, H, L_q, L_k]

        # 2) Optional causal mask (decoder)
        if mask is not None:
            scores = scores.masked_fill(mask == 0, float("-inf"))

        # 3) Softmax → attention weights
        attn = F.softmax(scores, dim=-1)  # tổng theo L_k = 1

        # 4) Weighted sum of V
        out = torch.matmul(attn, v)
        # out: [B, H, L_q, d_v]

        return out, attn


class MultiHeadAttention(nn.Module):
    def __init__(self, d_model: int, n_heads: int):
        super().__init__()
        assert d_model % n_heads == 0
        self.d_model = d_model
        self.n_heads = n_heads
        self.d_k = d_model // n_heads

        self.W_q = nn.Linear(d_model, d_model)
        self.W_k = nn.Linear(d_model, d_model)
        self.W_v = nn.Linear(d_model, d_model)
        self.W_o = nn.Linear(d_model, d_model)

        self.attn = ScaledDotProductAttention()

    def forward(self, q, k, v, mask=None):
        B = q.size(0)

        # 1) Linear projection → split into heads
        #    [B, L, d_model] → [B, H, L, d_k]
        q = self.W_q(q).view(B, -1, self.n_heads, self.d_k).transpose(1, 2)
        k = self.W_k(k).view(B, -1, self.n_heads, self.d_k).transpose(1, 2)
        v = self.W_v(v).view(B, -1, self.n_heads, self.d_k).transpose(1, 2)

        # 2) Scaled dot-product attention trên tất cả các đầu song song
        out, attn = self.attn(q, k, v, mask=mask)

        # 3) Concat các đầu
        out = out.transpose(1, 2).contiguous().view(B, -1, self.d_model)

        # 4) Projection cuối
        return self.W_o(out), attn


# ─── Ví dụ nhanh trên câu "Tôi yêu Việt Nam quá"
if __name__ == "__main__":
    seq_len, d_model, n_heads = 5, 64, 4
    mha = MultiHeadAttention(d_model, n_heads)

    # Giả lập embedding của 5 token
    x = torch.randn(1, seq_len, d_model)  # [B=1, L=5, d=64]

    # Self-attention: Q, K, V đều = x
    context, attn = mha(x, x, x)
    print("Context shape:", context.shape)        # [1, 5, 64]
    print("Attention shape:", attn.shape)         # [1, 4, 5, 5]
    print("Sum per row (đầu 0):",
          attn[0, 0].sum(dim=-1))                 # tensor([1., 1., 1., 1., 1.])`}
          </CodeBlock>

          <p className="mt-4">
            Một điểm thú vị nữa: trong các mô hình ngôn ngữ lớn hiện đại (GPT-4,
            Claude, Gemini), attention không chỉ được dùng để kết nối các
            token trong cùng một câu — nó còn kết nối các <strong>đoạn văn
            bản cách xa hàng nghìn token</strong>. Khi model đọc một tài liệu
            dài và trả lời câu hỏi về đoạn đầu, về mặt cơ học thì attention
            của token trả lời <em>phải</em> nhìn được về token của đoạn đầu.
            Đây là lí do kích thước context window (32K, 200K, 1M token) trở
            thành chỉ số quan trọng của LLM.
          </p>

          <p>
            Tuy nhiên, chất lượng attention không đều trên mọi khoảng cách.
            Các thí nghiệm &quot;needle in a haystack&quot; (tìm kim trong
            đống rơm) cho thấy nhiều mô hình có độ chính xác giảm đáng kể ở
            giữa context dài — hiện tượng gọi là <em>&quot;lost in the
            middle&quot;</em> (Liu et al. 2023). Nghiên cứu hiện nay tập trung
            vào cải thiện positional encoding (RoPE, ALiBi), attention
            sparsity, và training strategy để attention phân bố đều hơn.
          </p>

          <CodeBlock language="python" title="attention_visualize.py">
{`import matplotlib.pyplot as plt
import seaborn as sns
import torch

# Cho ma trận attention đã có từ model (shape [L, L])
def plot_attention(attn_matrix, tokens):
    """Vẽ heatmap attention như visualization ở phía trên."""
    fig, ax = plt.subplots(figsize=(6, 5))
    sns.heatmap(
        attn_matrix.cpu().detach(),
        xticklabels=tokens,
        yticklabels=tokens,
        cmap="YlOrBr",      # amber scale — giống UI của bài này
        annot=True,
        fmt=".2f",
        cbar_kws={"label": "attention weight"},
        ax=ax,
    )
    ax.set_xlabel("Key (từ được nhìn)")
    ax.set_ylabel("Query (từ đang hỏi)")
    ax.set_title("Attention matrix")
    plt.tight_layout()
    return fig


# Pipeline đầy đủ cho 1 câu
def attention_for_sentence(model, tokenizer, sentence):
    tokens = tokenizer.tokenize(sentence)
    ids = torch.tensor([tokenizer.convert_tokens_to_ids(tokens)])

    with torch.no_grad():
        outputs = model(ids, output_attentions=True)

    # outputs.attentions: tuple[L_layers] of [B, H, L, L]
    # Lấy layer cuối, trung bình qua các đầu
    attn = outputs.attentions[-1][0].mean(dim=0)  # [L, L]

    return plot_attention(attn, tokens)


# sentence = "Tôi yêu Việt Nam quá"
# attention_for_sentence(model, tokenizer, sentence)


# ─── Bonus: so sánh attention ở các layer khác nhau ───
def attention_across_layers(model, tokenizer, sentence):
    """Tạo subplot cho mỗi layer — xem attention evolving theo chiều sâu."""
    tokens = tokenizer.tokenize(sentence)
    ids = torch.tensor([tokenizer.convert_tokens_to_ids(tokens)])

    with torch.no_grad():
        outputs = model(ids, output_attentions=True)

    n_layers = len(outputs.attentions)
    fig, axes = plt.subplots(
        1, n_layers, figsize=(3 * n_layers, 3), sharey=True
    )

    for layer_idx, attn_layer in enumerate(outputs.attentions):
        # Trung bình qua các đầu của layer này
        attn = attn_layer[0].mean(dim=0).cpu()
        ax = axes[layer_idx] if n_layers > 1 else axes
        sns.heatmap(
            attn,
            xticklabels=tokens,
            yticklabels=tokens if layer_idx == 0 else False,
            cmap="YlOrBr",
            cbar=False,
            ax=ax,
            square=True,
        )
        ax.set_title(f"Layer {layer_idx}")

    fig.suptitle("Attention từ nông đến sâu")
    plt.tight_layout()
    return fig


# ─── Bonus 2: temperature sweep (giống slider ở phần viz) ───
def temperature_sweep(raw_scores, tokens, temperatures=(0.2, 1.0, 5.0)):
    """Vẽ 3 heatmap với T khác nhau để so sánh độ 'quyết đoán'."""
    fig, axes = plt.subplots(1, len(temperatures), figsize=(4 * len(temperatures), 4))

    for ax, T in zip(axes, temperatures):
        scaled = raw_scores / T
        attn = torch.softmax(scaled, dim=-1)

        sns.heatmap(
            attn,
            xticklabels=tokens,
            yticklabels=tokens,
            cmap="YlOrBr",
            annot=True,
            fmt=".2f",
            cbar=False,
            ax=ax,
        )
        ax.set_title(f"T = {T}")

    return fig`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════════════
       * STEP 6.5 — Historical & conceptual appendix
       * ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection
        step={6}
        totalSteps={TOTAL_STEPS}
        label="Lịch sử và tương lai"
      >
        <div className="rounded-xl border border-border bg-background/40 p-5 space-y-3 text-sm">
          <p className="text-sm font-semibold text-foreground">
            Dòng chảy tiến hoá của attention
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
              <p className="text-xs font-semibold text-blue-500 mb-1">
                2014 — Bahdanau Attention
              </p>
              <p className="text-xs text-muted leading-relaxed">
                Bổ sung attention vào Seq2Seq RNN. Điểm số dùng MLP nhỏ
                (additive). Chứng minh attention cải thiện BLEU đáng kể cho
                bản dịch câu dài.
              </p>
            </div>

            <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-3">
              <p className="text-xs font-semibold text-purple-500 mb-1">
                2015 — Luong Attention
              </p>
              <p className="text-xs text-muted leading-relaxed">
                Đơn giản hoá thành dot-product (nhanh hơn). Đề xuất
                global vs local attention — local chỉ nhìn cửa sổ nhỏ quanh
                từ hiện tại.
              </p>
            </div>

            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
              <p className="text-xs font-semibold text-amber-500 mb-1">
                2017 — Transformer (Attention is All You Need)
              </p>
              <p className="text-xs text-muted leading-relaxed">
                Xoá RNN hoàn toàn. Chỉ dùng self-attention + multi-head +
                positional encoding. Mở đường cho kỉ nguyên LLM.
              </p>
            </div>

            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3">
              <p className="text-xs font-semibold text-green-500 mb-1">
                2018-2020 — BERT, GPT-2, T5
              </p>
              <p className="text-xs text-muted leading-relaxed">
                Ba kiến trúc chính: encoder-only (BERT), decoder-only (GPT),
                encoder-decoder (T5). Tất cả chỉ là attention + FFN.
              </p>
            </div>

            <div className="rounded-lg border border-pink-500/30 bg-pink-500/10 p-3">
              <p className="text-xs font-semibold text-pink-500 mb-1">
                2022 — FlashAttention
              </p>
              <p className="text-xs text-muted leading-relaxed">
                Tổ chức lại memory access để giảm I/O giữa HBM và SRAM của
                GPU. Attention O(n²) vẫn đúng về mặt lý thuyết, nhưng thực
                tế nhanh gấp 2-4 lần.
              </p>
            </div>

            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
              <p className="text-xs font-semibold text-red-500 mb-1">
                2023+ — Linear &amp; Sparse Attention
              </p>
              <p className="text-xs text-muted leading-relaxed">
                Mamba (SSM), RWKV, Hyena, Longformer — các kiến trúc thay
                thế attention bằng cơ chế O(n) hoặc O(n log n) để mở rộng
                context hàng triệu token.
              </p>
            </div>
          </div>

          <p className="text-xs text-muted mt-2 leading-relaxed">
            Mặc dù vậy, tại thời điểm 2026, <strong>attention vẫn là trái
            tim</strong> của gần như mọi LLM thương mại. Các cải tiến tập
            trung vào <em>tối ưu</em> (FlashAttention, paged attention trong
            vLLM) hoặc <em>lai ghép</em> (attention cho context ngắn, SSM
            cho context dài — như Jamba, Griffin).
          </p>
        </div>
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════════════
       * STEP 7 — SECOND CHALLENGE + MINI SUMMARY
       * ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Thử thách nhanh 2 + Tóm tắt">
        <InlineChallenge
          question="Bạn có 1 head attention và 1 câu 1024 token. Trên GPU với 24GB VRAM, chuyện gì hay xảy ra?"
          options={[
            "Chạy mượt — 1024 chưa đáng kể.",
            "Có thể OOM nếu dùng fp32, vì ma trận attention 1024² × 4 byte ≈ 4MB mỗi mẫu, nhân với batch × layers × heads là rất lớn.",
            "Không bao giờ OOM — attention rất nhẹ.",
          ]}
          correct={1}
          explanation="Attention O(n²) × batch × heads × layers cộng dồn rất nhanh. FlashAttention và gradient checkpointing giúp tiết kiệm VRAM đáng kể. Đây là lí do LLM hiện đại dùng context window có giới hạn và đầu tư vào sparse attention."
        />

        <div className="mt-4">
          <MiniSummary
            title="Ghi nhớ về Attention"
            points={[
              "Mỗi token là một query; nó so khớp với mọi key để chọn 'nên nghe ai'.",
              "Ba bước: Q·K^T / √d_k → softmax → Σ α·V. Tổng mỗi hàng attention = 1.",
              "Chia √d_k giữ variance của điểm thô ~ 1 để softmax không bão hoà.",
              "Softmax temperature nhỏ → quyết đoán (one-hot); lớn → dàn đều.",
              "Multi-head = h đầu song song; mỗi đầu học một loại quan hệ khác.",
              "Độ phức tạp O(n²) là rào cản context dài — FlashAttention / sparse attention giải quyết.",
            ]}
          />
        </div>
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════════════
       * STEP 8 — QUIZ
       * ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra hiểu biết">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
