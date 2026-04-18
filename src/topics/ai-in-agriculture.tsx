"use client";
import { useMemo, useState, useCallback } from "react";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  LaTeX,
  TopicLink,
  CollapsibleDetail,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "ai-in-agriculture",
  title: "AI in Agriculture",
  titleVi: "AI trong Nông nghiệp",
  description:
    "Ứng dụng AI trong phát hiện sâu bệnh, dự báo mùa vụ và nông nghiệp chính xác tại Việt Nam",
  category: "applied-ai",
  tags: ["crop", "pest-detection", "precision-farming"],
  difficulty: "beginner",
  relatedSlugs: ["image-classification", "object-detection", "edge-ai"],
  vizType: "interactive",
  tocSections: [{ id: "explanation", labelVi: "Giải thích" }],
};

const TOTAL_STEPS = 9;

// ---------------------------------------------------------------------------
// Dataset — 9 "crop leaves" in a 3x3 grid. Each plant has a true condition
// plus a synthetic probability distribution representing the output of a
// lightweight CNN (e.g. MobileNetV3) trained for rice / cassava / coffee
// leaf disease classification. Probabilities sum to ~1.0 for realism.
// ---------------------------------------------------------------------------

type DiseaseId =
  | "healthy"
  | "blast"
  | "blight"
  | "brown_spot"
  | "tungro"
  | "mosaic"
  | "rust";

type Plant = {
  id: string;
  crop: "rice" | "cassava" | "coffee";
  cropVi: string;
  name: string;
  trueLabel: DiseaseId;
  probs: Record<DiseaseId, number>;
  // Activation regions (x, y, r) that a Grad-CAM-like heatmap would highlight
  activations: { x: number; y: number; r: number; intensity: number }[];
  // Vietnamese prescription from an extension agent
  recommendation: string;
};

const DISEASE_LABEL_VI: Record<DiseaseId, string> = {
  healthy: "Khỏe mạnh",
  blast: "Đạo ôn",
  blight: "Cháy bìa lá",
  brown_spot: "Đốm nâu",
  tungro: "Vàng lùn (tungro)",
  mosaic: "Khảm lá",
  rust: "Gỉ sắt",
};

const DISEASE_COLOR: Record<DiseaseId, string> = {
  healthy: "#22c55e",
  blast: "#ef4444",
  blight: "#f97316",
  brown_spot: "#b45309",
  tungro: "#eab308",
  mosaic: "#a855f7",
  rust: "#dc2626",
};

const PLANTS: Plant[] = [
  {
    id: "p1",
    crop: "rice",
    cropVi: "Lúa (Đồng Tháp)",
    name: "Ruộng lúa #1 — lá xanh đều",
    trueLabel: "healthy",
    probs: {
      healthy: 0.91,
      blast: 0.03,
      blight: 0.02,
      brown_spot: 0.02,
      tungro: 0.01,
      mosaic: 0.005,
      rust: 0.005,
    },
    activations: [
      { x: 50, y: 45, r: 18, intensity: 0.2 },
      { x: 30, y: 60, r: 10, intensity: 0.1 },
    ],
    recommendation:
      "Cây khỏe. Tiếp tục lịch tưới và bón phân cân đối NPK theo giai đoạn sinh trưởng.",
  },
  {
    id: "p2",
    crop: "rice",
    cropVi: "Lúa (Cần Thơ)",
    name: "Ruộng lúa #2 — vết hình thoi",
    trueLabel: "blast",
    probs: {
      healthy: 0.04,
      blast: 0.78,
      blight: 0.08,
      brown_spot: 0.06,
      tungro: 0.02,
      mosaic: 0.01,
      rust: 0.01,
    },
    activations: [
      { x: 40, y: 40, r: 14, intensity: 0.85 },
      { x: 60, y: 55, r: 10, intensity: 0.7 },
      { x: 30, y: 62, r: 8, intensity: 0.55 },
    ],
    recommendation:
      "Dấu hiệu đạo ôn cổ bông. Phun Tricyclazole 75WP liều 1g/lít vào sáng sớm, cách nhau 7 ngày.",
  },
  {
    id: "p3",
    crop: "rice",
    cropVi: "Lúa (An Giang)",
    name: "Ruộng lúa #3 — cháy mép lá",
    trueLabel: "blight",
    probs: {
      healthy: 0.03,
      blast: 0.05,
      blight: 0.82,
      brown_spot: 0.05,
      tungro: 0.02,
      mosaic: 0.02,
      rust: 0.01,
    },
    activations: [
      { x: 20, y: 35, r: 12, intensity: 0.9 },
      { x: 80, y: 50, r: 12, intensity: 0.85 },
      { x: 50, y: 70, r: 10, intensity: 0.6 },
    ],
    recommendation:
      "Cháy bìa lá do vi khuẩn Xanthomonas. Giảm đạm, tăng kali; phun Kasugamycin hoặc đồng oxyclorua.",
  },
  {
    id: "p4",
    crop: "rice",
    cropVi: "Lúa (Kiên Giang)",
    name: "Ruộng lúa #4 — đốm nâu tròn",
    trueLabel: "brown_spot",
    probs: {
      healthy: 0.05,
      blast: 0.08,
      blight: 0.06,
      brown_spot: 0.72,
      tungro: 0.04,
      mosaic: 0.02,
      rust: 0.03,
    },
    activations: [
      { x: 35, y: 40, r: 6, intensity: 0.75 },
      { x: 55, y: 45, r: 6, intensity: 0.7 },
      { x: 45, y: 60, r: 6, intensity: 0.8 },
      { x: 65, y: 30, r: 5, intensity: 0.55 },
    ],
    recommendation:
      "Đốm nâu do Bipolaris oryzae, thường do thiếu kali. Bổ sung K2O và phun Mancozeb 80WP.",
  },
  {
    id: "p5",
    crop: "rice",
    cropVi: "Lúa (Sóc Trăng)",
    name: "Ruộng lúa #5 — lá vàng, cây thấp",
    trueLabel: "tungro",
    probs: {
      healthy: 0.05,
      blast: 0.03,
      blight: 0.07,
      brown_spot: 0.06,
      tungro: 0.7,
      mosaic: 0.06,
      rust: 0.03,
    },
    activations: [
      { x: 30, y: 30, r: 20, intensity: 0.7 },
      { x: 60, y: 55, r: 18, intensity: 0.78 },
    ],
    recommendation:
      "Vàng lùn do virus, truyền qua rầy nâu. Phun thuốc trừ rầy (Imidacloprid) + nhổ và tiêu hủy cây bệnh.",
  },
  {
    id: "p6",
    crop: "cassava",
    cropVi: "Khoai mì (Tây Ninh)",
    name: "Khoai mì #1 — khảm lá",
    trueLabel: "mosaic",
    probs: {
      healthy: 0.03,
      blast: 0.01,
      blight: 0.04,
      brown_spot: 0.04,
      tungro: 0.03,
      mosaic: 0.82,
      rust: 0.03,
    },
    activations: [
      { x: 40, y: 35, r: 14, intensity: 0.85 },
      { x: 60, y: 55, r: 14, intensity: 0.8 },
    ],
    recommendation:
      "Bệnh khảm lá sắn (CMD). Nhổ tiêu hủy, dùng giống kháng KM94/KM140, vệ sinh dụng cụ canh tác.",
  },
  {
    id: "p7",
    crop: "cassava",
    cropVi: "Khoai mì (Bình Phước)",
    name: "Khoai mì #2 — lá xanh bóng",
    trueLabel: "healthy",
    probs: {
      healthy: 0.88,
      blast: 0.01,
      blight: 0.03,
      brown_spot: 0.03,
      tungro: 0.01,
      mosaic: 0.03,
      rust: 0.01,
    },
    activations: [
      { x: 50, y: 50, r: 15, intensity: 0.18 },
    ],
    recommendation:
      "Cây khỏe. Duy trì tưới nước hợp lý, tránh úng, kiểm tra rầy trắng 7 ngày/lần.",
  },
  {
    id: "p8",
    crop: "coffee",
    cropVi: "Cà phê (Đắk Lắk)",
    name: "Cà phê #1 — đốm cam dưới lá",
    trueLabel: "rust",
    probs: {
      healthy: 0.02,
      blast: 0.02,
      blight: 0.03,
      brown_spot: 0.09,
      tungro: 0.01,
      mosaic: 0.03,
      rust: 0.8,
    },
    activations: [
      { x: 30, y: 50, r: 8, intensity: 0.85 },
      { x: 55, y: 55, r: 8, intensity: 0.8 },
      { x: 75, y: 45, r: 7, intensity: 0.7 },
    ],
    recommendation:
      "Gỉ sắt cà phê (Hemileia). Phun đồng + tỉa tán cho thông thoáng; thay giống kháng như TRS1.",
  },
  {
    id: "p9",
    crop: "coffee",
    cropVi: "Cà phê (Lâm Đồng)",
    name: "Cà phê #2 — lá xanh đậm",
    trueLabel: "healthy",
    probs: {
      healthy: 0.93,
      blast: 0.005,
      blight: 0.02,
      brown_spot: 0.01,
      tungro: 0.005,
      mosaic: 0.02,
      rust: 0.01,
    },
    activations: [
      { x: 50, y: 50, r: 14, intensity: 0.12 },
    ],
    recommendation:
      "Vườn cà phê khỏe mạnh. Chú ý giai đoạn ra hoa — tưới đủ ẩm, tránh sâu đục thân.",
  },
];

// ---------------------------------------------------------------------------
// Leaf SVG — parameterised by severity so unhealthy leaves get tinted spots.
// ---------------------------------------------------------------------------
function LeafIllustration({
  plant,
  showHeatmap,
}: {
  plant: Plant;
  showHeatmap: boolean;
}) {
  const topLabel = Object.entries(plant.probs).sort(
    (a, b) => b[1] - a[1],
  )[0][0] as DiseaseId;
  const baseGreen =
    topLabel === "healthy"
      ? "#16a34a"
      : topLabel === "tungro"
        ? "#ca8a04"
        : "#15803d";
  const accentGreen =
    topLabel === "healthy"
      ? "#22c55e"
      : topLabel === "tungro"
        ? "#eab308"
        : "#166534";

  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full"
      role="img"
      aria-label={`Minh họa lá ${plant.cropVi}`}
    >
      <defs>
        <radialGradient
          id={`leaf-grad-${plant.id}`}
          cx="0.5"
          cy="0.5"
          r="0.6"
        >
          <stop offset="0%" stopColor={accentGreen} />
          <stop offset="100%" stopColor={baseGreen} />
        </radialGradient>
      </defs>
      {/* Leaf silhouette */}
      <path
        d="M50 6 C78 20, 92 48, 78 82 C65 96, 38 94, 24 80 C8 56, 22 20, 50 6 Z"
        fill={`url(#leaf-grad-${plant.id})`}
        stroke={baseGreen}
        strokeWidth="1.5"
      />
      {/* Midrib */}
      <path
        d="M50 8 Q52 50, 52 92"
        fill="none"
        stroke={accentGreen}
        strokeWidth="1"
        opacity={0.6}
      />
      {/* Veins */}
      {[18, 32, 46, 60, 74].map((y, i) => (
        <g key={i}>
          <path
            d={`M51 ${y} Q${35 - i} ${y + 6}, ${22 + i * 0.5} ${y + 14}`}
            fill="none"
            stroke={accentGreen}
            strokeWidth="0.7"
            opacity={0.5}
          />
          <path
            d={`M52 ${y} Q${65 + i} ${y + 6}, ${80 - i * 0.5} ${y + 14}`}
            fill="none"
            stroke={accentGreen}
            strokeWidth="0.7"
            opacity={0.5}
          />
        </g>
      ))}

      {/* Disease markers overlay */}
      {plant.trueLabel !== "healthy" &&
        plant.activations.map((act, i) => {
          const fill =
            plant.trueLabel === "blast"
              ? "#7f1d1d"
              : plant.trueLabel === "blight"
                ? "#9a3412"
                : plant.trueLabel === "brown_spot"
                  ? "#78350f"
                  : plant.trueLabel === "mosaic"
                    ? "#6b21a8"
                    : plant.trueLabel === "rust"
                      ? "#b91c1c"
                      : "#854d0e";
          return (
            <ellipse
              key={i}
              cx={act.x}
              cy={act.y}
              rx={act.r * 0.5}
              ry={act.r * 0.3}
              fill={fill}
              opacity={0.55}
            />
          );
        })}

      {/* Grad-CAM style heatmap overlay */}
      {showHeatmap &&
        plant.activations.map((act, i) => (
          <circle
            key={`h-${i}`}
            cx={act.x}
            cy={act.y}
            r={act.r}
            fill="url(#cam-glow)"
            opacity={act.intensity}
          />
        ))}

      <defs>
        <radialGradient id="cam-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#fde047" stopOpacity={0.9} />
          <stop offset="60%" stopColor="#f97316" stopOpacity={0.5} />
          <stop offset="100%" stopColor="#dc2626" stopOpacity={0} />
        </radialGradient>
      </defs>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Probability bar chart — shows the softmax output for a selected plant.
// ---------------------------------------------------------------------------
function ProbabilityBars({ plant }: { plant: Plant }) {
  const ordered = (
    Object.entries(plant.probs) as [DiseaseId, number][]
  ).sort((a, b) => b[1] - a[1]);
  const max = ordered[0][1];

  return (
    <div className="space-y-1.5">
      {ordered.map(([label, p]) => {
        const pct = Math.round(p * 100);
        const isTop = p === max;
        return (
          <div key={label} className="flex items-center gap-2">
            <span
              className="w-28 shrink-0 text-[11px] font-medium"
              style={{ color: DISEASE_COLOR[label] }}
            >
              {DISEASE_LABEL_VI[label]}
            </span>
            <div className="flex-1 h-4 rounded-full bg-surface overflow-hidden border border-border">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  backgroundColor: DISEASE_COLOR[label],
                  opacity: isTop ? 1 : 0.65,
                }}
              />
            </div>
            <span
              className={`w-10 text-right text-[11px] tabular-nums ${
                isTop ? "font-bold text-foreground" : "text-muted"
              }`}
            >
              {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mini CNN stack — diagrammatic view of the conv layers that produced the
// feature activation highlighted on the leaf.
// ---------------------------------------------------------------------------
function CNNStackDiagram({ plant }: { plant: Plant }) {
  const stages = [
    {
      name: "Input 224×224",
      desc: "Ảnh lá gốc từ camera điện thoại",
      color: "#64748b",
    },
    {
      name: "Conv1 + ReLU",
      desc: "Phát hiện cạnh, màu sắc cơ bản",
      color: "#0ea5e9",
    },
    {
      name: "Conv2 + Pool",
      desc: "Phát hiện kết cấu (texture) của vết bệnh",
      color: "#3b82f6",
    },
    {
      name: "Depthwise Sep.",
      desc: "Kết hợp đặc trưng hình dạng & màu",
      color: "#6366f1",
    },
    {
      name: "Global Pool",
      desc: "Tóm gọn thành vector đặc trưng 1280 chiều",
      color: "#8b5cf6",
    },
    {
      name: "Softmax",
      desc: `Xác suất ${Object.keys(plant.probs).length} lớp bệnh`,
      color: DISEASE_COLOR[plant.trueLabel],
    },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
      {stages.map((s, i) => (
        <div
          key={i}
          className="rounded-lg border p-2 text-[10px] leading-tight"
          style={{
            borderColor: `${s.color}55`,
            backgroundColor: `${s.color}15`,
          }}
        >
          <div
            className="text-[9px] uppercase tracking-wide"
            style={{ color: s.color }}
          >
            Bước {i + 1}
          </div>
          <div className="font-semibold text-foreground">{s.name}</div>
          <div className="text-muted">{s.desc}</div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Interactive visualization — the crop disease detector.
// ---------------------------------------------------------------------------
function CropDiseaseDetector() {
  const [selectedId, setSelectedId] = useState<string>("p2");
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [threshold, setThreshold] = useState<number>(0.5);
  const selected = useMemo(
    () => PLANTS.find((p) => p.id === selectedId) ?? PLANTS[0],
    [selectedId],
  );
  const topPrediction = useMemo(() => {
    const entries = Object.entries(selected.probs) as [DiseaseId, number][];
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0];
  }, [selected]);

  const confidentEnough = topPrediction[1] >= threshold;

  const onCycle = useCallback(() => {
    const i = PLANTS.findIndex((p) => p.id === selectedId);
    const next = PLANTS[(i + 1) % PLANTS.length];
    setSelectedId(next.id);
  }, [selectedId]);

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="font-semibold text-foreground">
          Mô phỏng: chọn 1 cây để AI phân tích
        </span>
        <label className="inline-flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={showHeatmap}
            onChange={(e) => setShowHeatmap(e.target.checked)}
            className="accent-accent"
          />
          <span className="text-muted">Hiện Grad-CAM</span>
        </label>
        <label className="inline-flex items-center gap-1.5">
          <span className="text-muted">Ngưỡng tự tin:</span>
          <input
            type="range"
            min={0.3}
            max={0.95}
            step={0.05}
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="accent-accent"
          />
          <span className="tabular-nums w-10 text-right">
            {Math.round(threshold * 100)}%
          </span>
        </label>
        <button
          type="button"
          onClick={onCycle}
          className="ml-auto rounded-lg border border-border px-2.5 py-1 text-[11px] hover:bg-surface"
        >
          Cây tiếp theo →
        </button>
      </div>

      {/* Grid of plants */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {PLANTS.map((p) => {
          const active = p.id === selectedId;
          const borderColor = active
            ? "var(--color-accent, #8b5cf6)"
            : "transparent";
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedId(p.id)}
              className="group relative rounded-xl border-2 bg-surface p-2 transition-all hover:-translate-y-0.5"
              style={{ borderColor }}
              aria-pressed={active}
              aria-label={`Chọn ${p.cropVi}: ${p.name}`}
            >
              <div className="aspect-square w-full">
                <LeafIllustration
                  plant={p}
                  showHeatmap={active && showHeatmap}
                />
              </div>
              <div className="mt-1.5 text-center">
                <div className="text-[10px] text-muted uppercase tracking-wide">
                  {p.cropVi}
                </div>
                <div className="text-[10px] text-foreground font-medium truncate">
                  #{p.id.replace("p", "")}
                </div>
              </div>
              {active && (
                <span className="absolute -top-1 -right-1 rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
                  Đang phân tích
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Analysis panel */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Left: zoom of the selected leaf */}
        <div className="md:col-span-2 rounded-xl border border-border bg-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase text-muted tracking-wider">
                Ảnh đầu vào
              </div>
              <div className="text-sm font-semibold text-foreground">
                {selected.cropVi}
              </div>
            </div>
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted">
              224×224 RGB
            </span>
          </div>
          <div className="aspect-square w-full rounded-lg bg-surface">
            <LeafIllustration plant={selected} showHeatmap={showHeatmap} />
          </div>
          <p className="mt-2 text-[11px] text-muted leading-relaxed">
            {selected.name}. Vùng vàng–cam là nơi CNN <em>chú ý</em> nhiều
            nhất (Grad-CAM).
          </p>
        </div>

        {/* Middle: probability distribution */}
        <div className="md:col-span-2 rounded-xl border border-border bg-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[11px] uppercase text-muted tracking-wider">
              Đầu ra softmax
            </div>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
              style={{
                backgroundColor: DISEASE_COLOR[topPrediction[0]],
              }}
            >
              {DISEASE_LABEL_VI[topPrediction[0]]} —{" "}
              {Math.round(topPrediction[1] * 100)}%
            </span>
          </div>
          <ProbabilityBars plant={selected} />
          <div className="mt-3 rounded-lg bg-surface p-2 text-[11px] leading-relaxed">
            {confidentEnough ? (
              <span>
                <strong className="text-green-600 dark:text-green-400">
                  ✓ Tự tin:
                </strong>{" "}
                xác suất lớn nhất ≥ ngưỡng {Math.round(threshold * 100)}%. App
                sẽ hiển thị chẩn đoán cho nông dân.
              </span>
            ) : (
              <span>
                <strong className="text-amber-600 dark:text-amber-400">
                  ⚠ Chưa đủ tự tin
                </strong>{" "}
                ({Math.round(topPrediction[1] * 100)}% &lt;{" "}
                {Math.round(threshold * 100)}%). App nên{" "}
                <em>từ chối trả lời</em> và khuyến nghị chụp lại ảnh rõ hơn
                hoặc liên hệ khuyến nông.
              </span>
            )}
          </div>
        </div>

        {/* Right: recommendation */}
        <div className="md:col-span-1 rounded-xl border border-border bg-card p-3">
          <div className="text-[11px] uppercase text-muted tracking-wider">
            Khuyến nghị
          </div>
          <div className="mt-1 text-sm font-semibold text-foreground">
            {DISEASE_LABEL_VI[topPrediction[0]]}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-muted">
            {selected.recommendation}
          </p>
          <div className="mt-3 flex items-center gap-1">
            <span
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor:
                  selected.trueLabel === topPrediction[0]
                    ? "#22c55e"
                    : "#f59e0b",
              }}
            />
            <span className="text-[10px] text-muted">
              {selected.trueLabel === topPrediction[0]
                ? "Dự đoán khớp nhãn thật"
                : "Sai — cần thêm dữ liệu huấn luyện"}
            </span>
          </div>
        </div>
      </div>

      {/* CNN stack diagram */}
      <div>
        <div className="mb-2 text-[11px] uppercase text-muted tracking-wider">
          Cách CNN xử lý ảnh lá (MobileNetV3 Small, ~5 MB sau lượng tử hóa)
        </div>
        <CNNStackDiagram plant={selected} />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-[10px]">
        {(Object.keys(DISEASE_LABEL_VI) as DiseaseId[]).map((k) => (
          <span
            key={k}
            className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 bg-surface"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: DISEASE_COLOR[k] }}
            />
            <span className="text-muted">{DISEASE_LABEL_VI[k]}</span>
          </span>
        ))}
      </div>

      <p className="text-[11px] text-muted italic leading-relaxed">
        Mô phỏng dùng xác suất tổng hợp. Trong thực tế, mô hình được huấn
        luyện trên bộ dữ liệu PlantVillage + ảnh địa phương do khuyến nông
        VN thu thập ở Đồng Tháp, Cần Thơ, Đắk Lắk, Tây Ninh. Với camera điện
        thoại thông dụng (12–48 MP), độ chính xác đạt 88–93% cho 3 nhóm cây
        trên.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main topic component
// ---------------------------------------------------------------------------
export default function AIInAgricultureTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question: "AI phát hiện bệnh lúa bằng cách nào?",
        options: [
          "Đo độ ẩm đất",
          "Chụp ảnh lá lúa bằng điện thoại → CNN phân loại bệnh (đạo ôn, vàng lá, khô vằn) → gợi ý cách trị với accuracy 90%+",
          "Đo nhiệt độ không khí",
        ],
        correct: 1,
        explanation:
          "CNN (MobileNet/EfficientNet) nhận diện triệu chứng bệnh từ ảnh lá: màu sắc (vàng, nâu), hình dạng vết bệnh, vị trí. App trên điện thoại: nông dân chụp ảnh → AI phân loại → gợi ý thuốc/cách xử lý. Đã có apps như PlantVillage, Plantix dùng ở VN.",
      },
      {
        question: "Precision farming là gì?",
        options: [
          "Farming chính xác từng cm",
          "Dùng AI + sensors + drone để TỐI ƯU tại từng vùng nhỏ: bao nhiêu nước, bao nhiêu phân, khi nào thu hoạch — thay vì 'làm đồng đều' toàn cánh đồng",
          "Chỉ dùng trong nhà kính",
        ],
        correct: 1,
        explanation:
          "Precision farming: không phun thuốc đều toàn ruộng mà chỉ phun chỗ nào bị sâu. Không tưới đều mà tưới theo độ ẩm từng vùng. Giảm 30-50% nước + phân + thuốc, tăng 15-25% năng suất. Drones + sensors + AI = farming 4.0. Việt Nam đang pilot ở Đồng bằng sông Cửu Long.",
      },
      {
        question: "Thách thức lớn nhất của AI nông nghiệp tại Việt Nam?",
        options: [
          "Thiếu GPU",
          "Hạ tầng: internet không ổn định ở nông thôn, nông dân chưa quen công nghệ, data cụ thể cho giống cây VN còn thiếu",
          "Thiếu đất nông nghiệp",
        ],
        correct: 1,
        explanation:
          "3 thách thức chính: (1) Internet ở nông thôn không ổn định → cần Edge AI (chạy trên điện thoại offline), (2) Nông dân cần app đơn giản (tiếng Việt, giao diện dễ dùng), (3) Data giống cây VN (lúa, cà phê, thanh long) không nhiều như data cây tây Âu. Cần tự collect và label.",
      },
      {
        question:
          "Vì sao MobileNetV3 phù hợp hơn ResNet-152 cho ứng dụng nông dân?",
        options: [
          "MobileNet chính xác hơn trên mọi bài toán",
          "MobileNet nhẹ (~5MB sau quantize INT8), chạy offline 50ms trên điện thoại 2-3GB RAM — phù hợp hạ tầng nông thôn",
          "MobileNet có nhiều layer hơn",
        ],
        correct: 1,
        explanation:
          "Nông thôn VN: internet chập chờn, điện thoại cũ 2-3GB RAM. ResNet-152 nặng 230MB cần server. MobileNetV3 INT8 chỉ 5MB, accuracy 88-92% (đủ dùng), chạy hoàn toàn offline. Đây chính là bản chất của Edge AI — hy sinh 3-5% accuracy để đạt tính khả dụng trong thực tế.",
      },
      {
        question: "Grad-CAM giúp gì cho app phát hiện bệnh cây?",
        options: [
          "Tăng tốc độ inference lên 2x",
          "Vẽ heatmap chỉ ra VÙNG CỤ THỂ trên lá mà CNN tập trung → nông dân biết AI nhìn vào đâu và tin tưởng hơn",
          "Tăng accuracy lên 99%",
        ],
        correct: 1,
        explanation:
          "Grad-CAM (Gradient-weighted Class Activation Mapping) tạo heatmap trực quan: vùng đỏ/vàng = CNN chú ý nhiều. Nông dân thấy AI chỉ vào đúng vết bệnh → tin tưởng hơn. Nếu AI chỉ vào nền đất (không phải lá) → biết model bị lỗi. Explainability quan trọng trong Edge AI cho nông nghiệp.",
      },
      {
        question:
          "Drone + multispectral camera phát hiện bệnh SỚM hơn mắt thường nhờ cơ chế nào?",
        options: [
          "Camera bay trên cao thấy rõ hơn",
          "Cảm biến đa phổ (NIR, red-edge) đo chlorophyll và nước trong lá — thay đổi TRƯỚC khi xuất hiện triệu chứng nhìn thấy 1-2 tuần",
          "Drone bay ban đêm thấy bệnh rõ hơn ban ngày",
        ],
        correct: 1,
        explanation:
          "Lá bị stress (hạn, bệnh) giảm chlorophyll trước khi đổi màu nhìn được. Dải NIR (near-infrared) và red-edge phản xạ khác giữa lá khỏe và lá stress. AI + chỉ số NDVI/NDRE → bản đồ sức khỏe ruộng → phát hiện sớm 1-2 tuần → xử lý tại điểm, tiết kiệm 70-80% thuốc và cứu năng suất.",
      },
      {
        question:
          "Khi model trả về xác suất cao nhất chỉ 45%, app nên làm gì?",
        options: [
          "Vẫn báo kết quả top-1 cho nông dân",
          "Từ chối trả lời: hiển thị cảnh báo 'Độ tin cậy thấp — chụp lại ảnh rõ hơn hoặc gọi khuyến nông' và đính kèm top-3 để bác sĩ cây trồng xem",
          "Gọi API GPT-4 để đoán",
        ],
        correct: 1,
        explanation:
          "Abstention (từ chối trả lời) là best practice. Xác suất thấp thường do: ảnh mờ, sai khung hình, hoặc bệnh mới chưa có trong training set. Hiển thị top-3 + ngưỡng tự tin giúp nông dân không áp dụng thuốc sai. Thà không trả lời còn hơn trả lời sai.",
      },
      {
        type: "fill-blank",
        question:
          "Ứng dụng điển hình của AI trong nông nghiệp là chụp ảnh lá {blank} để {blank} sớm, giúp nông dân xử lý trước khi bệnh lan rộng.",
        blanks: [
          {
            answer: "cây trồng",
            accept: ["crop", "cây", "lúa", "plant"],
          },
          {
            answer: "phát hiện bệnh",
            accept: [
              "disease detection",
              "phát hiện sâu bệnh",
              "chẩn đoán bệnh",
            ],
          },
        ],
        explanation:
          "Mô hình CNN nhẹ (MobileNet) chạy trên điện thoại nông dân: chụp ảnh lá → phân loại bệnh (đạo ôn, khô vằn, vàng lá...) → gợi ý thuốc/biện pháp. Đây là ứng dụng Edge AI tiêu biểu cho nông thôn Việt Nam.",
      },
    ],
    [],
  );

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Nông dân Đồng Tháp trồng 10 ha lúa. Một vùng bị đạo ôn nhưng chưa nhìn thấy rõ. Khi phát hiện thì đã lan 3 ha. AI giúp thế nào?"
          options={[
            "AI không liên quan đến nông nghiệp",
            "Drone bay quét + AI phân tích ảnh → phát hiện bệnh SỚM (trước mắt thường 1-2 tuần) → chỉ cần xử lý 0.5 ha thay vì 3 ha",
            "AI dự báo thời tiết",
          ]}
          correct={1}
          explanation="Drone + multispectral camera chụp ruộng → AI phân tích: vùng nào stress (chưa có triệu chứng mắt thường nhưng spectral signature khác). Phát hiện sớm 1-2 tuần → xử lý 0.5 ha thay vì 3 ha → tiết kiệm 80% thuốc + cứu 70% năng suất. Đã được pilot ở Cần Thơ, An Giang!"
        >
          <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Bối cảnh">
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                Việt Nam là <strong>cường quốc nông sản</strong>: top 2 xuất
                khẩu gạo thế giới, top 1 hồ tiêu, top 2 cà phê (sau Brazil),
                top 1 điều nhân. Nhưng năng suất trên mỗi hecta của ta vẫn
                thấp hơn Nhật, Hàn, Thái Lan từ 15–30%. Nguyên nhân chính
                không phải đất xấu hay nông dân thiếu kinh nghiệm — mà là{" "}
                <strong>thông tin đến chậm</strong>: sâu bệnh phát hiện muộn,
                phân bón rải đồng đều thay vì theo đốm đất, thu hoạch theo
                kinh nghiệm chứ chưa theo dữ liệu.
              </p>
              <p>
                Ở <strong>Đồng bằng sông Cửu Long</strong>, một bác nông dân
                trồng 10 ha lúa thường dậy từ 4h sáng đi kiểm tra đồng. Nhưng
                mắt thường chỉ thấy được bệnh khi đã có triệu chứng rõ — tức
                là khi dịch đã lan ít nhất 5–10%. Ở{" "}
                <strong>Tây Nguyên</strong>, vườn cà phê rộng, chủ vườn đi xe
                máy 2 giờ cũng chỉ soát được 30% diện tích. Ở{" "}
                <strong>Ninh Thuận</strong>, nho ba vụ/năm, một đợt nắng gắt
                không tưới kịp là mất trắng.
              </p>
              <p>
                AI giải bài toán này bằng <strong>ba cánh tay</strong>: (1)
                camera điện thoại rẻ tiền trên tay nông dân, (2) drone bay
                quét 10 ha trong 15 phút với camera đa phổ, (3) cảm biến độ
                ẩm đất + API thời tiết. Ba nguồn dữ liệu này được cắm vào mô
                hình học sâu — thường là{" "}
                <TopicLink slug="cnn">CNN nhẹ như MobileNet</TopicLink> — để
                đưa ra chẩn đoán và khuyến nghị cụ thể{" "}
                <em>theo từng đốm đất</em>, không phải cho cả cánh đồng.
              </p>
              <p>
                Điểm then chốt là <strong>Edge AI</strong>: mô hình phải chạy{" "}
                <em>trên điện thoại</em>, không cần internet. Vì sao? Sóng 4G
                ở nông thôn chập chờn, điện thoại nông dân thường là máy cũ
                2–3 GB RAM. Gửi ảnh lên cloud cho GPT-4 Vision xử lý vừa chậm
                (5–15 giây), vừa tốn data, vừa không chạy được khi không có
                sóng. Một mô hình <TopicLink slug="quantization">lượng tử hóa INT8</TopicLink>{" "}
                5 MB chạy 50 ms offline thì <em>khả dụng</em> ngay cả trên
                ruộng xa. Đây là khác biệt giữa &ldquo;demo đẹp&rdquo; và
                &ldquo;dùng thật&rdquo;.
              </p>
            </div>
          </LessonSection>

          <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khám phá">
            <VisualizationSection topicSlug="ai-in-agriculture">
              <CropDiseaseDetector />
            </VisualizationSection>
          </LessonSection>

          <LessonSection
            step={4}
            totalSteps={TOTAL_STEPS}
            label="Khoảnh khắc Aha"
          >
            <AhaMoment>
              <p>
                AI nông nghiệp là <strong>nông dân 4.0</strong>: thay vì nhìn
                trời đoán thời tiết, dùng <strong>AI dự báo</strong>. Thay vì
                phun thuốc toàn ruộng, dùng{" "}
                <strong>drone chỉ phun chỗ bị bệnh</strong>. Thay vì thu
                hoạch theo lịch, dùng{" "}
                <strong>AI phân tích độ chín</strong>. Giảm 30–50% chi phí,
                tăng 15–25% năng suất. Việt Nam — nước nông nghiệp — có thể
                hưởng lợi <em>rất lớn</em>, miễn là chúng ta giải được bài
                toán hạ tầng (Edge AI + giao diện tiếng Việt thân thiện) và
                dữ liệu cho giống cây bản địa.
              </p>
            </AhaMoment>
          </LessonSection>

          <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
            <div className="space-y-4">
              <InlineChallenge
                question="App AI phát hiện bệnh cây cần chạy trên điện thoại nông dân (RAM 2-3GB, không có internet ổn định). Chọn model nào?"
                options={[
                  "ResNet-152 (230MB, cần internet)",
                  "MobileNet V3 quantized INT8 (5MB, chạy offline, 50ms trên điện thoại cũ)",
                  "GPT-4 Vision API",
                ]}
                correct={1}
                explanation="Nông thôn VN: internet không ổn định → cần offline. Điện thoại cũ 2-3GB RAM → model phải nhỏ. MobileNet V3 INT8: 5MB, accuracy 88% (đủ cho 90% use cases), chạy 50ms, offline. Edge AI là giải pháp duy nhất cho nông nghiệp nông thôn!"
              />
              <InlineChallenge
                question="Mô hình phân loại bệnh lúa trả kết quả: Khỏe 41%, Đạo ôn 39%, Đốm nâu 18%. Ngưỡng tự tin của app là 60%. App nên làm gì?"
                options={[
                  "Báo 'Khỏe' vì đó là xác suất cao nhất",
                  "Từ chối trả lời: '41% < 60% → cần chụp lại ảnh rõ hơn, đủ ánh sáng; nếu vẫn không chắc, gọi khuyến nông'",
                  "Ghép 3 nhãn lại thành 'Khỏe có lẫn bệnh'",
                ]}
                correct={1}
                explanation="Abstention (từ chối trả lời) quan trọng trong nông nghiệp: sai chẩn đoán → nông dân xài thuốc sai → tốn tiền hoặc lan bệnh. Khi top-1 dưới ngưỡng, yêu cầu người dùng chụp lại (ảnh mờ, ngược nắng) hoặc chuyển lên chuyên gia. Đây cũng là best practice trong AI y tế."
              />
            </div>
          </LessonSection>

          <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Lý thuyết">
            <ExplanationSection>
              <p>
                <strong>AI in Agriculture</strong> ứng dụng các mô hình học
                sâu — chủ yếu là{" "}
                <TopicLink slug="cnn">CNN</TopicLink> và{" "}
                <TopicLink slug="object-detection">
                  object detection
                </TopicLink>{" "}
                — để hỗ trợ bốn nhóm bài toán lớn: phát hiện sâu bệnh, tối ưu
                hóa đầu vào (nước, phân, thuốc), dự báo năng suất, và tự động
                hóa thu hoạch. Mô hình triển khai trên cạnh mạng (
                <TopicLink slug="edge-ai">Edge AI</TopicLink>) để phù hợp hạ
                tầng nông thôn.
              </p>

              <p>
                <strong>Công thức softmax cho phân loại bệnh</strong> (K lớp
                bệnh, logits z₁, …, z_K):
              </p>
              <LaTeX block>
                {
                  "P(y = k \\mid x) = \\frac{e^{z_k}}{\\sum_{j=1}^{K} e^{z_j}}"
                }
              </LaTeX>
              <p>
                Trong đó x là ảnh lá đã được chuẩn hóa (224×224 RGB), z = CNN(x)
                là vector logits. Lớp dự đoán là{" "}
                <LaTeX>{"\\hat{y} = \\arg\\max_k P(y=k \\mid x)"}</LaTeX>, và
                ứng dụng chỉ trả kết quả khi{" "}
                <LaTeX>
                  {"P(y=\\hat{y} \\mid x) \\geq \\tau"}
                </LaTeX>{" "}
                (ngưỡng tự tin, thường 0.6–0.8).
              </p>

              <p>
                <strong>Chỉ số NDVI (Normalized Difference Vegetation Index)</strong>{" "}
                dùng cho ảnh drone đa phổ:
              </p>
              <LaTeX block>
                {
                  "\\text{NDVI} = \\frac{\\text{NIR} - \\text{Red}}{\\text{NIR} + \\text{Red}} \\in [-1, 1]"
                }
              </LaTeX>
              <p>
                Lá khỏe hấp thụ Red (để quang hợp) và phản xạ mạnh NIR →
                NDVI ≈ 0.6–0.9. Lá stress do bệnh, hạn hay thiếu đạm phản xạ
                Red nhiều hơn và NIR ít hơn → NDVI giảm còn 0.2–0.4 nhiều
                tuần trước khi triệu chứng hiện ra với mắt thường.
              </p>

              <p>
                <strong>Bốn ứng dụng chính:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>Phát hiện sâu bệnh:</strong>{" "}
                  <TopicLink slug="image-classification">
                    Image classification
                  </TopicLink>{" "}
                  từ ảnh lá → phân loại bệnh (accuracy 90%+). PlantVillage,
                  Plantix, Nuru (maize).
                </li>
                <li>
                  <strong>Precision farming:</strong> Sensors độ ẩm + cảm
                  biến NPK + AI → tối ưu nước, phân, thuốc từng vùng 10m ×
                  10m. Giảm 30–50% đầu vào.
                </li>
                <li>
                  <strong>Dự báo năng suất:</strong> Satellite (Sentinel-2) +
                  weather API + soil data → mô hình hồi quy predict yield
                  tonnes/ha cho cả tỉnh.
                </li>
                <li>
                  <strong>Robot thu hoạch:</strong>{" "}
                  <TopicLink slug="object-detection">
                    Object detection
                  </TopicLink>{" "}
                  + robotics cho thu hoạch tự động — phát hiện trái chín,
                  tính toán lực cầm, cắt không làm tổn thương.
                </li>
              </ul>

              <Callout variant="info" title="AI Nông nghiệp tại Việt Nam">
                VNPT xây platform nông nghiệp thông minh cho Đồng bằng sông
                Cửu Long. FPT có AI dự báo thời tiết cho vùng trồng. Nhiều
                startup nội địa như AgriConnect, MimosaTEK, HachiHub đang
                pilot cảm biến + app. Mekong delta (lúa), Tây Nguyên (cà
                phê), Ninh Thuận (nho), Tiền Giang (thanh long) là bốn vùng
                đi đầu về thử nghiệm công nghệ.
              </Callout>

              <Callout variant="tip" title="Chiến lược dữ liệu cho VN">
                PlantVillage chủ yếu có dữ liệu cây Âu–Mỹ. Nông nghiệp VN có
                đặc thù riêng: giống lúa Jasmine, ST25, IR50404; cà phê
                Robusta cao nguyên; khoai mì KM94/KM140. Phải tự thu thập và
                gán nhãn — thường qua chương trình khuyến nông: nhân viên đi
                ruộng chụp ảnh, bác sĩ cây trồng gán nhãn, một phần dán nhãn
                đám đông qua app điện thoại.
              </Callout>

              <Callout variant="warning" title="Rủi ro khi AI sai">
                Chẩn đoán sai đạo ôn thành đốm nâu → phun nhầm thuốc → bệnh
                lan thêm + chi phí tăng. Sai dự báo năng suất → nông dân vay
                vốn đầu tư quá mức. Đây là lý do app luôn cần (1) ngưỡng
                tự tin, (2) top-3 kết quả, (3) hotline khuyến nông để đối
                chiếu trước khi hành động.
              </Callout>

              <Callout variant="insight" title="Vì sao CNN 'nhìn' được bệnh">
                CNN học từ dữ liệu cách phân biệt vết hình thoi (đạo ôn) với
                đốm nâu tròn (brown spot), cháy mép lá (bacterial blight)
                với vàng gân lá (tungro). Các filter ở lớp thấp phát hiện
                cạnh, màu, texture; các filter lớp cao ghép thành khái niệm
                &ldquo;vết bệnh hình thoi màu xám trung tâm&rdquo;.{" "}
                <TopicLink slug="explainability">Grad-CAM</TopicLink> cho
                phép vẽ heatmap chỉ ra vùng mà CNN đang chú ý — nếu CNN chú
                ý vào nền đất thay vì lá, ta biết model bị lỗi.
              </Callout>

              <CodeBlock
                language="python"
                title="Phát hiện bệnh cây trên điện thoại (TFLite)"
              >
                {`import tensorflow as tf

# 1. Model nhỏ cho điện thoại: MobileNetV3 Small
model = tf.keras.applications.MobileNetV3Small(
    input_shape=(224, 224, 3),
    classes=10,  # 10 loại bệnh lúa phổ biến ở VN
    weights=None,
)
model.load_weights("disease_model.h5")

# 2. Lượng tử hóa INT8 để chạy trên điện thoại
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]

def representative_dataset():
    # 100 ảnh lá thật để calibrate quantization
    for img in calibration_images[:100]:
        yield [tf.cast(img, tf.float32)]

converter.representative_dataset = representative_dataset
converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
converter.inference_input_type = tf.int8
converter.inference_output_type = tf.int8

tflite_model = converter.convert()
# Kết quả: 5 MB, 50 ms/inference trên Snapdragon 665
# Accuracy: 91% (so với 94% của FP32) — mất 3% để giảm kích thước 47x

with open("disease_model_int8.tflite", "wb") as f:
    f.write(tflite_model)

# 3. Triển khai trên Android/iOS
# Java:  Interpreter tflite = new Interpreter(modelFile);
# Swift: let interpreter = try Interpreter(modelPath: path)

# 4. Inference + abstention
def predict(image, threshold=0.7):
    probs = tflite_infer(image)   # shape (10,)
    top = int(probs.argmax())
    if probs[top] < threshold:
        return {"action": "retake_photo", "top3": top3(probs)}
    return {
        "disease": DISEASES[top],
        "confidence": float(probs[top]),
        "recommendation": RECOMMEND[DISEASES[top]],
    }`}
              </CodeBlock>

              <CodeBlock
                language="python"
                title="Phân tích ảnh drone đa phổ — bản đồ NDVI"
              >
                {`import numpy as np
import rasterio

# Ảnh drone đa phổ (NIR + Red từ camera MicaSense RedEdge)
with rasterio.open("field_2025_04_12.tif") as src:
    nir = src.read(4).astype("float32")   # band 4: NIR
    red = src.read(3).astype("float32")   # band 3: Red

# 1. NDVI: chỉ số sức khỏe thảm thực vật
np.seterr(divide="ignore", invalid="ignore")
ndvi = (nir - red) / (nir + red + 1e-8)

# 2. Phân lớp vùng theo ngưỡng kinh nghiệm
mask_healthy   = ndvi > 0.6             # lá xanh đậm, khỏe
mask_moderate  = (ndvi > 0.3) & (ndvi <= 0.6)
mask_stressed  = (ndvi > 0.1) & (ndvi <= 0.3)  # stress — cần kiểm tra
mask_bare_soil = ndvi <= 0.1

# 3. Gợi ý xử lý theo vùng (precision agriculture)
def recommend(pct_stressed):
    if pct_stressed > 0.10:
        return "Phun trúng điểm các vùng NDVI < 0.3 trong 48h tới."
    if pct_stressed > 0.03:
        return "Theo dõi — chụp lại sau 5 ngày."
    return "Ruộng ổn định. Duy trì lịch tưới tiêu."

pct = mask_stressed.mean()
print(f"Diện tích stress: {pct*100:.1f}% — {recommend(pct)}")

# 4. Xuất bản đồ cho app để drone phun thuốc theo điểm
np.save("prescription_map.npy", mask_stressed.astype("uint8"))
# Drone DJI Agras đọc prescription map → chỉ phun 8% diện tích
# thay vì phun đồng đều 100% → tiết kiệm 92% thuốc BVTV.`}
              </CodeBlock>

              <p>
                <strong>Ví dụ đường ống thực tế</strong> (app &ldquo;Nông Dân
                Thông Minh&rdquo; pilot ở Đồng Tháp):
              </p>
              <ol className="list-decimal list-inside space-y-1 pl-2 text-sm">
                <li>
                  Nông dân mở app, chụp 3 ảnh lá từ ba góc khác nhau.
                </li>
                <li>
                  Ảnh được resize 224×224, chuẩn hóa, đưa vào{" "}
                  <code className="text-[11px]">disease_model_int8.tflite</code>.
                </li>
                <li>
                  Model trả 3 xác suất top-3. Nếu top-1 ≥ 0.7, app hiển thị
                  tên bệnh + khuyến nghị thuốc/biện pháp bằng tiếng Việt. Có
                  thêm Grad-CAM heatmap chồng lên ảnh để nông dân tin tưởng.
                </li>
                <li>
                  Nếu top-1 &lt; 0.7, app yêu cầu chụp lại hoặc chuyển ảnh
                  lên cloud cho chuyên gia khuyến nông review.
                </li>
                <li>
                  Tất cả ảnh + nhãn phản hồi của chuyên gia được gửi lên
                  cloud (khi có sóng) để <em>cải thiện model</em> ở chu kỳ
                  huấn luyện sau (
                  <TopicLink slug="fine-tuning">fine-tuning</TopicLink>).
                </li>
                <li>
                  Ứng dụng hoạt động hoàn toàn offline ở bước 1–3; chỉ cần
                  internet ở bước 4–5.
                </li>
              </ol>

              <CollapsibleDetail title="So sánh kiến trúc CNN cho bài toán phân loại bệnh cây">
                <div className="space-y-2 text-sm leading-relaxed">
                  <p>
                    Trên dataset PlantVillage mở rộng với ảnh thực tế ở Đồng
                    bằng sông Cửu Long:
                  </p>
                  <table className="w-full text-[12px] border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="py-1 text-left">Model</th>
                        <th className="py-1 text-right">Kích thước</th>
                        <th className="py-1 text-right">Accuracy</th>
                        <th className="py-1 text-right">Thời gian</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted">
                      <tr className="border-b border-border/50">
                        <td>ResNet-152 FP32</td>
                        <td className="text-right">230 MB</td>
                        <td className="text-right">95.1%</td>
                        <td className="text-right">1200 ms</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td>ResNet-50 FP32</td>
                        <td className="text-right">98 MB</td>
                        <td className="text-right">94.3%</td>
                        <td className="text-right">420 ms</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td>EfficientNet-B0</td>
                        <td className="text-right">21 MB</td>
                        <td className="text-right">93.8%</td>
                        <td className="text-right">110 ms</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td>MobileNetV3-Small FP32</td>
                        <td className="text-right">12 MB</td>
                        <td className="text-right">91.5%</td>
                        <td className="text-right">75 ms</td>
                      </tr>
                      <tr>
                        <td className="font-semibold text-foreground">
                          MobileNetV3-Small INT8
                        </td>
                        <td className="text-right font-semibold text-foreground">
                          5 MB
                        </td>
                        <td className="text-right font-semibold text-foreground">
                          90.7%
                        </td>
                        <td className="text-right font-semibold text-foreground">
                          50 ms
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-[12px] mt-2">
                    Số đo trên Snapdragon 665 (phổ biến trong điện thoại
                    giá rẻ tại VN). Chọn MobileNetV3 INT8 cho hạ tầng nông
                    thôn: đổi 4 điểm % accuracy lấy kích thước nhỏ hơn 46
                    lần và tốc độ 24 lần.
                  </p>
                </div>
              </CollapsibleDetail>

              <CollapsibleDetail title="Quy trình thu thập và gán nhãn dữ liệu giống cây Việt Nam">
                <div className="space-y-2 text-sm leading-relaxed">
                  <p>
                    PlantVillage mở chỉ có ~54 lớp bệnh cho 14 cây chủ yếu
                    ở Mỹ/Châu Âu. Cho giống cây VN, một pipeline thực tế
                    trông như sau:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-[12px]">
                    <li>
                      <strong>Khảo sát ban đầu</strong>: liệt kê 10–15 bệnh
                      phổ biến nhất cho mỗi giống cây chủ lực (lúa Jasmine,
                      ST25; cà phê Robusta; khoai mì KM94).
                    </li>
                    <li>
                      <strong>Thu thập đa vùng</strong>: ký hợp đồng với
                      10–30 hợp tác xã, mỗi bên chụp ít nhất 200 ảnh lá/tuần
                      theo khung hình chuẩn (cách lá 15 cm, nền tối).
                    </li>
                    <li>
                      <strong>Gán nhãn cấp 1</strong>: sinh viên nông nghiệp
                      gán nhãn thô qua app web. Gán 2 lần độc lập — nếu khác
                      nhau thì chuyển lên cấp 2.
                    </li>
                    <li>
                      <strong>Gán nhãn cấp 2</strong>: bác sĩ cây trồng từ
                      Viện Lúa ĐBSCL review các ảnh khó. Dùng để xây tập
                      test gold standard ~2000 ảnh.
                    </li>
                    <li>
                      <strong>Cân bằng lớp</strong>:{" "}
                      <TopicLink slug="data-augmentation">
                        data augmentation
                      </TopicLink>{" "}
                      (xoay, thay đổi ánh sáng) cho lớp hiếm; under-sample
                      lớp &ldquo;khỏe&rdquo; vốn luôn chiếm đa số.
                    </li>
                    <li>
                      <strong>Vòng lặp active learning</strong>: sau khi
                      deploy, các ảnh mà model không chắc (top-1 &lt; 0.7)
                      được ưu tiên gán nhãn và thêm vào tập huấn luyện lần
                      sau.
                    </li>
                  </ol>
                </div>
              </CollapsibleDetail>

              <p>
                <strong>Ứng dụng kề cận</strong> — ngoài phát hiện bệnh lá,
                AI còn dùng để:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>Đếm cây &amp; trái chín</strong>: drone + YOLO tính
                  mật độ cây cà phê, đếm trái thanh long chín. Hỗ trợ lập kế
                  hoạch thu hoạch.
                </li>
                <li>
                  <strong>Theo dõi dịch rầy nâu</strong>: bẫy đèn thông minh
                  đếm côn trùng từ ảnh, cảnh báo vùng nguy cơ cao trước khi
                  dịch bùng.
                </li>
                <li>
                  <strong>Thủy sản</strong>: ở Cà Mau, AI phân tích video
                  camera dưới ao tôm để phát hiện tôm bị bệnh gan tụy — một
                  trong những nguyên nhân lớn gây mất trắng vụ.
                </li>
                <li>
                  <strong>Chuỗi cung ứng</strong>: mô hình dự báo giá nông
                  sản 4–12 tuần giúp nông dân quyết định bán ngay hay trữ.
                </li>
              </ul>

              <p>
                <strong>Cạm bẫy thường gặp</strong>:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>Domain shift:</strong> model huấn luyện với ảnh
                  sạch trong lab, triển khai ngoài ruộng (nắng gắt, lá bẩn,
                  ngược sáng) tụt 10–20% accuracy. Luôn{" "}
                  <TopicLink slug="data-augmentation">
                    augment
                  </TopicLink>{" "}
                  với ảnh thực địa.
                </li>
                <li>
                  <strong>Sai lớp hiếm:</strong> 90% ảnh là &ldquo;khỏe&rdquo;,
                  model học &ldquo;luôn đoán khỏe&rdquo; vẫn đạt 90% accuracy
                  — nhưng vô dụng. Đánh giá bằng F1 hoặc recall trên mỗi lớp
                  bệnh.
                </li>
                <li>
                  <strong>Quên abstention:</strong> bắt model phải trả lời
                  khi không chắc → nông dân lĩnh kết quả sai → mất tiền
                  thuốc. Luôn có ngưỡng tự tin + top-k.
                </li>
                <li>
                  <strong>Quên hệ thống khuyến nông:</strong> AI không thay
                  bác sĩ cây trồng. App phải có đường dây nối nông dân với
                  chuyên gia cho case khó.
                </li>
              </ul>
            </ExplanationSection>
          </LessonSection>

          <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
            <MiniSummary
              points={[
                "4 ứng dụng: Phát hiện bệnh (CNN), Precision farming (sensors+AI), Dự báo năng suất, Robot thu hoạch.",
                "Edge AI bắt buộc: nông thôn không có internet ổn định → model chạy offline trên điện thoại.",
                "Precision farming: giảm 30-50% nước/thuốc/phân, tăng 15-25% năng suất.",
                "VN có lợi thế: nước nông nghiệp lớn, nhiều bài toán (lúa, cà phê, thuỷ sản) cần AI.",
                "Thách thức: internet nông thôn, data giống cây VN còn thiếu, nông dân cần app đơn giản.",
                "Abstention & Grad-CAM: khi AI không chắc, từ chối trả lời; khi chắc, chỉ rõ vùng bệnh để tạo niềm tin.",
              ]}
            />
          </LessonSection>

          <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
            <QuizSection questions={quizQuestions} />
          </LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
