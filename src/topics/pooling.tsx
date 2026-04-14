"use client";

import { useState, useCallback, useMemo } from "react";
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
  slug: "pooling",
  title: "Pooling Layers",
  titleVi: "Lớp gộp",
  description: "Giảm kích thước dữ liệu bằng cách tóm tắt thông tin trong vùng lân cận",
  category: "dl-architectures",
  tags: ["computer-vision", "cnn", "fundamentals"],
  difficulty: "beginner",
  relatedSlugs: ["convolution", "cnn", "u-net"],
  vizType: "interactive",
};

/* ── Data ── */
const INPUT_GRID = [
  [6, 2, 8, 4],
  [1, 5, 3, 7],
  [9, 3, 1, 6],
  [4, 8, 5, 2],
];

const QUADS = [
  { row: 0, col: 0 },
  { row: 0, col: 2 },
  { row: 2, col: 0 },
  { row: 2, col: 2 },
];

function getVals(qr: number, qc: number): number[] {
  return [
    INPUT_GRID[qr][qc], INPUT_GRID[qr][qc + 1],
    INPUT_GRID[qr + 1][qc], INPUT_GRID[qr + 1][qc + 1],
  ];
}

function poolResult(qr: number, qc: number, type: "max" | "avg"): number {
  const vals = getVals(qr, qc);
  if (type === "max") return Math.max(...vals);
  return vals.reduce((a, b) => a + b, 0) / 4;
}

const quizQuestions: QuizQuestion[] = [
  {
    question: "Feature map 16×16 qua Max Pooling 2×2 (stride 2). Output kích thước bao nhiêu?",
    options: ["16×16", "8×8", "4×4", "14×14"],
    correct: 1,
    explanation: "Pooling 2×2 với stride 2: mỗi chiều giảm một nửa. 16/2 = 8 → output 8×8. Tổng kích thước giảm 4 lần (16×16=256 → 8×8=64).",
  },
  {
    question: "Tại sao Max Pooling phổ biến hơn Average Pooling trong CNN phân loại ảnh?",
    options: [
      "Vì Max Pooling nhanh hơn",
      "Vì nó giữ đặc trưng nổi bật nhất — activation cao nhất nghĩa là pattern được phát hiện mạnh nhất",
      "Vì Average Pooling không giảm kích thước",
      "Vì Max Pooling có nhiều tham số hơn",
    ],
    correct: 1,
    explanation: "Khi bộ lọc phát hiện một đặc trưng (ví dụ: cạnh), giá trị activation cao nhất chính là nơi đặc trưng rõ nhất. Max pooling giữ lại tín hiệu mạnh nhất này.",
  },
  {
    question: "Global Average Pooling (GAP) được dùng ở cuối CNN hiện đại thay cho Flatten + FC. Nó làm gì?",
    options: [
      "Lấy trung bình toàn bộ feature map → 1 số cho mỗi channel",
      "Lấy max toàn bộ feature map",
      "Duỗi thẳng thành vector",
      "Nhân feature map với nhau",
    ],
    correct: 0,
    explanation: "GAP tính trung bình toàn bộ H×W pixel cho mỗi channel. Feature map 7×7×512 → vector 1×1×512. Không cần FC layer nặng, giảm overfitting, và kích thước đầu vào linh hoạt.",
  },
];

/* ── Component ── */
export default function PoolingTopic() {
  const [poolType, setPoolType] = useState<"max" | "avg">("max");
  const [activeQuad, setActiveQuad] = useState(0);

  const onSwitchType = useCallback((type: "max" | "avg") => {
    setPoolType(type);
    setActiveQuad(0);
  }, []);

  const q = QUADS[activeQuad];
  const activeVals = getVals(q.row, q.col);
  const activeResult = poolResult(q.row, q.col, poolType);

  const allResults = useMemo(() => {
    return QUADS.map((qd) => poolResult(qd.row, qd.col, poolType));
  }, [poolType]);

  const cellSize = 58;
  const TOTAL_STEPS = 8;

  return (
    <>
      {/* ═══ Step 1: HOOK ═══ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn có tấm ảnh 1000×1000 pixel. Sau 3 lớp convolution, bạn có 256 feature maps, mỗi cái 1000×1000. Tổng cộng 256 triệu số! Làm sao giảm tải tính toán mà không mất thông tin quan trọng?"
          options={[
            "Xóa bớt feature maps",
            "Giữ lại giá trị nổi bật nhất trong mỗi vùng nhỏ",
            "Chuyển sang xử lý đen trắng",
          ]}
          correct={1}
          explanation="Chính xác! Chia feature map thành các vùng nhỏ (ví dụ 2×2), từ mỗi vùng chỉ giữ giá trị lớn nhất (max) hoặc trung bình (avg). Kích thước giảm 4 lần mà đặc trưng quan trọng vẫn còn!"
        />
      </LessonSection>

      {/* ═══ Step 2: DISCOVER — Interactive Pooling ═══ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá Pooling">
        <VisualizationSection topicSlug={metadata.slug}>
          <p className="text-sm text-foreground leading-relaxed mb-3">
            Hãy tưởng tượng bạn tóm tắt đánh giá món phở trên Shopee Food. Thay vì đọc 100 review, bạn chỉ lấy{" "}
            <strong>điểm cao nhất</strong>{" "}
            (max pooling — &quot;quán này có review 5 sao!&quot;) hoặc{" "}
            <strong>điểm trung bình</strong>{" "}
            (average pooling — &quot;trung bình 4.2 sao&quot;).
          </p>

          <p className="text-sm text-muted mb-3">
            Chọn kiểu pooling và nhấn vào từng vùng 2×2 trên input để xem kết quả.
          </p>

          {/* Pool type toggle */}
          <div className="flex gap-2 mb-4">
            <button type="button" onClick={() => onSwitchType("max")}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                poolType === "max"
                  ? "border-amber-500 bg-amber-500/15 text-amber-500"
                  : "border-border bg-card text-foreground hover:bg-surface"
              }`}>
              Max Pooling
            </button>
            <button type="button" onClick={() => onSwitchType("avg")}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                poolType === "avg"
                  ? "border-violet-500 bg-violet-500/15 text-violet-500"
                  : "border-border bg-card text-foreground hover:bg-surface"
              }`}>
              Average Pooling
            </button>
          </div>

          <svg viewBox="0 0 480 280" className="w-full rounded-lg border border-border bg-background">
            {/* Input grid */}
            <text x={125} y={20} fontSize={12} fill="currentColor" className="text-foreground"
              textAnchor="middle" fontWeight={600}>
              Input (4×4)
            </text>
            {INPUT_GRID.map((row, r) =>
              row.map((val, c) => {
                const x = 10 + c * cellSize;
                const y = 30 + r * cellSize;
                const inQuad = r >= q.row && r < q.row + 2 && c >= q.col && c < q.col + 2;
                const isMax = poolType === "max" && inQuad && val === poolResult(q.row, q.col, "max");
                return (
                  <g key={`${r}-${c}`}>
                    <rect x={x} y={y} width={cellSize - 3} height={cellSize - 3} rx={6}
                      fill={inQuad ? "#f59e0b" : "#666"} opacity={isMax ? 0.4 : inQuad ? 0.15 : 0.08}
                      stroke={inQuad ? "#f59e0b" : "#666"} strokeWidth={inQuad ? 2 : 0.5} />
                    <text x={x + cellSize / 2 - 1} y={y + cellSize / 2 + 3} fontSize={19}
                      fill={isMax ? "#f59e0b" : "currentColor"} className={isMax ? "" : "text-foreground"}
                      textAnchor="middle" fontWeight={isMax ? 800 : 400}>
                      {val}
                    </text>
                  </g>
                );
              })
            )}

            {/* Clickable quadrant overlays */}
            {QUADS.map((qd, i) => (
              <rect key={`quad-${i}`}
                x={10 + qd.col * cellSize} y={30 + qd.row * cellSize}
                width={cellSize * 2 - 3} height={cellSize * 2 - 3}
                fill="transparent" className="cursor-pointer"
                onClick={() => setActiveQuad(i)} />
            ))}

            {/* Arrow */}
            <line x1={245} y1={145} x2={298} y2={145} stroke="#888" strokeWidth={2} />
            <polygon points="303,145 296,140 296,150" fill="#888" />
            <text x={273} y={132} fontSize={10} fill="currentColor" className="text-muted" textAnchor="middle">
              {poolType === "max" ? "Max" : "Avg"}
            </text>

            {/* Output grid */}
            <text x={375} y={85} fontSize={12} fill="#22c55e" textAnchor="middle" fontWeight={600}>
              Output (2×2)
            </text>
            {[0, 1].map((r) =>
              [0, 1].map((c) => {
                const x = 315 + c * cellSize;
                const y = 95 + r * cellSize;
                const qi = r * 2 + c;
                const val = allResults[qi];
                const isActive = qi === activeQuad;
                return (
                  <g key={`out-${r}-${c}`}>
                    <rect x={x} y={y} width={cellSize - 3} height={cellSize - 3} rx={6}
                      fill="#22c55e" opacity={isActive ? 0.3 : 0.1}
                      stroke="#22c55e" strokeWidth={isActive ? 2.5 : 1} />
                    <motion.text x={x + cellSize / 2 - 1} y={y + cellSize / 2 + 3} fontSize={19}
                      fill="#22c55e" textAnchor="middle" fontWeight={isActive ? 800 : 500}
                      key={`${qi}-${poolType}`}
                      initial={{ scale: 1.2 }} animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}>
                      {poolType === "avg" ? val.toFixed(1) : val}
                    </motion.text>
                  </g>
                );
              })
            )}
          </svg>

          {/* Computation breakdown */}
          <div className="mt-3 rounded-lg border border-border bg-background/50 p-3">
            <p className="text-xs text-muted mb-1">
              Vùng ({q.row}, {q.col}) → [{activeVals.join(", ")}]:
            </p>
            <p className="text-sm text-foreground">
              {poolType === "max" ? (
                <>
                  max({activeVals.join(", ")}) ={" "}
                  <strong className="text-green-500">{activeResult}</strong>
                  {" "}← giá trị nổi bật nhất
                </>
              ) : (
                <>
                  ({activeVals.join(" + ")}) / 4 ={" "}
                  <strong className="text-green-500">{activeResult.toFixed(1)}</strong>
                  {" "}← trung bình
                </>
              )}
            </p>
          </div>

          <p className="text-sm text-muted mt-3">
            Bạn vừa thấy ảnh 4×4 giảm xuống 2×2 — kích thước giảm 4 lần mà thông tin quan trọng vẫn được giữ lại. Đây là lý do CNN có thể xử lý ảnh hàng triệu pixel.
          </p>
        </VisualizationSection>
      </LessonSection>

      {/* ═══ Step 3: AHA MOMENT ═══ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>Pooling</strong>{" "}
            là &quot;bộ tóm tắt&quot; — giảm kích thước dữ liệu nhưng giữ bản chất. Giống bạn đọc tóm tắt sách thay vì đọc hết 500 trang — nhanh hơn mà vẫn nắm được nội dung chính!
          </p>
          <p className="text-sm text-muted mt-1">
            Bonus: pooling tạo tính <strong>bất biến dịch chuyển nhỏ</strong>{" "}
            — dù con mèo dịch sang trái/phải vài pixel, max value trong vùng 2×2 vẫn giống nhau.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ═══ Step 4: POOLING TYPES ═══ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Các loại Pooling">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                <h4 className="text-sm font-semibold text-amber-500 mb-2">Max Pooling</h4>
                <p className="text-xs text-muted">Lấy giá trị lớn nhất. Phổ biến nhất trong CNN phân loại.</p>
                <div className="mt-2 text-center">
                  <span className="text-2xl font-bold text-amber-500">max()</span>
                </div>
              </div>
              <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-4">
                <h4 className="text-sm font-semibold text-violet-500 mb-2">Average Pooling</h4>
                <p className="text-xs text-muted">Lấy trung bình. Giữ thông tin tổng quát hơn.</p>
                <div className="mt-2 text-center">
                  <span className="text-2xl font-bold text-violet-500">avg()</span>
                </div>
              </div>
              <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4">
                <h4 className="text-sm font-semibold text-green-500 mb-2">Global Avg Pooling</h4>
                <p className="text-xs text-muted">Lấy TB toàn bộ feature map → 1 số/channel. Thay FC layer.</p>
                <div className="mt-2 text-center">
                  <span className="text-2xl font-bold text-green-500">GAP</span>
                </div>
              </div>
            </div>

            <Callout variant="info" title="Xu hướng hiện đại">
              <p>
                Nhiều kiến trúc mới dùng <strong>strided convolution</strong>{" "}
                (conv với stride=2) thay cho pooling — giảm kích thước nhưng vẫn có tham số học được. ResNet và EfficientNet đều dùng cách này. Global Average Pooling thay thế Flatten + FC ở cuối mạng.
              </p>
            </Callout>
          </div>
      </LessonSection>

      {/* ═══ Step 5: CHALLENGE ═══ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Feature map 224×224 qua 4 lớp Max Pooling 2×2. Kích thước cuối cùng là?"
          options={[
            "224 / 2⁴ = 14 → output 14×14",
            "224 - 4×2 = 216 → output 216×216",
            "224 / 4 = 56 → output 56×56",
          ]}
          correct={0}
          explanation="Mỗi lần pooling 2×2 giảm kích thước đi một nửa. 4 lần: 224 → 112 → 56 → 28 → 14. Tổng giảm 2⁴ = 16 lần. Feature map 14×14 chỉ còn 196 pixel so với 50.176 ban đầu!"
        />
      </LessonSection>

      {/* ═══ Step 6: EXPLAIN ═══ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích chi tiết">
        <ExplanationSection>
          <p>
            <strong>Pooling</strong>{" "}
            giảm kích thước không gian (spatial dimensions) của feature map, giữ lại thông tin quan trọng. Không có tham số học được — chỉ là phép toán cố định.
          </p>

          <p className="mt-3 font-semibold text-foreground">Max Pooling:</p>
          <LaTeX block>{String.raw`y_{i,j} = \max_{(m,n) \in R_{i,j}} x_{m,n}`}</LaTeX>

          <p className="mt-3 font-semibold text-foreground">Average Pooling:</p>
          <LaTeX block>{String.raw`y_{i,j} = \frac{1}{|R_{i,j}|} \sum_{(m,n) \in R_{i,j}} x_{m,n}`}</LaTeX>

          <p className="text-sm text-muted mt-1">
            Trong đó <LaTeX>{"R_{i,j}"}</LaTeX> là vùng pooling tại vị trí (i, j).
          </p>

          <p className="mt-3 font-semibold text-foreground">Kích thước output:</p>
          <LaTeX block>{String.raw`O = \left\lfloor \frac{W - K}{S} \right\rfloor + 1`}</LaTeX>
          <p className="text-sm text-muted">
            Pooling thường dùng K=2, S=2 → mỗi chiều giảm một nửa. Hoặc K=3, S=2 với padding=1 (overlapping pooling).
          </p>

          <Callout variant="insight" title="Tại sao pooling giúp chống overfitting?">
            <p>
              Pooling giảm số lượng tham số ở các lớp sau (vì feature map nhỏ hơn → FC layer ít neuron hơn). Ít tham số hơn = ít khả năng &quot;nhớ&quot; dữ liệu huấn luyện = ít overfitting. Ngoài ra, tính bất biến nhỏ giúp mô hình tổng quát hóa tốt hơn.
            </p>
          </Callout>

          <CodeBlock language="python" title="pooling_layers.py">
{`import torch.nn as nn

# Max Pooling 2x2, stride 2 (mặc định)
pool = nn.MaxPool2d(kernel_size=2, stride=2)
# Input: (batch, channels, 224, 224)
# Output: (batch, channels, 112, 112)

# Average Pooling
avg_pool = nn.AvgPool2d(kernel_size=2, stride=2)

# Global Average Pooling — thay thế Flatten + FC
gap = nn.AdaptiveAvgPool2d(1)
# Input: (batch, 512, 7, 7)
# Output: (batch, 512, 1, 1) → squeeze → (batch, 512)

# Ví dụ trong kiến trúc hiện đại
class ModernCNN(nn.Module):
    def __init__(self, num_classes=10):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 64, 3, padding=1), nn.ReLU(),
            nn.MaxPool2d(2),               # 224→112
            nn.Conv2d(64, 128, 3, padding=1), nn.ReLU(),
            nn.MaxPool2d(2),               # 112→56
            nn.Conv2d(128, 256, 3, padding=1), nn.ReLU(),
        )
        self.classifier = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),       # 56×56→1×1 (GAP!)
            nn.Flatten(),
            nn.Linear(256, num_classes),
        )`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      {/* ═══ Step 7: SUMMARY ═══ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về Pooling"
          points={[
            "Pooling giảm kích thước feature map: 2×2 pooling giảm mỗi chiều một nửa → tổng giảm 4 lần.",
            "Max Pooling giữ đặc trưng nổi bật nhất — phổ biến nhất cho phân loại ảnh.",
            "Average Pooling giữ thông tin tổng quát — Global Average Pooling thay thế FC layer ở cuối CNN hiện đại.",
            "Pooling không có tham số học được — chỉ là phép toán cố định (max hoặc trung bình).",
            "Lợi ích: giảm tính toán, tạo bất biến dịch chuyển nhỏ, chống overfitting.",
          ]}
        />
      </LessonSection>

      {/* ═══ Step 8: QUIZ ═══ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
