"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PredictionGate, AhaMoment, InlineChallenge, ToggleCompare,
  MiniSummary, CodeBlock, Callout,
  LessonSection, TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "bert",
  title: "BERT",
  titleVi: "BERT - Biểu diễn mã hoá hai chiều",
  description:
    "Mô hình ngôn ngữ tiền huấn luyện hai chiều, hiểu ngữ cảnh từ cả trái lẫn phải để biểu diễn ngôn ngữ sâu sắc.",
  category: "nlp",
  tags: ["nlp", "transformer", "pre-training"],
  difficulty: "advanced",
  relatedSlugs: ["transformer", "attention-mechanism", "gpt"],
  vizType: "interactive",
};

/* ── MLM Game Data ── */
interface MlmSentence {
  before: string;
  after: string;
  answer: string;
  options: string[];
  bertTop3: { word: string; score: number }[];
}

const MLM_DATA: MlmSentence[] = [
  { before: "Hà Nội là thủ đô của", after: "", answer: "Việt Nam",
    options: ["Việt Nam", "Trung Quốc", "Thái Lan", "Nhật Bản"],
    bertTop3: [{ word: "Việt Nam", score: 0.92 }, { word: "nước ta", score: 0.05 }, { word: "Đông Dương", score: 0.02 }] },
  { before: "Con mèo đang", after: "trên ghế", answer: "nằm",
    options: ["nằm", "bay", "hát", "lái"],
    bertTop3: [{ word: "nằm", score: 0.78 }, { word: "ngồi", score: 0.14 }, { word: "ngủ", score: 0.06 }] },
  { before: "Tôi uống", after: "mỗi sáng", answer: "cà phê",
    options: ["cà phê", "xăng", "mực", "sơn"],
    bertTop3: [{ word: "cà phê", score: 0.85 }, { word: "nước", score: 0.08 }, { word: "trà", score: 0.05 }] },
  { before: "Sông", after: "chảy qua Huế", answer: "Hương",
    options: ["Hương", "Hồng", "Mê Kông", "Đà"],
    bertTop3: [{ word: "Hương", score: 0.91 }, { word: "Bồ", score: 0.04 }, { word: "Hồng", score: 0.03 }] },
  { before: "Phở là món ăn nổi tiếng của", after: "", answer: "Việt Nam",
    options: ["Việt Nam", "Hàn Quốc", "Ý", "Ấn Độ"],
    bertTop3: [{ word: "Việt Nam", score: 0.95 }, { word: "Hà Nội", score: 0.03 }, { word: "người Việt", score: 0.01 }] },
];

const QUIZ: QuizQuestion[] = [
  { question: "BERT được tiền huấn luyện bằng hai tác vụ. Tác vụ nào giúp BERT hiểu nghĩa từ trong ngữ cảnh?",
    options: ["Next Sentence Prediction (NSP)", "Masked Language Modeling (MLM)", "Causal Language Modeling", "Text Classification"],
    correct: 1, explanation: "MLM che 15% từ rồi yêu cầu BERT đoán từ bị che dựa trên ngữ cảnh hai chiều — đây là cách BERT học hiểu nghĩa từ." },
  { question: "Điểm khác biệt cốt lõi giữa BERT và GPT là gì?",
    options: ["BERT lớn hơn GPT", "BERT đọc hai chiều, GPT đọc một chiều (trái → phải)", "GPT không dùng Transformer", "BERT dùng CNN, GPT dùng Transformer"],
    correct: 1, explanation: "BERT dùng Transformer Encoder đọc hai chiều. GPT dùng Transformer Decoder đọc một chiều. Vì vậy BERT giỏi HIỂU, GPT giỏi SINH." },
  { question: "Sau tiền huấn luyện, BERT được sử dụng cho tác vụ cụ thể bằng cách nào?",
    options: ["Huấn luyện lại từ đầu", "Tinh chỉnh (fine-tune) trên dữ liệu tác vụ cụ thể", "Không cần thay đổi gì", "Thêm nhiều lớp Transformer mới"],
    correct: 1, explanation: "BERT được fine-tune: giữ nguyên trọng số đã học, thêm lớp đầu ra đơn giản, rồi huấn luyện nhẹ trên dữ liệu tác vụ cụ thể." },
  {
    type: "fill-blank",
    question:
      "BERT là kiến trúc {blank}-only và được tiền huấn luyện bằng hai tác vụ: {blank} (che từ rồi đoán lại) và {blank} (dự đoán câu tiếp theo).",
    blanks: [
      { answer: "encoder", accept: ["Encoder"] },
      { answer: "MLM", accept: ["mlm", "Masked Language Modeling", "masked language modeling"] },
      { answer: "NSP", accept: ["nsp", "Next Sentence Prediction", "next sentence prediction"] },
    ],
    explanation:
      "BERT là encoder-only Transformer. MLM che 15% token để học ngữ nghĩa từ ngữ cảnh hai chiều, còn NSP giúp mô hình học quan hệ giữa các câu.",
  },
];

/* ── Direction Arrows SVG ── */
const DT = ["Tôi", "uống", "[MASK]", "mỗi", "sáng"];
const DC = ["#3b82f6", "#8b5cf6", "#ef4444", "#22c55e", "#f97316"];
const DX = [50, 130, 210, 290, 370];

function DirectionArrows({ bi }: { bi: boolean }) {
  const arrows = [0, 1, 2, 3];
  return (
    <svg viewBox="0 0 440 160" className="w-full max-w-lg mx-auto">
      {DT.map((t, i) => (
        <g key={i}>
          <rect x={DX[i] - 30} y={100} width={60} height={32} rx={8}
            fill={t === "[MASK]" ? "#ef444430" : `${DC[i]}20`} stroke={DC[i]} strokeWidth={2} />
          <text x={DX[i]} y={121} textAnchor="middle" fontSize={12} fontWeight={700} fill={DC[i]}>{t}</text>
        </g>
      ))}
      {bi ? (<>
        {arrows.map((i) => (<g key={`lr-${i}`}>
          <line x1={DX[i] + 30} y1={85} x2={DX[i + 1] - 30} y2={85} stroke="#3b82f6" strokeWidth={2} />
          <polygon points={`${DX[i + 1] - 32},81 ${DX[i + 1] - 24},85 ${DX[i + 1] - 32},89`} fill="#3b82f6" />
        </g>))}
        {arrows.map((i) => (<g key={`rl-${i}`}>
          <line x1={DX[i + 1] - 30} y1={145} x2={DX[i] + 30} y2={145} stroke="#f97316" strokeWidth={2} />
          <polygon points={`${DX[i] + 32},141 ${DX[i] + 24},145 ${DX[i] + 32},149`} fill="#f97316" />
        </g>))}
        <text x={220} y={75} textAnchor="middle" fontSize={10} fill="#3b82f6" fontWeight={600}>Trái &rarr; Phải</text>
        <text x={220} y={158} textAnchor="middle" fontSize={10} fill="#f97316" fontWeight={600}>Phải &rarr; Trái</text>
        <rect x={DX[2] - 34} y={96} width={68} height={40} rx={10} fill="none" stroke="#22c55e" strokeWidth={2} strokeDasharray="4,3" />
        <text x={DX[2]} y={50} textAnchor="middle" fontSize={10} fill="#22c55e" fontWeight={600}>Thấy cả hai phía!</text>
        <line x1={DX[2]} y1={54} x2={DX[2]} y2={94} stroke="#22c55e" strokeWidth={1} strokeDasharray="3,3" />
      </>) : (<>
        {arrows.map((i) => (<g key={`lr-${i}`}>
          <line x1={DX[i] + 30} y1={115} x2={DX[i + 1] - 30} y2={115} stroke="#3b82f6" strokeWidth={2} />
          <polygon points={`${DX[i + 1] - 32},111 ${DX[i + 1] - 24},115 ${DX[i + 1] - 32},119`} fill="#3b82f6" />
        </g>))}
        <text x={220} y={80} textAnchor="middle" fontSize={10} fill="#3b82f6" fontWeight={600}>Chỉ Trái &rarr; Phải</text>
        <rect x={DX[2] + 40} y={96} width={DX[4] - DX[2] + 10} height={40} rx={8}
          fill="#ef444415" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4,3" />
        <text x={DX[3] + 20} y={50} textAnchor="middle" fontSize={10} fill="#ef4444" fontWeight={600}>Không thấy phía phải!</text>
        <line x1={DX[3] + 20} y1={54} x2={DX[3] + 20} y2={94} stroke="#ef4444" strokeWidth={1} strokeDasharray="3,3" />
      </>)}
    </svg>
  );
}

/* ── Main Component ── */
export default function BertTopic() {
  const [idx, setIdx] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [uScore, setUScore] = useState(0);
  const [bScore, setBScore] = useState(0);
  const [done, setDone] = useState(false);

  const s = MLM_DATA[idx];

  const onPick = useCallback((i: number) => { if (!revealed) setPick(i); }, [revealed]);

  const onCheck = useCallback(() => {
    if (pick === null) return;
    setRevealed(true);
    if (MLM_DATA[idx].options[pick] === MLM_DATA[idx].answer) setUScore((p) => p + 1);
    setBScore((p) => p + 1);
  }, [pick, idx]);

  const onNext = useCallback(() => {
    if (idx < MLM_DATA.length - 1) { setIdx((p) => p + 1); setPick(null); setRevealed(false); }
    else setDone(true);
  }, [idx]);

  const onReset = useCallback(() => {
    setIdx(0); setPick(null); setRevealed(false); setUScore(0); setBScore(0); setDone(false);
  }, []);

  const correct = useMemo(() => revealed && s.options[pick!] === s.answer, [revealed, pick, s]);
  const barColors = ["#22c55e", "#3b82f6", "#8b5cf6"];

  return (
    <>
      {/* ── Step 1: HOOK ── */}
      <PredictionGate
        question={`Điền vào chỗ trống: "Tôi thích ăn ___ vào buổi sáng." Từ nào phù hợp nhất?`}
        options={["Phở", "Xe máy", "Toán học"]}
        correct={0}
        explanation={`Bạn dùng ngữ cảnh HAI CHIỀU (trước + sau chỗ trống) để đoán. "thích ăn" + "vào buổi sáng" → Phở! BERT làm điều tương tự — đọc cả hai hướng cùng lúc!`}
      />

      {/* ── Step 2: DISCOVER — Masked Language Model Game ── */}
      <VisualizationSection>
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Hãy chơi trò <strong>đoán từ bị che</strong> — chính xác là cách BERT được huấn luyện!
          Đọc câu, chọn từ phù hợp cho <span className="text-red-500 font-bold">[MASK]</span>.
        </p>

        {/* Progress */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted">Câu {idx + 1}/{MLM_DATA.length}</span>
          <div className="flex gap-1">
            {MLM_DATA.map((_, i) => (
              <div key={i} className={`h-1.5 w-6 rounded-full transition-colors ${
                i < idx ? "bg-accent" : i === idx ? "bg-accent/50" : "bg-surface"
              }`} />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!done ? (
            <motion.div key={`mlm-${idx}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="space-y-4">
              {/* Sentence with [MASK] */}
              <div className="rounded-xl border border-border bg-background/50 p-5 text-center">
                <p className="text-lg font-medium text-foreground leading-relaxed">
                  {s.before}{" "}
                  <span className="inline-block rounded-lg bg-red-500/20 border-2 border-red-500 px-3 py-1 font-bold text-red-500">[MASK]</span>
                  {s.after ? ` ${s.after}` : ""}
                </p>
              </div>

              {/* Options */}
              <div className="grid grid-cols-2 gap-2">
                {s.options.map((opt, i) => {
                  let cls = "px-4 py-3 rounded-xl border text-sm font-medium transition-colors text-center";
                  if (!revealed) {
                    cls += pick === i
                      ? " border-accent bg-accent-light text-accent-dark"
                      : " border-border bg-card text-foreground hover:bg-surface hover:border-accent/50";
                  } else if (opt === s.answer) {
                    cls += " border-green-400 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700";
                  } else if (pick === i) {
                    cls += " border-red-400 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700";
                  } else {
                    cls += " border-border bg-card text-muted opacity-50";
                  }
                  return (
                    <button key={i} type="button" disabled={revealed}
                      onClick={() => onPick(i)} className={cls}>{opt}</button>
                  );
                })}
              </div>

              {/* Check */}
              {!revealed && (
                <button type="button" disabled={pick === null} onClick={onCheck}
                  className="w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40 hover:enabled:opacity-90">
                  Kiểm tra
                </button>
              )}

              {/* Result + BERT predictions */}
              <AnimatePresence>
                {revealed && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden space-y-3">
                    <div className={`rounded-xl border p-3 text-sm text-center ${
                      correct
                        ? "border-green-300 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300"
                        : "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
                    }`}>
                      {correct ? "BERT dự đoán giống bạn!" : `Đáp án đúng: "${s.answer}". BERT đoán đúng rồi!`}
                    </div>

                    {/* BERT top 3 */}
                    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                      <p className="text-xs font-semibold text-muted uppercase tracking-wide">Top 3 dự đoán của BERT</p>
                      {s.bertTop3.map((pred, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="w-20 text-right text-sm font-medium text-foreground truncate">{pred.word}</span>
                          <div className="flex-1 h-5 rounded-full bg-surface overflow-hidden">
                            <motion.div className="h-full rounded-full" style={{ backgroundColor: barColors[i] }}
                              initial={{ width: 0 }} animate={{ width: `${pred.score * 100}%` }}
                              transition={{ duration: 0.5, delay: i * 0.1 }} />
                          </div>
                          <span className="w-12 text-right font-mono text-xs text-muted">{(pred.score * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>

                    <button type="button" onClick={onNext}
                      className="w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
                      {idx < MLM_DATA.length - 1 ? "Câu tiếp theo" : "Xem kết quả"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            /* Result screen */
            <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }} className="rounded-xl border border-border bg-card p-6 text-center space-y-4">
              <p className="text-lg font-bold text-foreground">Kết quả</p>
              <div className="flex justify-center gap-8">
                <div>
                  <p className="text-3xl font-bold text-accent">{uScore}/{MLM_DATA.length}</p>
                  <p className="text-sm text-muted">Bạn</p>
                </div>
                <div className="w-px bg-border" />
                <div>
                  <p className="text-3xl font-bold text-green-500">{bScore}/{MLM_DATA.length}</p>
                  <p className="text-sm text-muted">BERT</p>
                </div>
              </div>
              <p className="text-sm text-muted">
                {uScore === MLM_DATA.length ? "Hoàn hảo! Bạn đoán tốt như BERT!"
                  : uScore >= 3 ? "Rất tốt! Bạn và BERT đều dùng ngữ cảnh hai chiều để đoán."
                  : "BERT đoán tốt hơn nhờ đọc hàng tỷ câu. Nhưng bạn đã hiểu nguyên lý!"}
              </p>
              <button type="button" onClick={onReset} className="text-sm text-accent hover:underline">Chơi lại</button>
            </motion.div>
          )}
        </AnimatePresence>
      </VisualizationSection>

      {/* ── Step 3: REVEAL ── */}
      <AhaMoment>
        <p>
          Trò chơi điền từ bạn vừa chơi chính là cách <strong>BERT</strong> được huấn luyện!
        </p>
        <p className="text-sm text-muted mt-1">
          BERT che 15% từ trong câu, rồi học đoán từ bị che bằng ngữ cảnh hai chiều.
          Đó là <strong>Masked Language Modeling</strong> — tác vụ tiền huấn luyện cốt lõi của BERT.
        </p>
      </AhaMoment>

      {/* ── Step 4: DEEPEN — Bidirectional vs Unidirectional ── */}
      <section className="my-8 scroll-mt-20">
        <h2 className="mb-3 text-lg font-semibold text-foreground">Hai chiều vs. Một chiều</h2>
        <ToggleCompare
          labelA="GPT (→ một chiều)"
          labelB="BERT (↔ hai chiều)"
          description={`Cùng câu "Tôi uống [MASK] mỗi sáng" — hướng đọc khác nhau dẫn đến ngữ cảnh khác nhau.`}
          childA={
            <div className="space-y-3">
              <DirectionArrows bi={false} />
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-center">
                <p className="text-sm text-red-700 dark:text-red-300">
                  GPT chỉ thấy <strong>&quot;Tôi uống&quot;</strong> phía trước [MASK]. Thiếu &quot;mỗi sáng&quot; → khó đoán chính xác!
                </p>
              </div>
            </div>
          }
          childB={
            <div className="space-y-3">
              <DirectionArrows bi />
              <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 text-center">
                <p className="text-sm text-green-700 dark:text-green-300">
                  BERT thấy cả <strong>&quot;Tôi uống&quot;</strong> VÀ <strong>&quot;mỗi sáng&quot;</strong> → ngữ cảnh đầy đủ → dự đoán chính xác!
                </p>
              </div>
            </div>
          }
        />
      </section>

      {/* ── Step 5: CHALLENGE ── */}
      <InlineChallenge
        question="BERT đọc hai chiều nên hiểu ngữ cảnh tốt. Nhưng tại sao GPT (một chiều) lại tốt hơn cho việc SINH văn bản?"
        options={["GPT nhanh hơn", "Sinh text cần dự đoán từ TIẾP THEO, chỉ cần ngữ cảnh trước đó", "GPT có nhiều tham số hơn"]}
        correct={1}
        explanation="Sinh text = dự đoán từ tiếp theo → chỉ cần context bên trái. BERT giỏi HIỂU (phân loại, trích xuất), GPT giỏi SINH (chatbot, viết code)!"
      />

      {/* ── Step 6: EXPLAIN ── */}
      <ExplanationSection>
        <p>
          <strong>BERT</strong> (Bidirectional Encoder Representations from Transformers) là mô hình
          của Google (2018), sử dụng{" "}
          <TopicLink slug="transformer">Transformer</TopicLink>
          {" "}Encoder đọc hai chiều. Đầu vào được chia nhỏ bằng{" "}
          <TopicLink slug="tokenization">tokenization</TopicLink>
          {" "}(WordPiece) trước khi đi vào các lớp attention. BERT-base:
          12 lớp, 768 chiều ẩn, 12 attention heads — tổng <strong>110 triệu tham số</strong>.
          Khác với{" "}
          <TopicLink slug="gpt">GPT</TopicLink>
          {" "}(decoder-only, đọc một chiều), BERT tối ưu cho HIỂU chứ không phải sinh.
        </p>

        <Callout variant="insight" title="Tiền huấn luyện: 2 tác vụ">
          <div className="space-y-2">
            <p>
              <strong>1. Masked Language Modeling (MLM):</strong> Che 15% token, yêu cầu BERT
              đoán từ bị che bằng ngữ cảnh hai phía — tác vụ chính giúp BERT hiểu nghĩa từ.
            </p>
            <p>
              <strong>2. Next Sentence Prediction (NSP):</strong> Cho hai câu A và B, dự đoán
              B có phải câu tiếp theo của A không — giúp hiểu quan hệ giữa các câu.
            </p>
          </div>
        </Callout>

        <Callout variant="info" title="Fine-tuning cho tác vụ cụ thể">
          <p>
            Sau tiền huấn luyện, BERT được <strong>tinh chỉnh</strong> bằng cách thêm lớp đầu ra
            đơn giản cho tác vụ cụ thể: phân loại văn bản, NER, hỏi đáp, phân tích cảm xúc...
            BERT đạt SOTA trên 11 benchmark NLP khi ra mắt.
          </p>
        </Callout>

        <CodeBlock language="python" title="bert_huggingface.py">
{`from transformers import pipeline

# Masked Language Modeling — điền từ bị che
mlm = pipeline("fill-mask", model="bert-base-multilingual-cased")
result = mlm("Hà Nội là thủ đô của [MASK].")
for pred in result[:3]:
    print(f"  {pred['token_str']:>10} — {pred['score']:.2%}")

# Phân loại cảm xúc (sau fine-tune)
classifier = pipeline("sentiment-analysis")
print(classifier("Phở Việt Nam ngon tuyệt vời!"))
# [{'label': 'POSITIVE', 'score': 0.9998}]`}
        </CodeBlock>

        <Callout variant="tip" title="PhoBERT — BERT cho tiếng Việt">
          <p>
            <strong>PhoBERT</strong> (VinAI, 2020) được tiền huấn luyện trên 20GB văn bản tiếng Việt
            với bộ tách từ RDRSegmenter. Hiểu tiếng Việt tốt hơn BERT đa ngôn ngữ. Dùng:{" "}
            <code className="font-mono text-xs bg-surface px-1.5 py-0.5 rounded">vinai/phobert-base</code> trên HuggingFace.
          </p>
        </Callout>
      </ExplanationSection>

      {/* ── Step 7: SUMMARY ── */}
      <MiniSummary
        title="Ghi nhớ về BERT"
        points={[
          "BERT đọc HAI CHIỀU — hiểu ngữ cảnh từ cả trái lẫn phải, khác GPT chỉ đọc một chiều.",
          "Tiền huấn luyện bằng MLM (đoán từ bị che) + NSP (dự đoán câu tiếp theo) — không cần dữ liệu gán nhãn.",
          "Fine-tune: thêm lớp đầu ra đơn giản → phân loại, NER, hỏi đáp, phân tích cảm xúc.",
          "PhoBERT là BERT chuyên biệt cho tiếng Việt, hiểu tiếng Việt tốt hơn BERT đa ngôn ngữ.",
        ]}
      />

      {/* ── Step 8: QUIZ ── */}
      <QuizSection questions={QUIZ} />
    </>
  );
}
