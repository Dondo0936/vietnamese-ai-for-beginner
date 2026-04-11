"use client";

import { useState } from "react";
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
  slug: "anchor-boxes",
  title: "Anchor Boxes",
  titleVi: "Anchor Boxes - Hộp neo",
  description:
    "Các hộp tham chiếu với tỷ lệ và kích thước khác nhau, dùng làm điểm khởi đầu để dự đoán bounding box.",
  category: "computer-vision",
  tags: ["computer-vision", "detection", "anchors"],
  difficulty: "intermediate",
  relatedSlugs: ["object-detection", "iou", "nms"],
  vizType: "interactive",
};

/* ── data ─────────────────────────────────────────────────── */
const SCALES = [0.5, 1.0, 1.5];
const RATIOS = [
  { w: 1, h: 2, label: "1:2 (người đứng)" },
  { w: 1, h: 1, label: "1:1 (biển số)" },
  { w: 2, h: 1, label: "2:1 (xe nằm)" },
];

const QUIZ: QuizQuestion[] = [
  {
    question: "Tại sao cần nhiều anchor box với tỷ lệ khác nhau?",
    options: [
      "Để tăng tốc quá trình huấn luyện",
      "Vì đối tượng trong ảnh có hình dạng đa dạng (người đứng dọc, xe nằm ngang, biển số vuông)",
      "Vì mỗi anchor chỉ dùng được 1 lần",
      "Để giảm số parameter của mô hình",
    ],
    correct: 1,
    explanation: "Đối tượng thực tế có hình dạng rất đa dạng: người đứng (dọc), xe (ngang), biển số (vuông). Nhiều anchor ratios giúp mô hình bắt đầu từ hình dạng gần nhất.",
  },
  {
    question: "Mô hình dự đoán gì dựa trên anchor box?",
    options: [
      "Tọa độ bounding box tuyệt đối",
      "Offset (dịch chuyển) so với anchor gần nhất: dx, dy, dw, dh",
      "Kích thước ảnh đầu vào",
      "Số lượng đối tượng trong ảnh",
    ],
    correct: 1,
    explanation: "Mô hình không dự đoán toạ độ từ đầu mà dự đoán OFFSET (dịch chuyển tâm + thay đổi kích thước) so với anchor. Dễ học hơn nhiều vì offset nhỏ!",
  },
  {
    question: "Phương pháp anchor-free (FCOS, CenterNet) khác anchor-based thế nào?",
    options: [
      "Không dùng bounding box",
      "Dự đoán trực tiếp từ tâm đối tượng, không cần đặt anchor trước",
      "Chỉ dùng cho ảnh nhỏ",
      "Không cần NMS",
    ],
    correct: 1,
    explanation: "Anchor-free dự đoán trực tiếp từ mỗi pixel: khoảng cách đến 4 cạnh bounding box. Không cần đặt anchor trước, đơn giản hơn và tránh hyperparameter tuning anchor.",
  },
];

/* ── component ────────────────────────────────────────────── */
export default function AnchorBoxesTopic() {
  const [scaleIdx, setScaleIdx] = useState(1);
  const [showAll, setShowAll] = useState(false);

  const scale = SCALES[scaleIdx];
  const cx = 300;
  const cy = 160;
  const baseSize = 50;

  return (
    <>
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Object Detection cần dự đoán bounding box (x, y, w, h) cho mỗi đối tượng. Dự đoán 4 số từ đầu (from scratch) hay điều chỉnh từ 1 hộp mẫu có sẵn -- cái nào dễ hơn?"
          options={[
            "Dự đoán từ đầu -- đơn giản hơn",
            "Điều chỉnh từ hộp mẫu -- chỉ cần offset nhỏ, dễ học hơn",
            "Cả hai đều khó như nhau",
          ]}
          correct={1}
          explanation="Giống như đoán cân nặng: đoán 'khoảng 60kg' rồi điều chỉnh '+2kg' dễ hơn nhiều so với đoán từ 0. Anchor box là 'hộp mẫu' giúp mô hình chỉ cần dự đoán offset nhỏ!"
        >

      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="space-y-1 flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-muted">
                  Tỷ lệ phóng: {scale.toFixed(1)}x
                </label>
                <input type="range" min="0" max="2" step="1" value={scaleIdx}
                  onChange={(e) => setScaleIdx(parseInt(e.target.value))} className="w-full accent-accent" />
              </div>
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  showAll ? "bg-accent text-white" : "bg-card border border-border text-muted"
                }`}
              >
                {showAll ? "Chỉ hiện tại tâm" : "Hiện lưới anchor"}
              </button>
            </div>

            <svg viewBox="0 0 600 340" className="w-full max-w-2xl mx-auto">
              <rect x="0" y="0" width="600" height="340" rx="8" fill="#0f172a" />

              {showAll && [1,2,3,4,5].map((r) =>
                [1,2,3,4,5,6,7].map((c) => (
                  <circle key={`grid-${r}-${c}`} cx={c * 75} cy={r * 55 + 5} r="2" fill="#475569" opacity={0.5} />
                ))
              )}

              {RATIOS.map((ratio, i) => {
                const w = baseSize * ratio.w * scale;
                const h = baseSize * ratio.h * scale;
                const colors = ["#3b82f6", "#22c55e", "#f59e0b"];
                return (
                  <g key={ratio.label}>
                    <rect x={cx - w} y={cy - h} width={w * 2} height={h * 2}
                      fill="none" stroke={colors[i]} strokeWidth="2"
                      strokeDasharray={i === 1 ? "none" : "6,3"} opacity={0.8} />
                    <text x={cx + w + 5} y={cy - h + 14} fill={colors[i]} fontSize="10" fontWeight="bold">
                      {ratio.label}
                    </text>
                  </g>
                );
              })}

              <circle cx={cx} cy={cy} r="4" fill="#ef4444" />
              <text x={cx} y={cy - 10} textAnchor="middle" fill="#ef4444" fontSize="9">
                Tâm anchor
              </text>

              {showAll && (
                <text x="300" y="330" textAnchor="middle" fill="#64748b" fontSize="10">
                  Mỗi điểm trên lưới: 3 tỷ lệ x {SCALES.length} kích thước = {3 * SCALES.length} anchor/điểm
                </text>
              )}
            </svg>

            <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
              <p className="text-sm text-muted">
                Tại mỗi vị trí: <strong className="text-accent">{RATIOS.length} tỷ lệ</strong>{" "}x{" "}
                <strong className="text-accent">{SCALES.length} kích thước</strong> ={" "}
                <strong className="text-accent">{RATIOS.length * SCALES.length} anchor boxes</strong>.
                Mô hình chọn anchor gần nhất rồi dự đoán offset!
              </p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Anchor box giống <strong>bản mẫu may quần áo</strong>: thay vì may từ vải trắng (dự đoán từ đầu),
            bạn chọn bản mẫu size gần nhất rồi chỉnh sửa nhẹ. Mô hình chỉ cần dự đoán 4 offset nhỏ{" "}
            (<LaTeX>{"\\Delta x, \\Delta y, \\Delta w, \\Delta h"}</LaTeX>) thay vì 4 toạ độ tuyệt đối!
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Faster R-CNN dùng 9 anchors/vị trí (3 tỷ lệ x 3 kích thước). Trên feature map 40x40, tổng cộng bao nhiêu anchor box?"
          options={[
            "360 anchor boxes",
            "14,400 anchor boxes (40 x 40 x 9)",
            "1,600 anchor boxes",
          ]}
          correct={1}
          explanation="40 x 40 = 1,600 vị trí. Mỗi vị trí 9 anchors. Tổng = 14,400 anchor boxes! Đó là lý do cần NMS để lọc -- hầu hết anchors là negative (không chứa đối tượng)."
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={8} label="Giải thích sâu">
        <ExplanationSection>
          <p>
            <strong>Anchor Boxes</strong>{" "}là tập hợp bounding box mẫu với tỷ lệ khung hình (aspect ratio) và kích thước
            (scale) xác định trước, đặt đều đặn trên lưới feature map.
          </p>

          <p><strong>Mô hình dự đoán offset từ anchor:</strong></p>
          <LaTeX block>{"t_x = \\frac{x - x_a}{w_a}, \\quad t_y = \\frac{y - y_a}{h_a}, \\quad t_w = \\log\\frac{w}{w_a}, \\quad t_h = \\log\\frac{h}{h_a}"}</LaTeX>
          <p className="text-sm text-muted">
            Với <LaTeX>{"(x_a, y_a, w_a, h_a)"}</LaTeX> là anchor và <LaTeX>{"(x, y, w, h)"}</LaTeX> là
            ground truth. Mô hình dự đoán <LaTeX>{"(t_x, t_y, t_w, t_h)"}</LaTeX> -- các offset nhỏ.
          </p>

          <Callout variant="insight" title="Gán nhãn anchor (Anchor Assignment)">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>Positive:</strong>{" "}Anchor có IoU &ge; 0.7 với ground truth bất kỳ</li>
              <li><strong>Negative:</strong>{" "}Anchor có IoU &lt; 0.3 với mọi ground truth</li>
              <li><strong>Bỏ qua:</strong>{" "}IoU giữa 0.3-0.7, không dùng cho huấn luyện</li>
            </ul>
          </Callout>

          <Callout variant="warning" title="Anchor-based vs Anchor-free">
            <div className="space-y-2 text-sm">
              <p><strong>Anchor-based (Faster R-CNN, SSD, YOLOv3-v5):</strong>{" "}Đặt anchor trước, dự đoán offset. Cần tuning anchor sizes.</p>
              <p><strong>Anchor-free (FCOS, CenterNet, YOLOv8+):</strong>{" "}Dự đoán trực tiếp từ tâm đối tượng. Đơn giản hơn, ít hyperparameter hơn. Xu hướng hiện đại!</p>
            </div>
          </Callout>

          <CodeBlock language="python" title="Tạo anchor boxes cho Faster R-CNN">
{`import numpy as np

def generate_anchors(
    feature_map_size=(40, 40),
    stride=16,               # ảnh 640x640, feature 40x40
    scales=[64, 128, 256],   # kích thước anchor (pixel)
    ratios=[0.5, 1.0, 2.0],  # tỷ lệ w/h
):
    anchors = []
    for y in range(feature_map_size[0]):
        for x in range(feature_map_size[1]):
            cx = (x + 0.5) * stride  # tâm x trên ảnh gốc
            cy = (y + 0.5) * stride  # tâm y trên ảnh gốc
            for s in scales:
                for r in ratios:
                    w = s * np.sqrt(r)
                    h = s / np.sqrt(r)
                    anchors.append([
                        cx - w/2, cy - h/2,  # top-left
                        cx + w/2, cy + h/2,  # bottom-right
                    ])
    return np.array(anchors)

anchors = generate_anchors()
print(f"Total anchors: {len(anchors)}")  # 14,400
print(f"Shape: {anchors.shape}")          # (14400, 4)`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={8} label="Tóm tắt">
        <MiniSummary points={[
          "Anchor box = hộp mẫu đặt sẵn trên feature map, nhiều tỷ lệ + kích thước",
          "Mô hình dự đoán offset (dx, dy, dw, dh) từ anchor gần nhất -- dễ học hơn dự đoán tuyệt đối",
          "Faster R-CNN: 9 anchors/vị trí -> hàng ngàn anchors tổng cộng, cần NMS lọc",
          "Xu hướng mới: anchor-free (FCOS, YOLOv8) -- dự đoán trực tiếp, ít hyperparameter",
        ]} />
      </LessonSection>

      <LessonSection step={7} totalSteps={8} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
