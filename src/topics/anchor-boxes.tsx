"use client";
import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { PredictionGate, AhaMoment, InlineChallenge, Callout, CollapsibleDetail,
  MiniSummary, CodeBlock, LessonSection, LaTeX, TopicLink, ProgressSteps } from "@/components/interactive";
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

/* ──────────────────────────────────────────────────────────────
 * Hằng số hình học cho canvas trực quan hoá.
 * Kích thước nền 400×300, tâm lưới đặt tại (200, 150).
 * Tất cả toạ độ anchor đều tính tương đối theo baseSize và scale.
 * ────────────────────────────────────────────────────────────── */
const CANVAS_W = 400;
const CANVAS_H = 300;
const GRID_CX = 200;
const GRID_CY = 150;
const BASE_SIZE = 40;

/* Ground truth object nằm lệch so với tâm lưới để phần regression
 * target có ý nghĩa (nếu GT trùng anchor thì dx=dy=dw=dh=0, vô vị). */
const GROUND_TRUTH = {
  x: 230,   // tâm x của đối tượng trên ảnh
  y: 170,   // tâm y của đối tượng trên ảnh
  w: 110,   // chiều rộng của đối tượng
  h: 150,   // chiều cao của đối tượng
  label: "Người đứng",
};

/* 3 tỷ lệ khung hình (aspect ratio w/h) phổ biến trong Faster R-CNN */
const RATIOS: { r: number; label: string }[] = [
  { r: 0.5, label: "1:2" },
  { r: 1.0, label: "1:1" },
  { r: 2.0, label: "2:1" },
];

/* 3 kích thước (scale) tính theo bội số của BASE_SIZE */
const SCALES: { s: number; label: string }[] = [
  { s: 0.7, label: "nhỏ" },
  { s: 1.0, label: "vừa" },
  { s: 1.4, label: "lớn" },
];

/* Màu sắc cho từng cặp (ratioIdx, scaleIdx) — tạo 9 màu distinct */
const ANCHOR_PALETTE = [
  "#3b82f6", "#22c55e", "#f59e0b",
  "#a855f7", "#ec4899", "#14b8a6",
  "#ef4444", "#eab308", "#0ea5e9",
];

/* ──────────────────────────────────────────────────────────────
 * Tính toán 9 anchor box xoay quanh tâm lưới.
 * Mỗi anchor có: id, tâm (cx, cy), kích thước (w, h), màu.
 * ────────────────────────────────────────────────────────────── */
type Anchor = {
  id: number;
  cx: number;
  cy: number;
  w: number;
  h: number;
  color: string;
  ratioLabel: string;
  scaleLabel: string;
  area: number;
};

function generateAnchors(cx: number, cy: number, baseSize: number): Anchor[] {
  const anchors: Anchor[] = [];
  let idx = 0;
  for (let sIdx = 0; sIdx < SCALES.length; sIdx++) {
    for (let rIdx = 0; rIdx < RATIOS.length; rIdx++) {
      const s = SCALES[sIdx].s;
      const r = RATIOS[rIdx].r;
      const size = baseSize * s;
      // Giữ area không đổi theo scale, chia tỷ lệ theo sqrt(r)
      const w = size * Math.sqrt(r) * 1.8;
      const h = (size / Math.sqrt(r)) * 1.8;
      anchors.push({
        id: idx,
        cx,
        cy,
        w,
        h,
        color: ANCHOR_PALETTE[idx],
        ratioLabel: RATIOS[rIdx].label,
        scaleLabel: SCALES[sIdx].label,
        area: w * h,
      });
      idx++;
    }
  }
  return anchors;
}

/* ──────────────────────────────────────────────────────────────
 * Hàm IoU (Intersection over Union) cho 2 hộp (cx, cy, w, h).
 * Trả về giá trị 0.0 → 1.0. Dùng để highlight chất lượng matching.
 * ────────────────────────────────────────────────────────────── */
function iou(
  a: { cx: number; cy: number; w: number; h: number },
  b: { cx: number; cy: number; w: number; h: number },
): number {
  const ax1 = a.cx - a.w / 2;
  const ay1 = a.cy - a.h / 2;
  const ax2 = a.cx + a.w / 2;
  const ay2 = a.cy + a.h / 2;
  const bx1 = b.cx - b.w / 2;
  const by1 = b.cy - b.h / 2;
  const bx2 = b.cx + b.w / 2;
  const by2 = b.cy + b.h / 2;

  const interX1 = Math.max(ax1, bx1);
  const interY1 = Math.max(ay1, by1);
  const interX2 = Math.min(ax2, bx2);
  const interY2 = Math.min(ay2, by2);

  const interW = Math.max(0, interX2 - interX1);
  const interH = Math.max(0, interY2 - interY1);
  const interArea = interW * interH;

  const areaA = (ax2 - ax1) * (ay2 - ay1);
  const areaB = (bx2 - bx1) * (by2 - by1);
  const union = areaA + areaB - interArea;
  if (union <= 0) return 0;
  return interArea / union;
}

/* ──────────────────────────────────────────────────────────────
 * Regression target — công thức Faster R-CNN.
 *   t_x = (x - x_a) / w_a
 *   t_y = (y - y_a) / h_a
 *   t_w = log(w / w_a)
 *   t_h = log(h / h_a)
 * Đây chính là 4 số mà mô hình học để dự đoán.
 * ────────────────────────────────────────────────────────────── */
function regressionTarget(anchor: Anchor, gt: typeof GROUND_TRUTH) {
  return {
    dx: (gt.x - anchor.cx) / anchor.w,
    dy: (gt.y - anchor.cy) / anchor.h,
    dw: Math.log(gt.w / anchor.w),
    dh: Math.log(gt.h / anchor.h),
  };
}

/* Phân loại anchor theo IoU — chuẩn Faster R-CNN */
function classifyAnchor(score: number): {
  label: string;
  color: string;
  description: string;
} {
  if (score >= 0.7) {
    return {
      label: "Positive",
      color: "#22c55e",
      description: "IoU ≥ 0.7 — Dùng cho huấn luyện, mô hình học offset ở đây",
    };
  }
  if (score < 0.3) {
    return {
      label: "Negative",
      color: "#ef4444",
      description: "IoU < 0.3 — Background, học để nói \"không có đối tượng\"",
    };
  }
  return {
    label: "Bỏ qua",
    color: "#94a3b8",
    description: "0.3 ≤ IoU < 0.7 — Mơ hồ, không dùng cho training",
  };
}

/* ──────────────────────────────────────────────────────────────
 * Bộ câu hỏi — 8 quiz questions phủ đa dạng khái niệm.
 * ────────────────────────────────────────────────────────────── */
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
    explanation:
      "Đối tượng thực tế có hình dạng rất đa dạng: người đứng (dọc), xe (ngang), biển số (vuông). Nhiều anchor ratios giúp mô hình bắt đầu từ hình dạng gần nhất.",
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
    explanation:
      "Mô hình không dự đoán toạ độ từ đầu mà dự đoán OFFSET (dịch chuyển tâm + thay đổi kích thước) so với anchor. Dễ học hơn nhiều vì offset nhỏ!",
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
    explanation:
      "Anchor-free dự đoán trực tiếp từ mỗi pixel: khoảng cách đến 4 cạnh bounding box. Không cần đặt anchor trước, đơn giản hơn và tránh hyperparameter tuning anchor.",
  },
  {
    question: "Ngưỡng IoU nào được Faster R-CNN dùng để gán nhãn positive anchor?",
    options: [
      "IoU ≥ 0.5",
      "IoU ≥ 0.7 hoặc là anchor có IoU cao nhất với 1 ground truth",
      "IoU ≥ 0.3",
      "IoU ≥ 0.9",
    ],
    correct: 1,
    explanation:
      "Faster R-CNN: positive = IoU ≥ 0.7 HOẶC anchor có IoU lớn nhất với 1 GT (phòng trường hợp GT nhỏ không có anchor nào đạt 0.7). Negative = IoU < 0.3.",
  },
  {
    question: "Vì sao t_w và t_h dùng log thay vì tỷ số w/w_a trực tiếp?",
    options: [
      "Để tính toán nhanh hơn",
      "Để đảm bảo w > 0 sau khi decode (exp luôn dương) và phân phối target gần 0, dễ học",
      "Vì log là yêu cầu của PyTorch",
      "Không có lý do đặc biệt",
    ],
    correct: 1,
    explanation:
      "Dự đoán t_w rồi w = w_a · exp(t_w) đảm bảo w luôn dương. Ngoài ra log đưa tỷ số về thang đối xứng quanh 0 (log(2)=0.69, log(0.5)=-0.69), giúp regression loss ổn định hơn nhiều so với tỷ số trực tiếp.",
  },
  {
    question: "Trên feature map 50×50 với 9 anchor/vị trí, tổng số anchor là bao nhiêu?",
    options: [
      "450",
      "2,500",
      "22,500",
      "250,000",
    ],
    correct: 2,
    explanation:
      "50 × 50 × 9 = 22,500 anchor. Hầu hết là negative (background). Đó là lý do RPN cần sampling: lấy 256 anchor cho mỗi ảnh với tỷ lệ 1:1 positive:negative để cân bằng loss.",
  },
  {
    question: "Khi đối tượng rất nhỏ (ví dụ 15×15 px trên ảnh 640×640), điều gì dễ xảy ra?",
    options: [
      "Mô hình phát hiện dễ hơn vì đối tượng rõ",
      "Không anchor nào đạt IoU ≥ 0.7 → đối tượng bị bỏ sót. Cần FPN hoặc anchor nhỏ hơn",
      "Anchor-free không giúp gì",
      "IoU luôn ≥ 0.9 cho đối tượng nhỏ",
    ],
    correct: 1,
    explanation:
      "Anchor nhỏ nhất trong Faster R-CNN là 64px — với object 15×15 px, IoU tối đa chỉ ~0.1. Giải pháp: FPN (Feature Pyramid Network) dùng feature map độ phân giải cao + anchor nhỏ để bắt object nhỏ.",
  },
  {
    question: "Anchor-free (YOLOv8) có hoàn toàn không còn hộp tham chiếu không?",
    options: [
      "Đúng, hoàn toàn không có hộp",
      "Vẫn có grid cell — mỗi cell dự đoán khoảng cách đến 4 cạnh object. \"Anchor-free\" nghĩa là bỏ anchor với ratio/scale cố định",
      "YOLOv8 vẫn là anchor-based",
      "Chỉ anchor-free khi dùng GPU",
    ],
    correct: 1,
    explanation:
      "\"Anchor-free\" không phải \"grid-free\". Mỗi ô trên feature map vẫn dự đoán. Điểm khác: không có hộp mẫu với ratio/scale preset. Thay vào đó dự đoán l, t, r, b (khoảng cách đến 4 cạnh object) hoặc center + size trực tiếp.",
  },
];

/* ──────────────────────────────────────────────────────────────
 * Component chính
 * ────────────────────────────────────────────────────────────── */
export default function AnchorBoxesTopic() {
  const [hoveredAnchorId, setHoveredAnchorId] = useState<number | null>(null);
  const [showAllAnchors, setShowAllAnchors] = useState(true);
  const [showGroundTruth, setShowGroundTruth] = useState(true);
  const [baseSizeMul, setBaseSizeMul] = useState(1.0);

  /* 9 anchor được memoize theo baseSize hiện tại */
  const anchors = useMemo(
    () => generateAnchors(GRID_CX, GRID_CY, BASE_SIZE * baseSizeMul),
    [baseSizeMul],
  );

  /* Tính IoU của từng anchor với GT (dành cho tô màu + phân loại) */
  const anchorScores = useMemo(
    () => anchors.map((a) => ({ ...a, iouScore: iou(a, { cx: GROUND_TRUTH.x, cy: GROUND_TRUTH.y, w: GROUND_TRUTH.w, h: GROUND_TRUTH.h }) })),
    [anchors],
  );

  /* Anchor được hover — dùng cho bảng chi tiết regression target */
  const hoveredAnchor = useMemo(() => {
    if (hoveredAnchorId === null) return null;
    return anchorScores.find((a) => a.id === hoveredAnchorId) ?? null;
  }, [hoveredAnchorId, anchorScores]);

  const hoveredTarget = useMemo(() => {
    if (!hoveredAnchor) return null;
    return regressionTarget(hoveredAnchor, GROUND_TRUTH);
  }, [hoveredAnchor]);

  /* Anchor có IoU cao nhất — dùng để vẽ viền nổi bật "best match" */
  const bestAnchorId = useMemo(() => {
    let bestId = 0;
    let bestIou = -1;
    for (const a of anchorScores) {
      if (a.iouScore > bestIou) {
        bestIou = a.iouScore;
        bestId = a.id;
      }
    }
    return bestId;
  }, [anchorScores]);

  const handleHover = useCallback((id: number | null) => {
    setHoveredAnchorId(id);
  }, []);

  /* Dùng lại cho summary card bên dưới canvas */
  const positiveCount = anchorScores.filter((a) => a.iouScore >= 0.7).length;
  const negativeCount = anchorScores.filter((a) => a.iouScore < 0.3).length;
  const ignoreCount = anchorScores.length - positiveCount - negativeCount;

  return (
    <>
      {/* ── 1. DỰ ĐOÁN ────────────────────────────────────────── */}
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Object Detection cần dự đoán bounding box (x, y, w, h) cho mỗi đối tượng. Dự đoán 4 số từ đầu (from scratch) hay điều chỉnh từ 1 hộp mẫu có sẵn — cái nào dễ hơn?"
          options={[
            "Dự đoán từ đầu — đơn giản hơn",
            "Điều chỉnh từ hộp mẫu — chỉ cần offset nhỏ, dễ học hơn",
            "Cả hai đều khó như nhau",
          ]}
          correct={1}
          explanation="Giống như đoán cân nặng: đoán 'khoảng 60kg' rồi điều chỉnh '+2kg' dễ hơn nhiều so với đoán từ 0. Anchor box là 'hộp mẫu' giúp mô hình chỉ cần dự đoán offset nhỏ!"
        >
          <p className="text-sm text-muted mt-2">
            Hãy quan sát 9 anchor box quanh 1 vị trí, chạm vào từng hộp để xem IoU + regression target.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ── 2. KHÁM PHÁ ───────────────────────────────────────── */}
      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-foreground mb-1">
                9 anchor box tại 1 vị trí (3 tỷ lệ × 3 kích thước)
              </h3>
              <p className="text-sm text-muted">
                Di chuột lên từng hộp để xem IoU với ground truth và 4 giá trị{" "}
                <LaTeX>{"(t_x, t_y, t_w, t_h)"}</LaTeX> — chính là thứ mô hình học.
              </p>
            </div>

            {/* Điều khiển */}
            <div className="flex flex-wrap gap-4 items-center text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showAllAnchors}
                  onChange={(e) => setShowAllAnchors(e.target.checked)}
                  className="accent-accent"
                />
                <span>Hiện cả 9 anchor</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showGroundTruth}
                  onChange={(e) => setShowGroundTruth(e.target.checked)}
                  className="accent-accent"
                />
                <span>Hiện ground truth</span>
              </label>
              <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                <span className="text-muted whitespace-nowrap">Kích thước cơ sở:</span>
                <input
                  type="range"
                  min="0.6"
                  max="1.4"
                  step="0.05"
                  value={baseSizeMul}
                  onChange={(e) => setBaseSizeMul(parseFloat(e.target.value))}
                  className="flex-1 accent-accent"
                />
                <span className="tabular-nums text-foreground">{baseSizeMul.toFixed(2)}×</span>
              </div>
            </div>

            {/* Canvas chính */}
            <div className="rounded-xl bg-background/60 border border-border p-3">
              <svg
                viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
                className="w-full max-w-xl mx-auto block"
                role="img"
                aria-label="Canvas trực quan hoá anchor box"
              >
                {/* Nền tối giả lập image */}
                <rect x="0" y="0" width={CANVAS_W} height={CANVAS_H} rx="8" fill="#0f172a" />

                {/* Lưới mờ — chia 8×6 ô cho cảm giác spatial */}
                {Array.from({ length: 7 }, (_, i) => (
                  <line
                    key={`vline-${i}`}
                    x1={((i + 1) * CANVAS_W) / 8}
                    x2={((i + 1) * CANVAS_W) / 8}
                    y1={0}
                    y2={CANVAS_H}
                    stroke="#1e293b"
                    strokeWidth={1}
                  />
                ))}
                {Array.from({ length: 5 }, (_, i) => (
                  <line
                    key={`hline-${i}`}
                    x1={0}
                    x2={CANVAS_W}
                    y1={((i + 1) * CANVAS_H) / 6}
                    y2={((i + 1) * CANVAS_H) / 6}
                    stroke="#1e293b"
                    strokeWidth={1}
                  />
                ))}

                {/* Ground truth object */}
                {showGroundTruth && (
                  <g>
                    <motion.rect
                      x={GROUND_TRUTH.x - GROUND_TRUTH.w / 2}
                      y={GROUND_TRUTH.y - GROUND_TRUTH.h / 2}
                      width={GROUND_TRUTH.w}
                      height={GROUND_TRUTH.h}
                      fill="#0ea5e9"
                      fillOpacity={0.12}
                      stroke="#0ea5e9"
                      strokeWidth={2.5}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4 }}
                    />
                    <text
                      x={GROUND_TRUTH.x - GROUND_TRUTH.w / 2 + 4}
                      y={GROUND_TRUTH.y - GROUND_TRUTH.h / 2 + 12}
                      fill="#0ea5e9"
                      fontSize="11"
                      fontWeight="bold"
                    >
                      GT: {GROUND_TRUTH.label}
                    </text>
                  </g>
                )}

                {/* 9 anchor — vẽ xong hover được highlight */}
                {showAllAnchors &&
                  anchorScores.map((a) => {
                    const isHovered = hoveredAnchorId === a.id;
                    const isBest = a.id === bestAnchorId;
                    const classification = classifyAnchor(a.iouScore);
                    const opacity = hoveredAnchorId === null ? 0.55 : isHovered ? 1 : 0.15;
                    return (
                      <g key={a.id}>
                        <motion.rect
                          x={a.cx - a.w / 2}
                          y={a.cy - a.h / 2}
                          width={a.w}
                          height={a.h}
                          fill="none"
                          stroke={a.color}
                          strokeWidth={isHovered ? 3 : isBest ? 2.5 : 1.5}
                          strokeDasharray={isHovered ? "none" : "4,3"}
                          opacity={opacity}
                          onMouseEnter={() => handleHover(a.id)}
                          onMouseLeave={() => handleHover(null)}
                          style={{ cursor: "pointer" }}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity }}
                          transition={{ duration: 0.25, delay: a.id * 0.02 }}
                        />
                        {isHovered && (
                          <g pointerEvents="none">
                            <rect
                              x={a.cx - a.w / 2 - 2}
                              y={a.cy - a.h / 2 - 16}
                              width={90}
                              height={14}
                              fill={classification.color}
                              rx={3}
                            />
                            <text
                              x={a.cx - a.w / 2 + 2}
                              y={a.cy - a.h / 2 - 6}
                              fill="white"
                              fontSize="11"
                              fontWeight="bold"
                            >
                              {classification.label} · IoU {a.iouScore.toFixed(2)}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}

                {/* Tâm lưới */}
                <circle cx={GRID_CX} cy={GRID_CY} r={4} fill="#ef4444" />
                <text
                  x={GRID_CX}
                  y={GRID_CY - 10}
                  textAnchor="middle"
                  fill="#ef4444"
                  fontSize="11"
                  fontWeight="bold"
                >
                  Tâm lưới
                </text>

                {/* Nếu đang hover, vẽ mũi tên delta tâm từ anchor → GT */}
                {hoveredAnchor && showGroundTruth && (
                  <g pointerEvents="none">
                    <line
                      x1={hoveredAnchor.cx}
                      y1={hoveredAnchor.cy}
                      x2={GROUND_TRUTH.x}
                      y2={GROUND_TRUTH.y}
                      stroke="#facc15"
                      strokeWidth={2}
                      strokeDasharray="3,2"
                    />
                    <circle cx={GROUND_TRUTH.x} cy={GROUND_TRUTH.y} r={3} fill="#facc15" />
                  </g>
                )}
              </svg>
            </div>

            {/* Bảng 9 anchor — grid chọn nhanh */}
            <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
              {anchorScores.map((a) => {
                const classification = classifyAnchor(a.iouScore);
                const isHovered = hoveredAnchorId === a.id;
                return (
                  <button
                    type="button"
                    key={a.id}
                    onMouseEnter={() => handleHover(a.id)}
                    onMouseLeave={() => handleHover(null)}
                    onFocus={() => handleHover(a.id)}
                    onBlur={() => handleHover(null)}
                    className={`rounded-lg px-2 py-1.5 text-left text-xs border transition-colors ${
                      isHovered
                        ? "border-accent bg-accent/10"
                        : "border-border bg-card hover:border-accent/40"
                    }`}
                    style={{ borderLeft: `4px solid ${a.color}` }}
                  >
                    <div className="font-semibold text-foreground">
                      {a.ratioLabel} · {a.scaleLabel}
                    </div>
                    <div className="text-muted">
                      IoU{" "}
                      <span
                        className="tabular-nums font-semibold"
                        style={{ color: classification.color }}
                      >
                        {a.iouScore.toFixed(2)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Panel chi tiết regression target khi hover */}
            {hoveredAnchor && hoveredTarget ? (
              <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-foreground">
                    Anchor {hoveredAnchor.ratioLabel} · {hoveredAnchor.scaleLabel}
                  </div>
                  <div
                    className="px-2 py-0.5 rounded text-xs font-semibold text-white"
                    style={{ backgroundColor: classifyAnchor(hoveredAnchor.iouScore).color }}
                  >
                    {classifyAnchor(hoveredAnchor.iouScore).label}
                  </div>
                </div>
                <div className="text-xs text-muted">
                  {classifyAnchor(hoveredAnchor.iouScore).description}
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="rounded-md bg-background/60 p-2">
                    <div className="text-[10px] text-muted">Δx</div>
                    <div className="font-mono text-sm text-foreground">
                      {hoveredTarget.dx.toFixed(2)}
                    </div>
                  </div>
                  <div className="rounded-md bg-background/60 p-2">
                    <div className="text-[10px] text-muted">Δy</div>
                    <div className="font-mono text-sm text-foreground">
                      {hoveredTarget.dy.toFixed(2)}
                    </div>
                  </div>
                  <div className="rounded-md bg-background/60 p-2">
                    <div className="text-[10px] text-muted">Δw</div>
                    <div className="font-mono text-sm text-foreground">
                      {hoveredTarget.dw.toFixed(2)}
                    </div>
                  </div>
                  <div className="rounded-md bg-background/60 p-2">
                    <div className="text-[10px] text-muted">Δh</div>
                    <div className="font-mono text-sm text-foreground">
                      {hoveredTarget.dh.toFixed(2)}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted">
                  Đây chính là 4 số mô hình học. Anchor tốt (Positive) có cả 4 giá trị nhỏ → dễ học.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-background/40 p-4 text-center text-sm text-muted">
                Di chuột hoặc chạm vào 1 hộp để xem chi tiết regression target.
              </div>
            )}

            {/* Summary counts */}
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-3">
                <div className="text-xs text-muted">Positive</div>
                <div className="text-lg font-bold text-green-700 dark:text-green-400">{positiveCount}</div>
                <div className="text-[11px] text-muted">IoU ≥ 0.7</div>
              </div>
              <div className="rounded-lg bg-slate-500/10 border border-slate-500/30 p-3">
                <div className="text-xs text-muted">Bỏ qua</div>
                <div className="text-lg font-bold text-slate-800 dark:text-slate-300">{ignoreCount}</div>
                <div className="text-[11px] text-muted">0.3 ≤ IoU &lt; 0.7</div>
              </div>
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3">
                <div className="text-xs text-muted">Negative</div>
                <div className="text-lg font-bold text-red-700 dark:text-red-400">{negativeCount}</div>
                <div className="text-[11px] text-muted">IoU &lt; 0.3</div>
              </div>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ── 3. AHA ────────────────────────────────────────────── */}
      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc aha">
        <AhaMoment>
          <p>
            Anchor box giống <strong>bản mẫu may quần áo</strong>: thay vì may từ vải
            trắng (dự đoán toạ độ từ 0), bạn chọn bản mẫu size gần nhất rồi chỉnh sửa
            nhẹ. Mô hình chỉ cần dự đoán 4 offset nhỏ{" "}
            <LaTeX>{"(t_x, t_y, t_w, t_h)"}</LaTeX> thay vì 4 toạ độ tuyệt đối — và
            chính vì offset gần 0, loss ổn định hơn, mô hình hội tụ nhanh hơn nhiều.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ── 4. THỬ THÁCH ──────────────────────────────────────── */}
      <LessonSection step={4} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Faster R-CNN dùng 9 anchors/vị trí (3 tỷ lệ × 3 kích thước). Trên feature map 40×40, tổng cộng bao nhiêu anchor box?"
          options={[
            "360 anchor boxes",
            "14,400 anchor boxes (40 × 40 × 9)",
            "1,600 anchor boxes",
          ]}
          correct={1}
          explanation="40 × 40 = 1,600 vị trí. Mỗi vị trí 9 anchors. Tổng = 14,400 anchor boxes! Đó là lý do cần NMS để lọc — hầu hết anchors là negative (không chứa đối tượng)."
        />

        <InlineChallenge
          question="Một anchor có IoU = 0.55 với ground truth. Theo chuẩn Faster R-CNN, anchor này được dùng như thế nào trong training?"
          options={[
            "Là positive, mô hình học offset tại đây",
            "Là negative, mô hình học class = background",
            "Bị bỏ qua — không dùng cho training (IoU nằm trong 0.3–0.7)",
            "Được dùng 50% positive, 50% negative",
          ]}
          correct={2}
          explanation="Ngưỡng Faster R-CNN: IoU ≥ 0.7 → positive, IoU < 0.3 → negative. Vùng 0.3–0.7 được coi là mơ hồ (không rõ có object hay không) nên bỏ qua để tránh nhiễu loss."
        />
      </LessonSection>

      {/* ── 5. LÝ THUYẾT ──────────────────────────────────────── */}
      <LessonSection step={5} totalSteps={8} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Anchor Boxes</strong> là tập hợp bounding box mẫu với tỷ lệ khung
            hình (aspect ratio) và kích thước (scale) xác định trước, đặt đều đặn
            trên lưới feature map. Chúng đóng vai trò <em>điểm khởi đầu</em> cho
            regression — thay vì đoán (x, y, w, h) từ số 0, mô hình chỉ học dịch
            chuyển tương đối từ anchor gần nhất.
          </p>

          <p>
            <strong>Công thức regression target</strong> (Faster R-CNN, R. Girshick et al., 2015):
          </p>
          <LaTeX block>
            {"t_x = \\frac{x - x_a}{w_a}, \\quad t_y = \\frac{y - y_a}{h_a}, \\quad t_w = \\log\\frac{w}{w_a}, \\quad t_h = \\log\\frac{h}{h_a}"}
          </LaTeX>
          <p className="text-sm text-muted">
            Với <LaTeX>{"(x_a, y_a, w_a, h_a)"}</LaTeX> là anchor và{" "}
            <LaTeX>{"(x, y, w, h)"}</LaTeX> là ground truth. Khi inference, giải
            ngược công thức: <LaTeX>{"x = x_a + w_a \\cdot t_x"}</LaTeX> và{" "}
            <LaTeX>{"w = w_a \\cdot \\exp(t_w)"}</LaTeX>.
          </p>

          <p>
            <strong>Gán nhãn (Anchor Assignment)</strong> — quyết định anchor nào
            được dùng cho training và dùng làm gì:
          </p>

          <Callout variant="insight" title="Quy tắc Positive / Negative / Ignore">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <strong>Positive</strong>: IoU ≥ 0.7 với 1 ground truth bất kỳ, HOẶC
                là anchor có IoU lớn nhất với 1 GT (tránh trường hợp GT nhỏ không có
                anchor nào đạt 0.7).
              </li>
              <li>
                <strong>Negative</strong>: IoU &lt; 0.3 với mọi ground truth → gán
                class = background, không tham gia regression loss.
              </li>
              <li>
                <strong>Bỏ qua</strong>: 0.3 ≤ IoU &lt; 0.7 — không dùng cho training
                để tránh nhiễu loss ở vùng ranh giới.
              </li>
            </ul>
          </Callout>

          <Callout variant="warning" title="Anchor-based vs Anchor-free">
            <div className="space-y-2 text-sm">
              <p>
                <strong>Anchor-based</strong> (Faster R-CNN, SSD, RetinaNet, YOLOv3–v5):
                Đặt anchor với ratio/scale preset trước, dự đoán offset. Cần tune
                kích thước anchor cho từng dataset — lớn với ảnh vệ tinh, nhỏ với
                face detection.
              </p>
              <p>
                <strong>Anchor-free</strong> (FCOS, CenterNet, YOLOv8+): Dự đoán trực
                tiếp từ mỗi điểm trên feature map — khoảng cách đến 4 cạnh object
                hoặc center + size. Đơn giản hơn, ít hyperparameter hơn. Xu hướng
                hiện đại, kết quả cạnh tranh với anchor-based trên COCO.
              </p>
            </div>
          </Callout>

          <Callout variant="tip" title="Phân biệt 2 loại offset tâm">
            <div className="space-y-2 text-sm">
              <p>
                Công thức <LaTeX>{"t_x = (x - x_a)/w_a"}</LaTeX> chia cho{" "}
                <em>chiều rộng anchor</em>, không phải stride. Lợi ích: offset
                normalize — anchor lớn dịch nhiều pixel vẫn cho t_x nhỏ, anchor nhỏ
                dịch ít pixel vẫn cho t_x đủ lớn. Điều này giúp loss có cùng thang
                đo cho mọi kích thước anchor.
              </p>
              <p>
                YOLO v2/v3 dùng biến thể: <LaTeX>{"b_x = \\sigma(t_x) + c_x"}</LaTeX>{" "}
                — sigmoid ép tâm anchor ở trong ô grid → tránh dịch quá xa.
              </p>
            </div>
          </Callout>

          <Callout variant="info" title="Vì sao cần NMS sau anchor regression?">
            <p className="text-sm">
              Với 14,400 anchor trên 1 ảnh, nhiều anchor cạnh nhau sẽ cùng hội tụ về
              1 object thực → nhiều bounding box gần trùng nhau cho cùng 1 object.{" "}
              <strong>Non-Maximum Suppression (NMS)</strong> loại bỏ các hộp trùng
              lặp: giữ hộp có confidence cao nhất, loại hộp có IoU ≥ 0.5 với nó.
              Liên kết: <TopicLink slug="nms">Non-Maximum Suppression</TopicLink>.
            </p>
          </Callout>

          <p className="text-sm text-foreground mt-4">
            <strong>Lịch sử ngắn</strong>: ý tưởng "hộp tham chiếu" xuất hiện trong{" "}
            <em>Selective Search</em> (Uijlings, 2013) rồi được chuẩn hoá trong R-CNN
            (Girshick, 2014). Tới Faster R-CNN (2015), anchor trở thành thành phần
            end-to-end — RPN tự sinh proposals mà không cần bước region proposal rời
            rạc. Sau đó SSD (2016) và YOLOv2 (2017) phổ biến anchor ra cộng đồng
            one-stage detector. Từ 2019, anchor-free (FCOS, CenterNet) bắt đầu thách
            thức và dần chiếm ưu thế trên nhiều benchmark.
          </p>

          <CodeBlock language="python" title="Sinh 9 anchor box cho Faster R-CNN (NumPy)">
{`import numpy as np

def generate_base_anchors(
    scales=(64, 128, 256),       # kích thước anchor (px)
    ratios=(0.5, 1.0, 2.0),      # tỷ lệ w/h
):
    """Sinh 9 anchor tại gốc (0, 0) — dạng (x1, y1, x2, y2)."""
    anchors = []
    for s in scales:
        for r in ratios:
            w = s * np.sqrt(r)
            h = s / np.sqrt(r)
            anchors.append([-w / 2, -h / 2, w / 2, h / 2])
    return np.array(anchors)  # shape (9, 4)


def tile_anchors(base, feat_size=(40, 40), stride=16):
    """Rải 9 anchor xuống toàn bộ feature map."""
    H, W = feat_size
    # Tâm của mỗi ô grid trên ảnh gốc
    shifts_x = (np.arange(W) + 0.5) * stride
    shifts_y = (np.arange(H) + 0.5) * stride
    gx, gy = np.meshgrid(shifts_x, shifts_y)
    shifts = np.stack([gx.ravel(), gy.ravel(),
                       gx.ravel(), gy.ravel()], axis=1)  # (H*W, 4)

    # Broadcast: (1, 9, 4) + (H*W, 1, 4) → (H*W, 9, 4)
    anchors = base[None, :, :] + shifts[:, None, :]
    return anchors.reshape(-1, 4)  # (H*W*9, 4)


def bbox_regression_target(anchor, gt):
    """Tính (t_x, t_y, t_w, t_h) — mục tiêu học của RPN."""
    ax = (anchor[0] + anchor[2]) / 2
    ay = (anchor[1] + anchor[3]) / 2
    aw = anchor[2] - anchor[0]
    ah = anchor[3] - anchor[1]

    gx = (gt[0] + gt[2]) / 2
    gy = (gt[1] + gt[3]) / 2
    gw = gt[2] - gt[0]
    gh = gt[3] - gt[1]

    tx = (gx - ax) / aw
    ty = (gy - ay) / ah
    tw = np.log(gw / aw)
    th = np.log(gh / ah)
    return np.array([tx, ty, tw, th])


base = generate_base_anchors()
all_anchors = tile_anchors(base, feat_size=(40, 40), stride=16)
print(f"Total anchors: {len(all_anchors)}")  # 14400
print(f"Shape: {all_anchors.shape}")          # (14400, 4)

# Demo: target cho 1 cặp (anchor, GT) cụ thể
anchor = all_anchors[7200]
gt = np.array([300, 200, 420, 380])  # x1, y1, x2, y2
print("Regression target:", bbox_regression_target(anchor, gt))`}
          </CodeBlock>

          <p className="text-sm text-muted mt-2">
            Đoạn code trên làm 3 việc: (1) sinh 9 anchor tại gốc toạ độ, (2) "rải"
            chúng lên toàn bộ feature map bằng meshgrid + broadcast, (3) tính
            regression target cho 1 cặp (anchor, GT) cụ thể. Đây là 3 thao tác cốt
            lõi của bước <em>Anchor Generator</em> trong mọi Faster R-CNN
            implementation.
          </p>

          <CodeBlock language="python" title="Decode + Loss cho Faster R-CNN (PyTorch)">
{`import torch
import torch.nn as nn
import torch.nn.functional as F


def decode_boxes(anchors, deltas):
    """Ngược công thức: anchor + offset → box dự đoán."""
    ax = (anchors[:, 0] + anchors[:, 2]) * 0.5
    ay = (anchors[:, 1] + anchors[:, 3]) * 0.5
    aw = anchors[:, 2] - anchors[:, 0]
    ah = anchors[:, 3] - anchors[:, 1]

    tx, ty, tw, th = deltas.unbind(dim=1)
    # Clamp để tránh exp overflow khi mạng chưa hội tụ
    tw = torch.clamp(tw, max=4.135)
    th = torch.clamp(th, max=4.135)

    cx = ax + aw * tx
    cy = ay + ah * ty
    w  = aw * torch.exp(tw)
    h  = ah * torch.exp(th)

    return torch.stack([cx - w / 2, cy - h / 2,
                        cx + w / 2, cy + h / 2], dim=1)


class RPNLoss(nn.Module):
    """Loss của Region Proposal Network — 2 thành phần:

    1. Classification: anchor có object hay không (BCE).
    2. Regression: chỉ tính trên positive anchor (Smooth L1).
    """

    def __init__(self, lambda_reg: float = 10.0):
        super().__init__()
        self.lambda_reg = lambda_reg

    def forward(self, cls_logits, bbox_deltas,
                cls_targets, bbox_targets, bbox_weights):
        # cls_targets: {1: positive, 0: negative, -1: ignore}
        valid = cls_targets >= 0
        cls_loss = F.binary_cross_entropy_with_logits(
            cls_logits[valid], cls_targets[valid].float()
        )

        # Regression chỉ trên positive — nhân với bbox_weights (1 hoặc 0)
        reg_loss = F.smooth_l1_loss(
            bbox_deltas * bbox_weights,
            bbox_targets * bbox_weights,
            reduction="sum",
        ) / bbox_weights.sum().clamp(min=1.0)

        return cls_loss + self.lambda_reg * reg_loss


# ─── Huấn luyện RPN trên 1 batch ảnh ──────────────────
def train_step(model, images, gt_boxes_per_image, optimizer, loss_fn):
    """1 bước huấn luyện Region Proposal Network.

    Tham số:
      images: tensor (B, 3, H, W)
      gt_boxes_per_image: list các tensor (N_i, 4) — N object mỗi ảnh
    """
    model.train()
    optimizer.zero_grad()

    # 1. Forward — RPN đưa ra 2 output:
    #    cls_logits: (B, A*H'*W') — điểm objectness
    #    bbox_deltas: (B, A*H'*W'*4) — 4 offset cho mỗi anchor
    cls_logits, bbox_deltas, anchors = model(images)

    # 2. Matching anchor ↔ GT, tạo target
    cls_targets, bbox_targets, bbox_weights = [], [], []
    for i, gt in enumerate(gt_boxes_per_image):
        ious = box_iou(anchors, gt)          # (A_total, N_i)
        max_iou, argmax = ious.max(dim=1)
        cls_t = torch.full((len(anchors),), -1,
                            dtype=torch.long, device=anchors.device)
        cls_t[max_iou >= 0.7] = 1            # positive
        cls_t[max_iou < 0.3]  = 0            # negative
        # Anchor có IoU cao nhất với mỗi GT cũng là positive
        best_per_gt = ious.argmax(dim=0)
        cls_t[best_per_gt] = 1

        matched_gt = gt[argmax]
        bbox_t = bbox_regression_target_batch(anchors, matched_gt)
        bbox_w = (cls_t == 1).float().unsqueeze(1).expand_as(bbox_t)

        cls_targets.append(cls_t)
        bbox_targets.append(bbox_t)
        bbox_weights.append(bbox_w)

    cls_targets  = torch.stack(cls_targets)
    bbox_targets = torch.stack(bbox_targets)
    bbox_weights = torch.stack(bbox_weights)

    # 3. Loss + backward
    loss = loss_fn(cls_logits, bbox_deltas,
                   cls_targets, bbox_targets, bbox_weights)
    loss.backward()
    optimizer.step()
    return loss.item()`}
          </CodeBlock>

          <p className="text-sm text-muted mt-2">
            Lưu ý: trong thực tế ta còn <em>sample</em> 256 anchor (128 positive,
            128 negative) mỗi ảnh để tránh imbalance nặng — có thể có hàng chục
            ngàn negative nhưng chỉ vài chục positive. Sampling đúng cách là chìa
            khoá để RPN hội tụ nhanh.
          </p>

          <CollapsibleDetail title="Tại sao t_w dùng log mà không phải w/w_a trực tiếp?">
            <div className="space-y-2 text-sm text-muted">
              <p>
                Giả sử anchor = 64px. Nếu GT = 128px → t_w = log(2) = 0.69. Nếu GT =
                32px → t_w = log(0.5) = −0.69. Hai trường hợp đối xứng quanh 0.
              </p>
              <p>
                Nếu không log, tỷ số w/w_a thay đổi 0.5 → 2.0 (dải không đối xứng):
                mô hình khó học bằng regression thẳng. Log biến dải về đối xứng
                quanh 0 → Smooth L1 loss hoạt động ổn định hơn.
              </p>
              <p>
                Khi inference, ta khôi phục bằng <LaTeX>{"w = w_a \\cdot e^{t_w}"}</LaTeX>{" "}
                — luôn dương (không lo box có chiều rộng âm do số float).
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="Chọn kích thước anchor thế nào cho dataset của mình?">
            <div className="space-y-2 text-sm text-muted">
              <p>
                <strong>Bước 1</strong>: Thống kê kích thước + aspect ratio của
                ground truth trong tập train. Vẽ histogram 2D (log-w, log-h).
              </p>
              <p>
                <strong>Bước 2</strong>: Chạy K-Means trên các box GT với k = 9 (hoặc
                5 cho YOLOv2). Mỗi centroid là 1 anchor. Khoảng cách dùng 1 − IoU
                thay vì Euclidean (vì IoU là metric tự nhiên).
              </p>
              <p>
                <strong>Bước 3</strong>: Kiểm tra trung bình IoU giữa GT và centroid
                gần nhất. Mục tiêu: &gt; 0.6. Nếu thấp, tăng k hoặc thêm level FPN.
              </p>
              <p>
                YOLOv2+ gọi đây là "anchor priors from K-Means" — một bước tiền xử
                lý quan trọng trước khi training thật.
              </p>
              <p>
                <strong>Ví dụ thực tế</strong>: Face detection với ảnh khuôn mặt
                320×320 px thường dùng anchor 16, 32, 64 (rất nhỏ) + ratios
                0.7–1.3 (mặt người gần vuông). Aerial detection (ảnh vệ tinh) lại
                dùng anchor 128, 256, 512 + ratios 0.3–3 để bắt đường, ô-tô, toà
                nhà dài. Không có bộ anchor one-size-fits-all.
              </p>
            </div>
          </CollapsibleDetail>

          <Callout variant="tip" title="Feature Pyramid Network — anchor theo nhiều độ phân giải">
            <div className="space-y-2 text-sm">
              <p>
                1 feature map duy nhất không đủ cho object đa kích thước.{" "}
                <strong>FPN</strong> kết hợp feature ở nhiều tầng (P3, P4, P5, P6,
                P7) với stride tăng dần (8, 16, 32, 64, 128). Tầng càng thấp
                (stride nhỏ) dùng anchor nhỏ — bắt object nhỏ. Tầng cao dùng
                anchor lớn.
              </p>
              <p>
                Kết quả: RetinaNet với FPN đạt AP cao hơn 5 điểm so với Faster
                R-CNN cùng backbone, đặc biệt trên object nhỏ. FPN là chuẩn mực
                cho detection hiện đại.
              </p>
            </div>
          </Callout>

          <p className="text-foreground mt-4">
            <strong>So sánh parameterization giữa các họ detector</strong>
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border rounded-md">
              <thead className="bg-surface/60">
                <tr>
                  <th className="text-left p-2 border-b border-border">Detector</th>
                  <th className="text-left p-2 border-b border-border">Công thức tâm</th>
                  <th className="text-left p-2 border-b border-border">Công thức size</th>
                  <th className="text-left p-2 border-b border-border">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border-b border-border font-medium">Faster R-CNN</td>
                  <td className="p-2 border-b border-border">
                    <LaTeX>{"t_x=(x-x_a)/w_a"}</LaTeX>
                  </td>
                  <td className="p-2 border-b border-border">
                    <LaTeX>{"t_w=\\log(w/w_a)"}</LaTeX>
                  </td>
                  <td className="p-2 border-b border-border text-muted">
                    Two-stage, offset không bị chặn
                  </td>
                </tr>
                <tr>
                  <td className="p-2 border-b border-border font-medium">SSD</td>
                  <td className="p-2 border-b border-border">
                    <LaTeX>{"t_x=(x-x_a)/(w_a \\cdot \\sigma_1)"}</LaTeX>
                  </td>
                  <td className="p-2 border-b border-border">
                    <LaTeX>{"t_w=\\log(w/w_a)/\\sigma_2"}</LaTeX>
                  </td>
                  <td className="p-2 border-b border-border text-muted">
                    σ₁=0.1, σ₂=0.2 — chuẩn hoá loss
                  </td>
                </tr>
                <tr>
                  <td className="p-2 border-b border-border font-medium">YOLOv3</td>
                  <td className="p-2 border-b border-border">
                    <LaTeX>{"b_x=\\sigma(t_x)+c_x"}</LaTeX>
                  </td>
                  <td className="p-2 border-b border-border">
                    <LaTeX>{"b_w=p_w \\cdot e^{t_w}"}</LaTeX>
                  </td>
                  <td className="p-2 border-b border-border text-muted">
                    Sigmoid ép tâm trong grid cell
                  </td>
                </tr>
                <tr>
                  <td className="p-2 border-b border-border font-medium">FCOS</td>
                  <td className="p-2 border-b border-border">
                    <em>không có</em>
                  </td>
                  <td className="p-2 border-b border-border">
                    <LaTeX>{"(l, t, r, b)"}</LaTeX>
                  </td>
                  <td className="p-2 border-b border-border text-muted">
                    Anchor-free: 4 khoảng cách đến cạnh
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-medium">YOLOv8</td>
                  <td className="p-2">
                    <em>center từ grid</em>
                  </td>
                  <td className="p-2">
                    DFL (distribution)
                  </td>
                  <td className="p-2 text-muted">
                    Anchor-free + Distribution Focal Loss
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted mt-2">
            Dù công thức khác nhau, điểm chung xuyên suốt là: <em>luôn dự đoán đại
            lượng tương đối</em> thay vì tuyệt đối. Đó là bài học chính rút ra từ
            anchor box — áp dụng được cho cả pose estimation, 3D detection, và
            segmentation bounding.
          </p>

          <p className="text-sm text-muted mt-4">
            Xem thêm: <TopicLink slug="iou">IoU — chỉ số đo trùng khớp</TopicLink>,{" "}
            <TopicLink slug="nms">Non-Maximum Suppression</TopicLink>,{" "}
            <TopicLink slug="object-detection">Object Detection tổng quan</TopicLink>.
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ── 6. TÓM TẮT ─────────────────────────────────────────── */}
      <LessonSection step={6} totalSteps={8} label="Tóm tắt">
        <MiniSummary
          title="6 điều cần nhớ về Anchor Boxes"
          points={[
            "Anchor box = hộp mẫu đặt sẵn tại mỗi vị trí trên feature map, mỗi vị trí có 9 anchor (3 ratio × 3 scale).",
            "Mô hình KHÔNG dự đoán toạ độ tuyệt đối — nó học 4 offset (tx, ty, tw, th) từ anchor gần nhất.",
            "Gán nhãn: IoU ≥ 0.7 → positive (học offset), IoU < 0.3 → negative (background), khoảng giữa → bỏ qua.",
            "tw/th dùng log để giữ w > 0 sau decode và để phân phối target đối xứng quanh 0 — loss ổn định hơn.",
            "Số anchor cực lớn (40×40×9 = 14,400 cho 1 ảnh). Cần sampling cân bằng + NMS để xử lý kết quả.",
            "Xu hướng hiện đại: anchor-free (FCOS, YOLOv8) — dự đoán trực tiếp từ tâm, ít hyperparameter, kết quả ngang ngửa.",
          ]}
        />
      </LessonSection>

      {/* ── 7. QUIZ ────────────────────────────────────────────── */}
      <LessonSection step={7} totalSteps={8} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>

      {/* ── 8. TỔNG KẾT ──────────────────────────────────────── */}
      <LessonSection step={8} totalSteps={8} label="Tổng kết">
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-3">
            <ProgressSteps current={8} total={8} />
            <span className="text-sm text-muted">Hoàn tất — bạn đã đi qua toàn bộ 8 bước.</span>
          </div>
          <p className="text-sm text-foreground">
            Anchor box là chiếc cầu đưa <em>regression không ràng buộc</em> (đoán
            4 số từ 0) về <em>regression có neo</em> (đoán offset nhỏ). Đây là một
            trong những ý tưởng nền tảng trong object detection hiện đại — hiểu
            anchor giúp bạn đọc Faster R-CNN, SSD, YOLO, và cả RetinaNet dễ dàng.
          </p>
          <ul className="text-sm text-muted list-disc list-inside space-y-1">
            <li>Hiểu được 9 anchor sinh ra ở đâu và tại sao chia 3×3.</li>
            <li>Đọc được công thức <LaTeX>{"t_x, t_y, t_w, t_h"}</LaTeX> và ý nghĩa log.</li>
            <li>Biết phân loại positive/negative/ignore qua IoU.</li>
            <li>Nắm được giới hạn anchor-based và lý do anchor-free nổi lên.</li>
            <li>Biết đọc K-Means anchor + FPN multi-scale để tuning cho dataset riêng.</li>
          </ul>
          <p className="text-xs text-muted mt-2">
            Gợi ý bài tập: lấy 100 ảnh COCO bất kỳ, vẽ histogram 2D của (log-w,
            log-h) bounding box ground truth, rồi chạy K-Means với k=9. So sánh 9
            centroid bạn thu được với anchor mặc định của Faster R-CNN. Chênh lệch
            bao nhiêu? Trong dataset đó, anchor mặc định có tối ưu không?
          </p>
          <p className="text-sm text-muted">
            Bước tiếp theo: tìm hiểu{" "}
            <TopicLink slug="iou">IoU</TopicLink> chi tiết, rồi xem{" "}
            <TopicLink slug="nms">NMS</TopicLink> lọc 14,400 hộp còn lại sao cho
            mỗi object chỉ còn 1 bounding box.
          </p>
        </div>
      </LessonSection>
    </>
  );
}
