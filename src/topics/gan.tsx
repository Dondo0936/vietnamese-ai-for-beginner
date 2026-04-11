"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PredictionGate, StepReveal, AhaMoment, InlineChallenge,
  Callout, MiniSummary, CodeBlock,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "gan",
  title: "Generative Adversarial Network",
  titleVi: "Mạng đối sinh",
  description: "Hai mạng cạnh tranh: Generator tạo dữ liệu giả, Discriminator phân biệt thật/giả",
  category: "dl-architectures",
  tags: ["generative", "unsupervised-learning", "adversarial"],
  difficulty: "advanced",
  relatedSlugs: ["vae", "autoencoder", "diffusion-models"],
  vizType: "interactive",
};

/* ── 8x8 Pixel Art Patterns ── */
const HEART: number[] = [
  0,0,0,0,0,0,0,0, 0,1,1,0,0,1,1,0,
  1,1,1,1,1,1,1,1, 1,1,1,1,1,1,1,1,
  0,1,1,1,1,1,1,0, 0,0,1,1,1,1,0,0,
  0,0,0,1,1,0,0,0, 0,0,0,0,0,0,0,0,
];
const STAR: number[] = [
  0,0,0,1,1,0,0,0, 0,0,0,1,1,0,0,0,
  0,1,1,1,1,1,1,0, 1,1,1,1,1,1,1,1,
  0,1,1,1,1,1,1,0, 0,0,1,1,1,1,0,0,
  0,1,1,0,0,1,1,0, 1,1,0,0,0,0,1,1,
];
const ARROW: number[] = [
  0,0,0,1,1,0,0,0, 0,0,1,1,1,1,0,0,
  0,1,1,1,1,1,1,0, 1,1,0,1,1,0,1,1,
  0,0,0,1,1,0,0,0, 0,0,0,1,1,0,0,0,
  0,0,0,1,1,0,0,0, 0,0,0,1,1,0,0,0,
];
const CROSS: number[] = [
  0,0,0,1,1,0,0,0, 0,0,0,1,1,0,0,0,
  0,0,0,1,1,0,0,0, 1,1,1,1,1,1,1,1,
  1,1,1,1,1,1,1,1, 0,0,0,1,1,0,0,0,
  0,0,0,1,1,0,0,0, 0,0,0,1,1,0,0,0,
];

const PATTERNS = [HEART, STAR, ARROW, CROSS];
const PAT_COLORS = ["#ec4899", "#f59e0b", "#3b82f6", "#22c55e"];
const PAT_NAMES = ["tim", "sao", "mũi tên", "dấu cộng"];
const ROUNDS = 8;

function makeFake(real: number[], round: number, seed: number): number[] {
  const noise = 1 - (round / (ROUNDS - 1)) * 0.85;
  return real.map((v, i) => {
    const h = ((seed * 31 + i * 17) % 100) / 100;
    return h < noise ? (h > 0.5 ? 1 : 0) : v;
  });
}

function seededBool(round: number, salt: number): boolean {
  return ((round * 7 + salt * 13) % 10) >= 5;
}

/* ── PixelGrid ── */
function PixelGrid({ data, color, size = 160, label }: {
  data: number[]; color: string; size?: number; label?: string;
}) {
  const c = size / 8;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        className="rounded-lg border border-border bg-background">
        {data.map((v, i) => (
          <rect key={i} x={(i % 8) * c} y={Math.floor(i / 8) * c}
            width={c - 1} height={c - 1} rx={2}
            fill={v ? color : "var(--bg-surface)"} opacity={v ? 0.85 : 0.25} />
        ))}
      </svg>
      {label && <span className="text-xs text-muted font-medium">{label}</span>}
    </div>
  );
}

const quizQuestions: QuizQuestion[] = [
  {
    question: "Trong GAN, Generator nhận đầu vào là gì?",
    options: ["Ảnh thật từ tập dữ liệu", "Vector nhiễu ngẫu nhiên z", "Kết quả từ Discriminator", "Label của ảnh"],
    correct: 1,
    explanation: "Generator nhận vector nhiễu z ~ N(0,1) và biến đổi nó thành dữ liệu giả. Nó không bao giờ thấy ảnh thật — chỉ học gián tiếp qua gradient từ Discriminator.",
  },
  {
    question: "Khi GAN đạt cân bằng Nash, Discriminator cho kết quả gì?",
    options: ["Luôn nói 'thật'", "Luôn nói 'giả'", "Xác suất 0.5 cho mọi ảnh", "Không chạy được nữa"],
    correct: 2,
    explanation: "Khi Generator hoàn hảo, Discriminator không thể phân biệt thật/giả nên cho xác suất 0.5 — tương đương đoán ngẫu nhiên.",
  },
  {
    question: "Diffusion Models đang dần thay thế GAN vì lý do gì?",
    options: ["Chạy nhanh hơn GAN", "Huấn luyện ổn định hơn, đa dạng hơn, không bị mode collapse", "Dùng ít dữ liệu hơn", "Không cần GPU"],
    correct: 1,
    explanation: "Diffusion Models huấn luyện ổn định hơn (không cần cân bằng 2 mạng), tạo ảnh đa dạng hơn (không bị mode collapse), và cho chất lượng tốt hơn ở nhiều tác vụ.",
  },
];

/* ── Main Component ── */
export default function GanTopic() {
  const [gameRound, setGameRound] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [scores, setScores] = useState<(boolean | null)[]>(() => Array(ROUNDS).fill(null));
  const [picked, setPicked] = useState<"left" | "right" | null>(null);
  const [trainStep, setTrainStep] = useState(0);
  const [trainRunning, setTrainRunning] = useState(false);

  const rd = useMemo(() => {
    const pi = gameRound % PATTERNS.length;
    const real = PATTERNS[pi];
    const fake = makeFake(real, gameRound, gameRound * 37 + 11);
    const realLeft = seededBool(gameRound, 42);
    return { real, fake, realLeft, color: PAT_COLORS[pi], pi };
  }, [gameRound]);

  const realSide = rd.realLeft ? "left" : "right";

  const handlePick = useCallback((side: "left" | "right") => {
    if (picked !== null) return;
    setPicked(side);
    setScores((prev) => { const n = [...prev]; n[gameRound] = side !== realSide; return n; });
  }, [picked, realSide, gameRound]);

  const handleNext = useCallback(() => {
    if (gameRound < ROUNDS - 1) { setGameRound((r) => r + 1); setPicked(null); }
    else setGameFinished(true);
  }, [gameRound]);

  const handleReset = useCallback(() => {
    setGameRound(0); setGameStarted(false); setGameFinished(false);
    setScores(Array(ROUNDS).fill(null)); setPicked(null);
  }, []);

  const stats = useMemo(() => {
    const pct = (arr: (boolean | null)[]) => {
      const valid = arr.filter((s): s is boolean => s !== null);
      return valid.length === 0 ? null : Math.round((valid.filter(Boolean).length / valid.length) * 100);
    };
    return { early: pct(scores.slice(0, 3)), mid: pct(scores.slice(3, 5)), late: pct(scores.slice(5, 8)) };
  }, [scores]);

  const totalCorrect = scores.filter((s) => s === true).length;
  const genQ = Math.min(95, 20 + trainStep * 15);
  const discA = Math.max(52, 95 - trainStep * 8);

  const handleTrain = useCallback(() => {
    if (trainRunning) return;
    setTrainRunning(true);
    setTrainStep((s) => Math.min(s + 1, 5));
    setTimeout(() => setTrainRunning(false), 600);
  }, [trainRunning]);

  const gridBtn = (side: "left" | "right") => {
    const isReal = (side === "left") === rd.realLeft;
    const data = isReal ? rd.real : rd.fake;
    const cls = picked === null
      ? "border-transparent hover:border-accent/50 cursor-pointer"
      : picked === side
        ? (picked !== realSide ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "border-red-400 bg-red-50 dark:bg-red-900/20")
        : (!isReal ? "border-green-500/40" : "border-transparent opacity-60");
    return (
      <button type="button" onClick={() => handlePick(side)} disabled={picked !== null}
        className={`rounded-xl p-3 border-2 transition-all ${cls}`}>
        <PixelGrid data={data} color={rd.color} label={side === "left" ? "Ảnh A" : "Ảnh B"} />
      </button>
    );
  };

  return (
    <>
      {/* Step 1: HOOK */}
      <PredictionGate
        question="Bạn nhìn 2 bức tranh. Một do hoạ sĩ vẽ, một do AI tạo. Bạn có thể phân biệt không?"
        options={["Dễ, AI vẽ xấu lắm", "Khó lắm, AI vẽ giống thật rồi", "Không thể vì AI giỏi hơn người"]}
        correct={1}
        explanation="AI sinh ảnh ngày nay rất giỏi — nhờ GAN, nơi AI 'giả mạo' và AI 'thám tử' cạnh tranh nhau!"
      >

      {/* Step 2: DISCOVER — User IS the Discriminator */}
      <VisualizationSection>
        {!gameStarted && !gameFinished && (
          <div className="text-center space-y-4">
            <p className="text-sm text-foreground leading-relaxed">
              Bạn sắp đóng vai <strong>Discriminator</strong> — thám tử phân biệt thật/giả.
              <br />Mỗi vòng bạn thấy 2 bức pixel art. Hãy chọn bức nào là <strong>giả</strong>!
            </p>
            <p className="text-xs text-muted">Qua 8 vòng, Generator sẽ ngày càng giỏi hơn. Bạn có giữ được độ chính xác?</p>
            <button type="button" onClick={() => setGameStarted(true)}
              className="rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90">
              Bắt đầu thử thách
            </button>
          </div>
        )}

        {gameStarted && !gameFinished && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Vòng {gameRound + 1}/{ROUNDS}</span>
              <div className="flex gap-1">
                {scores.map((s, i) => (
                  <div key={i} className={`h-2 w-5 rounded-full transition-colors ${
                    s === null ? "bg-surface" : s ? "bg-green-500" : "bg-red-400"}`} />
                ))}
              </div>
            </div>

            <p className="text-xs text-muted text-center">
              {gameRound < 2 ? "Generator mới bắt đầu học — dễ phát hiện"
                : gameRound < 5 ? "Generator đang cải thiện..." : "Generator gần hoàn hảo — rất khó phân biệt!"}
            </p>

            <div className="flex items-center justify-center gap-6 flex-wrap">
              {gridBtn("left")}
              <span className="text-muted text-lg font-bold">vs</span>
              {gridBtn("right")}
            </div>

            <p className="text-center text-sm font-medium text-accent">
              Nhấn vào ảnh bạn nghĩ là <strong>GIẢ</strong>
            </p>

            <AnimatePresence>
              {picked !== null && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="text-center space-y-3">
                  <p className={`text-sm font-semibold ${
                    picked !== realSide ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                    {picked !== realSide
                      ? "Chính xác! Bạn phát hiện được ảnh giả."
                      : `Sai rồi! Ảnh ${realSide === "left" ? "A" : "B"} mới là ảnh thật (hình ${PAT_NAMES[rd.pi]}).`}
                  </p>
                  <button type="button" onClick={handleNext}
                    className="rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90">
                    {gameRound < ROUNDS - 1 ? "Vòng tiếp" : "Xem kết quả"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {gameFinished && (
          <div className="space-y-5">
            <div className="text-center">
              <p className="text-2xl font-bold text-accent">{totalCorrect}/{ROUNDS}</p>
              <p className="text-sm text-muted">câu đúng</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {([["early", "Vòng 1-3", "text-green-600 dark:text-green-400"],
                 ["mid", "Vòng 4-5", "text-amber-600 dark:text-amber-400"],
                 ["late", "Vòng 6-8", "text-red-500"]] as const).map(([key, label, cls]) => (
                <div key={key} className="rounded-xl border border-border p-3">
                  <p className={`text-lg font-bold ${cls}`}>{stats[key] ?? "—"}%</p>
                  <p className="text-xs text-muted">{label}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-foreground text-center leading-relaxed">
              Generator ngày càng giỏi hơn, bạn (Discriminator) ngày càng khó phân biệt!
              <br />Đây chính là cách GAN hoạt động.
            </p>
            <div className="flex justify-center">
              <button type="button" onClick={handleReset}
                className="rounded-xl border border-border px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface">
                Chơi lại
              </button>
            </div>
          </div>
        )}
      </VisualizationSection>

      {/* Step 3: AHA MOMENT */}
      <AhaMoment>
        <p>
          Bạn vừa đóng vai <strong>Discriminator</strong> trong một <strong>GAN</strong>!
          Generator tạo ảnh giả, Discriminator (bạn) cố phân biệt.
          Hai bên cạnh tranh &rarr; ảnh giả ngày càng thật!
        </p>
      </AhaMoment>

      {/* Step 4: DEEPEN — GAN Architecture */}
      <VisualizationSection>
        <p className="text-sm text-muted mb-4">
          Vòng huấn luyện GAN: nhấn từng bước để thấy cách Generator và Discriminator học lẫn nhau.
        </p>
        <StepReveal labels={[
          "1. Noise -> Generator", "2. Discriminator phân biệt",
          "3. Tính loss & cập nhật", "4. Lặp lại nhiều lần",
        ]}>
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <div className="rounded-lg border border-border bg-card px-3 py-2 text-center">
                <p className="text-xs text-muted">Nhiễu z</p>
                <p className="text-lg font-mono font-bold text-foreground">z~N(0,1)</p>
              </div>
              <span className="text-accent font-bold">&rarr;</span>
              <div className="rounded-lg border-2 border-blue-400 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 text-center">
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">Generator</p>
                <p className="text-xs text-blue-500">(Mạng neural)</p>
              </div>
              <span className="text-accent font-bold">&rarr;</span>
              <div className="rounded-lg border border-border bg-card px-3 py-2 text-center">
                <p className="text-xs text-muted">Ảnh giả</p>
                <PixelGrid data={makeFake(HEART, 3, 77)} color="#ec4899" size={48} />
              </div>
            </div>
            <p className="text-xs text-muted text-center mt-3">Generator biến vector nhiễu ngẫu nhiên thành một bức ảnh.</p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <div className="space-y-1 text-center">
                <PixelGrid data={HEART} color="#ec4899" size={48} />
                <p className="text-xs text-green-600 font-medium">Thật</p>
              </div>
              <span className="text-muted">+</span>
              <div className="space-y-1 text-center">
                <PixelGrid data={makeFake(HEART, 3, 77)} color="#ec4899" size={48} />
                <p className="text-xs text-red-500 font-medium">Giả</p>
              </div>
              <span className="text-accent font-bold">&rarr;</span>
              <div className="rounded-lg border-2 border-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-2 text-center">
                <p className="text-sm font-bold text-red-600 dark:text-red-400">Discriminator</p>
                <p className="text-xs text-red-500">(Mạng phân loại)</p>
              </div>
              <span className="text-accent font-bold">&rarr;</span>
              <div className="rounded-lg border border-border bg-card px-3 py-2 text-center">
                <p className="text-sm font-bold text-foreground">Thật? Giả?</p>
                <p className="text-xs text-muted">P(real) = 0.73</p>
              </div>
            </div>
            <p className="text-xs text-muted text-center mt-3">Discriminator nhận cả ảnh thật lẫn giả, cố phân biệt chúng.</p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
            <div className="flex items-center gap-4 justify-center flex-wrap">
              <div className="rounded-lg border-2 border-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 text-center">
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400">Generator</p>
                <p className="text-xs text-blue-500">Cập nhật: tạo ảnh thật hơn</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-amber-600 font-bold">&larr; Loss &rarr;</p>
                <p className="text-xs text-muted">Gradient chảy ngược</p>
              </div>
              <div className="rounded-lg border-2 border-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-center">
                <p className="text-xs font-bold text-red-600 dark:text-red-400">Discriminator</p>
                <p className="text-xs text-red-500">Cập nhật: phân biệt tốt hơn</p>
              </div>
            </div>
            <p className="text-xs text-muted text-center">
              Loss được tính cho cả hai mạng. G học cách lừa D tốt hơn; D học cách phát hiện G tốt hơn.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4 space-y-4">
            <p className="text-sm text-foreground text-center font-medium">
              Chu trình lặp lại hàng nghìn lần &mdash; cả hai ngày càng giỏi hơn!
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 w-24 shrink-0">Generator</span>
                <div className="flex-1 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 overflow-hidden">
                  <motion.div className="h-full rounded-full bg-blue-500"
                    animate={{ width: `${genQ}%` }} transition={{ duration: 0.6, ease: "easeOut" }} />
                </div>
                <span className="text-xs font-mono text-foreground w-10 text-right">{genQ}%</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-red-600 dark:text-red-400 w-24 shrink-0">Discriminator</span>
                <div className="flex-1 h-5 rounded-full bg-red-100 dark:bg-red-900/30 overflow-hidden">
                  <motion.div className="h-full rounded-full bg-red-500"
                    animate={{ width: `${discA}%` }} transition={{ duration: 0.6, ease: "easeOut" }} />
                </div>
                <span className="text-xs font-mono text-foreground w-10 text-right">{discA}%</span>
              </div>
            </div>
            <p className="text-xs text-muted text-center">
              {trainStep === 0 ? "Generator dở, Discriminator dễ phân biệt."
                : trainStep < 3 ? "Generator cải thiện, Discriminator vẫn khá tốt."
                : trainStep < 5 ? "Hai bên tiến gần đến cân bằng..."
                : "Cân bằng Nash! D chỉ còn đoán ~50/50."}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button type="button" onClick={handleTrain} disabled={trainStep >= 5 || trainRunning}
                className="rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40">
                {trainRunning ? "Đang huấn luyện..." : trainStep >= 5 ? "Đã hội tụ" : `Huấn luyện (${trainStep}/5)`}
              </button>
              <button type="button" onClick={() => { setTrainStep(0); setTrainRunning(false); }}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground hover:bg-surface">
                Đặt lại
              </button>
            </div>
          </div>
        </StepReveal>
      </VisualizationSection>

      {/* Step 5: CHALLENGE */}
      <InlineChallenge
        question="Nếu Generator quá giỏi nhưng chỉ tạo được MỘT loại ảnh (luôn là mèo), vấn đề gì xảy ra?"
        options={["Không vấn đề gì", "Mode collapse — thiếu đa dạng", "Discriminator thắng"]}
        correct={1}
        explanation="Mode collapse là khi Generator chỉ học 1 pattern 'an toàn'. Đây là thách thức lớn nhất của GAN!"
      />

      {/* Step 6: EXPLAIN */}
      <ExplanationSection>
        <p>
          <strong>GAN (Generative Adversarial Network)</strong> gồm hai mạng huấn luyện đối kháng theo trò chơi minimax:
        </p>
        <CodeBlock language="math" title="Hàm mục tiêu Minimax">
{`min_G max_D  V(D, G) =
    E[log D(x)]           // D cố phân biệt ảnh thật
  + E[log(1 - D(G(z)))]   // D cố phát hiện ảnh giả

- D muốn tối đa V: phân biệt đúng thật/giả
- G muốn tối thiểu V: lừa D nghĩ ảnh giả là thật
- Cân bằng Nash: D(x) = 0.5 với mọi x`}
        </CodeBlock>
        <p>
          <strong>Vòng huấn luyện:</strong> Mỗi bước, ta huấn luyện D trước (cố định G),
          rồi huấn luyện G (cố định D). Hai mạng luân phiên cải thiện cho đến khi đạt
          cân bằng — hoặc phân kỳ nếu không cẩn thận.
        </p>
        <CodeBlock language="python" title="Training loop cơ bản">
{`for epoch in range(epochs):
    # 1. Huấn luyện Discriminator
    real = sample_real_data(batch_size)
    z = torch.randn(batch_size, latent_dim)
    fake = generator(z).detach()

    loss_D = -torch.mean(
        torch.log(discriminator(real))
        + torch.log(1 - discriminator(fake))
    )
    loss_D.backward()
    optimizer_D.step()

    # 2. Huấn luyện Generator
    z = torch.randn(batch_size, latent_dim)
    fake = generator(z)
    loss_G = -torch.mean(torch.log(discriminator(fake)))
    loss_G.backward()
    optimizer_G.step()`}
        </CodeBlock>
        <p><strong>Biến thể quan trọng:</strong></p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li><strong>StyleGAN</strong> — kiểm soát phong cách ở nhiều mức (tóc, khuôn mặt, nền). Tạo khuôn mặt siêu thực.</li>
          <li><strong>CycleGAN</strong> — chuyển đổi phong cách không cần cặp ảnh (ngựa &harr; ngựa vằn, ảnh &harr; tranh Monet).</li>
          <li><strong>Pix2Pix</strong> — biến đổi ảnh theo cặp (bản phác &rarr; ảnh thật, nhãn &rarr; ảnh đường phố).</li>
        </ul>
        <Callout variant="insight" title="Diffusion Models vs GAN">
          Từ 2022, Diffusion Models (DALL-E 2, Stable Diffusion, Midjourney) đang dần
          thay thế GAN cho nhiều tác vụ sinh ảnh. Lý do: huấn luyện ổn định hơn, không
          bị mode collapse, và cho kết quả đa dạng hơn. Tuy nhiên GAN vẫn nhanh hơn
          ở inference — quan trọng cho ứng dụng thời gian thực.
        </Callout>
      </ExplanationSection>

      {/* Step 7: MINI SUMMARY */}
      <MiniSummary points={[
        "GAN gồm Generator (tạo dữ liệu giả) và Discriminator (phân biệt thật/giả), huấn luyện đối kháng.",
        "Mục tiêu minimax: G cố lừa D, D cố phát hiện G — cạnh tranh đẩy cả hai tiến bộ.",
        "Thách thức lớn nhất: mode collapse (G chỉ tạo 1 loại), huấn luyện không ổn định.",
        "Biến thể: StyleGAN, CycleGAN, Pix2Pix. Diffusion Models đang dần thay thế GAN.",
      ]} />

      {/* Step 8: QUIZ */}
      <QuizSection questions={quizQuestions} />

      </PredictionGate>
    </>
  );
}
