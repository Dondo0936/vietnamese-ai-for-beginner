"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
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

const TOTAL_SAMPLES = 12;
const COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316",
  "#6366f1", "#84cc16", "#06b6d4", "#e11d48",
];

export default function EpochsBatchesTopic() {
  const [batchSize, setBatchSize] = useState(4);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const numBatches = Math.ceil(TOTAL_SAMPLES / batchSize);
  const totalEpochs = 3;

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
        if (epoch > totalEpochs) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsRunning(false);
          return;
        }
      }
      setCurrentEpoch(epoch);
      setCurrentBatch(batch);
    }, 800);
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

  // Which samples are in the current batch
  const currentBatchSamples = currentBatch >= 0
    ? Array.from({ length: batchSize }, (_, i) => currentBatch * batchSize + i).filter((i) => i < TOTAL_SAMPLES)
    : [];

  const svgW = 480;
  const svgH = 200;
  const sampleR = 16;
  const samplesPerRow = 6;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn là <strong>giáo viên dạy võ</strong> cho 12 học trò.
          Mỗi buổi học, bạn không thể hướng dẫn cả 12 người cùng lúc.
        </p>
        <p>
          <strong>Batch (lô):</strong> Bạn chia lớp thành nhóm nhỏ (ví dụ 4 người).
          Mỗi nhóm lên tập, bạn sửa lỗi, rồi gọi nhóm tiếp theo. Mỗi nhóm là một
          batch.
        </p>
        <p>
          <strong>Epoch (vòng):</strong> Khi tất cả 12 người đã tập xong một lượt,
          đó là hết 1 epoch. Bạn cho cả lớp <em>lặp lại từ đầu</em> vì tập một lần
          chưa đủ thành thạo. 3 epoch = tập 3 vòng.
        </p>
        <p>
          Với 12 mẫu và batch_size = 4, mỗi epoch có{" "}
          <strong>3 lần cập nhật</strong> trọng số. Qua 3 epoch = tổng cộng 9 lần
          cập nhật.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Batch size control */}
            <div className="space-y-1 flex-1 min-w-[180px]">
              <label className="text-sm font-medium text-muted">
                Kích thước lô (batch_size):{" "}
                <strong className="text-foreground">{batchSize}</strong>
                <span className="ml-2 text-xs text-muted">
                  ({numBatches} lô/epoch)
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
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isRunning ? "Đang chạy..." : "Chạy 3 epoch"}
              </button>
            </div>
          </div>

          {/* Status */}
          <div className="flex gap-4 text-sm">
            <div className="rounded-lg bg-background/50 border border-border px-4 py-2">
              Epoch: <strong className="text-foreground">{currentEpoch}/{totalEpochs}</strong>
            </div>
            <div className="rounded-lg bg-background/50 border border-border px-4 py-2">
              Batch: <strong className="text-foreground">{currentBatch >= 0 ? currentBatch + 1 : 0}/{numBatches}</strong>
            </div>
            <div className="rounded-lg bg-background/50 border border-border px-4 py-2">
              Tổng cập nhật: <strong className="text-foreground">
                {currentEpoch > 0
                  ? (currentEpoch - 1) * numBatches + (currentBatch >= 0 ? currentBatch + 1 : 0)
                  : 0}
              </strong>
            </div>
          </div>

          {/* Data samples visualization */}
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-xl mx-auto">
            <text x={svgW / 2} y={18} textAnchor="middle" fill="#94a3b8" fontSize="11">
              Tập dữ liệu ({TOTAL_SAMPLES} mẫu)
            </text>

            {/* Samples grid */}
            {Array.from({ length: TOTAL_SAMPLES }, (_, i) => {
              const row = Math.floor(i / samplesPerRow);
              const col = i % samplesPerRow;
              const cx = 80 + col * (sampleR * 2 + 20);
              const cy = 55 + row * (sampleR * 2 + 20);
              const isActive = currentBatchSamples.includes(i);

              // Determine batch group for coloring
              const batchGroup = Math.floor(i / batchSize);
              const groupColor = COLORS[batchGroup % COLORS.length];

              return (
                <g key={`sample-${i}`}>
                  <motion.circle
                    cx={cx}
                    cy={cy}
                    r={sampleR}
                    fill={isActive ? groupColor : "#1e293b"}
                    stroke={isActive ? groupColor : "#475569"}
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
                    className="pointer-events-none"
                  >
                    {i + 1}
                  </text>
                </g>
              );
            })}

            {/* Batch brackets */}
            {currentBatch >= 0 && (
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {Array.from({ length: numBatches }, (_, b) => {
                  const startIdx = b * batchSize;
                  const endIdx = Math.min(startIdx + batchSize - 1, TOTAL_SAMPLES - 1);
                  const startRow = Math.floor(startIdx / samplesPerRow);
                  const startCol = startIdx % samplesPerRow;
                  const endCol = endIdx % samplesPerRow;

                  const x1 = 80 + startCol * (sampleR * 2 + 20) - sampleR - 4;
                  const x2 = 80 + endCol * (sampleR * 2 + 20) + sampleR + 4;
                  const y = 55 + startRow * (sampleR * 2 + 20) + sampleR + 10;
                  const isActiveBatch = b === currentBatch;

                  // Only show label if all samples are on same row for simplicity
                  if (endIdx - startIdx < samplesPerRow) {
                    return (
                      <text
                        key={`batch-label-${b}`}
                        x={(x1 + x2) / 2}
                        y={y + 6}
                        textAnchor="middle"
                        fill={isActiveBatch ? COLORS[b % COLORS.length] : "#475569"}
                        fontSize="8"
                        fontWeight={isActiveBatch ? "bold" : "normal"}
                      >
                        Lô {b + 1}
                      </text>
                    );
                  }
                  return null;
                })}
              </motion.g>
            )}
          </svg>

          {/* Epoch progress */}
          <div className="space-y-2">
            <p className="text-xs text-muted text-center">Tiến trình epoch</p>
            <div className="flex gap-1">
              {Array.from({ length: totalEpochs }, (_, e) => (
                <div key={`epoch-bar-${e}`} className="flex-1">
                  <div className="h-3 rounded-full bg-card border border-border overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: COLORS[e % COLORS.length] }}
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
                  <p className="text-center text-xs text-muted mt-1">Epoch {e + 1}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          Khi huấn luyện mạng nơ-ron, dữ liệu được tổ chức theo hai khái niệm quan
          trọng: <strong>batch</strong> và <strong>epoch</strong>.
        </p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>
            <strong>Batch (lô):</strong> Một nhóm nhỏ mẫu dữ liệu được đưa vào mạng
            cùng lúc. Sau mỗi batch, trọng số được cập nhật một lần. Batch size phổ
            biến: 32, 64, 128, 256.
          </li>
          <li>
            <strong>Epoch (vòng):</strong> Một lần duyệt qua toàn bộ tập dữ liệu
            huấn luyện. Nếu có 1000 mẫu và batch_size = 100, mỗi epoch gồm 10
            lần cập nhật.
          </li>
          <li>
            <strong>Iteration (bước):</strong> Mỗi lần cập nhật trọng số (= mỗi batch).
            Tổng iterations = epochs &times; (samples / batch_size).
          </li>
        </ul>
        <p>Ảnh hưởng của batch size:</p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>
            <strong>Batch nhỏ:</strong> Gradient noisy hơn nhưng có thể tổng quát hóa
            tốt hơn. Tốn ít bộ nhớ GPU. Mỗi epoch có nhiều bước cập nhật.
          </li>
          <li>
            <strong>Batch lớn:</strong> Gradient ổn định hơn, tận dụng GPU song song
            hiệu quả. Nhưng cần learning rate lớn hơn và dễ hội tụ vào sharp minima.
          </li>
        </ul>
        <p>
          Số epoch cần thiết phụ thuộc vào bài toán. Thường dùng{" "}
          <strong>early stopping</strong>: dừng khi validation loss không giảm sau
          nhiều epoch liên tiếp.
        </p>
      </ExplanationSection>
    </>
  );
}
