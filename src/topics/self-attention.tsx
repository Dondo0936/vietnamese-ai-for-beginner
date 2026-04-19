"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
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

export const metadata: TopicMeta = {
  slug: "self-attention",
  title: "Self-Attention",
  titleVi: "Tự chú ý",
  description: "Cơ chế cho phép mỗi vị trí trong chuỗi chú ý đến mọi vị trí khác",
  category: "dl-architectures",
  tags: ["attention", "transformer", "fundamentals"],
  difficulty: "advanced",
  relatedSlugs: ["transformer", "multi-head-attention", "positional-encoding"],
  vizType: "interactive",
};

/* ──────────────────────────────────────────────────────────────
 *  DỮ LIỆU MINH HOẠ
 *  5 token minh hoạ: "The cat sat on mat" (ngữ cảnh giáo khoa).
 *  Ở bản tiếng Việt chúng ta dùng câu "Con mèo ngồi trên bàn" để
 *  người học dễ đọc, đồng thời gắn mỗi từ với một màu token riêng.
 * ────────────────────────────────────────────────────────────── */

const TOKENS = ["Con", "mèo", "ngồi", "trên", "bàn"];
const T_COLORS = ["#3b82f6", "#8b5cf6", "#f97316", "#22c55e", "#ec4899"];

/**
 * Ma trận vector Query (5 × 3). Mỗi dòng Q_i là "câu hỏi" của token i.
 * Con số chỉ mang tính minh hoạ — đủ để tích QK^T cho ra attention
 * mà người học có thể theo dõi bằng mắt thường.
 */
const Q_MAT: number[][] = [
  [0.9, 0.1, 0.2],
  [0.2, 0.8, 0.1],
  [0.3, 0.7, 0.4],
  [0.1, 0.4, 0.8],
  [0.2, 0.6, 0.3],
];

/**
 * Ma trận vector Key (5 × 3). Mỗi dòng K_j là "nhãn" mà token j trưng ra
 * để các token khác so sánh với Query của họ.
 */
const K_MAT: number[][] = [
  [0.8, 0.2, 0.1],
  [0.1, 0.9, 0.2],
  [0.4, 0.6, 0.5],
  [0.2, 0.3, 0.7],
  [0.3, 0.8, 0.2],
];

/**
 * Ma trận vector Value (5 × 3). Value là "nội dung" mà token j mang
 * sang cho output khi được chú ý tới.
 */
const V_MAT: number[][] = [
  [1.0, 0.2, 0.0],
  [0.2, 1.1, 0.1],
  [0.4, 0.3, 0.9],
  [0.1, 0.2, 1.0],
  [0.3, 1.0, 0.4],
];

const D_K = 3;

/** softmax trên một mảng 1-D (ổn định số học) */
function softmax(xs: number[]): number[] {
  const m = Math.max(...xs);
  const exps = xs.map((v) => Math.exp(v - m));
  const s = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / s);
}

function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

/**
 * Tính ma trận attention chuẩn cho self-attention:
 *   scores = Q · Kᵀ / √d_k
 *   weights = softmax(scores) theo từng hàng
 */
function computeAttention(
  q: number[][],
  k: number[][],
): { scores: number[][]; weights: number[][] } {
  const n = q.length;
  const scores: number[][] = [];
  const weights: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j < n; j++) {
      row.push(dot(q[i], k[j]) / Math.sqrt(D_K));
    }
    scores.push(row);
    weights.push(softmax(row));
  }
  return { scores, weights };
}

/**
 * Self vs Cross attention: với cross-attention, Q xuất phát từ một
 * chuỗi khác — ở đây là ngữ cảnh dịch máy: "The black cat ..." →
 * Q vector đi từ decoder (câu dịch), còn K, V giữ nguyên từ encoder.
 */
const Q_CROSS: number[][] = [
  [0.5, 0.3, 0.7],
  [0.1, 0.9, 0.2],
  [0.4, 0.6, 0.5],
  [0.2, 0.7, 0.6],
  [0.6, 0.4, 0.3],
];

const CROSS_TOKENS = ["The", "black", "cat", "sits", "here"];

/* ──────────────────────────────────────────────────────────────
 *  BỘ CÂU HỎI QUIZ
 *  8 câu xen kẽ multiple-choice + code + fill-blank
 * ────────────────────────────────────────────────────────────── */

const quizQuestions: QuizQuestion[] = [
  {
    question: "Mỗi token tạo ra 3 vector Q, K, V. Chúng đóng vai trò gì?",
    options: [
      "Q là input, K là output, V là hidden state",
      "Q = 'tôi hỏi gì?', K = 'tôi chứa gì?', V = 'nội dung của tôi' — attention = softmax(QKᵀ/√d)·V",
      "Q là query SQL, K là primary key, V là value trong database",
      "Q, K, V chỉ là tên khác của embedding",
    ],
    correct: 1,
    explanation:
      "Query hỏi: từ này đang tìm gì? Key đáp: từ kia có nét gì phù hợp? Tích vô hướng QKᵀ đo độ 'khớp'. Value là nội dung thực mà từ đó cung cấp. Softmax chuẩn hoá sang xác suất, rồi nhân với V để tổng hợp ngữ cảnh.",
  },
  {
    question: "Self-attention xử lý chuỗi n token. Độ phức tạp của một lớp là bao nhiêu?",
    options: [
      "O(n) — mỗi token chỉ tính 1 lần",
      "O(n²·d) — mỗi token phải tính attention với MỌI token khác",
      "O(n·log n) — dùng thuật toán chia để trị",
      "O(1) — song song hoàn toàn nên không phụ thuộc n",
    ],
    correct: 1,
    explanation:
      "Ma trận attention có kích thước n×n. Với mỗi ô (i,j) ta còn phải nhân hai vector d-chiều, nên tổng là O(n²·d). Đây là lý do vì sao context window bị giới hạn và Flash Attention, Sparse Attention được phát triển.",
  },
  {
    question: "Vì sao phải chia cho √d_k trong công thức attention?",
    options: [
      "Để giảm kích thước output",
      "Để softmax không bị bão hoà — khi d_k lớn thì QKᵀ có phương sai lớn, softmax dồn hết xác suất vào 1 phần tử, gradient tắt",
      "Để tương thích với positional encoding",
      "Không có lý do cụ thể — chỉ là quy ước",
    ],
    correct: 1,
    explanation:
      "Khi d_k = 512, tích vô hướng Q·K có thể tăng tới cỡ √512. Softmax của giá trị lớn gần như one-hot → gradient cực nhỏ, huấn luyện chậm. Chia √d_k đưa phương sai về 1, softmax mềm hơn, gradient ổn định.",
  },
  {
    type: "code",
    question:
      "Hoàn thành đoạn code tính scaled dot-product self-attention. Q, K, V đã được chiếu sẵn từ X.",
    codeTemplate:
      "scores = Q @ ___.T / np.sqrt(d_k)\nweights = ___(scores, axis=-1)\noutput = weights @ ___",
    language: "python",
    blanks: [
      { answer: "K", accept: ["k"] },
      { answer: "softmax", accept: [] },
      { answer: "V", accept: ["v"] },
    ],
    explanation:
      "Attention(Q,K,V) = softmax(QKᵀ/√d_k)·V. Chia √d_k để ổn định gradient, softmax chuẩn hoá theo hàng, rồi tổng có trọng số trên V cho ra output mang ngữ cảnh.",
  },
  {
    question:
      "Trong cross-attention của Transformer encoder-decoder (ví dụ dịch máy), Q, K, V lấy từ đâu?",
    options: [
      "Q, K, V đều lấy từ decoder",
      "Q, K, V đều lấy từ encoder",
      "Q lấy từ decoder; K và V lấy từ encoder output",
      "Q lấy từ encoder; K, V lấy từ decoder",
    ],
    correct: 2,
    explanation:
      "Decoder dùng Q của mình (câu đang dịch) để 'hỏi' vào K, V của encoder (câu nguồn). Đây chính là điểm khác biệt giữa self-attention (cùng nguồn) và cross-attention (Q từ nguồn khác).",
  },
  {
    question: "Mask trong masked self-attention (decoder) được dùng để làm gì?",
    options: [
      "Ẩn padding token để không ảnh hưởng attention",
      "Cản token t nhìn về các vị trí tương lai (> t) khi sinh chuỗi",
      "Giảm overfitting bằng cách ngẫu nhiên bỏ attention",
      "Tăng tốc độ tính toán",
    ],
    correct: 1,
    explanation:
      "Khi sinh text tuần tự, token ở vị trí t chỉ được thấy các vị trí ≤ t. Mask đặt các giá trị ở phía tương lai bằng -∞ trước softmax, nên xác suất ứng với chúng bằng 0. Đây là 'causal' hay 'look-ahead' mask.",
  },
  {
    type: "fill-blank",
    question:
      "Trong công thức attention, ma trận {blank} có kích thước n×n, còn đầu ra cuối cùng có kích thước n×{blank}.",
    blanks: [
      { answer: "attention", accept: ["attention weights", "weights", "softmax"] },
      { answer: "d_k", accept: ["d_v", "d_model", "d"] },
    ],
    explanation:
      "softmax(QKᵀ/√d_k) có kích thước n×n (mỗi ô là weight của token i tới token j). Nhân với V (n×d_v) ra output n×d_v. Trong thực tế d_v thường bằng d_k hoặc d_model/n_heads.",
  },
  {
    question:
      "Transformer thường dùng multi-head attention thay vì một attention duy nhất. Lợi ích chính là gì?",
    options: [
      "Tăng tốc độ training",
      "Cho phép mô hình nhìn chuỗi dưới NHIỀU 'góc quan hệ' song song — một head bắt cú pháp, head khác bắt đồng tham chiếu, head khác bắt ngữ nghĩa...",
      "Giảm bộ nhớ tiêu thụ",
      "Không cần chia √d_k nữa",
    ],
    correct: 1,
    explanation:
      "Thay vì một ma trận QK duy nhất, ta chia d_model thành h 'đầu' nhỏ, mỗi đầu học một kiểu quan hệ. Các head được concat và chiếu bằng W_O. Đây là lý do kiến trúc có tên 'multi-head'.",
  },
];

/* ──────────────────────────────────────────────────────────────
 *  COMPONENT CHÍNH
 * ────────────────────────────────────────────────────────────── */

export default function SelfAttentionTopic() {
  const [selectedToken, setSelectedToken] = useState(4); // mặc định chọn "bàn"
  const [mode, setMode] = useState<"self" | "cross">("self");
  const [showScaled, setShowScaled] = useState(true);

  const { scores, weights } = useMemo(() => {
    const qUse = mode === "self" ? Q_MAT : Q_CROSS;
    return computeAttention(qUse, K_MAT);
  }, [mode]);

  // Scores không chia √d_k — dùng khi người học tắt scaling để thấy
  // softmax bão hoà ra sao
  const { weights: weightsUnscaled } = useMemo(() => {
    const qUse = mode === "self" ? Q_MAT : Q_CROSS;
    const n = qUse.length;
    const s: number[][] = [];
    const w: number[][] = [];
    for (let i = 0; i < n; i++) {
      const row: number[] = [];
      for (let j = 0; j < n; j++) row.push(dot(qUse[i], K_MAT[j]) * 3); // nhân 3 để mô phỏng d_k lớn
      s.push(row);
      w.push(softmax(row));
    }
    return { scores: s, weights: w };
  }, [mode]);

  const activeWeights = showScaled ? weights : weightsUnscaled;
  const rowWeights = activeWeights[selectedToken];
  const rowScores = scores[selectedToken];
  const maxW = Math.max(...rowWeights);

  const barData = useMemo(() => {
    return rowWeights.map((w, i) => ({
      token: TOKENS[i],
      color: T_COLORS[i],
      weight: w,
      pct: maxW > 0 ? (w / maxW) * 100 : 0,
    }));
  }, [rowWeights, maxW]);

  // Output cho token đang chọn = Σ w_ij · V_j
  const outputVector = useMemo(() => {
    const out = [0, 0, 0];
    for (let j = 0; j < 5; j++) {
      for (let k = 0; k < D_K; k++) out[k] += rowWeights[j] * V_MAT[j][k];
    }
    return out;
  }, [rowWeights]);

  const renderMatrix = useCallback(
    (M: number[][], color: string, label: string, tokens: string[]) => (
      <div className="rounded-xl border border-border bg-background/60 p-3">
        <div className="mb-2 flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: color }}
          />
          <span className="text-xs font-semibold text-foreground">{label}</span>
          <span className="text-[10px] text-muted">({M.length}×{M[0].length})</span>
        </div>
        <div className="grid grid-cols-[auto_repeat(3,minmax(0,1fr))] gap-1 text-[11px]">
          {M.map((row, i) => (
            <React.Fragment key={i}>
              <span className="pr-1 text-right font-medium" style={{ color: T_COLORS[i] }}>
                {tokens[i]}
              </span>
              {row.map((v, j) => (
                <span
                  key={j}
                  className="rounded bg-card px-1.5 py-0.5 text-center font-mono text-foreground"
                >
                  {v.toFixed(2)}
                </span>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    ),
    [],
  );

  const TOTAL_STEPS = 8;

  return (
    <>
      {/* ═══════════════════════════════════════════════════════
       *  BƯỚC 1 — DỰ ĐOÁN
       * ═══════════════════════════════════════════════════════ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question={`Câu "Con mèo ngồi trên bàn". Khi não bạn đọc tới từ "bàn", bạn tự động nghĩ nhiều nhất đến từ nào trong câu?`}
          options={["Con", "mèo", "ngồi", "trên"]}
          correct={1}
          explanation={`"Bàn" liên quan nhất đến "mèo" (chủ thể đang ngồi trên bàn) và "ngồi" (hành động gắn với bàn). Bạn vừa làm 'attention' bằng trực giác — tìm từ liên quan nhất để hiểu nghĩa. Self-attention trong Transformer làm đúng điều đó, nhưng cho MỌI từ, cùng lúc, trong một phép nhân ma trận.`}
        />

        <p className="mt-3 text-sm text-muted leading-relaxed">
          Bạn vừa chọn bằng trực giác. Ở phần tiếp theo bạn sẽ thấy chính con số
          đó hiện ra như một hàng trong ma trận <LaTeX>{"QK^T"}</LaTeX> — đó chính là
          cách máy &quot;chú ý&quot;.
        </p>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════
       *  BƯỚC 2 — ẨN DỤ
       * ═══════════════════════════════════════════════════════ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Ẩn dụ">
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <p className="text-sm text-foreground leading-relaxed">
            Hãy tưởng tượng bạn đang đứng trong <strong>chợ Bến Thành</strong>. Bạn
            là một &quot;từ&quot;, và bạn đang cần hoàn thiện nghĩa của mình bằng
            cách hỏi các gian hàng xung quanh.
          </p>
          <ul className="text-sm text-foreground/90 leading-relaxed space-y-1.5 pl-5 list-disc">
            <li>
              <strong>Query (Q)</strong> là câu hỏi bạn thì thào: &quot;Ai có
              thứ liên quan đến tôi?&quot;
            </li>
            <li>
              <strong>Key (K)</strong> là tấm bảng hiệu của mỗi gian hàng, tóm
              tắt họ đang bán gì.
            </li>
            <li>
              <strong>Value (V)</strong> là món hàng thực sự họ trao cho bạn nếu
              bạn để ý đến họ.
            </li>
          </ul>
          <p className="text-sm text-muted leading-relaxed">
            Bạn nhìn lướt tất cả bảng hiệu (tính <LaTeX>{"QK^T"}</LaTeX>), cho điểm độ liên
            quan, rồi phân chia &quot;sự chú ý&quot; của mình (softmax). Cuối
            cùng bạn gom các món hàng theo tỷ lệ đó — đó là <em>output</em>{" "}
            của attention cho từ &quot;bạn&quot;.
          </p>
        </div>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════
       *  BƯỚC 3 — VISUALIZATION CHÍNH
       * ═══════════════════════════════════════════════════════ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khám phá Attention">
        <p className="text-sm text-foreground leading-relaxed mb-3">
          Dưới đây là toàn bộ self-attention cho câu 5 từ. Bạn có thể:{" "}
          <strong>(1)</strong> bật/tắt chia <LaTeX>{"\\sqrt{d_k}"}</LaTeX> để thấy softmax bão hoà,{" "}
          <strong>(2)</strong> đổi sang cross-attention để thấy Q đến từ
          chuỗi khác, và <strong>(3)</strong> click vào bất kỳ token nào để
          xem hàng attention của nó hiện ra dưới dạng heatmap.
        </p>

        <VisualizationSection topicSlug={metadata.slug}>
          {/* Thanh điều khiển */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-border bg-background p-1">
              {(["self", "cross"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    mode === m
                      ? "bg-accent text-white"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {m === "self" ? "Self-attention" : "Cross-attention"}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowScaled((v) => !v)}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
                showScaled
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-600"
              }`}
            >
              {showScaled ? "Chia √d_k: BẬT" : "Chia √d_k: TẮT (bão hoà!)"}
            </button>
            <span className="ml-auto text-[11px] text-muted">
              Đang xem hàng của token:{" "}
              <strong style={{ color: T_COLORS[selectedToken] }}>
                &quot;{(mode === "cross" ? CROSS_TOKENS : TOKENS)[selectedToken]}&quot;
              </strong>
            </span>
          </div>

          {/* Khu vực SVG chính — attention từ token đang chọn */}
          <svg
            viewBox="0 0 560 280"
            className="w-full rounded-lg border border-border bg-background"
          >
            <text
              x={280}
              y={20}
              fontSize={12}
              fill="currentColor"
              className="text-foreground"
              textAnchor="middle"
              fontWeight={600}
            >
              &quot;{(mode === "cross" ? CROSS_TOKENS : TOKENS)[selectedToken]}&quot; chú ý đến token nào?
            </text>

            {/* Hàng Query (Q) ở trên */}
            {(mode === "cross" ? CROSS_TOKENS : TOKENS).map((token, i) => {
              const x = 70 + i * 100;
              const isSelected = i === selectedToken;
              return (
                <g
                  key={`q-${i}`}
                  className="cursor-pointer"
                  onClick={() => setSelectedToken(i)}
                >
                  <motion.rect
                    x={x - 36}
                    y={34}
                    width={72}
                    height={32}
                    rx={8}
                    fill={T_COLORS[i]}
                    opacity={isSelected ? 0.35 : 0.1}
                    stroke={T_COLORS[i]}
                    strokeWidth={isSelected ? 2.5 : 1}
                    animate={isSelected ? { scale: 1.04 } : { scale: 1 }}
                  />
                  <text
                    x={x}
                    y={55}
                    fontSize={13}
                    fill={T_COLORS[i]}
                    textAnchor="middle"
                    fontWeight={isSelected ? 700 : 500}
                  >
                    {token}
                  </text>
                </g>
              );
            })}

            {/* Đường attention từ Q đã chọn tới các Key, độ dày = weight */}
            {TOKENS.map((token, j) => {
              const x = 70 + j * 100;
              const qx = 70 + selectedToken * 100;
              const w = rowWeights[j];
              const barH = Math.max(2, w * 120);
              return (
                <g key={`bar-${j}`}>
                  <line
                    x1={qx}
                    y1={68}
                    x2={x}
                    y2={110}
                    stroke={T_COLORS[selectedToken]}
                    strokeWidth={w * 9 + 0.5}
                    opacity={w * 1.2 + 0.1}
                  />
                  <motion.rect
                    x={x - 28}
                    y={120 + (120 - barH)}
                    width={56}
                    height={barH}
                    rx={6}
                    fill={T_COLORS[j]}
                    opacity={0.25 + w * 0.6}
                    initial={{ height: 0 }}
                    animate={{ height: barH }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                  <text
                    x={x}
                    y={115 + (120 - barH)}
                    fontSize={11}
                    fill={T_COLORS[j]}
                    textAnchor="middle"
                    fontWeight={600}
                  >
                    {(w * 100).toFixed(0)}%
                  </text>
                  <text
                    x={x}
                    y={270}
                    fontSize={12}
                    fill="currentColor"
                    className="text-foreground"
                    textAnchor="middle"
                  >
                    {token}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Heatmap đầy đủ của toàn bộ ma trận attention */}
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-background/60 p-3">
              <p className="mb-2 text-xs font-semibold text-foreground">
                Heatmap ma trận attention ({mode}-attention, 5×5)
              </p>
              <div className="grid grid-cols-[auto_repeat(5,minmax(0,1fr))] gap-0.5 text-[10px]">
                <span />
                {TOKENS.map((t, j) => (
                  <span
                    key={`hhead-${j}`}
                    className="text-center font-semibold"
                    style={{ color: T_COLORS[j] }}
                  >
                    {t}
                  </span>
                ))}
                {activeWeights.map((row, i) => (
                  <React.Fragment key={`hr-${i}`}>
                    <span
                      className="pr-1 text-right font-semibold"
                      style={{ color: T_COLORS[i] }}
                    >
                      {(mode === "cross" ? CROSS_TOKENS : TOKENS)[i]}
                    </span>
                    {row.map((v, j) => (
                      <button
                        key={`hc-${i}-${j}`}
                        type="button"
                        onClick={() => setSelectedToken(i)}
                        className="rounded-sm py-1 text-center font-mono text-[10px]"
                        style={{
                          backgroundColor: `rgba(59,130,246,${0.15 + v * 0.85})`,
                          color: v > 0.45 ? "white" : "var(--color-foreground)",
                          outline:
                            i === selectedToken
                              ? "2px solid var(--color-accent)"
                              : undefined,
                        }}
                        title={`w(${i}→${j}) = ${v.toFixed(3)}`}
                      >
                        {v.toFixed(2)}
                      </button>
                    ))}
                  </React.Fragment>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-muted">
                Mỗi hàng tổng bằng 1 (softmax). Màu càng đậm → chú ý càng
                nhiều. Click bất kỳ hàng nào để đổi token đang xem.
              </p>
            </div>

            {/* Chi tiết tính toán cho token đang chọn */}
            <div className="rounded-xl border border-border bg-background/60 p-3">
              <p className="mb-2 text-xs font-semibold text-foreground">
                Tính toán cho hàng{" "}
                <span style={{ color: T_COLORS[selectedToken] }}>
                  &quot;{(mode === "cross" ? CROSS_TOKENS : TOKENS)[selectedToken]}&quot;
                </span>
              </p>
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-muted">
                    <th className="text-left">token j</th>
                    <th className="text-right">Q·K</th>
                    <th className="text-right">/√d_k</th>
                    <th className="text-right">softmax</th>
                  </tr>
                </thead>
                <tbody>
                  {TOKENS.map((t, j) => (
                    <tr key={j} className="border-t border-border/50">
                      <td className="py-0.5 font-semibold" style={{ color: T_COLORS[j] }}>
                        {t}
                      </td>
                      <td className="py-0.5 text-right font-mono">
                        {(rowScores[j] * Math.sqrt(D_K)).toFixed(2)}
                      </td>
                      <td className="py-0.5 text-right font-mono">
                        {rowScores[j].toFixed(2)}
                      </td>
                      <td className="py-0.5 text-right font-mono font-semibold">
                        {rowWeights[j].toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-[11px] text-muted">
                Cột 2 là tích vô hướng &quot;thô&quot;, cột 3 sau khi chia{" "}
                <LaTeX>{"\\sqrt{d_k}"}</LaTeX>, cột 4 là attention cuối cùng.
              </p>
            </div>
          </div>

          {/* Hàng Output = Σ w·V */}
          <div className="mt-4 rounded-xl border border-border bg-background/60 p-4">
            <p className="mb-2 text-sm font-semibold text-foreground">
              Output cho &quot;
              <span style={{ color: T_COLORS[selectedToken] }}>
                {(mode === "cross" ? CROSS_TOKENS : TOKENS)[selectedToken]}
              </span>
              &quot; = Σ w · V
            </p>
            {barData.map((d, i) => (
              <div key={i} className="mb-1 flex items-center gap-3">
                <span
                  className="w-12 shrink-0 text-right text-sm font-semibold"
                  style={{ color: d.color }}
                >
                  {d.token}
                </span>
                <div className="h-5 flex-1 overflow-hidden rounded-full bg-surface">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: d.color }}
                    initial={false}
                    animate={{ width: `${d.pct}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-xs text-muted">
                  {(d.weight * 100).toFixed(0)}%
                </span>
              </div>
            ))}
            <p className="mt-2 text-[11px] text-muted">
              Vector output (d_k=3):{" "}
              <span className="font-mono text-foreground">
                [{outputVector.map((v) => v.toFixed(3)).join(", ")}]
              </span>
            </p>
          </div>

          {/* Hiển thị 3 ma trận Q, K, V nhỏ cho người học tham chiếu */}
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {renderMatrix(
              mode === "self" ? Q_MAT : Q_CROSS,
              "#3b82f6",
              mode === "self" ? "Q (self)" : "Q (từ decoder)",
              mode === "self" ? TOKENS : CROSS_TOKENS,
            )}
            {renderMatrix(K_MAT, "#f59e0b", "K", TOKENS)}
            {renderMatrix(V_MAT, "#10b981", "V", TOKENS)}
          </div>
        </VisualizationSection>

        <p className="mt-3 text-sm text-muted leading-relaxed">
          Thử tắt <em>Chia √d_k</em>: khi d_k nhỏ (=3) hiệu ứng chưa rõ, nhưng
          bạn vẫn thấy softmax dịch chuyển về một ô duy nhất. Trong thực tế với
          d_k=64, chênh lệch ấy đủ để gradient tắt.
        </p>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════
       *  BƯỚC 4 — AHA MOMENT
       * ═══════════════════════════════════════════════════════ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>Self-attention</strong> = mỗi từ &quot;hỏi&quot; tất cả từ
            khác trong cùng câu: &quot;Bạn quan trọng với tôi bao nhiêu?&quot;
            Tập hợp các câu trả lời (sau softmax) chính là hàng attention của
            nó. Output của từ đó = tổng có trọng số của mọi Value.
          </p>
          <p className="text-sm text-muted mt-1">
            Khác với <TopicLink slug="rnn">RNN</TopicLink> phải truyền thông
            tin tuần tự qua thời gian, self-attention cho mọi từ đường đi O(1)
            đến mọi từ khác — bất kể khoảng cách. &quot;Tôi&quot; ở đầu câu
            vẫn có đường kết nối trực tiếp với &quot;tôi&quot; ở cuối câu. Đây
            là trái tim của <TopicLink slug="transformer">Transformer</TopicLink>,
            và khi được nhân bản song song h lần ta có{" "}
            <TopicLink slug="multi-head-attention">multi-head attention</TopicLink>.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════
       *  BƯỚC 5 — 2 INLINE CHALLENGES
       * ═══════════════════════════════════════════════════════ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <InlineChallenge
          question="Một chuỗi dài 4096 token. Ma trận attention có bao nhiêu ô, và điều đó kéo theo vấn đề gì?"
          options={[
            "4096 ô — mỗi token 1 score",
            "4096² ≈ 16,7 triệu ô — tốn O(n²) bộ nhớ & tính toán, giới hạn độ dài context",
            "4096 × 3 = 12.288 ô — Q, K, V cho mỗi token",
          ]}
          correct={1}
          explanation="Ma trận attention là n×n: 4096² ≈ 16,7 triệu ô, mỗi ô float32 = 4 bytes ≈ 67 MB chỉ cho MỘT head của MỘT layer. GPT-4 có hàng trăm layer × nhiều head → hàng GB chỉ để lưu attention. Đây là lý do Flash Attention, Sparse Attention, Ring Attention ra đời."
        />

        <div className="h-3" />

        <InlineChallenge
          question="Trong decoder của GPT, khi sinh token thứ 5 của chuỗi, attention của token đó có thể nhìn vào token thứ 6 (tương lai) không?"
          options={[
            "Có — self-attention luôn cho nhìn mọi vị trí",
            "Không — masked self-attention đặt các vị trí tương lai bằng -∞ trước softmax",
            "Có nhưng với trọng số nhỏ hơn",
          ]}
          correct={1}
          explanation="Decoder GPT dùng causal mask: mọi ô (i, j) với j > i bị đặt bằng -∞. Sau softmax các ô đó có xác suất 0. Điều này bảo đảm mô hình không 'gian lận' nhìn tương lai khi huấn luyện."
        />
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════
       *  BƯỚC 6 — EXPLANATION SECTION
       * ═══════════════════════════════════════════════════════ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích chi tiết">
        <ExplanationSection topicSlug={metadata.slug}>
          <h3 className="text-base font-semibold text-foreground">Định nghĩa</h3>
          <p>
            <strong>Self-Attention</strong> (Scaled Dot-Product Attention) là
            phép toán cho phép mỗi vị trí trong chuỗi tính ra một vector đầu ra
            là tổng có trọng số của tất cả các vector Value trong cùng chuỗi,
            với trọng số được xác định bởi độ &quot;khớp&quot; giữa Query của
            vị trí đó và Key của các vị trí khác.
          </p>
          <p>
            Chính thức: cho ma trận Q, K, V cùng có n hàng (mỗi hàng là một
            token) và d_k, d_v cột, output là:
          </p>

          <LaTeX block>
            {String.raw`\mathrm{Attention}(Q, K, V) \;=\; \mathrm{softmax}\!\left(\frac{Q K^{\top}}{\sqrt{d_k}}\right) V`}
          </LaTeX>

          <p className="text-sm text-muted mt-2">
            Q, K ∈ <LaTeX>{String.raw`\mathbb{R}^{n \times d_k}`}</LaTeX>, V ∈{" "}
            <LaTeX>{String.raw`\mathbb{R}^{n \times d_v}`}</LaTeX>. Ma trận
            attention <LaTeX>{String.raw`\in \mathbb{R}^{n \times n}`}</LaTeX>,
            mỗi ô (i, j) là &quot;mức chú ý&quot; token i dành cho token j.
          </p>

          <h3 className="text-base font-semibold text-foreground mt-5">
            Công thức gốc của Vaswani et al. (Attention Is All You Need, 2017)
          </h3>
          <LaTeX block>
            {String.raw`Q = X W^{Q},\quad K = X W^{K},\quad V = X W^{V}`}
          </LaTeX>
          <LaTeX block>
            {String.raw`\mathrm{head}_i = \mathrm{Attention}(X W^{Q}_i,\, X W^{K}_i,\, X W^{V}_i)`}
          </LaTeX>
          <LaTeX block>
            {String.raw`\mathrm{MultiHead}(X) = \mathrm{Concat}(\mathrm{head}_1, \dots, \mathrm{head}_h)\, W^{O}`}
          </LaTeX>

          <Callout variant="insight" title="Vì sao chia √d_k?">
            <p>
              Khi <LaTeX>{"d_k"}</LaTeX> lớn, tích vô hướng{" "}
              <LaTeX>{"q \\cdot k"}</LaTeX> có phương sai xấp xỉ d_k (giả định q, k
              được chuẩn hoá với phương sai 1). Giá trị lớn đi qua softmax sẽ
              tạo phân phối gần one-hot → gradient gần 0 cho các vị trí còn
              lại. Chia <LaTeX>{"\\sqrt{d_k}"}</LaTeX> đưa phương sai về 1, giúp softmax
              mềm hơn và gradient chảy tốt hơn khi train.
            </p>
          </Callout>

          <Callout variant="info" title="Self-attention vs Cross-attention">
            <p>
              <strong>Self-attention:</strong> Q, K, V cùng xuất phát từ một
              chuỗi (encoder nhìn câu nguồn, hoặc decoder nhìn câu đích đã
              sinh).{" "}
              <strong>Cross-attention:</strong> Q từ chuỗi A, còn K, V từ chuỗi
              B. Trong Transformer encoder-decoder, decoder dùng
              cross-attention để &quot;đọc&quot; thông tin từ encoder — đây là
              nơi thông tin nguồn được đưa vào câu đích.
            </p>
          </Callout>

          <Callout variant="warning" title="Bẫy O(n²): context dài không miễn phí">
            <p>
              Bộ nhớ và thời gian tính một lớp self-attention là{" "}
              <LaTeX>{"O(n^{2} \\cdot d)"}</LaTeX>. Nhân đôi chiều dài context
              → gấp 4 chi phí. Khi n = 32k thì chỉ riêng ma trận attention đã
              hàng GB. Các kỹ thuật như{" "}
              <TopicLink slug="flash-attention">Flash Attention</TopicLink>,{" "}
              <TopicLink slug="long-context">Long Context</TopicLink> và sliding
              window attention ra đời để đánh đổi khéo giữa chính xác và chi
              phí.
            </p>
          </Callout>

          <Callout variant="tip" title="Song song hoá trên GPU">
            <p>
              Khác với RNN phải chạy tuần tự theo thời gian, self-attention là
              một phép nhân ma trận lớn — ánh xạ gần như hoàn hảo lên GPU.
              Đây là một trong những lý do chính khiến Transformer &quot;ăn&quot;
              dữ liệu nhanh hơn LSTM cùng kích thước.
            </p>
          </Callout>

          <h3 className="text-base font-semibold text-foreground mt-5">
            Code mẫu: tính self-attention bằng NumPy
          </h3>
          <CodeBlock language="python" title="self_attention_numpy.py">
            {`import numpy as np

def softmax(x, axis=-1):
    x = x - x.max(axis=axis, keepdims=True)   # ổn định số học
    e = np.exp(x)
    return e / e.sum(axis=axis, keepdims=True)

def self_attention(X, Wq, Wk, Wv):
    """
    X:   (n_tokens, d_model)   — embedding đầu vào
    Wq:  (d_model, d_k)        — chiếu sang không gian Query
    Wk:  (d_model, d_k)        — chiếu sang không gian Key
    Wv:  (d_model, d_v)        — chiếu sang không gian Value
    """
    Q = X @ Wq                            # (n, d_k)
    K = X @ Wk                            # (n, d_k)
    V = X @ Wv                            # (n, d_v)

    d_k = K.shape[-1]
    scores  = Q @ K.T / np.sqrt(d_k)      # (n, n) — QK^T/√d_k
    weights = softmax(scores, axis=-1)    # (n, n) — softmax theo hàng
    output  = weights @ V                 # (n, d_v) — tổng có trọng số

    return output, weights

# Ví dụ: câu 5 từ, d_model = 8, d_k = d_v = 4
rng = np.random.default_rng(42)
X  = rng.standard_normal((5, 8))
Wq = rng.standard_normal((8, 4)) * 0.1
Wk = rng.standard_normal((8, 4)) * 0.1
Wv = rng.standard_normal((8, 4)) * 0.1

out, attn = self_attention(X, Wq, Wk, Wv)
print(out.shape)   # (5, 4)
print(attn.shape)  # (5, 5) — tổng mỗi hàng ≈ 1
print(attn.sum(axis=-1))  # [1. 1. 1. 1. 1.]`}
          </CodeBlock>

          <h3 className="text-base font-semibold text-foreground mt-5">
            Code mẫu: masked self-attention & cross-attention
          </h3>
          <CodeBlock language="python" title="masked_and_cross.py">
            {`import numpy as np

def scaled_dot_product(Q, K, V, mask=None):
    d_k = K.shape[-1]
    scores = Q @ K.T / np.sqrt(d_k)
    if mask is not None:
        scores = np.where(mask, scores, -1e9)   # đặt các ô bị che = -inf
    weights = softmax(scores, axis=-1)
    return weights @ V, weights

# --- causal mask cho decoder-only (GPT) ---
n = 5
causal = np.tril(np.ones((n, n), dtype=bool))   # True ở tam giác dưới
# scores[i, j] chỉ được phép > -inf khi j <= i

# --- cross-attention ---
# Q từ decoder (m token), K, V từ encoder (n token)
# Lưu ý: hình dạng attention là m × n, không bắt buộc vuông.
def cross_attention(dec_h, enc_out, Wq, Wk, Wv):
    Q = dec_h  @ Wq        # (m, d_k)
    K = enc_out @ Wk       # (n, d_k)
    V = enc_out @ Wv       # (n, d_v)
    out, _ = scaled_dot_product(Q, K, V)
    return out             # (m, d_v)`}
          </CodeBlock>

          <h3 className="text-base font-semibold text-foreground mt-5">
            Ứng dụng tiêu biểu
          </h3>
          <ul className="list-disc list-inside space-y-1.5 text-sm">
            <li>
              <strong>Mô hình ngôn ngữ (LLM).</strong> GPT, Claude, Llama, Gemini
              đều dùng self-attention làm nền — mỗi token dự đoán được ngữ cảnh
              nhờ attention tới mọi token trước đó.
            </li>
            <li>
              <strong>Dịch máy.</strong> Encoder-decoder Transformer dùng
              self-attention để mã hoá câu nguồn và cross-attention để căn chỉnh
              từng từ đích với từ nguồn liên quan.
            </li>
            <li>
              <strong>Thị giác máy tính.</strong>{" "}
              <TopicLink slug="vision-transformer">Vision Transformer (ViT)</TopicLink>{" "}
              chia ảnh thành các patch và dùng self-attention như xử lý token.
            </li>
            <li>
              <strong>Mô hình đa phương thức.</strong>{" "}
              <TopicLink slug="clip">CLIP</TopicLink>, VLM dùng cross-attention
              để &quot;ghép&quot; text và ảnh vào cùng một biểu diễn.
            </li>
            <li>
              <strong>Sinh học & khoa học.</strong> AlphaFold 2 dùng
              attention-over-residues để dự đoán cấu trúc protein, SE(3)-Transformer
              cho hoá học, Graphormer cho đồ thị.
            </li>
          </ul>

          <h3 className="text-base font-semibold text-foreground mt-5">
            Bẫy thường gặp
          </h3>
          <ul className="list-disc list-inside space-y-1.5 text-sm">
            <li>
              <strong>Quên scaling.</strong> Bỏ <LaTeX>{"\\sqrt{d_k}"}</LaTeX>{" "}
              khi d_k lớn → softmax bão hoà, loss kẹt ở plateau.
            </li>
            <li>
              <strong>Thiếu causal mask khi huấn luyện decoder.</strong> Dẫn
              đến &quot;rò rỉ tương lai&quot;: mô hình học được cheat sheet,
              train loss rất thấp nhưng inference sai bét.
            </li>
            <li>
              <strong>Nhầm d_v với d_k.</strong> Nhiều cài đặt đặt
              d_k = d_v để đơn giản, nhưng bản chất hai con số khác nhau; khi
              đổi d_v, kích thước W^O phải cập nhật.
            </li>
            <li>
              <strong>Lẫn mask boolean với -inf.</strong> Trong framework, phải
              thêm lượng lớn âm TRƯỚC softmax, không phải nhân với 0 SAU softmax
              — nếu không các trọng số không còn tổng bằng 1.
            </li>
            <li>
              <strong>Quên <TopicLink slug="positional-encoding">positional encoding</TopicLink>.</strong>{" "}
              Self-attention không biết thứ tự; nếu thiếu vị trí, hoán vị chuỗi
              input cho cùng output.
            </li>
            <li>
              <strong>O(n²) âm thầm.</strong> Context dài gấp 4 → bộ nhớ gấp 16.
              Luôn kiểm tra peak GPU memory, đừng chỉ nhìn param count.
            </li>
          </ul>

          <CollapsibleDetail title="Chi tiết toán học: phương sai của tích vô hướng">
            <p className="text-sm text-foreground/90 leading-relaxed">
              Giả sử các thành phần của q và k là biến ngẫu nhiên độc lập, kỳ
              vọng 0, phương sai 1. Khi đó{" "}
              <LaTeX>{String.raw`q \cdot k = \sum_{i=1}^{d_k} q_i k_i`}</LaTeX>{" "}
              có kỳ vọng 0 và phương sai
            </p>
            <LaTeX block>
              {String.raw`\mathrm{Var}(q \cdot k) = \sum_{i=1}^{d_k} \mathrm{Var}(q_i)\,\mathrm{Var}(k_i) = d_k`}
            </LaTeX>
            <p className="text-sm text-foreground/90 leading-relaxed">
              Vì vậy độ lệch chuẩn <LaTeX>{String.raw`\sqrt{d_k}`}</LaTeX>. Chia tích
              cho <LaTeX>{String.raw`\sqrt{d_k}`}</LaTeX> đưa độ lệch chuẩn về 1 — softmax
              không bị đẩy vào vùng bão hoà. Với d_k = 64, hiệu chỉnh này ảnh
              hưởng lớn đến chất lượng huấn luyện. Nếu bạn thay softmax bằng
              ReLU hoặc kernel khác, hằng số scaling có thể khác — luôn nhìn
              lại phương sai.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Mask: padding, causal, sliding-window — ba kiểu mask thông dụng">
            <p className="text-sm text-foreground/90 leading-relaxed">
              Trong thực tế, một batch chứa các chuỗi có độ dài khác nhau, phải
              được pad tới cùng một độ dài. <strong>Padding mask</strong> đảm
              bảo attention không &quot;chú ý&quot; vào token PAD — nếu không
              gradient sẽ bị nhiễu bởi các vector rác.
            </p>
            <LaTeX block>
              {String.raw`\text{score}_{ij} \;=\; \begin{cases} \dfrac{q_i \cdot k_j}{\sqrt{d_k}} & \text{nếu } j \text{ là token thật} \\ -\infty & \text{nếu } j \text{ là PAD} \end{cases}`}
            </LaTeX>
            <p className="text-sm text-foreground/90 leading-relaxed mt-2">
              <strong>Causal mask</strong> (decoder-only): j &gt; i → -∞. Mô
              hình không được nhìn tương lai. <strong>Sliding-window
              mask</strong> (Longformer, Mistral): chỉ cho phép |i − j| ≤ w —
              giảm từ O(n²) xuống O(n·w). Khi kết hợp sliding-window với một
              vài token &quot;global&quot; (CLS, SEP, hay vài vị trí đặc
              biệt), ta có recipe của nhiều long-context model hiện đại.
            </p>
            <p className="text-sm text-foreground/90 leading-relaxed mt-2">
              Nhớ rằng mask phải áp trước softmax, không sau. Nếu pha -1e9 (thay
              vì -∞ thật), vẫn hoạt động được với float32, nhưng tránh dùng
              float16 vì -1e9 underflow.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Vì sao attention bền vững hơn RNN với phụ thuộc xa?">
            <p className="text-sm text-foreground/90 leading-relaxed">
              Trong RNN, tín hiệu từ token 1 đến token n phải đi qua n bước nhân
              ma trận. Nếu các giá trị riêng (eigenvalue) của ma trận hồi quy
              không đúng 1, gradient co rút (vanishing) hoặc bùng nổ
              (exploding) theo cấp số nhân của n. Đây chính là lý do LSTM/GRU
              phải thêm gating.
            </p>
            <p className="text-sm text-foreground/90 leading-relaxed mt-2">
              Self-attention thì khác: đường đi từ token 1 đến token n luôn là
              <em> 1 bước</em> — một phép nhân QK^T. Vì vậy gradient lan truyền
              thẳng, không bị suy giảm theo khoảng cách. Đổi lại, ta trả bằng
              chi phí O(n²). Tradeoff này là nền tảng của toàn bộ kỷ nguyên
              Transformer.
            </p>
            <p className="text-sm text-foreground/90 leading-relaxed mt-2">
              Phát biểu chặt hơn: path length tối đa giữa hai vị trí trong đồ
              thị tính toán của attention là O(1), trong RNN là O(n), trong CNN
              là O(log n) (với dilated). Đó là vì sao Transformer tổng quát
              hoá tốt với context dài, miễn là bộ nhớ cho phép.
            </p>
          </CollapsibleDetail>

          <h3 className="text-base font-semibold text-foreground mt-5">
            Code mẫu: gradient tự nhiên qua attention
          </h3>
          <CodeBlock language="python" title="backward_attention.py">
            {`"""
Ta không tự viết backward cho attention — autograd lo việc đó. Nhưng
hiểu đường đi của gradient giúp bạn debug:

  ∂L/∂V     = weights.T @ ∂L/∂output
  ∂L/∂W_i,: = softmax_grad(scores_i,:) * (V @ ∂L/∂output_i)
  ∂L/∂Q,∂K  = đi ngược qua QK^T / sqrt(d_k)

Đoạn PyTorch minh hoạ — nếu một trong các tensor không requires_grad,
gradient sẽ chặn tại đó (điều hay xảy ra khi ta freeze embedding).
"""
import torch, torch.nn.functional as F

def attention(Q, K, V, mask=None):
    d_k = Q.size(-1)
    s = Q @ K.transpose(-2, -1) / d_k ** 0.5
    if mask is not None:
        s = s.masked_fill(~mask, float("-inf"))
    w = F.softmax(s, dim=-1)
    return w @ V, w

torch.manual_seed(0)
X = torch.randn(2, 5, 8, requires_grad=True)   # (batch, n, d_model)
Wq = torch.randn(8, 4, requires_grad=True) * 0.1
Wk = torch.randn(8, 4, requires_grad=True) * 0.1
Wv = torch.randn(8, 4, requires_grad=True) * 0.1

out, _ = attention(X @ Wq, X @ Wk, X @ Wv)
loss = out.pow(2).mean()
loss.backward()

print("‖∂L/∂X‖ =", X.grad.norm().item())
print("‖∂L/∂Wq‖ =", Wq.grad.norm().item())
# Thay requires_grad của Wq bằng False → gradient không chảy tới Wq.`}
          </CodeBlock>

          <h3 className="text-base font-semibold text-foreground mt-5">
            Biến thể attention bạn nên biết
          </h3>
          <ul className="list-disc list-inside space-y-1.5 text-sm">
            <li>
              <strong>Additive attention (Bahdanau).</strong> Ra đời trước
              scaled dot-product; tính score qua một MLP nhỏ. Biểu cảm hơn
              nhưng đắt, hiếm dùng trong Transformer hiện đại.
            </li>
            <li>
              <strong>Multi-Query Attention (MQA).</strong> Nhiều head chia sẻ
              cùng một K, V — giảm mạnh chi phí KV cache trong inference LLM.
            </li>
            <li>
              <strong>Grouped-Query Attention (GQA).</strong> Dung hoà giữa
              MHA và MQA: chia head thành G nhóm, mỗi nhóm chia sẻ K, V. Được
              Llama 2/3 dùng làm mặc định.
            </li>
            <li>
              <strong>Linear Attention.</strong> Khai triển softmax qua kernel
              feature-map, đưa độ phức tạp về O(n·d²). Đánh đổi precision, phù
              hợp streaming / real-time.
            </li>
            <li>
              <strong>Sparse / Local Attention.</strong> Chỉ attend vào lân
              cận hoặc một mẫu rời rạc. Longformer, BigBird, Mistral sliding
              window đều dùng ý này.
            </li>
            <li>
              <strong>Mamba / State Space Models.</strong> Không phải
              attention, nhưng cạnh tranh trực tiếp cho ngữ cảnh dài — xem{" "}
              <TopicLink slug="state-space-models">state space models</TopicLink>.
            </li>
          </ul>

          <h3 className="text-base font-semibold text-foreground mt-5">
            Thuật ngữ liên quan
          </h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>
              <TopicLink slug="multi-head-attention">Multi-head attention</TopicLink>{" "}
              — chạy h bản self-attention song song với các tham số khác nhau,
              rồi concat.
            </li>
            <li>
              <TopicLink slug="positional-encoding">Positional encoding</TopicLink>{" "}
              — thêm thông tin vị trí vào embedding vì self-attention không
              biết thứ tự. Gồm sinusoidal (gốc) và RoPE / ALiBi (hiện đại).
            </li>
            <li>
              <TopicLink slug="flash-attention">Flash Attention</TopicLink> —
              kỹ thuật tile-based giúp tính attention không hiện vật ma trận
              n×n đầy đủ, tiết kiệm bộ nhớ và nhanh hơn nhiều trên GPU.
            </li>
            <li>
              <TopicLink slug="kv-cache">KV cache</TopicLink> — lưu K, V của
              các token đã sinh, tránh tính lại khi generate từng token tiếp
              theo trong decoder.
            </li>
            <li>
              <TopicLink slug="attention-mechanism">Attention mechanism</TopicLink>{" "}
              — bài giới thiệu tổng quát cho attention (Bahdanau, Luong) trước
              khi vào self-attention.
            </li>
          </ul>
        </ExplanationSection>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════
       *  BƯỚC 7 — MINI SUMMARY
       * ═══════════════════════════════════════════════════════ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về Self-Attention"
          points={[
            "Mỗi token sinh ra 3 vector: Query (hỏi gì?), Key (chứa gì?), Value (nội dung). Attention = softmax(QKᵀ/√d_k) · V.",
            "Mỗi token nối trực tiếp với mọi token khác — path length = 1, nắm bắt phụ thuộc xa tốt hơn RNN.",
            "Tính được song song trên GPU thông qua một phép nhân ma trận — đây là lý do Transformer train nhanh hơn LSTM.",
            "Nhược điểm O(n²) về bộ nhớ và tính toán — giới hạn context window; Flash Attention, Sparse Attention giải quyết phần nào.",
            "Chia √d_k giữ softmax không bão hoà; masked attention chặn decoder nhìn tương lai; cross-attention đổi nguồn cho Q.",
            "Là trái tim của Transformer (GPT, BERT, Llama, Claude, Gemini, ViT) và bước mở rộng tự nhiên thành multi-head attention.",
          ]}
        />
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════
       *  BƯỚC 8 — QUIZ
       * ═══════════════════════════════════════════════════════ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────
 *  PHỤ LỤC: ghi chú dành cho tác giả giáo trình
 *
 *  1. TOKENS được cố định ở 5 từ tiếng Việt để học viên dễ đọc,
 *     nhưng mọi ma trận Q/K/V đều có thể thay bằng dữ liệu sinh
 *     từ tokenizer thật nếu muốn demo sống.
 *
 *  2. Khi mở rộng sang multi-head attention, chỉ cần nhân bản
 *     khối (Q, K, V, attention) h lần với h bộ trọng số khác
 *     nhau, rồi concat → W^O. Bài này cố tình chưa đi xa tới đó
 *     để giữ một ý duy nhất: cơ chế chú ý của MỘT head.
 *
 *  3. Giá trị trong Q_MAT, K_MAT, V_MAT được chọn để:
 *       - attention của "bàn" dồn về "mèo" & "trên",
 *       - attention của "Con" phân bố tương đối đều,
 *       - cross-attention thay Q_CROSS cho ra phân bố khác rõ
 *         rệt so với self-attention.
 *     Học viên có thể kiểm chứng bằng cách click trực tiếp vào
 *     các ô của heatmap.
 *
 *  4. Component này không phụ thuộc API ngoài, không cần fetch
 *     — toàn bộ tính toán nằm trong useMemo và chạy đủ nhanh với
 *     chuỗi 5 token. Với chuỗi dài hơn, chuyển sang tính toán
 *     bên server hoặc dùng WebGL.
 * ────────────────────────────────────────────────────────────── */

// Re-export helpers để các bài kế tiếp (multi-head, flash-attention) có thể
// mượn nếu cần.
export const __internals = { softmax, dot, computeAttention };
