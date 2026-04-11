"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, LaTeX,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "beam-search",
  title: "Beam Search",
  titleVi: "Beam Search - Tìm kiếm chùm tia",
  description:
    "Thuật toán giải mã giữ lại k ứng viên tốt nhất ở mỗi bước, cân bằng giữa chất lượng và tốc độ.",
  category: "nlp",
  tags: ["nlp", "decoding", "search"],
  difficulty: "intermediate",
  relatedSlugs: ["gpt", "seq2seq", "attention-mechanism"],
  vizType: "interactive",
};

/* ── Constants ── */
const TOTAL_STEPS = 8;

interface BeamPath {
  words: string[];
  prob: number;
  kept: boolean;
}

const STEP_DATA: BeamPath[][] = [
  // Step 1: first word
  [
    { words: ["Phở"], prob: 0.50, kept: true },
    { words: ["Bún"], prob: 0.30, kept: true },
    { words: ["Cơm"], prob: 0.15, kept: false },
    { words: ["Bánh"], prob: 0.05, kept: false },
  ],
  // Step 2: second word
  [
    { words: ["Phở", "ngon"], prob: 0.35, kept: true },
    { words: ["Phở", "bò"], prob: 0.10, kept: false },
    { words: ["Bún", "chả"], prob: 0.25, kept: true },
    { words: ["Bún", "bò"], prob: 0.04, kept: false },
  ],
  // Step 3: third word
  [
    { words: ["Phở", "ngon", "tuyệt"], prob: 0.28, kept: true },
    { words: ["Phở", "ngon", "nhất"], prob: 0.05, kept: false },
    { words: ["Bún", "chả", "Hà"], prob: 0.22, kept: true },
    { words: ["Bún", "chả", "ngon"], prob: 0.02, kept: false },
  ],
];

const QUIZ: QuizQuestion[] = [
  {
    question: "Beam width = 1 tương đương thuật toán nào?",
    options: [
      "Exhaustive search",
      "Greedy search — luôn chọn token xác suất cao nhất",
      "Random sampling",
      "Temperature sampling",
    ],
    correct: 1,
    explanation:
      "Beam width = 1 = chỉ giữ 1 ứng viên = luôn chọn token tốt nhất → Greedy search! Đơn giản nhưng dễ sa vào local optimum.",
  },
  {
    question: "Tại sao beam search cần 'length penalty'?",
    options: [
      "Để câu ngắn hơn",
      "Vì câu ngắn có tích xác suất cao hơn (ít phép nhân), beam search sẽ thiên vị câu ngắn",
      "Để tăng tốc độ",
      "Để giảm bộ nhớ",
    ],
    correct: 1,
    explanation:
      "P(câu) = tích xác suất mỗi token. Càng nhiều token (mỗi < 1) → tích càng nhỏ. Length penalty chia cho độ dài^α để công bằng giữa câu dài và ngắn.",
  },
  {
    question: "ChatGPT dùng beam search hay sampling? Tại sao?",
    options: [
      "Beam search — vì chất lượng cao nhất",
      "Sampling (top-p/temperature) — v�� cần sự đa dạng, sáng tạo trong hội thoại",
      "Greedy search — vì đơn giản nhất",
      "Không dùng thuật toán giải mã",
    ],
    correct: 1,
    explanation:
      "Chatbot cần đa dạng: cùng câu hỏi, mỗi lần trả lời khác. Beam search luôn cho cùng kết quả → nhàm chán! Sampling + temperature tạo sự bất ngờ, tự nhiên hơn.",
  },
];

/* ── Main Component ── */
export default function BeamSearchTopic() {
  const [beamWidth, setBeamWidth] = useState(2);
  const [stepIdx, setStepIdx] = useState(0);

  const currentPaths = useMemo(() => {
    return STEP_DATA[stepIdx].map((path) => ({
      ...path,
      kept: STEP_DATA[stepIdx]
        .sort((a, b) => b.prob - a.prob)
        .indexOf(path) < beamWidth,
    }));
  }, [stepIdx, beamWidth]);

  return (
    <>
      {/* ── Step 1: PredictionGate ── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Thử thách">
        <PredictionGate
          question={`GPT đang sinh câu về ẩm thực. Bước 1 có 4 ứng viên: "Phở" (50%), "Bún" (30%), "Cơm" (15%), "Bánh" (5%). Greedy chọn 1 từ tốt nhất, nhưng nếu giữ 2 thì sao?`}
          options={[
            'Greedy: chỉ giữ "Phở" (50%) — nhanh nhưng bỏ lỡ "Bún chả" hay',
            'Giữ cả 4 — chắc chắn nhất',
            'Giữ 2: "Phở" + "Bún" — cân bằng chất lượng và tốc độ',
          ]}
          correct={2}
          explanation={`Giữ 2 ứng viên tốt nhất (beam width = 2): "Phở" và "Bún". Cả hai tiếp tục mở rộng. Có thể "Bún chả Hà Nội" hay hơn "Phở bò"! Beam Search giữ k lựa chọn song song, không bỏ trứng vào 1 giỏ.`}
        />
      </LessonSection>

      {/* ── Step 2: Interactive Viz ── */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Kéo thanh beam width và nhấn qua từng bước để xem thuật toán giữ lại ứng viên nào. Hàng xanh = được giữ, hàng mờ = bị loại.
        </p>

        <VisualizationSection>
          <div className="space-y-5">
            {/* Controls */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted">
                  Beam width (k): <span className="text-accent font-bold">{beamWidth}</span>
                </label>
                <input type="range" min="1" max="4" step="1" value={beamWidth}
                  onChange={(e) => setBeamWidth(parseInt(e.target.value))}
                  className="w-full accent-accent" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted">
                  Bước: <span className="text-accent font-bold">{stepIdx + 1}</span> / {STEP_DATA.length}
                </label>
                <div className="flex gap-2">
                  {STEP_DATA.map((_, i) => (
                    <button key={i} type="button" onClick={() => setStepIdx(i)}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                        stepIdx === i ? "bg-accent text-white" : "bg-card border border-border text-muted"
                      }`}>
                      Bước {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Beam paths */}
            <div className="space-y-2">
              {currentPaths
                .sort((a, b) => b.prob - a.prob)
                .map((path, i) => {
                  const isKept = i < beamWidth;
                  return (
                    <motion.div
                      key={path.words.join("-")}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: isKept ? 1 : 0.35, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${
                        isKept ? "border-accent bg-accent/5" : "border-border bg-card"
                      }`}
                    >
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        isKept ? "bg-accent text-white" : "bg-surface text-muted"
                      }`}>
                        {i + 1}
                      </span>
                      <div className="flex gap-1 flex-1">
                        {path.words.map((w, wi) => (
                          <span key={wi} className={`rounded px-2 py-0.5 text-sm font-semibold ${
                            isKept ? "bg-accent/20 text-accent" : "bg-surface text-muted"
                          }`}>
                            {w}
                          </span>
                        ))}
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-bold ${isKept ? "text-accent" : "text-muted"}`}>
                          {(path.prob * 100).toFixed(0)}%
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        isKept ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                      }`}>
                        {isKept ? "Giữ" : "Loại"}
                      </span>
                    </motion.div>
                  );
                })}
            </div>

            <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
              <p className="text-sm text-muted">
                Beam width = <strong className="text-accent">{beamWidth}</strong>: giữ {beamWidth} ứng viên tốt nhất.{" "}
                {beamWidth === 1 ? "= Greedy search! Nhanh nhưng thiếu khám phá." :
                 beamWidth >= 4 ? "Khám phá rộng nhưng chậm hơn." :
                 "Cân bằng tốt giữa chất lượng và tốc độ!"}
              </p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ── Step 3: AhaMoment ── */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          <p>
            <strong>Beam Search</strong>{" "}
            giữ k con đường tốt nhất song song, không {'"đặt cược"'} vào 1 lựa chọn duy nhất. Giống đội thám hiểm chia nhóm — nhóm nào tìm được đường tốt nhất thì thắng!
          </p>
          <p className="text-sm text-muted mt-1">
            k = 1 → Greedy (nhanh, kém). k = lớn → gần exhaustive (chậm, tốt). k = 4-10 thường là sweet spot.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ── Step 4: InlineChallenge ── */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <InlineChallenge
          question="Beam search luôn cho kết quả GIỐNG NHAU cùng input. ChatGPT thì mỗi lần trả lời khác. ChatGPT dùng gì?"
          options={[
            "Beam search với beam rất lớn",
            "Sampling (top-p) — chọn ngẫu nhiên từ phân phối xác suất, tạo sự đa dạng",
            "Greedy search + random seed",
          ]}
          correct={1}
          explanation="Beam search deterministic → luôn cùng output. ChatGPT dùng nucleus sampling (top-p): chọn ngẫu nhiên từ top-p% xác suất → đa dạng, tự nhiên. Temperature điều chỉnh mức ngẫu nhiên."
        />
      </LessonSection>

      {/* ── Step 5: Comparison ── */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="So sánh phương pháp">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { name: "Greedy (k=1)", pros: "Cực nhanh", cons: "Hay bỏ lỡ câu tốt hơn", use: "Draft nhanh", color: "#ef4444" },
            { name: "Beam (k=4-10)", pros: "Chất lượng cao, ổn định", cons: "Chậm hơn, luôn cùng output", use: "Dịch máy, tóm tắt", color: "#3b82f6" },
            { name: "Sampling", pros: "Đa dạng, sáng tạo", cons: "Kém ổn định", use: "ChatGPT, sáng tạo", color: "#22c55e" },
          ].map((m) => (
            <div key={m.name} className="rounded-xl border p-4 space-y-2" style={{ borderColor: m.color + "40" }}>
              <p className="font-semibold text-sm" style={{ color: m.color }}>{m.name}</p>
              <p className="text-xs text-foreground"><strong>Ưu:</strong>{" "}{m.pros}</p>
              <p className="text-xs text-foreground"><strong>Nhược:</strong>{" "}{m.cons}</p>
              <p className="text-xs text-muted"><strong>Dùng cho:</strong>{" "}{m.use}</p>
            </div>
          ))}
        </div>
      </LessonSection>

      {/* ── Step 6: Explanation ── */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Beam Search</strong>{" "}
            giữ k chuỗi ứng viên (beams) tốt nhất ở mỗi bước, mở rộng song song cho đến khi tất cả kết thúc hoặc đạt độ dài tối đa.
          </p>

          <Callout variant="insight" title="Thuật toán Beam Search">
            <div className="space-y-2">
              <p className="font-medium">Score cho mỗi chuỗi (có length penalty):</p>
              <LaTeX display>{`\\text{score}(Y) = \\frac{1}{|Y|^{\\alpha}} \\sum_{t=1}^{|Y|} \\log P(y_t | y_{<t}, X)`}</LaTeX>
              <p className="text-sm">
                Với <LaTeX>{`\\alpha`}</LaTeX>{" "}
                = length penalty (thường 0.6-1.0). <LaTeX>{`\\alpha = 0`}</LaTeX>{" "}
                → không penalty (thiên vị câu ngắn). <LaTeX>{`\\alpha = 1`}</LaTeX>{" "}
                → chia đều cho độ dài.
              </p>
            </div>
          </Callout>

          <Callout variant="info" title="Nucleus Sampling (Top-p)">
            <p>Thay vì chọn k tốt nhất, sampling chọn ngẫu nhiên từ phân phối:</p>
            <LaTeX display>{`p'(w) = \\frac{p(w)}{\\sum_{w' \\in V_p} p(w')} \\quad \\text{với } V_p = \\{w : \\sum_{w' \\leq w} p(w') \\leq p\\}`}</LaTeX>
            <p className="mt-2 text-sm">
              Top-p = 0.9: chỉ chọn từ top 90% xác suất. Kết hợp temperature (T) điều chỉnh {'"độ sáng tạo"'}.
            </p>
          </Callout>

          <CodeBlock language="python" title="beam_search_demo.py">
{`from transformers import pipeline

generator = pipeline("text-generation", model="gpt2")

prompt = "Phở Hà Nội"

# 1. Greedy (beam_width = 1)
greedy = generator(prompt, max_length=20,
                   num_beams=1, do_sample=False)
# "Phở Hà Nội rất ngon và nổi tiếng..."

# 2. Beam Search (beam_width = 5)
beam = generator(prompt, max_length=20,
                 num_beams=5, do_sample=False)
# "Phở Hà Nội là món ăn tuyệt vời nhất..."

# 3. Nucleus Sampling (top_p = 0.9)
sample = generator(prompt, max_length=20,
                   do_sample=True, top_p=0.9,
                   temperature=0.8)
# "Phở Hà Nội có hương vị đặc biệt..."
# (Mỗi lần chạy cho kết quả khác!)

# 4. Beam + Length penalty
beam_lp = generator(prompt, max_length=30,
                    num_beams=5, length_penalty=1.5)
# Câu dài hơn vì length_penalty > 1 ưu tiên câu dài`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      {/* ── Step 7: MiniSummary ── */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về Beam Search"
          points={[
            "Beam Search giữ k ứng viên tốt nhất song song (k = beam width).",
            "k=1 → Greedy (nhanh, kém). k=4-10 → sweet spot. k=lớn → gần exhaustive (chậm).",
            "Length penalty chia cho |Y|^α đ�� tránh thiên vị câu ngắn.",
            "Dịch máy/tóm tắt → beam search. ChatGPT → sampling (top-p + temperature).",
            "Beam search deterministic (cùng input → cùng output), sampling tạo đa dạng.",
          ]}
        />
      </LessonSection>

      {/* ── Step 8: Quiz ── */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
