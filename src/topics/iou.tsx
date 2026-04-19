"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  LaTeX,
  CollapsibleDetail,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

/* ──────────────────────────────────────────────────────────────
 * METADATA — giữ nguyên như bản gốc để hệ thống topic catalog
 * có thể nhận diện bài học này. Không thay đổi slug/category/tags
 * vì các route, breadcrumb, và progress-tracker đều dựa vào đây.
 * ────────────────────────────────────────────────────────────── */
export const metadata: TopicMeta = {
  slug: "iou",
  title: "IoU - Intersection over Union",
  titleVi: "IoU - Giao trên hợp",
  description:
    "Chỉ số đo mức độ trùng khớp giữa hai bounding box, nền tảng đánh giá phát hiện đối tượng.",
  category: "computer-vision",
  tags: ["computer-vision", "evaluation", "metric"],
  difficulty: "beginner",
  relatedSlugs: ["object-detection", "nms", "anchor-boxes"],
  vizType: "interactive",
};

/* ──────────────────────────────────────────────────────────────
 * TYPES — định nghĩa bounding box và các cấu trúc phụ trợ cho
 * phần giải thích mAP. Vì đây là file client-only nên ta ưu tiên
 * type lightweight, không cần export ra ngoài.
 * ────────────────────────────────────────────────────────────── */
type Box = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type DetectionCase = {
  id: string;
  label: string;
  gt: Box;
  pred: Box;
  note: string;
};

type DragTarget =
  | "A-move"
  | "A-tl"
  | "A-br"
  | "B-move"
  | "B-tl"
  | "B-br"
  | null;

/* ──────────────────────────────────────────────────────────────
 * HẰNG SỐ CANVAS — giữ tọa độ trong hệ SVG 600×360 để khi vẽ
 * lên màn hình nhỏ (điện thoại) vẫn giữ được tỷ lệ. Giới hạn
 * kéo/drag dựa trên padding 10px để tránh box bị ép sát cạnh.
 * ────────────────────────────────────────────────────────────── */
const CANVAS_W = 600;
const CANVAS_H = 360;
const PAD = 10;
const MIN_SIDE = 40;

const COLOR_GT = "#3b82f6"; // xanh dương — ground truth
const COLOR_PRED = "#22c55e"; // xanh lá — dự đoán
const COLOR_INTER = "#f59e0b"; // vàng — diện tích giao
const COLOR_ENCLOSE = "#a855f7"; // tím — enclosing box (GIoU)

/* ──────────────────────────────────────────────────────────────
 * BỘ CASE MINH HỌA mAP — 6 cặp (GT, Pred) với IoU phủ đủ dải
 * từ 0.12 đến 0.92. Người học sẽ thấy rõ cùng một tập dự đoán
 * có thể biến thành True-Positive hay False-Positive hoàn toàn
 * phụ thuộc vào ngưỡng IoU đang chọn.
 * ────────────────────────────────────────────────────────────── */
const CASES: DetectionCase[] = [
  {
    id: "c1",
    label: "Xe máy trùng gần như hoàn hảo",
    gt: { x: 60, y: 60, w: 160, h: 120 },
    pred: { x: 66, y: 64, w: 158, h: 118 },
    note: "Dự đoán chỉ lệch vài pixel — IoU rất cao.",
  },
  {
    id: "c2",
    label: "Người đi bộ, lệch nhẹ sang phải",
    gt: { x: 260, y: 80, w: 100, h: 160 },
    pred: { x: 278, y: 86, w: 100, h: 158 },
    note: "Lệch tâm ~18px, tỷ lệ vẫn giữ — IoU trung bình cao.",
  },
  {
    id: "c3",
    label: "Biển báo, box to quá",
    gt: { x: 420, y: 60, w: 80, h: 80 },
    pred: { x: 400, y: 40, w: 130, h: 130 },
    note: "Pred chứa cả GT nhưng dư thừa — union phình to.",
  },
  {
    id: "c4",
    label: "Ô tô, chỉ bắt được nửa thân",
    gt: { x: 80, y: 230, w: 200, h: 100 },
    pred: { x: 180, y: 240, w: 180, h: 100 },
    note: "Vùng giao chỉ bằng một nửa — IoU quanh 0.35.",
  },
  {
    id: "c5",
    label: "Đèn giao thông, lệch hẳn",
    gt: { x: 340, y: 260, w: 70, h: 70 },
    pred: { x: 420, y: 250, w: 80, h: 90 },
    note: "Chạm góc nhưng hầu hết là miss — IoU thấp.",
  },
  {
    id: "c6",
    label: "Cây bên đường, box vừa lệch vừa co",
    gt: { x: 500, y: 230, w: 80, h: 110 },
    pred: { x: 470, y: 210, w: 70, h: 120 },
    note: "Lệch cả vị trí lẫn kích thước — IoU ~ 0.45.",
  },
];

/* ──────────────────────────────────────────────────────────────
 * UTILITY — hàm toán học tách riêng cho gọn phần render. Không
 * dùng thư viện ngoài vì logic rất nhẹ và giúp người đọc dễ
 * đối chiếu với công thức LaTeX trong ExplanationSection.
 * ────────────────────────────────────────────────────────────── */
function area(b: Box) {
  return b.w * b.h;
}

function intersectionBox(a: Box, b: Box): Box | null {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  if (x2 <= x1 || y2 <= y1) return null;
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

function enclosingBox(a: Box, b: Box): Box {
  const x1 = Math.min(a.x, b.x);
  const y1 = Math.min(a.y, b.y);
  const x2 = Math.max(a.x + a.w, b.x + b.w);
  const y2 = Math.max(a.y + a.h, b.y + b.h);
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

function iouValue(a: Box, b: Box) {
  const inter = intersectionBox(a, b);
  const iArea = inter ? area(inter) : 0;
  const uArea = area(a) + area(b) - iArea;
  if (uArea <= 0) return 0;
  return iArea / uArea;
}

function giouValue(a: Box, b: Box) {
  const inter = intersectionBox(a, b);
  const iArea = inter ? area(inter) : 0;
  const uArea = area(a) + area(b) - iArea;
  const c = enclosingBox(a, b);
  const cArea = area(c);
  if (uArea <= 0 || cArea <= 0) return 0;
  return iArea / uArea - (cArea - uArea) / cArea;
}

function centerDist(a: Box, b: Box) {
  const ax = a.x + a.w / 2;
  const ay = a.y + a.h / 2;
  const bx = b.x + b.w / 2;
  const by = b.y + b.h / 2;
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

function clampBox(b: Box): Box {
  const w = Math.max(MIN_SIDE, Math.min(CANVAS_W - 2 * PAD, b.w));
  const h = Math.max(MIN_SIDE, Math.min(CANVAS_H - 2 * PAD, b.h));
  const x = Math.max(PAD, Math.min(CANVAS_W - PAD - w, b.x));
  const y = Math.max(PAD, Math.min(CANVAS_H - PAD - h, b.y));
  return { x, y, w, h };
}

function qualityOf(iou: number) {
  if (iou >= 0.9) return { label: "Xuất sắc", color: "#16a34a" };
  if (iou >= 0.75) return { label: "Giỏi", color: "#22c55e" };
  if (iou >= 0.5) return { label: "Đạt", color: "#eab308" };
  if (iou >= 0.3) return { label: "Yếu", color: "#f97316" };
  return { label: "Kém", color: "#ef4444" };
}

/* ──────────────────────────────────────────────────────────────
 * QUIZ — 8 câu phủ 4 lớp nhận thức: định nghĩa, ứng dụng, biến
 * thể GIoU/DIoU/CIoU, và pitfalls như IoU=0 gradient=0.
 * ────────────────────────────────────────────────────────────── */
const QUIZ: QuizQuestion[] = [
  {
    question: "IoU = 0.75 có nghĩa là gì?",
    options: [
      "Hai box trùng khớp 75% — diện tích giao chiếm 75% diện tích hợp",
      "Box dự đoán nhỏ hơn ground truth 75%",
      "Mô hình đúng 75% thời gian",
      "Ảnh có 75% pixel thuộc đối tượng",
    ],
    correct: 0,
    explanation:
      "IoU = Giao / Hợp = 0.75 nghĩa là vùng chồng lấp chiếm 75% tổng diện tích hợp của hai box. Đây là mức rất tốt, vượt xa ngưỡng khắt khe 0.5 của PASCAL VOC.",
  },
  {
    question: "COCO benchmark dùng mAP@[0.5:0.95]. Điều này nghĩa là gì?",
    options: [
      "Chỉ tính detection đúng khi IoU > 0.95",
      "Tính mAP ở nhiều ngưỡng IoU (0.5, 0.55, ..., 0.95) rồi lấy trung bình",
      "Đánh giá trên 50-95% dữ liệu test",
      "IoU phải nằm giữa 0.5 và 0.95",
    ],
    correct: 1,
    explanation:
      "COCO tính mAP trung bình trên 10 ngưỡng IoU từ 0.5 đến 0.95 (bước 0.05). Khắt khe hơn PASCAL VOC (chỉ dùng IoU=0.5) vì đòi hỏi box chính xác ở nhiều mức.",
  },
  {
    question: "Tại sao GIoU tốt hơn IoU khi dùng làm loss function?",
    options: [
      "GIoU nhanh hơn khi tính toán",
      "GIoU cho gradient khác 0 ngay cả khi 2 box không giao nhau",
      "GIoU không cần bounding box",
      "GIoU chính xác hơn cho ảnh lớn",
    ],
    correct: 1,
    explanation:
      "Khi 2 box không giao: IoU = 0, gradient = 0 — mô hình không học được! GIoU xét thêm diện tích enclosing box, cho gradient khác 0 để mô hình biết cần di chuyển box về phía nào.",
  },
  {
    question:
      "Một mô hình xuất ra 4 bounding box chồng lên cùng một vật thể. NMS dùng IoU để làm gì?",
    options: [
      "Tăng điểm confidence cho box giữa",
      "Giữ box có confidence cao nhất, loại các box có IoU quá cao với nó",
      "Tính trung bình 4 box",
      "Chọn ngẫu nhiên một box",
    ],
    correct: 1,
    explanation:
      "Non-Max Suppression: sắp xếp theo confidence, giữ box top-1, loại mọi box khác có IoU ≥ ngưỡng (thường 0.5) so với nó, rồi lặp lại. Mục tiêu: một vật thể chỉ còn một box duy nhất.",
  },
  {
    question:
      "Hai box có tâm trùng nhau nhưng một box là hình vuông, box kia là hình chữ nhật dài. IoU không phạt được sự khác tỷ lệ khung hình này. Biến thể nào xử lý?",
    options: ["GIoU", "DIoU", "CIoU", "L2 loss"],
    correct: 2,
    explanation:
      "CIoU (Complete-IoU) bổ sung penalty aspect ratio qua hạng tử v = 4/π² · (arctan(w_gt/h_gt) - arctan(w_p/h_p))². DIoU chỉ phạt khoảng cách tâm, GIoU chỉ phạt enclosing box.",
  },
  {
    question: "IoU có tính chất scale-invariant. Điều này có ý nghĩa gì?",
    options: [
      "Box nhỏ luôn có IoU thấp hơn box lớn",
      "Phóng to cả hai box theo cùng một tỷ lệ không làm thay đổi IoU",
      "IoU tăng khi ảnh zoom in",
      "Phải chuẩn hóa box về cùng kích thước trước khi tính",
    ],
    correct: 1,
    explanation:
      "Vì IoU là tỷ số diện tích, nhân đôi w và h của cả hai box làm cả tử và mẫu nhân với 4 → IoU không đổi. Đây là lý do IoU công bằng giữa vật thể lớn-nhỏ.",
  },
  {
    question:
      "Mô hình A có mAP@0.5 = 0.80, mAP@0.75 = 0.35. Mô hình B có mAP@0.5 = 0.72, mAP@0.75 = 0.60. Kết luận?",
    options: [
      "Mô hình A tốt hơn vì mAP@0.5 cao hơn",
      "Mô hình B định vị box chính xác hơn ở mức khắt khe, phù hợp cho medical/driving",
      "Hai mô hình tương đương",
      "Không so sánh được",
    ],
    correct: 1,
    explanation:
      "A tìm ra vật thể hơi tốt hơn nhưng box lỏng. B định vị chặt hơn — khoảng cách giữa hai ngưỡng hẹp. Ứng dụng cần độ chính xác hình học cao (y tế, xe tự lái) nên chọn B.",
  },
  {
    question:
      "Bạn đang huấn luyện detector YOLO. Ở đầu huấn luyện, mọi anchor đều có IoU=0 với ground truth. Dùng IoU-loss trực tiếp có vấn đề gì?",
    options: [
      "Loss luôn bằng 1, không học được hướng",
      "Loss chạy quá chậm trên GPU",
      "Không có vấn đề gì",
      "IoU-loss âm khi box nhỏ",
    ],
    correct: 0,
    explanation:
      "IoU = 0 → 1 − IoU = 1 (hằng số) → gradient = 0, không có tín hiệu hướng. Các paper hiện đại thay bằng GIoU/DIoU/CIoU loss để gradient khác 0 khi box không giao, mô hình biết kéo box về phía ground truth.",
  },
];

/* ──────────────────────────────────────────────────────────────
 * COMPONENT: IoUCalculator — trung tâm của VisualizationSection.
 * Quản lý 2 box có thể kéo góc, tính IoU/Union/Intersection real-
 * time, đồng thời giữ slider ngưỡng để chuyển đổi giữa quyết định
 * TP/FP. Dùng pointer events để hỗ trợ cả mouse lẫn cảm ứng.
 * ────────────────────────────────────────────────────────────── */
function IoUCalculator() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [boxA, setBoxA] = useState<Box>({ x: 90, y: 80, w: 200, h: 160 });
  const [boxB, setBoxB] = useState<Box>({ x: 210, y: 130, w: 200, h: 160 });
  const [threshold, setThreshold] = useState(0.5);
  const [drag, setDrag] = useState<DragTarget>(null);
  const [showEnclose, setShowEnclose] = useState(false);
  const offsetRef = useRef({ dx: 0, dy: 0 });

  const inter = useMemo(() => intersectionBox(boxA, boxB), [boxA, boxB]);
  const enclose = useMemo(() => enclosingBox(boxA, boxB), [boxA, boxB]);
  const iou = useMemo(() => iouValue(boxA, boxB), [boxA, boxB]);
  const giou = useMemo(() => giouValue(boxA, boxB), [boxA, boxB]);
  const dCenter = useMemo(() => centerDist(boxA, boxB), [boxA, boxB]);

  const interArea = inter ? area(inter) : 0;
  const unionArea = area(boxA) + area(boxB) - interArea;
  const encloseArea = area(enclose);

  const quality = qualityOf(iou);
  const classification = iou >= threshold ? "TP" : "FP";
  const classColor = classification === "TP" ? "#16a34a" : "#ef4444";

  const toSVG = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      const x = ((clientX - rect.left) * CANVAS_W) / rect.width;
      const y = ((clientY - rect.top) * CANVAS_H) / rect.height;
      return { x, y };
    },
    []
  );

  const onPointerDown = useCallback(
    (target: DragTarget) =>
      (e: React.PointerEvent<SVGElement>) => {
        e.stopPropagation();
        (e.currentTarget as SVGElement).setPointerCapture?.(e.pointerId);
        const { x, y } = toSVG(e.clientX, e.clientY);
        if (target === "A-move") offsetRef.current = { dx: x - boxA.x, dy: y - boxA.y };
        if (target === "B-move") offsetRef.current = { dx: x - boxB.x, dy: y - boxB.y };
        setDrag(target);
      },
    [boxA, boxB, toSVG]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!drag) return;
      const { x, y } = toSVG(e.clientX, e.clientY);
      const { dx, dy } = offsetRef.current;
      if (drag === "A-move") {
        setBoxA((b) => clampBox({ ...b, x: x - dx, y: y - dy }));
      } else if (drag === "B-move") {
        setBoxB((b) => clampBox({ ...b, x: x - dx, y: y - dy }));
      } else if (drag === "A-tl") {
        setBoxA((b) => {
          const nx = Math.min(x, b.x + b.w - MIN_SIDE);
          const ny = Math.min(y, b.y + b.h - MIN_SIDE);
          return clampBox({
            x: nx,
            y: ny,
            w: b.x + b.w - nx,
            h: b.y + b.h - ny,
          });
        });
      } else if (drag === "A-br") {
        setBoxA((b) =>
          clampBox({
            x: b.x,
            y: b.y,
            w: Math.max(MIN_SIDE, x - b.x),
            h: Math.max(MIN_SIDE, y - b.y),
          })
        );
      } else if (drag === "B-tl") {
        setBoxB((b) => {
          const nx = Math.min(x, b.x + b.w - MIN_SIDE);
          const ny = Math.min(y, b.y + b.h - MIN_SIDE);
          return clampBox({
            x: nx,
            y: ny,
            w: b.x + b.w - nx,
            h: b.y + b.h - ny,
          });
        });
      } else if (drag === "B-br") {
        setBoxB((b) =>
          clampBox({
            x: b.x,
            y: b.y,
            w: Math.max(MIN_SIDE, x - b.x),
            h: Math.max(MIN_SIDE, y - b.y),
          })
        );
      }
    },
    [drag, toSVG]
  );

  const onPointerUp = useCallback(() => {
    setDrag(null);
  }, []);

  const resetBoxes = useCallback(() => {
    setBoxA({ x: 90, y: 80, w: 200, h: 160 });
    setBoxB({ x: 210, y: 130, w: 200, h: 160 });
  }, []);

  const alignBoxes = useCallback(() => {
    setBoxB({ ...boxA });
  }, [boxA]);

  const separateBoxes = useCallback(() => {
    setBoxA({ x: 60, y: 80, w: 160, h: 140 });
    setBoxB({ x: 380, y: 180, w: 160, h: 140 });
  }, []);

  /* ─────────────── Render SVG + panel điều khiển ─────────────── */
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={resetBoxes}
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface"
        >
          Đặt lại
        </button>
        <button
          onClick={alignBoxes}
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface"
        >
          Trùng hoàn hảo (IoU = 1)
        </button>
        <button
          onClick={separateBoxes}
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface"
        >
          Tách rời (IoU = 0)
        </button>
        <label className="ml-auto flex items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={showEnclose}
            onChange={(e) => setShowEnclose(e.target.checked)}
            className="accent-purple-500"
          />
          Hiện enclosing box (GIoU)
        </label>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-[#0f172a]">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
          className="w-full select-none"
          style={{ touchAction: drag !== null ? "none" : "auto" }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {/* Grid nền giúp cảm nhận kích thước pixel */}
          <defs>
            <pattern
              id="iou-grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="#1e293b"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width={CANVAS_W} height={CANVAS_H} fill="url(#iou-grid)" />

          {/* Enclosing box (GIoU) — vẽ trước để nằm dưới */}
          {showEnclose && (
            <rect
              x={enclose.x}
              y={enclose.y}
              width={enclose.w}
              height={enclose.h}
              fill="none"
              stroke={COLOR_ENCLOSE}
              strokeWidth={1.5}
              strokeDasharray="3,3"
              opacity={0.9}
            />
          )}

          {/* Intersection — vàng, fill bán trong suốt */}
          {inter && (
            <rect
              x={inter.x}
              y={inter.y}
              width={inter.w}
              height={inter.h}
              fill={COLOR_INTER}
              opacity={0.45}
            />
          )}

          {/* Box A — Ground Truth */}
          <rect
            x={boxA.x}
            y={boxA.y}
            width={boxA.w}
            height={boxA.h}
            fill="transparent"
            stroke={COLOR_GT}
            strokeWidth={2.5}
            onPointerDown={onPointerDown("A-move")}
            style={{ cursor: drag === "A-move" ? "grabbing" : "grab" }}
          />
          <text
            x={boxA.x + 6}
            y={boxA.y + 16}
            fill={COLOR_GT}
            fontSize={11}
            fontWeight="bold"
          >
            Ground Truth (A)
          </text>
          {/* Góc kéo TL và BR cho box A */}
          <circle
            cx={boxA.x}
            cy={boxA.y}
            r={7}
            fill={COLOR_GT}
            stroke="#fff"
            strokeWidth={1.5}
            onPointerDown={onPointerDown("A-tl")}
            style={{ cursor: "nwse-resize" }}
          />
          <circle
            cx={boxA.x + boxA.w}
            cy={boxA.y + boxA.h}
            r={7}
            fill={COLOR_GT}
            stroke="#fff"
            strokeWidth={1.5}
            onPointerDown={onPointerDown("A-br")}
            style={{ cursor: "nwse-resize" }}
          />

          {/* Box B — Prediction */}
          <rect
            x={boxB.x}
            y={boxB.y}
            width={boxB.w}
            height={boxB.h}
            fill="transparent"
            stroke={COLOR_PRED}
            strokeWidth={2.5}
            strokeDasharray="6,3"
            onPointerDown={onPointerDown("B-move")}
            style={{ cursor: drag === "B-move" ? "grabbing" : "grab" }}
          />
          <text
            x={boxB.x + 6}
            y={boxB.y + boxB.h - 6}
            fill={COLOR_PRED}
            fontSize={11}
            fontWeight="bold"
          >
            Prediction (B)
          </text>
          <circle
            cx={boxB.x}
            cy={boxB.y}
            r={7}
            fill={COLOR_PRED}
            stroke="#fff"
            strokeWidth={1.5}
            onPointerDown={onPointerDown("B-tl")}
            style={{ cursor: "nwse-resize" }}
          />
          <circle
            cx={boxB.x + boxB.w}
            cy={boxB.y + boxB.h}
            r={7}
            fill={COLOR_PRED}
            stroke="#fff"
            strokeWidth={1.5}
            onPointerDown={onPointerDown("B-br")}
            style={{ cursor: "nwse-resize" }}
          />

          {/* Panel số liệu góc trên-phải */}
          <g>
            <rect
              x={CANVAS_W - 180}
              y={10}
              width={170}
              height={82}
              rx={10}
              fill={quality.color}
              opacity={0.15}
              stroke={quality.color}
              strokeWidth={1.5}
            />
            <text
              x={CANVAS_W - 95}
              y={32}
              textAnchor="middle"
              fill="#cbd5e1"
              fontSize={11}
            >
              IoU
            </text>
            <text
              x={CANVAS_W - 95}
              y={60}
              textAnchor="middle"
              fill={quality.color}
              fontSize={26}
              fontWeight="bold"
            >
              {iou.toFixed(3)}
            </text>
            <text
              x={CANVAS_W - 95}
              y={80}
              textAnchor="middle"
              fill={quality.color}
              fontSize={11}
            >
              {quality.label}
            </text>
          </g>

          {/* Chú thích trục dưới */}
          <text
            x={CANVAS_W / 2}
            y={CANVAS_H - 8}
            textAnchor="middle"
            fill="#64748b"
            fontSize={11}
          >
            Kéo góc để thay đổi kích thước — kéo thân box để di chuyển
          </text>
        </svg>
      </div>

      {/* ─────────── Panel chỉ số chi tiết ─────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs uppercase tracking-wide text-muted">
            Giao (Intersection)
          </p>
          <p className="mt-1 text-lg font-semibold text-foreground">
            {interArea.toFixed(0)}
          </p>
          <p className="text-xs text-muted">pixel²</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs uppercase tracking-wide text-muted">
            Hợp (Union)
          </p>
          <p className="mt-1 text-lg font-semibold text-foreground">
            {unionArea.toFixed(0)}
          </p>
          <p className="text-xs text-muted">pixel²</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs uppercase tracking-wide text-muted">
            Enclosing
          </p>
          <p className="mt-1 text-lg font-semibold text-foreground">
            {encloseArea.toFixed(0)}
          </p>
          <p className="text-xs text-muted">pixel²</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs uppercase tracking-wide text-muted">
            Khoảng cách tâm
          </p>
          <p className="mt-1 text-lg font-semibold text-foreground">
            {dCenter.toFixed(1)}
          </p>
          <p className="text-xs text-muted">pixel</p>
        </div>
      </div>

      {/* ─────────── Panel threshold + quyết định ─────────── */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Ngưỡng IoU quyết định
            </p>
            <p className="text-xs text-muted">
              Nếu IoU &ge; ngưỡng → True Positive. Ngược lại → False Positive.
            </p>
          </div>
          <div
            className="rounded-full px-3 py-1 text-sm font-bold text-white"
            style={{ backgroundColor: classColor }}
          >
            {classification === "TP"
              ? "TRUE POSITIVE"
              : "FALSE POSITIVE"}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted w-10">0.10</span>
          <input
            type="range"
            min={0.1}
            max={0.95}
            step={0.05}
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="flex-1 accent-accent"
          />
          <span className="text-xs text-muted w-10 text-right">0.95</span>
        </div>
        <div className="grid grid-cols-3 text-center text-xs">
          <button
            onClick={() => setThreshold(0.5)}
            className={`rounded-l-lg border border-border px-2 py-1 font-medium transition-colors ${
              Math.abs(threshold - 0.5) < 0.01
                ? "bg-accent text-white"
                : "bg-card hover:bg-surface"
            }`}
          >
            VOC @0.50
          </button>
          <button
            onClick={() => setThreshold(0.75)}
            className={`border-y border-border px-2 py-1 font-medium transition-colors ${
              Math.abs(threshold - 0.75) < 0.01
                ? "bg-accent text-white"
                : "bg-card hover:bg-surface"
            }`}
          >
            Strict @0.75
          </button>
          <button
            onClick={() => setThreshold(0.9)}
            className={`rounded-r-lg border border-border px-2 py-1 font-medium transition-colors ${
              Math.abs(threshold - 0.9) < 0.01
                ? "bg-accent text-white"
                : "bg-card hover:bg-surface"
            }`}
          >
            Medical @0.90
          </button>
        </div>
        <p className="text-center text-xs text-muted">
          Hiện tại: IoU = <strong className="text-foreground">{iou.toFixed(3)}</strong>{" "}
          — ngưỡng = <strong className="text-foreground">{threshold.toFixed(2)}</strong>{" "}
          — quyết định ={" "}
          <strong style={{ color: classColor }}>{classification}</strong>
        </p>
      </div>

      {/* ─────────── Bảng biến thể (GIoU) ─────────── */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-semibold text-foreground mb-2">
          Các biến thể đo lường khác
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase text-muted">IoU</p>
            <p className="text-base font-semibold text-foreground">
              {iou.toFixed(3)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted">GIoU</p>
            <p className="text-base font-semibold text-foreground">
              {giou.toFixed(3)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted">1 − IoU (loss)</p>
            <p className="text-base font-semibold text-foreground">
              {(1 - iou).toFixed(3)}
            </p>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted">
          GIoU ∈ [−1, 1]. Khi 2 box tách hẳn, IoU = 0 nhưng GIoU &lt; 0 — gradient
          vẫn có thông tin hướng dịch chuyển.
        </p>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
 * COMPONENT: MAPComparison — bảng TP/FP cho 6 case ở hai ngưỡng
 * 0.5 và 0.75. Người học thấy rõ vì sao "cùng một mô hình mà mAP
 * giảm mạnh ở ngưỡng khắt khe" — đó là bản chất của COCO metric.
 * ────────────────────────────────────────────────────────────── */
function MAPComparison() {
  const rows = useMemo(
    () =>
      CASES.map((c) => {
        const v = iouValue(c.gt, c.pred);
        return {
          ...c,
          iou: v,
          tp50: v >= 0.5,
          tp75: v >= 0.75,
        };
      }),
    []
  );

  const tp50 = rows.filter((r) => r.tp50).length;
  const tp75 = rows.filter((r) => r.tp75).length;
  const ap50 = tp50 / rows.length;
  const ap75 = tp75 / rows.length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-xs uppercase text-muted">mAP @ 0.5 (VOC)</p>
          <p className="mt-1 text-2xl font-bold text-emerald-500">
            {(ap50 * 100).toFixed(0)}%
          </p>
          <p className="text-xs text-muted">
            {tp50}/{rows.length} True Positive
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-xs uppercase text-muted">mAP @ 0.75 (strict)</p>
          <p className="mt-1 text-2xl font-bold text-amber-500">
            {(ap75 * 100).toFixed(0)}%
          </p>
          <p className="text-xs text-muted">
            {tp75}/{rows.length} True Positive
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase text-muted">
            <tr>
              <th className="px-3 py-2">Case</th>
              <th className="px-3 py-2">IoU</th>
              <th className="px-3 py-2 text-center">@0.50</th>
              <th className="px-3 py-2 text-center">@0.75</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-3 py-2">
                  <p className="font-medium text-foreground">{r.label}</p>
                  <p className="text-xs text-muted">{r.note}</p>
                </td>
                <td className="px-3 py-2 font-mono">{r.iou.toFixed(3)}</td>
                <td className="px-3 py-2 text-center">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                      r.tp50
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                    }`}
                  >
                    {r.tp50 ? "TP" : "FP"}
                  </span>
                </td>
                <td className="px-3 py-2 text-center">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                      r.tp75
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                    }`}
                  >
                    {r.tp75 ? "TP" : "FP"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">
        Cùng một tập 6 dự đoán, khi tăng ngưỡng từ 0.5 → 0.75 có {tp50 - tp75}{" "}
        detection đã chuyển từ TP sang FP. Đây chính là cơ chế khiến mAP của COCO
        thường thấp hơn mAP của PASCAL VOC cho cùng một mô hình.
      </p>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
 * MAIN COMPONENT
 * Chia bài thành 8 step theo kiến trúc chuẩn của codebase:
 *   1) Dự đoán (PredictionGate) — kích hoạt prior knowledge
 *   2) Khám phá (VisualizationSection) — IoU calculator tương tác
 *   3) Aha moment — chốt ý tưởng cốt lõi
 *   4) Thử thách — InlineChallenge lần 1
 *   5) Thử thách — InlineChallenge lần 2
 *   6) Giải thích sâu (ExplanationSection) — LaTeX + code + callouts
 *   7) Tóm tắt (MiniSummary) — 6 ý chính
 *   8) Quiz — 8 câu kiểm tra
 * ────────────────────────────────────────────────────────────── */
export default function IoUTopic() {
  const [mountedAt] = useState<number>(() => Date.now());

  // Dữ liệu phụ trợ cho phần “người học tự soi lại” (không render
  // trực tiếp nhưng hữu ích khi dev debug hoặc mở rộng sau này).
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Ghi nhận thời điểm mount để có thể tính thời gian đọc trung
      // bình trong tương lai. Không gửi telemetry ở bước này.
      window.sessionStorage?.setItem(
        "iou-topic-mounted",
        String(mountedAt)
      );
    }
  }, [mountedAt]);

  return (
    <>
      {/* ────────── STEP 1 — DỰ ĐOÁN ────────── */}
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Mô hình dự đoán bounding box cho chiếc xe máy. Box dự đoán lệch sang phải một chút so với box thật. Làm sao đo mức chính xác?"
          options={[
            "Đo khoảng cách giữa 2 tâm box",
            "Tính tỷ lệ diện tích GIAO NHAU chia cho diện tích HỢP",
            "So sánh chiều rộng 2 box",
          ]}
          correct={1}
          explanation="IoU = Giao / Hợp. Đo cả VỊ TRÍ lẫn KÍCH THƯỚC: 2 box trùng hoàn hảo → IoU = 1.0, không chạm nhau → IoU = 0. Đơn giản, trực giác, và scale-invariant!"
        >
          {/* ────────── ANALOGY — THẺ BÀI THI ────────── */}
          <div className="mb-4 rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-semibold text-foreground">
              Liên hệ đời thường — chấm điểm bài kiểm tra
            </p>
            <p className="mt-1 text-sm text-muted leading-relaxed">
              Hãy tưởng tượng giáo viên đang chấm một câu vẽ hình chữ nhật. Đáp án
              là một khung chuẩn; bài làm của học sinh là khung khác có thể lệch đôi
              chút. Giáo viên muốn đưa ra <strong className="text-foreground">một con số duy nhất</strong>{" "}
              để nói “bài này trùng bao nhiêu phần trăm với đáp án”. Nếu chỉ đo
              khoảng cách hai tâm, học sinh có thể vẽ đúng tâm nhưng kích thước sai
              bét. Nếu chỉ đo chiều rộng, vị trí sai cũng bị bỏ qua. Cách{" "}
              <strong className="text-foreground">công bằng nhất</strong> là hỏi:{" "}
              <em>“Phần hai khung giao nhau chiếm bao nhiêu phần trăm của tổng diện
              tích mà cả hai phủ lên?”</em> — đó chính là IoU.
            </p>
          </div>

          {/* ────────── STEP 2 — KHÁM PHÁ ────────── */}
          <LessonSection step={2} totalSteps={8} label="Khám phá">
            <VisualizationSection>
              <div className="space-y-5">
                <p className="text-sm text-muted leading-relaxed">
                  Kéo 2 hộp (xanh = ground truth, xanh lá = dự đoán) để thấy IoU thay
                  đổi theo thời gian thực. Vùng vàng là phần giao. Trượt ngưỡng bên
                  dưới để thấy cùng một IoU có thể là True Positive hay False
                  Positive tùy benchmark (VOC 0.5, COCO strict 0.75, y tế 0.9).
                </p>
                <IoUCalculator />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-sm font-semibold text-foreground">
                      Ý nghĩa các màu
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-muted">
                      <li>
                        <span className="inline-block h-3 w-3 rounded-sm bg-blue-500 mr-2 align-middle" />
                        Ground truth (A) — hộp nét liền
                      </li>
                      <li>
                        <span className="inline-block h-3 w-3 rounded-sm bg-green-500 mr-2 align-middle" />
                        Prediction (B) — hộp nét đứt
                      </li>
                      <li>
                        <span className="inline-block h-3 w-3 rounded-sm bg-amber-500 mr-2 align-middle" />
                        Intersection — vùng giao nhau
                      </li>
                      <li>
                        <span className="inline-block h-3 w-3 rounded-sm bg-purple-500 mr-2 align-middle" />
                        Enclosing box — khung bao quanh cả hai (dùng cho GIoU)
                      </li>
                    </ul>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-sm font-semibold text-foreground">
                      Gợi ý tương tác
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-muted">
                      <li>• Nhấn “Trùng hoàn hảo” để kiểm tra IoU = 1.000.</li>
                      <li>
                        • Nhấn “Tách rời” để thấy IoU = 0 nhưng GIoU &lt; 0 — đây
                        là lý do GIoU được dùng làm loss.
                      </li>
                      <li>
                        • Bật enclosing box rồi kéo 2 hộp ra xa: diện tích tím lớn
                        dần, GIoU âm dần.
                      </li>
                    </ul>
                  </div>
                </div>
                <MAPComparison />
              </div>
            </VisualizationSection>
          </LessonSection>

          {/* ────────── STEP 3 — AHA MOMENT ────────── */}
          <LessonSection step={3} totalSteps={8} label="Khoảnh khắc Aha">
            <AhaMoment>
              <p>
                IoU gói gọn <strong>cả vị trí lẫn kích thước</strong> vào một con số
                trong đoạn [0, 1]. Giống như <strong>chấm bài thi vẽ hình</strong>:
                IoU &ge; 0.5 là <strong>đạt</strong> (PASCAL VOC), IoU &ge; 0.75 là{" "}
                <strong>giỏi</strong>, IoU = 1.0 là <strong>hoàn hảo</strong>.
                Đặc biệt, IoU là <em>scale-invariant</em> — box to hay nhỏ đều được
                đánh giá công bằng, vì cả tử (giao) và mẫu (hợp) đều co giãn cùng tỷ
                lệ. Đó cũng là lý do IoU trở thành metric chuẩn của ngành
                object-detection suốt 15 năm qua.
              </p>
            </AhaMoment>
          </LessonSection>

          {/* ────────── STEP 4 — THỬ THÁCH 1 ────────── */}
          <LessonSection step={4} totalSteps={8} label="Thử thách 1">
            <InlineChallenge
              question="2 box không giao nhau (IoU = 0). Nếu dùng IoU làm loss function, gradient = 0 — mô hình không học được! Giải pháp?"
              options={[
                "Dùng L1 loss thay vì IoU loss",
                "Dùng GIoU: xét thêm diện tích enclosing box để có gradient khác 0",
                "Tăng learning rate lên rất cao",
              ]}
              correct={1}
              explanation="GIoU = IoU − (diện tích phần thừa trong enclosing box) / (diện tích enclosing box). Khi 2 box tách xa, GIoU âm nhưng gradient khác 0 — mô hình biết cần kéo box lại gần nhau!"
            />
          </LessonSection>

          {/* ────────── STEP 5 — THỬ THÁCH 2 ────────── */}
          <LessonSection step={5} totalSteps={8} label="Thử thách 2">
            <InlineChallenge
              question="Mô hình A đạt mAP@0.5 = 0.80 còn mô hình B đạt mAP@0.5 = 0.72. Nhưng ở ngưỡng khắt khe hơn, mô hình A chỉ còn mAP@0.75 = 0.35, trong khi B giữ mAP@0.75 = 0.60. Bạn chọn mô hình nào cho xe tự lái?"
              options={[
                "A — vì mAP@0.5 cao hơn rõ rệt",
                "B — vì B định vị box chính xác hơn ở ngưỡng khắt khe",
                "Không phân biệt được — nên lấy trung bình hai ngưỡng",
              ]}
              correct={1}
              explanation="A tìm ra vật thể hơi tốt hơn nhưng box lỏng. B định vị chặt hơn — sụt giảm giữa hai ngưỡng của B chỉ 0.12, của A lên tới 0.45. Ứng dụng cần độ chính xác hình học cao (y tế, xe tự lái) nên chọn B."
            />
          </LessonSection>

          {/* ────────── STEP 6 — EXPLANATION SECTION ────────── */}
          <LessonSection step={6} totalSteps={8} label="Giải thích sâu">
            <ExplanationSection>
              <p>
                <strong>IoU (Intersection over Union)</strong>, còn gọi là{" "}
                <em>Jaccard Index</em>, là chỉ số nền tảng đo mức trùng khớp giữa hai
                tập hợp hình học. Trong thị giác máy tính, tập hợp thường là hai
                bounding box (hoặc hai mặt nạ segmentation), và IoU trả về một số
                thực trong đoạn [0, 1].
              </p>

              {/* ───────── Định nghĩa toán học ───────── */}
              <p>
                <strong>Công thức cốt lõi:</strong>
              </p>
              <LaTeX block>
                {"\\text{IoU}(A, B) = \\frac{|A \\cap B|}{|A \\cup B|} = \\frac{\\text{Intersection}}{\\text{Union}}"}
              </LaTeX>
              <p>
                Với hai box trục-thẳng (axis-aligned), ta tính nhanh bằng tọa độ góc:
              </p>
              <LaTeX block>
                {"\\begin{aligned} x_1 &= \\max(A.x_1, B.x_1), \\quad y_1 = \\max(A.y_1, B.y_1) \\\\ x_2 &= \\min(A.x_2, B.x_2), \\quad y_2 = \\min(A.y_2, B.y_2) \\\\ \\text{Inter} &= \\max(0, x_2 - x_1) \\cdot \\max(0, y_2 - y_1) \\\\ \\text{Union} &= \\text{Area}(A) + \\text{Area}(B) - \\text{Inter} \\end{aligned}"}
              </LaTeX>

              {/* ───────── Callout 1 — Biến thể ───────── */}
              <Callout variant="insight" title="Các biến thể IoU dùng làm Loss">
                <div className="space-y-2">
                  <p>
                    <strong>GIoU (Generalized IoU):</strong>{" "}
                    <LaTeX>
                      {"\\text{GIoU} = \\text{IoU} - \\frac{|C \\setminus (A \\cup B)|}{|C|}"}
                    </LaTeX>{" "}
                    với C là enclosing box nhỏ nhất chứa cả A và B. Khi 2 box không
                    giao, GIoU &lt; 0 và gradient vẫn đẩy box về phía nhau.
                  </p>
                  <p>
                    <strong>DIoU (Distance IoU):</strong>{" "}
                    <LaTeX>
                      {"\\text{DIoU} = \\text{IoU} - \\frac{\\rho^2(c_A, c_B)}{c^2}"}
                    </LaTeX>{" "}
                    với ρ là khoảng cách Euclidean giữa hai tâm và c là đường chéo
                    enclosing. Hội tụ nhanh hơn GIoU vì tối ưu khoảng cách tâm trực
                    tiếp.
                  </p>
                  <p>
                    <strong>CIoU (Complete IoU):</strong> bổ sung hạng tử phạt tỷ lệ
                    khung hình:{" "}
                    <LaTeX>
                      {"\\text{CIoU} = \\text{DIoU} - \\alpha v"}
                    </LaTeX>{" "}
                    với{" "}
                    <LaTeX>
                      {"v = \\frac{4}{\\pi^2}\\bigl(\\arctan\\tfrac{w^{gt}}{h^{gt}} - \\arctan\\tfrac{w^{p}}{h^{p}}\\bigr)^2"}
                    </LaTeX>{" "}
                    — phạt nặng nếu aspect ratio hai box lệch nhau.
                  </p>
                </div>
              </Callout>

              {/* ───────── Callout 2 — Benchmark ───────── */}
              <Callout variant="warning" title="IoU trong đánh giá mô hình">
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>PASCAL VOC:</strong> mAP@0.5 — detection đúng khi IoU
                    &ge; 0.5
                  </li>
                  <li>
                    <strong>COCO:</strong> mAP@[0.5 : 0.05 : 0.95] — trung bình 10
                    ngưỡng, khắt khe hơn
                  </li>
                  <li>
                    <strong>LVIS:</strong> tương tự COCO nhưng với long-tail
                    categories
                  </li>
                  <li>
                    <strong>Open Images:</strong> mAP@0.5 nhưng cho phép group-of
                    labels
                  </li>
                  <li>
                    <strong>Trong NMS:</strong> loại box có IoU &gt; ngưỡng (thường
                    0.5 - 0.7) so với box tốt nhất
                  </li>
                  <li>
                    <strong>Trong huấn luyện:</strong> gán anchor với ground truth
                    có IoU cao nhất (positive assignment)
                  </li>
                </ul>
              </Callout>

              {/* ───────── CodeBlock 1 — tính IoU từ đầu ───────── */}
              <CodeBlock language="python" title="Tính IoU từ đầu bằng NumPy">
{`import numpy as np


def iou_xyxy(box_a, box_b):
    """
    IoU cho hai box định dạng [x1, y1, x2, y2].
    Box có thể là np.ndarray shape (4,) hoặc (N, 4).
    """
    ax1, ay1, ax2, ay2 = box_a[..., 0], box_a[..., 1], box_a[..., 2], box_a[..., 3]
    bx1, by1, bx2, by2 = box_b[..., 0], box_b[..., 1], box_b[..., 2], box_b[..., 3]

    # Tọa độ vùng giao
    ix1 = np.maximum(ax1, bx1)
    iy1 = np.maximum(ay1, by1)
    ix2 = np.minimum(ax2, bx2)
    iy2 = np.minimum(ay2, by2)

    inter_w = np.clip(ix2 - ix1, a_min=0, a_max=None)
    inter_h = np.clip(iy2 - iy1, a_min=0, a_max=None)
    inter = inter_w * inter_h

    area_a = (ax2 - ax1) * (ay2 - ay1)
    area_b = (bx2 - bx1) * (by2 - by1)
    union = area_a + area_b - inter

    return np.where(union > 0, inter / union, 0.0)


# Ví dụ
gt = np.array([100, 60, 280, 200], dtype=float)
pred = np.array([120, 80, 300, 220], dtype=float)
print(f"IoU = {iou_xyxy(gt, pred):.3f}")  # ~ 0.658`}
              </CodeBlock>

              {/* ───────── CodeBlock 2 — torchvision ops ───────── */}
              <CodeBlock language="python" title="Dùng torchvision.ops cho production">
{`import torch
from torchvision.ops import (
    box_iou,
    generalized_box_iou,
    distance_box_iou,
    complete_box_iou,
    nms,
)

# Boxes định dạng [x1, y1, x2, y2], shape (N, 4)
gt = torch.tensor([[100, 60, 280, 200]], dtype=torch.float)
pred = torch.tensor([[120, 80, 300, 220]], dtype=torch.float)

# IoU cơ bản — ma trận N×M
iou_mat = box_iou(gt, pred)
print(f"IoU: {iou_mat.item():.3f}")

# Các biến thể dùng làm loss
giou = generalized_box_iou(gt, pred)
giou_loss = 1 - giou.diag()      # loss per-pair

diou = distance_box_iou(gt, pred)
ciou = complete_box_iou(gt, pred)
ciou_loss = 1 - ciou.diag()      # tốt nhất cho bbox regression

# NMS — lọc trùng
detections = torch.tensor([
    [100, 60, 280, 200],
    [110, 70, 285, 205],   # trùng với box 0
    [310, 40, 450, 180],
], dtype=torch.float)
scores = torch.tensor([0.95, 0.85, 0.90])
keep = nms(detections, scores, iou_threshold=0.5)
print("Giữ index:", keep.tolist())  # [0, 2]`}
              </CodeBlock>

              {/* ───────── Callout 3 — Pitfalls ───────── */}
              <Callout variant="warning" title="Những cạm bẫy thường gặp">
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>Định dạng box:</strong> nhầm lẫn [x, y, w, h] vs [x1, y1,
                    x2, y2] là lỗi #1 trong pipeline detection. Đọc kỹ docstring.
                  </li>
                  <li>
                    <strong>Box rỗng:</strong> khi w hoặc h âm/bằng 0, IoU không định
                    nghĩa — phải clip hoặc skip.
                  </li>
                  <li>
                    <strong>Rotated boxes:</strong> IoU cho box xoay (ví dụ ảnh vệ
                    tinh) phức tạp hơn, dùng{" "}
                    <code className="rounded bg-surface px-1">
                      shapely.geometry.Polygon.intersection
                    </code>{" "}
                    hoặc{" "}
                    <code className="rounded bg-surface px-1">
                      mmcv.ops.box_iou_rotated
                    </code>
                    .
                  </li>
                  <li>
                    <strong>IoU = 0 nhưng box gần nhau:</strong> L1 loss giữa tọa độ
                    còn có gradient — nhiều detector dùng <em>kết hợp</em> CIoU loss
                    + L1 loss để bootstrap huấn luyện.
                  </li>
                </ul>
              </Callout>

              {/* ───────── Callout 4 — Ngoài object detection ───────── */}
              <Callout variant="tip" title="IoU ngoài object detection">
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>Semantic segmentation:</strong> mean IoU (mIoU) giữa mặt
                    nạ dự đoán và ground-truth, tính per-class rồi lấy trung bình.
                    Đây là metric chính của Cityscapes, ADE20K, PASCAL VOC seg.
                  </li>
                  <li>
                    <strong>Instance segmentation:</strong> Mask-IoU thay cho Box-IoU
                    trong COCO-mask — đánh giá chính xác hình dạng, không chỉ khung.
                  </li>
                  <li>
                    <strong>Tracking:</strong> IoU cross-frame dùng trong{" "}
                    <em>IoU-Tracker</em>, <em>SORT</em>, <em>DeepSORT</em> để nối
                    detection qua các frame liên tiếp.
                  </li>
                  <li>
                    <strong>3D IoU:</strong> KITTI dùng IoU cho các hình hộp 3D trong
                    bài toán detection ô tô từ LiDAR — phức tạp hơn vì có thêm chiều
                    sâu và góc xoay.
                  </li>
                </ul>
              </Callout>

              {/* ───────── CollapsibleDetail 1 ───────── */}
              <CollapsibleDetail title="Chi tiết: Chứng minh IoU là scale-invariant">
                <div className="space-y-2 text-sm">
                  <p>
                    Gọi hai box A, B. Phép co giãn đồng dạng theo hệ số k &gt; 0 biến
                    mọi chiều dài thành k lần, mọi diện tích thành k² lần:
                  </p>
                  <LaTeX block>
                    {"|A'| = k^2 |A|, \\quad |B'| = k^2 |B|, \\quad |A' \\cap B'| = k^2 |A \\cap B|"}
                  </LaTeX>
                  <p>Do đó hợp cũng nhân với k²:</p>
                  <LaTeX block>
                    {"|A' \\cup B'| = |A'| + |B'| - |A' \\cap B'| = k^2 (|A| + |B| - |A \\cap B|) = k^2 |A \\cup B|"}
                  </LaTeX>
                  <p>Chia tử cho mẫu, k² triệt tiêu:</p>
                  <LaTeX block>
                    {"\\text{IoU}(A', B') = \\frac{k^2 |A \\cap B|}{k^2 |A \\cup B|} = \\text{IoU}(A, B)"}
                  </LaTeX>
                  <p>
                    Tính chất này đặc biệt quan trọng khi dataset chứa vật thể ở
                    nhiều khoảng cách (xe gần vs xe xa) — IoU công bằng cho cả hai.
                  </p>
                </div>
              </CollapsibleDetail>

              {/* ───────── CollapsibleDetail 2 ───────── */}
              <CollapsibleDetail title="Chi tiết: Thuật toán tính mAP từ IoU">
                <div className="space-y-2 text-sm">
                  <p>
                    mAP không chỉ đếm TP/FP. Pipeline đầy đủ:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 pl-2">
                    <li>
                      Sắp xếp toàn bộ detection của một class theo confidence giảm
                      dần.
                    </li>
                    <li>
                      Duyệt lần lượt: với mỗi detection, tìm ground-truth có IoU cao
                      nhất trong cùng ảnh. Nếu IoU &ge; ngưỡng và GT đó chưa được
                      “claim”, đánh TP; ngược lại FP. GT đã claim không dùng lại.
                    </li>
                    <li>
                      Tính cumulative Precision và Recall sau mỗi detection.
                    </li>
                    <li>
                      Vẽ đường cong PR, tính Average Precision = diện tích dưới đường
                      cong (PASCAL dùng 11-point interpolation, COCO dùng 101-point).
                    </li>
                    <li>
                      Lặp cho mọi class → <em>mean</em> AP (mAP).
                    </li>
                    <li>
                      Với COCO: lặp ở 10 ngưỡng IoU (0.5 → 0.95) → mAP@[0.5:0.95].
                    </li>
                  </ol>
                  <p>
                    Chính vì có bước “GT đã claim không dùng lại” nên hai detection
                    trùng nhau cùng vật thể sẽ bị tính một TP + một FP — NMS trước
                    đó đã dọn bớt để tránh hạ điểm oan.
                  </p>
                </div>
              </CollapsibleDetail>

              {/* ───────── Ứng dụng thực tế ───────── */}
              <p>
                <strong>Ứng dụng thực tế của IoU:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>Xe tự lái:</strong> Tesla, Waymo, Mobileye đều dùng IoU
                  ngưỡng cao (≥ 0.7) cho bộ detector phát hiện xe và người đi bộ —
                  sai vài pixel trong không gian 3D có thể gây tai nạn.
                </li>
                <li>
                  <strong>Y tế:</strong> phân đoạn khối u trong CT/MRI dùng mIoU
                  (còn gọi là <em>Dice-adjacent</em>) — Dice = 2·IoU/(1+IoU), tương
                  đương IoU nhưng phân phối khác.
                </li>
                <li>
                  <strong>An ninh camera:</strong> hệ thống nhận diện khuôn mặt kết
                  hợp IoU giữa bounding box khuôn mặt liên tiếp để track một người
                  trong khung hình.
                </li>
                <li>
                  <strong>Robot kho Amazon:</strong> pick-and-place dùng IoU 2D trên
                  ảnh top-down để xác định vị trí túi hàng — threshold 0.6 là cân
                  bằng giữa độ chính xác và tốc độ.
                </li>
                <li>
                  <strong>Nông nghiệp chính xác:</strong> đếm cây từ ảnh drone, đo
                  tán lá — IoU giữa mask dự đoán và mask chuyên gia đánh dấu.
                </li>
              </ul>

              {/* ───────── Pitfalls tổng hợp ───────── */}
              <p>
                <strong>Tóm tắt các pitfall khi dùng IoU:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1">
                <li>
                  Không dùng IoU thô làm loss nếu box có thể không giao —{" "}
                  <em>dùng GIoU/DIoU/CIoU</em>.
                </li>
                <li>
                  Không so sánh mAP giữa hai benchmark khác nhau (VOC@0.5 vs
                  COCO@[.5:.95]) — luôn khớp thiết lập trước khi công bố.
                </li>
                <li>
                  Với vật thể nhỏ (&lt; 32px), một lệch vài pixel đã kéo IoU xuống
                  mạnh — COCO định nghĩa riêng mAP_small, mAP_medium, mAP_large.
                </li>
                <li>
                  NMS với ngưỡng IoU quá cao (0.9) sẽ giữ nhiều box trùng; quá thấp
                  (0.3) sẽ mất box gần nhau — tune theo use-case.
                </li>
                <li>
                  IoU không tính đến class: hai box cùng chỗ nhưng khác class (người
                  vs mannequin) có IoU cao, phải kiểm tra class riêng.
                </li>
              </ol>
            </ExplanationSection>
          </LessonSection>

          {/* ────────── STEP 7 — MINI SUMMARY ────────── */}
          <LessonSection step={7} totalSteps={8} label="Tóm tắt">
            <MiniSummary
              points={[
                "IoU = Giao / Hợp — đo trùng khớp 2 box trong 1 con số thuộc [0, 1]; 0 = tách rời, 1 = trùng hoàn hảo.",
                "Scale-invariant: phóng to cả 2 box cùng tỷ lệ không làm IoU đổi, nên công bằng cho vật thể lớn và nhỏ.",
                "Ngưỡng quy ước: IoU ≥ 0.5 đạt (VOC), ≥ 0.75 giỏi (COCO), ≥ 0.9 khắt khe cho y tế/xe tự lái.",
                "Biến thể làm loss: GIoU (enclosing box), DIoU (khoảng cách tâm), CIoU (+ aspect ratio) — giải quyết vấn đề gradient=0 khi box tách rời.",
                "Ứng dụng: đánh giá mAP (VOC, COCO, LVIS), Non-Max Suppression, gán anchor, tracking, segmentation (mIoU).",
                "Pitfall: nhầm [x,y,w,h] vs [x1,y1,x2,y2], box rỗng, rotated boxes, và so sánh mAP khác benchmark.",
              ]}
            />
          </LessonSection>

          {/* ────────── STEP 8 — QUIZ ────────── */}
          <LessonSection step={8} totalSteps={8} label="Kiểm tra">
            <QuizSection questions={QUIZ} />
          </LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
