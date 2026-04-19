"use client";

import { useState, useMemo } from "react";
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
  slug: "nms",
  title: "Non-Maximum Suppression",
  titleVi: "NMS - Triệt tiêu không cực đại",
  description:
    "Thuật toán loại bỏ các bounding box trùng lặp, chỉ giữ lại box tốt nhất cho mỗi đối tượng.",
  category: "computer-vision",
  tags: ["computer-vision", "detection", "post-processing"],
  difficulty: "intermediate",
  relatedSlugs: ["object-detection", "iou", "anchor-boxes"],
  vizType: "interactive",
};

/* ── data ─────────────────────────────────────────────────── */
interface Box { id: number; x: number; y: number; w: number; h: number; conf: number; color: string }

const ALL_BOXES: Box[] = [
  { id: 1, x: 80, y: 60, w: 150, h: 130, conf: 0.95, color: "#3b82f6" },
  { id: 2, x: 90, y: 50, w: 140, h: 140, conf: 0.85, color: "#60a5fa" },
  { id: 3, x: 70, y: 70, w: 160, h: 120, conf: 0.72, color: "#93c5fd" },
  { id: 4, x: 350, y: 80, w: 120, h: 160, conf: 0.90, color: "#22c55e" },
  { id: 5, x: 360, y: 90, w: 110, h: 150, conf: 0.78, color: "#4ade80" },
  { id: 6, x: 340, y: 75, w: 130, h: 155, conf: 0.65, color: "#86efac" },
];

function computeIoU(a: Box, b: Box): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const union = a.w * a.h + b.w * b.h - intersection;
  return intersection / union;
}

const QUIZ: QuizQuestion[] = [
  {
    question: "NMS loại bỏ box dựa trên tiêu chí nào?",
    options: [
      "Loại box có kích thước nhỏ nhất",
      "Loại box có IoU cao với box đã chọn (trùng lặp)",
      "Loại box có màu sắc giống nhau",
      "Loại box ở rìa ảnh",
    ],
    correct: 1,
    explanation: "NMS giữ box confidence cao nhất, rồi loại tất cả box có IoU > ngưỡng (thường 0.5) với box đã chọn. Lặp lại cho đến khi hết box.",
  },
  {
    question: "Nếu tăng ngưỡng IoU trong NMS từ 0.3 lên 0.7, điều gì xảy ra?",
    options: [
      "Ít box bị loại hơn (giữ nhiều box hơn)",
      "Nhiều box bị loại hơn (giữ ít box hơn)",
      "Không thay đổi gì",
      "Mô hình chạy nhanh hơn",
    ],
    correct: 0,
    explanation: "Ngưỡng IoU cao hơn = khó bị loại hơn (cần trùng lặp nhiều hơn mới bị loại). Kết quả: giữ NHIỀU box hơn, có thể có vài box trùng. Ngưỡng thấp = lọc mạnh hơn.",
  },
  {
    question: "Soft-NMS khác NMS thông thường ở điểm nào?",
    options: [
      "Không dùng IoU",
      "Giảm confidence của box trùng thay vì loại bỏ hoàn toàn",
      "Chỉ áp dụng cho ảnh mờ",
      "Tăng confidence của box tốt nhất",
    ],
    correct: 1,
    explanation: "NMS cứng: loại hoàn toàn box trùng. Soft-NMS: giảm confidence theo mức IoU (trùng ít → giảm ít). Tốt hơn khi đối tượng che khuất nhau (occlusion).",
  },
];

/* ── component ────────────────────────────────────────────── */
export default function NmsTopic() {
  const [iouThreshold, setIouThreshold] = useState(0.5);
  const [applied, setApplied] = useState(false);

  const keptBoxes = useMemo(() => {
    const sorted = [...ALL_BOXES].sort((a, b) => b.conf - a.conf);
    const kept: Box[] = [];
    const suppressed = new Set<number>();
    for (const box of sorted) {
      if (suppressed.has(box.id)) continue;
      kept.push(box);
      for (const other of sorted) {
        if (other.id !== box.id && !suppressed.has(other.id)) {
          if (computeIoU(box, other) > iouThreshold) {
            suppressed.add(other.id);
          }
        }
      }
    }
    return kept;
  }, [iouThreshold]);

  const displayBoxes = applied ? keptBoxes : ALL_BOXES;

  return (
    <>
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="YOLO dự đoán 300 bounding box cho 1 ảnh. Mỗi chiếc xe máy bị vây quanh bởi 5-10 box chồng chéo. Giữ tất cả hay loại bớt?"
          options={[
            "Giữ tất cả -- nhiều box = chính xác hơn",
            "Chỉ giữ box tốt nhất cho mỗi đối tượng, loại box trùng lặp",
            "Loại ngẫu nhiên cho đến khi còn 10 box",
          ]}
          correct={1}
          explanation="Giữ 10 box cho 1 xe máy là thừa thãi! NMS giữ box confidence cao nhất và loại bỏ các box chồng lấp. Kết quả: 1 box duy nhất cho mỗi đối tượng."
        >

      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4 items-center">
              <button
                type="button"
                onClick={() => setApplied(!applied)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  applied ? "bg-accent text-white" : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                {applied ? "Hiện tất cả box" : "Ap dụng NMS"}
              </button>
              <div className="space-y-1 flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-muted">
                  Ngưỡng IoU: {iouThreshold.toFixed(2)}
                </label>
                <input type="range" min="0.1" max="0.9" step="0.05" value={iouThreshold}
                  onChange={(e) => setIouThreshold(parseFloat(e.target.value))} className="w-full accent-accent" />
              </div>
            </div>

            <svg viewBox="0 0 600 300" className="w-full max-w-2xl mx-auto">
              <rect x="0" y="0" width="600" height="300" rx="8" fill="#0f172a" />
              <ellipse cx="155" cy="130" rx="50" ry="45" fill="#334155" opacity={0.4} />
              <ellipse cx="410" cy="160" rx="40" ry="55" fill="#334155" opacity={0.4} />

              {displayBoxes.map((box) => (
                <g key={box.id}>
                  <rect x={box.x} y={box.y} width={box.w} height={box.h}
                    fill="none" stroke={box.color} strokeWidth={2} opacity={0.9} />
                  <rect x={box.x} y={box.y - 16} width={50} height="16" fill={box.color} rx="3" />
                  <text x={box.x + 4} y={box.y - 4} fill="white" fontSize="11" fontWeight="bold">
                    {(box.conf * 100).toFixed(0)}%
                  </text>
                </g>
              ))}
            </svg>

            <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
              <p className="text-sm text-muted">
                {applied ? (
                  <>
                    Sau NMS: <strong className="text-green-500">{keptBoxes.length}</strong> box
                    (loại bỏ <strong className="text-red-500">{ALL_BOXES.length - keptBoxes.length}</strong> box trùng lặp)
                  </>
                ) : (
                  <>
                    Trước NMS: <strong className="text-accent">{ALL_BOXES.length}</strong> box
                    chồng chéo. Nhấn nút để NMS lọc!
                  </>
                )}
              </p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            NMS giống <strong>chọn ảnh đại diện</strong>{" "}cho album: bạn chụp 10 ảnh selfie liên tiếp (rất giống nhau),
            chọn 1 ảnh đẹp nhất, xoá 9 ảnh còn lại. NMS chọn box có <strong>confidence cao nhất</strong>, loại tất cả
            box <strong>trùng lặp</strong>{" "}(IoU cao). Đơn giản nhưng <strong>không thể thiếu</strong>{" "}trong mọi detector!
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="2 người đứng sát nhau, box chồng lấp nhiều (IoU = 0.6). NMS với ngưỡng 0.5 sẽ loại 1 box. Nhưng thực tế có 2 người! Làm sao?"
          options={[
            "Tăng ngưỡng IoU lên cao hơn (VD: 0.7) để giữ cả 2 box",
            "Giảm ngưỡng IoU xuống 0.3",
            "Bỏ NMS hoàn toàn",
          ]}
          correct={0}
          explanation="Khi đối tượng gần nhau, tăng ngưỡng IoU giữ nhiều box hơn. Hoặc dùng Soft-NMS: thay vì loại bỏ, chỉ giảm confidence box trùng. Tuning ngưỡng IoU rất quan trọng!"
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={8} label="Giải thích sâu">
        <ExplanationSection>
          <p>
            <strong>Non-Maximum Suppression (NMS)</strong>{" "}là bước hậu xử lý bắt buộc trong phát hiện đối tượng,
            loại bỏ box trùng lặp, giữ box tốt nhất.
          </p>

          <Callout variant="insight" title="Thuật toán NMS (4 bước)">
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li><strong>Sắp xếp</strong>{" "}tất cả box theo confidence giảm dần</li>
              <li><strong>Chọn</strong>{" "}box confidence cao nhất, thêm vào kết quả</li>
              <li><strong>Loại bỏ</strong>{" "}tất cả box còn lại có IoU &gt; ngưỡng với box vừa chọn</li>
              <li><strong>Lặp lại</strong>{" "}bước 2-3 cho đến khi hết box</li>
            </ol>
          </Callout>

          <p><strong>Soft-NMS</strong>{" "}-- giảm confidence thay vì loại bỏ:</p>
          <LaTeX block>{"s_i = \\begin{cases} s_i & \\text{if } \\text{IoU} < N_t \\\\ s_i \\cdot e^{-\\frac{\\text{IoU}^2}{\\sigma}} & \\text{if } \\text{IoU} \\geq N_t \\end{cases}"}</LaTeX>
          <p className="text-sm text-muted">
            Box trùng nhiều (IoU cao) bị giảm confidence mạnh. Box trùng ít giữ nguyên. Tốt hơn cho đối tượng che khuất nhau.
          </p>

          <Callout variant="warning" title="Các biến thể NMS">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>Standard NMS:</strong>{" "}Loại bỏ hoàn toàn box trùng. Đơn giản, nhanh.</li>
              <li><strong>Soft-NMS:</strong>{" "}Giảm confidence thay vì loại. Tốt cho occlusion.</li>
              <li><strong>DIoU-NMS:</strong>{" "}Xét thêm khoảng cách tâm, không chỉ IoU.</li>
              <li><strong>Matrix NMS:</strong>{" "}Song song hoá NMS trên GPU, nhanh gấp nhiều lần.</li>
            </ul>
          </Callout>

          <CodeBlock language="python" title="NMS với torchvision">
{`import torch
from torchvision.ops import nms, batched_nms

# Boxes: (N, 4) format [x1, y1, x2, y2]
boxes = torch.tensor([
    [80, 60, 230, 190],   # box 1: conf 0.95
    [90, 50, 230, 190],   # box 2: conf 0.85 (trùng box 1)
    [70, 70, 230, 190],   # box 3: conf 0.72 (trùng box 1)
    [350, 80, 470, 240],  # box 4: conf 0.90
    [360, 90, 470, 240],  # box 5: conf 0.78 (trùng box 4)
], dtype=torch.float32)

scores = torch.tensor([0.95, 0.85, 0.72, 0.90, 0.78])

# NMS với ngưỡng IoU = 0.5
keep = nms(boxes, scores, iou_threshold=0.5)
print(f"Giữ lại box: {keep.tolist()}")  # [0, 3]
# Box 0 (95%) và box 3 (90%) -- 1 box/đối tượng!

# Batched NMS (theo class)
classes = torch.tensor([0, 0, 0, 1, 1])  # class 0, class 1
keep = batched_nms(boxes, scores, classes, iou_threshold=0.5)`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={8} label="Tóm tắt">
        <MiniSummary points={[
          "NMS loại bỏ box trùng lặp: giữ box confidence cao nhất, loại box có IoU > ngưỡng",
          "Thuật toán: sắp xếp → chọn tốt nhất → loại trùng → lặp lại",
          "Ngưỡng IoU cao = giữ nhiều box (tốt khi đối tượng gần nhau), thấp = lọc mạnh",
          "Soft-NMS giảm confidence thay vì loại bỏ -- tốt hơn khi đối tượng che khuất nhau",
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
