"use client";

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

/* ==========================================================================
 *  METADATA — giữ nguyên
 * ========================================================================== */
export const metadata: TopicMeta = {
  slug: "explainability",
  title: "Explainability",
  titleVi: "Giải thích được — AI trong suốt",
  description:
    "Các kỹ thuật giúp con người hiểu tại sao mô hình AI đưa ra một quyết định cụ thể.",
  category: "ai-safety",
  tags: ["explainability", "interpretability", "xai", "transparency"],
  difficulty: "intermediate",
  relatedSlugs: ["bias-fairness", "alignment", "guardrails"],
  vizType: "interactive",
};

/* ==========================================================================
 *  FEATURE MODEL — mô phỏng dự đoán giá nhà
 *  Đây KHÔNG phải model thật — chỉ là công thức tuyến tính + tương tác để
 *  minh hoạ cách SHAP/LIME/Feature-Importance hoạt động.
 *
 *  Cách mô phỏng này cho phép bạn kiểm chứng thủ công:
 *      giá = BASELINE + Σ w_i × (x_i − baseline_i) + 35 × (bedroom − 3) × (location − 5)
 *  Nhờ công thức "white-box" này, chúng ta biết CHÍNH XÁC SHAP phải ra gì —
 *  giúp bạn đối chiếu và hiểu được từng bước.
 * ========================================================================== */

/** Mức giá nền (triệu VND) cho một căn nhà "giả định trung bình". */
const BASELINE_PRICE = 3200; // triệu VND

/** Chữ ký cho một feature dùng trong mô hình giả lập. */
interface FeatureDef {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  baseline: number; // giá trị "trung bình" làm mốc so sánh
  weight: number; // hệ số tuyến tính (triệu VND / đơn vị)
  color: string;
  explanation: string;
  /** Ví dụ minh hoạ ngắn để người học dễ hình dung feature đó trong đời thực. */
  realWorldHint: string;
}

const FEATURES: FeatureDef[] = [
  {
    key: "bedrooms",
    label: "Số phòng ngủ",
    min: 1,
    max: 6,
    step: 1,
    unit: "phòng",
    baseline: 3,
    weight: 420,
    color: "#3b82f6",
    explanation:
      "Mỗi phòng thêm ~420 triệu. Có tương tác phi tuyến với vị trí — nhà nhiều phòng ở trung tâm sẽ được 'cộng điểm' thêm.",
    realWorldHint:
      "Chung cư 2 phòng vs nhà phố 4 phòng — cùng diện tích nhưng định giá rất khác.",
  },
  {
    key: "sqft",
    label: "Diện tích",
    min: 30,
    max: 300,
    step: 5,
    unit: "m²",
    baseline: 90,
    weight: 18,
    color: "#22c55e",
    explanation:
      "Mỗi m² ~18 triệu. Đây là feature có đóng góp LỚN nhất khi dao động — bạn sẽ thấy rõ trên biểu đồ SHAP.",
    realWorldHint:
      "Diện tích là biến 'cứng' — thay đổi một đơn vị cũng ảnh hưởng đáng kể.",
  },
  {
    key: "age",
    label: "Tuổi nhà",
    min: 0,
    max: 40,
    step: 1,
    unit: "năm",
    baseline: 10,
    weight: -55, // giảm giá
    color: "#f59e0b",
    explanation:
      "Nhà càng cũ → giá giảm. Mỗi năm ~55 triệu. Đây là feature duy nhất có hệ số ÂM — bar sẽ nằm bên trái trục 0.",
    realWorldHint:
      "Nhà mới xây thường có giá cao hơn 15–25% nhà 10 năm tuổi cùng khu vực.",
  },
  {
    key: "location",
    label: "Điểm vị trí",
    min: 1,
    max: 10,
    step: 1,
    unit: "/10",
    baseline: 5,
    weight: 280,
    color: "#8b5cf6",
    explanation:
      "1 = vùng xa, 10 = trung tâm quận 1/quận Hoàn Kiếm. Ngoài đóng góp tuyến tính, vị trí còn tương tác với số phòng ngủ.",
    realWorldHint:
      "Vị trí là 'multiplier' — cùng căn nhà dời từ vùng ven về trung tâm có thể gấp đôi giá.",
  },
  {
    key: "garage",
    label: "Chỗ đậu xe",
    min: 0,
    max: 3,
    step: 1,
    unit: "xe",
    baseline: 1,
    weight: 180,
    color: "#ec4899",
    explanation:
      "Mỗi chỗ đậu xe thêm ~180 triệu. Feature có đóng góp nhỏ nhưng cho SHAP ra bar rõ ràng khi bạn bật/tắt.",
    realWorldHint:
      "Nhà trong phố cổ không có chỗ đậu xe có thể rớt giá đáng kể so với căn cùng diện tích.",
  },
];

/** Dự đoán giá nhà từ giá trị feature (tính theo triệu VND). */
function predictPrice(values: Record<string, number>): number {
  let price = BASELINE_PRICE;
  for (const f of FEATURES) {
    const v = values[f.key];
    price += f.weight * (v - f.baseline);
  }
  // Thêm một chút phi tuyến để SHAP khác Feature Importance
  const bedroom = values.bedrooms - FEATURES[0].baseline;
  const location = values.location - FEATURES[3].baseline;
  price += 35 * bedroom * location; // tương tác: phòng ngủ × vị trí
  return Math.max(500, Math.round(price));
}

/**
 * SHAP value (xấp xỉ) cho mô hình tuyến tính có 1 tương tác:
 * φ_i ≈ weight_i × (value_i − baseline_i) + nửa đóng góp từ tương tác nếu có.
 *
 * Vì model cảu chúng ta có cấu trúc đơn giản (linear + 1 interaction term),
 * Shapley value rút gọn thành: đóng góp tuyến tính + chia đều phần tương tác
 * giữa 2 feature tham gia (bedrooms & location).
 */
function computeShap(values: Record<string, number>): Array<{
  key: string;
  label: string;
  value: number;
  color: string;
}> {
  const results: Array<{
    key: string;
    label: string;
    value: number;
    color: string;
  }> = [];

  const bedroom = values.bedrooms - FEATURES[0].baseline;
  const location = values.location - FEATURES[3].baseline;
  const interaction = 35 * bedroom * location;

  for (const f of FEATURES) {
    const v = values[f.key];
    let phi = f.weight * (v - f.baseline);

    // Chia đều phần tương tác giữa bedrooms và location
    if (f.key === "bedrooms" || f.key === "location") {
      phi += interaction / 2;
    }
    results.push({
      key: f.key,
      label: f.label,
      value: Math.round(phi),
      color: f.color,
    });
  }
  return results;
}

/**
 * LIME (xấp xỉ tuyến tính cục bộ) — trong trường hợp model đã là tuyến tính
 * chúng ta lấy chính hệ số w_i × (value − baseline), nhưng LIME thường BỎ
 * tương tác (vì nó chỉ fit linear). Kết quả: khác SHAP ở phần tương tác.
 */
function computeLime(values: Record<string, number>): Array<{
  key: string;
  label: string;
  value: number;
  color: string;
}> {
  return FEATURES.map((f) => ({
    key: f.key,
    label: f.label,
    value: Math.round(f.weight * (values[f.key] - f.baseline)),
    color: f.color,
  }));
}

/**
 * Feature Importance toàn cục — không phụ thuộc vào 1 instance cụ thể.
 * Tính bằng |weight| × (range của feature) — xấp xỉ "mutual information".
 */
function computeGlobalImportance(): Array<{
  key: string;
  label: string;
  value: number;
  color: string;
}> {
  return FEATURES.map((f) => ({
    key: f.key,
    label: f.label,
    value: Math.round(Math.abs(f.weight) * (f.max - f.min)),
    color: f.color,
  })).sort((a, b) => b.value - a.value);
}

/* ==========================================================================
 *  SHAPBAR — bar chart SHAP values, có dương/âm
 * ========================================================================== */

const BAR_W = 640;
const BAR_H = 300;

interface ContribBarChartProps {
  contributions: Array<{
    key: string;
    label: string;
    value: number;
    color: string;
  }>;
  predictedPrice: number;
  baseline: number;
  title: string;
  subtitle?: string;
}

function ContribBarChart({
  contributions, predictedPrice, baseline, title, subtitle,
}: ContribBarChartProps) {
  const maxAbs = Math.max(300, ...contributions.map((c) => Math.abs(c.value)));
  const centerX = BAR_W / 2;
  const rowH = 36;
  const firstRowY = 66;

  return (
    <svg viewBox={`0 0 ${BAR_W} ${BAR_H}`} className="w-full max-w-3xl mx-auto"
         role="img" aria-label={title}>
      <rect x={0} y={0} width={BAR_W} height={BAR_H} fill="#0f172a" />
      <text x={BAR_W / 2} y={20} textAnchor="middle" fill="#e2e8f0"
            fontSize={12} fontWeight="bold">{title}</text>
      {subtitle && (
        <text x={BAR_W / 2} y={36} textAnchor="middle" fill="#94a3b8" fontSize={10}>
          {subtitle}
        </text>
      )}
      <line x1={centerX} y1={firstRowY - 10} x2={centerX}
            y2={firstRowY + contributions.length * rowH}
            stroke="#475569" strokeWidth={1} strokeDasharray="3 3" />
      <text x={centerX} y={firstRowY - 14} textAnchor="middle" fill="#94a3b8" fontSize={9}>0</text>
      <text x={centerX - 4} y={firstRowY + contributions.length * rowH + 14}
            textAnchor="end" fill="#64748b" fontSize={9}>◂ giảm giá</text>
      <text x={centerX + 4} y={firstRowY + contributions.length * rowH + 14}
            fill="#64748b" fontSize={9}>tăng giá ▸</text>
      {contributions.map((c, i) => {
        const y = firstRowY + i * rowH;
        const barLen = (Math.abs(c.value) / maxAbs) * (BAR_W / 2 - 100);
        const isNeg = c.value < 0;
        const barX = isNeg ? centerX - barLen : centerX;
        return (
          <g key={c.key}>
            <text x={10} y={y + 18} fill="#cbd5e1" fontSize={11}>{c.label}</text>
            <motion.rect x={barX} y={y + 4} height={24} rx={4} fill={c.color}
                         initial={{ width: 0 }} animate={{ width: barLen }}
                         transition={{ duration: 0.4, ease: "easeOut" }}
                         opacity={isNeg ? 0.85 : 1} />
            <text x={isNeg ? centerX - barLen - 6 : centerX + barLen + 6}
                  y={y + 20} textAnchor={isNeg ? "end" : "start"}
                  fill={c.value >= 0 ? "#86efac" : "#fca5a5"}
                  fontSize={11} fontWeight="bold">
              {c.value >= 0 ? "+" : ""}{c.value} tr
            </text>
          </g>
        );
      })}
      <g>
        <rect x={20} y={BAR_H - 34} width={BAR_W - 40} height={28} rx={6} fill="#1e293b" />
        <text x={40} y={BAR_H - 15} fill="#94a3b8" fontSize={11}>
          Baseline: {baseline.toLocaleString("vi-VN")} triệu
        </text>
        <text x={BAR_W - 40} y={BAR_H - 15} textAnchor="end" fill="#fbbf24"
              fontSize={12} fontWeight="bold">
          Dự đoán: {predictedPrice.toLocaleString("vi-VN")} triệu VND
        </text>
      </g>
    </svg>
  );
}

/* ==========================================================================
 *  SliderRow — component nội bộ, slider + nhãn cho từng feature
 * ========================================================================== */

interface SliderRowProps {
  feature: FeatureDef;
  value: number;
  onChange: (v: number) => void;
}

function SliderRow({ feature, value, onChange }: SliderRowProps) {
  const delta = value - feature.baseline;
  const direction =
    delta === 0
      ? "= baseline"
      : delta > 0
        ? `+${delta} ${feature.unit} so với baseline`
        : `${delta} ${feature.unit} so với baseline`;

  return (
    <div className="space-y-1 rounded-lg border border-border bg-background/40 p-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: feature.color }}
          />
          {feature.label}
        </label>
        <strong className="text-sm text-foreground">
          {value}
          <span className="ml-1 text-[10px] text-muted">{feature.unit}</span>
        </strong>
      </div>
      <input
        type="range"
        min={feature.min}
        max={feature.max}
        step={feature.step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-accent"
        style={{ accentColor: feature.color }}
      />
      <div className="flex justify-between text-[10px] text-muted">
        <span>
          {feature.min} {feature.unit}
        </span>
        <span>
          baseline: {feature.baseline} {feature.unit}
        </span>
        <span>
          {feature.max} {feature.unit}
        </span>
      </div>
      <p className="text-[10px] text-muted leading-relaxed">
        {feature.explanation}
      </p>
      <p className="text-[10px] text-tertiary italic">
        Gợi ý thực tế: {feature.realWorldHint}
      </p>
      <p
        className="text-[10px] font-mono"
        style={{ color: delta === 0 ? "#94a3b8" : feature.color }}
      >
        Δ {direction}
      </p>
    </div>
  );
}

/* ==========================================================================
 *  QUIZ — 8 câu
 * ========================================================================== */
const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "SHAP và LIME khác nhau ở điểm nào quan trọng nhất?",
    options: [
      "SHAP chỉ cho mô hình đơn giản, LIME cho mô hình phức tạp",
      "SHAP dựa trên Shapley values (lý thuyết trò chơi) — chính xác và có tính nhất quán; LIME xấp xỉ model bằng linear model cục bộ — nhanh nhưng không bảo đảm tổng = prediction",
      "SHAP nhanh hơn LIME",
      "LIME là phiên bản cải tiến của SHAP",
    ],
    correct: 1,
    explanation:
      "SHAP dùng Shapley values để phân bổ đóng góp từng feature công bằng và nhất quán (consistency + local accuracy). LIME fit linear regression trong vùng lân cận — xấp xỉ, không bảo đảm tổng SHAP value = giá trị dự đoán như SHAP.",
  },
  {
    question:
      "AI từ chối cho vay và giải thích: 'Vì bạn sống ở Quận 8, TP.HCM'. Vấn đề gì xuất hiện?",
    options: [
      "AI giải thích đúng — Quận 8 có tỷ lệ nợ xấu cao",
      "Explainability phát hiện proxy discrimination: 'vùng miền' là proxy cho thu nhập/dân tộc — giải thích giúp phát hiện bias ẩn",
      "AI nên giấu lý do để không gây tranh cãi",
      "Explainability không áp dụng cho tín dụng",
    ],
    correct: 1,
    explanation:
      "Giá trị thật sự của XAI: nó phát hiện 'vùng miền' đóng góp nhiều — dấu hiệu AI đang dùng địa chỉ làm proxy cho dân tộc/thu nhập. Đây là phân biệt gián tiếp bị cấm bởi nhiều quy định (GDPR Art. 22, EU AI Act, Nghị định 13/2023/NĐ-CP).",
  },
  {
    question:
      "EU AI Act yêu cầu explainability cho AI rủi ro cao. Ứng dụng nào tại Việt Nam thuộc nhóm này?",
    options: [
      "Chatbot tư vấn mua hàng trên Shopee",
      "AI tạo ảnh cho mạng xã hội",
      "AI chấm điểm tín dụng ngân hàng và AI hỗ trợ chẩn đoán bệnh",
      "AI gợi ý bài hát trên Spotify",
    ],
    correct: 2,
    explanation:
      "AI rủi ro cao = ảnh hưởng trực tiếp đến cuộc sống: tín dụng, y tế, tuyển dụng, tư pháp. Chatbot mua hàng và gợi ý nhạc là rủi ro thấp/tối thiểu — không bắt buộc giải thích chi tiết.",
  },
  {
    type: "fill-blank",
    question:
      "Hai kỹ thuật XAI phổ biến nhất là {blank} (Shapley values, chính xác) và {blank} (xấp xỉ tuyến tính cục bộ).",
    blanks: [
      { answer: "SHAP", accept: ["shap"] },
      { answer: "LIME", accept: ["lime"] },
    ],
    explanation:
      "SHAP dùng Shapley values từ lý thuyết trò chơi → phân bổ công bằng. LIME xấp xỉ model phức tạp bằng linear regression trong neighborhood.",
  },
  {
    question:
      "Bạn đang xây model chấm điểm tín dụng. So sánh 3 kỹ thuật Feature Importance, LIME, SHAP — điểm nào KHÔNG đúng?",
    options: [
      "Feature Importance cho hiểu biết toàn cục (global), không giải thích 1 quyết định cụ thể",
      "LIME giải thích cục bộ (local) — nhanh nhưng có thể không nhất quán qua các instance gần",
      "SHAP vừa có global vừa có local, và là kỹ thuật duy nhất luôn cho 0 overhead tính toán",
      "Cả ba đều là model-agnostic (hoạt động với bất kỳ model nào)",
    ],
    correct: 2,
    explanation:
      "SHAP KHÔNG phải zero overhead — tính toán đúng theo lý thuyết là 2^n tổ hợp (exponential). TreeSHAP / KernelSHAP là các xấp xỉ hiệu quả. SHAP phần lớn chính xác hơn LIME nhưng phải trả bằng compute.",
  },
  {
    question:
      "Bác sĩ dùng AI hỗ trợ đọc X-quang phổi. AI nói: 'Có khối u, confidence 87%'. Bác sĩ cần thêm gì?",
    options: [
      "Không cần gì thêm — 87% là đủ tin cậy",
      "Heat map (Grad-CAM / attention) chỉ ra VÙNG NÀO trên X-quang AI 'nhìn' thấy bất thường, để bác sĩ xác nhận",
      "Danh sách tất cả bệnh nhân tương tự",
      "Confidence cao hơn, tối thiểu 99%",
    ],
    correct: 1,
    explanation:
      "Grad-CAM/attention cho bác sĩ biết AI 'nhìn' vào đâu. Nếu AI highlight đúng vùng nghi ngờ → tăng độ tin cậy. Nếu AI nhìn vào metadata/chữ trên phim → phát hiện được lỗi. XAI = công cụ kiểm tra chéo cho chuyên gia.",
  },
  {
    question:
      "SHAP values có tính 'local accuracy': tổng của tất cả SHAP value + baseline = ...?",
    options: [
      "Accuracy toàn cục của model",
      "Loss trên test set",
      "Đúng bằng giá trị dự đoán cho instance đó",
      "Trung bình dự đoán trên tập train",
    ],
    correct: 2,
    explanation:
      "Local accuracy (efficiency property): Σφ_i + E[f(X)] = f(x). Đây là một trong 4 thuộc tính Shapley (hiệu quả, đối xứng, null player, cộng tính). SHAP được chứng minh là cách phân bổ DUY NHẤT thoả mãn cả 4.",
  },
  {
    question: "Khi nào nên dùng Feature Importance toàn cục thay vì SHAP/LIME?",
    options: [
      "Luôn luôn — nó thay thế được SHAP và LIME",
      "Khi bạn cần hiểu model nói chung quan tâm feature nào nhất, không phải giải thích 1 quyết định cụ thể",
      "Khi cần giải thích cho 1 khách hàng cụ thể bị từ chối",
      "Khi muốn phát hiện bias đối với cá nhân cụ thể",
    ],
    correct: 1,
    explanation:
      "Feature Importance = global view. Dùng để debug model, chọn feature, báo cáo 'feature X quan trọng nhất'. Khi cần giải thích cho CÁ NHÂN (ví dụ: tại sao khách hàng này bị từ chối?), phải dùng SHAP/LIME per-instance.",
  },
];

/* ==========================================================================
 *  MAIN COMPONENT
 * ========================================================================== */
export default function ExplainabilityTopic() {
  // Giá trị feature hiện tại — khởi tạo tại baseline
  const initialValues: Record<string, number> = useMemo(() => {
    const v: Record<string, number> = {};
    for (const f of FEATURES) v[f.key] = f.baseline;
    return v;
  }, []);

  const [values, setValues] = useState<Record<string, number>>(initialValues);
  const [mode, setMode] = useState<"shap" | "lime" | "global">("shap");

  const predicted = useMemo(() => predictPrice(values), [values]);
  const shapContribs = useMemo(() => computeShap(values), [values]);
  const limeContribs = useMemo(() => computeLime(values), [values]);
  const globalImportance = useMemo(() => computeGlobalImportance(), []);

  const updateValue = useCallback((key: string, v: number) => {
    setValues((prev) => ({ ...prev, [key]: v }));
  }, []);

  const resetAll = useCallback(() => {
    setValues(initialValues);
  }, [initialValues]);

  const setExpensive = useCallback(() => {
    setValues({
      bedrooms: 5,
      sqft: 200,
      age: 2,
      location: 9,
      garage: 2,
    });
  }, []);

  const setCheap = useCallback(() => {
    setValues({
      bedrooms: 2,
      sqft: 50,
      age: 30,
      location: 3,
      garage: 0,
    });
  }, []);

  const setBalanced = useCallback(() => {
    setValues({
      bedrooms: 3,
      sqft: 110,
      age: 8,
      location: 6,
      garage: 1,
    });
  }, []);

  // Preset modes
  const activeContribs =
    mode === "shap"
      ? shapContribs
      : mode === "lime"
        ? limeContribs
        : globalImportance;

  const modeTitle =
    mode === "shap"
      ? "SHAP — đóng góp của từng feature cho dự đoán này"
      : mode === "lime"
        ? "LIME — xấp xỉ tuyến tính cục bộ (bỏ tương tác)"
        : "Feature Importance toàn cục (không phụ thuộc instance)";

  const modeSubtitle =
    mode === "shap"
      ? "Σ SHAP + baseline = giá dự đoán (local accuracy)"
      : mode === "lime"
        ? "Nhanh hơn SHAP — nhưng không bảo đảm tổng = prediction"
        : "Dùng để xem tổng thể model quan tâm feature nào nhất";

  // Tổng phần trăm đóng góp tuyệt đối — để người học thấy "bức tranh lớn"
  const totalAbsContrib = useMemo(() => {
    return activeContribs.reduce((sum, c) => sum + Math.abs(c.value), 0);
  }, [activeContribs]);

  return (
    <>
      {/* =========================================================
          STEP 1 — PREDICTION GATE
          ========================================================= */}
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Bạn bị AI ngân hàng từ chối cho vay. Bạn hỏi 'Tại sao?' và được trả lời 'Máy tính nói thế.' Bạn cảm thấy sao?"
          options={[
            "Chấp nhận vì AI chắc phải đúng",
            "Bất mãn — bạn xứng đáng biết LÝ DO cụ thể để có thể cải thiện",
            "Không quan tâm — chuyển sang ngân hàng khác",
          ]}
          correct={1}
          explanation="Quyền được giải thích (right to explanation) là nền tảng của XAI. Nếu AI nói: 'Từ chối vì thu nhập thấp hơn ngưỡng 30% và có 2 lần trễ hạn trong 12 tháng', bạn biết chính xác cần cải thiện gì. Giải thích = CÔNG BẰNG + HÀNH ĐỘNG."
        >
          <p className="mt-4 text-sm text-muted leading-relaxed">
            Hãy hình dung bạn vừa gửi hồ sơ vay 500 triệu để mua nhà cho gia đình.
            Trong vòng 2 phút, hệ thống ngân hàng hồi đáp:{" "}
            <em>"Hồ sơ không được duyệt."</em> Không lý do, không mã lỗi, không
            hướng dẫn cải thiện. Bạn chỉ có một màn hình trắng và một dòng chữ.
          </p>
          <p className="mt-3 text-sm text-muted leading-relaxed">
            Đây chính xác là kịch bản mà khung pháp lý hiện đại (GDPR Điều 22,
            EU AI Act, Nghị định 13/2023/NĐ-CP của Việt Nam) đang cố gắng xoá bỏ.
            Ở phần tiếp theo bạn sẽ thấy một mô hình AI dự đoán giá nhà. Hãy thử
            điều chỉnh 5 feature (số phòng ngủ, diện tích, tuổi nhà, vị trí,
            chỗ đậu xe) và so sánh 3 kỹ thuật giải thích: SHAP, LIME, Feature
            Importance — để tự tay trải nghiệm XAI hoạt động ra sao.
          </p>
          <p className="mt-3 text-xs text-tertiary leading-relaxed">
            Ẩn dụ nhanh: coi mô hình AI như một <strong>hội đồng 5 người</strong>{" "}
            cùng định giá căn nhà. SHAP là cách chia công "ai đóng góp bao nhiêu"
            sao cho công bằng theo luật chơi (Shapley). LIME là hỏi một phiên
            bản <em>đơn giản hoá</em> của hội đồng — "nếu chỉ bàn linear thì các
            bạn chia thế nào?". Feature Importance toàn cục là bảng thống kê
            trung bình qua rất nhiều căn nhà — hữu ích cho audit, nhưng không
            giải thích 1 hồ sơ cụ thể.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* =========================================================
          STEP 2 — INTERACTIVE SHAP DEMO
          ========================================================= */}
      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-5">
            {/* Tiêu đề + preset */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Mô hình dự đoán giá nhà (triệu VND)
                </h3>
                <p className="text-xs text-muted">
                  Chỉnh 5 feature → xem giải thích cập nhật ngay lập tức
                </p>
              </div>
              <ProgressSteps current={2} total={8} />
            </div>

            {/* Giá dự đoán lớn */}
            <motion.div
              key={predicted}
              initial={{ scale: 0.98, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="rounded-xl border border-border bg-background/50 p-4 text-center"
            >
              <p className="text-xs text-muted">Giá dự đoán</p>
              <p className="text-3xl font-bold text-accent tabular-nums">
                {predicted.toLocaleString("vi-VN")}{" "}
                <span className="text-base font-medium text-muted">
                  triệu VND
                </span>
              </p>
              <p className="text-[11px] text-muted mt-1">
                Baseline (nhà "trung bình"):{" "}
                {BASELINE_PRICE.toLocaleString("vi-VN")} triệu
              </p>
              <p className="text-[11px] text-tertiary mt-1">
                Chênh so với baseline:{" "}
                <strong
                  className={
                    predicted >= BASELINE_PRICE
                      ? "text-green-500"
                      : "text-rose-500"
                  }
                >
                  {predicted >= BASELINE_PRICE ? "+" : ""}
                  {(predicted - BASELINE_PRICE).toLocaleString("vi-VN")} triệu
                </strong>
              </p>
            </motion.div>

            {/* Preset */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={setExpensive}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground"
              >
                Preset: nhà cao cấp
              </button>
              <button
                type="button"
                onClick={setCheap}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground"
              >
                Preset: nhà bình dân
              </button>
              <button
                type="button"
                onClick={setBalanced}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground"
              >
                Preset: nhà trung bình khá
              </button>
              <button
                type="button"
                onClick={resetAll}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground"
              >
                Đặt lại baseline
              </button>
            </div>

            {/* Sliders */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <SliderRow
                  key={f.key}
                  feature={f}
                  value={values[f.key]}
                  onChange={(v) => updateValue(f.key, v)}
                />
              ))}
            </div>

            {/* Toggle 3 mode */}
            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              <span className="text-xs font-medium text-muted self-center mr-2">
                So sánh kỹ thuật:
              </span>
              {(["shap", "lime", "global"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    mode === m
                      ? "bg-accent text-white"
                      : "border border-border bg-card text-muted hover:text-foreground"
                  }`}
                >
                  {m === "shap"
                    ? "SHAP (local)"
                    : m === "lime"
                      ? "LIME (local, linear)"
                      : "Feature Importance (global)"}
                </button>
              ))}
            </div>

            {/* Bar chart */}
            <div className="rounded-lg border border-border bg-background/30 p-3">
              <ContribBarChart
                contributions={activeContribs}
                predictedPrice={predicted}
                baseline={BASELINE_PRICE}
                title={modeTitle}
                subtitle={modeSubtitle}
              />
            </div>

            {/* Phân tích ngắn theo từng mode */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-background/30 p-3 text-xs text-muted leading-relaxed">
                {mode === "shap" && (
                  <>
                    <p className="mb-2">
                      <strong className="text-foreground">SHAP:</strong> phân bổ
                      công bằng đóng góp của từng feature theo Shapley values.
                      Bao gồm cả phần tương tác (bedroom × location). Tổng SHAP
                      + baseline = giá dự đoán.
                    </p>
                    <p className="text-[10px]">
                      Kiểm chứng: Σ SHAP ={" "}
                      {activeContribs
                        .reduce((s, c) => s + c.value, 0)
                        .toLocaleString("vi-VN")}{" "}
                      triệu, + baseline {BASELINE_PRICE.toLocaleString("vi-VN")}{" "}
                      = dự đoán{" "}
                      {(
                        BASELINE_PRICE +
                        activeContribs.reduce((s, c) => s + c.value, 0)
                      ).toLocaleString("vi-VN")}{" "}
                      triệu (khớp với ô lớn trên).
                    </p>
                  </>
                )}
                {mode === "lime" && (
                  <>
                    <p className="mb-2">
                      <strong className="text-foreground">LIME:</strong> xấp xỉ
                      model bằng linear regression trong vùng lân cận. Không
                      bắt được tương tác nên tổng khác với giá dự đoán thật.
                    </p>
                    <p className="text-[10px]">
                      Lưu ý: Σ LIME + baseline có thể KHÁC với dự đoán. Đây là
                      tính chất "xấp xỉ" của LIME — trade-off đổi lấy tốc độ.
                    </p>
                  </>
                )}
                {mode === "global" && (
                  <>
                    <p className="mb-2">
                      <strong className="text-foreground">
                        Feature Importance:
                      </strong>{" "}
                      không phụ thuộc instance — chỉ cho biết nói chung feature
                      nào ảnh hưởng nhiều nhất. Hữu ích cho audit model, không
                      dùng để giải thích 1 khách hàng cụ thể.
                    </p>
                    <p className="text-[10px]">
                      Thứ hạng global giúp trả lời: "Model này chủ yếu học từ
                      feature nào?". Phù hợp cho báo cáo tổng quan, không phù
                      hợp khi khách hàng khiếu nại.
                    </p>
                  </>
                )}
              </div>

              <div className="rounded-lg border border-border bg-background/30 p-3 text-xs text-muted leading-relaxed">
                <p className="mb-2">
                  <strong className="text-foreground">Phân tích nhanh:</strong>{" "}
                  Tổng trị tuyệt đối đóng góp ={" "}
                  <strong className="text-foreground">
                    {totalAbsContrib.toLocaleString("vi-VN")} triệu
                  </strong>
                  . Feature đóng góp nhiều nhất (theo |φ|):{" "}
                  <strong className="text-foreground">
                    {
                      [...activeContribs].sort(
                        (a, b) => Math.abs(b.value) - Math.abs(a.value),
                      )[0]?.label
                    }
                  </strong>
                  .
                </p>
                <p className="text-[10px]">
                  Thử kéo slider diện tích từ 30 → 300 để thấy bar này gần như
                  "áp đảo" — minh hoạ tại sao SHAP local rất phù hợp cho thông
                  báo "feature này quyết định hồ sơ của bạn".
                </p>
              </div>
            </div>

            {/* Bảng số dạng data-driven */}
            <div className="rounded-lg border border-border bg-background/30 p-3 overflow-x-auto">
              <table className="w-full text-[11px] tabular-nums">
                <thead>
                  <tr className="text-left text-muted">
                    <th className="py-1 pr-3">Feature</th>
                    <th className="py-1 pr-3">Giá trị</th>
                    <th className="py-1 pr-3">Baseline</th>
                    <th className="py-1 pr-3">Δ</th>
                    <th className="py-1 pr-3">Đóng góp (tr)</th>
                  </tr>
                </thead>
                <tbody>
                  {FEATURES.map((f) => {
                    const v = values[f.key];
                    const contrib = activeContribs.find((c) => c.key === f.key);
                    const delta = v - f.baseline;
                    const posColor = delta === 0 ? "#94a3b8" : delta > 0 ? "#22c55e" : "#f43f5e";
                    const cColor = (contrib?.value ?? 0) >= 0 ? "#22c55e" : "#f43f5e";
                    return (
                      <tr key={f.key} className="border-t border-border/60 text-foreground">
                        <td className="py-1 pr-3">
                          <span className="inline-block h-2 w-2 rounded-full mr-1 align-middle"
                                style={{ backgroundColor: f.color }} />
                          {f.label}
                        </td>
                        <td className="py-1 pr-3">{v} {f.unit}</td>
                        <td className="py-1 pr-3 text-muted">{f.baseline} {f.unit}</td>
                        <td className="py-1 pr-3" style={{ color: posColor }}>
                          {delta > 0 ? "+" : ""}{delta}
                        </td>
                        <td className="py-1 pr-3 font-semibold" style={{ color: cColor }}>
                          {(contrib?.value ?? 0) >= 0 ? "+" : ""}{contrib?.value ?? 0}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* =========================================================
          STEP 3 — AHA MOMENT
          ========================================================= */}
      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc A-ha">
        <AhaMoment>
          <p>
            Explainability không chỉ để <strong>người dùng hiểu</strong> — nó
            còn giúp <strong>phát hiện bias ẩn</strong>. Nếu "vùng miền" đóng
            góp 10% vào quyết định từ chối, đó là dấu hiệu AI đang phân biệt
            đối xử theo địa chỉ — điều mà chỉ nhìn <em>accuracy</em> tổng không
            bao giờ phát hiện được.
          </p>
          <p className="mt-3 text-sm">
            Nói cách khác, XAI biến AI từ <strong>hộp đen không ai dám cãi</strong>{" "}
            thành một <strong>đồng nghiệp phải trình bày lập luận</strong>. Khi
            AI phải viết "tôi quyết định vì feature A, B, C", con người có cơ
            hội phản biện: "feature A đó có phải proxy cho giới tính không?",
            "feature B có bị thiếu data cho nhóm thiểu số không?". Không có XAI,
            những câu hỏi đó biến mất — và cùng với chúng là cơ hội sửa sai.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* =========================================================
          STEP 4 — INLINE CHALLENGE #1
          ========================================================= */}
      <LessonSection step={4} totalSteps={8} label="Thử thách 1">
        <InlineChallenge
          question="Bác sĩ dùng AI hỗ trợ chẩn đoán X-quang. AI nói: 'Có khối u, 87% tự tin'. Bác sĩ cần thêm gì?"
          options={[
            "Không cần gì thêm — 87% là đủ tin cậy",
            "Heat map (Grad-CAM / attention) chỉ ra VÙNG NÀO trên X-quang AI nhìn thấy bất thường, để bác sĩ xác nhận",
            "Danh sách tất cả bệnh nhân tương tự",
            "Confidence cao hơn, tối thiểu 99%",
          ]}
          correct={1}
          explanation="Grad-CAM/attention visualization cho bác sĩ biết AI 'nhìn' vào đâu. Nếu AI highlight đúng vùng nghi ngờ → tin tưởng hơn. Nếu AI nhìn vào vùng sai (metadata, chữ trên phim) → phát hiện lỗi. XAI = công cụ kiểm tra chéo cho chuyên gia."
        />
      </LessonSection>

      {/* =========================================================
          STEP 5 — EXPLANATION (lý thuyết sâu + code)
          ========================================================= */}
      <LessonSection step={5} totalSteps={8} label="Lý thuyết">
        <ExplanationSection topicSlug={metadata.slug}>
          <p>
            <strong>Explainability (XAI)</strong> là khả năng hệ thống AI trình
            bày lý do đằng sau quyết định một cách con người có thể hiểu và
            kiểm chứng. XAI là công cụ để phát hiện{" "}
            <TopicLink slug="bias-fairness">thiên kiến và bất công</TopicLink>{" "}
            trong mô hình, và là yêu cầu bắt buộc của{" "}
            <TopicLink slug="ai-governance">quản trị AI</TopicLink> cho các hệ
            thống rủi ro cao. Nói ngắn gọn: XAI = <em>"tại sao?"</em> được trả
            lời bằng ngôn ngữ con người, có thể kiểm chứng, và có thể tái tạo.
          </p>

          <p>
            Cần phân biệt <strong>explainability</strong> (khả năng giải thích){" "}
            với <strong>interpretability</strong> (khả năng con người tự đọc
            hiểu model). Một model tuyến tính đơn giản là{" "}
            <em>interpretable</em> — bạn nhìn hệ số là hiểu. Một deep network
            không interpretable, nhưng có thể <em>explainable</em> nhờ các công
            cụ bên ngoài như SHAP, LIME, Grad-CAM. Bài này tập trung vào nhóm
            thứ hai — giải thích hậu kiểm (post-hoc) cho các model phức tạp.
          </p>

          <Callout variant="insight" title="Ba nhóm kỹ thuật XAI phổ biến nhất">
            <div className="space-y-3">
              <p>
                <strong>1. SHAP (SHapley Additive exPlanations):</strong> Dựa
                trên Shapley values từ lý thuyết trò chơi. Tính chính xác đóng
                góp của từng feature cho 1 dự đoán cụ thể. Có bản global
                (summary plot) và local (waterfall). Công bằng nhưng tốn tính
                toán.
              </p>
              <p>
                <strong>
                  2. LIME (Local Interpretable Model-agnostic Explanations):
                </strong>{" "}
                Xấp xỉ mô hình phức tạp bằng mô hình tuyến tính tại vùng lân
                cận của 1 điểm dữ liệu. Nhanh, dễ hiểu, nhưng chỉ giải thích
                cục bộ và có thể không nhất quán.
              </p>
              <p>
                <strong>3. Attention / Grad-CAM:</strong> Hiển thị phần nào
                của đầu vào AI "chú ý" nhất. Đặc biệt hữu ích cho ảnh (X-quang,
                CCTV) và văn bản (highlight từ quan trọng).
              </p>
              <p>
                Ngoài ba nhóm trên, còn có{" "}
                <strong>counterfactual explanations</strong> (giải thích dạng
                "nếu-thì"), <strong>partial dependence plots</strong> (PDP),{" "}
                <strong>individual conditional expectation</strong> (ICE), và{" "}
                <strong>anchor explanations</strong>. Mỗi kỹ thuật trả lời một
                câu hỏi khác nhau — không có "one size fits all".
              </p>
            </div>
          </Callout>

          <p>Công thức Shapley value cho feature i:</p>
          <LaTeX block>
            {
              "\\phi_i = \\sum_{S \\subseteq N \\setminus \\{i\\}} \\frac{|S|! \\cdot (|N|-|S|-1)!}{|N|!} \\left[ f(S \\cup \\{i\\}) - f(S) \\right]"
            }
          </LaTeX>
          <p className="text-sm text-muted">
            Ý nghĩa: đo <em>đóng góp biên</em> của feature i bằng cách thử TẤT
            CẢ tổ hợp feature có và không có i, rồi lấy trung bình có trọng
            số. Có 4 tính chất làm Shapley value duy nhất: efficiency,
            symmetry, dummy, additivity. Với model có n feature, số tổ hợp là
            2^n — nên SHAP chính tắc rất tốn; các biến thể như TreeSHAP,
            KernelSHAP, FastSHAP, GPUTreeSHAP ra đời để thực dụng hoá.
          </p>

          <LaTeX block>
            {
              "f(x) = \\phi_0 + \\sum_{i=1}^{M} \\phi_i \\cdot z_i' \\quad \\text{với } z_i' \\in \\{0,1\\}"
            }
          </LaTeX>
          <p className="text-sm text-muted">
            Phương trình trên là dạng tổng quát của <em>additive feature
            attribution</em> — nền tảng chung cho SHAP, LIME, DeepLIFT, Layer-wise
            Relevance Propagation. Lundberg & Lee (2017) chứng minh SHAP là
            cách phân bổ DUY NHẤT thoả đồng thời 3 tiên đề: local accuracy,
            missingness, consistency.
          </p>

          <CodeBlock language="python" title="shap_house_price.py">
            {`# Dự đoán giá nhà + giải thích bằng SHAP (TreeExplainer)
import shap, xgboost as xgb, pandas as pd
from sklearn.model_selection import train_test_split

df = pd.read_csv("house_prices.csv")
features = ["bedrooms", "sqft", "age", "location", "garage"]
X, y = df[features], df["price"]
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42,
)

model = xgb.XGBRegressor(n_estimators=300, max_depth=6,
                         learning_rate=0.05, random_state=42)
model.fit(X_train, y_train)

# SHAP explainer: TreeExplainer cực nhanh cho tree-based model
explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X_test)     # (n_samples, n_features)

# Giải thích cho 1 khách hàng
idx = 42
row = X_test.iloc[idx]
pred = model.predict(row.values.reshape(1, -1))[0]
print("SHAP values (dương = tăng giá, âm = giảm giá):")
for name, value in sorted(
    zip(features, shap_values[idx]),
    key=lambda x: abs(x[1]), reverse=True,
):
    arrow = "↑" if value > 0 else "↓"
    print(f"  {name:12s}: {value:+8.1f}  ({arrow})")

# Local accuracy: Σ SHAP + baseline = prediction
baseline = explainer.expected_value
print(f"baseline + ΣSHAP = {baseline + shap_values[idx].sum():,.0f}"
      f"  ≈ pred {pred:,.0f}")

# Visualisation
shap.plots.waterfall(shap.Explanation(
    values=shap_values[idx], base_values=baseline,
    data=row.values, feature_names=features))
shap.summary_plot(shap_values, X_test, feature_names=features)
shap.dependence_plot("sqft", shap_values, X_test)
shap.force_plot(baseline, shap_values[idx], row, feature_names=features)
inter = explainer.shap_interaction_values(X_test.iloc[:200])
shap.summary_plot(inter, X_test.iloc[:200], feature_names=features)`}
          </CodeBlock>

          <CodeBlock language="python" title="lime_comparison.py">
            {`# LIME để so sánh với SHAP trên cùng 1 instance
import lime
import lime.lime_tabular
import numpy as np

explainer_lime = lime.lime_tabular.LimeTabularExplainer(
    training_data=X_train.values,
    feature_names=features,
    mode="regression",
    discretize_continuous=True,
)

# Giải thích cùng instance idx=42
exp = explainer_lime.explain_instance(
    data_row=X_test.iloc[42].values,
    predict_fn=model.predict,
    num_features=5,
    num_samples=5000,      # số mẫu perturbation
)

print("LIME weights (xấp xỉ tuyến tính cục bộ):")
for feat, weight in exp.as_list():
    print(f"  {feat}: {weight:+.2f}")

# LƯU Ý: LIME có thể KHÔNG ổn định — chạy 2 lần có thể ra kết quả khác
# do random sampling. SHAP deterministic hơn.

# Cố định seed để tái lập; chạy nhiều lần để đo stability
import statistics
np.random.seed(42)
runs = []
for _ in range(10):
    exp_i = explainer_lime.explain_instance(
        X_test.iloc[42].values, model.predict,
        num_features=5, num_samples=5000,
    )
    runs.append(dict(exp_i.as_list()))
for feat in features:
    vals = [r.get(feat, 0) for r in runs]
    print(f"{feat}: mean={statistics.mean(vals):+.2f} std={statistics.stdev(vals):.2f}")`}
          </CodeBlock>

          <Callout variant="warning" title="Giải thích ≠ giải thích đúng">
            <div className="space-y-1">
              <p>
                Attention maps có thể gây hiểu lầm: model "chú ý" vào vùng không
                liên quan (spurious correlation).
              </p>
              <p>
                LIME xấp xỉ cục bộ có thể không phản ánh đúng logic toàn cục
                của model.
              </p>
              <p>
                Cần kết hợp nhiều kỹ thuật XAI + kiểm chứng với chuyên gia
                domain + counterfactual analysis.
              </p>
              <p>
                Một bài nghiên cứu nổi tiếng (Adebayo et al. 2018 — "Sanity
                Checks for Saliency Maps") chỉ ra: nhiều saliency map vẫn cho
                kết quả "đẹp" ngay cả khi model được randomize hoàn toàn. Bài
                học: đừng tin XAI một cách mù quáng — phải có sanity check.
              </p>
            </div>
          </Callout>

          <Callout variant="tip" title="Kiểm định XAI — 3 bước cơ bản">
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                <strong>Sanity check:</strong> randomize trọng số model →
                explanation phải thay đổi. Nếu không đổi, XAI đang nói dóc.
              </li>
              <li>
                <strong>Consistency check:</strong> 2 model gần như tương
                đương (cùng metric) phải cho explanation tương tự cho 1 instance.
              </li>
              <li>
                <strong>Human evaluation:</strong> đưa cho chuyên gia domain
                (bác sĩ, nhân viên tín dụng) xem có make sense không.
              </li>
            </ol>
          </Callout>

          <Callout variant="info" title="So sánh SHAP vs LIME — bảng tóm tắt">
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li><strong>Cơ sở lý thuyết:</strong> SHAP = Shapley values (game theory); LIME = linear surrogate locally.</li>
              <li><strong>Nhất quán:</strong> SHAP có consistency; LIME phụ thuộc sampling.</li>
              <li><strong>Local accuracy:</strong> SHAP đảm bảo Σφ + base = f(x); LIME xấp xỉ, không bảo đảm.</li>
              <li><strong>Tốc độ:</strong> TreeSHAP cực nhanh, KernelSHAP chậm; LIME nhanh đều.</li>
              <li><strong>Deterministic:</strong> TreeSHAP có; LIME không (sampling).</li>
              <li><strong>Global view:</strong> SHAP có summary/beeswarm; LIME không khuyến nghị trung bình các local.</li>
            </ul>
          </Callout>

          <Callout variant="insight" title="Ứng dụng thực tế của XAI">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Tín dụng:</strong> ngân hàng phải nêu lý do từ chối cho
                người vay — SHAP/LIME sinh sẵn "top 3 lý do".
              </li>
              <li>
                <strong>Y tế:</strong> bác sĩ dùng Grad-CAM kiểm tra AI có nhìn
                đúng vùng tổn thương hay không.
              </li>
              <li>
                <strong>Tuyển dụng:</strong> audit để đảm bảo không dùng proxy
                cho giới tính/tuổi.
              </li>
              <li>
                <strong>Pháp lý:</strong> tòa án yêu cầu AI hỗ trợ phán quyết
                phải có explainability tối thiểu.
              </li>
              <li>
                <strong>Giáo dục:</strong> AI chấm điểm tự luận nên giải thích
                tại sao câu A được 8, câu B được 6.
              </li>
            </ul>
          </Callout>

          <h4 className="text-sm font-semibold text-foreground mt-4">
            Pitfalls thường gặp
          </h4>
          <ul className="list-disc pl-5 space-y-1 text-sm text-foreground/80">
            <li>
              <strong>Nhầm correlation với causation:</strong> SHAP chỉ nói
              feature nào ảnh hưởng tới <em>dự đoán</em>, không nói feature đó
              gây ra <em>hiện tượng thực</em>.
            </li>
            <li>
              <strong>Over-interpreting:</strong> một SHAP value lớn không
              đồng nghĩa feature đó là nguyên nhân thực tế.
            </li>
            <li>
              <strong>Cherry-picking:</strong> chọn ra 1 instance có
              explanation "đẹp" để demo, giấu các instance khó giải thích.
            </li>
            <li>
              <strong>Quên counterfactual:</strong> SHAP trả lời "tại sao", còn
              counterfactual trả lời "cần làm gì để đổi kết quả" — thường hữu
              ích hơn cho end-user.
            </li>
            <li>
              <strong>Bỏ qua feature correlation:</strong> khi 2 feature tương
              quan cao, SHAP có thể chia đóng góp không như kỳ vọng. Cần
              SHAP interaction values.
            </li>
          </ul>
        </ExplanationSection>
      </LessonSection>

      {/* =========================================================
          STEP 6 — INLINE CHALLENGE #2 + Chi tiết sâu
          ========================================================= */}
      <LessonSection step={6} totalSteps={8} label="Thử thách 2 & chi tiết">
        <div className="space-y-4">
          <InlineChallenge
            question="Một khách hàng khiếu nại: 'Tại sao AI cho tôi hạn mức thấp hơn người hàng xóm?'. Bạn đang dùng XGBoost. Kỹ thuật nào phù hợp nhất?"
            options={[
              "Feature Importance (global) — trả lời: 'Model quan tâm nhất đến thu nhập'",
              "SHAP local — tính đóng góp từng feature CHO INSTANCE của khách hàng này so với khách hàng hàng xóm (counterfactual)",
              "Không giải thích — chỉ nói 'model đã được test accuracy 95%'",
            ]}
            correct={1}
            explanation="Câu hỏi là về 1 khách hàng cụ thể → cần LOCAL explanation. SHAP waterfall hoặc force plot cho thấy chính xác mỗi feature đóng góp bao nhiêu vào hạn mức. Feature Importance chỉ trả lời câu 'model nói chung quan tâm feature gì' — không đủ."
          />

          <CollapsibleDetail title="Bốn tính chất toán học của Shapley values">
            <div className="space-y-2 text-sm text-foreground/80">
              <p>
                Lloyd Shapley (1953) chứng minh: Shapley value là cách DUY NHẤT
                thoả mãn cả 4 tính chất sau (cơ sở trao giải Nobel Kinh tế 2012):
              </p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>
                  <strong>Efficiency (local accuracy):</strong> Σ φ_i = f(x) −
                  E[f(X)]. Tổng đóng góp = độ lệch so với baseline.
                </li>
                <li>
                  <strong>Symmetry:</strong> 2 feature đóng góp như nhau trong
                  mọi coalition → có Shapley value bằng nhau.
                </li>
                <li>
                  <strong>Dummy (null player):</strong> feature không bao giờ
                  ảnh hưởng → Shapley value = 0.
                </li>
                <li>
                  <strong>Additivity:</strong> nếu model f = f1 + f2, thì
                  Shapley(f) = Shapley(f1) + Shapley(f2).
                </li>
              </ol>
              <p className="text-xs text-muted">
                Chính 4 tính chất này đảm bảo SHAP nhất quán qua các model khác
                nhau — không như LIME/Feature Importance vốn có thể mâu thuẫn.
                Hệ quả: nếu bạn cần "chứng minh trước toà rằng cách phân bổ của
                AI là công bằng", Shapley là lựa chọn có nền tảng toán học rõ
                ràng nhất.
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="Vì sao LIME đôi khi cho kết quả khác nhau mỗi lần?">
            <div className="space-y-2 text-sm text-foreground/80">
              <p>
                LIME sinh <em>perturbations</em> (nhiễu) quanh instance cần
                giải thích — ví dụ 5.000 điểm ngẫu nhiên. Sau đó fit linear
                regression để xấp xỉ model phức tạp trong vùng đó.
              </p>
              <p>
                Vấn đề: <strong>random sampling</strong> → chạy lần 1 vs lần 2
                có thể khác nhau vài %. Để giảm, tăng <code>num_samples</code>{" "}
                lên 10k+ hoặc cố định random seed.
              </p>
              <p>
                SHAP TreeExplainer ngược lại hoàn toàn{" "}
                <strong>deterministic</strong> — kết quả giống nhau mỗi lần
                chạy.
              </p>
              <LaTeX block>
                {
                  "\\hat{g}(z') = \\arg\\min_{g \\in G} \\sum_{z, z' \\in Z} \\pi_x(z) \\, \\big( f(z) - g(z') \\big)^2 + \\Omega(g)"
                }
              </LaTeX>
              <p className="text-xs text-muted">
                Công thức LIME: fit model đơn giản g ∈ G (linear regression) để
                minimize loss có trọng số π_x theo khoảng cách tới x, + penalty
                phức tạp Ω(g). Trọng số π_x thường là kernel Gaussian theo
                khoảng cách Euclid — chọn bandwidth kernel là siêu tham số cần
                tuning.
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="Khi nào chọn Grad-CAM, Integrated Gradients, hay Attention?">
            <div className="space-y-2 text-sm text-foreground/80">
              <p>
                Với ảnh và text, saliency map là XAI phổ biến nhất. Ba lựa chọn
                chính:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Grad-CAM:</strong> Gradient-weighted Class Activation
                  Mapping. Cho mọi CNN có convolution layer. Rất nhanh, chất
                  lượng visual tốt. Giới hạn: chỉ ở resolution của feature map
                  cuối cùng (thường 7×7 hoặc 14×14 trên ImageNet).
                </li>
                <li>
                  <strong>Integrated Gradients:</strong> Sundararajan et al.
                  2017. Đi từ baseline (ảnh đen) đến ảnh thật theo đường thẳng,
                  tích phân gradient. Thoả axiom "completeness" (tương tự
                  efficiency của SHAP). Chạy chậm hơn Grad-CAM.
                </li>
                <li>
                  <strong>Attention rollout:</strong> cho Transformer (ViT,
                  BERT). Nhân các ma trận attention qua các layer để thấy
                  token/patch nào ảnh hưởng output. Cẩn thận: attention KHÔNG
                  đảm bảo là explanation đúng — nhiều bài báo chứng minh
                  attention có thể "lừa" được.
                </li>
              </ul>
              <p className="text-xs text-muted">
                Quy tắc ngón tay: CNN → Grad-CAM; Transformer → attention
                rollout + Integrated Gradients; cần đảm bảo tính toán chặt →
                Integrated Gradients hoặc SHAP DeepExplainer.
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="Counterfactual explanations — 'nếu-thì' cho end-user">
            <div className="space-y-2 text-sm text-foreground/80">
              <p>
                Thay vì nói "feature X đóng góp −40%", counterfactual nói:{" "}
                <em>
                  "Nếu thu nhập của bạn cao hơn 3 triệu/tháng VÀ lịch sử tín
                  dụng sạch trong 6 tháng gần nhất, AI sẽ duyệt hồ sơ."
                </em>{" "}
                Đây là dạng giải thích thân thiện nhất cho người dùng cuối, vì
                nó gắn với hành động cụ thể.
              </p>
              <p>
                Yêu cầu của một counterfactual tốt:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Feasible:</strong> người dùng có thể thay đổi được.
                  "Nếu bạn sinh ở quận khác" — KHÔNG được phép.
                </li>
                <li>
                  <strong>Minimal:</strong> thay đổi nhỏ nhất có thể để đảo
                  quyết định. Dễ thực hiện.
                </li>
                <li>
                  <strong>Plausible:</strong> nằm trong phân phối data thực.
                  Không đưa ra kịch bản phi lý.
                </li>
                <li>
                  <strong>Sparse:</strong> chỉ thay đổi 1-2 feature, không phải
                  10.
                </li>
              </ul>
              <p className="text-xs text-muted">
                Các thư viện: DiCE (Microsoft), Alibi, CERTIFAI. Kết hợp
                counterfactual + SHAP = "tại sao bị từ chối" + "cần làm gì để
                đổi kết quả" — trải nghiệm XAI hoàn chỉnh cho end-user.
              </p>
            </div>
          </CollapsibleDetail>
        </div>
      </LessonSection>

      {/* =========================================================
          STEP 7 — MINI SUMMARY
          ========================================================= */}
      <LessonSection step={7} totalSteps={8} label="Tóm tắt">
        <MiniSummary
          title="Explainability — 6 ý cần nhớ"
          points={[
            "XAI = giúp con người hiểu TẠI SAO AI quyết định, không chỉ kết quả cuối cùng.",
            "SHAP (chính xác, lý thuyết trò chơi, deterministic) vs LIME (nhanh, xấp xỉ cục bộ, có noise) vs Grad-CAM (cho ảnh/text).",
            "Local explanation (SHAP/LIME per instance) ≠ Global importance — dùng đúng mục đích.",
            "Shapley value có 4 tính chất độc nhất: efficiency, symmetry, dummy, additivity → chuẩn mực công bằng.",
            "XAI giúp phát hiện bias ẩn: nếu 'vùng miền' ảnh hưởng 10% → dấu hiệu phân biệt đối xử gián tiếp.",
            "Bắt buộc cho AI rủi ro cao: tín dụng, y tế, tuyển dụng, tư pháp. EU AI Act, GDPR Art. 22, Nghị định 13/2023.",
          ]}
        />
      </LessonSection>

      {/* =========================================================
          STEP 8 — QUIZ
          ========================================================= */}
      <LessonSection step={8} totalSteps={8} label="Kiểm tra">
        <QuizSection questions={QUIZ_QUESTIONS} />
      </LessonSection>

      {/* =========================================================
          BONUS — 4 Callouts tham khảo cuối bài
          ========================================================= */}
      <LessonSection step={8} totalSteps={8} label="Tham khảo nhanh">
        <div className="space-y-3">
          <Callout variant="tip" title="Ứng dụng XAI tại Việt Nam">
            <div className="space-y-1">
              <p>
                <strong>Ngân hàng:</strong> NHNN yêu cầu lý do rõ ràng khi từ
                chối tín dụng. SHAP giúp tạo giải thích tự động bằng tiếng Việt.
              </p>
              <p>
                <strong>Y tế:</strong> AI hỗ trợ chẩn đoán ở bệnh viện tuyến
                huyện cần Grad-CAM để bác sĩ kiểm tra AI "nhìn" đúng vùng.
              </p>
              <p>
                <strong>Bảo hiểm:</strong> AI từ chối bồi thường phải giải
                thích điều khoản cụ thể bị vi phạm — không thể "máy tính nói
                thế".
              </p>
              <p>
                <strong>Pháp luật:</strong> Nghị định 13/2023/NĐ-CP về bảo vệ
                dữ liệu cá nhân ngày càng yêu cầu giải thích AI quyết định.
              </p>
              <p>
                <strong>Giáo dục:</strong> Bộ GD&ĐT đang cân nhắc chuẩn mực cho
                AI chấm thi tự luận — không được "máy chấm mà không biết vì sao
                được điểm này".
              </p>
            </div>
          </Callout>

          <Callout variant="info" title="Khi nào chọn SHAP, LIME, hay Grad-CAM?">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Tabular data + tree model (XGBoost, LightGBM):</strong>{" "}
                TreeSHAP — nhanh, chính xác, deterministic.
              </li>
              <li>
                <strong>Tabular data + bất kỳ model nào:</strong> KernelSHAP
                (chậm) hoặc LIME (nhanh, noise).
              </li>
              <li>
                <strong>Text classification:</strong> LIME hoặc Integrated
                Gradients — highlight từ quan trọng.
              </li>
              <li>
                <strong>Computer vision:</strong> Grad-CAM, Attention rollout,
                SmoothGrad — tạo heat map trên ảnh.
              </li>
              <li><strong>NN tabular (FT-Transformer, TabNet):</strong> DeepSHAP / Integrated Gradients.</li>
            </ul>
          </Callout>

          <Callout
            variant="warning"
            title="Pitfall: explainability không phải causation"
          >
            <p>
              SHAP cho biết feature X đóng góp bao nhiêu vào <em>dự đoán</em>,
              KHÔNG phải vào <em>hiện tượng thực tế</em>. Ví dụ: model chẩn
              đoán ung thư có thể dựa vào "có dấu thước trong ảnh" (bệnh viện
              đo khối u → có thước trong ảnh) — SHAP chỉ ra đúng hành vi
              model, nhưng model đang học spurious correlation.
            </p>
            <p className="mt-2">
              Muốn đi từ "feature quan trọng" sang "feature gây ra", bạn cần
              <em> causal inference</em> (do-calculus, instrumental variables,
              A/B test) — đó là một lĩnh vực khác, không phải XAI.
            </p>
          </Callout>

          <Callout
            variant="insight"
            title="Counterfactual explanations — 'Nếu… thì…'"
          >
            <p>
              Một dạng XAI thân thiện với người dùng:{" "}
              <em>
                "Nếu thu nhập của bạn cao hơn 2 triệu/tháng và lịch sử tín
                dụng sạch, bạn sẽ được duyệt."
              </em>{" "}
              Thay vì liệt kê % đóng góp, counterfactual chỉ ra{" "}
              <strong>thay đổi nhỏ nhất</strong> để đổi quyết định. Rất hữu
              ích cho khách hàng muốn cải thiện profile. Kết hợp với SHAP để
              có cả "tại sao bị từ chối" và "cần làm gì để đổi kết quả".
            </p>
          </Callout>

          <Callout variant="tip" title="Checklist triển khai XAI trong doanh nghiệp">
            <ol className="list-decimal pl-5 space-y-1">
              <li>Xác định đối tượng giải thích (end-user, kiểm toán, data scientist) — mỗi nhóm cần loại khác nhau.</li>
              <li>Chọn kỹ thuật phù hợp với loại dữ liệu và model (tree/NN/linear, tabular/text/image).</li>
              <li>Đóng gói vào pipeline MLOps: mỗi prediction → sinh kèm explanation + lưu version.</li>
              <li>Giám sát drift của explanation (top feature đổi đột ngột → alert).</li>
              <li>Audit định kỳ: chuyên gia domain và pháp lý review mẫu ngẫu nhiên.</li>
              <li>Chuẩn bị "explanation UI" thân thiện cho end-user, không phải bảng số khô khan.</li>
            </ol>
          </Callout>
        </div>
      </LessonSection>
    </>
  );
}
