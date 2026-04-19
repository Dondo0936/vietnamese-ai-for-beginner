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
  ToggleCompare,
  TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "sgd",
  title: "Stochastic Gradient Descent",
  titleVi: "Hạ gradient ngẫu nhiên",
  description:
    "Biến thể hiệu quả của gradient descent, cập nhật trọng số sau mỗi mẫu hoặc mỗi lô nhỏ.",
  category: "neural-fundamentals",
  tags: ["optimization", "training"],
  difficulty: "advanced",
  relatedSlugs: [
    "gradient-descent",
    "learning-rate",
    "optimizers",
    "epochs-batches",
  ],
  vizType: "interactive",
};

/* ---------- math helpers ---------- */
const SVG_W = 400;
const SVG_H = 400;
const PAD = 30;

// Simple 2D loss: (x-3)^2 + (y-3)^2
function loss(x: number, y: number) {
  return (x - 3) ** 2 + (y - 3) ** 2;
}
function gradX(x: number) {
  return 2 * (x - 3);
}
function gradY(y: number) {
  return 2 * (y - 3);
}
function toSvg(v: number) {
  return PAD + ((v - 0) / 6) * (SVG_W - 2 * PAD);
}

type Method = "batch" | "sgd" | "mini-batch";

const METHOD_CONFIG: Record<Method, { color: string; label: string; labelVi: string }> = {
  batch: { color: "#3b82f6", label: "Batch GD", labelVi: "Toàn bộ dữ liệu" },
  sgd: { color: "#ef4444", label: "SGD", labelVi: "1 mẫu ngẫu nhiên" },
  "mini-batch": { color: "#22c55e", label: "Mini-batch", labelVi: "Lô nhỏ (32-256)" },
};

/* ---------- main component ---------- */
export default function SGDTopic() {
  const [paths, setPaths] = useState<Record<Method, { x: number; y: number }[]>>({
    batch: [],
    sgd: [],
    "mini-batch": [],
  });
  const [isRunning, setIsRunning] = useState(false);
  const [highlighted, setHighlighted] = useState<Method>("mini-batch");
  const [stepCount, setStepCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Deterministic noise for SGD demo using a seeded sequence
  const noiseSeq = useMemo(() => {
    const seq: number[] = [];
    let seed = 17;
    for (let i = 0; i < 200; i++) {
      seed = (seed * 16807) % 2147483647;
      seq.push((seed / 2147483647) * 2 - 1);
    }
    return seq;
  }, []);

  const runAll = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    setStepCount(0);
    const initial = { x: 0.5, y: 0.5 };
    setPaths({
      batch: [initial],
      sgd: [initial],
      "mini-batch": [initial],
    });

    let step = 0;
    intervalRef.current = setInterval(() => {
      step++;
      if (step > 35) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsRunning(false);
        return;
      }
      setStepCount(step);

      setPaths((prev) => {
        const lr = 0.15;

        // Batch: clean gradient
        const bLast = prev.batch[prev.batch.length - 1];
        const bx = bLast.x - lr * gradX(bLast.x);
        const by = bLast.y - lr * gradY(bLast.y);

        // SGD: noisy gradient
        const sLast = prev.sgd[prev.sgd.length - 1];
        const sNx = noiseSeq[(step * 2) % noiseSeq.length] * 0.7;
        const sNy = noiseSeq[(step * 2 + 1) % noiseSeq.length] * 0.7;
        const sx = Math.max(0, Math.min(6, sLast.x - lr * (gradX(sLast.x) + sNx)));
        const sy = Math.max(0, Math.min(6, sLast.y - lr * (gradY(sLast.y) + sNy)));

        // Mini-batch: moderate noise
        const mLast = prev["mini-batch"][prev["mini-batch"].length - 1];
        const mNx = noiseSeq[(step * 2 + 50) % noiseSeq.length] * 0.25;
        const mNy = noiseSeq[(step * 2 + 51) % noiseSeq.length] * 0.25;
        const mx = Math.max(0, Math.min(6, mLast.x - lr * (gradX(mLast.x) + mNx)));
        const my = Math.max(0, Math.min(6, mLast.y - lr * (gradY(mLast.y) + mNy)));

        return {
          batch: [...prev.batch, { x: bx, y: by }],
          sgd: [...prev.sgd, { x: sx, y: sy }],
          "mini-batch": [...prev["mini-batch"], { x: mx, y: my }],
        };
      });
    }, 180);
  }, [isRunning, noiseSeq]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setPaths({ batch: [], sgd: [], "mini-batch": [] });
    setStepCount(0);
  }, []);

  // Final losses
  const finalLosses = useMemo(() => {
    const result: Record<Method, string> = { batch: "—", sgd: "—", "mini-batch": "—" };
    for (const m of ["batch", "sgd", "mini-batch"] as Method[]) {
      const p = paths[m];
      if (p.length > 0) {
        const last = p[p.length - 1];
        result[m] = loss(last.x, last.y).toFixed(3);
      }
    }
    return result;
  }, [paths]);

  /* Quiz */
  const quizQuestions: QuizQuestion[] = [
    {
      question: "Tại sao noise trong SGD lại có thể là ưu điểm?",
      options: [
        "Noise làm mô hình chạy nhanh hơn",
        "Noise giúp thoát khỏi cực tiểu cục bộ (local minima) nông",
        "Noise giảm số lượng tham số",
        "Noise không bao giờ là ưu điểm",
      ],
      correct: 1,
      explanation:
        "Dao động ngẫu nhiên giúp mô hình 'nhảy' ra khỏi các cực tiểu nông, tìm được cực tiểu sâu hơn với khả năng tổng quát hóa tốt hơn.",
    },
    {
      question: "Mini-batch size = 1 tương đương với phương pháp nào?",
      options: [
        "Batch GD",
        "SGD thuần (từng mẫu)",
        "Mini-batch GD",
        "Không phải phương pháp nào",
      ],
      correct: 1,
      explanation:
        "Mini-batch size = 1 nghĩa là cập nhật sau mỗi mẫu — đó chính là SGD thuần. Batch size = N (toàn bộ) là Batch GD.",
    },
    {
      question: "Trong thực tế, batch size phổ biến nhất cho deep learning là?",
      options: [
        "1 (SGD thuần)",
        "N — toàn bộ dataset",
        "32 đến 256 (mini-batch)",
        "1000 trở lên",
      ],
      correct: 2,
      explanation:
        "Mini-batch 32-256 cân bằng tốt: đủ lớn để ước lượng gradient ổn định, đủ nhỏ để cập nhật thường xuyên và vừa bộ nhớ GPU.",
    },
    {
      type: "fill-blank",
      question:
        "SGD là viết tắt của {blank} Gradient Descent — cập nhật sau mỗi mẫu. Trong thực tế, deep learning dùng {blank}-batch với 32-256 mẫu để cân bằng tốc độ và ổn định.",
      blanks: [
        { answer: "Stochastic", accept: ["stochastic", "ngẫu nhiên"] },
        { answer: "mini", accept: ["Mini", "nhỏ"] },
      ],
      explanation:
        "'Stochastic' = ngẫu nhiên: cập nhật sau mỗi mẫu ngẫu nhiên (batch size = 1). Trong thực tế, mọi framework dùng mini-batch (32-256) — gọi là SGD nhưng thật ra là mini-batch GD. Đây là mặc định cho deep learning.",
    },
  ];

  return (
    <>
      {/* ===== STEP 1: PREDICTION GATE ===== */}
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Bạn muốn tìm quán phở ngon nhất thành phố. Cách nào nhanh nhưng vẫn đáng tin?"
          options={[
            "Ăn hết TẤT CẢ quán rồi mới quyết (chính xác nhưng mất cả năm)",
            "Ăn 1 quán bất kỳ rồi kết luận ngay (nhanh nhưng may rủi)",
            "Ăn 5-10 quán trong mỗi khu rồi đánh giá (nhanh + đáng tin)",
            "Đọc review trên Shopee Food rồi tin tưởng hoàn toàn",
          ]}
          correct={2}
          explanation="Ăn vài quán mỗi khu rồi đánh giá — đó chính là Mini-batch GD! Nhanh hơn ăn hết, đáng tin hơn chỉ thử 1 quán."
        >
          <p className="mt-4 text-sm text-muted leading-relaxed">
            Ba cách tiếp cận tìm quán phở tương ứng chính xác với 3 biến thể
            của{" "}
            <TopicLink slug="gradient-descent">Gradient Descent</TopicLink>. Hãy xem chúng{" "}
            <strong className="text-foreground">chạy đua</strong>{" "}
            trên cùng bề mặt loss.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ===== STEP 2: RACE VISUALIZATION ===== */}
      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-4">
            <p className="text-sm text-center text-muted">
              Nhấn <strong className="text-foreground">Chạy đua</strong>{" "}
              để so sánh cả 3 phương pháp tìm cực tiểu trên cùng bề mặt loss.
            </p>

            {/* Method highlight buttons */}
            <div className="flex flex-wrap gap-2 justify-center">
              {(Object.keys(METHOD_CONFIG) as Method[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setHighlighted(m)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    highlighted === m
                      ? "text-white shadow-md"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                  style={
                    highlighted === m
                      ? { backgroundColor: METHOD_CONFIG[m].color }
                      : {}
                  }
                >
                  {METHOD_CONFIG[m].label}
                </button>
              ))}
            </div>

            {/* 2D contour map */}
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              className="w-full max-w-md mx-auto"
            >
              {/* Contour rings */}
              {[0.5, 1.0, 1.5, 2.0, 2.5, 3.0].map((r, i) => (
                <circle
                  key={`c-${i}`}
                  cx={toSvg(3)}
                  cy={toSvg(3)}
                  r={(r / 3.5) * ((SVG_W - 2 * PAD) / 2)}
                  fill="none"
                  stroke="#334155"
                  strokeWidth="1"
                  opacity={0.3 + (i * 0.05)}
                />
              ))}

              {/* Target */}
              <circle cx={toSvg(3)} cy={toSvg(3)} r="5" fill="#22c55e" opacity={0.8} />
              <text
                x={toSvg(3) + 10}
                y={toSvg(3) - 8}
                fill="#22c55e"
                fontSize="9"
              >
                Cực tiểu
              </text>

              {/* All paths */}
              {(Object.keys(METHOD_CONFIG) as Method[]).map((m) => {
                const path = paths[m];
                if (path.length < 2) return null;
                const isHighlighted = highlighted === m;
                return (
                  <g key={`path-${m}`}>
                    {/* Path line */}
                    <polyline
                      points={path
                        .map((p) => `${toSvg(p.x)},${toSvg(p.y)}`)
                        .join(" ")}
                      fill="none"
                      stroke={METHOD_CONFIG[m].color}
                      strokeWidth={isHighlighted ? 2.5 : 1}
                      opacity={isHighlighted ? 1 : 0.25}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Current position */}
                    <motion.circle
                      cx={toSvg(path[path.length - 1].x)}
                      cy={toSvg(path[path.length - 1].y)}
                      r={isHighlighted ? 6 : 3}
                      fill={METHOD_CONFIG[m].color}
                      stroke="white"
                      strokeWidth={isHighlighted ? 2 : 0}
                      initial={false}
                      animate={{
                        cx: toSvg(path[path.length - 1].x),
                        cy: toSvg(path[path.length - 1].y),
                      }}
                      transition={{ type: "spring", stiffness: 120 }}
                    />
                  </g>
                );
              })}

              {/* Start marker */}
              {paths.batch.length > 0 && (
                <>
                  <circle
                    cx={toSvg(0.5)}
                    cy={toSvg(0.5)}
                    r="5"
                    fill="#f59e0b"
                    stroke="white"
                    strokeWidth="1.5"
                  />
                  <text
                    x={toSvg(0.5) + 8}
                    y={toSvg(0.5) + 4}
                    fill="#f59e0b"
                    fontSize="9"
                  >
                    Bắt đầu
                  </text>
                </>
              )}

              {/* Axes */}
              <text
                x={SVG_W / 2}
                y={SVG_H - 5}
                textAnchor="middle"
                fill="#64748b"
                fontSize="10"
              >
                w₁
              </text>
              <text
                x={8}
                y={SVG_H / 2}
                fill="#64748b"
                fontSize="10"
                transform={`rotate(-90, 8, ${SVG_H / 2})`}
              >
                w₂
              </text>
            </svg>

            {/* Controls */}
            <div className="flex justify-center gap-3">
              <button
                onClick={reset}
                className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
              >
                Đặt lại
              </button>
              <button
                onClick={runAll}
                disabled={isRunning}
                className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {isRunning ? "Đang chạy..." : "Chạy đua"}
              </button>
            </div>

            {/* Stats */}
            {stepCount > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {(Object.keys(METHOD_CONFIG) as Method[]).map((m) => (
                  <div
                    key={`stat-${m}`}
                    className={`rounded-lg border p-3 text-center transition-all ${
                      highlighted === m
                        ? "border-accent bg-accent/10"
                        : "border-border bg-background/50"
                    }`}
                  >
                    <div
                      className="mx-auto mb-1 h-2 w-8 rounded-full"
                      style={{ backgroundColor: METHOD_CONFIG[m].color }}
                    />
                    <p className="text-xs font-semibold text-foreground">
                      {METHOD_CONFIG[m].label}
                    </p>
                    <p className="text-[10px] text-muted">
                      Loss: {finalLosses[m]}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ===== STEP 3: AHA MOMENT ===== */}
      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>SGD</strong>{" "}
            đánh đổi sự ổn định lấy tốc độ — giống Grab bike len lỏi qua đường
            đông đúc: nhanh nhưng lắc lư. <strong>Mini-batch GD</strong>{" "}
            là Grab car: ổn định hơn, vẫn nhanh, và là lựa chọn mặc định của mọi
            framework deep learning!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ===== STEP 4: INLINE CHALLENGE ===== */}
      <LessonSection step={4} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Dataset có 1.000.000 ảnh. Batch GD cần tính gradient trên CẢ triệu ảnh mỗi bước. Vấn đề lớn nhất là gì?"
          options={[
            "Gradient không chính xác",
            "Cần quá nhiều RAM để chứa gradient của cả triệu ảnh, và mỗi bước cập nhật cực chậm",
            "Mô hình sẽ overfit",
          ]}
          correct={1}
          explanation="1 triệu ảnh × gradient cho mỗi ảnh = lượng bộ nhớ khổng lồ, và phải duyệt hết trước khi cập nhật 1 lần. Mini-batch (32-256 ảnh) giải quyết: cập nhật thường xuyên, vừa RAM."
        />
      </LessonSection>

      {/* ===== STEP 5: COMPARE ===== */}
      <LessonSection step={5} totalSteps={8} label="So sánh chi tiết">
        <ExplanationSection>
          <p>
            <strong>Ba biến thể của Gradient Descent</strong>{" "}
            khác nhau ở lượng dữ liệu dùng để ước lượng gradient mỗi bước:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 font-semibold text-foreground">
                    Phương pháp
                  </th>
                  <th className="text-left py-2 pr-3 font-semibold text-foreground">
                    Dữ liệu/bước
                  </th>
                  <th className="text-left py-2 pr-3 font-semibold text-foreground">
                    Đường đi
                  </th>
                  <th className="text-left py-2 font-semibold text-foreground">
                    Khi nào dùng
                  </th>
                </tr>
              </thead>
              <tbody className="text-foreground/80">
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium text-blue-400">
                    Batch GD
                  </td>
                  <td className="py-2 pr-3">Toàn bộ N mẫu</td>
                  <td className="py-2 pr-3">Mượt mà, thẳng hướng</td>
                  <td className="py-2">Dataset nhỏ (&lt; 10K mẫu)</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium text-red-400">
                    SGD
                  </td>
                  <td className="py-2 pr-3">1 mẫu</td>
                  <td className="py-2 pr-3">Zigzag, nhiễu nhiều</td>
                  <td className="py-2">Online learning, dữ liệu streaming</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-medium text-green-400">
                    Mini-batch
                  </td>
                  <td className="py-2 pr-3">B mẫu (32-256)</td>
                  <td className="py-2 pr-3">Hơi dao động, nhưng hướng đúng</td>
                  <td className="py-2">
                    Mặc định cho mọi bài toán
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            Công thức cập nhật cho cả 3 đều giống nhau, chỉ khác cách tính gradient:
          </p>
          <LaTeX block>
            {"\\theta \\leftarrow \\theta - \\alpha \\cdot \\frac{1}{|\\mathcal{B}|} \\sum_{i \\in \\mathcal{B}} \\nabla L_i(\\theta)"}
          </LaTeX>
          <p>
            Với <LaTeX>{"|\\mathcal{B}|"}</LaTeX> = N (Batch), = 1 (SGD), hoặc = B nhỏ (Mini-batch).
          </p>

          <Callout variant="insight" title="Bí mật của noise">
            Nhiễu từ SGD/mini-batch không chỉ là nhược điểm — nó hoạt động như
            một dạng <strong>regularization tự nhiên</strong>. Nghiên cứu cho thấy
            mô hình huấn luyện bằng SGD tổng quát hóa tốt hơn Batch GD vì noise
            giúp thoát khỏi các cực tiểu &quot;sắc&quot; (sharp minima) — nơi mô hình
            overfit.
          </Callout>

          <CodeBlock language="python" title="sgd_training.py">
{`import torch
from torch.utils.data import DataLoader

# Mini-batch: chia dataset thành các lô nhỏ
loader = DataLoader(dataset, batch_size=64, shuffle=True)

optimizer = torch.optim.SGD(model.parameters(), lr=0.01)

for epoch in range(10):
    for batch_x, batch_y in loader:  # mỗi lô 64 mẫu
        pred = model(batch_x)         # forward pass
        loss = loss_fn(pred, batch_y)  # tính loss trên lô nhỏ
        loss.backward()                # tính gradient
        optimizer.step()               # cập nhật trọng số
        optimizer.zero_grad()          # xóa gradient cũ`}
          </CodeBlock>

          <Callout variant="tip" title="Chọn batch size như thế nào?">
            Bắt đầu với <strong>32 hoặc 64</strong>. Tăng lên 128-256 nếu GPU còn dư RAM.
            Batch lớn hơn → gradient ổn định hơn nhưng cập nhật ít hơn mỗi epoch.
            Quy tắc: nếu tăng batch size gấp đôi, tăng learning rate gấp đôi. Xem thêm{" "}
            <TopicLink slug="optimizers">các optimizer nâng cao</TopicLink>{" "}
            (Adam, AdamW) để tăng tốc hội tụ.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ===== STEP 6: SECOND CHALLENGE ===== */}
      <LessonSection step={6} totalSteps={8} label="Thử thách nâng cao">
        <InlineChallenge
          question="Bạn tăng batch size từ 32 lên 256 nhưng giữ nguyên learning rate. Điều gì có thể xảy ra?"
          options={[
            "Mô hình học nhanh hơn vì gradient chính xác hơn",
            "Mô hình hội tụ chậm hơn vì ít bước cập nhật hơn mỗi epoch, và có thể cần tăng learning rate",
            "Không ảnh hưởng gì — batch size và learning rate độc lập",
          ]}
          correct={1}
          explanation="Batch lớn hơn = ít bước cập nhật hơn mỗi epoch. Gradient chính xác hơn nhưng bước đi ít hơn. Quy tắc linear scaling: tăng batch 8x thì tăng LR 8x."
        />
      </LessonSection>

      {/* ===== STEP 7: MINI SUMMARY ===== */}
      <LessonSection step={7} totalSteps={8} label="Tóm tắt">
        <MiniSummary
          title="SGD — Điểm chốt"
          points={[
            "Batch GD tính gradient trên toàn bộ dữ liệu: ổn định nhưng chậm và tốn RAM.",
            "SGD cập nhật sau mỗi mẫu: nhanh nhưng dao động mạnh (nhiễu).",
            "Mini-batch GD (32-256 mẫu) là mặc định: cân bằng tốc độ + ổn định + vừa GPU.",
            "Noise của SGD giúp thoát local minima — một dạng regularization tự nhiên.",
            "Quy tắc: tăng batch size gấp đôi → tăng learning rate gấp đôi (linear scaling).",
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
