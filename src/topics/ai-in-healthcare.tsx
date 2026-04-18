"use client";
import { useMemo, useState, useCallback } from "react";
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
  TopicLink,
  CollapsibleDetail,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "ai-in-healthcare",
  title: "AI in Healthcare",
  titleVi: "AI trong Y tế",
  description:
    "Ứng dụng AI trong chẩn đoán hình ảnh y khoa, phát triển thuốc và dự đoán bệnh",
  category: "applied-ai",
  tags: ["medical", "diagnosis", "drug-discovery"],
  difficulty: "beginner",
  relatedSlugs: ["image-classification", "cnn", "ai-for-science"],
  vizType: "interactive",
};

const TOTAL_STEPS = 7;

// ============================================================
// Viz dataset: simulated "X-ray scan" grid with ground-truth
// label for each pixel. Value = intensity of suspicious tissue.
// ============================================================
const GRID_ROWS = 14;
const GRID_COLS = 22;

type ScanCell = {
  row: number;
  col: number;
  intensity: number; // 0..1, AI's predicted "suspicious" probability
  truth: 0 | 1; // 1 = thực sự có tổn thương
};

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function buildScanGrid(seed: number): ScanCell[] {
  const rand = seededRandom(seed);
  const cells: ScanCell[] = [];
  // Place 2 "lesion" blobs as ground-truth positive clusters
  const blobs = [
    { r: 4, c: 7, radius: 2.6 },
    { r: 9, c: 15, radius: 2.1 },
  ];
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      let truthScore = 0;
      for (const blob of blobs) {
        const dr = r - blob.r;
        const dc = c - blob.c;
        const d = Math.sqrt(dr * dr + dc * dc);
        if (d < blob.radius) {
          truthScore = Math.max(truthScore, 1 - d / blob.radius);
        }
      }
      const truth: 0 | 1 = truthScore > 0.25 ? 1 : 0;
      // AI's predicted intensity = truth with noise
      const noise = (rand() - 0.5) * 0.35;
      const base = truth === 1 ? 0.55 + truthScore * 0.4 : 0.18 + rand() * 0.22;
      const intensity = Math.max(0, Math.min(1, base + noise));
      cells.push({ row: r, col: c, intensity, truth });
    }
  }
  return cells;
}

type Metrics = {
  tp: number;
  fp: number;
  fn: number;
  tn: number;
  sensitivity: number;
  specificity: number;
  ppv: number;
  npv: number;
  accuracy: number;
};

function computeMetrics(cells: ScanCell[], threshold: number): Metrics {
  let tp = 0;
  let fp = 0;
  let fn = 0;
  let tn = 0;
  for (const cell of cells) {
    const predicted = cell.intensity >= threshold ? 1 : 0;
    if (predicted === 1 && cell.truth === 1) tp += 1;
    else if (predicted === 1 && cell.truth === 0) fp += 1;
    else if (predicted === 0 && cell.truth === 1) fn += 1;
    else tn += 1;
  }
  const sensitivity = tp + fn === 0 ? 0 : tp / (tp + fn);
  const specificity = fp + tn === 0 ? 0 : tn / (fp + tn);
  const ppv = tp + fp === 0 ? 0 : tp / (tp + fp);
  const npv = tn + fn === 0 ? 0 : tn / (tn + fn);
  const accuracy = (tp + tn) / cells.length;
  return { tp, fp, fn, tn, sensitivity, specificity, ppv, npv, accuracy };
}

function intensityColor(intensity: number, flagged: boolean): string {
  if (flagged) {
    // red-orange spectrum for "AI flag"
    const g = Math.round(60 - intensity * 40);
    const b = Math.round(50 - intensity * 30);
    const r = Math.round(210 + intensity * 45);
    return `rgb(${r}, ${g}, ${b})`;
  }
  // grayscale "X-ray look"
  const v = Math.round(30 + intensity * 180);
  return `rgb(${v}, ${v}, ${Math.min(255, v + 10)})`;
}

// ============================================================
// The visualization component: threshold slider + live metrics
// ============================================================
function DiagnosticScanViz() {
  const [threshold, setThreshold] = useState(0.5);
  const [seed, setSeed] = useState(7);
  const [showTruth, setShowTruth] = useState(false);

  const cells = useMemo(() => buildScanGrid(seed), [seed]);
  const metrics = useMemo(
    () => computeMetrics(cells, threshold),
    [cells, threshold],
  );

  const reshuffle = useCallback(() => {
    setSeed((s) => (s + 17) % 9973);
  }, []);

  const cellWidth = 28;
  const cellHeight = 26;
  const gridWidth = GRID_COLS * cellWidth;
  const gridHeight = GRID_ROWS * cellHeight;

  const totalPositives = metrics.tp + metrics.fn;
  const totalNegatives = metrics.fp + metrics.tn;

  const applyScenario = useCallback((scenario: Scenario) => {
    setThreshold(scenario.suggestedTau);
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {SCENARIOS.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            onClick={() => applyScenario(scenario)}
            className="group rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-left text-xs text-slate-200 transition hover:border-amber-400 hover:bg-slate-800"
            title={scenario.description}
          >
            <span className="block font-semibold text-slate-100">
              {scenario.label}
            </span>
            <span className="block text-[10px] text-slate-500 group-hover:text-slate-300">
              τ ≈ {scenario.suggestedTau.toFixed(2)} ·{" "}
              {scenario.priority === "sensitivity"
                ? "ưu tiên bắt ca"
                : scenario.priority === "specificity"
                  ? "ưu tiên đúng"
                  : "cân bằng"}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-200">
            Mô phỏng AI đọc X-ray / CT
          </h4>
          <p className="text-xs text-slate-400">
            Mỗi ô = 1 vùng điểm ảnh. Cường độ = AI dự đoán khả năng có tổn
            thương.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={reshuffle}
            className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
          >
            Tạo ca mới
          </button>
          <button
            type="button"
            onClick={() => setShowTruth((s) => !s)}
            className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
          >
            {showTruth ? "Ẩn" : "Hiện"} ground-truth
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
          <svg
            viewBox={`0 0 ${gridWidth} ${gridHeight + 30}`}
            className="w-full"
          >
            {/* title */}
            <text
              x={gridWidth / 2}
              y={16}
              textAnchor="middle"
              fill="#e2e8f0"
              fontSize={11}
              fontWeight={600}
            >
              Ngưỡng phát hiện τ = {threshold.toFixed(2)}
            </text>

            {/* grid cells */}
            {cells.map((cell) => {
              const flagged = cell.intensity >= threshold;
              const x = cell.col * cellWidth;
              const y = 30 + cell.row * cellHeight;
              const color = intensityColor(cell.intensity, flagged);
              const truthStroke =
                showTruth && cell.truth === 1 ? "#22c55e" : "transparent";
              return (
                <motion.rect
                  key={`${cell.row}-${cell.col}`}
                  x={x + 1}
                  y={y + 1}
                  width={cellWidth - 2}
                  height={cellHeight - 2}
                  rx={3}
                  initial={false}
                  animate={{ fill: color }}
                  transition={{ duration: 0.15 }}
                  stroke={truthStroke}
                  strokeWidth={showTruth && cell.truth === 1 ? 1.5 : 0}
                />
              );
            })}

            {/* overlay: flagged border for quick scan */}
            {cells
              .filter((c) => c.intensity >= threshold)
              .map((cell) => {
                const x = cell.col * cellWidth;
                const y = 30 + cell.row * cellHeight;
                return (
                  <rect
                    key={`flag-${cell.row}-${cell.col}`}
                    x={x + 1}
                    y={y + 1}
                    width={cellWidth - 2}
                    height={cellHeight - 2}
                    rx={3}
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth={0.8}
                    opacity={0.6}
                  />
                );
              })}
          </svg>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
          <div>
            <label
              htmlFor="threshold-slider"
              className="flex items-center justify-between text-xs text-slate-300"
            >
              <span>Ngưỡng τ</span>
              <span className="font-mono text-slate-100">
                {threshold.toFixed(2)}
              </span>
            </label>
            <input
              id="threshold-slider"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="mt-2 w-full accent-amber-400"
            />
            <div className="mt-1 flex justify-between text-[10px] text-slate-500">
              <span>0 (báo tất cả)</span>
              <span>1 (không báo)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <MetricCard label="Sensitivity" value={metrics.sensitivity} color="#22c55e" />
            <MetricCard label="Specificity" value={metrics.specificity} color="#3b82f6" />
            <MetricCard label="PPV" value={metrics.ppv} color="#f59e0b" />
            <MetricCard label="NPV" value={metrics.npv} color="#8b5cf6" />
          </div>

          <div className="rounded-md bg-slate-900/60 p-2 text-[11px] leading-relaxed text-slate-300">
            <div className="flex justify-between">
              <span className="text-emerald-400">TP</span>
              <span>{metrics.tp}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-400">FP</span>
              <span>{metrics.fp}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-300">FN</span>
              <span>{metrics.fn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">TN</span>
              <span>{metrics.tn}</span>
            </div>
            <div className="mt-1 border-t border-slate-800 pt-1 text-slate-400">
              Tổng +: {totalPositives} &middot; Tổng −: {totalNegatives}
            </div>
          </div>

          <div className="text-[11px] text-slate-400">
            Accuracy:{" "}
            <span className="font-mono text-slate-100">
              {(metrics.accuracy * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      <ThresholdNarrative threshold={threshold} metrics={metrics} />
    </div>
  );
}

function MetricCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      className="rounded-md border px-2 py-1.5"
      style={{ borderColor: `${color}55`, backgroundColor: `${color}14` }}
    >
      <div className="text-[10px] uppercase tracking-wide" style={{ color }}>
        {label}
      </div>
      <div className="font-mono text-sm text-slate-100">
        {(value * 100).toFixed(1)}%
      </div>
    </div>
  );
}

// ============================================================
// Preset scenarios — allow learners to jump between common
// clinical scenarios (screening, emergency, confirmatory).
// ============================================================
type Scenario = {
  id: string;
  label: string;
  description: string;
  suggestedTau: number;
  priority: "sensitivity" | "specificity" | "balance";
};

const SCENARIOS: Scenario[] = [
  {
    id: "screening",
    label: "Sàng lọc cộng đồng",
    description:
      "Prevalence thấp, chi phí bỏ sót cao (ung thư giai đoạn sớm). Ưu tiên sensitivity.",
    suggestedTau: 0.35,
    priority: "sensitivity",
  },
  {
    id: "emergency",
    label: "Cấp cứu — đột quỵ",
    description:
      "Thời gian là não. AI flag nhanh các ca nghi stroke để bác sĩ ưu tiên review.",
    suggestedTau: 0.42,
    priority: "sensitivity",
  },
  {
    id: "balanced",
    label: "Routine clinical",
    description:
      "Ca thăm khám thông thường, cân bằng giữa bỏ sót và báo nhầm.",
    suggestedTau: 0.55,
    priority: "balance",
  },
  {
    id: "confirm",
    label: "Test khẳng định",
    description:
      "Bước sau cùng trước can thiệp (sinh thiết, phẫu thuật). Ưu tiên specificity.",
    suggestedTau: 0.72,
    priority: "specificity",
  },
];

function ThresholdNarrative({
  threshold,
  metrics,
}: {
  threshold: number;
  metrics: Metrics;
}) {
  let headline = "";
  let tone = "text-slate-300";
  if (threshold < 0.25) {
    headline =
      "Ngưỡng quá thấp → AI 'hoảng loạn', báo động ở khắp nơi. Sensitivity cao nhưng Specificity sập: quá nhiều false positive, bác sĩ mất niềm tin.";
    tone = "text-rose-300";
  } else if (threshold < 0.45) {
    headline =
      "Ngưỡng thấp → Ưu tiên KHÔNG bỏ sót (screening). Phù hợp cho ung thư giai đoạn sớm, nhưng cần bác sĩ lọc lại false positive.";
    tone = "text-amber-300";
  } else if (threshold < 0.65) {
    headline =
      "Ngưỡng cân bằng → Sensitivity và Specificity tương đối đều. Đây là khu vực 'sweet spot' cho hầu hết ca clinical thông thường.";
    tone = "text-emerald-300";
  } else if (threshold < 0.85) {
    headline =
      "Ngưỡng cao → Ưu tiên KHÔNG báo nhầm. Khi AI nói 'có bệnh' → rất có khả năng đúng (PPV cao). Phù hợp với test confirm, không phải screening.";
    tone = "text-sky-300";
  } else {
    headline =
      "Ngưỡng quá cao → AI gần như không báo gì. Sensitivity sập: bỏ sót ung thư thật. Đây là lỗi nguy hiểm nhất trong y tế.";
    tone = "text-rose-300";
  }
  return (
    <div className={`text-xs leading-relaxed ${tone}`}>
      <span className="font-semibold">Quan sát: </span>
      {headline}
      <span className="ml-2 text-slate-500">
        (TP={metrics.tp}, FP={metrics.fp}, FN={metrics.fn})
      </span>
    </div>
  );
}

// ============================================================
// Component
// ============================================================
export default function AIInHealthcareTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          "AI chẩn đoán X-ray phổi đạt accuracy 95%, bác sĩ 90%. Nên thay bác sĩ bằng AI?",
        options: [
          "Có — AI chính xác hơn",
          "KHÔNG — AI hỗ trợ bác sĩ (AI + bác sĩ = 98%), không thay thế. Bác sĩ hiểu context, bệnh sử, tình trạng toàn diện mà AI không thấy từ 1 tấm X-ray",
          "Tuỳ bệnh viện",
        ],
        correct: 1,
        explanation:
          "AI mạnh ở: phát hiện patterns trong ảnh nhanh, không mệt mỏi, consistent. Bác sĩ mạnh ở: hiểu context (triệu chứng, bệnh sử, thuốc đang dùng), giao tiếp bệnh nhân, quyết định phức tạp. AI + Bác sĩ = tốt nhất: AI lọc và highlight, bác sĩ quyết định cuối cùng.",
      },
      {
        question: "AlphaFold giải quyết vấn đề gì trong y tế?",
        options: [
          "Chẩn đoán bệnh",
          "Dự đoán cấu trúc 3D protein → hiểu cách protein tương tác → thiết kế thuốc nhắm đúng target",
          "Phân tích X-ray",
        ],
        correct: 1,
        explanation:
          "Thuốc hoạt động bằng cách gắn vào protein (như chìa khoá vào ổ khoá). Cần biết hình dạng protein (ổ khoá) để thiết kế thuốc (chìa khoá). AlphaFold dự đoán cấu trúc 200M+ protein → drug designers biết chính xác 'ổ khoá' cần nhắm. Giảm 50-70% thời gian drug discovery.",
      },
      {
        question: "Thách thức lớn nhất của AI y tế tại Việt Nam?",
        options: [
          "Thiếu GPU",
          "DATA: ít data có nhãn chất lượng, data không chuẩn hoá giữa bệnh viện, privacy concerns (PDPA)",
          "AI không tốt cho tiếng Việt",
        ],
        correct: 1,
        explanation:
          "Data là rào cản lớn nhất: (1) Ít bệnh viện có digital records chuẩn, (2) Labels cần bác sĩ chuyên khoa (đắt, chậm), (3) Data nhạy cảm (cần anonymize). (4) Mỗi bệnh viện format khác nhau (không interoperable). VinAI, FPT AI đang làm nhưng còn nhiều thách thức.",
      },
      {
        type: "fill-blank",
        question:
          "Hai ứng dụng nổi bật nhất của AI y tế là hỗ trợ {blank} bệnh qua phân tích triệu chứng và phân tích hình ảnh từ {blank} y khoa (X-quang, CT, MRI).",
        blanks: [
          { answer: "chẩn đoán", accept: ["diagnosis", "chẩn đoán bệnh", "chan doan"] },
          {
            answer: "hình ảnh",
            accept: ["imaging", "hinh anh", "ảnh y khoa", "medical imaging"],
          },
        ],
        explanation:
          "Medical imaging AI (CheXNet, VinDr-CXR) dùng CNN phân tích X-quang/CT/MRI phát hiện bệnh. Kết hợp với LLM để tóm tắt bệnh án và hỗ trợ chẩn đoán. Luôn có bác sĩ review quyết định cuối cùng.",
      },
      {
        question:
          "Khi giảm ngưỡng phát hiện τ xuống rất thấp, điều gì XẢY RA với sensitivity và specificity?",
        options: [
          "Cả hai tăng",
          "Sensitivity tăng (bắt được nhiều ca bệnh hơn), nhưng Specificity giảm (nhiều false alarm hơn)",
          "Cả hai giảm",
        ],
        correct: 1,
        explanation:
          "Giảm τ → AI 'nhạy cảm' hơn, dễ gọi 1 → bắt được nhiều positive thật (sensitivity ↑) nhưng cũng gọi nhầm nhiều negative (specificity ↓). Đây là trade-off cơ bản của mọi binary classifier — thể hiện qua ROC curve.",
      },
      {
        question:
          "Bạn thiết kế AI sàng lọc ung thư vú dân số — prevalence 0.5%. Nên ưu tiên metric nào?",
        options: [
          "PPV cao nhất",
          "SENSITIVITY cao (không bỏ sót ca bệnh), chấp nhận false positive và confirm lại bằng mammography / biopsy",
          "Accuracy cao",
        ],
        correct: 1,
        explanation:
          "Screening toàn dân: chi phí bỏ sót > chi phí false alarm. Ưu tiên sensitivity. Ca FP sẽ được lọc tiếp ở bước 2 (bác sĩ / sinh thiết). Chỉ accuracy thôi sẽ đánh lừa vì prevalence quá thấp — model nói 'không bệnh' cho tất cả vẫn đạt accuracy 99.5%.",
      },
      {
        question: "Grad-CAM trong AI y tế được dùng để làm gì?",
        options: [
          "Tăng tốc inference",
          "Tạo heatmap CHỈ RA vùng ảnh mà model dựa vào để quyết định → bác sĩ kiểm chứng explanation",
          "Giảm kích thước model",
        ],
        correct: 1,
        explanation:
          "Grad-CAM (Gradient-weighted Class Activation Mapping) overlay heatmap lên ảnh gốc, highlight vùng model chú ý. Nếu model nói 'pneumonia' nhưng heatmap chỉ vào text timestamp → đó là shortcut bug, không tin được. Explainability là yêu cầu pháp lý với AI y tế.",
      },
      {
        question:
          "Bệnh viện A train AI trên 10k X-ray nội bộ. Triển khai ở bệnh viện B accuracy tụt 15%. Nguyên nhân chính?",
        options: [
          "Bác sĩ bệnh viện B kém hơn",
          "Domain shift: máy X-ray khác thương hiệu, protocol chụp khác, phân bố bệnh khác — model không generalize",
          "GPU bệnh viện B chậm",
        ],
        correct: 1,
        explanation:
          "Distribution shift là vấn đề kinh điển của AI y tế. Giải pháp: (1) train trên data đa bệnh viện, (2) domain adaptation, (3) external validation trước triển khai, (4) monitor performance sau deploy. Đây là lý do FDA yêu cầu 'real-world evidence'.",
      },
    ],
    [],
  );

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bệnh viện tại Việt Nam có 1 bác sĩ X-quang cho 500 bệnh nhân/ngày. Mỗi phim cần 5 phút đọc. 500 x 5 = 2500 phút = 41 giờ. Giải pháp?"
          options={[
            "Thuê thêm 4 bác sĩ",
            "AI lọc phim: 80% bình thường → AI confirm nhanh (2s). 20% nghi ngờ → bác sĩ đọc kỹ. Bác sĩ chỉ cần đọc 100 phim thay vì 500",
            "Bệnh nhân tự đọc phim",
          ]}
          correct={1}
          explanation="AI triage: lọc phim nhanh, phân loại bình thường/nghi ngờ. Bác sĩ chỉ đọc phim nghi ngờ (20%) và double-check random normal (5%). Từ 500 phim/ngày xuống 125 phim → bác sĩ có thời gian đọc kỹ hơn, giảm sai sót. VinAI đã phát triển hệ thống tương tự cho bệnh viện Việt Nam."
        >
          <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
            <VisualizationSection>
              <DiagnosticScanViz />
            </VisualizationSection>

            <Callout variant="tip" title="Cách đọc visualization">
              Kéo thanh trượt <span className="font-mono">τ</span> để thay đổi
              ngưỡng quyết định của AI. Các ô bị &quot;tô vàng&quot; là vùng
              AI đánh dấu nghi ngờ. Bật ground-truth để thấy vùng tổn thương
              thật (viền xanh). Quan sát Sensitivity ↔ Specificity đổi chiều
              khi bạn đẩy ngưỡng lên xuống.
            </Callout>
          </LessonSection>

          <LessonSection
            step={3}
            totalSteps={TOTAL_STEPS}
            label="Khoảnh khắc Aha"
          >
            <AhaMoment>
              <p>
                AI không thay thế bác sĩ — nó làm bác sĩ{" "}
                <strong>mạnh hơn</strong>. AI + Bác sĩ ={" "}
                <strong>98% accuracy</strong> (AI đơn: 95%, Bác sĩ đơn: 90%).
                Giống kính hiển vi không thay thế nhà khoa học nhưng giúp{" "}
                <strong>nhìn rõ hơn</strong>. Tại Việt Nam: VinAI, FPT AI đang
                phát triển AI y tế cho X-ray, pathology, drug repurposing.
              </p>
              <p>
                Điểm sâu hơn: <strong>ngưỡng quyết định</strong> không phải
                lựa chọn kỹ thuật — nó là lựa chọn <em>đạo đức</em>. Hạ τ =
                ưu tiên bệnh nhân (không bỏ sót) nhưng tăng gánh nặng review.
                Nâng τ = ưu tiên bác sĩ (ít báo nhầm) nhưng chấp nhận bỏ sót
                ca khó. Cùng model, ngưỡng khác → hệ thống y tế khác.
              </p>
            </AhaMoment>
          </LessonSection>

          <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
            <InlineChallenge
              question="AI phát hiện ung thư phổi từ CT scan. Sensitivity 98% (bắt 98% ung thư), Specificity 90% (10% false alarm). 1000 bệnh nhân, 10 có ung thư. Bao nhiêu false positive?"
              options={[
                "10 người",
                "99 người: 990 không ung thư x 10% false alarm = 99 false positive. Mặc dù sensitivity cao nhưng NHIỀU false alarm vì prevalence thấp",
                "0 người",
              ]}
              correct={1}
              explanation="Base rate problem! 10 ung thư x 98% sensitivity = ~10 true positive. 990 khoẻ x 10% false alarm = 99 false positive. Tổng: 109 người 'dương tính' nhưng chỉ 10 thực sự bệnh. PPV = 10/109 = 9.2%. Đây là lý do screening cần 2 bước: AI lọc → bác sĩ confirm."
            />

            <InlineChallenge
              question="Một AI da liễu đạt 92% accuracy trên data training. Trước khi triển khai, bác sĩ cần kiểm tra điều gì QUAN TRỌNG NHẤT?"
              options={[
                "Tốc độ inference",
                "Fairness: AI có hoạt động tốt trên MỌI tông da không? Nhiều dataset thiếu tông da tối → AI fail với bệnh nhân da tối",
                "Kích thước model",
              ]}
              correct={1}
              explanation="Nghiên cứu nổi tiếng (Adamson & Smith 2018): AI ung thư da train chủ yếu trên da sáng → sensitivity tụt nghiêm trọng với da tối. Đây là bài học về bias trong y tế — accuracy trung bình giấu đi fail mode theo từng nhóm dân số."
            />

            <InlineChallenge
              question="Bệnh viện muốn deploy AI chẩn đoán COVID từ CT. Bộ Y tế yêu cầu gì?"
              options={[
                "Chỉ cần accuracy cao",
                "Validation lâm sàng (prospective trial), explainability, giám sát hậu kiểm, khung pháp lý medical device (class II/III)",
                "Không cần gì",
              ]}
              correct={1}
              explanation="AI y tế = medical device. Cần: (1) clinical validation với cohort đủ lớn, (2) explainability để bác sĩ kiểm chứng, (3) post-market surveillance phát hiện drift, (4) regulatory approval. FDA, CE, và Bộ Y tế Việt Nam đều có quy trình tương tự."
            />
          </LessonSection>

          <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
            <ExplanationSection>
              <p>
                <strong>AI in Healthcare</strong> ứng dụng AI hỗ trợ{" "}
                <TopicLink slug="image-classification">
                  chẩn đoán hình ảnh
                </TopicLink>
                , phát triển thuốc, và dự đoán bệnh — luôn dùng cạnh bác sĩ,
                không thay thế. Do quyết định ảnh hưởng tính mạng, AI y tế bắt
                buộc phải có{" "}
                <TopicLink slug="explainability">explainability</TopicLink>{" "}
                (ví dụ Grad-CAM để chỉ ra vùng lá phổi bất thường).
              </p>

              <p>
                <strong>Medical Image Analysis:</strong>
              </p>
              <LaTeX block>
                {
                  "P(\\text{disease}|\\text{image}) = \\text{CNN}(\\text{X-ray/CT/MRI}) \\quad \\text{(classification/segmentation)}"
                }
              </LaTeX>

              <p>
                <strong>Bayes cho screening:</strong>
              </p>
              <LaTeX block>
                {
                  "\\text{PPV} = \\frac{\\text{Sensitivity} \\times \\text{Prevalence}}{\\text{Sensitivity} \\times \\text{Prevalence} + (1-\\text{Specificity}) \\times (1-\\text{Prevalence})}"
                }
              </LaTeX>

              <p>
                <strong>Ngưỡng quyết định τ:</strong> AI output là xác suất
                liên tục P(disease|image) ∈ [0,1]. Để biến thành quyết định
                &quot;có bệnh / không bệnh&quot; ta cần ngưỡng τ:
              </p>
              <LaTeX block>
                {
                  "\\hat{y} = \\begin{cases} 1 & \\text{nếu } P \\geq \\tau \\\\ 0 & \\text{ngược lại} \\end{cases}"
                }
              </LaTeX>

              <p>
                Lựa chọn τ = lựa chọn giữa hai loại lỗi: <em>false negative</em>{" "}
                (bỏ sót ca bệnh — có thể chết người) và{" "}
                <em>false positive</em> (báo nhầm — gây lo âu, xét nghiệm thừa,
                tốn kém). ROC curve vẽ toàn bộ trade-off; AUC đo chất lượng
                tổng thể của model.
              </p>

              <Callout variant="warning" title="Regulatory">
                AI y tế cần FDA approval (Mỹ), CE marking (EU), hoặc tương
                đương. Không thể deploy AI chẩn đoán mà không có chứng nhận.
                Tại Việt Nam: Bộ Y tế đang xây dựng khung pháp lý cho AI
                medical devices. Các tiêu chuẩn đang tham khảo: IEC 62304,
                ISO 13485, ISO 14971, và hướng dẫn GMLP (Good Machine Learning
                Practice) của FDA.
              </Callout>

              <Callout variant="insight" title="Vì sao ngưỡng KHÁC NHAU giữa các khoa?">
                Cùng một model, khoa cấp cứu có thể đặt τ thấp (ưu tiên không
                bỏ sót ca tim mạch), trong khi khoa sàng lọc di truyền đặt τ
                cao (ưu tiên không gây hoảng loạn cho gia đình). Điều này gọi
                là <em>decision curve analysis</em> — chọn τ theo utility,
                không phải accuracy.
              </Callout>

              <CodeBlock language="python" title="AI X-ray classification">
                {`import torch
from torchvision import models, transforms

# Fine-tune pretrained model cho X-ray classification
model = models.resnet50(pretrained=True)
model.fc = torch.nn.Linear(2048, 14)  # 14 findings (CheXpert)

# Preprocessing X-ray
transform = transforms.Compose([
    transforms.Resize(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485], [0.229]),
])

# Inference
model.eval()
with torch.no_grad():
    output = model(xray_image)
    probs = torch.sigmoid(output)  # Multi-label probabilities

# Output: P(pneumonia)=0.85, P(effusion)=0.12, ...
# Bác sĩ review cases có P > threshold
# AI + Bác sĩ = 98% accuracy`}
              </CodeBlock>

              <p>
                <strong>ROC curve</strong> là công cụ trực quan nhất để nhìn
                tổng thể trade-off. Trục X: 1 − specificity (false positive
                rate). Trục Y: sensitivity (true positive rate). Mỗi điểm =
                một lựa chọn τ. Đường chéo = model ngẫu nhiên (AUC = 0.5).
                Đường cong càng gần góc trái trên → model càng tốt (AUC → 1).
                Bác sĩ và kỹ sư AI nên đọc curve cùng nhau để chọn operating
                point phù hợp với context lâm sàng, không phải để ý chỉ số
                AUC tổng thể.
              </p>

              <p>
                <strong>Calibration</strong> quan trọng không kém accuracy.
                Model calibrated tốt: khi nó nói &quot;P = 0.7&quot;, thì
                trong 100 ca như vậy, ~70 ca thực sự có bệnh. Nhiều model
                deep learning overconfident (nói 0.95 nhưng chỉ 0.6 đúng) —
                temperature scaling hoặc Platt scaling là các cách hiệu chỉnh.
                Trong y tế, calibration đặc biệt quan trọng vì bác sĩ dùng
                xác suất để quyết định can thiệp nặng hay nhẹ.
              </p>

              <CodeBlock
                language="python"
                title="Chọn ngưỡng bằng Youden's J + báo cáo metrics"
              >
                {`import numpy as np
from sklearn.metrics import roc_curve, confusion_matrix

# y_true: nhãn thật (0/1), y_prob: xác suất AI dự đoán
fpr, tpr, thresholds = roc_curve(y_true, y_prob)

# Youden's J = sensitivity + specificity - 1
# Điểm ngưỡng tối ưu = argmax(tpr - fpr)
J = tpr - fpr
idx = int(np.argmax(J))
tau_opt = thresholds[idx]
print(f"Ngưỡng tối ưu: τ = {tau_opt:.3f}")

# Tính metrics với τ_opt
y_pred = (y_prob >= tau_opt).astype(int)
tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()

sensitivity = tp / (tp + fn)
specificity = tn / (tn + fp)
ppv = tp / (tp + fp) if (tp + fp) else 0.0
npv = tn / (tn + fn) if (tn + fn) else 0.0

print(f"Sensitivity: {sensitivity:.3f}")
print(f"Specificity: {specificity:.3f}")
print(f"PPV: {ppv:.3f}  NPV: {npv:.3f}")

# Trong screening toàn dân, ta thường dùng "cost-sensitive threshold":
# τ* = argmin (C_FN * FN + C_FP * FP)
# với C_FN >> C_FP vì bỏ sót ung thư đắt hơn báo nhầm nhiều lần.`}
              </CodeBlock>

              <p>
                <strong>Federated learning cho bệnh viện:</strong> thay vì
                gửi data bệnh nhân đến 1 trung tâm training, mỗi bệnh viện
                train model cục bộ trên data của mình và chỉ gửi
                <em> gradient</em> (hoặc weight update) về server trung tâm.
                Server gộp update thành model chung. Điều này giải quyết
                đồng thời: (1) privacy (data không rời bệnh viện), (2)
                compliance (HIPAA, GDPR, PDPA), (3) scale (tận dụng data từ
                nhiều nơi mà không chuyển dời). NVIDIA Clara, OpenFL,
                PySyft là các framework phổ biến.
              </p>

              <p>
                <strong>Synthetic data & augmentation:</strong> sinh ảnh y tế
                nhân tạo bằng GAN hoặc diffusion model để tăng data training.
                Hữu ích khi dataset hiếm (bệnh hiếm, ca nặng). Tuy nhiên
                chất lượng synthetic data phải được validate nghiêm ngặt —
                đã có ca synthetic CT gây hallucination ở model downstream.
                Phương pháp an toàn hơn: chỉ dùng augmentation truyền thống
                (crop, rotation ±5°, intensity shift) và mixup/cutmix.
              </p>

              <Callout variant="info" title="AI Y tế tại Việt Nam">
                VinAI: AI X-ray (VinDr-CXR), pathology (VinDr-Mammo). FPT AI:
                chatbot y tế. Bệnh viện 108, Bạch Mai đang pilot AI chẩn đoán.
                Thách thức: data chuẩn hoá, privacy (PDPA), regulatory
                framework còn mới. Các dataset mở do VinAI công bố (VinDr-CXR,
                VinDr-Mammo, VinDr-Spine) là đóng góp đáng kể cho cộng đồng y
                tế toàn cầu — lần đầu có tập dữ liệu X-quang / mammogram chất
                lượng cao từ Đông Nam Á.
              </Callout>

              <Callout variant="tip" title="Drug discovery với AlphaFold">
                Trước AlphaFold: xác định cấu trúc 3D của 1 protein mất 1–3
                năm (X-ray crystallography / cryo-EM). Sau AlphaFold: vài giây
                CPU. Hệ quả: có thể screen hàng triệu drug candidate in silico
                trước khi tổng hợp, tập trung tài nguyên wet-lab vào ứng viên
                hứa hẹn nhất. Isomorphic Labs (sister của DeepMind) đang hợp
                tác với Novartis, Eli Lilly đẩy nhanh pipeline.
              </Callout>

              <CollapsibleDetail title="Chi tiết: Pipeline triển khai AI y tế">
                <p>
                  Một pipeline thực tế cho AI chẩn đoán hình ảnh gồm các giai
                  đoạn:
                </p>
                <ol className="list-decimal pl-5">
                  <li>
                    <strong>Data collection:</strong> thu thập ảnh từ PACS
                    (Picture Archiving and Communication System), gỡ danh
                    tính (DICOM anonymization), chuẩn hoá về định dạng thống
                    nhất.
                  </li>
                  <li>
                    <strong>Annotation:</strong> bác sĩ chuyên khoa đánh nhãn
                    — thường cần ≥2 người đọc độc lập + bác sĩ thứ ba giải
                    quyết bất đồng. Inter-rater agreement (Cohen&apos;s κ) &gt;
                    0.7 là yêu cầu tối thiểu.
                  </li>
                  <li>
                    <strong>Model training:</strong> fine-tune backbone (ResNet,
                    EfficientNet, ViT) trên data y tế. Data augmentation phải
                    phù hợp miền (không flip ngang X-ray — tim bên trái!).
                  </li>
                  <li>
                    <strong>Internal validation:</strong> holdout set cùng
                    bệnh viện, cross-validation.
                  </li>
                  <li>
                    <strong>External validation:</strong> test trên data từ
                    bệnh viện khác → xác nhận model generalize.
                  </li>
                  <li>
                    <strong>Prospective clinical trial:</strong> deploy silent
                    mode (AI chạy nhưng không ảnh hưởng quyết định) trong vài
                    tháng, so sánh với bác sĩ.
                  </li>
                  <li>
                    <strong>Regulatory submission:</strong> FDA 510(k) hoặc De
                    Novo, CE, Bộ Y tế. Bao gồm risk management file, clinical
                    evaluation report.
                  </li>
                  <li>
                    <strong>Post-market surveillance:</strong> monitor drift,
                    collect outcome data, retrain định kỳ. Cả FDA và EU đều
                    yêu cầu.
                  </li>
                </ol>
                <p>
                  Mỗi bước có thể mất vài tháng đến vài năm. Đây là lý do AI
                  y tế tuy hứa hẹn nhưng deployment thực tế chậm hơn AI tiêu
                  dùng rất nhiều.
                </p>
              </CollapsibleDetail>

              <p>
                <strong>Segmentation vs Classification:</strong> nhiều ca AI
                y tế không chỉ phân loại &quot;có/không bệnh&quot; mà cần
                khoanh vùng tổn thương pixel-level. Đây là bài toán
                segmentation — U-Net là kiến trúc kinh điển, TransUNet và
                nnU-Net là các biến thể hiện đại. Với 3D CT/MRI, 3D U-Net xử
                lý volume nguyên khối thay vì từng slice riêng.
              </p>

              <p>
                <strong>Công thức Dice coefficient — metric chính cho
                segmentation:</strong>
              </p>
              <LaTeX block>
                {
                  "\\text{Dice}(A, B) = \\frac{2 |A \\cap B|}{|A| + |B|} \\in [0, 1]"
                }
              </LaTeX>
              <p>
                Dice 0.9 = vùng AI khoanh trùng 90% với vùng bác sĩ khoanh.
                Trong radiology, Dice ≥ 0.8 thường được xem là &quot;gần
                ngang bác sĩ&quot;, nhưng với tổn thương rất nhỏ (đốm 3mm)
                ngưỡng có thể thấp hơn vì sai lệch vài pixel cũng kéo Dice
                xuống mạnh.
              </p>

              <CollapsibleDetail title="Góc nhìn đạo đức & triết học">
                <p>
                  AI y tế đặt ra các câu hỏi không có câu trả lời kỹ thuật
                  thuần tuý:
                </p>
                <ul className="list-disc pl-5">
                  <li>
                    <strong>Ai chịu trách nhiệm khi AI sai?</strong> Bác sĩ ký
                    tên? Nhà sản xuất AI? Bệnh viện? Hiện tại: bác sĩ chịu
                    trách nhiệm cuối cùng → vì vậy AI phải explainable để bác
                    sĩ có thể override có cơ sở.
                  </li>
                  <li>
                    <strong>AI có nên nói với bệnh nhân nguy cơ ung thư
                    trước bác sĩ?</strong> Câu trả lời tại hầu hết hệ thống y
                    tế: không. Thông tin y tế cần được truyền đạt với context
                    và empathy.
                  </li>
                  <li>
                    <strong>Fairness giữa nhóm dân số:</strong> nếu model
                    hoạt động tốt với dân số A nhưng kém với dân số B, deploy
                    hay không? Không deploy = từ chối lợi ích cho A. Deploy =
                    làm xấu tình trạng B. Đây là đánh đổi công bằng thật.
                  </li>
                  <li>
                    <strong>Quyền riêng tư vs lợi ích nghiên cứu:</strong> dữ
                    liệu y tế có giá trị nghiên cứu khổng lồ, nhưng cũng cực
                    kỳ nhạy cảm. Federated learning và differential privacy
                    đang là hướng giải.
                  </li>
                </ul>
              </CollapsibleDetail>

              <p>
                <strong>Active learning cho annotation:</strong> bác sĩ là
                nguồn lực đắt nhất trong pipeline AI y tế — 1 bác sĩ chuyên
                khoa có thể tốn 5–15 phút cho 1 ảnh phức tạp. Active learning
                giúp giảm annotation cost bằng cách để model chọn ảnh có
                uncertainty cao nhất (Bayesian Deep Learning, MC Dropout,
                Ensemble disagreement) để bác sĩ annotate trước. Theo thứ
                tự này, 30% annotation có thể đạt accuracy bằng 100%
                annotation random.
              </p>

              <p>
                <strong>Uncertainty quantification:</strong> ngoài xác suất
                điểm, model có thể trả về khoảng tin cậy
                (confidence interval). Khi uncertainty cao → chuyển ca cho
                bác sĩ, không để AI quyết. Đây là pattern &quot;defer to
                human&quot; — AI xử lý ca dễ, bác sĩ xử lý ca khó. Các
                phương pháp: deep ensemble, MC dropout, conformal prediction.
              </p>

              <p>
                <strong>Multi-modal learning:</strong> bệnh nhân thực tế có
                X-ray + báo cáo radiology + lịch sử bệnh + xét nghiệm máu +
                EHR. AI dùng được tất cả sẽ mạnh hơn AI chỉ dùng 1 nguồn.
                Các kiến trúc phổ biến: late fusion (mỗi modality có encoder
                riêng, concat feature trước classifier), cross-attention
                (transformer attend giữa modality), và foundation model đa
                phương thức (như BiomedGPT, LLaVA-Med).
              </p>

              <CollapsibleDetail title="So sánh các kiến trúc CNN y tế">
                <p>
                  Các backbone thường dùng trong chẩn đoán hình ảnh, xếp
                  theo mức phổ biến và đặc tính:
                </p>
                <ul className="list-disc pl-5 leading-relaxed">
                  <li>
                    <strong>ResNet-50 / ResNet-101:</strong> xương sống cổ
                    điển, dễ fine-tune, nhiều pretrained weight. Vẫn là
                    baseline được dùng phổ biến trong các paper radiology.
                  </li>
                  <li>
                    <strong>DenseNet-121:</strong> kiến trúc của CheXNet gốc
                    (Stanford, 2017). Feature reuse tốt, parameter-efficient.
                    Phù hợp khi data vừa phải.
                  </li>
                  <li>
                    <strong>EfficientNet (B0-B7):</strong> compound scaling,
                    cho accuracy cao hơn ResNet với ít parameter hơn. Được
                    dùng nhiều ở các bệnh viện cần deploy trên edge.
                  </li>
                  <li>
                    <strong>ViT (Vision Transformer) &amp; Swin:</strong>
                    transformer-based, tốt khi có nhiều data (&gt;100k
                    ảnh). Global context tốt hơn CNN, nhưng cần pretrain lớn
                    (ImageNet-21k hoặc JFT).
                  </li>
                  <li>
                    <strong>U-Net &amp; nnU-Net:</strong> chuẩn de facto cho
                    segmentation. nnU-Net tự động chọn hyperparameter dựa
                    trên dataset — đạt SOTA trên nhiều benchmark mà không
                    cần tuning.
                  </li>
                  <li>
                    <strong>MedCLIP / BiomedCLIP:</strong> foundation model
                    y tế đa phương thức (image + text). Zero-shot
                    classification tốt, dùng làm feature extractor cho
                    downstream tasks.
                  </li>
                  <li>
                    <strong>SAM (Segment Anything) + MedSAM:</strong> model
                    segmentation promptable, fine-tune cho y tế. Rất hứa hẹn
                    để bác sĩ interact với AI qua click / bounding box.
                  </li>
                </ul>
              </CollapsibleDetail>

              <CollapsibleDetail title="Các dataset y tế mở nổi tiếng">
                <ul className="list-disc pl-5 leading-relaxed">
                  <li>
                    <strong>CheXpert (Stanford, 2019):</strong> 224k X-quang
                    ngực, 14 nhãn phát hiện (pneumonia, pneumothorax, pleural
                    effusion...). Dataset chuẩn để benchmark model X-ray.
                  </li>
                  <li>
                    <strong>MIMIC-CXR (MIT):</strong> 377k X-ray từ bệnh viện
                    Beth Israel kèm báo cáo radiology free-text — rất giá trị
                    cho multimodal learning (vision + language).
                  </li>
                  <li>
                    <strong>VinDr-CXR (VinAI):</strong> 18k X-quang ngực với
                    annotation từ nhiều bác sĩ Việt Nam, bounding box cho
                    tổn thương. Đây là benchmark chất lượng cao đầu tiên từ
                    Đông Nam Á.
                  </li>
                  <li>
                    <strong>BraTS:</strong> MRI não cho segmentation khối u.
                    Challenge hàng năm, dataset được cập nhật, có ground-truth
                    từ nhiều chuyên gia.
                  </li>
                  <li>
                    <strong>NIH Pancreas-CT, LiTS (Liver Tumor Segmentation):
                    </strong> CT abdomen cho segmentation tạng và khối u.
                  </li>
                  <li>
                    <strong>ISIC Archive:</strong> ảnh da liễu cho phân loại
                    tổn thương da (melanoma, nevus...). Thường bị đánh giá
                    thiếu đa dạng tông da.
                  </li>
                  <li>
                    <strong>UK Biobank:</strong> 500k người tham gia với
                    genomics, imaging, EHR — dataset longitudinal lớn nhất
                    cho research lâm sàng.
                  </li>
                </ul>
                <p>
                  Mỗi dataset có giấy phép và quy định riêng về việc sử dụng
                  cho commercial. Luôn đọc kỹ DUA (Data Use Agreement) trước
                  khi tải.
                </p>
              </CollapsibleDetail>

              <CollapsibleDetail title="Các failure mode kinh điển của AI y tế">
                <p>
                  Không phải mọi AI y tế chạy tốt trong phòng lab đều an
                  toàn khi triển khai. Dưới đây là các failure mode đã được
                  ghi nhận trong thực tế:
                </p>
                <ul className="list-disc pl-5 leading-relaxed">
                  <li>
                    <strong>Shortcut learning:</strong> model học feature
                    không liên quan đến bệnh. Ví dụ: AI dự đoán pneumonia
                    chính xác 94% — hoá ra nó học được
                    &quot;portable X-ray&quot; marker (chỉ bệnh nhân nằm
                    viện, khả năng pneumonia cao). Bỏ marker → accuracy
                    sập. Grad-CAM giúp phát hiện shortcut.
                  </li>
                  <li>
                    <strong>Domain shift:</strong> khác máy, khác protocol,
                    khác dân số — model tụt accuracy 10–20%. Giải pháp:
                    external validation bắt buộc, domain adaptation
                    (DANN, CORAL), hoặc test-time adaptation.
                  </li>
                  <li>
                    <strong>Label noise:</strong> bác sĩ không đồng thuận,
                    nhãn sai, hoặc quy trình annotation không chuẩn. Ảnh
                    hưởng upper bound của model. Giải pháp: multi-reader
                    consensus, iterative label cleaning.
                  </li>
                  <li>
                    <strong>Calibration drift:</strong> model calibrated
                    tốt lúc deploy, nhưng theo thời gian (dân số thay đổi,
                    máy được maintenance, COVID thay đổi phân bố bệnh) →
                    xác suất không còn đúng. Giải pháp: continuous monitoring
                    + periodic recalibration.
                  </li>
                  <li>
                    <strong>Adversarial vulnerability:</strong> thay đổi
                    nhỏ không nhìn thấy bằng mắt có thể khiến model đổi dự
                    đoán. Ít xảy ra trong môi trường bệnh viện (không có
                    attacker) nhưng là vấn đề khi deploy ra ngoài
                    (telemedicine, ảnh từ điện thoại).
                  </li>
                  <li>
                    <strong>Automation bias:</strong> bác sĩ tin AI quá mức
                    → không kiểm tra kỹ khi AI đồng ý với ấn tượng ban đầu.
                    Giải pháp UX: yêu cầu bác sĩ ký chẩn đoán trước khi
                    xem gợi ý AI (&quot;two-step read&quot;).
                  </li>
                </ul>
              </CollapsibleDetail>

              <CollapsibleDetail title="Lộ trình học AI y tế từ số 0">
                <p>
                  Nếu bạn muốn chuyển sang AI y tế, đây là thứ tự học hợp lý:
                </p>
                <ol className="list-decimal pl-5 leading-relaxed">
                  <li>
                    <strong>Nền tảng ML/DL:</strong> Andrew Ng&apos;s Deep
                    Learning Specialization, fast.ai. Hiểu CNN, ResNet,
                    backprop.
                  </li>
                  <li>
                    <strong>Computer vision cơ bản:</strong> image
                    classification, segmentation, object detection. Làm lại
                    các bài tập trên CIFAR, ImageNet subset.
                  </li>
                  <li>
                    <strong>Medical imaging basics:</strong> hiểu định dạng
                    DICOM, các modality (X-ray, CT, MRI, ultrasound,
                    pathology). Đọc sách &quot;Deep Medicine&quot; của Eric
                    Topol.
                  </li>
                  <li>
                    <strong>Làm project trên dataset mở:</strong> CheXpert
                    baseline, BraTS segmentation, ISIC skin lesion. Publish
                    code và writeup trên GitHub.
                  </li>
                  <li>
                    <strong>Tham gia challenge:</strong> Kaggle medical
                    imaging, Grand Challenge, RSNA — giúp bạn làm quen với
                    pipeline end-to-end và đánh giá theo chuẩn.
                  </li>
                  <li>
                    <strong>Học thêm về clinical validation:</strong> CONSORT-AI,
                    STARD, TRIPOD guidelines. Hiểu cách đánh giá AI như một
                    medical device, không chỉ như model ML.
                  </li>
                  <li>
                    <strong>Hợp tác với bác sĩ:</strong> không thể làm AI y
                    tế mà không có partner lâm sàng. Liên hệ bệnh viện
                    trường, tham gia các seminar y tế, làm intern ở VinAI /
                    FPT AI / Medicode / các bệnh viện có bộ phận R&amp;D.
                  </li>
                </ol>
                <p>
                  Tại Việt Nam, các chương trình master / PhD AI y tế đang
                  được triển khai tại VinUni, ĐH Y Hà Nội, ĐH Bách Khoa, và
                  các chương trình hợp tác quốc tế.
                </p>
              </CollapsibleDetail>
            </ExplanationSection>
          </LessonSection>

          <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
            <MiniSummary
              points={[
                "AI hỗ trợ bác sĩ, không thay thế. AI + Bác sĩ (98%) > AI đơn (95%) > Bác sĩ đơn (90%).",
                "4 lĩnh vực: Chẩn đoán hình ảnh, Drug Discovery, Dự đoán lâm sàng, Y tế cá nhân hoá.",
                "Base rate problem: specificity 90% + prevalence 1% → PPV chỉ 9%. Screening cần 2 bước.",
                "Ngưỡng quyết định τ điều khiển trade-off sensitivity ↔ specificity; chọn τ = lựa chọn đạo đức, không chỉ kỹ thuật.",
                "AlphaFold dự đoán 200M+ protein → giảm 50-70% thời gian thiết kế thuốc.",
                "Việt Nam: VinAI (VinDr), FPT AI đang phát triển. Thách thức: data, regulatory, privacy, domain shift.",
              ]}
            />
          </LessonSection>

          <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
            <QuizSection questions={quizQuestions} />
          </LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
