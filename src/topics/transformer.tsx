"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate, AhaMoment, InlineChallenge, BuildUp,
  MiniSummary, CodeBlock, Callout, CollapsibleDetail,
  LessonSection,} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "transformer",
  title: "Transformer",
  titleVi: "Kiến trúc Transformer",
  description: "Kiến trúc nền tảng của mọi LLM hiện đại, dùng self-attention thay vì hồi quy",
  category: "dl-architectures",
  tags: ["attention", "nlp", "architecture"],
  difficulty: "intermediate",
  relatedSlugs: ["self-attention", "multi-head-attention", "positional-encoding"],
  vizType: "interactive",
};

/* ── Constants ── */
const W = ["Tôi", "yêu", "mèo", "nhà", "tôi"];
const C = ["#3b82f6", "#8b5cf6", "#f97316", "#22c55e", "#ec4899"];
const CS = 52, GP = 60, AX = [60, 140, 220, 300, 380];

function initAtt(): number[][] {
  return Array.from({ length: 5 }, () => {
    const row = Array.from({ length: 5 }, () => 0.1 + Math.random() * 0.3);
    const sum = row.reduce((a, b) => a + b, 0);
    return row.map((v) => v / sum);
  });
}

function normRow(row: number[]): number[] {
  const s = row.reduce((a, b) => a + b, 0);
  return s === 0 ? row.map(() => 0.2) : row.map((v) => v / s);
}

const quizQuestions: QuizQuestion[] = [
  {
    question: "Trong self-attention, mỗi từ tạo ra ba vector. Chúng là gì?",
    options: ["Input, Output, Hidden", "Query, Key, Value", "Embedding, Position, Context", "Encoder, Decoder, Attention"],
    correct: 1,
    explanation: "Mỗi từ được biến đổi thành Query (hỏi), Key (được hỏi), và Value (giá trị trả về). Attention score = Query . Key, rồi dùng softmax lấy trọng số cho Value.",
  },
  {
    question: "Tại sao Transformer cần Positional Encoding?",
    options: ["Để giảm số tham số", "Vì self-attention không biết thứ tự từ", "Để tăng tốc huấn luyện", "Để mã hóa ngữ nghĩa của từ"],
    correct: 1,
    explanation: "Self-attention xử lý tất cả từ cùng lúc — nó không phân biệt 'Tôi yêu mèo' với 'mèo yêu Tôi'. Positional Encoding thêm thông tin vị trí vào embedding.",
  },
  {
    question: "GPT, BERT, T5 đều dùng Transformer. Sự khác biệt chính là gì?",
    options: ["Kích thước mô hình khác nhau", "Dùng phần khác nhau: encoder-only, decoder-only, encoder-decoder", "Ngôn ngữ lập trình khác nhau", "Hàm loss khác nhau"],
    correct: 1,
    explanation: "BERT dùng encoder-only (hiểu ngữ cảnh hai chiều), GPT dùng decoder-only (sinh text từ trái sang phải), T5 dùng encoder-decoder (biến đổi text-to-text).",
  },
];

/* ── Component ── */
export default function TransformerTopic() {
  const [att, setAtt] = useState(initAtt);
  const [selRow, setSelRow] = useState<number | null>(null);
  const [selWord, setSelWord] = useState(2);

  const onCell = useCallback((r: number, c: number) => {
    setAtt((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = Math.min(next[r][c] + 0.15, 1);
      next[r] = normRow(next[r]);
      return next;
    });
    setSelWord(r);
  }, []);

  const onRow = useCallback((r: number) => {
    setSelRow((prev) => (prev === r ? null : r));
    setSelWord(r);
  }, []);

  const onReset = useCallback(() => {
    setAtt(initAtt());
    setSelRow(null);
    setSelWord(2);
  }, []);

  const barData = useMemo(() => {
    const row = att[selWord];
    const mx = Math.max(...row);
    return row.map((v, i) => ({ word: W[i], wt: v, pct: mx > 0 ? (v / mx) * 100 : 0 }));
  }, [att, selWord]);

  const svgSz = 5 * CS + GP + 10;

  return (
    <>
      {/* ── Step 1: HOOK ── */}
      <PredictionGate
        question={`Câu "Tôi ăn phở bò ở quán quen" — từ "quán" liên quan nhất đến từ nào?`}
        options={["Tôi", "ăn", "phở", "quen"]}
        correct={3}
        explanation={`"quán quen" — bạn vừa thực hiện attention! Não bạn tự tìm từ liên quan nhất. Transformer làm điều này cho MỌI từ cùng lúc.`}
      />

      {/* ── Step 2: DISCOVER — Interactive Attention Map ── */}
      <VisualizationSection>
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Đây là <strong>Attention Map</strong> cho câu tiếng Việt. Mỗi ô (i,j) cho biết
          từ ở hàng i &quot;chú ý&quot; bao nhiêu đến từ ở cột j.{" "}
          <strong>Nhấn vào ô để tăng attention</strong> — quan sát cách ngữ cảnh mỗi từ thay đổi.
        </p>

        <div className="overflow-x-auto pb-2">
          <svg viewBox={`0 0 ${svgSz} ${svgSz}`} className="w-full max-w-lg mx-auto">
            {W.map((w, j) => (
              <text key={`h-${j}`} x={GP + j * CS + CS / 2} y={GP - 12}
                textAnchor="middle" fontSize={13} fontWeight={600} fill={C[j]}>{w}</text>
            ))}
            {W.map((w, i) => (
              <g key={`r-${i}`}>
                <text x={GP - 8} y={GP + i * CS + CS / 2 + 5} textAnchor="end" fontSize={13}
                  fontWeight={selRow === i ? 800 : 600} fill={C[i]}
                  className="cursor-pointer" onClick={() => onRow(i)}>{w}</text>
                {W.map((_, j) => {
                  const v = att[i][j];
                  const hi = selRow === i || (selRow === null && selWord === i);
                  return (
                    <g key={`c-${i}-${j}`} className="cursor-pointer" onClick={() => onCell(i, j)}>
                      <rect x={GP + j * CS} y={GP + i * CS} width={CS} height={CS}
                        fill={`rgba(139,92,246,${Math.min(Math.max(v, 0.05), 1)})`}
                        stroke={hi ? "#a855f7" : "#475569"} strokeWidth={hi ? 2 : 0.5} rx={4} />
                      <text x={GP + j * CS + CS / 2} y={GP + i * CS + CS / 2 + 5}
                        textAnchor="middle" fontSize={11} fontWeight={500}
                        fill={v > 0.4 ? "#fff" : "#e2e8f0"}>{v.toFixed(2)}</text>
                    </g>
                  );
                })}
              </g>
            ))}
          </svg>
        </div>

        {/* Weighted output bar chart */}
        <div className="mt-4 rounded-xl border border-border bg-background/50 p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground">
            Output cho từ &quot;<span style={{ color: C[selWord] }}>{W[selWord]}</span>&quot;
            — ngữ cảnh nhận được từ mỗi từ:
          </p>
          <div className="space-y-2">
            {barData.map((d, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-10 text-right text-sm font-semibold shrink-0" style={{ color: C[i] }}>{d.word}</span>
                <div className="flex-1 h-6 rounded-full bg-surface overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{ backgroundColor: C[i] }}
                    initial={false} animate={{ width: `${d.pct}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }} />
                </div>
                <span className="w-12 text-right font-mono text-xs text-muted">{(d.wt * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
        <button type="button" onClick={onReset} className="mt-3 text-sm text-accent hover:underline">
          Đặt lại attention ngẫu nhiên
        </button>
      </VisualizationSection>

      {/* ── Step 3: REVEAL ── */}
      <AhaMoment>
        <p>
          Ma trận bạn vừa điều chỉnh chính là <strong>Attention Map</strong> — trái tim của
          kiến trúc <strong>Transformer</strong>!
        </p>
        <p className="text-sm text-muted mt-1">
          Mỗi từ &quot;hỏi&quot; mọi từ khác: &quot;Bạn quan trọng với tôi bao nhiêu?&quot;
          Attention score càng cao = ảnh hưởng càng lớn đến nghĩa của từ đó.
        </p>
      </AhaMoment>

      {/* ── Step 4: DEEPEN — Build the Transformer ── */}
      <section className="my-8 scroll-mt-20">
        <h2 className="mb-3 text-lg font-semibold text-foreground">Xây dựng kiến trúc Transformer</h2>
        <div className="rounded-xl border border-border bg-card p-5">
          <BuildUp labels={[
            "Input Tokens", "+ Embedding", "+ Positional Encoding", "+ Self-Attention",
            "+ Feed Forward", "+ Add & Norm (Residual)", "+ Xếp chồng 6 lớp", "Output",
          ]} addLabel="Thêm lớp">
            {/* 1. Input tokens */}
            <div className="rounded-lg border border-border bg-background/50 p-4">
              <div className="flex justify-center gap-3">
                {W.map((w, i) => (
                  <motion.div key={i}
                    className="flex h-10 w-14 items-center justify-center rounded-lg border-2 text-sm font-bold"
                    style={{ borderColor: C[i], color: C[i], backgroundColor: `${C[i]}15` }}
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ delay: i * 0.08, type: "spring", stiffness: 300 }}>{w}</motion.div>
                ))}
              </div>
              <p className="text-xs text-muted text-center mt-2">
                Mỗi từ được tách thành token — đơn vị nhỏ nhất mà mô hình xử lý</p>
            </div>

            {/* 2. Embedding */}
            <div className="rounded-lg border border-border bg-background/50 p-4">
              <div className="flex justify-center gap-3">
                {W.map((w, i) => (
                  <div key={i} className="flex h-14 w-14 flex-col items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${C[i]}25` }}>
                    <span className="text-xs font-bold" style={{ color: C[i] }}>{w}</span>
                    <div className="flex gap-0.5 mt-1">
                      {[0.7, 0.3, 0.9, 0.5].map((h, k) => (
                        <div key={k} className="w-1.5 rounded-full"
                          style={{ height: `${h * 16}px`, backgroundColor: C[i], opacity: 0.6 + h * 0.4 }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted text-center mt-2">
                Mỗi token → vector số (embedding) — biểu diễn nghĩa trong không gian nhiều chiều</p>
            </div>

            {/* 3. Positional Encoding */}
            <div className="rounded-lg border border-border bg-background/50 p-4">
              <div className="flex justify-center gap-3">
                {W.map((w, i) => (
                  <div key={i} className="flex h-14 w-14 flex-col items-center justify-center rounded-lg relative overflow-hidden"
                    style={{ backgroundColor: `${C[i]}25` }}>
                    {[0, 1, 2, 3, 4].map((s) => (
                      <div key={s} className="absolute w-full" style={{
                        top: `${s * 20}%`, height: "2px",
                        backgroundColor: C[i], opacity: 0.15 + (((i + s) % 5) / 5) * 0.35,
                      }} />
                    ))}
                    <span className="text-xs font-bold relative z-10" style={{ color: C[i] }}>{w}</span>
                    <span className="text-[9px] text-muted relative z-10">pos={i}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted text-center mt-2">
                Cộng thêm vector vị trí — để mô hình biết &quot;Tôi&quot; ở đầu khác &quot;tôi&quot; ở cuối</p>
            </div>

            {/* 4. Self-Attention */}
            <div className="rounded-lg border border-border bg-background/50 p-4">
              <svg viewBox="0 0 480 120" className="w-full max-w-md mx-auto">
                {W.map((w, i) => (
                  <g key={i}>
                    <circle cx={AX[i]} cy={90} r={20} fill={`${C[i]}30`} stroke={C[i]} strokeWidth={2} />
                    <text x={AX[i]} y={95} textAnchor="middle" fontSize={10} fontWeight={700} fill={C[i]}>{w}</text>
                  </g>
                ))}
                {W.map((_, i) => W.map((_, j) => i !== j ? (
                  <line key={`a-${i}-${j}`} x1={AX[i]} y1={70} x2={AX[j]} y2={70}
                    stroke="#a855f7" strokeWidth={att[i][j] * 5 + 0.5} opacity={att[i][j] * 0.8 + 0.1} />
                ) : null))}
                <text x={240} y={20} textAnchor="middle" fontSize={11} fill="#a855f7" fontWeight={600}>
                  Self-Attention: mỗi từ nhìn mọi từ khác</text>
              </svg>
              <p className="text-xs text-muted text-center mt-2">
                Q*K = attention score → softmax → nhân với V → output có ngữ cảnh</p>
            </div>

            {/* 5. Feed Forward */}
            <div className="rounded-lg border border-border bg-background/50 p-4">
              <div className="flex justify-center gap-3">
                {W.map((w, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="flex h-10 w-14 items-center justify-center rounded-lg border-2"
                      style={{ borderColor: C[i], color: C[i], backgroundColor: `${C[i]}15` }}>
                      <span className="text-xs font-bold">{w}</span>
                    </div>
                    <svg width="14" height="20" viewBox="0 0 14 20">
                      <line x1="7" y1="0" x2="7" y2="15" stroke={C[i]} strokeWidth="2" />
                      <polygon points="2,13 7,20 12,13" fill={C[i]} />
                    </svg>
                    <div className="flex h-8 w-14 items-center justify-center rounded border"
                      style={{ borderColor: "#64748b", backgroundColor: "#1e293b" }}>
                      <span className="text-[9px] text-slate-300 font-mono">FFN</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted text-center mt-2">
                Mỗi token đi qua Feed-Forward Network riêng (2 lớp tuyến tính + ReLU) — xử lý độc lập</p>
            </div>

            {/* 6. Add & Norm */}
            <div className="rounded-lg border border-border bg-background/50 p-4">
              <svg viewBox="0 0 400 80" className="w-full max-w-sm mx-auto">
                <rect x="30" y="25" width="80" height="30" rx="6" fill="#8b5cf630" stroke="#8b5cf6" strokeWidth="1.5" />
                <text x="70" y="45" textAnchor="middle" fontSize="10" fill="#8b5cf6" fontWeight="600">Attention</text>
                <line x1="110" y1="40" x2="150" y2="40" stroke="#475569" strokeWidth="1.5" />
                <circle cx="165" cy="40" r="12" fill="#1e293b" stroke="#22c55e" strokeWidth="2" />
                <text x="165" y="44" textAnchor="middle" fontSize="12" fill="#22c55e" fontWeight="700">+</text>
                <line x1="177" y1="40" x2="210" y2="40" stroke="#475569" strokeWidth="1.5" />
                <rect x="210" y="25" width="70" height="30" rx="6" fill="#22c55e30" stroke="#22c55e" strokeWidth="1.5" />
                <text x="245" y="45" textAnchor="middle" fontSize="10" fill="#22c55e" fontWeight="600">LayerNorm</text>
                <path d="M 30 40 Q 30 10 100 10 L 165 10 L 165 28" fill="none" stroke="#f97316" strokeWidth="1.5" strokeDasharray="4,3" />
                <polygon points="161,27 165,35 169,27" fill="#f97316" />
                <text x="80" y="8" fontSize="8" fill="#f97316" fontWeight="600">skip connection</text>
                <line x1="280" y1="40" x2="320" y2="40" stroke="#475569" strokeWidth="1.5" />
                <polygon points="318,36 326,40 318,44" fill="#475569" />
                <text x="350" y="44" fontSize="10" fill="#94a3b8">output</text>
              </svg>
              <p className="text-xs text-muted text-center mt-2">
                Residual connection (cộng input gốc) + LayerNorm — giúp gradient chảy tốt qua nhiều lớp</p>
            </div>

            {/* 7. Stack 6x */}
            <div className="rounded-lg border border-border bg-background/50 p-4">
              <div className="flex justify-center items-end gap-1">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <motion.div key={n} style={{ width: 50, height: 28 + n * 4 }}
                    className="flex items-center justify-center rounded border border-accent/50 bg-accent/10 text-xs font-bold text-accent"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: n * 0.1 }}>N={n}</motion.div>
                ))}
              </div>
              <p className="text-xs text-muted text-center mt-2">
                Xếp chồng 6 khối (Attention + FFN + Add&Norm) — mỗi lớp tinh chỉnh biểu diễn thêm một bậc</p>
            </div>

            {/* 8. Output */}
            <div className="rounded-lg border border-border bg-background/50 p-4">
              <div className="flex justify-center gap-2">
                {(["ăn", "ngủ", "chơi", "là", "mèo"] as const).map((w, i) => {
                  const p = [0.05, 0.03, 0.02, 0.15, 0.75][i];
                  return (
                    <div key={i} className="text-center">
                      <div className="w-12 rounded-t-lg" style={{
                        height: `${p * 80}px`, marginTop: `${(1 - p) * 80}px`,
                        backgroundColor: i === 4 ? "#22c55e" : "#3b82f650",
                      }} />
                      <div className="w-12 rounded-b-lg border border-border bg-card px-1 py-1">
                        <p className="text-[10px] font-bold text-foreground">{w}</p>
                        <p className="text-[9px] text-muted">{(p * 100).toFixed(0)}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted text-center mt-2">
                Lớp Linear + Softmax → phân phối xác suất cho từ tiếp theo.
                &quot;Tôi yêu ___ nhà tôi&quot; → &quot;mèo&quot; (75%)</p>
            </div>
          </BuildUp>
        </div>
      </section>

      {/* ── Step 5: CHALLENGE ── */}
      <InlineChallenge
        question="RNN xử lý từ tuần tự (từ 1 → 2 → 3 → ...). Transformer xử lý thế nào?"
        options={["Cũng tuần tự nhưng nhanh hơn", "Tất cả từ cùng lúc (song song)", "Ngược từ cuối về đầu"]}
        correct={1}
        explanation="Xử lý song song là lợi thế lớn nhất — Transformer nhanh hơn RNN gấp nhiều lần, và attention nắm bắt quan hệ xa tốt hơn!"
      />

      {/* ── Step 6: EXPLAIN ── */}
      <ExplanationSection>
        <p>
          <strong>Transformer</strong> (Vaswani et al., 2017) là kiến trúc cách mạng hoàn toàn dựa
          trên <strong>self-attention</strong> — loại bỏ hoàn toàn cơ chế hồi quy (recurrence) và
          tích chập (convolution). Ba đổi mới then chốt:
        </p>

        <Callout variant="insight" title="1. Self-Attention">
          <p>
            Mỗi từ tạo ra 3 vector: <strong>Query</strong> (câu hỏi), <strong>Key</strong> (danh tính),{" "}
            <strong>Value</strong> (nội dung). Attention(Q,K,V) = softmax(QK&#x1D40; / &radic;d) &times; V.
            Cho phép mỗi từ &quot;nhìn&quot; trực tiếp đến mọi từ khác, bất kể khoảng cách.
          </p>
        </Callout>

        <Callout variant="insight" title="2. Positional Encoding">
          <p>
            Vì attention xử lý song song (không có thứ tự), cần thêm vector vị trí vào embedding.
            Dùng hàm sin/cos ở các tần số khác nhau:{" "}
            <code className="font-mono text-xs bg-surface px-1.5 py-0.5 rounded">
              PE(pos,2i) = sin(pos/10000^(2i/d))
            </code>
          </p>
        </Callout>

        <Callout variant="insight" title="3. Xử lý song song">
          <p>
            RNN xử lý n từ trong O(n) bước tuần tự. Transformer xử lý tất cả cùng lúc trong O(1)
            bước (mỗi bước tốn O(n&sup2;) cho attention), tận dụng tối đa GPU song song.
          </p>
        </Callout>

        <CollapsibleDetail title="Ba loại Transformer">
          <div className="space-y-3 text-sm">
            <div className="rounded-lg border border-border p-3 space-y-1">
              <p className="font-semibold text-blue-500">Encoder-only: BERT</p>
              <p className="text-muted">Nhìn cả hai chiều (bidirectional). Giỏi hiểu ngữ cảnh — phân loại văn bản, NER, trả lời câu hỏi.</p>
            </div>
            <div className="rounded-lg border border-border p-3 space-y-1">
              <p className="font-semibold text-green-500">Decoder-only: GPT</p>
              <p className="text-muted">Chỉ nhìn từ trái sang phải (autoregressive). Giỏi sinh text — chatbot, viết code, sáng tạo.</p>
            </div>
            <div className="rounded-lg border border-border p-3 space-y-1">
              <p className="font-semibold text-purple-500">Encoder-Decoder: T5, mBART</p>
              <p className="text-muted">Encoder hiểu đầu vào, decoder sinh đầu ra. Giỏi biến đổi — dịch máy, tóm tắt, text-to-text.</p>
            </div>
          </div>
        </CollapsibleDetail>

        <CodeBlock language="python" title="self_attention.py">
{`import numpy as np

def self_attention(X, Wq, Wk, Wv):
    """X: (n_tokens, d_model)"""
    Q = X @ Wq          # Query: mỗi từ hỏi gì?
    K = X @ Wk          # Key: mỗi từ có gì?
    V = X @ Wv          # Value: nội dung trả về

    d_k = K.shape[-1]
    scores = Q @ K.T / np.sqrt(d_k)   # Attention scores
    weights = softmax(scores, axis=-1) # Chuẩn hóa → xác suất
    output = weights @ V               # Tổng có trọng số
    return output  # Mỗi từ giờ chứa ngữ cảnh từ mọi từ khác

def softmax(x, axis=-1):
    e = np.exp(x - np.max(x, axis=axis, keepdims=True))
    return e / e.sum(axis=axis, keepdims=True)`}
        </CodeBlock>

        <Callout variant="info" title={`Bài báo gốc: "Attention Is All You Need"`}>
          <p>
            Vaswani et al. (Google Brain, 2017) — bài báo mở đầu kỷ nguyên Transformer. Tiêu đề
            nói lên tất cả: chỉ cần attention là đủ, không cần RNN hay CNN. Đến nay đã được trích
            dẫn hơn 100.000 lần và là nền tảng của GPT, BERT, LLaMA, Claude, và mọi LLM hiện đại.
          </p>
        </Callout>
      </ExplanationSection>

      {/* ── Step 7: SUMMARY ── */}
      <MiniSummary
        title="Ghi nhớ về Transformer"
        points={[
          "Self-Attention cho mỗi từ nhìn trực tiếp đến mọi từ khác — nắm bắt quan hệ xa tốt hơn RNN.",
          "Xử lý song song toàn bộ câu cùng lúc — nhanh hơn RNN nhiều lần trên GPU.",
          "Positional Encoding thêm thông tin vị trí, vì attention không phân biệt thứ tự.",
          "Kiến trúc gồm: Embedding → (Self-Attention + FFN + Add&Norm) × N lớp → Output.",
          "Ba biến thể: Encoder-only (BERT), Decoder-only (GPT), Encoder-Decoder (T5) — nền tảng mọi LLM hiện đại.",
        ]}
      />

      {/* ── Step 8: QUIZ ── */}
      <QuizSection questions={quizQuestions} />
    </>
  );
}
