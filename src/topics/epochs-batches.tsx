"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
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
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "epochs-batches",
  title: "Epochs & Batches",
  titleVi: "Epoch và Batch",
  description:
    "Cách dữ liệu được chia thành lô và lặp lại nhiều vòng trong quá trình huấn luyện.",
  category: "neural-fundamentals",
  tags: ["training", "fundamentals"],
  difficulty: "beginner",
  relatedSlugs: ["sgd", "gradient-descent", "learning-rate"],
  vizType: "interactive",
};

/* ---------- constants ---------- */
const TOTAL_SAMPLES = 12;
const TOTAL_EPOCHS = 3;
const COLORS = [
  "#3b82f6",
  "#ef4444",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#6366f1",
  "#84cc16",
  "#06b6d4",
  "#e11d48",
];

const SVG_W = 480;
const SVG_H = 200;
const SAMPLE_R = 16;
const SAMPLES_PER_ROW = 6;

/* ---------- main component ---------- */
export default function EpochsBatchesTopic() {
  const [batchSize, setBatchSize] = useState(4);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const numBatches = Math.ceil(TOTAL_SAMPLES / batchSize);
  const totalUpdates = currentEpoch > 0
    ? (currentEpoch - 1) * numBatches + (currentBatch >= 0 ? currentBatch + 1 : 0)
    : 0;

  // Which samples are in the current batch
  const currentBatchSamples = useMemo(() => {
    if (currentBatch < 0) return [];
    return Array.from(
      { length: batchSize },
      (_, i) => currentBatch * batchSize + i
    ).filter((i) => i < TOTAL_SAMPLES);
  }, [currentBatch, batchSize]);

  const runAnimation = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    setCurrentEpoch(1);
    setCurrentBatch(0);

    let epoch = 1;
    let batch = 0;

    intervalRef.current = setInterval(() => {
      batch++;
      if (batch >= numBatches) {
        batch = 0;
        epoch++;
        if (epoch > TOTAL_EPOCHS) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsRunning(false);
          return;
        }
      }
      setCurrentEpoch(epoch);
      setCurrentBatch(batch);
    }, 700);
  }, [isRunning, numBatches]);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setCurrentEpoch(0);
    setCurrentBatch(-1);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  /* Quiz */
  const quizQuestions: QuizQuestion[] = [
    {
      question:
        "Dataset 10.000 mẫu, batch_size = 100, train 5 epoch. Tổng cộng bao nhiêu lần cập nhật trọng số?",
      options: [
        "50 (5 × 10)",
        "500 (10.000/100 × 5)",
        "50.000 (10.000 × 5)",
        "100 (10.000/100)",
      ],
      correct: 1,
      explanation:
        "Mỗi epoch: 10.000/100 = 100 bước cập nhật. 5 epoch = 100 × 5 = 500 lần cập nhật. Đây là công thức: iterations = (samples / batch_size) × epochs.",
    },
    {
      question:
        "Tại sao thường shuffle (xáo trộn) dữ liệu trước mỗi epoch?",
      options: [
        "Để mô hình chạy nhanh hơn",
        "Để mỗi batch khác nhau qua các epoch → gradient đa dạng hơn → hội tụ tốt hơn, giảm overfit",
        "Vì GPU yêu cầu dữ liệu ngẫu nhiên",
        "Shuffle không quan trọng — chỉ là thói quen",
      ],
      correct: 1,
      explanation:
        "Nếu không shuffle, mô hình luôn thấy cùng thứ tự → có thể học pattern thứ tự thay vì nội dung. Shuffle đảm bảo mỗi batch mỗi epoch khác nhau → gradient đa dạng, hội tụ tốt hơn.",
    },
    {
      question:
        "Bạn có GPU 16GB. Ảnh độ phân giải cao khiến batch_size = 2 là tối đa. Có vấn đề gì và cách giải quyết?",
      options: [
        "Không vấn đề — batch nhỏ là tốt",
        "Gradient quá noisy (chỉ 2 mẫu). Dùng gradient accumulation: tích lũy gradient qua nhiều batch nhỏ trước khi cập nhật",
        "Giảm kích thước ảnh là cách duy nhất",
      ],
      correct: 1,
      explanation:
        "Gradient accumulation: forward+backward 8 lần với batch=2, tích lũy gradient, rồi cập nhật 1 lần. Hiệu quả = batch_size = 16 nhưng chỉ cần RAM cho 2 mẫu. Kỹ thuật phổ biến cho LLM!",
    },
  ];

  return (
    <>
      {/* ===== STEP 1: PREDICTION GATE ===== */}
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Bạn dạy võ cho 12 học trò. Không thể hướng dẫn cả 12 cùng lúc. Cách tốt nhất để tất cả đều thành thạo?"
          options={[
            "Dạy cả 12 người cùng lúc (batch = 12) — 1 buổi xong",
            "Dạy từng người một (batch = 1) — kỹ nhưng cực chậm",
            "Chia nhóm 4 người, dạy lần lượt, rồi cho cả lớp lặp lại nhiều vòng (batch = 4, nhiều epoch)",
            "Chỉ dạy 4 người giỏi nhất — bỏ 8 người còn lại",
          ]}
          correct={2}
          explanation="Chia nhóm (batch) + lặp lại nhiều vòng (epoch) = cách deep learning hoạt động! Mỗi batch cập nhật trọng số 1 lần, mỗi epoch duyệt toàn bộ dữ liệu."
        >
          <p className="mt-4 text-sm text-muted leading-relaxed">
            Bây giờ hãy tự tay điều chỉnh batch size và xem dữ liệu được chia nhóm
            rồi lặp lại qua nhiều epoch như thế nào. Nhấn{" "}
            <strong className="text-foreground">Chạy 3 epoch</strong> để xem hoạt hình.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ===== STEP 2: INTERACTIVE VISUALIZATION ===== */}
      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-4">
            {/* Batch size slider */}
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[180px] space-y-1">
                <label className="text-sm font-medium text-muted">
                  Batch size:{" "}
                  <strong className="text-foreground">{batchSize}</strong>
                  <span className="ml-2 text-xs text-muted">
                    ({numBatches} batch/epoch)
                  </span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="12"
                  step="1"
                  value={batchSize}
                  onChange={(e) => {
                    setBatchSize(parseInt(e.target.value));
                    reset();
                  }}
                  className="w-full accent-accent"
                  disabled={isRunning}
                />
                <div className="flex justify-between text-xs text-muted">
                  <span>1 (SGD thuần)</span>
                  <span>4-6 (Mini-batch)</span>
                  <span>12 (Batch GD)</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={reset}
                  className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
                >
                  Đặt lại
                </button>
                <button
                  onClick={runAnimation}
                  disabled={isRunning}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {isRunning ? "Đang chạy..." : "Chạy 3 epoch"}
                </button>
              </div>
            </div>

            {/* Status counters */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
                <p className="text-xs text-muted">Epoch</p>
                <p className="text-lg font-bold text-foreground">
                  {currentEpoch}/{TOTAL_EPOCHS}
                </p>
              </div>
              <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
                <p className="text-xs text-muted">Batch</p>
                <p className="text-lg font-bold text-foreground">
                  {currentBatch >= 0 ? currentBatch + 1 : 0}/
                  {numBatches}
                </p>
              </div>
              <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
                <p className="text-xs text-muted">Tổng cập nhật</p>
                <p className="text-lg font-bold text-accent">
                  {totalUpdates}
                </p>
              </div>
            </div>

            {/* Data samples visualization */}
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              className="w-full max-w-xl mx-auto"
            >
              <text
                x={SVG_W / 2}
                y={18}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="11"
              >
                Tập dữ liệu ({TOTAL_SAMPLES} mẫu)
              </text>

              {/* Samples grid */}
              {Array.from({ length: TOTAL_SAMPLES }, (_, i) => {
                const row = Math.floor(i / SAMPLES_PER_ROW);
                const col = i % SAMPLES_PER_ROW;
                const cx = 80 + col * (SAMPLE_R * 2 + 20);
                const cy = 55 + row * (SAMPLE_R * 2 + 20);
                const isActive = currentBatchSamples.includes(i);
                const batchGroup = Math.floor(i / batchSize);
                const groupColor = COLORS[batchGroup % COLORS.length];

                return (
                  <g key={`s-${i}`}>
                    <motion.circle
                      cx={cx}
                      cy={cy}
                      r={SAMPLE_R}
                      fill={isActive ? groupColor : "#1e293b"}
                      stroke={
                        isActive ? groupColor : "#475569"
                      }
                      strokeWidth={isActive ? 3 : 1.5}
                      initial={false}
                      animate={{
                        scale: isActive ? 1.2 : 1,
                        fill: isActive ? groupColor : "#1e293b",
                      }}
                      transition={{ duration: 0.2 }}
                    />
                    <text
                      x={cx}
                      y={cy + 4}
                      textAnchor="middle"
                      fill={isActive ? "white" : "#64748b"}
                      fontSize="10"
                      fontWeight={isActive ? "bold" : "normal"}
                      className="pointer-events-none select-none"
                    >
                      {i + 1}
                    </text>
                  </g>
                );
              })}

              {/* Batch labels */}
              {currentBatch >= 0 &&
                Array.from({ length: numBatches }, (_, b) => {
                  const startIdx = b * batchSize;
                  const endIdx = Math.min(
                    startIdx + batchSize - 1,
                    TOTAL_SAMPLES - 1
                  );
                  const startRow = Math.floor(startIdx / SAMPLES_PER_ROW);
                  const startCol = startIdx % SAMPLES_PER_ROW;
                  const endCol = endIdx % SAMPLES_PER_ROW;
                  const isActiveBatch = b === currentBatch;

                  if (endIdx - startIdx < SAMPLES_PER_ROW) {
                    const x1 =
                      80 + startCol * (SAMPLE_R * 2 + 20) - SAMPLE_R - 4;
                    const x2 =
                      80 + endCol * (SAMPLE_R * 2 + 20) + SAMPLE_R + 4;
                    const y =
                      55 + startRow * (SAMPLE_R * 2 + 20) + SAMPLE_R + 10;
                    return (
                      <text
                        key={`bl-${b}`}
                        x={(x1 + x2) / 2}
                        y={y + 6}
                        textAnchor="middle"
                        fill={
                          isActiveBatch
                            ? COLORS[b % COLORS.length]
                            : "#475569"
                        }
                        fontSize="8"
                        fontWeight={isActiveBatch ? "bold" : "normal"}
                      >
                        Batch {b + 1}
                      </text>
                    );
                  }
                  return null;
                })}
            </svg>

            {/* Epoch progress bars */}
            <div className="space-y-2">
              <p className="text-xs text-muted text-center">
                Tiến trình epoch
              </p>
              <div className="flex gap-1">
                {Array.from({ length: TOTAL_EPOCHS }, (_, e) => (
                  <div key={`ep-${e}`} className="flex-1">
                    <div className="h-3 rounded-full bg-card border border-border overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor:
                            COLORS[e % COLORS.length],
                        }}
                        initial={{ width: "0%" }}
                        animate={{
                          width:
                            currentEpoch > e + 1
                              ? "100%"
                              : currentEpoch === e + 1
                                ? `${((currentBatch + 1) / numBatches) * 100}%`
                                : "0%",
                        }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <p className="text-center text-xs text-muted mt-1">
                      Epoch {e + 1}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ===== STEP 3: AHA MOMENT ===== */}
      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>Epoch</strong> = 1 vòng qua toàn bộ dữ liệu.{" "}
            <strong>Batch</strong> = 1 lô nhỏ, cập nhật trọng số 1 lần.{" "}
            <strong>Iteration</strong> = 1 lần cập nhật. Giống đội Shopee giao hàng:
            mỗi xe chở 1 batch đơn hàng, khi tất cả đơn được giao = xong 1 epoch,
            lặp lại nếu có đơn mới!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ===== STEP 4: INLINE CHALLENGE ===== */}
      <LessonSection step={4} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Dataset ImageNet: 1.2 triệu ảnh, batch_size = 256. Mỗi epoch có bao nhiêu lần cập nhật trọng số?"
          options={[
            "256 lần",
            "Khoảng 4.688 lần (1.200.000 / 256)",
            "1.200.000 lần (mỗi ảnh 1 lần)",
          ]}
          correct={1}
          explanation="1.200.000 / 256 ≈ 4.688 bước cập nhật mỗi epoch. Nếu train 90 epoch (tiêu chuẩn ResNet): 4.688 × 90 ≈ 422.000 lần cập nhật tổng cộng!"
        />
      </LessonSection>

      {/* ===== STEP 5: EXPLANATION ===== */}
      <LessonSection step={5} totalSteps={8} label="Giải thích">
        <ExplanationSection>
          <p>
            Ba khái niệm cốt lõi của training loop:
          </p>

          <LaTeX block>
            {"\\text{iterations} = \\frac{N}{B} \\times E"}
          </LaTeX>
          <p>
            Với N = tổng số mẫu, B = batch size, E = số epoch.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 font-semibold text-foreground">
                    Khái niệm
                  </th>
                  <th className="text-left py-2 pr-3 font-semibold text-foreground">
                    Định nghĩa
                  </th>
                  <th className="text-left py-2 font-semibold text-foreground">
                    Ví dụ (N=1000, B=100)
                  </th>
                </tr>
              </thead>
              <tbody className="text-foreground/80">
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">Batch</td>
                  <td className="py-2 pr-3">
                    Nhóm B mẫu → 1 lần cập nhật trọng số
                  </td>
                  <td className="py-2">100 mẫu mỗi batch</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">Iteration</td>
                  <td className="py-2 pr-3">1 lần forward + backward + update</td>
                  <td className="py-2">10 iterations/epoch</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">Epoch</td>
                  <td className="py-2 pr-3">1 vòng qua toàn bộ N mẫu</td>
                  <td className="py-2">
                    1 epoch = 10 iterations
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-medium">Shuffle</td>
                  <td className="py-2 pr-3">
                    Xáo trộn thứ tự trước mỗi epoch
                  </td>
                  <td className="py-2">
                    Batch khác nhau mỗi epoch
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <Callout variant="tip" title="Batch size ảnh hưởng gì?">
            <strong>Nhỏ (8-32):</strong>{" "}
            gradient noisy → regularization tự nhiên, nhưng chậm trên GPU.
            <br />
            <strong>Lớn (128-512):</strong>{" "}
            gradient ổn, GPU chạy hiệu quả, nhưng cần tăng LR và dễ overfit.
            <br />
            <strong>Bắt đầu với 32 hoặc 64</strong> — tăng dần nếu GPU còn RAM.
          </Callout>

          <CodeBlock language="python" title="training_loop.py">
{`from torch.utils.data import DataLoader

# DataLoader tự chia batch và shuffle
loader = DataLoader(
    dataset,
    batch_size=64,     # mỗi batch 64 mẫu
    shuffle=True,      # xáo trộn trước mỗi epoch
    num_workers=4,     # 4 CPU threads load dữ liệu
    pin_memory=True,   # tăng tốc CPU→GPU transfer
)

for epoch in range(100):                  # 100 epoch
    for batch_x, batch_y in loader:       # duyệt từng batch
        pred = model(batch_x)             # forward
        loss = loss_fn(pred, batch_y)     # tính loss
        loss.backward()                   # backward
        optimizer.step()                  # cập nhật trọng số
        optimizer.zero_grad()             # xóa gradient cũ

# Gradient Accumulation (khi GPU không đủ RAM)
accum_steps = 4  # tích lũy 4 batch trước khi update
for i, (x, y) in enumerate(loader):
    loss = loss_fn(model(x), y) / accum_steps
    loss.backward()  # tích lũy gradient
    if (i + 1) % accum_steps == 0:
        optimizer.step()       # update sau 4 batch
        optimizer.zero_grad()  # xóa gradient`}
          </CodeBlock>

          <Callout variant="insight" title="Gradient Accumulation cho GPU nhỏ">
            GPU 8GB không chứa được batch_size = 256? Dùng gradient accumulation:
            forward+backward 4 lần với batch = 64, tích lũy gradient, rồi update 1 lần.
            Hiệu quả = batch 256 nhưng chỉ cần RAM cho 64. Kỹ thuật bắt buộc khi train LLM!
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ===== STEP 6: CHALLENGE 2 ===== */}
      <LessonSection step={6} totalSteps={8} label="Thử thách nâng cao">
        <InlineChallenge
          question="Bạn train với batch_size=32 nhưng quên shuffle=True. Sau 10 epoch, mô hình có vấn đề gì?"
          options={[
            "Không vấn đề — shuffle chỉ ảnh hưởng tốc độ",
            "Mô hình có thể học pattern thứ tự dữ liệu thay vì nội dung, gradient ít đa dạng → hội tụ chậm hoặc overfit",
            "Mô hình train nhanh hơn vì không tốn thời gian shuffle",
          ]}
          correct={1}
          explanation="Không shuffle → mỗi epoch batch giống hệt nhau → gradient cùng pattern → mô hình có thể 'nhớ' thứ tự thay vì học nội dung. Luôn shuffle=True cho training data!"
        />
      </LessonSection>

      {/* ===== STEP 7: MINI SUMMARY ===== */}
      <LessonSection step={7} totalSteps={8} label="Tóm tắt">
        <MiniSummary
          title="Epochs & Batches — Điểm chốt"
          points={[
            "Batch = 1 lô nhỏ dữ liệu → 1 lần cập nhật trọng số. Epoch = 1 vòng qua toàn bộ dữ liệu.",
            "Iterations = (N / batch_size) × epochs. ImageNet 90 epoch = ~422.000 lần cập nhật.",
            "Shuffle trước mỗi epoch: batch khác nhau → gradient đa dạng → hội tụ tốt hơn.",
            "Batch nhỏ = noisy nhưng regularize. Batch lớn = ổn định nhưng cần LR lớn hơn.",
            "GPU thiếu RAM? Gradient accumulation: tích lũy gradient qua N batch nhỏ rồi mới cập nhật.",
          ]}
        />
      </LessonSection>

      {/* ===== STEP 8: QUIZ ===== */}
      <LessonSection step={8} totalSteps={8} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
