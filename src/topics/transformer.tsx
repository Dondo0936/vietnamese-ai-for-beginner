"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate, AhaMoment, InlineChallenge, BuildUp,
  MiniSummary, CodeBlock, Callout, CollapsibleDetail,
  LessonSection, TopicLink,} from "@/components/interactive";
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
  difficulty: "advanced",
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
  {
    type: "fill-blank",
    question: "Transformer thay thế hồi quy bằng cơ chế {blank}, kiến trúc gốc gồm hai khối {blank}, và thay vì tuần tự như RNN, mọi token được xử lý theo kiểu {blank} trên GPU.",
    blanks: [
      { answer: "self-attention", accept: ["self attention", "tự chú ý"] },
      { answer: "encoder-decoder", accept: ["encoder decoder", "mã hoá-giải mã"] },
      { answer: "song song", accept: ["parallel", "parallel computation"] },
    ],
    explanation: "Self-attention cho mỗi token nhìn mọi token khác cùng lúc. Kiến trúc gốc (Vaswani 2017) gồm encoder + decoder. Nhờ xử lý song song thay vì tuần tự, Transformer tận dụng tối đa GPU và huấn luyện nhanh hơn RNN/LSTM rất nhiều.",
  },
  {
    question: "Trong self-attention, vì sao phải chia Q·Kᵀ cho √d_k trước khi áp dụng softmax?",
    options: [
      "Để tiết kiệm bộ nhớ GPU",
      "Khi d_k lớn, tích chấm Q·K có phương sai lớn → softmax bão hoà (gradient ≈ 0). Chia √d_k giữ scale ổn định để gradient chảy tốt",
      "Để đảm bảo attention score là số nguyên",
      "Vì định lý Pythagoras yêu cầu như vậy",
    ],
    correct: 1,
    explanation: "Scaled dot-product attention là cải tiến quan trọng của Vaswani 2017. Không có √d_k, với d_k=512 thì Q·K có thể rất lớn, softmax đẩy một phần tử gần 1 và tất cả phần tử khác gần 0 — gradient biến mất. Chia √d_k chuẩn hoá phương sai về ~1.",
  },
  {
    question: "PhoBERT (VinAI) là biến thể Transformer cho tiếng Việt. Nó thuộc loại nào?",
    options: [
      "Decoder-only, giống GPT",
      "Encoder-only, giống BERT — dùng cho phân loại văn bản, NER, trả lời câu hỏi tiếng Việt",
      "Encoder-Decoder, giống T5",
      "Không phải Transformer",
    ],
    correct: 1,
    explanation: "PhoBERT là BERT cho tiếng Việt — encoder-only, được huấn luyện trên corpus tiếng Việt lớn (~20GB). Dùng để fine-tune các bài toán hiểu văn bản: UIT-VSFC (phân loại cảm xúc sinh viên), NER tiếng Việt, trả lời câu hỏi. Khác với GPT (decoder-only, sinh text).",
  },
  {
    question: "Tại sao self-attention có độ phức tạp O(n²) theo độ dài chuỗi n?",
    options: [
      "Vì phải duyệt qua toàn bộ embedding hai lần",
      "Vì mỗi token cần tính attention với mọi token khác → n × n = n² cặp (i, j)",
      "Vì softmax cần O(n²)",
      "Vì Positional Encoding tốn O(n²)",
    ],
    correct: 1,
    explanation: "Ma trận attention là n×n (mỗi hàng i là phân bố attention của token i lên mọi token j). Tính và lưu ma trận này tốn O(n²). Đây là nút cổ chai cho long-context — lý do ra đời Flash Attention, sparse attention, linear attention.",
  },
  {
    type: "fill-blank",
    question: "Hai biến thể cho tiếng Việt: {blank} của VinAI (encoder-only, fine-tune cho phân loại/NER) và {blank} (multilingual, Google) — đều dùng được cho dataset {blank} về phân loại cảm xúc sinh viên.",
    blanks: [
      { answer: "PhoBERT", accept: ["phobert", "Phobert"] },
      { answer: "mBERT", accept: ["multilingual BERT", "mBert", "multilingual-bert"] },
      { answer: "UIT-VSFC", accept: ["UIT VSFC", "uit-vsfc"] },
    ],
    explanation: "PhoBERT (monolingual tiếng Việt) thường cho kết quả tốt hơn mBERT trên các task tiếng Việt. UIT-VSFC là dataset chuẩn do UIT xây dựng với ~16.000 câu đánh giá giảng viên được gán nhãn cảm xúc.",
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

      <div className="mt-6 space-y-3 text-sm leading-relaxed">
        <p>
          <strong>Liên tưởng 1 — Cuộc họp hội đồng quản trị:</strong>{" "}
          Trong một cuộc họp 20 người, mỗi người lắng nghe khác nhau. Khi CEO
          nói, phòng kế toán chú ý chi tiết số liệu, phòng nhân sự chú ý
          phần chính sách. Self-attention giống vậy: mỗi từ &quot;lắng
          nghe&quot; các từ khác với trọng số riêng, tuỳ vào vai trò của nó
          trong câu.
        </p>
        <p>
          <strong>Liên tưởng 2 — Google search thời cổ điển vs hiện
          đại:</strong>{" "}
          Google cũ: bắt chính xác từ khoá. Google hiện đại: hiểu ý bạn —
          &quot;quán cà phê yên tĩnh gần hồ&quot; trả về đúng quán dù không
          có cụm từ này trong mô tả. Đây là &quot;attention&quot; ở cấp độ
          truy vấn — đo mức độ liên quan ngữ nghĩa, không phải trùng lặp từ.
        </p>
        <p>
          <strong>Liên tưởng 3 — Người phiên dịch ở Hội nghị APEC:</strong>{" "}
          Khi dịch tiếng Việt sang tiếng Anh, người phiên dịch không dịch
          từng từ tuần tự — họ &quot;nhìn lại&quot; ngữ cảnh toàn câu trước
          khi chọn từ dịch. Transformer encoder-decoder mô phỏng đúng quá
          trình này: encoder hiểu toàn bộ câu nguồn, decoder dùng attention
          để tham chiếu phần liên quan khi sinh từ đích.
        </p>
        <p>
          <strong>Liên tưởng 4 — Đọc hiểu tiếng Việt của học sinh giỏi:</strong>{" "}
          Khi đọc &quot;Con mèo con của mẹ chạy mất rồi&quot;, bạn biết
          &quot;con&quot; đầu là danh từ (mèo con), &quot;con&quot; sau là
          tính từ sở hữu. Cách duy nhất để phân biệt là nhìn ngữ cảnh hai
          bên. Self-attention chính là cơ chế đó: mỗi từ được hiểu lại tuỳ
          theo các từ xung quanh — khác hoàn toàn với word embedding cố định
          Word2Vec.
        </p>
      </div>

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
                    <text x={AX[i]} y={95} textAnchor="middle" fontSize={11} fontWeight={700} fill={C[i]}>{w}</text>
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
                <text x="70" y="45" textAnchor="middle" fontSize="11" fill="#8b5cf6" fontWeight="600">Attention</text>
                <line x1="110" y1="40" x2="150" y2="40" stroke="#475569" strokeWidth="1.5" />
                <circle cx="165" cy="40" r="12" fill="#1e293b" stroke="#22c55e" strokeWidth="2" />
                <text x="165" y="44" textAnchor="middle" fontSize="12" fill="#22c55e" fontWeight="700">+</text>
                <line x1="177" y1="40" x2="210" y2="40" stroke="#475569" strokeWidth="1.5" />
                <rect x="210" y="25" width="70" height="30" rx="6" fill="#22c55e30" stroke="#22c55e" strokeWidth="1.5" />
                <text x="245" y="45" textAnchor="middle" fontSize="11" fill="#22c55e" fontWeight="600">LayerNorm</text>
                <path d="M 30 40 Q 30 10 100 10 L 165 10 L 165 28" fill="none" stroke="#f97316" strokeWidth="1.5" strokeDasharray="4,3" />
                <polygon points="161,27 165,35 169,27" fill="#f97316" />
                <text x="80" y="8" fontSize="11" fill="#f97316" fontWeight="600">skip connection</text>
                <line x1="280" y1="40" x2="320" y2="40" stroke="#475569" strokeWidth="1.5" />
                <polygon points="318,36 326,40 318,44" fill="#475569" />
                <text x="350" y="44" fontSize="11" fill="#94a3b8">output</text>
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

      <div className="mt-6">
        <InlineChallenge
          question={`Bạn huấn luyện Transformer cho câu tiếng Việt: "Tôi ăn phở ở quán." và "Ở quán, tôi ăn phở." Nếu bỏ Positional Encoding, mô hình xử lý hai câu này như thế nào?`}
          options={[
            "Vẫn phân biệt được vì self-attention nhớ thứ tự",
            "Coi hai câu là TƯƠNG ĐƯƠNG vì attention không phân biệt vị trí token — mỗi từ chỉ là một bag-of-words có trọng số",
            "Báo lỗi vì độ dài khác nhau",
            "Xử lý nhanh hơn vì ít tham số hơn",
          ]}
          correct={1}
          explanation="Self-attention là phép toán hoán vị bất biến (permutation invariant): attention(Q, K, V) không đổi khi bạn xáo trộn thứ tự token. Không có Positional Encoding, mô hình không phân biệt được 'Tôi ăn phở' với 'Phở ăn Tôi'. PE là thành phần BẮT BUỘC."
        />
      </div>

      <div className="mt-6">
        <InlineChallenge
          question="Ngữ cảnh GPT-3 175B tham số, n=2048 tokens. Nếu bạn tăng context lên n=32000, độ phức tạp attention tăng bao nhiêu lần?"
          options={[
            "~16 lần (tỷ lệ n)",
            "~256 lần (tỷ lệ n²) — từ 2048² = ~4M lên 32000² = ~1 tỷ — lý do mọi LLM phải có kỹ thuật tối ưu (Flash Attention, sparse)",
            "Không đổi",
            "Giảm đi vì ít bước hơn",
          ]}
          correct={1}
          explanation="Attention là O(n²): (32000/2048)² ≈ 244× chi phí. Đây là nút cổ chai thực tế cho long-context LLM. Giải pháp: Flash Attention (tối ưu IO), sparse attention (Longformer), ring attention, hay kiến trúc linear attention (Mamba/SSM)."
        />
      </div>

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
            Cho phép mỗi từ &quot;nhìn&quot; trực tiếp đến mọi từ khác, bất kể khoảng cách. Xem chi tiết ở{" "}
            <TopicLink slug="self-attention">self-attention</TopicLink>{" "}
            và phiên bản mở rộng{" "}
            <TopicLink slug="multi-head-attention">multi-head attention</TopicLink>.
          </p>
        </Callout>

        <Callout variant="insight" title="2. Positional Encoding">
          <p>
            Vì attention xử lý song song (không có thứ tự), cần thêm vector vị trí vào embedding.
            Dùng hàm sin/cos ở các tần số khác nhau:{" "}
            <code className="font-mono text-xs bg-surface px-1.5 py-0.5 rounded">
              PE(pos,2i) = sin(pos/10000^(2i/d))
            </code>
            . Xem sâu hơn tại{" "}
            <TopicLink slug="positional-encoding">positional encoding</TopicLink>.
          </p>
        </Callout>

        <Callout variant="insight" title="3. Xử lý song song">
          <p>
            <TopicLink slug="rnn">RNN</TopicLink>{" "}
            xử lý n từ trong O(n) bước tuần tự. Transformer xử lý tất cả cùng lúc trong O(1)
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

        <CodeBlock language="python" title="transformer_phobert_vi.py — Fine-tune PhoBERT cho UIT-VSFC">
{`from transformers import AutoTokenizer, AutoModelForSequenceClassification
from transformers import Trainer, TrainingArguments
from datasets import load_dataset
import torch

# 1. PhoBERT — Transformer encoder-only cho tiếng Việt (VinAI)
MODEL_NAME = "vinai/phobert-base"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, use_fast=False)
model = AutoModelForSequenceClassification.from_pretrained(
    MODEL_NAME, num_labels=3  # negative / neutral / positive
)

# 2. Load dataset UIT-VSFC (feedback sinh viên về giảng viên)
ds = load_dataset("uit-nlp/UIT_VSFC")

# 3. Pre-segment tiếng Việt trước khi token hoá (PhoBERT yêu cầu)
from pyvi import ViTokenizer
def preprocess(batch):
    texts = [ViTokenizer.tokenize(t) for t in batch["sentence"]]
    enc = tokenizer(texts, padding="max_length", truncation=True, max_length=128)
    enc["labels"] = batch["sentiment"]
    return enc

ds = ds.map(preprocess, batched=True)

# 4. Fine-tune — attention + FFN học từ dữ liệu cảm xúc có nhãn
args = TrainingArguments(output_dir="./phobert-vsfc", num_train_epochs=3,
                         per_device_train_batch_size=16, learning_rate=2e-5)
trainer = Trainer(model=model, args=args,
                  train_dataset=ds["train"], eval_dataset=ds["validation"])
trainer.train()

# 5. Suy luận trên câu mới
inputs = tokenizer("Giảng viên dạy rất hay và tâm huyết", return_tensors="pt")
with torch.no_grad():
    logits = model(**inputs).logits
print(["negative", "neutral", "positive"][logits.argmax().item()])
# → positive`}
        </CodeBlock>

        <CollapsibleDetail title="Độ phức tạp O(n²) và các kỹ thuật tối ưu long-context (nâng cao)">
          <div className="space-y-3 text-sm leading-relaxed">
            <p>
              Ma trận attention có kích thước n × n, nên tính và lưu tốn{" "}
              O(n²) thời gian + O(n²) bộ nhớ. Với n = 32.000 token, đây là
              ~1 tỷ phép toán cho một layer — vậy mà LLM hiện đại có hàng
              chục layer.
            </p>
            <p>Bốn hướng tối ưu chính:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>
                <strong>Flash Attention</strong> (Tri Dao, 2022): tối ưu
                IO/tile, giảm số lần đọc/ghi HBM — nhanh 2-4× nhưng vẫn O(n²).
              </li>
              <li>
                <strong>Sparse attention:</strong> Longformer, BigBird — chỉ
                chú ý các vị trí lân cận + một số token toàn cục, giảm còn
                O(n log n) hoặc O(n).
              </li>
              <li>
                <strong>Linear attention / SSM:</strong> Mamba, RWKV dùng
                cơ chế state-space thay self-attention — O(n) trên cả training
                và inference.
              </li>
              <li>
                <strong>Ring / tensor parallel:</strong> chia attention trên
                nhiều GPU để vượt qua giới hạn một thiết bị.
              </li>
            </ul>
            <p className="text-muted">
              Khi bạn đọc về &quot;long context&quot; của Claude, Gemini, GPT-4
              — phần lớn kỹ thuật là sự kết hợp của những ý tưởng trên.
            </p>
          </div>
        </CollapsibleDetail>

        <Callout variant="tip" title="Hệ sinh thái Transformer cho tiếng Việt">
          Các mô hình phổ biến: <strong>PhoBERT</strong> (VinAI, encoder),{" "}
          <strong>ViT5</strong> (VinAI, encoder-decoder cho tóm tắt/dịch),{" "}
          <strong>BARTpho</strong> (generator), <strong>XLM-R</strong>{" "}
          (multilingual). Dataset chuẩn: UIT-VSFC (cảm xúc), PhoNER-COVID19
          (NER), ViQuAD (QA). Nền tảng Hugging Face có sẵn checkpoints, chỉ
          cần vài dòng code để fine-tune.
        </Callout>

        <p>
          <strong>Ứng dụng thực tế của Transformer trong các lĩnh vực:</strong>
        </p>

        <ul className="list-disc list-inside space-y-2 pl-2 text-sm leading-relaxed">
          <li>
            <strong>Dịch máy (Google Translate, DeepL):</strong>{" "}
            encoder-decoder Transformer đã thay thế hoàn toàn RNN/LSTM trong
            sản phẩm thương mại từ 2018. Chất lượng dịch Việt-Anh tăng đột
            phá — gần mức &quot;human parity&quot; cho các domain phổ biến.
          </li>
          <li>
            <strong>Chatbot &amp; LLM (ChatGPT, Claude, Gemini):</strong>{" "}
            decoder-only Transformer với quy mô hàng trăm tỷ tham số. Đã
            định hình lại ngành AI từ cuối 2022.
          </li>
          <li>
            <strong>Thị giác máy tính (Vision Transformer — ViT):</strong>{" "}
            chia ảnh thành các patch nhỏ rồi xử lý như token. Hiện đã vượt
            CNN trong nhiều benchmark nhận dạng ảnh.
          </li>
          <li>
            <strong>Sinh học tính toán (AlphaFold 2):</strong>{" "}
            dùng attention để dự đoán cấu trúc 3D của protein từ chuỗi
            amino acid — đoạt giải Nobel Hoá học 2024.
          </li>
          <li>
            <strong>Âm thanh (Whisper, AudioLM):</strong>{" "}
            transcription và synthesis âm thanh đều được Transformer-ize.
            Whisper hỗ trợ tiếng Việt khá tốt.
          </li>
          <li>
            <strong>Mã nguồn (GitHub Copilot, Code Llama):</strong>{" "}
            sinh code từ prompt — hoạt động tốt trên cú pháp bất kỳ ngôn
            ngữ lập trình nào.
          </li>
        </ul>

        <Callout variant="info" title="Vì sao Transformer tổng quát đến vậy?">
          Bất cứ dữ liệu nào có thể biểu diễn thành chuỗi các đơn vị đều
          có thể đưa vào Transformer: văn bản (token), ảnh (patch), âm thanh
          (frame), protein (amino acid), mã nguồn (token code), sequence DNA
          (base pair). Điều này biến Transformer thành một &quot;foundation
          architecture&quot; gần như không thể thay thế cho đến khi có một
          phát minh đột phá tiếp theo (hiện đang có các ứng viên như Mamba /
          State Space Models).
        </Callout>

        <CollapsibleDetail title="Huấn luyện Transformer từ đầu — những thách thức thực tế">
          <div className="space-y-3 text-sm leading-relaxed">
            <p>
              Train Transformer từ đầu (không pretrained) cho task cụ thể là
              bài toán khó. Các điểm dễ sai:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                <strong>Learning rate warmup:</strong>{" "}
                Transformer không chịu được learning rate cố định lớn ngay
                từ đầu. Chuẩn: tăng dần từ 0 lên peak trong 4.000-10.000
                bước đầu (warmup), sau đó giảm theo cosine/inverse sqrt.
              </li>
              <li>
                <strong>Gradient clipping:</strong>{" "}
                khi gradient nổ (thường xảy ra với attention), clip norm 1.0
                giúp ổn định. Không có clip, loss dễ nhảy vọt và huấn luyện
                phân kỳ.
              </li>
              <li>
                <strong>Layer normalization vị trí:</strong>{" "}
                Pre-LN (chuẩn hoá TRƯỚC attention) dễ huấn luyện hơn Post-LN
                (bản gốc). GPT-2 trở đi đều dùng Pre-LN.
              </li>
              <li>
                <strong>Label smoothing:</strong>{" "}
                thay vì one-hot target [0, 0, 1, 0], dùng [0.033, 0.033,
                0.9, 0.033] để chống overconfidence. Đặc biệt hữu ích cho
                dịch máy.
              </li>
              <li>
                <strong>Mixed precision (FP16/BF16):</strong>{" "}
                nhân ma trận bằng FP16 tiết kiệm RAM và tăng tốc gấp 2-3×,
                với dynamic loss scaling tránh underflow.
              </li>
            </ul>
            <p>
              Trong thực tế, hiếm ai train Transformer từ đầu — bạn fine-tune
              checkpoint có sẵn. Nhưng hiểu những chi tiết này giúp bạn
              debug khi training không hội tụ.
            </p>
          </div>
        </CollapsibleDetail>

        <Callout variant="warning" title="Những giới hạn cần biết">
          Mặc dù mạnh mẽ, Transformer có điểm yếu: (1) tiêu thụ bộ nhớ
          khổng lồ (O(n²) attention); (2) yêu cầu dataset khổng lồ để đạt
          hiệu năng tốt (hàng tỷ token cho model lớn); (3) thiếu inductive
          bias — CNN tự động xử lý tính translation-equivariant của ảnh,
          Transformer phải học từ dữ liệu; (4) hallucination khi là LLM —
          sinh ra thông tin sai một cách thuyết phục. Đây là lý do các kiến
          trúc thay thế (Mamba, RWKV, Hyena) đang được nghiên cứu tích cực.
        </Callout>

        <p>
          <strong>Tiến hoá của positional encoding:</strong>{" "}
          Bài báo gốc (Vaswani 2017) dùng sin/cos positional encoding cố
          định. Các phát triển sau:
        </p>

        <ul className="list-disc list-inside space-y-2 pl-2 text-sm leading-relaxed">
          <li>
            <strong>Learned position embedding (BERT):</strong>{" "}
            mỗi vị trí có một vector học được. Đơn giản nhưng không mở rộng
            được cho chuỗi dài hơn training.
          </li>
          <li>
            <strong>Relative position encoding (T5, Transformer-XL):</strong>{" "}
            dựa trên khoảng cách tương đối giữa các token thay vì vị trí
            tuyệt đối — tổng quát hoá tốt hơn.
          </li>
          <li>
            <strong>RoPE (Rotary Position Embedding — LLaMA, GPT-NeoX):</strong>{" "}
            xoay vector query/key theo góc phụ thuộc vị trí. Tốt cho cả
            trích xuất khoảng cách tuyệt đối và tương đối, mở rộng được nhờ
            kỹ thuật interpolation.
          </li>
          <li>
            <strong>ALiBi (Attention with Linear Biases):</strong>{" "}
            không thêm vector vị trí vào embedding, thay vào đó thêm bias
            tuyến tính vào attention score. Mở rộng tốt lên context 32K+
            mà không retrain.
          </li>
        </ul>

        <CodeBlock language="python" title="multi_head_self_attention.py — numpy từ A-Z">
{`import numpy as np

def softmax(x, axis=-1):
    x = x - x.max(axis=axis, keepdims=True)
    e = np.exp(x)
    return e / e.sum(axis=axis, keepdims=True)

def multi_head_attention(X, n_heads=8):
    """X: (seq_len, d_model) — input embeddings
    Trả output cùng kích thước sau khi đã tích hợp ngữ cảnh."""
    seq_len, d_model = X.shape
    d_k = d_model // n_heads   # kích thước mỗi head

    # Các ma trận học được (ở đây random cho ví dụ)
    rng = np.random.default_rng(0)
    Wq = rng.normal(scale=0.02, size=(d_model, d_model))
    Wk = rng.normal(scale=0.02, size=(d_model, d_model))
    Wv = rng.normal(scale=0.02, size=(d_model, d_model))
    Wo = rng.normal(scale=0.02, size=(d_model, d_model))

    # Projection
    Q = X @ Wq   # (seq_len, d_model)
    K = X @ Wk
    V = X @ Wv

    # Tách thành heads: (n_heads, seq_len, d_k)
    Q = Q.reshape(seq_len, n_heads, d_k).transpose(1, 0, 2)
    K = K.reshape(seq_len, n_heads, d_k).transpose(1, 0, 2)
    V = V.reshape(seq_len, n_heads, d_k).transpose(1, 0, 2)

    # Scaled dot-product attention cho mỗi head
    scores = Q @ K.transpose(0, 2, 1) / np.sqrt(d_k)  # (heads, seq, seq)
    weights = softmax(scores, axis=-1)
    heads = weights @ V   # (heads, seq, d_k)

    # Gộp heads và project ra
    out = heads.transpose(1, 0, 2).reshape(seq_len, d_model)
    return out @ Wo   # (seq_len, d_model)

# Demo: 5 token, d_model=64
X = np.random.randn(5, 64)
out = multi_head_attention(X, n_heads=8)
print("Output shape:", out.shape)   # (5, 64)`}
        </CodeBlock>

        <p>
          <strong>Các loại mask quan trọng trong Transformer:</strong>
        </p>

        <ul className="list-disc list-inside space-y-2 pl-2 text-sm leading-relaxed">
          <li>
            <strong>Padding mask:</strong>{" "}
            khi batch có câu ngắn hơn, các vị trí padding không được tham
            gia vào attention. Mask đặt -∞ cho các cặp (i, padding_j) →
            softmax ra 0.
          </li>
          <li>
            <strong>Causal mask (triangular):</strong>{" "}
            trong decoder/GPT, token vị trí i chỉ nhìn được token 0..i
            (không nhìn tương lai). Đây là điều đảm bảo mô hình autoregressive
            — khi sinh text, không &quot;gian lận&quot; bằng cách nhìn token
            chưa có.
          </li>
          <li>
            <strong>Custom mask:</strong>{" "}
            một số biến thể (Longformer, BigBird) dùng pattern mask sparse
            để giảm complexity từ O(n²) xuống O(n·w).
          </li>
        </ul>

        <Callout variant="tip" title="KV cache — bí kíp inference nhanh LLM">
          Khi sinh text token-by-token, bạn không cần tính lại Q·K·V cho
          toàn bộ context mỗi bước. KV cache lưu K và V của các token đã sinh,
          chỉ tính mới cho token hiện tại — giảm inference từ O(n²) xuống
          O(n) cho mỗi bước. Đây là kỹ thuật bắt buộc cho mọi LLM production.
          Quant hoá KV cache (INT8, INT4) còn giúp giảm thêm 2-4× VRAM.
        </Callout>
      </ExplanationSection>

      {/* ── Step 6.5: Case studies Vietnamese ── */}
      <section className="my-8 scroll-mt-20 space-y-4 text-sm leading-relaxed">
        <h2 className="mb-3 text-lg font-semibold text-foreground">
          Ba case study Transformer tại Việt Nam
        </h2>

        <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
          <p className="font-semibold text-foreground">
            1. VinAI — PhoBERT &amp; ViT5
          </p>
          <p className="text-muted">
            VinAI Research phát hành PhoBERT (2020) — BERT pretrain trên
            20GB corpus tiếng Việt. Kết quả: state-of-the-art cho UIT-VSFC
            (cảm xúc), PhoNER-COVID19 (NER), ViQuAD (QA). ViT5 (2022) là
            encoder-decoder Transformer cho các task sinh text tiếng Việt —
            tóm tắt, dịch, trả lời dạng paragraph. Cả hai đều mở trên Hugging
            Face, là nền tảng cho 100+ ứng dụng downstream.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
          <p className="font-semibold text-foreground">
            2. Zalo AI — GPT tiếng Việt quy mô công nghiệp
          </p>
          <p className="text-muted">
            Zalo triển khai Transformer cho: phát hiện nội dung vi phạm,
            dịch tự động trong Zalo OA, gợi ý tin nhắn thông minh, và chatbot
            CSKH. Đội VinBigData cũng phát hành PhoGPT — LLM decoder-only
            tiếng Việt với 7.5B tham số, được train trên 300GB dữ liệu.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
          <p className="font-semibold text-foreground">
            3. Bộ Y tế &amp; các bệnh viện — AI chẩn đoán ảnh y khoa
          </p>
          <p className="text-muted">
            Vision Transformer (ViT) được dùng để phân tích ảnh X-quang
            phổi, CT, siêu âm. Ưu điểm so với CNN: nắm bắt tốt hơn các mẫu
            toàn cục trên ảnh (lesion phân tán), giải thích được bằng
            attention map. VinLab và Bệnh viện Bạch Mai là hai trong những
            nơi đầu tiên áp dụng ViT trong chẩn đoán thực tế tại Việt Nam.
          </p>
        </div>
      </section>

      {/* ── Step 7: SUMMARY ── */}
      <MiniSummary
        title="Ghi nhớ về Transformer"
        points={[
          "Self-Attention cho mỗi từ nhìn trực tiếp đến mọi từ khác — nắm bắt quan hệ xa tốt hơn RNN.",
          "Xử lý song song toàn bộ câu cùng lúc — nhanh hơn RNN nhiều lần trên GPU.",
          "Positional Encoding thêm thông tin vị trí, vì attention không phân biệt thứ tự.",
          "Kiến trúc gồm: Embedding → (Self-Attention + FFN + Add&Norm) × N lớp → Output.",
          "Ba biến thể: Encoder-only (BERT), Decoder-only (GPT), Encoder-Decoder (T5) — nền tảng mọi LLM hiện đại.",
          "Attention là O(n²) — long-context cần Flash Attention / sparse / SSM; tiếng Việt có PhoBERT, ViT5, UIT-VSFC làm nền.",
        ]}
      />

      {/* ── Step 8: QUIZ ── */}
      <QuizSection questions={quizQuestions} />
    </>
  );
}
