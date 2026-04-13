"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, LaTeX, TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "cnn",
  title: "Convolutional Neural Network",
  titleVi: "Mạng nơ-ron tích chập",
  description: "Kiến trúc chuyên xử lý ảnh bằng các bộ lọc tích chập trượt qua dữ liệu",
  category: "dl-architectures",
  tags: ["computer-vision", "deep-learning", "architecture"],
  difficulty: "intermediate",
  relatedSlugs: ["convolution", "pooling", "transfer-learning"],
  vizType: "interactive",
};

/* ── Constants ── */
const LAYERS = [
  { name: "Ảnh gốc", desc: "224×224×3 RGB", w: 82, h: 82, color: "#3b82f6", filters: 3 },
  { name: "Conv 1", desc: "32 bộ lọc 3×3 → phát hiện cạnh, kết cấu", w: 72, h: 72, color: "#f97316", filters: 32 },
  { name: "Pool 1", desc: "Max pooling 2×2 → giảm 4× kích thước", w: 56, h: 56, color: "#22c55e", filters: 32 },
  { name: "Conv 2", desc: "64 bộ lọc → hình dạng phức tạp hơn", w: 46, h: 46, color: "#f97316", filters: 64 },
  { name: "Pool 2", desc: "Tiếp tục giảm kích thước", w: 36, h: 36, color: "#22c55e", filters: 64 },
  { name: "Flatten", desc: "Duỗi thẳng tensor → vector 1D", w: 16, h: 82, color: "#8b5cf6", filters: 0 },
  { name: "FC", desc: "Kết hợp đặc trưng để phân loại", w: 16, h: 52, color: "#ef4444", filters: 0 },
  { name: "Output", desc: "Softmax → xác suất từng lớp", w: 16, h: 28, color: "#ec4899", filters: 0 },
];

const FEATURES = [
  { level: "Lớp đầu", examples: ["Cạnh ngang", "Cạnh dọc", "Góc"], color: "#3b82f6" },
  { level: "Lớp giữa", examples: ["Mắt", "Mũi", "Bánh xe"], color: "#f97316" },
  { level: "Lớp sâu", examples: ["Khuôn mặt", "Ô tô", "Con mèo"], color: "#8b5cf6" },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "Tại sao CNN dùng bộ lọc nhỏ (3×3) thay vì kết nối mỗi pixel với mọi pixel khác?",
    options: [
      "Vì GPU chỉ xử lý được ma trận 3×3",
      "Vì chia sẻ trọng số giúp giảm tham số và tạo tính bất biến dịch chuyển",
      "Vì ảnh chỉ có 3 kênh màu",
      "Vì đặc trưng luôn nằm ở góc trên bên trái",
    ],
    correct: 1,
    explanation: "Cùng một bộ lọc trượt qua mọi vị trí → chia sẻ trọng số → ít tham số hơn fully-connected rất nhiều. Và vì bộ lọc áp dụng ở mọi nơi, con mèo nằm góc trái hay góc phải đều được phát hiện.",
  },
  {
    question: "Ảnh 224×224×3 qua lớp Conv với 32 bộ lọc 3×3 (stride 1, padding 1). Output có kích thước gì?",
    options: ["224×224×32", "222×222×32", "112×112×32", "224×224×3"],
    correct: 0,
    explanation: "Padding 1 giữ nguyên kích thước không gian (224×224). Số kênh output = số bộ lọc = 32. Mỗi bộ lọc tạo ra một feature map.",
  },
  {
    question: "CNN hiện đại như ResNet-50 có ~25 triệu tham số. Nếu dùng fully-connected cho ảnh 224×224×3, lớp đầu tiên cần bao nhiêu tham số?",
    options: ["~25 triệu", "~150 nghìn", "~7 tỷ", "~25 tỷ"],
    correct: 3,
    explanation: "Fully-connected: 224×224×3 = 150.528 input. Nếu lớp ẩn cũng 150.528 neuron → 150.528² ≈ 22,6 tỷ tham số chỉ cho 1 lớp! CNN giảm con số này hàng nghìn lần nhờ chia sẻ trọng số.",
  },
  {
    type: "fill-blank",
    question: "Trong CNN, bộ lọc nhỏ trượt qua ảnh được gọi là {blank}, bước nhảy mỗi lần trượt là {blank}, và phần đệm viền giúp giữ kích thước output là {blank}.",
    blanks: [
      { answer: "kernel", accept: ["filter", "bộ lọc"] },
      { answer: "stride", accept: ["bước nhảy"] },
      { answer: "padding", accept: ["đệm"] },
    ],
    explanation: "Kernel (hay filter) là ma trận trọng số nhỏ trượt qua input. Stride là số pixel bộ lọc dịch chuyển mỗi bước. Padding thêm viền 0 quanh ảnh để kiểm soát kích thước output — padding = 1 với kernel 3×3 giữ nguyên kích thước.",
  },
];

/* ── Component ── */
export default function CnnTopic() {
  const [activeLayer, setActiveLayer] = useState(-1);
  const [filterPos, setFilterPos] = useState(0);
  const [featureLevel, setFeatureLevel] = useState(0);

  const onLayerClick = useCallback((i: number) => {
    setActiveLayer((prev) => (prev === i ? -1 : i));
  }, []);

  const TOTAL_STEPS = 8;

  return (
    <>
      {/* ═══ Step 1: HOOK ═══ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Ảnh 224×224 có ~150.000 pixel. Nếu mỗi pixel kết nối với mọi neuron (fully-connected), lớp đầu tiên cần hàng tỷ tham số. Có cách nào thông minh hơn không?"
          options={[
            "Giảm kích thước ảnh xuống thật nhỏ",
            "Dùng bộ lọc nhỏ trượt qua ảnh — mỗi lần chỉ nhìn một vùng",
            "Chuyển ảnh sang đen trắng để giảm dữ liệu",
          ]}
          correct={1}
          explanation="Đúng rồi! Thay vì nhìn toàn bộ ảnh cùng lúc, ta dùng một bộ lọc nhỏ (như 3×3) trượt qua từng vùng. Giống như bạn dùng kính lúp quét qua tấm bản đồ — mỗi lần chỉ xem một vùng nhỏ nhưng cuối cùng thấy hết."
        />
      </LessonSection>

      {/* ═══ Steps 2 & 4: VISUALIZATIONS ═══ */}
      <VisualizationSection topicSlug={metadata.slug}>
        <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá kiến trúc">
          <p className="text-sm text-foreground leading-relaxed mb-4">
            Hãy tưởng tượng bạn đang ở quán phở. Từ xa nhìn vào, bạn thấy{" "}
            <strong>hình dạng tổng thể</strong>{" "}
            (bàn, ghế). Lại gần hơn, bạn nhận ra <strong>chi tiết</strong>{" "}
            (tô phở, đũa). Sát hơn nữa, bạn thấy <strong>kết cấu</strong>{" "}
            (sợi phở, lá hành). CNN cũng &quot;nhìn&quot; theo cách này — từ đơn giản đến phức tạp.
          </p>

          <p className="text-sm text-muted mb-3">
            Nhấn vào từng lớp để xem vai trò. Kéo thanh trượt để di chuyển bộ lọc trên ảnh đầu vào.
          </p>

          <svg viewBox="0 0 520 220" className="w-full rounded-lg border border-border bg-background">
            {LAYERS.map((layer, i) => {
              const x = 18 + i * 62;
              const y = 100 - layer.h / 2;
              const isActive = activeLayer === i;

              return (
                <g key={i} className="cursor-pointer" onClick={() => onLayerClick(i)}>
                  <rect
                    x={x} y={y} width={layer.w} height={layer.h} rx={5}
                    fill={layer.color} opacity={isActive ? 0.4 : 0.15}
                    stroke={layer.color} strokeWidth={isActive ? 2.5 : 1}
                  />
                  {layer.w > 20 && (
                    <rect
                      x={x + 5} y={y - 5} width={layer.w} height={layer.h} rx={5}
                      fill="none" stroke={layer.color} strokeWidth={0.5} opacity={0.25}
                    />
                  )}
                  <text
                    x={x + layer.w / 2} y={100 + layer.h / 2 + 16}
                    fontSize={9} fill={layer.color} textAnchor="middle"
                    fontWeight={isActive ? 700 : 500}
                  >
                    {layer.name}
                  </text>
                  {i < LAYERS.length - 1 && (
                    <line
                      x1={x + layer.w + 2} y1={100} x2={x + 60} y2={100}
                      stroke="#666" strokeWidth={1} markerEnd="url(#cnn-arr)"
                    />
                  )}
                </g>
              );
            })}

            {/* Filter indicator on first layer */}
            {(activeLayer <= 0 || activeLayer === -1) && (
              <motion.rect
                x={18 + (filterPos / 100) * 57}
                y={100 - 41 + (filterPos / 100) * 32}
                width={25} height={25} fill="none"
                stroke="#f59e0b" strokeWidth={2.5} rx={3}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            )}

            <defs>
              <marker id="cnn-arr" markerWidth={8} markerHeight={6} refX={7} refY={3} orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#666" />
              </marker>
            </defs>

            {activeLayer >= 0 && (
              <g>
                <rect x={10} y={175} width={500} height={30} rx={8}
                  fill="currentColor" className="text-card" opacity={0.9} />
                <text x={260} y={195} fontSize={11} fill={LAYERS[activeLayer].color}
                  textAnchor="middle" fontWeight={600}>
                  {LAYERS[activeLayer].desc}
                </text>
              </g>
            )}
          </svg>

          <div className="mt-4 flex items-center gap-4">
            <label className="text-sm font-medium text-foreground">Vị trí bộ lọc:</label>
            <input
              type="range" min={0} max={100} value={filterPos}
              onChange={(e) => setFilterPos(Number(e.target.value))}
              className="flex-1 accent-accent"
            />
          </div>

          <p className="text-sm text-muted mt-3">
            Bạn vừa thấy bộ lọc trượt qua ảnh — đây chính là &quot;phép tích chập&quot;. Nhưng điều kỳ diệu thật sự nằm ở cách các lớp xếp chồng lên nhau...
          </p>
        </LessonSection>

        <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Phân cấp đặc trưng">
          <p className="text-sm text-muted mb-3">
            Nhấn vào từng cấp để xem CNN phát hiện gì ở mỗi độ sâu.
          </p>

          <div className="flex gap-2 mb-4">
            {FEATURES.map((f, i) => (
              <button
                key={i} type="button"
                onClick={() => setFeatureLevel(i)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                  featureLevel === i
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-border bg-card text-foreground hover:bg-surface"
                }`}
              >
                {f.level}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-background/50 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: FEATURES[featureLevel].color + "25" }}>
                <span className="text-sm font-bold" style={{ color: FEATURES[featureLevel].color }}>
                  {featureLevel + 1}
                </span>
              </div>
              <span className="font-semibold text-foreground">{FEATURES[featureLevel].level}</span>
            </div>

            <div className="flex flex-wrap gap-3">
              {FEATURES[featureLevel].examples.map((ex, i) => (
                <motion.div
                  key={`${featureLevel}-${i}`}
                  className="rounded-lg border px-4 py-3 text-sm font-medium"
                  style={{
                    borderColor: FEATURES[featureLevel].color + "50",
                    backgroundColor: FEATURES[featureLevel].color + "10",
                    color: FEATURES[featureLevel].color,
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1, type: "spring", stiffness: 300 }}
                >
                  {ex}
                </motion.div>
              ))}
            </div>

            <svg viewBox="0 0 400 60" className="w-full mt-4">
              {[0, 1, 2].map((lvl) => {
                const x = 30 + lvl * 140;
                const isActive = lvl === featureLevel;
                return (
                  <g key={lvl}>
                    <rect x={x} y={10} width={100} height={40} rx={8}
                      fill={FEATURES[lvl].color} opacity={isActive ? 0.3 : 0.08}
                      stroke={FEATURES[lvl].color} strokeWidth={isActive ? 2 : 0.5} />
                    <text x={x + 50} y={35} textAnchor="middle" fontSize={10}
                      fill={FEATURES[lvl].color} fontWeight={isActive ? 700 : 400}>
                      {FEATURES[lvl].level}
                    </text>
                    {lvl < 2 && (
                      <line x1={x + 102} y1={30} x2={x + 138} y2={30}
                        stroke="#666" strokeWidth={1.5}
                        markerEnd="url(#cnn-arr)" />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </LessonSection>
      </VisualizationSection>

      {/* ═══ Step 3: AHA MOMENT ═══ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>CNN</strong>{" "}
            không phải một bộ lọc đơn lẻ — nó là hàng chục lớp xếp chồng, mỗi lớp phát hiện đặc trưng phức tạp hơn lớp trước. Cạnh → hình dạng → vật thể hoàn chỉnh!
          </p>
          <p className="text-sm text-muted mt-1">
            Giống cách bạn xếp LEGO: viên gạch đơn → khối hình → ngôi nhà hoàn chỉnh. Mỗi lớp CNN xây trên nền của lớp trước.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ═══ Step 5: CHALLENGE ═══ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Ảnh 224×224×3 dùng fully-connected cần ~150.000 × 150.000 = 22,5 tỷ tham số cho lớp đầu. CNN với bộ lọc 3×3×3 và 32 filters cần bao nhiêu?"
          options={[
            "22,5 tỷ tham số (giống FC)",
            "3 × 3 × 3 × 32 + 32 = 896 tham số",
            "224 × 224 × 32 = ~1,6 triệu tham số",
          ]}
          correct={1}
          explanation="Chỉ 896 tham số! Mỗi bộ lọc có 3×3×3 = 27 trọng số + 1 bias = 28. Với 32 bộ lọc: 28 × 32 = 896. Giảm hàng triệu lần so với FC — đây là sức mạnh của chia sẻ trọng số!"
        />
      </LessonSection>

      {/* ═══ Step 6: EXPLAIN ═══ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích chi tiết">
        <ExplanationSection>
          <p>
            <strong>CNN (Convolutional Neural Network)</strong>{" "}
            là kiến trúc nền tảng cho thị giác máy tính, được lấy cảm hứng từ cách vỏ não thị giác của con người xử lý hình ảnh. Ba nguyên lý cốt lõi:
          </p>

          <Callout variant="insight" title="1. Kết nối cục bộ (Local Connectivity)">
            <p>
              Mỗi neuron chỉ nhìn một vùng nhỏ của input (receptive field), không phải toàn bộ ảnh. Giống bạn nhìn qua kính lúp — tập trung vào chi tiết cục bộ. Kích thước phổ biến: 3×3, 5×5, 7×7.
            </p>
          </Callout>

          <Callout variant="insight" title="2. Chia sẻ trọng số (Weight Sharing)">
            <p>
              Cùng một bộ lọc được dùng ở mọi vị trí trên ảnh. Nếu bộ lọc phát hiện cạnh dọc ở góc trái, nó cũng phát hiện cạnh dọc ở góc phải. Điều này tạo ra <strong>tính bất biến dịch chuyển</strong>{" "}
              (translation invariance).
            </p>
          </Callout>

          <Callout variant="insight" title="3. Phân cấp đặc trưng (Feature Hierarchy)">
            <p>
              Lớp nông phát hiện cạnh, kết cấu. Lớp giữa kết hợp thành hình dạng (mắt, mũi). Lớp sâu nhận diện vật thể hoàn chỉnh. Mỗi lớp xây trên nền lớp trước — giống xếp LEGO.
            </p>
          </Callout>

          <p className="mt-4 font-semibold text-foreground">Công thức tích chập:</p>
          <LaTeX block>{String.raw`\text{Output}(i,j) = \sum_{m}\sum_{n} \text{Input}(i+m, j+n) \cdot \text{Kernel}(m,n) + \text{bias}`}</LaTeX>

          <p className="mt-3">Kích thước output:</p>
          <LaTeX block>{String.raw`O = \frac{W - K + 2P}{S} + 1`}</LaTeX>
          <p className="text-sm text-muted">
            Trong đó: W = kích thước input, K = kích thước kernel, P = padding, S = stride.
          </p>

          <CodeBlock language="python" title="cnn_simple.py">
{`import torch.nn as nn

class SimpleCNN(nn.Module):
    def __init__(self, num_classes=10):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, kernel_size=3, padding=1),   # 224→224, 32 filters
            nn.ReLU(),
            nn.MaxPool2d(2),                               # 224→112
            nn.Conv2d(32, 64, kernel_size=3, padding=1),   # 112→112, 64 filters
            nn.ReLU(),
            nn.MaxPool2d(2),                               # 112→56
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),                                   # 64*56*56 = 200.704
            nn.Linear(64 * 56 * 56, 256),
            nn.ReLU(),
            nn.Linear(256, num_classes),                    # Output: 10 lớp
        )

    def forward(self, x):
        x = self.features(x)     # Trích xuất đặc trưng
        x = self.classifier(x)   # Phân loại
        return x

# Tổng tham số: ~51 triệu (chủ yếu ở FC layer)
# So với FC thuần: ~22,5 tỷ → giảm ~440 lần!`}
          </CodeBlock>

          <Callout variant="info" title="Các kiến trúc CNN nổi tiếng">
            <p>
              <strong>LeNet-5</strong>{" "}
              (1998): CNN đầu tiên cho nhận dạng chữ viết tay.{" "}
              <strong>AlexNet</strong>{" "}
              (2012): thắng ImageNet, khởi đầu kỷ nguyên deep learning.{" "}
              <strong>VGGNet</strong>{" "}
              (2014): chỉ dùng bộ lọc 3×3.{" "}
              <strong>ResNet</strong>{" "}
              (2015): skip connections, huấn luyện được mạng 152 lớp.{" "}
              <strong>EfficientNet</strong>{" "}
              (2019): tối ưu cân bằng depth/width/resolution.
            </p>
            <p className="mt-2 text-sm text-muted">
              CNN chuyên cho ảnh; với dữ liệu tuần tự như văn bản hoặc chuỗi thời gian, hãy xem{" "}
              <TopicLink slug="rnn">RNN</TopicLink>,{" "}
              <TopicLink slug="lstm">LSTM</TopicLink>{" "}
              và{" "}
              <TopicLink slug="transformer">Transformer</TopicLink>.
            </p>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ═══ Step 7: SUMMARY ═══ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về CNN"
          points={[
            "CNN dùng bộ lọc nhỏ trượt qua ảnh thay vì kết nối đầy đủ — giảm tham số hàng nghìn lần.",
            "Chia sẻ trọng số tạo tính bất biến dịch chuyển — con mèo ở đâu trong ảnh cũng được nhận ra.",
            "Phân cấp đặc trưng: cạnh → hình dạng → vật thể — mỗi lớp xây trên nền lớp trước.",
            "Kiến trúc: Conv → ReLU → Pool → ... → Flatten → FC → Output. Stride và padding kiểm soát kích thước.",
            "Từ LeNet đến ResNet, CNN là nền tảng của mọi bài toán thị giác máy tính hiện đại.",
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
