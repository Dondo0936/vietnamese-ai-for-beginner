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

/* ==============================================================
 * METADATA
 * ============================================================== */
export const metadata: TopicMeta = {
  slug: "instance-segmentation",
  title: "Instance Segmentation",
  titleVi: "Phân đoạn thể hiện",
  description:
    "Kết hợp phát hiện đối tượng và phân đoạn, phân biệt từng thể hiện riêng lẻ của cùng loại đối tượng.",
  category: "computer-vision",
  tags: ["computer-vision", "segmentation", "detection"],
  difficulty: "advanced",
  relatedSlugs: ["semantic-segmentation", "object-detection", "panoptic-segmentation"],
  vizType: "interactive",
};

/* ==============================================================
 * HẰNG SỐ HÌNH HỌC
 * Canvas minh họa 3-4 instance chồng lấn. Dùng toạ độ SVG tuyệt đối
 * để dễ match giữa stage backbone và stage mask head sau này.
 * ============================================================== */
const CANVAS_W = 600;
const CANVAS_H = 340;

/* Mỗi instance có: id, nhãn, màu riêng (để làm nổi bật ý instance
 * segmentation tô MÀU RIÊNG cho từng đối tượng), polygon mask,
 * bounding box (x1, y1, x2, y2) và điểm đặt label.
 * Chú ý: 2 người (instance 3 và 4) CHE KHUẤT một phần để minh hoạ
 * occlusion — một trong những điểm mà Mask R-CNN xử lý khéo léo. */
interface Instance {
  id: number;
  label: string;
  classId: number;
  className: string;
  color: string;
  points: string;
  bbox: { x1: number; y1: number; x2: number; y2: number };
  cx: number;
  cy: number;
  score: number;
}

const INSTANCES: Instance[] = [
  {
    id: 1,
    label: "Xe #1",
    classId: 2,
    className: "xe",
    color: "#3b82f6",
    points: "60,260 68,205 95,185 145,185 170,205 175,260 155,275 80,275",
    bbox: { x1: 58, y1: 183, x2: 178, y2: 278 },
    cx: 118,
    cy: 230,
    score: 0.94,
  },
  {
    id: 2,
    label: "Xe #2",
    classId: 2,
    className: "xe",
    color: "#22c55e",
    points: "230,270 238,215 265,195 315,195 340,215 345,270 325,285 250,285",
    bbox: { x1: 228, y1: 193, x2: 348, y2: 288 },
    cx: 288,
    cy: 240,
    score: 0.89,
  },
  {
    id: 3,
    label: "Người #1",
    classId: 1,
    className: "nguoi",
    color: "#f59e0b",
    points: "400,275 407,175 422,130 442,115 462,130 478,175 483,275 462,285 422,285",
    bbox: { x1: 398, y1: 113, x2: 485, y2: 288 },
    cx: 442,
    cy: 200,
    score: 0.96,
  },
  {
    id: 4,
    label: "Người #2",
    classId: 1,
    className: "nguoi",
    color: "#ec4899",
    points: "495,270 502,180 518,140 538,128 560,140 575,180 580,270 560,280 518,280",
    bbox: { x1: 493, y1: 126, x2: 582, y2: 282 },
    cx: 542,
    cy: 205,
    score: 0.91,
  },
];

/* Tên 4 stage của pipeline Mask R-CNN — dùng để animate tuần tự. */
const PIPELINE_STAGES = [
  { id: 0, name: "Backbone + FPN", short: "Backbone", color: "#0ea5e9",
    desc: "CNN (ResNet + FPN) trích xuất feature đa tỷ lệ" },
  { id: 1, name: "Region Proposal Network", short: "RPN", color: "#a855f7",
    desc: "Đề xuất ~1000 vùng ứng viên (proposals)" },
  { id: 2, name: "RoIAlign", short: "RoIAlign", color: "#f59e0b",
    desc: "Cắt + resize feature cho mỗi vùng, không làm tròn" },
  { id: 3, name: "3 nhánh song song", short: "Heads", color: "#22c55e",
    desc: "Classification + BBox regression + Binary Mask" },
];

/* Bảng so sánh 4 tác vụ CV chính — để contextualize Instance Seg. */
const CV_TASKS = [
  { key: "cls", name: "Classification", vi: "Phân loại ảnh",
    desc: "1 nhãn cho cả ảnh", color: "#3b82f6",
    icon: "label" },
  { key: "det", name: "Object Detection", vi: "Phát hiện đối tượng",
    desc: "Nhiều bounding box + nhãn", color: "#22c55e",
    icon: "box" },
  { key: "sem", name: "Semantic Seg.", vi: "Phân đoạn ngữ nghĩa",
    desc: "Pixel-level, cùng lớp = cùng màu", color: "#f59e0b",
    icon: "paint" },
  { key: "ins", name: "Instance Seg.", vi: "Phân đoạn thể hiện",
    desc: "Pixel-level, mỗi đối tượng 1 màu riêng", color: "#8b5cf6",
    icon: "stars" },
];

/* ==============================================================
 * BỘ 8 CÂU HỎI QUIZ — phủ từ nền tảng đến nâng cao.
 * Phân bổ:
 *   1 câu định nghĩa bản chất
 *   2 câu về kiến trúc Mask R-CNN
 *   1 câu so sánh semantic vs instance
 *   1 câu về SAM / foundation model
 *   1 câu về RoIAlign / edge case
 *   1 câu về ứng dụng thực tế
 *   1 câu về panoptic (để mở rộng liên kết)
 * ============================================================== */
const QUIZ: QuizQuestion[] = [
  {
    question: "Instance Segmentation kết hợp khả năng của hai tác vụ nào?",
    options: [
      "Image Classification + Data Augmentation",
      "Object Detection (bounding box) + Semantic Segmentation (pixel mask)",
      "Style Transfer + Feature Extraction",
      "Optical Flow + Color Spaces",
    ],
    correct: 1,
    explanation:
      "Instance Segmentation = Object Detection (tìm từng đối tượng) + Semantic Segmentation (mask pixel-level). Kết quả: mỗi đối tượng có mask riêng biệt.",
  },
  {
    question: "Mask R-CNN thêm gì so với Faster R-CNN?",
    options: [
      "Thêm lớp fully connected lớn hơn",
      "Thêm nhánh dự đoán mask nhị phân cho mỗi vùng đề xuất, song song với nhánh class và box",
      "Thêm nhiều anchor box hơn",
      "Thay đổi hoàn toàn kiến trúc, bỏ backbone",
    ],
    correct: 1,
    explanation:
      "Mask R-CNN giữ nguyên Faster R-CNN (box + class) và thêm 1 nhánh song song dự đoán binary mask cho mỗi Region of Interest (RoI). Nhánh mask là một FCN nhỏ xuất ra tensor K×m×m.",
  },
  {
    question: "Tại sao Mask R-CNN thay RoIPool bằng RoIAlign?",
    options: [
      "RoIAlign chạy nhanh hơn nhiều lần",
      "RoIPool làm tròn tọa độ, gây lệch pixel -- RoIAlign dùng bilinear interpolation để giữ chính xác, quan trọng cho mask",
      "RoIAlign không cần feature map",
      "RoIPool không hỗ trợ GPU",
    ],
    correct: 1,
    explanation:
      "RoIPool có 2 bước quantization (làm tròn) gây sai lệch pixel đáng kể. Với bounding box sai lệch vài pixel vẫn ổn, nhưng mask pixel-level thì không. RoIAlign bỏ quantization, dùng bilinear interpolation -- cải thiện mAP mask ~10%.",
  },
  {
    question: "Khác biệt cốt lõi giữa Semantic Segmentation và Instance Segmentation?",
    options: [
      "Semantic chỉ dùng được cho ảnh đen trắng",
      "Semantic tô cùng màu cho cùng lớp (3 người cùng 1 màu); Instance tô MÀU RIÊNG cho từng đối tượng (3 người = 3 màu)",
      "Instance không tạo mask pixel-level",
      "Semantic nhanh hơn vì bỏ bước classification",
    ],
    correct: 1,
    explanation:
      "Semantic: mọi pixel 'người' đều cùng màu -- không phân biệt cá nhân. Instance: tô MÀU RIÊNG cho từng thể hiện -- phân biệt người #1, người #2. Cần thiết khi muốn đếm, theo dõi hoặc thao tác riêng với từng đối tượng.",
  },
  {
    question: "SAM (Segment Anything Model) của Meta có gì đặc biệt?",
    options: [
      "Chỉ hoạt động trên ảnh y tế",
      "Foundation model cho segmentation: huấn luyện trên 11M ảnh + 1B mask, zero-shot trên đối tượng mới bằng prompt (click/box/text)",
      "Nhanh gấp 100 lần Mask R-CNN",
      "Chỉ hỗ trợ ảnh đen trắng",
    ],
    correct: 1,
    explanation:
      "SAM là foundation model cho segmentation: huấn luyện trên 11M ảnh, 1B+ masks, có thể phân đoạn đối tượng mới (zero-shot) chỉ bằng click hoặc box prompt, không cần fine-tune. SAM 2 mở rộng sang video.",
  },
  {
    question: "Khi 2 người đi bộ che khuất nhau (occlusion), Mask R-CNN xử lý thế nào?",
    options: [
      "Chỉ nhận ra 1 người duy nhất",
      "Dự đoán mask ĐỘC LẬP cho mỗi RoI, cho phép 2 mask chồng lấp; pixel chồng thường gán cho instance có score cao hơn",
      "Mask R-CNN không xử lý được occlusion",
      "Phải chạy semantic segmentation trước",
    ],
    correct: 1,
    explanation:
      "Mask R-CNN dự đoán mask ĐỘC LẬP cho mỗi RoI (sigmoid cho từng pixel), nên 2 mask có thể chồng lấp tự nhiên. Khi hiển thị, pixel chồng lấp thường ưu tiên instance có confidence cao hơn hoặc diện tích nhỏ hơn (foreground priority).",
  },
  {
    question: "YOLACT khác Mask R-CNN ở điểm chính nào?",
    options: [
      "YOLACT không dùng CNN",
      "YOLACT là one-stage, sinh mask bằng tổ hợp tuyến tính của 'prototypes' + coefficients, cho tốc độ real-time",
      "YOLACT chỉ chạy trên CPU",
      "YOLACT không cần bounding box",
    ],
    correct: 1,
    explanation:
      "YOLACT tách bước dự đoán: backbone sinh k prototype mask (toàn ảnh) + mỗi detection dự đoán k coefficients. Mask instance = kết hợp tuyến tính. Một stage → real-time (~30 FPS), trong khi Mask R-CNN chỉ ~5-7 FPS.",
  },
  {
    question: "Panoptic Segmentation bổ sung gì so với Instance Segmentation?",
    options: [
      "Không gì cả, chỉ đổi tên",
      "Gán nhãn cho MỌI pixel: vừa phân biệt từng instance của 'things' (đối tượng đếm được), vừa phân đoạn 'stuff' (trời, đường, cỏ)",
      "Chỉ hoạt động trên ảnh vệ tinh",
      "Bỏ phần bounding box",
    ],
    correct: 1,
    explanation:
      "Panoptic = Semantic + Instance. Pixel thuộc 'things' (người, xe — đếm được) có instance ID; pixel thuộc 'stuff' (trời, đường — không đếm được) chỉ có class label. Mọi pixel đều được gán nhãn, không có 'lỗ'.",
  },
];

/* ==============================================================
 * HELPER NHỎ
 * ============================================================== */
/** Dịch bbox sang chuỗi points dùng cho polygon SVG (viền bbox). */
function bboxPoints(b: { x1: number; y1: number; x2: number; y2: number }): string {
  return `${b.x1},${b.y1} ${b.x2},${b.y1} ${b.x2},${b.y2} ${b.x1},${b.y2}`;
}

/** Tính diện tích gần đúng của polygon (dùng cho thống kê mini). */
function polygonAreaApprox(pointsStr: string): number {
  const pts = pointsStr.split(/\s+/).map((p) => p.split(",").map(Number));
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a) / 2;
}

/* ==============================================================
 * COMPONENT CHÍNH
 * ============================================================== */
export default function InstanceSegmentationTopic() {
  /* Instance được highlight khi người học click */
  const [selectedId, setSelectedId] = useState<number | null>(null);

  /* Stage hiện tại trong pipeline Mask R-CNN (0..3).
   * Người học bấm tiến / lùi để quan sát từng stage. */
  const [stage, setStage] = useState<number>(0);

  /* Bật/tắt để so sánh trực tiếp Semantic vs Instance:
   * 'semantic' → mọi đối tượng cùng lớp tô cùng màu
   * 'instance' → mỗi đối tượng 1 màu riêng */
  const [viewMode, setViewMode] = useState<"semantic" | "instance">("instance");

  /* Bật mask overlay hay chỉ bbox */
  const [showMask, setShowMask] = useState<boolean>(true);
  const [showBBox, setShowBBox] = useState<boolean>(true);

  /* Điều chỉnh opacity mask để nhìn ảnh gốc phía sau rõ hơn */
  const [maskOpacity, setMaskOpacity] = useState<number>(0.55);

  /* Stage advance/back — dùng useCallback để tránh re-render không cần. */
  const nextStage = useCallback(() => {
    setStage((s) => Math.min(s + 1, PIPELINE_STAGES.length - 1));
  }, []);
  const prevStage = useCallback(() => {
    setStage((s) => Math.max(s - 1, 0));
  }, []);
  const resetStages = useCallback(() => setStage(0), []);

  /* Số instance detect tại stage hiện tại — tăng dần theo stage để
   * minh hoạ quá trình “proposals → detections”. */
  const visibleInstances = useMemo(() => {
    if (stage === 0) return [];              // mới qua backbone, chưa có detection
    if (stage === 1) return INSTANCES;       // RPN đã cho proposals
    if (stage === 2) return INSTANCES;       // RoIAlign cắt feature xong
    return INSTANCES;                         // heads xuất mask
  }, [stage]);

  /* Khi ở view 'semantic', các đối tượng cùng lớp nhận cùng màu. */
  const semanticColorMap = useMemo(
    () => ({ nguoi: "#f59e0b", xe: "#3b82f6" }) as Record<string, string>,
    [],
  );

  /* Chọn màu phù hợp theo viewMode. */
  const colorFor = useCallback(
    (inst: Instance) => {
      if (viewMode === "semantic") return semanticColorMap[inst.className] ?? "#94a3b8";
      return inst.color;
    },
    [viewMode, semanticColorMap],
  );

  /* Thống kê mini: tổng diện tích mask per class. */
  const statsByClass = useMemo(() => {
    const m: Record<string, { count: number; area: number }> = {};
    for (const i of INSTANCES) {
      if (!m[i.className]) m[i.className] = { count: 0, area: 0 };
      m[i.className].count++;
      m[i.className].area += polygonAreaApprox(i.points);
    }
    return m;
  }, []);

  /* Chuỗi bước hiện lên phần "đang ở đâu trong bài". */
  const stepLabels = [
    "Dự đoán",
    "Khám phá",
    "Aha",
    "Thử thách",
    "Giải thích",
    "Tóm tắt",
    "Kiểm tra",
    "Mở rộng",
  ];

  return (
    <>
      {/* ============================================================
          BƯỚC 1 — HOOK / DỰ ĐOÁN
          Khởi động bằng PredictionGate đặt ra ngữ cảnh giao thông
          — nơi 3 chiếc xe máy đỗ sát nhau là case kinh điển mà
          Semantic Segmentation bị "kẹt".
          ============================================================ */}
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <div className="mb-4 flex items-center justify-end">
          <ProgressSteps current={1} total={8} labels={stepLabels} />
        </div>
        <PredictionGate
          question="Ảnh camera giao thông có 3 chiếc xe máy đỗ sát nhau. Semantic Segmentation tô tất cả cùng màu 'xe'. Làm sao phân biệt xe #1, #2, #3 để đếm hoặc bám theo?"
          options={[
            "Dùng Object Detection: vẽ 3 bounding box là đủ",
            "Dùng Instance Segmentation: mỗi xe có mask pixel riêng biệt + bounding box + nhãn",
            "Không thể phân biệt được khi xe sát nhau",
          ]}
          correct={1}
          explanation="Instance Segmentation tô MÀU RIÊNG cho từng xe: xe #1 xanh dương, xe #2 xanh lá, xe #3 vàng. Mỗi thể hiện (instance) có mask pixel-level riêng biệt — không chỉ đúng lớp, mà còn đúng đối tượng nào trong lớp!"
        >
          <p className="mt-2 text-sm text-muted">
            Hãy tiếp tục để thấy tại sao <strong>mask pixel-level riêng cho từng đối tượng</strong>{" "}
            lại là chìa khoá cho các ứng dụng robot, y tế và thương mại điện tử.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ============================================================
          BƯỚC 2 — ẨN DỤ THỰC TẾ
          Kết nối khái niệm với "điểm danh học sinh" — ai cũng mặc
          đồng phục (cùng lớp) nhưng GV vẫn điểm danh từng người.
          ============================================================ */}
      <LessonSection step={2} totalSteps={8} label="Ẩn dụ">
        <p>
          Hãy tưởng tượng bạn là cô giáo nhìn vào lớp học: tất cả học sinh đều mặc áo đồng phục
          trắng. <strong>Semantic Segmentation</strong> giống như nói "có áo trắng ở đây, đây và
          đây" — đúng lớp nhưng không biết ai là ai. <strong>Instance Segmentation</strong> lại
          đi thêm một bước: gắn tên riêng cho từng học sinh — "đây là Nam, đây là Lan, đây là Tú".
        </p>
        <p>
          Trong thế giới AI/CV, điều này có nghĩa là mỗi đối tượng nhận được{" "}
          <strong>mask pixel-level riêng biệt</strong>. Không chỉ "có xe ở vùng này" mà là{" "}
          "xe #1 chiếm đúng 1.427 pixel này, xe #2 chiếm 1.512 pixel kia". Nhờ vậy, bạn có thể{" "}
          đếm, tách, theo dõi, hoặc thao tác riêng với từng đối tượng.
        </p>
        <p>
          Nếu không có Instance Segmentation, nhiều ứng dụng thực tế sẽ "đổ vỡ": robot gắp hàng
          không biết lấy quả táo nào trước, xe tự lái không biết có bao nhiêu người đang băng
          qua, ứng dụng đếm tế bào y khoa không phân biệt được 2 tế bào đang dính nhau.
        </p>
      </LessonSection>

      {/* ============================================================
          BƯỚC 3 — TRỰC QUAN HOÁ TƯƠNG TÁC
          Hiển thị ảnh với 4 instance chồng lấn. Người học có thể:
            • Click từng instance → highlight mask + bbox
            • Toggle semantic vs instance view
            • Bật/tắt mask và bbox riêng
            • Chỉnh opacity
            • Chạy pipeline 4 stage từ backbone → heads
          ============================================================ */}
      <LessonSection step={3} totalSteps={8} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-6">
            {/* Control panel */}
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-background/50 p-2">
                <span className="text-muted">Chế độ:</span>
                <button
                  type="button"
                  onClick={() => setViewMode("semantic")}
                  className={`rounded px-3 py-1 text-xs font-semibold transition ${
                    viewMode === "semantic"
                      ? "bg-accent text-white"
                      : "bg-surface text-muted hover:bg-surface/70"
                  }`}
                >
                  Semantic
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("instance")}
                  className={`rounded px-3 py-1 text-xs font-semibold transition ${
                    viewMode === "instance"
                      ? "bg-accent text-white"
                      : "bg-surface text-muted hover:bg-surface/70"
                  }`}
                >
                  Instance
                </button>
              </div>
              <label className="flex items-center gap-1 rounded-lg border border-border bg-background/50 px-3 py-1">
                <input
                  type="checkbox"
                  checked={showMask}
                  onChange={(e) => setShowMask(e.target.checked)}
                />
                Mask
              </label>
              <label className="flex items-center gap-1 rounded-lg border border-border bg-background/50 px-3 py-1">
                <input
                  type="checkbox"
                  checked={showBBox}
                  onChange={(e) => setShowBBox(e.target.checked)}
                />
                BBox
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-background/50 px-3 py-1">
                <span className="text-muted">Opacity:</span>
                <input
                  type="range"
                  min={0.1}
                  max={0.9}
                  step={0.05}
                  value={maskOpacity}
                  onChange={(e) => setMaskOpacity(parseFloat(e.target.value))}
                />
                <span className="tabular-nums text-xs w-8 text-right">
                  {maskOpacity.toFixed(2)}
                </span>
              </div>
            </div>

            <p className="text-sm text-muted text-center">
              Nhấn vào từng đối tượng để highlight. Đổi chế độ để thấy khác biệt cốt lõi giữa
              semantic (cùng lớp = cùng màu) và instance (mỗi đối tượng 1 màu riêng).
            </p>

            {/* Main SVG canvas */}
            <svg
              viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
              className="w-full max-w-3xl mx-auto rounded-lg border border-border"
            >
              {/* Nền + mặt đường */}
              <rect x={0} y={0} width={CANVAS_W} height={CANVAS_H} rx={8} fill="#0f172a" />
              <rect
                x={0}
                y={CANVAS_H - 100}
                width={CANVAS_W}
                height={100}
                fill="#1e293b"
                opacity={0.55}
              />
              {/* Lane markings để gợi đường phố */}
              {[0, 1, 2, 3].map((i) => (
                <rect
                  key={i}
                  x={40 + i * 150}
                  y={CANVAS_H - 48}
                  width={60}
                  height={4}
                  fill="#475569"
                  opacity={0.6}
                />
              ))}

              {/* Các instance */}
              {INSTANCES.map((inst) => {
                const isSelected = selectedId === inst.id;
                const dimmed = selectedId !== null && !isSelected;
                const color = colorFor(inst);
                return (
                  <g
                    key={inst.id}
                    onClick={() => setSelectedId(isSelected ? null : inst.id)}
                    style={{ cursor: "pointer" }}
                  >
                    {showMask && (
                      <polygon
                        points={inst.points}
                        fill={color}
                        opacity={dimmed ? 0.15 : maskOpacity}
                        stroke={color}
                        strokeWidth={isSelected ? 3 : 1.5}
                      />
                    )}
                    {showBBox && (
                      <polygon
                        points={bboxPoints(inst.bbox)}
                        fill="none"
                        stroke={color}
                        strokeDasharray="5,3"
                        strokeWidth={isSelected ? 2 : 1.2}
                        opacity={dimmed ? 0.25 : 0.9}
                      />
                    )}
                    <text
                      x={inst.cx}
                      y={inst.cy}
                      textAnchor="middle"
                      fill="white"
                      fontSize="11"
                      fontWeight="bold"
                      opacity={dimmed ? 0.3 : 1}
                    >
                      {inst.label}
                    </text>
                    {/* Score ngay trên bbox khi ở instance mode */}
                    {viewMode === "instance" && showBBox && (
                      <text
                        x={inst.bbox.x1 + 4}
                        y={inst.bbox.y1 - 4}
                        fill={color}
                        fontSize="11"
                        fontWeight="bold"
                        opacity={dimmed ? 0.3 : 1}
                      >
                        {inst.className} {(inst.score * 100).toFixed(0)}%
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Detail panel cho instance đã chọn */}
            {selectedId !== null && (() => {
              const inst = INSTANCES.find((i) => i.id === selectedId);
              if (!inst) return null;
              const area = polygonAreaApprox(inst.points);
              return (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg bg-background/50 border border-border p-4"
                >
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div
                      className="h-6 w-6 rounded"
                      style={{ background: inst.color }}
                      aria-hidden
                    />
                    <div className="flex-1 min-w-[180px]">
                      <p className="font-bold text-accent">{inst.label}</p>
                      <p className="text-xs text-muted">
                        Lớp: {inst.className} · Score:{" "}
                        {(inst.score * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-xs text-muted">
                      BBox: ({inst.bbox.x1}, {inst.bbox.y1}) →{" "}
                      ({inst.bbox.x2}, {inst.bbox.y2})
                    </div>
                    <div className="text-xs text-muted">
                      Diện tích mask ≈ {area.toFixed(0)} px²
                    </div>
                  </div>
                </motion.div>
              );
            })()}

            {/* So sánh 4 tác vụ CV */}
            <div className="flex flex-wrap gap-3 justify-center">
              {CV_TASKS.map((item) => (
                <div
                  key={item.key}
                  className="rounded-lg border p-3 text-center w-[150px]"
                  style={{ borderColor: item.color }}
                >
                  <p className="text-xs font-bold" style={{ color: item.color }}>
                    {item.name}
                  </p>
                  <p className="text-xs text-muted mt-1 leading-tight">{item.desc}</p>
                  <p className="mt-1 text-[10px] text-muted/70 italic">{item.vi}</p>
                </div>
              ))}
            </div>

            {/* Thống kê mini per-class */}
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
              {Object.entries(statsByClass).map(([cls, data]) => (
                <div
                  key={cls}
                  className="rounded-md border border-border bg-background/40 p-3 text-center"
                >
                  <p className="text-xs uppercase tracking-wider text-muted">{cls}</p>
                  <p className="text-lg font-bold text-accent">{data.count}</p>
                  <p className="text-[10px] text-muted">
                    tổng {data.area.toFixed(0)} px²
                  </p>
                </div>
              ))}
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ============================================================
          BƯỚC 4 — AHA MOMENT
          Một câu đóng đinh insight chính: Instance Segmentation
          = Detection + Segmentation, và mỗi đối tượng có nhãn + box
          + MASK RIÊNG — như điểm danh bằng cách tô màu riêng.
          ============================================================ */}
      <LessonSection step={4} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Instance Segmentation = <strong>Object Detection</strong>{" "}
            (tìm từng đối tượng) + <strong>Semantic Segmentation</strong>{" "}
            (mask pixel-level). Mỗi đối tượng có{" "}
            <strong>bounding box + nhãn lớp + mask pixel riêng biệt</strong> —{" "}
            giống như điểm danh từng học sinh trong lớp <em>bằng cách tô màu riêng</em>!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ============================================================
          BƯỚC 5 — THỬ THÁCH TRONG LUỒNG (1)
          Về occlusion — case quan trọng, gắn ngay sau aha moment.
          ============================================================ */}
      <LessonSection step={5} totalSteps={8} label="Thử thách 1">
        <InlineChallenge
          question="Mask R-CNN dự đoán mask riêng cho mỗi đối tượng. Điều gì xảy ra khi 2 người đi bộ che khuất nhau (occlusion)?"
          options={[
            "Mô hình chỉ nhận ra 1 người duy nhất",
            "Mask của 2 người có thể chồng lấp -- pixel chồng thường được gán cho instance có score cao hơn",
            "Mask R-CNN không xử lý được occlusion, phải chuyển sang SAM",
          ]}
          correct={1}
          explanation="Mask R-CNN dự đoán mask ĐỘC LẬP cho mỗi RoI (sigmoid trên từng pixel), nên 2 mask có thể chồng lấp tự nhiên. Khi hiển thị, pixel chồng lấp thường được gán cho instance có confidence cao hơn hoặc diện tích mask nhỏ hơn (foreground priority)."
        />
      </LessonSection>

      {/* ============================================================
          BƯỚC 6 — PIPELINE MASK R-CNN (interactive sub-viz)
          Cho phép người học bước qua 4 stage: Backbone → RPN →
          RoIAlign → Heads. Mỗi stage hiển thị nhãn + mô tả ngắn +
          hiệu ứng visual khác nhau trên ảnh để thấy "hạt giống"
          của detection nảy nở dần.
          ============================================================ */}
      <LessonSection step={6} totalSteps={8} label="Pipeline Mask R-CNN">
        <VisualizationSection>
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {PIPELINE_STAGES.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStage(i)}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    i === stage
                      ? "text-white"
                      : "text-muted bg-background/30 hover:bg-background/60"
                  }`}
                  style={{
                    borderColor: s.color,
                    background: i === stage ? s.color : undefined,
                  }}
                >
                  {i + 1}. {s.short}
                </button>
              ))}
            </div>

            <motion.div
              key={stage}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-border bg-background/40 p-4"
            >
              <p className="text-sm font-bold" style={{ color: PIPELINE_STAGES[stage].color }}>
                Stage {stage + 1}/{PIPELINE_STAGES.length}: {PIPELINE_STAGES[stage].name}
              </p>
              <p className="text-sm text-muted mt-1">{PIPELINE_STAGES[stage].desc}</p>
            </motion.div>

            <svg
              viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
              className="w-full max-w-3xl mx-auto rounded-lg border border-border"
            >
              <rect x={0} y={0} width={CANVAS_W} height={CANVAS_H} rx={8} fill="#0f172a" />

              {/* Stage 0 — chỉ hiện feature map giả lập bằng lưới điểm */}
              {stage === 0 && (
                <g>
                  {Array.from({ length: 24 }, (_, i) => i).flatMap((i) =>
                    Array.from({ length: 14 }, (_, j) => (
                      <circle
                        key={`${i}-${j}`}
                        cx={15 + i * 24}
                        cy={10 + j * 23}
                        r={2.5}
                        fill="#0ea5e9"
                        opacity={0.35 + 0.4 * Math.random()}
                      />
                    )),
                  )}
                  <text
                    x={CANVAS_W / 2}
                    y={CANVAS_H - 20}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="11"
                  >
                    Feature map đa tỷ lệ từ FPN (giả lập)
                  </text>
                </g>
              )}

              {/* Stage 1 — hiện ~6 proposals xung quanh object thật */}
              {stage === 1 && (
                <g>
                  {visibleInstances.flatMap((inst, k) =>
                    Array.from({ length: 3 }, (_, j) => {
                      const offX = (Math.sin(k + j * 1.3) * 20) | 0;
                      const offY = (Math.cos(k + j * 0.9) * 15) | 0;
                      const w = inst.bbox.x2 - inst.bbox.x1;
                      const h = inst.bbox.y2 - inst.bbox.y1;
                      return (
                        <rect
                          key={`${inst.id}-${j}`}
                          x={inst.bbox.x1 + offX}
                          y={inst.bbox.y1 + offY}
                          width={w + (j === 0 ? 0 : j * 8)}
                          height={h + (j === 0 ? 0 : j * 6)}
                          fill="none"
                          stroke="#a855f7"
                          strokeWidth={1.2}
                          strokeDasharray="3,2"
                          opacity={0.55}
                        />
                      );
                    }),
                  )}
                  <text
                    x={CANVAS_W / 2}
                    y={CANVAS_H - 20}
                    textAnchor="middle"
                    fill="#a855f7"
                    fontSize="11"
                  >
                    RPN đề xuất hàng trăm vùng ứng viên (chỉ vẽ vài mẫu)
                  </text>
                </g>
              )}

              {/* Stage 2 — hiện các bbox sau NMS, cắt feature cho mỗi bbox */}
              {stage === 2 && (
                <g>
                  {visibleInstances.map((inst) => (
                    <g key={inst.id}>
                      <rect
                        x={inst.bbox.x1}
                        y={inst.bbox.y1}
                        width={inst.bbox.x2 - inst.bbox.x1}
                        height={inst.bbox.y2 - inst.bbox.y1}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth={2}
                      />
                      {/* Lưới 7×7 tượng trưng RoIAlign resize */}
                      {Array.from({ length: 7 }, (_, ci) => (
                        <line
                          key={`v-${inst.id}-${ci}`}
                          x1={inst.bbox.x1 + ((inst.bbox.x2 - inst.bbox.x1) * ci) / 7}
                          y1={inst.bbox.y1}
                          x2={inst.bbox.x1 + ((inst.bbox.x2 - inst.bbox.x1) * ci) / 7}
                          y2={inst.bbox.y2}
                          stroke="#f59e0b"
                          strokeWidth={0.4}
                          opacity={0.5}
                        />
                      ))}
                      {Array.from({ length: 7 }, (_, ri) => (
                        <line
                          key={`h-${inst.id}-${ri}`}
                          x1={inst.bbox.x1}
                          y1={inst.bbox.y1 + ((inst.bbox.y2 - inst.bbox.y1) * ri) / 7}
                          x2={inst.bbox.x2}
                          y2={inst.bbox.y1 + ((inst.bbox.y2 - inst.bbox.y1) * ri) / 7}
                          stroke="#f59e0b"
                          strokeWidth={0.4}
                          opacity={0.5}
                        />
                      ))}
                    </g>
                  ))}
                  <text
                    x={CANVAS_W / 2}
                    y={CANVAS_H - 20}
                    textAnchor="middle"
                    fill="#f59e0b"
                    fontSize="11"
                  >
                    RoIAlign: cắt + resize feature 7×7 (hoặc 14×14) cho mỗi RoI
                  </text>
                </g>
              )}

              {/* Stage 3 — hiện đầy đủ: mask + bbox + class + score */}
              {stage === 3 && (
                <g>
                  {visibleInstances.map((inst) => (
                    <g key={inst.id}>
                      <polygon
                        points={inst.points}
                        fill={inst.color}
                        opacity={0.5}
                        stroke={inst.color}
                        strokeWidth={1.5}
                      />
                      <polygon
                        points={bboxPoints(inst.bbox)}
                        fill="none"
                        stroke={inst.color}
                        strokeDasharray="4,2"
                        strokeWidth={1.2}
                      />
                      <text
                        x={inst.bbox.x1 + 4}
                        y={inst.bbox.y1 - 4}
                        fill={inst.color}
                        fontSize="11"
                        fontWeight="bold"
                      >
                        {inst.className} {(inst.score * 100).toFixed(0)}%
                      </text>
                    </g>
                  ))}
                  <text
                    x={CANVAS_W / 2}
                    y={CANVAS_H - 20}
                    textAnchor="middle"
                    fill="#22c55e"
                    fontSize="11"
                  >
                    3 heads: class + box + mask 28×28 → upsample về ảnh gốc
                  </text>
                </g>
              )}
            </svg>

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={prevStage}
                disabled={stage === 0}
                className="rounded-md border border-border px-3 py-1 text-xs hover:bg-background/60 disabled:opacity-40"
              >
                ← Stage trước
              </button>
              <button
                type="button"
                onClick={resetStages}
                className="rounded-md border border-border px-3 py-1 text-xs hover:bg-background/60"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={nextStage}
                disabled={stage === PIPELINE_STAGES.length - 1}
                className="rounded-md border border-border px-3 py-1 text-xs hover:bg-background/60 disabled:opacity-40"
              >
                Stage sau →
              </button>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ============================================================
          BƯỚC 7 — THỬ THÁCH TRONG LUỒNG (2)
          Về RoIAlign — chi tiết kỹ thuật quan trọng nhất của
          Mask R-CNN, thường bị bỏ qua khi chỉ đọc lướt.
          ============================================================ */}
      <LessonSection step={7} totalSteps={8} label="Thử thách 2">
        <InlineChallenge
          question="Khi thay RoIPool bằng RoIAlign trong Mask R-CNN, mAP mask tăng đáng kể. Lý do chính là gì?"
          options={[
            "RoIAlign chạy nhanh hơn nhiều lần",
            "RoIAlign bỏ bước làm tròn (quantization) và dùng bilinear interpolation — giữ chính xác pixel, cực quan trọng cho mask",
            "RoIAlign tự động học anchor box",
            "RoIAlign thay thế luôn cho RPN",
          ]}
          correct={1}
          explanation="RoIPool có 2 bước quantization: (1) làm tròn tọa độ RoI về lưới feature map, (2) chia RoI thành bins và làm tròn. Gây lệch pixel — box vẫn OK, mask thì thảm. RoIAlign bỏ quantization, lấy mẫu bilinear 4 điểm mỗi bin. Cải thiện mAP mask ~10% trên COCO."
        />
      </LessonSection>

      {/* ============================================================
          BƯỚC 8 — GIẢI THÍCH SÂU
          Nơi trình bày lý thuyết chính xác, công thức, code ví dụ.
          ============================================================ */}
      <LessonSection step={8} totalSteps={8} label="Giải thích sâu">
        <ExplanationSection>
          <p>
            <strong>Instance Segmentation</strong> kết hợp phát hiện đối tượng và phân đoạn ngữ
            nghĩa ở cấp pixel. Không chỉ tô màu theo danh mục, mô hình còn{" "}
            <strong>phân biệt từng thể hiện riêng lẻ</strong> — điều mà semantic segmentation
            đơn thuần không làm được.
          </p>

          <Callout variant="insight" title="Kiến trúc Mask R-CNN (He et al., 2017)">
            <p className="text-sm">
              Mask R-CNN mở rộng Faster R-CNN bằng 1 nhánh mask song song. Pipeline đầy đủ:
            </p>
            <ol className="list-decimal list-inside space-y-1 mt-2 text-sm">
              <li>
                <strong>Backbone + FPN:</strong>{" "}
                ResNet-50/101 trích xuất feature map đa tỷ lệ (P2–P6), giúp bắt vật nhỏ lẫn lớn
              </li>
              <li>
                <strong>RPN:</strong>{" "}
                Region Proposal Network đề xuất ~1000 ROI từ anchor boxes
              </li>
              <li>
                <strong>RoIAlign:</strong>{" "}
                Cắt feature map cho mỗi ROI (7×7 cho box head, 14×14 cho mask head) —{" "}
                <em>không làm tròn</em>, dùng bilinear interpolation
              </li>
              <li>
                <strong>3 nhánh song song:</strong>{" "}
                Box regression (4 số), Classification (K+1 lớp), và <strong>Binary Mask</strong>{" "}
                K×28×28 — mỗi lớp 1 mask riêng
              </li>
            </ol>
          </Callout>

          <p>
            <strong>Hàm mất mát</strong> Mask R-CNN là tổng trực tiếp của 3 thành phần:
          </p>
          <LaTeX block>
            {"\\mathcal{L} = \\mathcal{L}_{cls} + \\mathcal{L}_{box} + \\mathcal{L}_{mask}"}
          </LaTeX>
          <p className="text-sm text-muted">
            <LaTeX>{"\\mathcal{L}_{mask}"}</LaTeX> là binary cross-entropy trên mask{" "}
            <LaTeX>{"28 \\times 28"}</LaTeX>, chỉ tính cho lớp ground-truth (class-specific
            mask). Chi tiết này rất quan trọng: thay vì softmax trên K kênh, Mask R-CNN dùng{" "}
            <LaTeX>{"K"}</LaTeX> mask sigmoid độc lập, rồi chỉ lấy mask của lớp đúng để tính
            loss. Kết quả: tách biệt mask khỏi classification, tránh cạnh tranh giữa các lớp.
          </p>

          <Callout variant="warning" title="RoIPool vs RoIAlign (điểm mấu chốt)">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <strong>RoIPool:</strong>{" "}
                làm tròn toạ độ hai lần (ROI → lưới feature, và bins trong ROI). Gây sai lệch
                vài pixel. Với bbox thì OK, nhưng mask pixel-level thì thảm.
              </li>
              <li>
                <strong>RoIAlign:</strong>{" "}
                bỏ hoàn toàn quantization. Với mỗi bin, lấy mẫu 4 điểm (hoặc 1 điểm) bằng
                bilinear interpolation. Cải thiện mAP mask ~10% trên COCO.
              </li>
            </ul>
          </Callout>

          <p>
            <strong>Các phương pháp instance segmentation nổi bật:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              <strong>Mask R-CNN (2017):</strong>{" "}
              Two-stage, phổ biến nhất, baseline mạnh cho nghiên cứu và sản phẩm. Thư viện:
              Detectron2, MMDetection.
            </li>
            <li>
              <strong>YOLACT (2019):</strong>{" "}
              One-stage, real-time (~30 FPS). Dùng "prototypes" toàn ảnh + coefficients
              per-detection, mask instance = kết hợp tuyến tính.
            </li>
            <li>
              <strong>SOLOv2 (2020):</strong>{" "}
              Phân loại vị trí grid + kích thước, bỏ anchor. Xuất mask trực tiếp, không cần
              box trước.
            </li>
            <li>
              <strong>SAM (2023):</strong>{" "}
              Segment Anything — foundation model zero-shot. Prompt bằng click/box/text, phân
              đoạn mọi đối tượng không cần fine-tune.
            </li>
            <li>
              <strong>SAM 2 (2024):</strong>{" "}
              Mở rộng SAM cho video, tracking + segmentation với memory attention giữa các
              frame.
            </li>
            <li>
              <strong>Mask2Former (2022):</strong>{" "}
              Kiến trúc thống nhất semantic + instance + panoptic. Transformer query-based,
              SOTA trên nhiều benchmark.
            </li>
          </ul>

          <CollapsibleDetail title="Vì sao mask K×28×28 mà không phải 1 kênh?">
            <p className="text-sm">
              Trong Mask R-CNN, nhánh mask xuất <LaTeX>{"K \\times 28 \\times 28"}</LaTeX>{" "}
              (K lớp). Với mỗi ROI, chỉ <em>mask của lớp đúng</em> được tính loss (chọn theo
              GT class trong training, theo predicted class khi inference). Cách này tốt hơn
              1 kênh softmax vì:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-1 text-sm">
              <li>Mỗi lớp có mask riêng, không "tranh chỗ" với lớp khác.</li>
              <li>
                Decouple classification và segmentation — classification đã có lớp head riêng.
              </li>
              <li>
                Empirically cho mAP cao hơn (He et al. chứng minh trong ablation study).
              </li>
            </ul>
            <p className="text-sm mt-1">
              Một cách nhìn khác: nhánh mask trở thành "vẽ hình dáng prototype cho từng lớp"
              — nhánh class chỉ cần chọn prototype nào dùng.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="So sánh chi phí inference: Mask R-CNN vs YOLACT vs SAM">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <strong>Mask R-CNN (ResNet-50-FPN):</strong>{" "}
                ~5-7 FPS trên V100. Two-stage, mask head chạy sau box head nên không thể song
                song hóa triệt để.
              </li>
              <li>
                <strong>YOLACT:</strong>{" "}
                ~30 FPS. Prototype branch chạy 1 lần cho cả ảnh; per-detection chỉ cần nhân
                coefficients (rất nhẹ).
              </li>
              <li>
                <strong>SAM (ViT-H):</strong>{" "}
                Image encoder ~450ms/ảnh, prompt decoder ~10ms/prompt. Trade-off: encoder nặng
                nhưng có thể cache; decoder siêu nhẹ cho nhiều prompt.
              </li>
              <li>
                <strong>SAM 2:</strong>{" "}
                ~44 FPS cho image inference, real-time cho video nhờ memory attention + Hiera
                backbone.
              </li>
            </ul>
          </CollapsibleDetail>

          <Callout variant="warning" title="Ứng dụng thực tế">
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Robot công nghiệp:</strong>{" "}
                Gắp đồ vật trên dây chuyền — cần mask chính xác từng vật để tính lực kẹp.
              </li>
              <li>
                <strong>Thương mại điện tử:</strong>{" "}
                Tự động tách nền sản phẩm trên Shopee, Tiki, Lazada.
              </li>
              <li>
                <strong>Y tế:</strong>{" "}
                Đếm và đo từng tế bào riêng biệt trong ảnh hiển vi; tách từng khối u trong MRI.
              </li>
              <li>
                <strong>Nông nghiệp:</strong>{" "}
                Đếm từng quả trên cây từ ảnh drone, ước lượng sản lượng.
              </li>
              <li>
                <strong>Xe tự lái:</strong>{" "}
                Phân biệt từng người đi bộ, từng xe — cần thiết để dự đoán quỹ đạo riêng cho
                từng đối tượng.
              </li>
              <li>
                <strong>AR/VR:</strong>{" "}
                Tách nền video thời gian thực để thay background (Meet, Zoom) — thường dùng
                mô hình nhẹ như MediaPipe SelfieSegmentation nhưng về bản chất vẫn là instance
                seg. với 1 lớp.
              </li>
            </ul>
          </Callout>

          {/* CODE BLOCK 1 — Detectron2 */}
          <p>
            <strong>Code ví dụ 1 — Detectron2 (Facebook AI Research):</strong>{" "}
            Mask R-CNN production-ready chỉ vài dòng.
          </p>
          <CodeBlock language="python" title="Instance Segmentation với Detectron2">
{`# pip install detectron2 (xem hướng dẫn chính thức cho CUDA version)
import cv2
import numpy as np
from detectron2 import model_zoo
from detectron2.config import get_cfg
from detectron2.engine import DefaultPredictor
from detectron2.utils.visualizer import Visualizer, ColorMode
from detectron2.data import MetadataCatalog

# 1) Cấu hình Mask R-CNN + ResNet-50-FPN đã train trên COCO
cfg = get_cfg()
cfg.merge_from_file(model_zoo.get_config_file(
    "COCO-InstanceSegmentation/mask_rcnn_R_50_FPN_3x.yaml"
))
cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = 0.5  # ngưỡng confidence
cfg.MODEL.WEIGHTS = model_zoo.get_checkpoint_url(
    "COCO-InstanceSegmentation/mask_rcnn_R_50_FPN_3x.yaml"
)
# cfg.MODEL.DEVICE = "cpu"  # bỏ comment nếu không có GPU

predictor = DefaultPredictor(cfg)

# 2) Đọc ảnh và chạy inference
image = cv2.imread("duong_pho.jpg")
outputs = predictor(image)

# 3) Các trường quan trọng trong outputs["instances"]
instances = outputs["instances"].to("cpu")
print(f"Số instance phát hiện: {len(instances)}")
print(f"Class IDs: {instances.pred_classes.tolist()}")
print(f"Scores: {instances.scores.tolist()}")
print(f"Boxes shape: {instances.pred_boxes.tensor.shape}")   # (N, 4) xyxy
print(f"Masks shape: {instances.pred_masks.shape}")           # (N, H, W) bool

# 4) Visualize: mỗi instance một màu riêng
metadata = MetadataCatalog.get(cfg.DATASETS.TRAIN[0])
v = Visualizer(
    image[:, :, ::-1],             # BGR → RGB
    metadata=metadata,
    scale=1.0,
    instance_mode=ColorMode.IMAGE, # màu riêng cho từng instance
)
vis = v.draw_instance_predictions(instances)
cv2.imwrite("ket_qua.jpg", vis.get_image()[:, :, ::-1])

# 5) Trích xuất mask nhị phân cho instance đầu tiên
if len(instances) > 0:
    mask_0 = instances.pred_masks[0].numpy()   # bool array (H, W)
    # Ví dụ: tính diện tích mask, lấy contour, apply vào ảnh gốc
    area_px = int(mask_0.sum())
    print(f"Instance #0: diện tích {area_px} pixel")
`}
          </CodeBlock>

          {/* CODE BLOCK 2 — SAM prompt-based */}
          <p>
            <strong>Code ví dụ 2 — SAM (Segment Anything):</strong>{" "}
            Zero-shot segmentation chỉ cần 1 click.
          </p>
          <CodeBlock language="python" title="Instance Segmentation với SAM">
{`# pip install git+https://github.com/facebookresearch/segment-anything.git
import cv2
import numpy as np
from segment_anything import sam_model_registry, SamPredictor

# 1) Load SAM ViT-H (checkpoint ~2.4GB)
sam = sam_model_registry["vit_h"](checkpoint="sam_vit_h_4b8939.pth")
sam.to("cuda")  # hoặc "cpu"
predictor = SamPredictor(sam)

# 2) Set image (chạy image encoder 1 lần, cache feature)
image = cv2.imread("duong_pho.jpg")
image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
predictor.set_image(image_rgb)

# 3) Prompt 1: click vào tâm xe máy
input_point = np.array([[200, 300]])     # (x, y)
input_label = np.array([1])              # 1 = foreground, 0 = background

masks, scores, logits = predictor.predict(
    point_coords=input_point,
    point_labels=input_label,
    multimask_output=True,               # trả về 3 mask ứng viên
)

best_idx = int(np.argmax(scores))
best_mask = masks[best_idx]              # (H, W) bool
print(f"Mask tốt nhất: score={scores[best_idx]:.3f}")

# 4) Prompt 2: bounding box (khi bạn đã có box từ model khác)
input_box = np.array([150, 200, 350, 400])   # xyxy
masks_from_box, _, _ = predictor.predict(
    box=input_box,
    multimask_output=False,
)

# 5) Kết hợp nhiều click (refinement)
input_point = np.array([[200, 300], [220, 310]])
input_label = np.array([1, 1])               # cả 2 là foreground
refined_masks, refined_scores, _ = predictor.predict(
    point_coords=input_point,
    point_labels=input_label,
    multimask_output=False,
)

# 6) Automatic mask generation — phân đoạn MỌI đối tượng trong ảnh
from segment_anything import SamAutomaticMaskGenerator
mask_gen = SamAutomaticMaskGenerator(sam)
auto_masks = mask_gen.generate(image_rgb)
print(f"SAM tìm được {len(auto_masks)} mask tự động")
for i, m in enumerate(auto_masks[:5]):
    print(f"  #{i}: area={m['area']}, score={m['predicted_iou']:.2f}")
`}
          </CodeBlock>

          <p>
            <strong>Chọn phương pháp nào?</strong>{" "}
            Quy tắc nhanh:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              <strong>Có nhãn train + cần độ chính xác cao:</strong>{" "}
              Mask R-CNN hoặc Mask2Former với Detectron2/MMDetection.
            </li>
            <li>
              <strong>Cần real-time (&gt;20 FPS):</strong>{" "}
              YOLACT, YOLOv8-seg, hoặc mô hình một-stage khác.
            </li>
            <li>
              <strong>Không có nhãn / domain mới / zero-shot:</strong>{" "}
              SAM hoặc SAM 2.
            </li>
            <li>
              <strong>Cần cả semantic + instance (mọi pixel có nhãn):</strong>{" "}
              Panoptic Segmentation với Mask2Former hoặc Panoptic FPN.
            </li>
          </ul>

          <p className="text-sm">
            Các khái niệm liên quan chặt chẽ:{" "}
            <TopicLink slug="semantic-segmentation">Semantic Segmentation</TopicLink>,{" "}
            <TopicLink slug="object-detection">Object Detection</TopicLink>,{" "}
            <TopicLink slug="panoptic-segmentation">Panoptic Segmentation</TopicLink>.
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ============================================================
          BƯỚC 9 — TÓM TẮT (MiniSummary 6 điểm)
          ============================================================ */}
      <LessonSection step={8} totalSteps={8} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ về Instance Segmentation"
          points={[
            "Instance Segmentation = Object Detection + Semantic Segmentation: mỗi đối tượng có bounding box + nhãn + MASK PIXEL RIÊNG.",
            "Khác Semantic (cùng lớp = cùng màu), Instance tô MÀU RIÊNG cho từng thể hiện — phân biệt người #1, người #2 cùng lớp.",
            "Mask R-CNN = Faster R-CNN + nhánh mask K×28×28 song song, dùng RoIAlign thay RoIPool để giữ chính xác pixel.",
            "Loss = L_cls + L_box + L_mask; L_mask chỉ tính cho lớp GT (class-specific sigmoid, không cạnh tranh giữa lớp).",
            "YOLACT/SOLOv2 cho real-time; SAM/SAM2 zero-shot qua prompt (click, box, text); Mask2Former thống nhất semantic+instance+panoptic.",
            "Ứng dụng: robot gắp đồ, xe tự lái, đếm tế bào, tách nền sản phẩm e-commerce, AR/VR thay background.",
          ]}
        />
      </LessonSection>

      {/* ============================================================
          BƯỚC 10 — QUIZ CUỐI BÀI (8 câu hỏi)
          ============================================================ */}
      <LessonSection step={8} totalSteps={8} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
