"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PredictionGate, StepReveal, AhaMoment, InlineChallenge,
  Callout, MiniSummary, CodeBlock, ToggleCompare,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "rag",
  title: "RAG",
  titleVi: "RAG - Sinh nội dung có truy xuất",
  description: "Retrieval-Augmented Generation kết hợp truy xuất tài liệu với mô hình ngôn ngữ để tạo câu trả lời chính xác hơn.",
  category: "search-retrieval",
  tags: ["retrieval", "generation", "llm", "search"],
  difficulty: "intermediate",
  relatedSlugs: ["vector-databases", "semantic-search", "chunking"],
  vizType: "interactive",
};

/* ── data ──────────────────────────────────────────────────── */
interface Doc { id: number; title: string; content: string }
interface Preset {
  question: string; hallucinated: string; ragAnswer: string;
  relevantDocs: number[]; scores: number[];
}

const KB: Doc[] = [
  { id: 1, title: "Giá iPhone 16 tại Việt Nam", content: "iPhone 16 chính hãng có giá từ 22,99 triệu đồng (bản 128GB) đến 28,99 triệu đồng (bản 512GB) tại thị trường Việt Nam, cập nhật tháng 3/2026." },
  { id: 2, title: "Lịch sử Đền Hùng", content: "Giỗ Tổ Hùng Vương được tổ chức vào mùng 10 tháng 3 Âm lịch hàng năm. Khu di tích Đền Hùng nằm tại Phú Thọ, được UNESCO công nhận là Di sản văn hóa phi vật thể năm 2012." },
  { id: 3, title: "GDP Việt Nam 2025", content: "GDP Việt Nam năm 2025 ước đạt 476 tỷ USD, tăng trưởng 6,8% so với năm trước. Ngành công nghệ thông tin đóng góp 16% vào GDP." },
  { id: 4, title: "Cách nấu phở Hà Nội", content: "Phở Hà Nội truyền thống dùng nước dùng ninh từ xương bò trong 12 tiếng, gia vị gồm quế, hồi, thảo quả. Bánh phở mỏng, thịt bò tái hoặc chín." },
  { id: 5, title: "Thời tiết TP.HCM hôm nay", content: "TP.HCM hôm nay nhiệt độ 32-35 độ C, có mưa rào vào buổi chiều tối, độ ẩm 75%. Chỉ số UV cao, nên hạn chế ra nắng từ 10h-15h." },
];

const PRESETS: Preset[] = [
  { question: "Giá iPhone 16 ở Việt Nam bao nhiêu?",
    hallucinated: "iPhone 16 có giá khoảng 799 USD (tương đương 19 triệu đồng) theo thông tin từ Apple. Đây là mức giá tham khảo tại thị trường Mỹ.",
    ragAnswer: "Theo tài liệu [1], iPhone 16 chính hãng tại Việt Nam có giá từ 22,99 triệu đồng (128GB) đến 28,99 triệu đồng (512GB), cập nhật tháng 3/2026.",
    relevantDocs: [0, 2], scores: [0.95, 0.12, 0.31, 0.08, 0.15] },
  { question: "Giỗ Tổ Hùng Vương là ngày nào?",
    hallucinated: "Giỗ Tổ Hùng Vương được tổ chức vào ngày 10 tháng 3 dương lịch hàng năm, là ngày lễ lớn của dân tộc Việt Nam.",
    ragAnswer: "Theo tài liệu [1], Giỗ Tổ Hùng Vương được tổ chức vào mùng 10 tháng 3 Âm lịch hàng năm. Khu di tích nằm tại Phú Thọ, UNESCO công nhận năm 2012 [1].",
    relevantDocs: [1], scores: [0.05, 0.97, 0.08, 0.04, 0.06] },
  { question: "Thời tiết TP.HCM hôm nay thế nào?",
    hallucinated: "TP.HCM thường có thời tiết nóng ẩm quanh năm, nhiệt độ trung bình 28-33 độ C. Mùa mưa kéo dài từ tháng 5 đến tháng 11.",
    ragAnswer: "Theo tài liệu [1], TP.HCM hôm nay nhiệt độ 32-35 độ C, có mưa rào buổi chiều tối, độ ẩm 75%. Chỉ số UV cao, nên hạn chế ra nắng 10h-15h [1].",
    relevantDocs: [4], scores: [0.07, 0.04, 0.11, 0.09, 0.96] },
];

/* ── streaming hook ────────────────────────────────────────── */
function useStreamText(text: string, active: boolean, speed = 25) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!active) { setDisplayed(""); setDone(false); return; }
    let i = 0; setDisplayed(""); setDone(false);
    const tick = () => {
      if (i < text.length) { setDisplayed(text.slice(0, ++i)); timer.current = setTimeout(tick, speed); }
      else setDone(true);
    };
    tick();
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [text, active, speed]);
  return { displayed, done };
}

const Cursor = () => (
  <motion.span className="inline-block w-0.5 h-4 bg-foreground ml-0.5 align-text-bottom"
    animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} />
);
const Dots = () => (
  <div className="flex items-center gap-2 text-xs text-muted">
    <span className="flex gap-1">
      {[0, 1, 2].map(i => <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-muted"
        animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />)}
    </span>
    <span>LLM đang suy nghĩ...</span>
  </div>
);
const StepBadge = ({ n, color }: { n: number; color: string }) => (
  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold ${color}`}>{n}</div>
);

/* ── Phase A: Without RAG ──────────────────────────────────── */
function WithoutRAG({ preset }: { preset: Preset }) {
  const [go, setGo] = useState(false);
  const { displayed, done } = useStreamText(preset.hallucinated, go);
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-surface p-3">
        <p className="text-xs font-medium text-muted mb-1">Câu hỏi</p>
        <p className="text-sm text-foreground font-medium">{preset.question}</p>
      </div>
      {!go ? (
        <button type="button" onClick={() => setGo(true)}
          className="w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-white hover:opacity-90">
          Hỏi LLM (không có RAG)
        </button>
      ) : (
        <div className="space-y-3">
          {!done && <Dots />}
          <div className="rounded-lg bg-background/50 border border-border p-4">
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{displayed}{!done && <Cursor />}</p>
          </div>
          {done && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 px-4 py-2.5">
              <span className="text-lg">&#9888;</span>
              <span className="text-sm font-medium text-red-700 dark:text-red-300">Thông tin có thể không chính xác!</span>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Phase B: With RAG ─────────────────────────────────────── */
function WithRAG({ preset }: { preset: Preset }) {
  const [step, setStep] = useState(0);
  const { displayed, done: textDone } = useStreamText(preset.ragAnswer, step >= 4);
  const advance = useCallback(() => setStep(s => Math.min(s + 1, 4)), []);
  useEffect(() => {
    if (step >= 1 && step < 4) {
      const t = setTimeout(advance, step === 2 ? 1500 : 1000);
      return () => clearTimeout(t);
    }
  }, [step, advance]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-surface p-3">
        <p className="text-xs font-medium text-muted mb-1">Câu hỏi</p>
        <p className="text-sm text-foreground font-medium">{preset.question}</p>
      </div>
      {step === 0 ? (
        <button type="button" onClick={() => setStep(1)}
          className="w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-white hover:opacity-90">
          Hỏi LLM (có RAG)
        </button>
      ) : (
        <div className="space-y-4">
          {/* 1 — Query highlighted */}
          {step >= 1 && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
              <StepBadge n={1} color="bg-blue-500" />
              <div className="rounded-lg border-2 border-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 text-sm font-medium text-blue-800 dark:text-blue-200">
                &quot;{preset.question}&quot;
              </div>
              {step > 1 && <span className="text-green-500 text-sm">&#10003;</span>}
            </motion.div>
          )}
          {/* 2 — Search documents */}
          {step >= 2 && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-2">
              <div className="flex items-center gap-3">
                <StepBadge n={2} color="bg-amber-500" />
                <span className="text-sm font-medium text-foreground">{step === 2 ? "Tìm kiếm tài liệu..." : "Tìm thấy tài liệu liên quan"}</span>
                {step > 2 && <span className="text-green-500 text-sm">&#10003;</span>}
              </div>
              <div className="ml-10 grid gap-2">
                {KB.slice(0, 3).map((doc, i) => {
                  const hit = preset.relevantDocs.includes(i);
                  return (
                    <motion.div key={doc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.2 }}
                      className={`rounded-lg border p-3 text-xs ${hit ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-600" : "border-border bg-card opacity-50"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-semibold ${hit ? "text-amber-700 dark:text-amber-300" : "text-muted"}`}>{doc.title}</span>
                        {hit && <span className="rounded-full bg-amber-200 dark:bg-amber-800 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-200">Liên quan</span>}
                      </div>
                      <p className="text-muted leading-relaxed line-clamp-2">{doc.content}</p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
          {/* 3 — Combine */}
          {step >= 3 && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
              <StepBadge n={3} color="bg-green-500" />
              <span className="text-sm font-medium text-foreground">Kết hợp với LLM...</span>
              {step >= 4 && textDone && <span className="text-green-500 text-sm">&#10003;</span>}
            </motion.div>
          )}
          {/* 4 — Answer */}
          {step >= 4 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="ml-10 space-y-3">
              <div className="rounded-lg bg-background/50 border border-border p-4">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{displayed}{!textDone && <Cursor />}</p>
              </div>
              {textDone && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-700 px-4 py-2.5">
                  <span className="text-lg">&#10003;</span>
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">Câu trả lời dựa trên tài liệu thật!</span>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Pipeline Builder ──────────────────────────────────────── */
function PipelineBuilder() {
  const [query, setQuery] = useState("Giá iPhone 16 ở Việt Nam bao nhiêu?");
  const p = PRESETS[0];
  const vec = [0.82, -0.15, 0.64, 0.33, -0.41, 0.91, -0.27, 0.58];
  return (
    <StepReveal labels={["Câu hỏi", "Embedding", "Tìm kiếm", "Context", "Sinh câu trả lời"]}>
      {/* 1 — Query */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <div className="flex items-center gap-2"><StepBadge n={1} color="bg-blue-500" /><span className="text-sm font-semibold text-foreground">Câu hỏi (Query)</span></div>
        <input type="text" value={query} onChange={e => setQuery(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent" />
        <p className="text-xs text-muted">Người dùng đặt câu hỏi bằng ngôn ngữ tự nhiên. Hệ thống sẽ biến câu này thành vector để tìm kiếm.</p>
      </div>
      {/* 2 — Embedding */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <div className="flex items-center gap-2"><StepBadge n={2} color="bg-purple-500" /><span className="text-sm font-semibold text-foreground">Embedding (Vector hoá)</span></div>
        <div className="rounded-lg bg-background/50 border border-border p-3">
          <p className="text-xs text-muted mb-2">&quot;{query}&quot; &rarr; Vector:</p>
          <div className="flex flex-wrap gap-1.5">
            {vec.map((v, i) => (
              <motion.span key={i} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1, type: "spring", stiffness: 300, damping: 20 }}
                className="inline-flex h-8 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30 text-xs font-mono font-medium text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
                {v.toFixed(2)}
              </motion.span>
            ))}
            <span className="inline-flex h-8 items-center text-xs text-muted">...</span>
          </div>
        </div>
        <p className="text-xs text-muted">Mô hình embedding chuyển câu hỏi thành vector số (thường 768-1536 chiều). Câu có nghĩa gần nhau sẽ có vector gần nhau.</p>
      </div>
      {/* 3 — Search */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <div className="flex items-center gap-2"><StepBadge n={3} color="bg-amber-500" /><span className="text-sm font-semibold text-foreground">Tìm kiếm (Retrieval)</span></div>
        <div className="space-y-2">
          {KB.map((doc, i) => {
            const s = p.scores[i], hit = p.relevantDocs.includes(i);
            return (
              <motion.div key={doc.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12 }}
                className={`rounded-lg border p-3 ${hit ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-600" : "border-border bg-background/50 opacity-60"}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${hit ? "text-amber-700 dark:text-amber-300" : "text-muted"}`}>{doc.title}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 rounded-full bg-surface overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${s * 100}%` }} transition={{ delay: i * 0.12 + 0.3, duration: 0.5 }}
                        className={`h-full rounded-full ${hit ? "bg-amber-500" : "bg-muted/50"}`} />
                    </div>
                    <span className={`text-[10px] font-mono ${hit ? "text-amber-600 dark:text-amber-400 font-bold" : "text-muted"}`}>{s.toFixed(2)}</span>
                  </div>
                </div>
                <p className="text-xs text-muted mt-1 line-clamp-1">{doc.content}</p>
              </motion.div>
            );
          })}
        </div>
        <p className="text-xs text-muted">So sánh vector câu hỏi với vector mỗi tài liệu (cosine similarity). Top-K tài liệu có điểm cao nhất được chọn.</p>
      </div>
      {/* 4 — Context */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <div className="flex items-center gap-2"><StepBadge n={4} color="bg-teal-500" /><span className="text-sm font-semibold text-foreground">Ghép Context</span></div>
        <div className="rounded-lg bg-background/50 border border-dashed border-accent/50 p-3 space-y-2 text-xs font-mono">
          <p className="text-accent font-semibold">System: Trả lời dựa trên tài liệu sau.</p>
          <div className="border-t border-border pt-2 space-y-1">
            {p.relevantDocs.map(idx => <p key={idx} className="text-amber-600 dark:text-amber-400">[{idx + 1}] {KB[idx].content}</p>)}
          </div>
          <div className="border-t border-border pt-2"><p className="text-blue-600 dark:text-blue-400">User: {query}</p></div>
        </div>
        <p className="text-xs text-muted">Tài liệu truy xuất được ghép cùng câu hỏi thành prompt cho LLM. Mỗi tài liệu được gán chỉ số [1], [2] để trích dẫn.</p>
      </div>
      {/* 5 — Generation */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <div className="flex items-center gap-2"><StepBadge n={5} color="bg-green-500" /><span className="text-sm font-semibold text-foreground">Sinh câu trả lời (Generation)</span></div>
        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 p-3">
          <p className="text-sm text-green-800 dark:text-green-200 leading-relaxed">{p.ragAnswer}</p>
        </div>
        <p className="text-xs text-muted">LLM đọc tài liệu + câu hỏi, rồi sinh câu trả lời có trích dẫn nguồn. Người dùng có thể kiểm chứng.</p>
      </div>
    </StepReveal>
  );
}

/* ── Quiz ──────────────────────────────────────────────────── */
const QUIZ: QuizQuestion[] = [
  { question: "RAG viết tắt của gì?",
    options: ["Retrieval-Augmented Generation", "Random Answer Generator", "Recursive Attention Graph", "Real-time AI Gateway"],
    correct: 0, explanation: "RAG = Retrieval-Augmented Generation: Sinh nội dung được tăng cường bằng truy xuất tài liệu." },
  { question: "Trong pipeline RAG, bước nào diễn ra TRƯỚC KHI LLM sinh câu trả lời?",
    options: ["Fine-tuning mô hình", "Truy xuất tài liệu liên quan từ knowledge base", "Huấn luyện lại embedding model", "Đánh giá câu trả lời bằng BLEU score"],
    correct: 1, explanation: "Trước khi sinh câu trả lời, hệ thống RAG phải truy xuất (retrieve) các tài liệu liên quan từ knowledge base." },
  { question: "RAG giúp giải quyết vấn đề nào của LLM?",
    options: ["Tốc độ inference chậm", "Chi phí training cao", "Hallucination - trả lời sai do thiếu dữ liệu thực tế", "Giới hạn context window"],
    correct: 2, explanation: "RAG giúp giảm hallucination bằng cách cho LLM tra cứu tài liệu thật trước khi trả lời." },
];

/* ── Main ──────────────────────────────────────────────────── */
export default function RAGTopic() {
  const [pi, setPi] = useState(0);
  return (
    <>
      {/* Step 1: HOOK */}
      <PredictionGate
        question="Bạn hỏi ChatGPT: 'Giá iPhone 16 ở Việt Nam bao nhiêu?' Nó trả lời tự tin nhưng SAI. Tại sao?"
        options={["AI không biết giá mới nhất", "AI ghét Apple", "AI cố tình sai"]}
        correct={0}
        explanation="LLM chỉ biết dữ liệu đến thời điểm huấn luyện. Để trả lời chính xác, nó cần TRA CỨU thông tin mới!"
      >
        <p className="mb-4 text-sm text-muted leading-relaxed">
          LLM không biết thông tin mới nhất — đó là vấn đề thật. Bây giờ hãy xem điều gì xảy ra khi bạn hỏi <strong className="text-foreground">MỘT</strong> câu hỏi, với và không có tài liệu tham khảo.
        </p>

      {/* Step 2: DISCOVER */}
      <VisualizationSection>
        <div className="space-y-5">
          <div>
            <p className="text-sm text-foreground mb-3 font-medium">Chọn câu hỏi để thử nghiệm:</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p, i) => (
                <button key={i} type="button" onClick={() => setPi(i)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    pi === i ? "bg-accent text-white" : "bg-surface text-muted hover:text-foreground hover:bg-surface-hover border border-border"}`}>
                  {p.question.slice(0, 30)}...
                </button>
              ))}
            </div>
          </div>
          <ToggleCompare labelA="Không có RAG" labelB="Có RAG"
            description="So sánh câu trả lời khi không có vs. có truy xuất tài liệu"
            childA={<WithoutRAG preset={PRESETS[pi]} key={`a-${pi}`} />}
            childB={<WithRAG preset={PRESETS[pi]} key={`b-${pi}`} />} />
        </div>
      </VisualizationSection>

      {/* Step 3: REVEAL */}
      <AhaMoment>
        <p>
          Quy trình <strong>Hỏi &rarr; Tra cứu &rarr; Trả lời</strong> bạn vừa thấy chính là{" "}
          <strong>RAG (Retrieval-Augmented Generation)</strong> &mdash; kỹ thuật giúp LLM tra cứu trước khi trả lời!
        </p>
      </AhaMoment>

      {/* Step 4: DEEPEN */}
      <VisualizationSection>
        <div className="space-y-3">
          <p className="text-sm text-foreground font-medium">Xây dựng pipeline RAG từng bước:</p>
          <PipelineBuilder />
        </div>
      </VisualizationSection>

      {/* Step 5: CHALLENGE */}
      <InlineChallenge
        question="RAG giúp giảm hallucination. Nhưng nếu tài liệu trong database cũng SAI thì sao?"
        options={["RAG vẫn đúng vì có retrieval", "RAG sẽ trả lời sai dựa trên tài liệu sai", "RAG tự kiểm tra tài liệu"]}
        correct={1}
        explanation="RAG chỉ tốt bằng chất lượng knowledge base. 'Garbage in, garbage out' vẫn đúng!" />

      {/* Step 6: EXPLAIN */}
      <ExplanationSection>
        <p>
          <strong>RAG (Retrieval-Augmented Generation)</strong> là kiến trúc kết hợp hệ thống truy xuất
          (retriever) tìm tài liệu liên quan, và mô hình sinh (generator) tạo câu trả lời dựa trên tài liệu đó.
        </p>
        <p><strong>Các thành phần chính:</strong></p>
        <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
          <li><strong>Embedding Model:</strong> Chuyển text thành vector (VD: text-embedding-3-small)</li>
          <li><strong>Vector Store:</strong> Lưu và tìm kiếm vector (VD: Pinecone, Chroma, FAISS)</li>
          <li><strong>Retriever:</strong> Tìm top-K tài liệu liên quan nhất</li>
          <li><strong>Generator (LLM):</strong> Sinh câu trả lời từ context + question</li>
        </ul>
        <p><strong>Ưu điểm so với LLM thuần:</strong></p>
        <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
          <li>Giảm hallucination nhờ neo vào dữ liệu thật</li>
          <li>Cập nhật kiến thức mà không cần fine-tune mô hình</li>
          <li>Câu trả lời có trích dẫn nguồn, kiểm chứng được</li>
          <li>Tiết kiệm chi phí hơn fine-tuning cho domain cụ thể</li>
        </ul>
        <CodeBlock language="python" title="RAG pipeline (LangChain)">
{`from langchain.vectorstores import Chroma
from langchain.embeddings import OpenAIEmbeddings
from langchain.chat_models import ChatOpenAI
from langchain.chains import RetrievalQA

# 1. Tạo vector store từ tài liệu
embeddings = OpenAIEmbeddings()
vectorstore = Chroma.from_documents(docs, embeddings)

# 2. Tạo retriever (top-3 tài liệu)
retriever = vectorstore.as_retriever(
    search_kwargs={"k": 3}
)

# 3. Tạo RAG chain
qa_chain = RetrievalQA.from_chain_type(
    llm=ChatOpenAI(model="gpt-4"),
    retriever=retriever,
    return_source_documents=True
)

# 4. Hỏi
result = qa_chain.invoke(
    "Giá iPhone 16 ở Việt Nam bao nhiêu?"
)
print(result["result"])
print(result["source_documents"])`}
        </CodeBlock>
        <Callout variant="insight" title="Các kỹ thuật RAG nâng cao">
          <ul className="list-disc list-inside space-y-1">
            <li><strong>HyDE:</strong> Tạo tài liệu giả để tìm kiếm chính xác hơn</li>
            <li><strong>Self-RAG:</strong> LLM tự quyết định khi nào cần tra cứu và tự đánh giá chất lượng</li>
            <li><strong>Corrective RAG:</strong> Kiểm tra và sửa tài liệu truy xuất trước khi đưa vào LLM</li>
            <li><strong>Multi-query RAG:</strong> Viết lại câu hỏi thành nhiều biến thể để tìm kiếm đa dạng hơn</li>
          </ul>
        </Callout>
      </ExplanationSection>

      {/* Step 7: SUMMARY */}
      <MiniSummary points={[
        "RAG = Retrieval-Augmented Generation: LLM tra cứu tài liệu trước khi trả lời",
        "Pipeline: Câu hỏi → Embedding → Tìm kiếm → Ghép Context → Sinh câu trả lời",
        "RAG giảm hallucination và cho phép cập nhật kiến thức mà không cần fine-tune",
        "Chất lượng RAG phụ thuộc vào knowledge base: tài liệu tốt → câu trả lời tốt",
      ]} />

      {/* Step 8: QUIZ */}
      <QuizSection questions={QUIZ} />
      </PredictionGate>
    </>
  );
}