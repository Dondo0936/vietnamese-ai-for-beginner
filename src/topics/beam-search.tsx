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

/* ============================================================================
 *  METADATA
 * ============================================================================
 */
export const metadata: TopicMeta = {
  slug: "beam-search",
  title: "Beam Search",
  titleVi: "Beam Search — tìm kiếm chùm tia",
  description:
    "Thuật toán giải mã giữ lại k ứng viên tốt nhất ở mỗi bước, cân bằng giữa chất lượng và chi phí tính toán.",
  category: "nlp",
  tags: ["nlp", "decoding", "search", "generation"],
  difficulty: "intermediate",
  relatedSlugs: [
    "gpt",
    "seq2seq",
    "attention-mechanism",
    "temperature",
    "top-k-top-p",
    "transformer",
  ],
  vizType: "interactive",
};

/* ============================================================================
 *  CONSTANTS & HELPERS
 * ============================================================================
 */
const TOTAL_STEPS = 10;

// Prompt: "Tôi yêu ___"  (I love ___)
// Token tree with log-probabilities per branch.
// Each node has: token, logP (log prob given parent path), children.
interface TokenNode {
  token: string;
  logP: number; // log-prob of this token given path so far
  children?: TokenNode[];
}

/**
 * Toy generation tree. Numbers are hand-picked to produce an interesting
 * greedy-vs-beam contrast: greedy goes down "em" + "nhiều" while beam finds
 * a better overall sequence "gia đình" + "vô cùng".
 */
const TOKEN_TREE: TokenNode = {
  token: "Tôi yêu",
  logP: 0,
  children: [
    {
      token: "em",
      logP: Math.log(0.42),
      children: [
        {
          token: "nhiều",
          logP: Math.log(0.38),
          children: [
            { token: "lắm", logP: Math.log(0.55) },
            { token: "không", logP: Math.log(0.22) },
            { token: ".", logP: Math.log(0.18) },
          ],
        },
        {
          token: "rất",
          logP: Math.log(0.28),
          children: [
            { token: "nhiều", logP: Math.log(0.52) },
            { token: "sâu", logP: Math.log(0.25) },
            { token: ".", logP: Math.log(0.15) },
          ],
        },
        {
          token: "hơn",
          logP: Math.log(0.15),
          children: [
            { token: "tất cả", logP: Math.log(0.6) },
            { token: "bạn", logP: Math.log(0.2) },
          ],
        },
      ],
    },
    {
      token: "gia đình",
      logP: Math.log(0.24),
      children: [
        {
          token: "vô cùng",
          logP: Math.log(0.72),
          children: [
            { token: ".", logP: Math.log(0.55) },
            { token: "nhiều", logP: Math.log(0.3) },
            { token: "sâu sắc", logP: Math.log(0.12) },
          ],
        },
        {
          token: "của tôi",
          logP: Math.log(0.22),
          children: [
            { token: ".", logP: Math.log(0.5) },
            { token: "nhiều", logP: Math.log(0.3) },
          ],
        },
      ],
    },
    {
      token: "cà phê",
      logP: Math.log(0.2),
      children: [
        {
          token: "buổi sáng",
          logP: Math.log(0.48),
          children: [
            { token: ".", logP: Math.log(0.6) },
            { token: "lắm", logP: Math.log(0.25) },
          ],
        },
        {
          token: "đen",
          logP: Math.log(0.3),
          children: [
            { token: ".", logP: Math.log(0.55) },
            { token: "không đường", logP: Math.log(0.3) },
          ],
        },
      ],
    },
    {
      token: "Việt Nam",
      logP: Math.log(0.08),
      children: [
        {
          token: "của tôi",
          logP: Math.log(0.55),
          children: [
            { token: ".", logP: Math.log(0.7) },
            { token: "rất nhiều", logP: Math.log(0.2) },
          ],
        },
      ],
    },
    {
      token: "mèo",
      logP: Math.log(0.06),
      children: [
        {
          token: "con",
          logP: Math.log(0.45),
          children: [
            { token: ".", logP: Math.log(0.5) },
            { token: "nhỏ", logP: Math.log(0.35) },
          ],
        },
      ],
    },
  ],
};

interface Beam {
  path: string[];
  score: number; // cumulative log-prob
  alive: boolean;
}

/** Expand a list of beams by one level, returning the next-level candidates. */
function expandBeams(
  tree: TokenNode,
  beams: Beam[],
  depth: number,
): Beam[] {
  const out: Beam[] = [];
  for (const beam of beams) {
    // Walk the tree along beam.path to find node
    let node: TokenNode | undefined = tree;
    for (let d = 0; d < beam.path.length - 1 && node; d++) {
      node = node.children?.find((c) => c.token === beam.path[d + 1]);
    }
    if (!node?.children || beam.path.length - 1 >= depth) {
      out.push(beam);
      continue;
    }
    for (const child of node.children) {
      out.push({
        path: [...beam.path, child.token],
        score: beam.score + child.logP,
        alive: true,
      });
    }
  }
  return out;
}

/** Apply length penalty: divide score by |Y|^alpha. */
function lengthPenalty(score: number, length: number, alpha: number): number {
  if (alpha === 0) return score;
  return score / Math.pow(length, alpha);
}

/** Format score as probability for display. */
function scoreToProb(score: number): number {
  return Math.exp(score);
}

/* ============================================================================
 *  QUIZ QUESTIONS
 * ============================================================================
 */
const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "Beam width = 1 tương đương thuật toán nào?",
    options: [
      "Exhaustive search — duyệt toàn bộ cây",
      "Greedy search — luôn chọn token có xác suất cao nhất ở mỗi bước",
      "Random sampling",
      "Temperature sampling",
    ],
    correct: 1,
    explanation:
      "Beam width = 1 nghĩa là chỉ giữ 1 ứng viên tại mỗi bước → luôn chọn token có xác suất cao nhất → chính là greedy search. Đơn giản, nhanh, nhưng dễ mắc kẹt ở local optimum.",
  },
  {
    question: "Tại sao beam search cần 'length penalty'?",
    options: [
      "Để ép câu ngắn hơn",
      "Vì câu ngắn có tích xác suất cao hơn (ít phép nhân, mỗi < 1), nên beam search thiên vị câu ngắn. Length penalty chia cho |Y|^α để công bằng.",
      "Để tăng tốc độ giải mã",
      "Để giảm bộ nhớ GPU",
    ],
    correct: 1,
    explanation:
      "P(câu) = Π P(token). Càng nhiều token (mỗi < 1) → tích càng nhỏ → điểm càng thấp. Không có length penalty, beam search luôn chọn câu ngắn. score/|Y|^α với α ≈ 0.6–1.0 cân bằng lại.",
  },
  {
    question: "ChatGPT dùng beam search hay sampling cho phản hồi hội thoại? Tại sao?",
    options: [
      "Beam search — vì chất lượng cao nhất",
      "Sampling (top-p / temperature) — vì cần sự đa dạng, sáng tạo trong hội thoại",
      "Greedy search — vì đơn giản nhất",
      "Không dùng thuật toán giải mã cụ thể",
    ],
    correct: 1,
    explanation:
      "Chatbot cần đa dạng: cùng câu hỏi, mỗi lần trả lời khác. Beam search deterministic → luôn cùng output → nhàm chán. Sampling với temperature + top-p tạo sự bất ngờ, tự nhiên hơn.",
  },
  {
    type: "fill-blank",
    question:
      "Trong beam search, tham số {blank} quyết định số lượng chuỗi ứng viên giữ lại ở mỗi bước. Nếu giá trị này bằng {blank}, thuật toán trở thành greedy search.",
    blanks: [
      { answer: "beam width", accept: ["beam_width", "k", "beam", "num_beams"] },
      { answer: "1", accept: ["một", "one"] },
    ],
    explanation:
      "beam width (k, hay num_beams trong HuggingFace) = số ứng viên giữ song song. k = 1 đồng nghĩa greedy search (luôn chọn token xác suất cao nhất). k càng lớn, càng khám phá nhiều nhánh nhưng càng tốn tính toán.",
  },
  {
    question:
      "Beam search ở bước t có k beam. Mỗi beam có V ứng viên token tiếp theo. Số ứng viên cần xét cho bước t+1 là bao nhiêu trước khi prune?",
    options: [
      "k",
      "V",
      "k × V",
      "k + V",
    ],
    correct: 2,
    explanation:
      "Mỗi trong k beam mở rộng thành V con → tổng k × V ứng viên → sắp xếp theo score → giữ top k cho bước tiếp theo. Đó là lý do beam search chậm hơn greedy k lần.",
  },
  {
    question:
      "Sampling với temperature T rất lớn (ví dụ T = 10) sẽ dẫn đến điều gì?",
    options: [
      "Output hoàn toàn deterministic",
      "Phân phối xác suất gần như đều → token được chọn gần như ngẫu nhiên → output hỗn loạn, vô nghĩa",
      "Luôn chọn token đầu vocab",
      "Giống beam search với width lớn",
    ],
    correct: 1,
    explanation:
      "Temperature chia logits trước softmax. T lớn → logits bị nén → softmax gần uniform → sampling gần như random. T nhỏ → logits nhọn → gần greedy. T = 1 là không đổi.",
  },
  {
    question:
      "Khi nào nên ưu tiên beam search hơn sampling?",
    options: [
      "Khi làm chatbot hội thoại cần đa dạng",
      "Khi cần output deterministic, ổn định, gần optimum — ví dụ dịch máy, tóm tắt, code completion",
      "Khi muốn model sáng tạo",
      "Khi batch size rất nhỏ",
    ],
    correct: 1,
    explanation:
      "Dịch máy, tóm tắt, captioning → có 'đáp án đúng' → beam search cho kết quả gần optimum và ổn định. Chatbot / kể chuyện → cần đa dạng → sampling.",
  },
  {
    question:
      "'Diverse beam search' giải quyết vấn đề gì?",
    options: [
      "Tăng tốc độ beam search",
      "Các beam thường rất giống nhau (khác 1-2 từ) → thiếu đa dạng. Diverse BS thêm hình phạt cho các beam giống nhau → kết quả khác biệt rõ hơn",
      "Giảm bộ nhớ GPU",
      "Thay thế length penalty",
    ],
    correct: 1,
    explanation:
      "Beam search chuẩn cho k ứng viên nhưng chúng thường 'gần như' cùng câu. Diverse BS (Vijayakumar et al.) thêm penalty giữa các nhóm beam → kết quả đa dạng hơn, hữu ích khi cần đề xuất nhiều caption / dịch khác nhau.",
  },
];

/* ============================================================================
 *  VISUALIZATION SUB-COMPONENT: BEAM TREE
 * ============================================================================
 */
interface BeamTreeVizProps {
  beamWidth: number;
  step: number; // 1..3
  alpha: number; // length penalty
}

function BeamTreeViz({ beamWidth, step, alpha }: BeamTreeVizProps) {
  // Start beams from root's first-level children
  const initialBeams: Beam[] = useMemo(
    () =>
      (TOKEN_TREE.children ?? []).map((c) => ({
        path: [TOKEN_TREE.token, c.token],
        score: c.logP,
        alive: true,
      })),
    [],
  );

  // Prune to top-k first level
  const pruned1 = useMemo(() => {
    const sorted = [...initialBeams].sort((a, b) => b.score - a.score);
    return sorted.map((b, i) => ({ ...b, alive: i < beamWidth }));
  }, [initialBeams, beamWidth]);

  // Expand kept beams for step 2
  const level2 = useMemo(() => {
    const alive = pruned1.filter((b) => b.alive);
    return expandBeams(TOKEN_TREE, alive, 2);
  }, [pruned1]);

  const pruned2 = useMemo(() => {
    const sorted = [...level2].sort((a, b) => b.score - a.score);
    return sorted.map((b, i) => ({ ...b, alive: i < beamWidth }));
  }, [level2, beamWidth]);

  // Expand for step 3
  const level3 = useMemo(() => {
    const alive = pruned2.filter((b) => b.alive);
    return expandBeams(TOKEN_TREE, alive, 3);
  }, [pruned2]);

  const pruned3 = useMemo(() => {
    const sorted = [...level3].sort((a, b) => b.score - a.score);
    return sorted.map((b, i) => ({ ...b, alive: i < beamWidth }));
  }, [level3, beamWidth]);

  const currentBeams =
    step === 1 ? pruned1 : step === 2 ? pruned2 : pruned3;

  return (
    <div className="space-y-2">
      {currentBeams.slice(0, 10).map((beam, i) => {
        const prob = scoreToProb(beam.score);
        const finalScore = lengthPenalty(
          beam.score,
          beam.path.length - 1,
          alpha,
        );
        const isKept = beam.alive;
        return (
          <motion.div
            key={beam.path.join("-") + "-" + i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: isKept ? 1 : 0.35, x: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04 }}
            className={`flex items-center gap-3 rounded-lg border p-2.5 transition-all ${
              isKept
                ? "border-accent bg-accent/5"
                : "border-border bg-card"
            }`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                isKept
                  ? "bg-accent text-white"
                  : "bg-surface text-muted"
              }`}
            >
              {i + 1}
            </span>
            <div className="flex flex-wrap gap-1 flex-1">
              {beam.path.map((tok, ti) => (
                <span
                  key={ti}
                  className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                    ti === 0
                      ? "bg-surface text-muted"
                      : isKept
                        ? "bg-accent/20 text-accent"
                        : "bg-surface text-muted"
                  }`}
                >
                  {tok}
                </span>
              ))}
            </div>
            <div className="flex flex-col items-end gap-0.5 text-right">
              <span
                className={`text-[11px] font-bold tabular-nums ${
                  isKept ? "text-accent" : "text-muted"
                }`}
              >
                p = {(prob * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-muted tabular-nums">
                score/|Y|^α = {finalScore.toFixed(2)}
              </span>
            </div>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded ${
                isKept
                  ? "bg-green-500/20 text-green-600 dark:text-green-400"
                  : "bg-red-500/20 text-red-600 dark:text-red-400"
              }`}
            >
              {isKept ? "Giữ" : "Loại"}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ============================================================================
 *  VISUALIZATION SUB-COMPONENT: GREEDY vs BEAM vs SAMPLING
 * ============================================================================
 */
function DecodingStrategyCards({
  beamWidth,
}: {
  beamWidth: number;
}) {
  const strategies = [
    {
      name: "Greedy (k = 1)",
      example: "Tôi yêu em nhiều lắm.",
      prob: 0.42 * 0.38 * 0.55,
      pros: "Cực nhanh, deterministic, chi phí thấp.",
      cons: "Hay bỏ lỡ câu tốt hơn do tham ăn từng bước.",
      use: "Draft nhanh, khi chất lượng không quá quan trọng.",
      color: "#ef4444",
    },
    {
      name: `Beam (k = ${beamWidth})`,
      example:
        beamWidth >= 2
          ? "Tôi yêu gia đình vô cùng."
          : "Tôi yêu em nhiều lắm.",
      prob: beamWidth >= 2 ? 0.24 * 0.72 * 0.55 : 0.42 * 0.38 * 0.55,
      pros: "Chất lượng cao, ổn định. Tìm được sequence tốt hơn greedy.",
      cons: "Chậm hơn k lần. Luôn cùng output (thiếu đa dạng).",
      use: "Dịch máy, tóm tắt, captioning, code completion.",
      color: "#3b82f6",
    },
    {
      name: "Sampling (top-p = 0.9, T = 0.8)",
      example: "Tôi yêu cà phê buổi sáng.",
      prob: 0.2 * 0.48 * 0.6,
      pros: "Đa dạng, sáng tạo, mỗi lần một khác.",
      cons: "Kém ổn định, đôi khi sai ngữ nghĩa.",
      use: "ChatGPT, kể chuyện, brainstorm.",
      color: "#22c55e",
    },
  ];
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {strategies.map((s) => (
        <div
          key={s.name}
          className="rounded-xl border p-3 space-y-2"
          style={{ borderColor: s.color + "40" }}
        >
          <p className="font-semibold text-sm" style={{ color: s.color }}>
            {s.name}
          </p>
          <p className="text-[11px] text-foreground italic">
            “{s.example}”
          </p>
          <p className="text-[11px] text-muted tabular-nums">
            p ≈ {(s.prob * 100).toFixed(2)}%
          </p>
          <div className="text-[11px] space-y-0.5">
            <p className="text-foreground">
              <strong>Ưu:</strong> {s.pros}
            </p>
            <p className="text-foreground">
              <strong>Nhược:</strong> {s.cons}
            </p>
            <p className="text-muted">
              <strong>Dùng cho:</strong> {s.use}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================================
 *  VISUALIZATION SUB-COMPONENT: LENGTH PENALTY CURVE
 * ============================================================================
 */
function LengthPenaltyChart({
  alpha,
  width = 440,
  height = 160,
}: {
  alpha: number;
  width?: number;
  height?: number;
}) {
  // Compare two sequences of different length at the same per-token avg log-prob
  const points = useMemo(() => {
    const out: { len: number; rawScore: number; penalized: number }[] = [];
    const perToken = Math.log(0.5); // each token 0.5
    for (let L = 1; L <= 20; L++) {
      const raw = perToken * L;
      const pen = lengthPenalty(raw, L, alpha);
      out.push({ len: L, rawScore: raw, penalized: pen });
    }
    return out;
  }, [alpha]);

  const minV = Math.min(
    ...points.map((p) => Math.min(p.rawScore, p.penalized)),
  );
  const maxV = 0;
  const xStep = (width - 40) / 19;

  const mkPath = (key: "rawScore" | "penalized") =>
    points
      .map((p, i) => {
        const x = 24 + i * xStep;
        const y =
          height -
          24 -
          ((p[key] - minV) / (maxV - minV + 1e-9)) * (height - 40);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  return (
    <svg width={width} height={height} role="img" aria-label="length penalty">
      {/* axes */}
      <line
        x1={24}
        x2={width - 8}
        y1={height - 24}
        y2={height - 24}
        stroke="currentColor"
        className="text-border"
      />
      {/* raw */}
      <motion.path
        d={mkPath("rawScore")}
        fill="none"
        stroke="#ef4444"
        strokeWidth={2}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6 }}
      />
      {/* penalized */}
      <motion.path
        d={mkPath("penalized")}
        fill="none"
        stroke="currentColor"
        className="text-accent"
        strokeWidth={2.4}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.15 }}
      />
      <text
        x={width - 10}
        y={18}
        fontSize={11}
        textAnchor="end"
        className="fill-accent font-semibold"
      >
        score / |Y|^{alpha.toFixed(1)}
      </text>
      <text
        x={width - 10}
        y={32}
        fontSize={11}
        textAnchor="end"
        fill="#ef4444"
        className="font-semibold"
      >
        raw score (log P)
      </text>
      <text x={24} y={height - 8} fontSize={10} className="fill-muted">
        |Y| = 1
      </text>
      <text
        x={width - 8}
        y={height - 8}
        fontSize={10}
        textAnchor="end"
        className="fill-muted"
      >
        |Y| = 20
      </text>
    </svg>
  );
}

/* ============================================================================
 *  MAIN COMPONENT
 * ============================================================================
 */
export default function BeamSearchTopic() {
  /* --------------------------- STATE --------------------------- */
  const [beamWidth, setBeamWidth] = useState(3);
  const [stepIdx, setStepIdx] = useState<1 | 2 | 3>(1);
  const [alpha, setAlpha] = useState(0.7);
  const [autoPlay, setAutoPlay] = useState(false);

  /* --------------------------- CALLBACKS --------------------------- */
  const resetDemo = useCallback(() => {
    setBeamWidth(3);
    setStepIdx(1);
    setAlpha(0.7);
  }, []);

  const nextStep = useCallback(() => {
    setStepIdx((s) => ((s % 3) + 1) as 1 | 2 | 3);
  }, []);

  /* --------------------------- RENDER --------------------------- */
  return (
    <>
      {/* ============================================================
       *  STEP 1 — PREDICTION GATE
       * ============================================================ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Thử thách">
        <div className="mb-3">
          <ProgressSteps
            current={1}
            total={TOTAL_STEPS}
            labels={[
              "Thử thách",
              "Cây beam",
              "So sánh",
              "Length penalty",
              "A-ha",
              "Thử thách nhanh",
              "Lý thuyết & code",
              "Chi tiết",
              "Tóm tắt",
              "Kiểm tra",
            ]}
          />
        </div>
        <PredictionGate
          question='GPT sinh câu từ prompt "Tôi yêu ___". Bước 1 có 5 ứng viên: "em" (42%), "gia đình" (24%), "cà phê" (20%), "Việt Nam" (8%), "mèo" (6%). Nếu chỉ giữ 1 từ tốt nhất thì sao?'
          options={[
            'Greedy: chỉ giữ "em" — nhanh, nhưng có thể bỏ lỡ "Tôi yêu gia đình vô cùng"',
            "Giữ cả 5 — chắc chắn tìm được câu tốt nhất",
            'Giữ 3 ứng viên tốt nhất: "em", "gia đình", "cà phê" — cân bằng giữa chất lượng và chi phí',
          ]}
          correct={2}
          explanation='Giữ 3 ứng viên (beam width = 3): "em", "gia đình", "cà phê". Cả ba tiếp tục mở rộng song song. Có thể "Tôi yêu gia đình vô cùng." hay hơn "Tôi yêu em nhiều lắm." vì từ "vô cùng" có xác suất điều kiện 72%. Beam Search không đặt hết trứng vào một giỏ.'
        >
          <p className="mt-4 text-sm text-muted leading-relaxed">
            Với một model ngôn ngữ, mỗi bước sinh ra một phân phối trên toàn bộ
            từ vựng. Bạn có ba cách chính để{" "}
            <TopicLink slug="gpt">giải mã</TopicLink>
            : <em>greedy</em>, <em>beam search</em>, và{" "}
            <TopicLink slug="top-k-top-p">sampling</TopicLink>. Mỗi cách tối ưu
            cho một mục tiêu khác nhau. Bạn sẽ tự tay chạy beam search trong
            phần tiếp theo.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ============================================================
       *  STEP 2 — INTERACTIVE VIZ: BEAM TREE
       * ============================================================ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Cây beam">
        <p className="mb-3 text-sm text-foreground leading-relaxed">
          Kéo <strong>beam width</strong> và nhấn qua từng bước để xem thuật
          toán mở rộng rồi prune cây sinh token. Dòng sáng = được giữ, dòng mờ
          = bị loại. Thử cùng một câu với <em>length penalty α</em> khác nhau
          để thấy câu dài/ngắn được ưu tiên ra sao.
        </p>

        <VisualizationSection topicSlug="beam-search">
          <div className="space-y-5">
            {/* Controls */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs text-muted">
                  Beam width (k):{" "}
                  <strong className="text-accent">{beamWidth}</strong>
                </label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={beamWidth}
                  onChange={(e) =>
                    setBeamWidth(parseInt(e.target.value, 10))
                  }
                  className="w-full accent-accent"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted">
                  Length penalty (α):{" "}
                  <strong className="text-accent">{alpha.toFixed(2)}</strong>
                </label>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.05}
                  value={alpha}
                  onChange={(e) => setAlpha(parseFloat(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted">
                  Bước:{" "}
                  <strong className="text-accent">{stepIdx}</strong> / 3
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setStepIdx(i as 1 | 2 | 3)}
                      className={`flex-1 rounded-md py-1 text-[11px] font-semibold transition-colors ${
                        stepIdx === i
                          ? "bg-accent text-white"
                          : "bg-card border border-border text-muted"
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action bar */}
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={nextStep}
                className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white"
              >
                Bước tiếp →
              </button>
              <button
                type="button"
                onClick={resetDemo}
                className="rounded-lg bg-card border border-border px-3 py-1.5 text-xs text-muted hover:text-foreground"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setAutoPlay((p) => !p)}
                className="rounded-lg bg-card border border-border px-3 py-1.5 text-xs text-muted hover:text-foreground"
              >
                {autoPlay ? "⏸ Dừng" : "▶ Phát"}
              </button>
            </div>

            {/* Prompt */}
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className="text-xs text-muted mb-1">Prompt</p>
              <p className="text-sm font-mono text-foreground">
                “Tôi yêu ___”
              </p>
            </div>

            {/* Beam tree viz */}
            <BeamTreeViz
              beamWidth={beamWidth}
              step={stepIdx}
              alpha={alpha}
            />

            {/* Step commentary */}
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center text-xs text-muted">
              {stepIdx === 1 && (
                <>
                  Bước 1: có{" "}
                  <strong className="text-foreground">5 ứng viên</strong> token
                  đầu tiên. Sắp xếp theo score (log P) và giữ top{" "}
                  <strong className="text-foreground">{beamWidth}</strong>.
                </>
              )}
              {stepIdx === 2 && (
                <>
                  Bước 2: mỗi beam được mở rộng sang các token con → có{" "}
                  <strong className="text-foreground">{beamWidth} × V</strong>{" "}
                  ứng viên (V = vocab con ở đây). Sắp xếp lại và giữ top{" "}
                  <strong className="text-foreground">{beamWidth}</strong>.
                </>
              )}
              {stepIdx === 3 && (
                <>
                  Bước 3: tiếp tục mở rộng các beam còn sống. Câu kết thúc khi
                  gặp token <code>.</code> hoặc <code>&lt;eos&gt;</code>. Câu
                  tốt nhất sau 3 bước có thể{" "}
                  <strong className="text-foreground">khác</strong> với câu mà
                  greedy chọn!
                </>
              )}
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ============================================================
       *  STEP 3 — COMPARISON: GREEDY vs BEAM vs SAMPLING
       * ============================================================ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="So sánh ba chiến lược">
        <p className="mb-3 text-sm text-foreground leading-relaxed">
          Cùng một prompt, ba chiến lược giải mã cho ra câu khác nhau. Xem bảng
          dưới — lưu ý rằng beam search đôi khi tìm được xác suất tổng cao hơn
          greedy, và sampling cho ra câu khác hoàn toàn.
        </p>
        <DecodingStrategyCards beamWidth={beamWidth} />
      </LessonSection>

      {/* ============================================================
       *  STEP 4 — LENGTH PENALTY VISUALIZATION
       * ============================================================ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Length penalty">
        <p className="mb-3 text-sm text-foreground leading-relaxed">
          Kéo α từ 0 đến 2 để xem tác động. Đường đỏ là raw log-prob (giảm
          tuyến tính theo độ dài → luôn thiên vị câu ngắn). Đường accent là
          score sau chia cho |Y|^α.
        </p>

        <VisualizationSection topicSlug="beam-search">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-muted">
                α (length penalty):{" "}
                <strong className="text-accent">{alpha.toFixed(2)}</strong>
              </label>
              <input
                type="range"
                min={0}
                max={2}
                step={0.05}
                value={alpha}
                onChange={(e) => setAlpha(parseFloat(e.target.value))}
                className="w-full accent-accent"
              />
            </div>
            <div className="flex justify-center">
              <LengthPenaltyChart alpha={alpha} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Callout variant="warning" title="α = 0">
                Không penalty. Raw log-prob. Câu ngắn (1 token) luôn thắng vì
                càng ít phép nhân, tích càng cao.
              </Callout>
              <Callout variant="tip" title="α ≈ 0.6–0.8">
                Sweet spot cho dịch máy (Google NMT paper). Công bằng giữa câu
                dài và ngắn.
              </Callout>
              <Callout variant="info" title="α = 1.5 – 2">
                Ép câu dài hơn. Dùng khi muốn output không bị cắt quá sớm.
                Quá cao → câu dài vô nghĩa.
              </Callout>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ============================================================
       *  STEP 5 — AHA MOMENT
       * ============================================================ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          <p>
            <strong>Beam Search</strong> giữ k con đường tốt nhất{" "}
            <em>song song</em>, không “đặt cược” vào 1 lựa chọn duy nhất. Giống
            đội thám hiểm chia nhóm — nhóm nào tìm được đường tốt nhất thì
            thắng. Điều kỳ diệu: một ứng viên token có xác suất thấp ở bước 1
            (ví dụ “gia đình” chỉ 24%) vẫn có thể dẫn đến câu tốt nhất, nếu
            các token tiếp theo của nó có xác suất điều kiện cao.
          </p>
          <p className="text-sm text-muted mt-1">
            k = 1 → Greedy (nhanh, kém). k → ∞ → exhaustive (chậm, tối ưu).
            k = 4–10 thường là sweet spot cho dịch máy, k = 1 + sampling là
            chuẩn cho chatbot.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ============================================================
       *  STEP 6 — INLINE CHALLENGES
       * ============================================================ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <div className="space-y-4">
          <InlineChallenge
            question="Beam search luôn cho kết quả GIỐNG NHAU cùng input. ChatGPT thì mỗi lần trả lời khác. ChatGPT dùng gì?"
            options={[
              "Beam search với beam rất lớn",
              "Sampling (top-p / nucleus) — chọn ngẫu nhiên từ phân phối xác suất → đa dạng",
              "Greedy search + random seed",
            ]}
            correct={1}
            explanation="Beam search deterministic → luôn cùng output. ChatGPT dùng nucleus sampling (top-p): chọn ngẫu nhiên từ top-p% xác suất tích lũy, kết hợp temperature → đa dạng, tự nhiên. Mỗi lần chạy → một phản hồi khác."
          />
          <InlineChallenge
            question="Bạn chạy beam search với k = 5 cho một câu dài 20 token. Vocab cỡ 50K. Mỗi bước cần xét bao nhiêu ứng viên trước khi prune?"
            options={[
              "5",
              "50,000",
              "5 × 50,000 = 250,000",
              "50,000 × 20 = 1,000,000",
            ]}
            correct={2}
            explanation="Mỗi trong k = 5 beam mở rộng sang V = 50,000 token → 250,000 ứng viên tạm thời → sắp xếp theo score → giữ top 5. Đây là lý do beam search chậm hơn greedy k lần và cần tối ưu (ví dụ top-k trên GPU)."
          />
        </div>
      </LessonSection>

      {/* ============================================================
       *  STEP 7 — EXPLANATION: THEORY & CODE
       * ============================================================ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Lý thuyết & code">
        <ExplanationSection topicSlug="beam-search">
          <p>
            <strong>Beam Search</strong> giữ k chuỗi ứng viên (beams) tốt nhất
            ở mỗi bước, mở rộng song song cho đến khi tất cả kết thúc (gặp{" "}
            <code>&lt;eos&gt;</code>) hoặc đạt độ dài tối đa. Đây là một chiến
            lược giải mã <em>deterministic</em>, trái ngược với các phương
            pháp <em>stochastic</em> như{" "}
            <TopicLink slug="top-k-top-p">top-k / top-p sampling</TopicLink>{" "}
            hay chỉnh{" "}
            <TopicLink slug="temperature">temperature</TopicLink>. Cùng input,
            beam search luôn cho cùng output.
          </p>

          <Callout variant="insight" title="Score cho mỗi chuỗi (có length penalty)">
            <div className="space-y-2">
              <LaTeX block>{`\\text{score}(Y) = \\frac{1}{|Y|^{\\alpha}} \\sum_{t=1}^{|Y|} \\log P(y_t \\mid y_{<t}, X)`}</LaTeX>
              <p className="text-sm">
                Với <LaTeX>{`\\alpha`}</LaTeX> = length penalty (0.6–1.0 phổ
                biến). <LaTeX>{`\\alpha = 0`}</LaTeX> → không penalty, thiên
                vị câu ngắn. <LaTeX>{`\\alpha = 1`}</LaTeX> → trung bình log-prob
                mỗi token.
              </p>
            </div>
          </Callout>

          <Callout variant="info" title="Nucleus Sampling (Top-p) — người anh em stochastic">
            <p>Thay vì chọn top-k, top-p chọn tập nhỏ nhất đạt xác suất tích lũy ≥ p:</p>
            <LaTeX block>{`V_p = \\min \\Big\\{ V' \\subseteq V : \\sum_{w \\in V'} p(w) \\geq p \\Big\\}`}</LaTeX>
            <LaTeX block>{`p'(w) = \\frac{p(w) \\cdot \\mathbb{1}[w \\in V_p]}{\\sum_{w' \\in V_p} p(w')}`}</LaTeX>
            <p className="mt-2 text-sm">
              Top-p = 0.9 → chỉ chọn từ top 90% xác suất tích lũy. Kết hợp với
              temperature T để điều chỉnh “độ sáng tạo”.
            </p>
          </Callout>

          <Callout variant="warning" title="Khi nào beam search sai lầm?">
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>
                <strong>Mode collapse</strong>: k beam thường rất giống nhau
                (khác 1-2 từ). Giải pháp: diverse beam search.
              </li>
              <li>
                <strong>Hallucination cho câu dài</strong>: khi k lớn, beam có
                thể chọn câu “chắc chắn” nhưng sai thực tế.
              </li>
              <li>
                <strong>Không phù hợp cho hội thoại</strong>: luôn cùng output
                → nhàm chán. Dùng sampling.
              </li>
              <li>
                <strong>Chi phí O(k × V)</strong> mỗi bước — với vocab lớn và
                k lớn là tốn bộ nhớ.
              </li>
            </ul>
          </Callout>

          <Callout variant="tip" title="Kết hợp thông minh">
            Nhiều hệ thống hiện đại kết hợp cả hai: beam search với
            <em> contrastive search</em> (DeepMind, 2022) hoặc beam + temperature
            để tận dụng chất lượng của beam mà không mất đa dạng hoàn toàn.
          </Callout>

          <CodeBlock language="python" title="huggingface_generate_beam.py">
{`from transformers import AutoModelForCausalLM, AutoTokenizer

model = AutoModelForCausalLM.from_pretrained("gpt2-medium")
tokenizer = AutoTokenizer.from_pretrained("gpt2-medium")

prompt = "Tôi yêu "
inputs = tokenizer(prompt, return_tensors="pt")

# 1. Greedy (num_beams = 1, không sample)
greedy = model.generate(
    **inputs,
    max_new_tokens=20,
    num_beams=1,
    do_sample=False,
)
print("Greedy:", tokenizer.decode(greedy[0], skip_special_tokens=True))

# 2. Beam search (num_beams = 5)
beam = model.generate(
    **inputs,
    max_new_tokens=20,
    num_beams=5,
    do_sample=False,
    length_penalty=0.8,          # 0.6–1.0 là phổ biến
    early_stopping=True,          # dừng khi đủ k beam đạt <eos>
    no_repeat_ngram_size=3,       # chặn lặp 3-gram (tránh mode collapse)
    num_return_sequences=3,       # trả về 3 beam tốt nhất
)
for i, seq in enumerate(beam):
    print(f"Beam {i}:", tokenizer.decode(seq, skip_special_tokens=True))

# 3. Nucleus sampling (top_p = 0.9)
sample = model.generate(
    **inputs,
    max_new_tokens=20,
    do_sample=True,
    top_p=0.9,
    top_k=50,
    temperature=0.8,
    num_return_sequences=3,
)
for i, seq in enumerate(sample):
    print(f"Sample {i}:", tokenizer.decode(seq, skip_special_tokens=True))

# 4. Diverse beam search
diverse = model.generate(
    **inputs,
    max_new_tokens=20,
    num_beams=6,
    num_beam_groups=3,            # chia k thành 3 nhóm
    diversity_penalty=1.0,         # hình phạt giữa các nhóm
    num_return_sequences=3,
    do_sample=False,
)
for i, seq in enumerate(diverse):
    print(f"Diverse {i}:", tokenizer.decode(seq, skip_special_tokens=True))`}
          </CodeBlock>

          <CodeBlock language="python" title="beam_search_from_scratch.py">
{`import torch
import torch.nn.functional as F
from typing import List, Tuple

def beam_search_decode(
    model,
    input_ids: torch.Tensor,
    beam_width: int = 5,
    max_length: int = 30,
    length_penalty: float = 0.7,
    eos_token_id: int = 2,
) -> List[Tuple[torch.Tensor, float]]:
    """
    Beam search giải mã tự viết tay.
    Trả về danh sách (sequence, score) đã sắp xếp.
    """
    device = input_ids.device

    # Mỗi beam: (sequence, cumulative_log_prob, is_done)
    beams: List[Tuple[torch.Tensor, float, bool]] = [
        (input_ids, 0.0, False)
    ]

    for step in range(max_length):
        candidates: List[Tuple[torch.Tensor, float, bool]] = []

        for seq, score, done in beams:
            # Beam đã gặp <eos> thì không mở rộng nữa.
            if done:
                candidates.append((seq, score, True))
                continue

            # Forward pass
            with torch.no_grad():
                logits = model(seq).logits[:, -1, :]  # (1, V)
                log_probs = F.log_softmax(logits, dim=-1).squeeze(0)

            # Lấy top-k token
            top_log_probs, top_indices = log_probs.topk(beam_width)

            for lp, idx in zip(top_log_probs.tolist(), top_indices.tolist()):
                new_seq = torch.cat(
                    [seq, torch.tensor([[idx]], device=device)],
                    dim=1,
                )
                new_score = score + lp
                new_done = (idx == eos_token_id)
                candidates.append((new_seq, new_score, new_done))

        # Prune: lấy top beam_width theo score sau length penalty
        def _rank(item):
            seq, sc, _ = item
            L = seq.size(1)
            return sc / (L ** length_penalty)

        candidates.sort(key=_rank, reverse=True)
        beams = candidates[:beam_width]

        # Nếu tất cả beam đã done thì dừng
        if all(done for _, _, done in beams):
            break

    # Trả về (seq, score đã chia length penalty)
    return [
        (seq, sc / (seq.size(1) ** length_penalty))
        for seq, sc, _ in beams
    ]`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      {/* ============================================================
       *  STEP 8 — COLLAPSIBLE DETAILS
       * ============================================================ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Chi tiết nâng cao">
        <div className="space-y-3">
          <CollapsibleDetail title="Diverse Beam Search — khi k beam quá giống nhau">
            <div className="space-y-2 text-sm">
              <p>
                Vấn đề: beam search chuẩn thường trả về k câu{" "}
                <em>gần giống nhau</em> (khác 1-2 từ). Khi ứng dụng cần nhiều
                đề xuất thực sự khác biệt (caption ảnh, đề xuất dịch, brainstorm
                đoạn mã), điều này là tệ.
              </p>
              <p>
                Diverse Beam Search (Vijayakumar et al., 2016) chia k beam
                thành G nhóm. Trong mỗi bước, nhóm g được cộng thêm{" "}
                <strong>diversity penalty</strong> nếu nó chọn token đã được
                nhóm khác chọn. Hiệu quả: các nhóm phân kỳ và tìm ra các cách
                diễn đạt khác nhau.
              </p>
              <p>
                Trong HuggingFace:{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-xs">
                  num_beam_groups={"{...}"}
                </code>{" "}
                +{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-xs">
                  diversity_penalty={"{...}"}
                </code>
                .
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="Constrained Beam Search — ép từ bắt buộc hoặc cấm">
            <div className="space-y-2 text-sm">
              <p>
                Trong dịch máy, bạn có thể cần ép một cụm từ cụ thể xuất hiện
                (ví dụ tên riêng phải dịch chính xác) hoặc cấm một cụm khác.
                Beam search chuẩn không làm được điều này trực tiếp.
              </p>
              <p>
                <strong>Lexically constrained beam search</strong> (Post &amp;
                Vilar, 2018; Hu et al., 2019) duy trì một trường FSA
                (finite-state automaton) song song với mỗi beam để track các
                ràng buộc đã/chưa thoả. Beam chỉ được coi là “hoàn tất” khi
                tất cả ràng buộc đã khớp.
              </p>
              <p>
                HuggingFace hỗ trợ qua{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-xs">
                  force_words_ids
                </code>{" "}
                và{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-xs">
                  bad_words_ids
                </code>
                .
              </p>
            </div>
          </CollapsibleDetail>
        </div>
      </LessonSection>

      {/* ============================================================
       *  STEP 9 — MINI SUMMARY
       * ============================================================ */}
      <LessonSection step={9} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về Beam Search"
          points={[
            "Beam Search giữ k ứng viên tốt nhất song song (k = beam width / num_beams).",
            "k = 1 → Greedy (nhanh, kém). k = 4–10 → sweet spot cho dịch máy, tóm tắt. k → ∞ → exhaustive (chậm).",
            "Length penalty chia score cho |Y|^α để tránh thiên vị câu ngắn; α ≈ 0.6–1.0 phổ biến.",
            "Dịch máy / tóm tắt / captioning → beam search. ChatGPT / kể chuyện → sampling (top-p + temperature).",
            "Beam search deterministic (cùng input → cùng output); sampling tạo đa dạng, mỗi lần một khác.",
            "Diverse BS giảm mode collapse; constrained BS cho phép ép/cấm cụm từ cụ thể.",
          ]}
        />
      </LessonSection>

      {/* ============================================================
       *  STEP 10 — QUIZ
       * ============================================================ */}
      <LessonSection step={10} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ_QUESTIONS} />
      </LessonSection>
    </>
  );
}

/* ============================================================================
 *  END OF FILE — beam-search.tsx
 *
 *  Maintainer notes:
 *   - TOKEN_TREE is hand-crafted so greedy and beam produce different
 *     sentences for "Tôi yêu ___". If you change the numbers, double-check
 *     that the narrative in DecodingStrategyCards and the A-ha moment still
 *     makes sense.
 *   - Probabilities inside the tree are *conditional* — multiplying them
 *     along a path gives the joint probability of the sequence.
 *   - The LengthPenaltyChart deliberately uses a constant per-token log-prob
 *     so the shape of the penalty curve is crisp. It is a pedagogical
 *     simplification of real decoding dynamics.
 *   - All interactive labels are Vietnamese; keep it that way unless the
 *     product moves to i18n keys.
 *   - TOTAL_STEPS must stay in sync with the ProgressSteps labels array in
 *     the first LessonSection.
 *   - Diverse / constrained BS sections are intentionally collapsed because
 *     they are advanced detours most learners won't need on a first pass.
 *   - The from-scratch beam search is simplified (batch size 1, single
 *     sequence, no KV cache). Production implementations (e.g. HF's
 *     BeamSearchScorer) track much more state for performance and
 *     correctness — pointers for interested readers.
 * ============================================================================
 */
