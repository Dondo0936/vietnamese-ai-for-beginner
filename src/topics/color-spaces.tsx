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
  TabView,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "color-spaces",
  title: "Color Spaces",
  titleVi: "Không gian màu",
  description:
    "Các hệ thống biểu diễn màu sắc khác nhau (RGB, HSV, LAB) và ứng dụng trong xử lý ảnh.",
  category: "computer-vision",
  tags: ["computer-vision", "preprocessing", "color"],
  difficulty: "beginner",
  relatedSlugs: ["image-kernels", "data-augmentation", "image-classification"],
  vizType: "interactive",
};

/* ────────────────────────────────────────────────────────────
 * Helpers toán học — chuyển đổi giữa các không gian màu
 * ──────────────────────────────────────────────────────────── */

// Chuyển RGB (0-255) → HSL (H: 0-360, S: 0-1, L: 0-1)
function rgbToHsl(
  r: number,
  g: number,
  b: number
): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
        break;
      case gn:
        h = ((bn - rn) / d + 2) * 60;
        break;
      case bn:
        h = ((rn - gn) / d + 4) * 60;
        break;
    }
  }
  return [h, s, l];
}

// Chuyển RGB (0-255) → HSV (H: 0-360, S: 0-1, V: 0-1)
function rgbToHsv(
  r: number,
  g: number,
  b: number
): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  const v = max;
  const s = max === 0 ? 0 : d / max;
  let h = 0;
  if (d !== 0) {
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
        break;
      case gn:
        h = ((bn - rn) / d + 2) * 60;
        break;
      case bn:
        h = ((rn - gn) / d + 4) * 60;
        break;
    }
  }
  return [h, s, v];
}

// Chuyển RGB (sRGB 0-255) → XYZ (D65) dùng để tính LAB
function rgbToXyz(
  r: number,
  g: number,
  b: number
): [number, number, number] {
  const srgb = [r, g, b].map((c) => {
    const v = c / 255;
    return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92;
  });
  const [R, G, B] = srgb;
  // Ma trận sRGB → XYZ (D65)
  const x = R * 0.4124564 + G * 0.3575761 + B * 0.1804375;
  const y = R * 0.2126729 + G * 0.7151522 + B * 0.072175;
  const z = R * 0.0193339 + G * 0.119192 + B * 0.9503041;
  return [x * 100, y * 100, z * 100];
}

// Chuyển XYZ → LAB (D65 reference white)
function xyzToLab(
  x: number,
  y: number,
  z: number
): [number, number, number] {
  const Xn = 95.047;
  const Yn = 100.0;
  const Zn = 108.883;
  const f = (t: number) =>
    t > 0.008856 ? Math.cbrt(t) : (903.3 * t + 16) / 116;
  const fx = f(x / Xn);
  const fy = f(y / Yn);
  const fz = f(z / Zn);
  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b = 200 * (fy - fz);
  return [L, a, b];
}

// Hàm tổng hợp: RGB → LAB
function rgbToLab(
  r: number,
  g: number,
  b: number
): [number, number, number] {
  const [x, y, z] = rgbToXyz(r, g, b);
  return xyzToLab(x, y, z);
}

// Tiện ích: format số
const fmt = (n: number, d = 1) =>
  Number.isFinite(n) ? n.toFixed(d) : "0";

/* ────────────────────────────────────────────────────────────
 * Preset màu ví dụ để user click xem kết quả nhanh
 * ──────────────────────────────────────────────────────────── */

interface ColorPreset {
  id: string;
  label: string;
  rgb: [number, number, number];
  note: string;
}

const PRESETS: ColorPreset[] = [
  { id: "red", label: "Đỏ (đèn dừng)", rgb: [230, 45, 45], note: "H ≈ 0° — lý tưởng để lọc trong HSV." },
  { id: "green-leaf", label: "Xanh lá non", rgb: [120, 200, 80], note: "H ≈ 90° — phân biệt lá khoẻ/bệnh." },
  { id: "blue-sky", label: "Xanh da trời", rgb: [80, 160, 230], note: "H ≈ 210° — xanh dương sáng." },
  { id: "yellow-sick", label: "Vàng lá bệnh", rgb: [220, 190, 60], note: "Dùng LAB để so sánh tinh tế." },
  { id: "skin", label: "Da người VN", rgb: [210, 170, 130], note: "YCrCb tốt cho skin detection." },
  { id: "traffic-yellow", label: "Vàng biển báo", rgb: [245, 200, 30], note: "H ≈ 48° — tách khỏi nền." },
  { id: "purple", label: "Tím hoa sim", rgb: [140, 90, 180], note: "Ít gặp trong tự nhiên VN." },
  { id: "grey", label: "Xám trung tính", rgb: [128, 128, 128], note: "S = 0 — nằm trên trục của HSV/HSL." },
];

/* ────────────────────────────────────────────────────────────
 * Quiz — 8 câu hỏi theo yêu cầu
 * ──────────────────────────────────────────────────────────── */

const QUIZ: QuizQuestion[] = [
  {
    question: "Tại sao HSV tốt hơn RGB cho bài toán phát hiện đèn đỏ giao thông?",
    options: [
      "HSV có nhiều kênh hơn RGB",
      "HSV tách biệt sắc màu (Hue) khỏi độ sáng — lọc 'màu đỏ' dễ dàng bất kể sáng/tối",
      "HSV nhanh hơn RGB khi xử lý",
      "HSV có độ phân giải cao hơn",
    ],
    correct: 1,
    explanation:
      "Trong RGB, 'đỏ sáng' (255,50,50) và 'đỏ tối' (120,20,20) có giá trị rất khác nhau trên cả 3 kênh — khó viết ngưỡng. Trong HSV, cả 2 đều có H ≈ 0-10° hoặc 350-360°. Chỉ cần lọc theo Hue là xong.",
  },
  {
    question: "Ảnh y tế thường chuyển sang LAB trước khi so sánh màu. Tại sao?",
    options: [
      "LAB nhẹ hơn RGB khi xử lý",
      "LAB đồng đều tri giác — khoảng cách Euclidean phản ánh đúng sự khác biệt mắt người thấy",
      "LAB có nhiều màu hơn RGB",
      "LAB không cần chuyển đổi",
    ],
    correct: 1,
    explanation:
      "Trong RGB, 2 cặp màu có cùng khoảng cách Euclidean có thể trông rất khác hoặc rất giống. LAB được thiết kế để ΔE = khác biệt tri giác. Quan trọng cho ảnh y tế, kiểm tra chất lượng in ấn, thiết kế màu.",
  },
  {
    question: "Chuyển ảnh sang Grayscale bằng công thức Y = 0.299R + 0.587G + 0.114B — trọng số xanh lá cao nhất. Vì sao?",
    options: [
      "Ngẫu nhiên, không có ý nghĩa",
      "Vì mắt người nhạy với ánh sáng xanh lá nhất (tế bào nón M peak ở ~530nm), đỏ kế đó, xanh dương ít nhất",
      "Vì màn hình phát xanh lá mạnh nhất",
      "Vì xanh lá là màu trung tâm của quang phổ",
    ],
    correct: 1,
    explanation:
      "Sinh lý học thị giác: tế bào nón M (medium wavelength) peak ở ~530nm (xanh lá) và là loại đóng góp lớn nhất vào cảm nhận độ sáng. Đỏ (L cone, ~560nm) đứng thứ hai. Xanh dương (S cone, ~420nm) ít nhất. BT.601 dùng chính xác các trọng số này.",
  },
  {
    question: "Bạn cần detect da người cho ứng dụng eKYC Việt Nam. Không gian màu nào thường được ưu tiên?",
    options: [
      "RGB trực tiếp",
      "Grayscale",
      "YCrCb — kênh Cr (133-173) và Cb (77-127) ổn định cho da, bất kể điều kiện sáng",
      "CMYK",
    ],
    correct: 2,
    explanation:
      "YCrCb tách độ sáng (Y) khỏi sắc (Cr, Cb). Màu da người tập trung ở vùng nhỏ trong mặt phẳng Cr-Cb → detect bằng ngưỡng đơn giản. RGB bị ảnh hưởng mạnh bởi ánh sáng chụp, HSV cũng tốt nhưng YCrCb thường cho kết quả ổn định hơn trong ảnh JPEG.",
  },
  {
    type: "fill-blank",
    question:
      "HSV mô tả màu bằng 3 tham số: {blank} (sắc màu, đơn vị độ 0-360), Saturation (độ đậm), và {blank} (độ sáng).",
    blanks: [
      { answer: "Hue", accept: ["hue", "sắc", "sac"] },
      { answer: "Value", accept: ["value", "v", "brightness"] },
    ],
    explanation:
      "H = Hue (0° đỏ, 120° xanh lá, 240° xanh dương). S = Saturation (0 = xám, 1 = bão hoà). V = Value (0 = đen, 1 = sáng). HSL thì thay V bằng L (Lightness: 0 = đen, 0.5 = màu thuần, 1 = trắng).",
  },
  {
    question: "Không gian màu nào KHÔNG phụ thuộc thiết bị (device-independent) — nghĩa là cùng một giá trị LAB trên mọi màn hình đều biểu thị cùng một màu vật lý?",
    options: [
      "sRGB",
      "CMYK",
      "LAB (CIE L*a*b*)",
      "YCrCb",
    ],
    correct: 2,
    explanation:
      "LAB dựa trên mô hình thị giác người (CIE 1976), không gắn với bất kỳ thiết bị nào. sRGB, Adobe RGB, Display-P3 đều là device-dependent (phụ thuộc đặc tính monitor). CMYK phụ thuộc mực và giấy. Vì vậy LAB là không gian trung gian lý tưởng khi cần chuyển đổi chính xác giữa các thiết bị.",
  },
  {
    question:
      "Bạn huấn luyện CNN phân loại lá cà phê khoẻ / bệnh. Nếu ảnh chụp ở nhiều điều kiện sáng khác nhau, preprocessing nào giúp nhất?",
    options: [
      "Chuyển sang grayscale để bỏ màu",
      "Chuyển sang HSV và chuẩn hoá kênh V (hoặc dùng chỉ H, S) để giảm phụ thuộc ánh sáng",
      "Không làm gì — CNN tự học được",
      "Tăng độ sáng toàn bộ ảnh lên 2 lần",
    ],
    correct: 1,
    explanation:
      "Grayscale mất thông tin màu — chính là tín hiệu quan trọng cho bệnh thực vật. Để CNN tự học được cần dataset khổng lồ. Giải pháp trung gian: HSV, chuẩn hoá V (hoặc CLAHE trên V) để giảm biến thiên ánh sáng, giữ nguyên H + S. Đây là kỹ thuật cổ điển vẫn hiệu quả cho dataset nhỏ.",
  },
  {
    question:
      "ΔE trong LAB = 1 được coi là 'vừa đủ phân biệt' bởi mắt người. ΔE = 5 trong LAB nghĩa là gì?",
    options: [
      "Hai màu giống nhau tuyệt đối",
      "Sự khác biệt dễ thấy — quan trọng với kiểm tra in ấn, thiết kế thương hiệu",
      "Hai màu đen khác nhau",
      "ΔE không có ý nghĩa thực tế",
    ],
    correct: 1,
    explanation:
      "Thang JND (Just Noticeable Difference): ΔE < 1 = mắt thường không phân biệt được; ΔE 1-2 = người tinh mắt thấy; ΔE 3-5 = ai cũng thấy khác; ΔE > 5 = khác biệt rõ rệt. Các công ty in ấn thường có tiêu chuẩn ΔE < 2 giữa lô in và proof.",
  },
];

/* ────────────────────────────────────────────────────────────
 * Component chính
 * ──────────────────────────────────────────────────────────── */

export default function ColorSpacesTopic() {
  const [r, setR] = useState(66);
  const [g, setG] = useState(135);
  const [b, setB] = useState(245);

  // Tính toán các không gian màu derived
  const [hueHsv, satHsv, valHsv] = useMemo(
    () => rgbToHsv(r, g, b),
    [r, g, b]
  );
  const [hueHsl, satHsl, ligHsl] = useMemo(
    () => rgbToHsl(r, g, b),
    [r, g, b]
  );
  const [L, A, B] = useMemo(() => rgbToLab(r, g, b), [r, g, b]);

  const rgbCss = `rgb(${r}, ${g}, ${b})`;
  const hslCss = `hsl(${fmt(hueHsl)}, ${fmt(satHsl * 100)}%, ${fmt(
    ligHsl * 100
  )}%)`;

  const applyPreset = useCallback((p: ColorPreset) => {
    setR(p.rgb[0]);
    setG(p.rgb[1]);
    setB(p.rgb[2]);
  }, []);

  // Grayscale (Rec. 601)
  const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  const grayCss = `rgb(${gray}, ${gray}, ${gray})`;

  return (
    <>
      {/* ──────────────── STEP 1: PREDICTION ──────────────── */}
      <LessonSection step={1} totalSteps={10} label="Dự đoán">
        <PredictionGate
          question="Bạn cần phát hiện đèn đỏ giao thông. Trong ảnh RGB, 'đỏ sáng' có R=255, G=50, B=50 nhưng 'đỏ tối' có R=150, G=20, B=20 — giá trị rất khác nhau! Làm sao lọc dễ dàng hơn?"
          options={[
            "Tăng độ sáng toàn bộ ảnh rồi dùng RGB",
            "Chuyển sang HSV — chỉ lọc theo Hue (sắc đỏ), bỏ qua sáng/tối",
            "Dùng ảnh đen trắng (grayscale)",
          ]}
          correct={1}
          explanation="HSV tách sắc màu (Hue) khỏi độ sáng (Value). 'Đỏ sáng' và 'đỏ tối' đều có H gần 0-10° hoặc 350-360° — chỉ cần lọc 1 kênh Hue thay vì ngưỡng 3 kênh RGB phức tạp! Đây là lý do OpenCV có hàm cv2.cvtColor(img, cv2.COLOR_BGR2HSV) — nó là bước preprocessing hầu như bắt buộc cho segmentation theo màu."
        />
      </LessonSection>

      {/* ──────────────── STEP 2: VISUALIZATION ──────────────── */}
      <LessonSection step={2} totalSteps={10} label="Khám phá — Color Space Converter">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Kéo 3 slider R / G / B bên dưới. Các ô bên phải sẽ cập nhật LIVE
          sang HSV, HSL, LAB và Grayscale — kèm hình minh hoạ (bánh xe HSV,
          xi-lanh HSL, mặt phẳng a*b* của LAB).
        </p>

        <VisualizationSection>
          <div className="space-y-6">
            {/* Sliders */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <label
                  className="flex items-center justify-between text-sm font-medium"
                  style={{ color: "#ef4444" }}
                >
                  <span>Red</span>
                  <span className="font-mono">{r}</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={255}
                  value={r}
                  onChange={(e) => setR(parseInt(e.target.value))}
                  className="w-full accent-red-500"
                />
              </div>
              <div className="space-y-1">
                <label
                  className="flex items-center justify-between text-sm font-medium"
                  style={{ color: "#22c55e" }}
                >
                  <span>Green</span>
                  <span className="font-mono">{g}</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={255}
                  value={g}
                  onChange={(e) => setG(parseInt(e.target.value))}
                  className="w-full accent-green-500"
                />
              </div>
              <div className="space-y-1">
                <label
                  className="flex items-center justify-between text-sm font-medium"
                  style={{ color: "#3b82f6" }}
                >
                  <span>Blue</span>
                  <span className="font-mono">{b}</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={255}
                  value={b}
                  onChange={(e) => setB(parseInt(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
            </div>

            {/* Preset buttons */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">
                Thử preset nhanh
              </p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface transition-colors"
                  >
                    <span
                      className="inline-block h-4 w-4 rounded border border-border"
                      style={{
                        backgroundColor: `rgb(${p.rgb[0]},${p.rgb[1]},${p.rgb[2]})`,
                      }}
                    />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview swatch */}
            <motion.div
              key={rgbCss}
              initial={{ scale: 0.98, opacity: 0.85 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-2 gap-3 md:grid-cols-4"
            >
              <div className="rounded-xl border border-border overflow-hidden">
                <div
                  className="h-24 w-full"
                  style={{ backgroundColor: rgbCss }}
                />
                <div className="px-3 py-2 text-xs">
                  <p className="font-semibold text-foreground">RGB</p>
                  <p className="font-mono text-muted">
                    ({r}, {g}, {b})
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-border overflow-hidden">
                <div
                  className="h-24 w-full"
                  style={{ backgroundColor: hslCss }}
                />
                <div className="px-3 py-2 text-xs">
                  <p className="font-semibold text-foreground">HSL</p>
                  <p className="font-mono text-muted">
                    ({fmt(hueHsl)}°, {fmt(satHsl * 100, 0)}%,{" "}
                    {fmt(ligHsl * 100, 0)}%)
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-border overflow-hidden">
                <div
                  className="h-24 w-full"
                  style={{
                    backgroundColor: rgbCss,
                    filter: "saturate(1.2)",
                  }}
                />
                <div className="px-3 py-2 text-xs">
                  <p className="font-semibold text-foreground">HSV</p>
                  <p className="font-mono text-muted">
                    ({fmt(hueHsv)}°, {fmt(satHsv * 100, 0)}%,{" "}
                    {fmt(valHsv * 100, 0)}%)
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-border overflow-hidden">
                <div
                  className="h-24 w-full"
                  style={{ backgroundColor: grayCss }}
                />
                <div className="px-3 py-2 text-xs">
                  <p className="font-semibold text-foreground">LAB / Gray</p>
                  <p className="font-mono text-muted">
                    L={fmt(L, 1)} a={fmt(A, 1)} b={fmt(B, 1)}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Visualizations: HSV wheel + HSL cylinder + LAB plane */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* HSV wheel */}
              <div className="rounded-xl border border-border bg-background/40 p-3 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wide text-accent">
                  HSV — bánh xe màu
                </h4>
                <svg viewBox="0 0 160 160" className="w-full">
                  <defs>
                    {/* 6-segment hue wheel */}
                    <linearGradient id="hsv-0" x1="0" x2="1">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                  </defs>
                  {/* Tạo 36 slice quanh trung tâm thể hiện Hue */}
                  {Array.from({ length: 36 }).map((_, i) => {
                    const a1 = (i * 10 - 90) * (Math.PI / 180);
                    const a2 = ((i + 1) * 10 - 90) * (Math.PI / 180);
                    const r1 = 30;
                    const r2 = 70;
                    const x1 = 80 + r1 * Math.cos(a1);
                    const y1 = 80 + r1 * Math.sin(a1);
                    const x2 = 80 + r2 * Math.cos(a1);
                    const y2 = 80 + r2 * Math.sin(a1);
                    const x3 = 80 + r2 * Math.cos(a2);
                    const y3 = 80 + r2 * Math.sin(a2);
                    const x4 = 80 + r1 * Math.cos(a2);
                    const y4 = 80 + r1 * Math.sin(a2);
                    const hue = i * 10;
                    return (
                      <path
                        key={i}
                        d={`M ${x1} ${y1} L ${x2} ${y2} A ${r2} ${r2} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${r1} ${r1} 0 0 0 ${x1} ${y1} Z`}
                        fill={`hsl(${hue}, 85%, 50%)`}
                      />
                    );
                  })}
                  {/* Vòng trong: saturation thấp */}
                  <circle
                    cx={80}
                    cy={80}
                    r={30}
                    fill={`hsl(${fmt(hueHsv)}, ${fmt(
                      satHsv * 100
                    )}%, 90%)`}
                  />
                  {/* Marker vị trí màu hiện tại */}
                  <g>
                    {(() => {
                      const ang =
                        (hueHsv - 90) * (Math.PI / 180);
                      const radius = 30 + satHsv * 40;
                      const cx = 80 + radius * Math.cos(ang);
                      const cy = 80 + radius * Math.sin(ang);
                      return (
                        <>
                          <circle
                            cx={cx}
                            cy={cy}
                            r={6}
                            fill="white"
                            stroke="#0f172a"
                            strokeWidth={2}
                          />
                          <circle
                            cx={cx}
                            cy={cy}
                            r={3}
                            fill={rgbCss}
                          />
                        </>
                      );
                    })()}
                  </g>
                </svg>
                <p className="text-[10px] text-muted leading-snug">
                  Góc = Hue ({fmt(hueHsv)}°). Bán kính = Saturation (
                  {fmt(satHsv * 100, 0)}%). Value ({fmt(valHsv * 100, 0)}%)
                  là 'độ sáng' của bánh xe.
                </p>
              </div>

              {/* HSL cylinder */}
              <div className="rounded-xl border border-border bg-background/40 p-3 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wide text-accent">
                  HSL — xi-lanh màu
                </h4>
                <svg viewBox="0 0 160 160" className="w-full">
                  {/* thân xi-lanh */}
                  <ellipse
                    cx={80}
                    cy={30}
                    rx={50}
                    ry={14}
                    fill={`hsl(${fmt(hueHsl)}, 90%, 85%)`}
                    stroke="#334155"
                    strokeWidth={1}
                  />
                  <rect
                    x={30}
                    y={30}
                    width={100}
                    height={100}
                    fill={`url(#hsl-grad-${r}-${g}-${b})`}
                    stroke="#334155"
                    strokeWidth={1}
                  />
                  <ellipse
                    cx={80}
                    cy={130}
                    rx={50}
                    ry={14}
                    fill={`hsl(${fmt(hueHsl)}, 90%, 15%)`}
                    stroke="#334155"
                    strokeWidth={1}
                  />
                  <defs>
                    <linearGradient
                      id={`hsl-grad-${r}-${g}-${b}`}
                      x1="0"
                      x2="0"
                      y1="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={`hsl(${fmt(hueHsl)}, 90%, 85%)`}
                      />
                      <stop
                        offset="50%"
                        stopColor={`hsl(${fmt(hueHsl)}, 90%, 50%)`}
                      />
                      <stop
                        offset="100%"
                        stopColor={`hsl(${fmt(hueHsl)}, 90%, 15%)`}
                      />
                    </linearGradient>
                  </defs>
                  {/* marker theo L */}
                  <g>
                    {(() => {
                      const yPos = 30 + (1 - ligHsl) * 100;
                      const xPos = 80 + satHsl * 40;
                      return (
                        <>
                          <line
                            x1={30}
                            y1={yPos}
                            x2={130}
                            y2={yPos}
                            stroke="#f8fafc"
                            strokeWidth={1}
                            strokeDasharray="2 2"
                          />
                          <circle
                            cx={xPos}
                            cy={yPos}
                            r={6}
                            fill="white"
                            stroke="#0f172a"
                            strokeWidth={2}
                          />
                          <circle
                            cx={xPos}
                            cy={yPos}
                            r={3}
                            fill={hslCss}
                          />
                        </>
                      );
                    })()}
                  </g>
                  <text
                    x={80}
                    y={152}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize={11}
                  >
                    Trên = sáng, Dưới = tối
                  </text>
                </svg>
                <p className="text-[10px] text-muted leading-snug">
                  Trục dọc = Lightness ({fmt(ligHsl * 100, 0)}%). HSL khác
                  HSV: L=0.5 là màu thuần, L=1 là trắng (HSV không có
                  'trắng' như vậy).
                </p>
              </div>

              {/* LAB plane (a*b*) */}
              <div className="rounded-xl border border-border bg-background/40 p-3 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wide text-accent">
                  LAB — mặt phẳng a*b*
                </h4>
                <svg viewBox="0 0 160 160" className="w-full">
                  {/* Nền gradient đơn giản hoá mặt phẳng a*b* ở L ≈ 50 */}
                  <defs>
                    <radialGradient id="lab-bg" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#737373" />
                      <stop offset="100%" stopColor="#404040" />
                    </radialGradient>
                  </defs>
                  <rect
                    x={10}
                    y={10}
                    width={140}
                    height={140}
                    fill="url(#lab-bg)"
                    rx={8}
                  />
                  {/* Các vùng gợi ý sắc: đỏ (+a), xanh lá (-a), vàng (+b), xanh dương (-b) */}
                  <rect x={80} y={10} width={70} height={70} fill="#f59e0b" opacity={0.35} />
                  <rect x={10} y={80} width={70} height={70} fill="#22c55e" opacity={0.35} />
                  <rect x={80} y={80} width={70} height={70} fill="#ef4444" opacity={0.35} />
                  <rect x={10} y={10} width={70} height={70} fill="#3b82f6" opacity={0.35} />
                  {/* trục */}
                  <line x1={80} y1={10} x2={80} y2={150} stroke="#fafafa" strokeWidth={1} />
                  <line x1={10} y1={80} x2={150} y2={80} stroke="#fafafa" strokeWidth={1} />
                  <text x={146} y={78} fill="#fafafa" fontSize={11}>+a (đỏ)</text>
                  <text x={12} y={78} fill="#fafafa" fontSize={11}>−a</text>
                  <text x={82} y={18} fill="#fafafa" fontSize={11}>+b (vàng)</text>
                  <text x={82} y={148} fill="#fafafa" fontSize={11}>−b</text>
                  {/* marker vị trí (clamp a,b vào [-128,128] → toạ độ) */}
                  {(() => {
                    const ax = 80 + Math.max(-70, Math.min(70, A * 0.55));
                    const by = 80 - Math.max(-70, Math.min(70, B * 0.55));
                    return (
                      <>
                        <circle cx={ax} cy={by} r={7} fill="white" stroke="#0f172a" strokeWidth={2} />
                        <circle cx={ax} cy={by} r={4} fill={rgbCss} />
                      </>
                    );
                  })()}
                </svg>
                <p className="text-[10px] text-muted leading-snug">
                  a* = {fmt(A, 1)} (đỏ-xanh lá). b* = {fmt(B, 1)}{" "}
                  (vàng-xanh dương). L = {fmt(L, 1)} (độ sáng 0-100).
                </p>
              </div>
            </div>

            {/* Conversion table */}
            <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-surface/50 text-muted">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">
                      Không gian
                    </th>
                    <th className="px-3 py-2 text-left font-semibold">Giá trị</th>
                    <th className="px-3 py-2 text-left font-semibold">
                      Ghi chú
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-3 py-2 font-semibold text-foreground">
                      RGB (sRGB)
                    </td>
                    <td className="px-3 py-2 font-mono text-muted">
                      R={r} · G={g} · B={b}
                    </td>
                    <td className="px-3 py-2 text-muted">
                      Chuẩn lưu trữ trên mọi thiết bị.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-semibold text-foreground">
                      HSV
                    </td>
                    <td className="px-3 py-2 font-mono text-muted">
                      H={fmt(hueHsv)}° · S={fmt(satHsv * 100, 0)}% · V=
                      {fmt(valHsv * 100, 0)}%
                    </td>
                    <td className="px-3 py-2 text-muted">
                      Dễ lọc theo sắc — tốt cho segmentation.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-semibold text-foreground">
                      HSL
                    </td>
                    <td className="px-3 py-2 font-mono text-muted">
                      H={fmt(hueHsl)}° · S={fmt(satHsl * 100, 0)}% · L=
                      {fmt(ligHsl * 100, 0)}%
                    </td>
                    <td className="px-3 py-2 text-muted">
                      Phổ biến trong CSS, thiết kế UI.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-semibold text-foreground">
                      LAB
                    </td>
                    <td className="px-3 py-2 font-mono text-muted">
                      L={fmt(L, 1)} · a={fmt(A, 1)} · b={fmt(B, 1)}
                    </td>
                    <td className="px-3 py-2 text-muted">
                      Đồng đều tri giác — khoảng cách ≈ khác biệt thị giác.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-semibold text-foreground">
                      Grayscale
                    </td>
                    <td className="px-3 py-2 font-mono text-muted">
                      Y={gray}
                    </td>
                    <td className="px-3 py-2 text-muted">
                      0.299R + 0.587G + 0.114B (Rec. 601).
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-xs text-muted">
              Kéo slider và quan sát: khi bạn chỉ tăng R, kênh H trong HSV
              thay đổi tinh tế, L trong HSL thay đổi theo công thức khác;
              LAB có a* tăng rõ (do R tăng = dịch về phía 'đỏ'). Đây là
              minh chứng các không gian màu có 'cảm giác' khác nhau với
              cùng một thay đổi vật lý.
            </p>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ──────────────── STEP 3: AHA MOMENT ──────────────── */}
      <LessonSection step={3} totalSteps={10} label="Khoảnh khắc A-ha">
        <AhaMoment>
          Cùng <strong>một màu vật lý</strong> có thể mô tả bằng nhiều cách:
          RGB (trộn 3 màu cơ bản), HSV/HSL (sắc + đậm + sáng), LAB (sáng + 2
          trục đối lập). Giống như <strong>cùng một địa chỉ</strong> có thể
          ghi bằng toạ độ GPS, tên đường, hay mô tả 'gần chợ Bến Thành'. Không
          gian nào cũng đúng, nhưng{" "}
          <strong>mỗi bài toán có một không gian 'ngôn ngữ tự nhiên'</strong>:
          filter màu → HSV, so sánh cảm quan → LAB, lưu trữ/hiển thị → RGB.
        </AhaMoment>
      </LessonSection>

      {/* ──────────────── STEP 4: INLINE CHALLENGE #1 ──────────────── */}
      <LessonSection step={4} totalSteps={10} label="Thử thách #1">
        <InlineChallenge
          question="Bạn cần so sánh màu da trong ảnh y tế để phát hiện tổn thương (vết nám, viêm). RGB cho kết quả không ổn định vì ảnh hưởng bởi ánh sáng chụp. Dùng không gian màu nào?"
          options={[
            "Grayscale — đơn giản nhất",
            "LAB — đồng đều tri giác, khoảng cách phản ánh đúng sự khác biệt mắt người thấy",
            "HSV — tách sắc khỏi sáng",
            "CMYK — chuẩn in ấn",
          ]}
          correct={1}
          explanation="LAB được thiết kế để khoảng cách Euclidean = sự khác biệt tri giác. 2 màu 'cách nhau 10 đơn vị' trong LAB luôn trông khác nhau cùng mức, bất kể vùng màu nào. Quan trọng cho ứng dụng y tế! HSV cũng tách sắc khỏi sáng nhưng không đồng đều tri giác (khoảng cách trong HSV không tương ứng 1-1 với cảm giác). Grayscale mất thông tin màu — chính là tín hiệu cần đo."
        />
      </LessonSection>

      {/* ──────────────── STEP 5: EXPLANATION ──────────────── */}
      <LessonSection step={5} totalSteps={10} label="Giải thích sâu">
        <ExplanationSection topicSlug={metadata.slug}>
          <p>
            <strong>Không gian màu</strong> là hệ thống toán học biểu diễn
            màu sắc. Mỗi không gian phù hợp với mục đích khác nhau trong xử
            lý ảnh và thị giác máy tính. Bản thân 'màu' là cảm giác chủ
            quan do não bộ tạo ra khi photon kích thích 3 loại tế bào nón
            (L/M/S) — vì vậy mọi biểu diễn đều là xấp xỉ.
          </p>

          <Callout variant="insight" title="5 không gian màu quan trọng nhất">
            <div className="space-y-2 text-sm">
              <p>
                <strong>RGB (Red, Green, Blue):</strong> Chuẩn lưu trữ ảnh. 3
                kênh x 0-255. Phụ thuộc ánh sáng, không tách riêng sắc/sáng.
                sRGB là biến thể chuẩn cho web/màn hình thông thường.
              </p>
              <p>
                <strong>HSV (Hue, Saturation, Value):</strong> Tách sắc màu
                khỏi độ sáng. Lọc màu cụ thể rất dễ. Tốt cho segmentation theo
                màu (đèn giao thông, biển báo).
              </p>
              <p>
                <strong>HSL (Hue, Saturation, Lightness):</strong> Giống HSV
                nhưng L khác V — trong HSL, L=1 là trắng (S=0), trong HSV V=1
                có thể vẫn là màu thuần. HSL phổ biến trong CSS & thiết kế UI.
              </p>
              <p>
                <strong>LAB (CIE L*a*b*):</strong> Đồng đều tri giác. Khoảng
                cách Euclidean = sự khác biệt thị giác (ΔE). Device-independent —
                chuẩn trao đổi giữa thiết bị.
              </p>
              <p>
                <strong>YCrCb / YUV:</strong> Tách luminance (Y) khỏi
                chrominance (Cr, Cb). Dùng trong nén JPEG, phát video, detect
                da người.
              </p>
              <p>
                <strong>Grayscale:</strong> 1 kênh (0-255). Bỏ màu, giữ cấu
                trúc. Nhanh 3x, tốt cho edge detection, OCR.
              </p>
            </div>
          </Callout>

          <p>
            <strong>Công thức chuyển RGB sang Grayscale</strong> (weighted
            average theo tri giác, Rec. 601):
          </p>
          <LaTeX block>{"Y = 0.299\\,R + 0.587\\,G + 0.114\\,B"}</LaTeX>
          <p className="text-sm text-muted">
            Mắt người nhạy với xanh lá (0.587) hơn đỏ (0.299) và xanh dương
            (0.114). Chuẩn BT.709 (HDTV) dùng hệ số khác một chút: 0.2126,
            0.7152, 0.0722.
          </p>

          <p>
            <strong>Công thức RGB → HSV</strong> (với M = max, m = min):
          </p>
          <LaTeX block>
            {
              "V = M, \\quad S = \\begin{cases} 0 & M=0 \\\\ \\frac{M-m}{M} & M>0 \\end{cases}"
            }
          </LaTeX>
          <LaTeX block>
            {
              "H = \\begin{cases} 60^\\circ\\cdot\\frac{G-B}{M-m} & M=R \\\\ 60^\\circ\\cdot\\left(2+\\frac{B-R}{M-m}\\right) & M=G \\\\ 60^\\circ\\cdot\\left(4+\\frac{R-G}{M-m}\\right) & M=B \\end{cases}"
            }
          </LaTeX>

          <p>
            <strong>Khoảng cách trong LAB (ΔE*76):</strong>
          </p>
          <LaTeX block>
            {
              "\\Delta E^{*}_{76} = \\sqrt{(L_1-L_2)^2 + (a_1-a_2)^2 + (b_1-b_2)^2}"
            }
          </LaTeX>
          <p className="text-sm text-muted">
            ΔE &lt; 1: mắt không phân biệt. ΔE 1-3: cần tinh mắt. ΔE &gt; 5:
            khác biệt rõ. Phiên bản ΔE*2000 chính xác hơn nhưng phức tạp.
          </p>

          <Callout variant="warning" title="Ứng dụng thực tế tại Việt Nam">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <strong>Camera giao thông TP.HCM / HN:</strong> HSV để phát
                hiện đèn đỏ, biển báo theo màu (xanh, đỏ, vàng) — robust
                với đèn đường ban đêm.
              </li>
              <li>
                <strong>Nông nghiệp (cà phê, thanh long):</strong> HSV/LAB
                để phân biệt lá khoẻ (xanh bão hoà) vs lá bệnh (vàng/nâu).
                LAB cho bài 'độ chín' trái thanh long chính xác hơn HSV.
              </li>
              <li>
                <strong>eKYC (CCCD):</strong> Grayscale + edge detection
                cho OCR trên CCCD. YCrCb cho face detection / liveness.
              </li>
              <li>
                <strong>In ấn / dệt may:</strong> LAB để kiểm tra màu sắc
                đồng đều giữa các lô sản phẩm (ΔE &lt; 2).
              </li>
              <li>
                <strong>Y tế da liễu:</strong> LAB so sánh nốt ruồi giữa 2
                lần khám để phát hiện melanoma (ABCDE rule).
              </li>
            </ul>
          </Callout>

          <CodeBlock
            language="python"
            title="color_space_demo.py (OpenCV)"
          >
            {`import cv2
import numpy as np

# -------------------------------------------------------
# 1. Đọc ảnh — OpenCV mặc định đọc theo BGR (không phải RGB!)
# -------------------------------------------------------
img_bgr = cv2.imread("den_giao_thong.jpg")
print("Shape:", img_bgr.shape)  # (H, W, 3)

# -------------------------------------------------------
# 2. Chuyển sang HSV — lọc đèn đỏ
# -------------------------------------------------------
hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)

# Đỏ trong HSV của OpenCV: H 0-10 hoặc 160-179 (H ở OpenCV chia đôi: 0-179)
mask_red1 = cv2.inRange(hsv, (0,   100, 100), (10,  255, 255))
mask_red2 = cv2.inRange(hsv, (160, 100, 100), (179, 255, 255))
mask_red  = mask_red1 | mask_red2

# Ứng dụng: tìm contour đèn đỏ
contours, _ = cv2.findContours(mask_red, cv2.RETR_EXTERNAL,
                                cv2.CHAIN_APPROX_SIMPLE)
for c in contours:
    area = cv2.contourArea(c)
    if area > 100:
        x, y, w, h = cv2.boundingRect(c)
        cv2.rectangle(img_bgr, (x, y), (x+w, y+h), (0, 255, 0), 2)

# -------------------------------------------------------
# 3. Chuyển sang LAB — so sánh màu chính xác tri giác
# -------------------------------------------------------
lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)
# OpenCV LAB: L in [0, 255], a in [0, 255] (offset 128), b in [0, 255]

def delta_e76(lab1, lab2):
    """ΔE*76 — khoảng cách Euclidean trong LAB."""
    return np.sqrt(np.sum((lab1.astype(float) - lab2.astype(float))**2))

pixel1 = lab[100, 100]
pixel2 = lab[200, 200]
print(f"ΔE giữa hai điểm: {delta_e76(pixel1, pixel2):.2f}")

# -------------------------------------------------------
# 4. Chuyển sang Grayscale — OCR, edge detection
# -------------------------------------------------------
gray  = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
edges = cv2.Canny(gray, 100, 200)  # Canny edge detector

# -------------------------------------------------------
# 5. YCrCb — tốt cho skin detection (eKYC VN)
# -------------------------------------------------------
ycrcb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2YCrCb)
# Vùng da tiêu chuẩn (Chai & Ngan, 1999): Cr 133-173, Cb 77-127
skin_mask = cv2.inRange(ycrcb, (0, 133, 77), (255, 173, 127))

# Hậu xử lý: morphology để bớt noise
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
skin_mask = cv2.morphologyEx(skin_mask, cv2.MORPH_OPEN,  kernel)
skin_mask = cv2.morphologyEx(skin_mask, cv2.MORPH_CLOSE, kernel)

# -------------------------------------------------------
# 6. HSV normalization — robust với điều kiện sáng khác
# -------------------------------------------------------
def normalize_brightness(img_bgr):
    """Chuẩn hoá V trong HSV bằng CLAHE — giảm phụ thuộc ánh sáng."""
    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    h, s, v = cv2.split(hsv)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    v_eq = clahe.apply(v)
    hsv_eq = cv2.merge([h, s, v_eq])
    return cv2.cvtColor(hsv_eq, cv2.COLOR_HSV2BGR)

img_equalized = normalize_brightness(img_bgr)

# -------------------------------------------------------
# 7. Lưu kết quả
# -------------------------------------------------------
cv2.imwrite("out_mask_red.png",  mask_red)
cv2.imwrite("out_edges.png",     edges)
cv2.imwrite("out_skin.png",      skin_mask)
cv2.imwrite("out_equalized.png", img_equalized)
print("Xong.")`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      {/* ──────────────── STEP 6: TAB VIEW DEEP DIVE ──────────────── */}
      <LessonSection
        step={6}
        totalSteps={10}
        label="Deep dive: khi nào dùng không gian màu nào?"
      >
        <TabView
          tabs={[
            {
              label: "RGB",
              content: (
                <div className="space-y-2 text-sm leading-relaxed">
                  <p>
                    <strong>Ưu điểm:</strong> Chuẩn lưu trữ trên mọi thiết bị,
                    không cần chuyển đổi. Mỗi pixel = 3 byte, dễ xử lý song
                    song GPU.
                  </p>
                  <p>
                    <strong>Nhược điểm:</strong> Phụ thuộc mạnh vào ánh sáng
                    chụp. 'Đỏ sáng' và 'đỏ tối' khác nhau cả 3 kênh — khó
                    viết ngưỡng. Không đồng đều tri giác.
                  </p>
                  <p>
                    <strong>Khi dùng:</strong> Input/output cuối (hiển thị,
                    lưu file). Training CNN (vì CNN có thể tự học các không
                    gian 'tốt' nếu đủ data).
                  </p>
                </div>
              ),
            },
            {
              label: "HSV / HSL",
              content: (
                <div className="space-y-2 text-sm leading-relaxed">
                  <p>
                    <strong>Ưu điểm:</strong> Tách Hue khỏi Value → lọc theo
                    sắc màu dễ dàng. Saturation cho biết 'độ đậm'. Trực quan
                    với con người (gần cách chúng ta mô tả màu).
                  </p>
                  <p>
                    <strong>Nhược điểm:</strong> Hue là không gian tròn
                    (0° = 360° = đỏ) — cần xử lý riêng. Không đồng đều tri
                    giác tuyệt đối. Nhạy cảm với noise khi S thấp.
                  </p>
                  <p>
                    <strong>Khi dùng:</strong> Segmentation theo màu (đèn
                    giao thông, trái chín, lá bệnh). Chỉnh sửa ảnh đơn
                    giản (đổi hue, tăng saturation). UI color pickers.
                  </p>
                </div>
              ),
            },
            {
              label: "LAB",
              content: (
                <div className="space-y-2 text-sm leading-relaxed">
                  <p>
                    <strong>Ưu điểm:</strong> Đồng đều tri giác — khoảng
                    cách Euclidean ≈ khác biệt mắt người thấy. Device-independent —
                    cùng giá trị LAB = cùng màu vật lý trên mọi thiết bị.
                    Gamut lớn hơn RGB và CMYK.
                  </p>
                  <p>
                    <strong>Nhược điểm:</strong> Tính toán phức tạp
                    (qua XYZ). Giá trị a*, b* có thể âm → không dễ hiển thị.
                    Không trực quan như HSV.
                  </p>
                  <p>
                    <strong>Khi dùng:</strong> So sánh màu chính xác (y tế,
                    in ấn, dệt may). Chuyển đổi chuẩn giữa các thiết bị
                    (monitor, máy in). White balance correction.
                  </p>
                </div>
              ),
            },
            {
              label: "YCrCb / YUV",
              content: (
                <div className="space-y-2 text-sm leading-relaxed">
                  <p>
                    <strong>Ưu điểm:</strong> Tách luminance (Y) khỏi
                    chrominance (Cr, Cb) — cho phép nén chrominance mạnh
                    (mắt ít nhạy), Y giữ nguyên. Chuẩn cho nén video (JPEG,
                    MPEG, H.264 đều dùng YCbCr nội bộ).
                  </p>
                  <p>
                    <strong>Nhược điểm:</strong> Ít trực quan hơn HSV. Có
                    nhiều biến thể (BT.601, BT.709, BT.2020) — dễ nhầm hệ
                    số.
                  </p>
                  <p>
                    <strong>Khi dùng:</strong> Nén video/ảnh. Skin detection
                    (ngưỡng Cr 133-173, Cb 77-127 cho da người nói chung).
                    Face detection pre-processing.
                  </p>
                </div>
              ),
            },
            {
              label: "Grayscale",
              content: (
                <div className="space-y-2 text-sm leading-relaxed">
                  <p>
                    <strong>Ưu điểm:</strong> 1 kênh thay vì 3 → nhanh 3x,
                    bộ nhớ ít hơn 3x. Nhiều thuật toán cổ điển (Canny, SIFT,
                    ORB, HOG) đều làm việc trên grayscale.
                  </p>
                  <p>
                    <strong>Nhược điểm:</strong> Mất hoàn toàn thông tin
                    màu. Không phân biệt được 2 vật có cùng độ sáng nhưng
                    khác màu (đèn đỏ vs đèn xanh cùng độ sáng → cùng giá
                    trị Y).
                  </p>
                  <p>
                    <strong>Khi dùng:</strong> Edge detection, OCR, feature
                    matching. Bước preprocessing cho các thuật toán
                    classical. Document scanning (CCCD OCR).
                  </p>
                </div>
              ),
            },
          ]}
        />
      </LessonSection>

      {/* ──────────────── STEP 7: COLLAPSIBLE DETAILS ──────────────── */}
      <LessonSection step={7} totalSteps={10} label="Đào sâu (tuỳ chọn)">
        <div className="space-y-3">
          <CollapsibleDetail title="Tại sao Hue là không gian tròn? Và làm sao tính trung bình?">
            <div className="space-y-2 text-sm leading-relaxed">
              <p>
                Hue được định nghĩa trên vòng tròn 0-360°. Đỏ ở 0°, vàng ở
                60°, xanh lá ở 120°, ... quay về đỏ ở 360°. Vì vậy:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Đừng tính trung bình số học:</strong> trung bình của
                  350° và 10° KHÔNG phải 180° (xanh dương) mà là 0° (đỏ).
                </li>
                <li>
                  <strong>Dùng circular mean:</strong> chuyển mỗi hue thành
                  vector đơn vị (cos θ, sin θ), cộng vector, rồi lấy
                  atan2(Σsin, Σcos).
                </li>
                <li>
                  <strong>Khi lọc 'đỏ' bằng cv2.inRange:</strong> đỏ có 2
                  đoạn (0-10 và 160-179 ở OpenCV Hue chia đôi). Cần{" "}
                  <code>mask_red1 | mask_red2</code>.
                </li>
                <li>
                  <strong>Khi S → 0:</strong> Hue trở nên không xác định
                  (xám không có 'sắc'). Noise có thể làm Hue nhảy lung tung →
                  luôn lọc kết hợp S &gt; threshold.
                </li>
              </ul>
              <p className="text-xs text-muted">
                Cạm bẫy phổ biến: nhiều bug trong code xử lý màu đến từ bỏ
                quên tính chất tròn của Hue.
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="sRGB, Adobe RGB, DCI-P3 — khác gì nhau?">
            <div className="space-y-2 text-sm leading-relaxed">
              <p>
                Cùng tên 'RGB' nhưng thực ra có nhiều 'RGB' khác nhau, khác
                nhau ở <strong>gamut</strong> (tập màu biểu diễn được) và{" "}
                <strong>primaries</strong> (màu R, G, B cơ bản nằm đâu trên
                diagram CIE).
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>sRGB (1996):</strong> Chuẩn mặc định cho web,
                  monitor thường, smartphone giá rẻ. Gamma ≈ 2.2. Gamut hẹp
                  nhưng đồng nhất.
                </li>
                <li>
                  <strong>Adobe RGB (1998):</strong> Gamut rộng hơn sRGB ~35%,
                  đặc biệt ở vùng xanh lá. Dùng cho nhiếp ảnh, in ấn.
                </li>
                <li>
                  <strong>DCI-P3 / Display P3:</strong> Chuẩn điện ảnh, dần
                  phổ biến trên iPhone, MacBook Pro, TV cao cấp. Gamut rộng
                  hơn sRGB ~25%, đặc biệt vùng đỏ.
                </li>
                <li>
                  <strong>Rec. 2020:</strong> Chuẩn HDR/UHD TV, gamut cực rộng
                  (bao phủ ~75% vùng thị giác). Rất ít thiết bị hiển thị được
                  toàn bộ.
                </li>
              </ul>
              <p>
                Vì vậy giá trị <code>rgb(255, 0, 0)</code> trong sRGB và Display
                P3 là 2 màu đỏ KHÁC NHAU trên thực tế. CSS Color Level 4 giới
                thiệu <code>color(display-p3 1 0 0)</code> để chỉ định rõ.
              </p>
              <p className="text-xs text-muted">
                Với ML/CV, hầu hết pipeline giả định sRGB. Nếu train trên ảnh
                iPhone ProRAW (P3) và infer trên ảnh sRGB, có thể lệch màu ảnh
                hưởng tới kết quả.
              </p>
            </div>
          </CollapsibleDetail>
        </div>
      </LessonSection>

      {/* ──────────────── STEP 8: INLINE CHALLENGE #2 ──────────────── */}
      <LessonSection step={8} totalSteps={10} label="Thử thách #2">
        <InlineChallenge
          question="Team của bạn xây hệ thống đếm cà phê chín (đỏ) trên cây. Ảnh chụp ngoài vườn nắng gắt vs bóng râm khác nhau rất lớn. Pipeline nào ổn định NHẤT?"
          options={[
            "Chuyển grayscale rồi threshold",
            "Dùng RGB và train CNN từ đầu với ít dữ liệu",
            "Chuyển HSV, lọc H trong vùng đỏ + S cao, sau đó dùng morphology để gộp các cụm chín; nếu có thời gian, normalize V bằng CLAHE trước",
            "In kết quả trực tiếp từ giá trị RGB trung bình",
          ]}
          correct={2}
          explanation="HSV là lựa chọn cổ điển cho 'lọc theo màu' robust với ánh sáng. Kết hợp CLAHE trên kênh V để giảm chênh lệch sáng giữa nắng và râm, rồi lọc H (đỏ: 0-10 hoặc 160-179) + S cao để bỏ nền đất/lá. Morphology (open/close) để gộp các pixel đỏ thành cluster tương ứng 1 trái. Đây là pipeline chuẩn cho đếm trái cây trong nông nghiệp."
        />
      </LessonSection>

      {/* ──────────────── STEP 9: MINI SUMMARY ──────────────── */}
      <LessonSection step={9} totalSteps={10} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về không gian màu"
          points={[
            "RGB là chuẩn lưu trữ (3 kênh 0-255) nhưng phụ thuộc ánh sáng — khó lọc theo màu trực tiếp.",
            "HSV / HSL tách Hue (sắc) khỏi Value/Lightness (sáng) — lý tưởng cho segmentation theo màu (đèn giao thông, trái chín). Chú ý Hue là không gian tròn.",
            "LAB đồng đều tri giác — khoảng cách Euclidean ≈ khác biệt mắt người. Device-independent. Dùng cho y tế, in ấn, kiểm tra chất lượng màu (ΔE).",
            "Grayscale bỏ màu giữ cấu trúc, nhanh 3x. Chuẩn cho edge detection, OCR, feature matching; không phân biệt được màu cùng độ sáng.",
            "YCrCb tách luminance khỏi chrominance — chuẩn cho nén video/JPEG, tốt cho skin detection (Cr 133-173, Cb 77-127).",
            "Quy tắc ngón tay cái: hiển thị/lưu → RGB; lọc màu → HSV; so sánh chính xác → LAB; tốc độ/OCR → Grayscale; skin/video → YCrCb.",
          ]}
        />
      </LessonSection>

      {/* ──────────────── STEP 10: QUIZ ──────────────── */}
      <LessonSection step={10} totalSteps={10} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
