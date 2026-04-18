"use client";

// =============================================================================
// TOPIC — K-Nearest Neighbors (KNN)
// =============================================================================
// Mục tiêu: người học hiểu được thuật toán KNN chỉ sau vài phút tương tác với
// một demo trực quan. Sau phần demo, họ phải nắm được:
//   (1) KNN phân loại bằng cách "hỏi ý kiến" K hàng xóm gần nhất.
//   (2) K nhỏ → nhạy cảm nhiễu, biên quyết định "lởm chởm".
//   (3) K lớn → mượt mà nhưng có thể bỏ sót cấu trúc nhỏ.
//   (4) KNN là thuật toán "lười" — không train, chỉ nhớ dữ liệu.
//   (5) Chuẩn hóa đặc trưng rất quan trọng vì KNN dựa vào khoảng cách.
//   (6) Độ phức tạp dự đoán O(N·d) dễ trở thành nút cổ chai khi N lớn.
// =============================================================================

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  Callout,
  CollapsibleDetail,
  MiniSummary,
  CodeBlock,
  LessonSection,
  LaTeX,
  TopicLink,
  ProgressSteps,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

// ---------------------------------------------------------------------------
// METADATA
// ---------------------------------------------------------------------------

export const metadata: TopicMeta = {
  slug: "knn",
  title: "K-Nearest Neighbors",
  titleVi: "K láng giềng gần nhất",
  description:
    "Thuật toán phân loại 'lười': dự đoán nhãn bằng cách bỏ phiếu theo K điểm gần nhất trong tập huấn luyện.",
  category: "classic-ml",
  tags: ["classification", "supervised-learning", "distance", "lazy-learning"],
  difficulty: "beginner",
  relatedSlugs: ["k-means", "svm", "logistic-regression", "decision-trees"],
  vizType: "interactive",
};

// ---------------------------------------------------------------------------
// KIỂU DỮ LIỆU & TIỆN ÍCH HÌNH HỌC
// ---------------------------------------------------------------------------

type ClassId = "A" | "B" | "C";

type LabeledPoint = {
  x: number;
  y: number;
  cls: ClassId;
};

type DistancedPoint = LabeledPoint & { d: number };

// Khoảng cách Euclid 2 chiều — KNN cơ bản nhất dùng công thức này.
// Các biến thể (Manhattan, Minkowski, Cosine) chỉ thay đổi phép tính này.
function euclidean(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

// Bỏ phiếu đa số — trả về nhãn xuất hiện nhiều nhất trong mảng.
// Ties (hòa phiếu) xử lý bằng thứ tự khai báo class; thực tế nên xử lý kỹ hơn.
function majorityVote(labels: ClassId[]): ClassId {
  const counts: Record<ClassId, number> = { A: 0, B: 0, C: 0 };
  for (const l of labels) counts[l] += 1;
  let best: ClassId = "A";
  let bestCount = -1;
  (Object.keys(counts) as ClassId[]).forEach((k) => {
    if (counts[k] > bestCount) {
      best = k;
      bestCount = counts[k];
    }
  });
  return best;
}

// ---------------------------------------------------------------------------
// BỘ DỮ LIỆU MINH HỌA — 40 điểm chia làm 3 lớp
// ---------------------------------------------------------------------------
// Toạ độ trong khoảng [0, 500] × [0, 400]. Ba cụm được thiết kế để tương đối
// tách biệt nhưng có vài điểm chồng lấn gần biên — tạo cơ hội thấy hiệu ứng
// của K khác nhau.

const DATASET: LabeledPoint[] = [
  // Lớp A — cụm trên-trái
  { x: 80, y: 80, cls: "A" },
  { x: 110, y: 70, cls: "A" },
  { x: 90, y: 120, cls: "A" },
  { x: 130, y: 100, cls: "A" },
  { x: 70, y: 150, cls: "A" },
  { x: 140, y: 140, cls: "A" },
  { x: 100, y: 180, cls: "A" },
  { x: 160, y: 80, cls: "A" },
  { x: 180, y: 130, cls: "A" },
  { x: 120, y: 60, cls: "A" },
  { x: 170, y: 170, cls: "A" },
  { x: 200, y: 110, cls: "A" },
  { x: 60, y: 100, cls: "A" },
  { x: 150, y: 200, cls: "A" },
  // Lớp B — cụm trên-phải
  { x: 340, y: 70, cls: "B" },
  { x: 370, y: 110, cls: "B" },
  { x: 400, y: 80, cls: "B" },
  { x: 430, y: 130, cls: "B" },
  { x: 360, y: 60, cls: "B" },
  { x: 420, y: 170, cls: "B" },
  { x: 380, y: 200, cls: "B" },
  { x: 440, y: 90, cls: "B" },
  { x: 310, y: 140, cls: "B" },
  { x: 390, y: 150, cls: "B" },
  { x: 350, y: 190, cls: "B" },
  { x: 410, y: 220, cls: "B" },
  { x: 460, y: 160, cls: "B" },
  // Lớp C — cụm dưới-giữa
  { x: 220, y: 300, cls: "C" },
  { x: 250, y: 280, cls: "C" },
  { x: 280, y: 320, cls: "C" },
  { x: 200, y: 340, cls: "C" },
  { x: 260, y: 360, cls: "C" },
  { x: 300, y: 290, cls: "C" },
  { x: 230, y: 370, cls: "C" },
  { x: 180, y: 310, cls: "C" },
  { x: 310, y: 340, cls: "C" },
  { x: 270, y: 310, cls: "C" },
  { x: 330, y: 360, cls: "C" },
  { x: 210, y: 260, cls: "C" },
  { x: 290, y: 250, cls: "C" },
];

// Bảng màu cho 3 lớp — chọn theo CSS variable của design system để đồng bộ
// với phần còn lại của trang.
const CLASS_COLOR: Record<ClassId, string> = {
  A: "#ef4444", // đỏ
  B: "#3b82f6", // xanh dương
  C: "#10b981", // xanh lục
};

const CLASS_FILL_SOFT: Record<ClassId, string> = {
  A: "rgba(239, 68, 68, 0.18)",
  B: "rgba(59, 130, 246, 0.18)",
  C: "rgba(16, 185, 129, 0.18)",
};

const CLASS_LABEL: Record<ClassId, string> = {
  A: "Lớp A (đỏ)",
  B: "Lớp B (xanh dương)",
  C: "Lớp C (xanh lục)",
};

// Kích thước canvas visualization.
const W = 500;
const H = 400;

// Độ phân giải lưới cho decision boundary. Giá trị càng nhỏ → boundary mượt
// hơn nhưng render chậm. 16 là cân bằng tốt cho demo trong trình duyệt.
const GRID_STEP = 16;

// ---------------------------------------------------------------------------
// TIỆN ÍCH KNN
// ---------------------------------------------------------------------------

// Hàm dự đoán nhãn cho một điểm (qx, qy) dựa trên K hàng xóm gần nhất.
// Trả về cả nhãn và danh sách hàng xóm để hiển thị.
function knnPredict(
  qx: number,
  qy: number,
  k: number,
  dataset: LabeledPoint[],
): { label: ClassId; neighbors: DistancedPoint[] } {
  const scored: DistancedPoint[] = dataset.map((p) => ({
    ...p,
    d: euclidean(qx, qy, p.x, p.y),
  }));
  scored.sort((a, b) => a.d - b.d);
  const top = scored.slice(0, k);
  const label = majorityVote(top.map((p) => p.cls));
  return { label, neighbors: top };
}

// Trả về nhãn thôi — dùng khi tính decision boundary, không cần neighbors.
function knnLabelOnly(
  qx: number,
  qy: number,
  k: number,
  dataset: LabeledPoint[],
): ClassId {
  return knnPredict(qx, qy, k, dataset).label;
}

// ---------------------------------------------------------------------------
// QUIZ
// ---------------------------------------------------------------------------

const QUIZ: QuizQuestion[] = [
  {
    question:
      "Khi tăng K từ 1 lên 15 trong KNN, biên quyết định (decision boundary) thường thay đổi như thế nào?",
    options: [
      "Càng lởm chởm hơn vì càng nhiều điểm tham gia bỏ phiếu.",
      "Càng mượt hơn và ít nhạy cảm với nhiễu.",
      "Không thay đổi — K chỉ ảnh hưởng tốc độ tính.",
      "Luôn dịch về phía lớp đa số của toàn bộ tập huấn luyện.",
    ],
    correct: 1,
    explanation:
      "K lớn → mỗi dự đoán bị ảnh hưởng bởi nhiều điểm hơn, cho nên nhiễu cục bộ bị trung hòa. Hệ quả: biên quyết định mượt hơn, bias tăng nhưng variance giảm.",
  },
  {
    question:
      "KNN được gọi là 'lazy learner' (thuật toán lười) vì lý do nào?",
    options: [
      "Vì nó chỉ chạy được trên CPU, không tận dụng GPU.",
      "Vì độ chính xác thấp hơn các thuật toán khác.",
      "Vì không có giai đoạn huấn luyện — model 'chỉ nhớ' dữ liệu, mọi tính toán diễn ra lúc dự đoán.",
      "Vì nó từ chối học các đặc trưng phi tuyến.",
    ],
    correct: 2,
    explanation:
      "KNN không học tham số. Dự đoán được thực hiện bằng cách tìm K điểm gần nhất trong tập train tại thời điểm hỏi → chi phí dồn hết vào lúc inference.",
  },
  {
    question:
      "Trong KNN, điều gì xảy ra nếu bạn KHÔNG chuẩn hóa đặc trưng trước khi huấn luyện?",
    options: [
      "Không sao, KNN tự co giãn thang đo đặc trưng.",
      "Đặc trưng có thang giá trị lớn (ví dụ lương theo VND) sẽ chi phối khoảng cách, đặc trưng khác bị lấn át.",
      "Mô hình sẽ train lâu hơn nhưng kết quả không đổi.",
      "Chỉ số K tự động giảm đi một nửa để bù lại.",
    ],
    correct: 1,
    explanation:
      "Khoảng cách Euclid là tổng bình phương. Một đặc trưng trong khoảng [0, 10^8] sẽ nuốt chửng đặc trưng trong khoảng [0, 1]. Luôn dùng StandardScaler/MinMaxScaler trước.",
  },
  {
    question:
      "Một điểm truy vấn nằm ngay trên biên giữa lớp A và B. Với K=1, nó được dự đoán là A. Với K=5 nó thành B. Khả năng lớn nhất là gì?",
    options: [
      "Dataset bị lỗi — không thể nào K=5 cho kết quả khác K=1.",
      "Điểm gần nhất là A nhưng 4 trong 5 điểm gần nhất tiếp theo thuộc B; đa số vẫn là B.",
      "KNN có bug — hai giá trị K phải luôn đồng ý với nhau.",
      "Phải chuẩn hóa lại dữ liệu bằng z-score mới có kết quả đúng.",
    ],
    correct: 1,
    explanation:
      "KNN với K=1 chỉ xét hàng xóm gần nhất duy nhất. Khi K tăng, quy luật đa số có thể đảo kết quả — điều này đặc biệt hay xảy ra tại vùng biên.",
  },
  {
    question:
      "Ứng với tập huấn luyện có N điểm trong không gian d chiều, độ phức tạp thời gian để KNN dự đoán MỘT điểm truy vấn (không dùng cấu trúc dữ liệu đặc biệt) là bao nhiêu?",
    options: [
      "O(1) — chỉ cần tra cứu.",
      "O(log N).",
      "O(N · d) — tính khoảng cách đến từng điểm trong tập train.",
      "O(N^2 · d).",
    ],
    correct: 2,
    explanation:
      "Mỗi điểm huấn luyện cần O(d) để tính khoảng cách; với N điểm tổng chi phí là O(N·d). Có thể giảm xuống O(log N) bằng KD-tree trong không gian ít chiều, nhưng sẽ xuống cấp khi d lớn ('curse of dimensionality').",
  },
  {
    question:
      "Bạn có 3 lớp và chọn K=4. Trong 4 hàng xóm gần nhất, có 2 lớp A, 1 lớp B, 1 lớp C. Chiến lược phá hòa phổ biến nhất là gì?",
    options: [
      "Trả về nhãn của điểm gần nhất trong số các lớp hòa phiếu.",
      "Luôn chọn lớp có tên đứng đầu theo thứ tự chữ cái.",
      "Báo lỗi và yêu cầu người dùng đổi K.",
      "Chia đôi xác suất giữa A và B.",
    ],
    correct: 0,
    explanation:
      "Đây không phải trường hợp hòa phiếu — A chiếm đa số tuyệt đối (2/4). Nhưng nếu thực sự hòa (ví dụ 2 lớp đều được 2 phiếu), chiến lược phổ biến là giảm K hoặc chọn lớp có tổng khoảng cách nhỏ hơn.",
  },
  {
    question:
      "KNN phù hợp nhất với bộ dữ liệu nào sau đây?",
    options: [
      "Tập gồm 10 triệu ảnh 224×224 cần phân loại real-time.",
      "Tập nhỏ đến trung bình (vài nghìn điểm), đặc trưng đã chuẩn hóa, có ý nghĩa khoảng cách.",
      "Tập văn bản raw chưa được vector hóa.",
      "Tập có hàng trăm đặc trưng nhị phân và phân bố rất thưa.",
    ],
    correct: 1,
    explanation:
      "KNN sáng giá khi: (1) N vừa phải để inference đủ nhanh, (2) đặc trưng có nghĩa hình học, (3) đã chuẩn hóa. Với dữ liệu nhiều chiều, thưa, hoặc raw, các thuật toán khác thường tốt hơn.",
  },
  {
    question:
      "Nên chọn K theo quy tắc nào trong thực hành?",
    options: [
      "Luôn K=1 để mô hình 'sát' dữ liệu nhất.",
      "K=N (toàn bộ tập train) vì càng nhiều hàng xóm càng tốt.",
      "K ≈ √N và điều chỉnh bằng cross-validation; ưu tiên K lẻ để tránh hòa phiếu khi có 2 lớp.",
      "K phải là số nguyên tố để tránh trùng lặp.",
    ],
    correct: 2,
    explanation:
      "K=1 quá nhạy nhiễu (overfit), K=N suy biến thành 'đoán lớp đa số'. Khởi điểm tốt là K≈√N và tinh chỉnh bằng k-fold cross-validation; dùng K lẻ khi nhị phân để giảm hòa phiếu.",
  },
];

// Labels cho ProgressSteps — hiển thị lộ trình 7 bước.
const STEP_LABELS = [
  "Dự đoán",
  "Ẩn dụ",
  "Trực quan",
  "Aha",
  "Thử thách",
  "Lý thuyết",
  "Ôn tập",
];

// ---------------------------------------------------------------------------
// COMPONENT CON — Canvas tương tác KNN
// ---------------------------------------------------------------------------

type DemoProps = {
  k: number;
  setK: (n: number) => void;
  query: { x: number; y: number };
  setQuery: (p: { x: number; y: number }) => void;
  showBoundary: boolean;
  setShowBoundary: (b: boolean) => void;
};

function KnnDemo({
  k,
  setK,
  query,
  setQuery,
  showBoundary,
  setShowBoundary,
}: DemoProps) {
  // Dự đoán nhãn cho điểm truy vấn hiện tại.
  const prediction = useMemo(
    () => knnPredict(query.x, query.y, k, DATASET),
    [query, k],
  );

  // Bán kính đường tròn bao K hàng xóm — lấy khoảng cách hàng xóm xa nhất.
  const radius = useMemo(() => {
    const last = prediction.neighbors[prediction.neighbors.length - 1];
    return last ? last.d : 0;
  }, [prediction.neighbors]);

  // Tính decision boundary: với mỗi ô lưới, tính nhãn KNN và tô màu mờ.
  // useMemo để không tính lại khi query di chuyển — boundary chỉ phụ thuộc K.
  const gridCells = useMemo(() => {
    if (!showBoundary) return [];
    const cells: Array<{ x: number; y: number; cls: ClassId }> = [];
    for (let x = 0; x < W; x += GRID_STEP) {
      for (let y = 0; y < H; y += GRID_STEP) {
        const cx = x + GRID_STEP / 2;
        const cy = y + GRID_STEP / 2;
        cells.push({ x, y, cls: knnLabelOnly(cx, cy, k, DATASET) });
      }
    }
    return cells;
  }, [k, showBoundary]);

  // Đếm phiếu trong K hàng xóm để hiển thị chi tiết.
  const voteBreakdown = useMemo(() => {
    const c: Record<ClassId, number> = { A: 0, B: 0, C: 0 };
    prediction.neighbors.forEach((n) => {
      c[n.cls] += 1;
    });
    return c;
  }, [prediction.neighbors]);

  // Xử lý click — đặt điểm truy vấn mới tại vị trí chuột.
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      // Quy đổi toạ độ client sang toạ độ viewBox (W × H).
      const nx = ((e.clientX - rect.left) / rect.width) * W;
      const ny = ((e.clientY - rect.top) / rect.height) * H;
      setQuery({
        x: Math.max(4, Math.min(W - 4, nx)),
        y: Math.max(4, Math.min(H - 4, ny)),
      });
    },
    [setQuery],
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Thanh điều khiển */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-surface/50 p-4">
        <div className="flex items-center gap-3">
          <label
            htmlFor="knn-k"
            className="text-sm font-medium text-foreground whitespace-nowrap"
          >
            K = <span className="font-mono text-base">{k}</span>
          </label>
          <input
            id="knn-k"
            type="range"
            min={1}
            max={15}
            step={1}
            value={k}
            onChange={(e) => setK(Number(e.target.value))}
            className="w-48 accent-primary"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={showBoundary}
            onChange={(e) => setShowBoundary(e.target.checked)}
            className="accent-primary"
          />
          Hiển thị biên quyết định
        </label>
        <div className="ml-auto text-sm text-muted">
          Click vào canvas để đặt điểm truy vấn
        </div>
      </div>

      {/* Canvas SVG */}
      <div className="w-full overflow-hidden rounded-lg border border-border bg-background">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full cursor-crosshair touch-none"
          onClick={handleCanvasClick}
          role="img"
          aria-label={`Canvas KNN — K=${k}, dự đoán lớp ${prediction.label} (A:${voteBreakdown.A} B:${voteBreakdown.B} C:${voteBreakdown.C}). Click để đặt điểm truy vấn.`}
        >
          <title>KNN với K={k} — dự đoán lớp {prediction.label}. Phiếu: A {voteBreakdown.A}, B {voteBreakdown.B}, C {voteBreakdown.C}</title>
          {/* Decision boundary — nền mờ */}
          {showBoundary &&
            gridCells.map((cell, i) => (
              <rect
                key={`cell-${i}`}
                x={cell.x}
                y={cell.y}
                width={GRID_STEP}
                height={GRID_STEP}
                fill={CLASS_FILL_SOFT[cell.cls]}
                stroke="none"
              />
            ))}

          {/* Lưới mờ — giúp mắt định vị */}
          {Array.from({ length: Math.floor(W / 50) + 1 }).map((_, i) => (
            <line
              key={`vx-${i}`}
              x1={i * 50}
              y1={0}
              x2={i * 50}
              y2={H}
              stroke="currentColor"
              strokeOpacity="0.05"
            />
          ))}
          {Array.from({ length: Math.floor(H / 50) + 1 }).map((_, i) => (
            <line
              key={`hy-${i}`}
              x1={0}
              y1={i * 50}
              x2={W}
              y2={i * 50}
              stroke="currentColor"
              strokeOpacity="0.05"
            />
          ))}

          {/* Đường tròn bao K hàng xóm */}
          <motion.circle
            cx={query.x}
            cy={query.y}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.4"
            strokeWidth={1.5}
            strokeDasharray="6 4"
            initial={false}
            animate={{ cx: query.x, cy: query.y, r: radius }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
          />

          {/* Đường nối từ query đến mỗi hàng xóm */}
          {prediction.neighbors.map((n, idx) => (
            <line
              key={`nb-line-${idx}`}
              x1={query.x}
              y1={query.y}
              x2={n.x}
              y2={n.y}
              stroke={CLASS_COLOR[n.cls]}
              strokeOpacity="0.5"
              strokeWidth={1}
            />
          ))}

          {/* Tất cả điểm trong dataset */}
          {DATASET.map((p, idx) => {
            const isNeighbor = prediction.neighbors.some(
              (n) => n.x === p.x && n.y === p.y,
            );
            return (
              <circle
                key={`pt-${idx}`}
                cx={p.x}
                cy={p.y}
                r={isNeighbor ? 8 : 6}
                fill={CLASS_COLOR[p.cls]}
                stroke={isNeighbor ? "#fff" : "none"}
                strokeWidth={isNeighbor ? 2 : 0}
                opacity={isNeighbor ? 1 : 0.85}
              />
            );
          })}

          {/* Điểm truy vấn */}
          <motion.g
            animate={{ x: 0, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <circle
              cx={query.x}
              cy={query.y}
              r={11}
              fill={CLASS_COLOR[prediction.label]}
              stroke="#fff"
              strokeWidth={3}
            />
            <circle
              cx={query.x}
              cy={query.y}
              r={4}
              fill="#fff"
            />
          </motion.g>
        </svg>
      </div>

      {/* Panel kết quả */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface/50 p-3">
          <div className="text-xs uppercase tracking-wide text-muted">
            Dự đoán
          </div>
          <div
            className="mt-1 text-lg font-semibold"
            style={{ color: CLASS_COLOR[prediction.label] }}
          >
            {CLASS_LABEL[prediction.label]}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface/50 p-3">
          <div className="text-xs uppercase tracking-wide text-muted">
            Phiếu bầu ({k} hàng xóm)
          </div>
          <div className="mt-1 flex gap-3 text-sm">
            <span style={{ color: CLASS_COLOR.A }}>
              A: <strong>{voteBreakdown.A}</strong>
            </span>
            <span style={{ color: CLASS_COLOR.B }}>
              B: <strong>{voteBreakdown.B}</strong>
            </span>
            <span style={{ color: CLASS_COLOR.C }}>
              C: <strong>{voteBreakdown.C}</strong>
            </span>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface/50 p-3">
          <div className="text-xs uppercase tracking-wide text-muted">
            Toạ độ truy vấn
          </div>
          <div className="mt-1 font-mono text-sm">
            ({Math.round(query.x)}, {Math.round(query.y)})
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------

export default function KnnTopic() {
  // State cho canvas demo.
  const [k, setK] = useState<number>(3);
  const [query, setQuery] = useState<{ x: number; y: number }>({
    x: 260,
    y: 200,
  });
  const [showBoundary, setShowBoundary] = useState<boolean>(false);

  return (
    <>
      {/* =================================================================
          BƯỚC 1 — HOOK / DỰ ĐOÁN
          ================================================================= */}
      <ProgressSteps current={1} total={7} labels={STEP_LABELS} />

      <PredictionGate
        question="Bạn có một điểm mới cần phân loại. Nếu hỏi 3 hàng xóm gần nhất và nhận được 2 phiếu 'mèo', 1 phiếu 'chó', KNN sẽ nói điểm này là gì?"
        options={[
          "Chó — vì đó là lớp thiểu số nên đáng chú ý hơn.",
          "Mèo — lấy theo đa số phiếu bầu.",
          "Không xác định — 3 chưa đủ để quyết định.",
          "Tính trung bình nhãn — ra một thứ nằm giữa chó và mèo.",
        ]}
        correct={1}
        explanation="KNN phân loại bằng bỏ phiếu đa số của K hàng xóm gần nhất. 2 > 1 nên kết quả là 'mèo'. Đơn giản đến không ngờ — và đó chính là vẻ đẹp của thuật toán này."
      >
        <p className="mt-2 text-sm text-muted">
          KNN là một trong những thuật toán phân loại trực giác nhất: muốn biết
          một điểm thuộc lớp gì, hỏi các hàng xóm xung quanh nó.
        </p>
      </PredictionGate>

      {/* =================================================================
          BƯỚC 2 — ẨN DỤ THỰC TẾ
          ================================================================= */}
      <LessonSection label="Ẩn dụ: chọn quán ăn ở khu phố lạ" step={2} totalSteps={7}>
        <p>
          Hãy tưởng tượng bạn vừa chuyển đến một khu phố mới và muốn biết con
          đường bạn đang đứng thuộc <strong>khu nào</strong>: khu văn phòng, khu
          chợ, hay khu dân cư? Bạn nhìn quanh 5 toà nhà gần nhất.
        </p>
        <p>
          Nếu 3/5 là cao ốc văn phòng, bạn kết luận đây là{" "}
          <strong>khu văn phòng</strong> — kể cả khi 2 toà kia là nhà ở. Đó
          chính xác là cách <strong>KNN</strong> làm việc: "bạn là ai, cho tôi
          xem hàng xóm của bạn."
        </p>
        <p>
          Điểm mấu chốt là khái niệm <em>"hàng xóm gần"</em>. Trong không gian
          2D, "gần" là khoảng cách hình học. Trong không gian đặc trưng của
          ML, "gần" là khoảng cách theo một metric (thường là Euclid hoặc
          Cosine) giữa các vector đặc trưng.
        </p>
        <Callout variant="insight" title="KNN không cần học">
          Khác với hầu hết thuật toán ML, KNN không có bước <em>train</em> theo
          nghĩa cổ điển. Toàn bộ "model" của KNN chính là <strong>tập dữ liệu
          huấn luyện được lưu lại</strong>. Mọi phép tính được dồn vào lúc dự
          đoán — đó là lý do KNN được gọi là "lazy learner".
        </Callout>
      </LessonSection>

      {/* =================================================================
          BƯỚC 3 — TRỰC QUAN HÓA TƯƠNG TÁC
          ================================================================= */}
      <VisualizationSection topicSlug={metadata.slug}>
        <LessonSection
          label="Chơi với KNN: K, hàng xóm, và biên quyết định"
          step={3}
          totalSteps={7}
        >
          <p>
            Canvas dưới đây có 40 điểm thuộc 3 lớp. <strong>Click vào bất kỳ
            đâu</strong> để đặt một điểm truy vấn (chấm trắng viền). Slider điều
            chỉnh K từ 1 đến 15. Bật toggle "Hiển thị biên quyết định" để thấy
            toàn bộ bản đồ phân loại.
          </p>

          <KnnDemo
            k={k}
            setK={setK}
            query={query}
            setQuery={setQuery}
            showBoundary={showBoundary}
            setShowBoundary={setShowBoundary}
          />

          <Callout variant="tip" title="Gợi ý khám phá">
            <ul className="list-disc list-inside space-y-1">
              <li>
                Bật boundary và kéo slider K. Quan sát biên chuyển từ{" "}
                <strong>lởm chởm</strong> (K=1) sang <strong>mượt mà</strong>{" "}
                (K=15).
              </li>
              <li>
                Đặt điểm truy vấn vào đúng khoảng giữa hai cụm. Đổi K và xem
                dự đoán có đảo không.
              </li>
              <li>
                Thử click ra ngoài các cụm (ví dụ sát mép canvas). K lớn buộc
                KNN "với tay" rất xa — điều này hợp lý không?
              </li>
            </ul>
          </Callout>
        </LessonSection>
      </VisualizationSection>

      {/* =================================================================
          BƯỚC 4 — KHOẢNH KHẮC AHA
          ================================================================= */}
      <AhaMoment>
        <strong>KNN</strong> không phải là thuật toán "học" — nó là một{" "}
        <strong>quy ước bỏ phiếu</strong> trên tập dữ liệu gốc. Mọi sự khôn
        ngoan nằm ở hai lựa chọn:{" "}
        <strong>khoảng cách đo như thế nào</strong> và{" "}
        <strong>K bằng bao nhiêu</strong>. Đổi một trong hai, bạn có một model
        khác — dù dữ liệu không đổi một chữ.
      </AhaMoment>

      {/* =================================================================
          BƯỚC 5 — THỬ THÁCH
          ================================================================= */}
      <InlineChallenge
        question="Trên canvas, bạn đặt điểm truy vấn ngay giữa cụm A và cụm B. Với K=1 nó được dự đoán là A, với K=7 nó thành B. Điều này có nghĩa là gì?"
        options={[
          "Dataset có lỗi — hai kết quả phải giống nhau.",
          "Điểm gần nhất duy nhất thuộc A, nhưng trong vùng lân cận rộng hơn thì B chiếm đa số.",
          "K lớn luôn đúng hơn, vì vậy nhãn thật là B.",
          "Cần đổi metric từ Euclid sang Manhattan để có kết quả ổn định.",
        ]}
        correct={1}
        explanation="KNN với K=1 cực kỳ nhạy với điểm gần nhất — dễ bị nhiễu cục bộ. K=7 lấy 'ý kiến số đông' của vùng lớn hơn. Không phải cái nào 'đúng hơn' — đây là trade-off bias/variance mà bạn phải chọn bằng cross-validation."
      />

      <InlineChallenge
        question="Bạn có bộ dữ liệu y tế với 2 đặc trưng: tuổi (0-100) và thu nhập theo đồng (có giá trị đến hàng tỷ). Bạn train KNN thẳng trên dữ liệu thô. Điều gì sẽ xảy ra?"
        options={[
          "KNN hoạt động tốt — nó tự cân bằng các thang đo.",
          "Tuổi gần như vô nghĩa với model: khoảng cách Euclid bị thu nhập chi phối hoàn toàn.",
          "Dự đoán luôn ra lớp có thu nhập cao nhất.",
          "Mô hình sẽ chậm hơn nhưng vẫn chính xác.",
        ]}
        correct={1}
        explanation="Khoảng cách Euclid là tổng bình phương từng đặc trưng. Chênh lệch 10^9 ở thu nhập nhấn chìm mọi chênh lệch vài chục năm tuổi. Đây là lý do bước đầu tiên của pipeline KNN LUÔN là chuẩn hóa (StandardScaler hoặc MinMaxScaler)."
      />

      {/* =================================================================
          BƯỚC 6 — GIẢI THÍCH SÂU
          ================================================================= */}
      <ExplanationSection>
        <p>
          <strong>KNN (K-Nearest Neighbors)</strong> là thuật toán học có giám
          sát dùng cho phân loại (và cả hồi quy) dựa trên nguyên lý{" "}
          <em>similarity voting</em>: nhãn của một điểm mới được quyết định bởi
          K điểm gần nhất trong tập huấn luyện theo một độ đo khoảng cách.
        </p>

        <h3 className="mt-6 text-lg font-semibold">Công thức cốt lõi</h3>
        <p>
          Với điểm truy vấn <LaTeX>{"x_q"}</LaTeX>, tập huấn luyện{" "}
          <LaTeX>{"\\{(x_i, y_i)\\}_{i=1}^N"}</LaTeX>, và metric khoảng cách{" "}
          <LaTeX>{"d(\\cdot, \\cdot)"}</LaTeX>:
        </p>
        <LaTeX block>
          {"\\hat{y} = \\text{mode}\\{y_i \\mid i \\in \\mathcal{N}_K(x_q)\\}"}
        </LaTeX>
        <p>
          Trong đó <LaTeX>{"\\mathcal{N}_K(x_q)"}</LaTeX> là tập chỉ số của K
          điểm có <LaTeX>{"d(x_q, x_i)"}</LaTeX> nhỏ nhất.
        </p>

        <h3 className="mt-6 text-lg font-semibold">Các metric khoảng cách phổ biến</h3>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>
            <strong>Euclid (L2):</strong>{" "}
            <LaTeX>{"d(x, y) = \\sqrt{\\sum_j (x_j - y_j)^2}"}</LaTeX> — mặc
            định, phù hợp khi đặc trưng có ý nghĩa hình học.
          </li>
          <li>
            <strong>Manhattan (L1):</strong>{" "}
            <LaTeX>{"d(x, y) = \\sum_j |x_j - y_j|"}</LaTeX> — ít nhạy với
            outlier, phù hợp đặc trưng rời rạc.
          </li>
          <li>
            <strong>Minkowski (Lp):</strong> tổng quát hóa L1 và L2 với tham số{" "}
            <LaTeX>{"p \\geq 1"}</LaTeX>.
          </li>
          <li>
            <strong>Cosine:</strong> <LaTeX>{"1 - \\cos(\\theta)"}</LaTeX> —
            dùng cho vector văn bản / embeddings, quan tâm hướng chứ không phải
            độ lớn.
          </li>
          <li>
            <strong>Mahalanobis:</strong> có tính đến hiệp phương sai — khi đặc
            trưng tương quan lẫn nhau.
          </li>
        </ul>

        <h3 className="mt-6 text-lg font-semibold">Thuật toán (giả mã)</h3>
        <CodeBlock language="python" title="KNN từ đầu — sklearn-style">
{`import numpy as np
from collections import Counter

class KNNClassifier:
    def __init__(self, k: int = 5, metric: str = "euclidean"):
        self.k = k
        self.metric = metric

    def fit(self, X, y):
        # KNN "train" = ghi nhớ toàn bộ dữ liệu.
        self.X_train = np.asarray(X, dtype=float)
        self.y_train = np.asarray(y)
        return self

    def _distance(self, a, b):
        if self.metric == "euclidean":
            return np.sqrt(((a - b) ** 2).sum(axis=1))
        if self.metric == "manhattan":
            return np.abs(a - b).sum(axis=1)
        raise ValueError(f"Unknown metric: {self.metric}")

    def predict_one(self, x):
        d = self._distance(self.X_train, x)
        # Lấy chỉ số của K khoảng cách nhỏ nhất.
        top_k = np.argpartition(d, self.k)[: self.k]
        # Bỏ phiếu đa số.
        labels = self.y_train[top_k]
        return Counter(labels).most_common(1)[0][0]

    def predict(self, X):
        X = np.asarray(X, dtype=float)
        return np.array([self.predict_one(x) for x in X])

# Cách dùng — giống sklearn
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

X, y = load_iris(return_X_y=True)
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42)

# CỰC KỲ QUAN TRỌNG: luôn chuẩn hóa trước khi dùng KNN.
scaler = StandardScaler().fit(X_tr)
X_tr_s = scaler.transform(X_tr)
X_te_s = scaler.transform(X_te)

model = KNNClassifier(k=5).fit(X_tr_s, y_tr)
acc = (model.predict(X_te_s) == y_te).mean()
print(f"Accuracy: {acc:.3f}")`}
        </CodeBlock>

        <p className="mt-4">
          Trong thực tế bạn sẽ dùng trực tiếp{" "}
          <code>sklearn.neighbors.KNeighborsClassifier</code> — nó có nhiều
          tối ưu (KD-tree, Ball tree, parallel) mà triển khai tay không có.
        </p>

        <CodeBlock language="python" title="sklearn — cách dùng thực tế">
{`from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import KNeighborsClassifier
from sklearn.model_selection import GridSearchCV, cross_val_score

# Đóng gói chuẩn hóa + KNN trong một pipeline để tránh rò rỉ dữ liệu
# (data leakage) khi dùng cross-validation.
pipe = Pipeline([
    ("scaler", StandardScaler()),
    ("knn", KNeighborsClassifier()),
])

# Grid search để chọn K và metric tốt nhất.
param_grid = {
    "knn__n_neighbors": [1, 3, 5, 7, 11, 15, 21],
    "knn__weights": ["uniform", "distance"],
    "knn__metric": ["euclidean", "manhattan"],
}

grid = GridSearchCV(pipe, param_grid, cv=5, scoring="accuracy", n_jobs=-1)
grid.fit(X_train, y_train)

print("Best params:", grid.best_params_)
print("CV accuracy:", grid.best_score_)

# weights="distance": hàng xóm gần hơn có trọng số phiếu bầu lớn hơn.
# Thường cho kết quả tốt hơn "uniform" khi dữ liệu phân bố không đều.`}
        </CodeBlock>

        <Callout variant="warning" title="Curse of dimensionality">
          Khi số chiều <LaTeX>{"d"}</LaTeX> tăng, khoảng cách giữa mọi cặp điểm
          có xu hướng hội tụ — nghĩa là khái niệm "gần" mất ý nghĩa. KNN hoạt
          động tốt nhất ở <LaTeX>{"d < 20"}</LaTeX>. Với dữ liệu nhiều chiều
          (ảnh, văn bản raw), hãy giảm chiều bằng PCA / UMAP, hoặc dùng
          embedding học sâu trước khi áp KNN.
        </Callout>

        <Callout variant="warning" title="Khi nào KHÔNG nên dùng KNN">
          <ul className="list-disc list-inside space-y-1">
            <li>
              Tập huấn luyện quá lớn (hàng triệu điểm) và yêu cầu dự đoán
              real-time — chi phí <LaTeX>{"O(N \\cdot d)"}</LaTeX> mỗi query
              quá đắt.
            </li>
            <li>
              Đặc trưng không đồng nhất về thang đo và bạn không chuẩn hóa
              được.
            </li>
            <li>
              Số chiều rất cao mà không có cách giảm chiều.
            </li>
            <li>
              Dữ liệu cực mất cân bằng — KNN có xu hướng thiên lệch về lớp đa
              số (xử lý bằng <code>class_weight</code> hoặc SMOTE).
            </li>
          </ul>
        </Callout>

        <CollapsibleDetail title="Chứng minh: tại sao K=1 hội tụ về error rate &le; 2× Bayes error?">
          <p>
            Đây là kết quả kinh điển của Cover & Hart (1967). Với{" "}
            <LaTeX>{"N \\to \\infty"}</LaTeX>, lỗi của KNN với K=1 thỏa:
          </p>
          <LaTeX block>
            {"\\varepsilon^* \\leq \\varepsilon_{1\\text{-NN}} \\leq 2\\varepsilon^* (1 - \\varepsilon^*)"}
          </LaTeX>
          <p>
            Trong đó <LaTeX>{"\\varepsilon^*"}</LaTeX> là Bayes error (lỗi tối
            ưu lý thuyết). Nghĩa là ngay cả K=1 cũng không thể tệ hơn 2 lần
            giới hạn tối ưu — một kết quả đáng kinh ngạc vì K=1 là mô hình
            đơn giản nhất có thể. Chứng minh đầy đủ dùng luật số lớn và tính
            liên tục của phân phối điều kiện <LaTeX>{"P(y | x)"}</LaTeX>.
          </p>
          <p>
            Ý nghĩa thực hành: nếu bạn có <strong>đủ nhiều dữ liệu</strong>,
            KNN gần như không thể bị đánh bại quá xa — nó là một baseline
            cứng đầu cần vượt qua.
          </p>
        </CollapsibleDetail>

        <CollapsibleDetail title="Tăng tốc KNN: KD-tree, Ball-tree và approximate NN">
          <p>
            Brute-force KNN có chi phí <LaTeX>{"O(N \\cdot d)"}</LaTeX> mỗi
            query. Có ba nhóm kỹ thuật tăng tốc:
          </p>
          <ol className="list-decimal list-inside space-y-2 pl-2">
            <li>
              <strong>KD-tree:</strong> cây phân hoạch không gian theo trục.
              Hiệu quả khi <LaTeX>{"d < 20"}</LaTeX>, cho{" "}
              <LaTeX>{"O(\\log N)"}</LaTeX> trung bình mỗi query. sklearn dùng
              mặc định khi dữ liệu nhỏ chiều.
            </li>
            <li>
              <strong>Ball-tree:</strong> phân hoạch thành các hình cầu lồng
              nhau. Tốt hơn KD-tree khi dữ liệu phân bố không đều hoặc chiều
              vừa phải.
            </li>
            <li>
              <strong>Approximate Nearest Neighbor (ANN):</strong> hy sinh
              chính xác để đổi tốc độ — HNSW, FAISS, ScaNN. Dùng cho vector
              embedding (semantic search, RAG).{" "}
              <TopicLink slug="vector-databases">
                Xem thêm về vector databases
              </TopicLink>
              .
            </li>
          </ol>
        </CollapsibleDetail>

        <p className="mt-4">
          <strong>Trong thực tế</strong>, KNN tỏa sáng khi: (1) bạn cần một{" "}
          <em>baseline nhanh</em> để so sánh với mô hình phức tạp hơn, (2) dữ
          liệu có cấu trúc hình học rõ (ví dụ dữ liệu cảm biến đã chuẩn hóa),
          (3) giải thích được cho stakeholder non-technical — "model này phân
          loại vì giống 5 case trước đó trong lịch sử" dễ nghe hơn nhiều so
          với "model này trả về vì weight của layer 7 bằng..."
        </p>
      </ExplanationSection>

      {/* =================================================================
          BƯỚC 7 — TÓM TẮT
          ================================================================= */}
      <MiniSummary
        title="6 điều cần nhớ về KNN"
        points={[
          "KNN phân loại bằng bỏ phiếu đa số của K hàng xóm gần nhất — không có tham số cần 'học'.",
          "K nhỏ → variance cao (nhạy nhiễu, biên lởm chởm); K lớn → bias cao (mượt nhưng mất chi tiết).",
          "LUÔN chuẩn hóa đặc trưng: Euclid bị chi phối bởi đặc trưng có thang lớn nhất.",
          "Chọn K bằng cross-validation; khởi điểm K≈√N, ưu tiên K lẻ khi nhị phân để tránh hòa.",
          "Độ phức tạp dự đoán O(N·d) — quá lớn với dữ liệu nhiều. Tăng tốc bằng KD-tree, Ball-tree, hoặc ANN (HNSW, FAISS).",
          "KNN là baseline cứng đầu: bởi định lý Cover-Hart, với N→∞ thì 1-NN không tệ hơn 2× Bayes error.",
        ]}
      />

      {/* =================================================================
          BƯỚC 8 — QUIZ
          ================================================================= */}
      <QuizSection questions={QUIZ} />
    </>
  );
}
