"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  MapPin,
  Sparkles,
  Target,
  Activity,
} from "lucide-react";
import type { TopicMeta } from "@/lib/types";
import ApplicationLayout from "@/components/application/ApplicationLayout";
import ApplicationHero from "@/components/application/ApplicationHero";
import ApplicationProblem from "@/components/application/ApplicationProblem";
import ApplicationMechanism from "@/components/application/ApplicationMechanism";
import Beat from "@/components/application/Beat";
import ApplicationMetrics from "@/components/application/ApplicationMetrics";
import Metric from "@/components/application/Metric";
import ApplicationTryIt from "@/components/application/ApplicationTryIt";
import ApplicationCounterfactual from "@/components/application/ApplicationCounterfactual";
import {
  InlineChallenge,
  Callout,
  MiniSummary,
  TopicLink,
  SliderGroup,
} from "@/components/interactive";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";

type SliderConfig = {
  key: string;
  label: string;
  min: number;
  max: number;
  step?: number;
  defaultValue: number;
  unit?: string;
};

export const metadata: TopicMeta = {
  slug: "linear-regression-in-housing",
  title: "Linear Regression in Housing Valuation",
  titleVi: "Hồi quy tuyến tính trong giá nhà",
  description:
    "Hà Nội và TP.HCM: căn hộ 80m² ở TP Thủ Đức giá bao nhiêu? Kéo các thanh diện tích, số phòng, quận và xem công thức hồi quy tuyến tính ước giá trực tiếp.",
  category: "classic-ml",
  tags: ["regression", "real-estate", "application"],
  difficulty: "beginner",
  relatedSlugs: ["linear-regression"],
  vizType: "interactive",
  applicationOf: "linear-regression",
  featuredApp: {
    name: "Batdongsan.com.vn",
    productFeature: "Ước tính giá nhà tự động",
    company: "Property Guru",
    countryOrigin: "VN",
  },
  sources: [
    {
      title: "Báo cáo thị trường bất động sản TP.HCM 2024",
      publisher: "Batdongsan.com.vn",
      url: "https://batdongsan.com.vn/phan-tich-danh-gia",
      date: "2024-12",
      kind: "documentation",
    },
    {
      title: "Chỉ số giá nhà ở các quận Hà Nội 2024",
      publisher: "CBRE Vietnam",
      url: "https://www.cbrevietnam.com/research",
      date: "2024-06",
      kind: "documentation",
    },
    {
      title: "Zestimate methodology & accuracy",
      publisher: "Zillow Research",
      url: "https://www.zillow.com/z/zestimate/",
      date: "2024-01",
      kind: "documentation",
    },
    {
      title: "Meey Land — nền tảng ước giá bất động sản tại Việt Nam",
      publisher: "Meey Group",
      url: "https://meeyland.com/",
      date: "2024-01",
      kind: "documentation",
    },
  ],
  tocSections: [
    { id: "hero", labelVi: "Công ty nào?" },
    { id: "problem", labelVi: "Vấn đề" },
    { id: "mechanism", labelVi: "Cách giải quyết" },
    { id: "tryIt", labelVi: "Thử tự tay" },
    { id: "metrics", labelVi: "Con số thật" },
    { id: "counterfactual", labelVi: "Nếu không có" },
  ],
};

/* ═══════════════════════════════════════════════════════════════════
   DỮ LIỆU — Các quận Hà Nội và TP.HCM với &ldquo;hệ số vị trí&rdquo;
   Đây là con số minh hoạ, không phải giá thị trường thật.
   ═══════════════════════════════════════════════════════════════════ */

type District = {
  id: string;
  city: "HN" | "HCM";
  name: string;
  locationCoef: number; // triệu VNĐ / m²
  note: string;
};

const housingQuizQuestions: QuizQuestion[] = [
  {
    question:
      "Batdongsan.com.vn ước giá căn hộ 80m², 2 phòng ngủ, 5 tuổi ở Quận 2 khoảng 6,5 tỷ. Con số đó đến từ đâu?",
    options: [
      "Một chuyên viên môi giới ngồi xem từng tin",
      "Công thức hồi quy tuyến tính học từ hàng chục nghìn giao dịch thực tế — máy thay các đặc điểm của căn vào công thức",
      "Giá trung bình của toàn TP.HCM",
      "Do hệ thống sinh ngẫu nhiên trong khoảng 5–10 tỷ",
    ],
    correct: 1,
    explanation:
      "Các nền tảng như Batdongsan, Meey Land đều dùng mô hình hồi quy. Máy học công thức từ giao dịch đã xảy ra, sau đó thay số của căn mới vào để ra giá. Nhanh, minh bạch, có thể giải thích.",
  },
  {
    question:
      "Một mô hình hồi quy giá nhà cho ra hệ số 0.08 cho biến 'diện tích' (đơn vị tỷ/m²). Ý nghĩa thực tế là gì?",
    options: [
      "Căn nào cũng đắt 0.08 tỷ",
      "Khi diện tích tăng 1m² (giữ nguyên các biến khác), giá ước tính tăng khoảng 80 triệu",
      "Căn có 0.08 m² thì miễn phí",
      "Không diễn giải được",
    ],
    correct: 1,
    explanation:
      "Hệ số trong hồi quy có ý nghĩa rất cụ thể: 'x tăng 1 đơn vị → y tăng bao nhiêu, các biến khác giữ nguyên'. Đây là lý do hồi quy tuyến tính được ưa chuộng — hệ số dễ giải thích với khách, với sếp, với cơ quan quản lý.",
  },
  {
    question:
      "Bạn dùng mô hình giá nhà học trên căn 30–200m² để ước giá một biệt thự 800m². Nên tin con số mô hình đưa ra không?",
    options: [
      "Có, vì máy luôn đúng",
      "Không — đây là ngoại suy (extrapolation) ra khỏi khoảng dữ liệu đã học, kết quả không đáng tin cậy",
      "Có, vì biệt thự gì cũng như nhau",
      "Có nếu cộng thêm 10%",
    ],
    correct: 1,
    explanation:
      "Hồi quy chỉ đáng tin trong khoảng dữ liệu đã huấn luyện. Ngoại suy (dự đoán ra ngoài khoảng đó) rất nguy hiểm vì quan hệ có thể không còn tuyến tính. Luôn kiểm tra 'ca mới có giống tập huấn luyện không'.",
  },
  {
    type: "fill-blank",
    question:
      "Mô hình giá nhà dạng: giá = {blank} · diện tích + hệ số · vị trí + ... + {blank}. Con số đầu là hệ số, con số cuối là điểm chặn.",
    blanks: [
      { answer: "a", accept: ["w1", "w_1", "hệ số diện tích"] },
      { answer: "điểm chặn", accept: ["intercept", "b", "w0", "w_0", "bias", "chặn"] },
    ],
    explanation:
      "Công thức hồi quy nhiều biến luôn có một điểm chặn (intercept) — giá trị cơ sở không phụ thuộc đặc trưng nào. Trong thực tế, điểm chặn thường phản ánh các chi phí cố định chung cho thị trường.",
  },
  {
    question:
      "Mô hình khớp 100% trên 150 giao dịch đã có, nhưng khi dự đoán 30 giao dịch mới, sai số trung bình 35%. Đây là vấn đề gì?",
    options: [
      "Mô hình quá đơn giản",
      "Overfitting — mô hình đã 'thuộc lòng' tập huấn luyện nhưng không nắm quy luật chung",
      "Dữ liệu mới bị lỗi",
      "Hồi quy tuyến tính luôn vậy",
    ],
    correct: 1,
    explanation:
      "Khớp hoàn hảo train nhưng tệ test là dấu hiệu overfitting. Thường xảy ra khi có quá nhiều biến so với số mẫu. Giải pháp: thêm dữ liệu, bỏ biến rác, dùng regularization (Ridge, Lasso).",
  },
];

const DISTRICTS: District[] = [
  // TP.HCM
  { id: "hcm-q1", city: "HCM", name: "Quận 1", locationCoef: 215, note: "Trung tâm, khan hiếm, cao nhất" },
  { id: "hcm-q2", city: "HCM", name: "Quận 2 (TP Thủ Đức)", locationCoef: 135, note: "Thảo Điền, cao cấp, nhiều dự án" },
  { id: "hcm-q7", city: "HCM", name: "Quận 7", locationCoef: 115, note: "Phú Mỹ Hưng, hạ tầng tốt" },
  { id: "hcm-bt", city: "HCM", name: "Quận Bình Thạnh", locationCoef: 95, note: "Liền trung tâm, chung cư nhiều" },
  { id: "hcm-tb", city: "HCM", name: "Quận Tân Bình", locationCoef: 75, note: "Gần sân bay, giá vừa phải" },
  { id: "hcm-bc", city: "HCM", name: "Quận Bình Chánh", locationCoef: 45, note: "Vùng ven, giá mềm nhất" },
  // Hà Nội
  { id: "hn-hk", city: "HN", name: "Quận Hoàn Kiếm", locationCoef: 250, note: "Phố cổ, đắt nhất Hà Nội" },
  { id: "hn-bd", city: "HN", name: "Quận Ba Đình", locationCoef: 180, note: "Khu cơ quan, cao cấp" },
  { id: "hn-tx", city: "HN", name: "Quận Tây Hồ", locationCoef: 160, note: "Hồ Tây, chung cư cao cấp" },
  { id: "hn-cg", city: "HN", name: "Quận Cầu Giấy", locationCoef: 125, note: "Đông dân, nhiều chung cư mới" },
  { id: "hn-hd", city: "HN", name: "Quận Hà Đông", locationCoef: 55, note: "Giá vừa, giao thông khá" },
  { id: "hn-nt", city: "HN", name: "Huyện Nam Từ Liêm", locationCoef: 80, note: "Quận mới, nhiều dự án lớn" },
];

/* ═══════════════════════════════════════════════════════════════════
   CÔNG THỨC GIÁ NHÀ MÔ PHỎNG
   Giá (tỷ VNĐ) = a·diện_tích + b·số_phòng + c·hệ_số_quận − d·tuổi_nhà + ε
   Các hệ số đã chọn để cho ra giá hợp lý ở khoảng 2–25 tỷ.
   ═══════════════════════════════════════════════════════════════════ */

const COEF_AREA = 0.006; // tỷ VNĐ / m² cho mỗi triệu của location_coef
const COEF_BEDROOM = 0.25; // tỷ VNĐ / phòng
const COEF_AGE = 0.03; // tỷ VNĐ / năm tuổi nhà
const BASE_INTERCEPT = 0.8; // tỷ VNĐ

function predictPrice(
  area: number,
  bedrooms: number,
  locationCoef: number,
  age: number
): number {
  const price =
    BASE_INTERCEPT +
    COEF_AREA * locationCoef * area +
    COEF_BEDROOM * bedrooms -
    COEF_AGE * age;
  return Math.max(0.5, price);
}

/* ═══════════════════════════════════════════════════════════════════
   DỮ LIỆU SCATTER — 20 giao dịch &ldquo;thực&rdquo; cho Quận 2
   (minh hoạ, không phải số thật từ thị trường)
   ═══════════════════════════════════════════════════════════════════ */

type Sale = {
  id: number;
  area: number; // m²
  price: number; // tỷ VNĐ
  bedrooms: number;
  age: number;
};

const Q2_SALES: Sale[] = [
  { id: 1, area: 45, price: 3.2, bedrooms: 1, age: 8 },
  { id: 2, area: 55, price: 4.1, bedrooms: 2, age: 3 },
  { id: 3, area: 60, price: 4.8, bedrooms: 2, age: 5 },
  { id: 4, area: 65, price: 5.0, bedrooms: 2, age: 10 },
  { id: 5, area: 70, price: 5.6, bedrooms: 2, age: 2 },
  { id: 6, area: 75, price: 5.9, bedrooms: 2, age: 7 },
  { id: 7, area: 80, price: 6.8, bedrooms: 3, age: 3 },
  { id: 8, area: 82, price: 6.5, bedrooms: 2, age: 12 },
  { id: 9, area: 85, price: 7.2, bedrooms: 3, age: 5 },
  { id: 10, area: 90, price: 7.5, bedrooms: 3, age: 6 },
  { id: 11, area: 95, price: 8.4, bedrooms: 3, age: 2 },
  { id: 12, area: 100, price: 8.1, bedrooms: 3, age: 9 },
  { id: 13, area: 105, price: 9.0, bedrooms: 3, age: 4 },
  { id: 14, area: 110, price: 9.8, bedrooms: 4, age: 3 },
  { id: 15, area: 120, price: 10.5, bedrooms: 4, age: 5 },
  { id: 16, area: 125, price: 11.2, bedrooms: 4, age: 7 },
  { id: 17, area: 130, price: 10.8, bedrooms: 3, age: 15 },
  { id: 18, area: 135, price: 12.5, bedrooms: 4, age: 4 },
  { id: 19, area: 150, price: 14.2, bedrooms: 4, age: 3 },
  { id: 20, area: 155, price: 13.1, bedrooms: 3, age: 18 },
];

// Đường fit đơn biến cho scatter: price = alpha * area + beta
function fitLine(data: Sale[]) {
  const n = data.length;
  const sumX = data.reduce((s, d) => s + d.area, 0);
  const sumY = data.reduce((s, d) => s + d.price, 0);
  const sumXY = data.reduce((s, d) => s + d.area * d.price, 0);
  const sumX2 = data.reduce((s, d) => s + d.area * d.area, 0);
  const denom = n * sumX2 - sumX * sumX;
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

/* ═══════════════════════════════════════════════════════════════════
   UI: PREDICTOR với SliderGroup
   ═══════════════════════════════════════════════════════════════════ */

function HousePricePredictor() {
  const [districtId, setDistrictId] = useState<string>("hcm-q2");
  const district = useMemo(
    () => DISTRICTS.find((d) => d.id === districtId) ?? DISTRICTS[0],
    [districtId]
  );

  const sliders: SliderConfig[] = [
    { key: "area", label: "Diện tích (m²)", min: 30, max: 200, step: 5, defaultValue: 80, unit: " m²" },
    { key: "bedrooms", label: "Số phòng ngủ", min: 1, max: 5, step: 1, defaultValue: 2 },
    { key: "age", label: "Tuổi căn hộ (năm)", min: 0, max: 30, step: 1, defaultValue: 5, unit: " năm" },
  ];

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted leading-relaxed">
        Hãy chơi vai một nhân viên định giá nhà của Batdongsan.com.vn. Chọn quận bạn quan tâm, kéo
        các thanh đặc điểm, và xem công thức hồi quy tuyến tính cho ra con số.
      </p>

      {/* Chọn quận */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-accent" />
          <span className="text-sm font-semibold text-foreground">Chọn quận</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DISTRICTS.map((d) => {
            const active = d.id === districtId;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setDistrictId(d.id)}
                className={`text-left rounded-lg border p-2.5 transition-colors ${
                  active
                    ? "border-accent bg-accent-light"
                    : "border-border bg-surface hover:border-accent/40"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wide ${
                      active ? "text-accent" : "text-tertiary"
                    }`}
                  >
                    {d.city === "HCM" ? "TP.HCM" : "Hà Nội"}
                  </span>
                  <span
                    className={`text-[9px] font-mono tabular-nums px-1.5 py-0.5 rounded ${
                      active
                        ? "bg-accent text-white"
                        : "bg-card text-muted border border-border"
                    }`}
                  >
                    +{d.locationCoef}
                  </span>
                </div>
                <div
                  className={`text-xs font-semibold ${
                    active ? "text-foreground" : "text-foreground/80"
                  }`}
                >
                  {d.name}
                </div>
                <div className="text-[10px] text-muted mt-0.5 leading-tight">{d.note}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SliderGroup với visualization động */}
      <SliderGroup
        title={`Căn hộ tại ${district.name}`}
        sliders={sliders}
        visualization={(values) => {
          const area = values.area ?? 80;
          const bedrooms = values.bedrooms ?? 2;
          const age = values.age ?? 5;
          const price = predictPrice(area, bedrooms, district.locationCoef, age);
          const pricePerM2 = price / area;

          return (
            <div className="w-full space-y-4">
              {/* Ô mô phỏng căn hộ */}
              <div className="flex items-center justify-center gap-6">
                <HouseIllustration area={area} bedrooms={bedrooms} age={age} />
                <div className="flex-1 min-w-0 space-y-2">
                  <motion.div
                    key={price.toFixed(2)}
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 240, damping: 20 }}
                    className="rounded-xl border-2 border-amber-400 bg-amber-50 dark:bg-amber-900/20 p-4"
                  >
                    <div className="text-[10px] uppercase tracking-wide text-amber-700 dark:text-amber-300 font-semibold mb-1">
                      Giá ước tính
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-mono font-bold text-amber-700 dark:text-amber-300 tabular-nums">
                        {price.toFixed(2)}
                      </span>
                      <span className="text-sm text-amber-700 dark:text-amber-300 font-semibold">
                        tỷ VNĐ
                      </span>
                    </div>
                    <div className="text-xs text-foreground/70 mt-1 tabular-nums">
                      ≈ {(pricePerM2 * 1000).toFixed(0)} triệu/m²
                    </div>
                  </motion.div>

                  {/* Phá vỡ công thức */}
                  <div className="rounded-lg border border-border bg-card p-3 text-xs space-y-1">
                    <div className="text-[10px] uppercase tracking-wide text-tertiary font-semibold mb-1.5">
                      Giá đến từ đâu?
                    </div>
                    <PriceBreakdownRow
                      label="Điểm chặn (phí cố định)"
                      value={BASE_INTERCEPT}
                    />
                    <PriceBreakdownRow
                      label={`${area} m² × hệ số ${district.name}`}
                      value={COEF_AREA * district.locationCoef * area}
                    />
                    <PriceBreakdownRow
                      label={`${bedrooms} phòng ngủ`}
                      value={COEF_BEDROOM * bedrooms}
                    />
                    <PriceBreakdownRow
                      label={`− ${age} năm khấu hao`}
                      value={-COEF_AGE * age}
                    />
                    <div className="flex items-center justify-between pt-1 border-t border-border text-foreground font-semibold">
                      <span>Tổng</span>
                      <span className="font-mono tabular-nums">{price.toFixed(2)} tỷ</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        }}
      />

      <Callout variant="tip" title="Hệ số vị trí nói lên điều gì?">
        Mỗi quận có một &ldquo;hệ số vị trí&rdquo; riêng (số góc trên thẻ ở trên). Hoàn Kiếm 250
        cao gấp hơn năm lần Bình Chánh 45, vì thế cùng một căn 80m² ở hai nơi có giá rất khác nhau.
        Đây là cách hồi quy tuyến tính &ldquo;mã hoá&rdquo; vị trí bằng một con số dễ nhân chia.
      </Callout>
    </div>
  );
}

function PriceBreakdownRow({ label, value }: { label: string; value: number }) {
  const color =
    value > 0.05
      ? "text-emerald-600 dark:text-emerald-400"
      : value < -0.05
      ? "text-rose-500"
      : "text-muted";
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-foreground/80">{label}</span>
      <span className={`font-mono tabular-nums ${color}`}>
        {value >= 0 ? "+" : ""}
        {value.toFixed(2)}
      </span>
    </div>
  );
}

function HouseIllustration({
  area,
  bedrooms,
  age,
}: {
  area: number;
  bedrooms: number;
  age: number;
}) {
  // Kích thước minh hoạ co giãn theo diện tích — nhìn thấy thấy được nhỏ/to
  const scale = Math.max(0.55, Math.min(1.1, area / 110));
  const floors = Math.min(4, Math.ceil(bedrooms / 1.5));
  const windows = Math.max(2, bedrooms + 1);

  return (
    <div
      className="shrink-0 flex flex-col items-center justify-end"
      style={{ transform: `scale(${scale})` }}
    >
      <svg viewBox="0 0 100 140" className="w-28 h-36">
        {/* Mặt đất */}
        <line x1={5} y1={130} x2={95} y2={130} stroke="currentColor" className="text-muted" strokeWidth={1} />
        {/* Mái */}
        <polygon points="50,15 15,45 85,45" fill="#b91c1c" />
        {/* Thân nhà */}
        <rect x={15} y={45} width={70} height={85} fill="#f59e0b" stroke="#92400e" strokeWidth={1} />
        {/* Cửa sổ */}
        {Array.from({ length: floors }).map((_, floorIdx) => {
          const y = 55 + floorIdx * 25;
          return Array.from({ length: Math.min(windows, 3) }).map((__, wi) => {
            const x = 20 + wi * 22;
            return (
              <rect
                key={`w-${floorIdx}-${wi}`}
                x={x}
                y={y}
                width={14}
                height={14}
                fill="#fef3c7"
                stroke="#92400e"
                strokeWidth={0.8}
              />
            );
          });
        })}
        {/* Cửa */}
        <rect x={43} y={105} width={14} height={25} fill="#7c2d12" />
        {/* Dấu &ldquo;cũ&rdquo; nếu age cao */}
        {age > 15 && (
          <text x={50} y={138} textAnchor="middle" fontSize={11} fill="#6b7280" fontStyle="italic">
            (cũ)
          </text>
        )}
      </svg>
      <div className="text-[10px] text-muted font-mono tabular-nums">{area} m²</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   UI: SCATTER PLOT (giao dịch Q2 + đường fit)
   ═══════════════════════════════════════════════════════════════════ */

function Q2ScatterPlot() {
  const { slope, intercept } = useMemo(() => fitLine(Q2_SALES), []);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const minArea = 30;
  const maxArea = 170;
  const minPrice = 1;
  const maxPrice = 15;

  const xScale = (area: number) => 50 + ((area - minArea) / (maxArea - minArea)) * 430;
  const yScale = (price: number) => 260 - ((price - minPrice) / (maxPrice - minPrice)) * 230;

  const lineAt = (area: number) => slope * area + intercept;

  const selectedSale = useMemo(
    () => Q2_SALES.find((s) => s.id === selectedId) ?? null,
    [selectedId]
  );
  const residual = selectedSale
    ? selectedSale.price - lineAt(selectedSale.area)
    : 0;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted leading-relaxed">
        Dữ liệu giao dịch minh hoạ tại Quận 2 (TP Thủ Đức): 20 căn hộ đã bán. Đường xanh là đường
        hồi quy tuyến tính đi qua đám điểm đó. Bấm một chấm để xem <em>sai số</em> (residual) —
        chênh lệch giữa giá thực và giá mô hình dự đoán.
      </p>

      <svg viewBox="0 0 520 300" className="w-full rounded-xl border border-border bg-card">
        {/* Trục */}
        <line x1={50} y1={260} x2={490} y2={260} stroke="currentColor" className="text-muted" strokeWidth={1} />
        <line x1={50} y1={30} x2={50} y2={260} stroke="currentColor" className="text-muted" strokeWidth={1} />

        {/* Lưới ngang */}
        {[2, 4, 6, 8, 10, 12, 14].map((p) => (
          <g key={p}>
            <line
              x1={50}
              y1={yScale(p)}
              x2={490}
              y2={yScale(p)}
              stroke="currentColor"
              className="text-border"
              strokeWidth={0.4}
              strokeDasharray="2 3"
              opacity={0.6}
            />
            <text x={42} y={yScale(p) + 3} textAnchor="end" fontSize={11} fill="currentColor" className="text-muted">
              {p}
            </text>
          </g>
        ))}

        {/* Lưới dọc */}
        {[50, 80, 110, 140, 170].map((a) => (
          <g key={a}>
            <line
              x1={xScale(a)}
              y1={30}
              x2={xScale(a)}
              y2={260}
              stroke="currentColor"
              className="text-border"
              strokeWidth={0.4}
              strokeDasharray="2 3"
              opacity={0.5}
            />
            <text x={xScale(a)} y={275} textAnchor="middle" fontSize={11} fill="currentColor" className="text-muted">
              {a}
            </text>
          </g>
        ))}

        <text x={270} y={293} textAnchor="middle" fontSize={11} fill="currentColor" className="text-muted" fontWeight={600}>
          Diện tích (m²)
        </text>
        <text x={15} y={145} textAnchor="middle" fontSize={11} fill="currentColor" className="text-muted" fontWeight={600} transform="rotate(-90 15 145)">
          Giá (tỷ VNĐ)
        </text>

        {/* Đường fit */}
        <motion.line
          x1={xScale(minArea)}
          y1={yScale(lineAt(minArea))}
          x2={xScale(maxArea)}
          y2={yScale(lineAt(maxArea))}
          stroke="#10b981"
          strokeWidth={2.5}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6 }}
        />
        <text x={xScale(maxArea) - 10} y={yScale(lineAt(maxArea)) - 8} textAnchor="end" fontSize={11} fill="#10b981" fontWeight={700}>
          Đường tuyến tính
        </text>

        {/* Điểm + residual line khi chọn */}
        {selectedSale && (
          <motion.line
            x1={xScale(selectedSale.area)}
            y1={yScale(selectedSale.price)}
            x2={xScale(selectedSale.area)}
            y2={yScale(lineAt(selectedSale.area))}
            stroke="#f59e0b"
            strokeWidth={2.5}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
        )}

        {/* Điểm giao dịch */}
        {Q2_SALES.map((s) => {
          const isSelected = s.id === selectedId;
          return (
            <motion.circle
              key={s.id}
              cx={xScale(s.area)}
              cy={yScale(s.price)}
              r={isSelected ? 8 : 5}
              fill={isSelected ? "#f59e0b" : "#3b82f6"}
              stroke="#fff"
              strokeWidth={2}
              style={{ cursor: "pointer" }}
              onClick={() => setSelectedId(isSelected ? null : s.id)}
              whileHover={{ scale: 1.4 }}
              animate={{ r: isSelected ? 8 : 5 }}
            />
          );
        })}
      </svg>

      {/* Thông tin điểm được chọn */}
      <AnimatePresence mode="wait">
        {selectedSale ? (
          <motion.div
            key={selectedSale.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-lg border-2 border-amber-400 bg-amber-50 dark:bg-amber-900/20 p-4 space-y-2"
          >
            <div className="flex items-center gap-2 mb-1">
              <Target size={14} className="text-amber-700 dark:text-amber-300" />
              <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                Giao dịch #{selectedSale.id}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <div className="text-[10px] uppercase tracking-wide text-tertiary font-semibold">Diện tích</div>
                <div className="font-mono text-foreground tabular-nums">{selectedSale.area} m²</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-tertiary font-semibold">Số phòng</div>
                <div className="font-mono text-foreground tabular-nums">{selectedSale.bedrooms}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-tertiary font-semibold">Tuổi nhà</div>
                <div className="font-mono text-foreground tabular-nums">{selectedSale.age} năm</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-tertiary font-semibold">Giá thực</div>
                <div className="font-mono text-foreground tabular-nums font-bold">{selectedSale.price.toFixed(1)} tỷ</div>
              </div>
            </div>
            <div className="pt-2 border-t border-amber-300 dark:border-amber-700 grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-[10px] uppercase tracking-wide text-emerald-700 dark:text-emerald-400 font-semibold">
                  Mô hình dự đoán
                </div>
                <div className="font-mono text-emerald-700 dark:text-emerald-300 tabular-nums">
                  {lineAt(selectedSale.area).toFixed(2)} tỷ
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-amber-700 dark:text-amber-400 font-semibold">
                  Sai số (residual)
                </div>
                <div
                  className={`font-mono tabular-nums font-bold ${
                    residual > 0
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-rose-600"
                  }`}
                >
                  {residual > 0 ? "+" : ""}
                  {residual.toFixed(2)} tỷ
                </div>
              </div>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed pt-1">
              {residual > 0
                ? "Giá thực cao hơn mô hình đoán — có thể căn này ở vị trí đẹp hơn, nội thất xịn hơn, hoặc chủ đang muốn bán gấp."
                : "Giá thực thấp hơn mô hình đoán — có thể căn bị cũ hơn mô hình biết, hoặc đang có đợt khuyến mãi."}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-lg border border-dashed border-border bg-surface/40 p-3 text-xs text-muted text-center"
          >
            Bấm một chấm bất kỳ để xem sai số.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export default function LinearRegressionInHousing() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Hồi quy tuyến tính"
    >
      <ApplicationHero
        parentTitleVi="Hồi quy tuyến tính"
        topicSlug="linear-regression-in-housing"
      >
        <p>
          Bạn đang tìm căn hộ đầu tiên. Mở Batdongsan.com.vn, gõ &ldquo;Quận 2, 80m², 2 phòng
          ngủ&rdquo; — ngay lập tức thấy một con số: 6,5 tỷ &plusmn; 8%. Con số đó không phải cảm
          tính, cũng không phải do một chuyên gia môi giới nhập tay.
        </p>
        <p>
          Đằng sau là một công thức hồi quy tuyến tính &mdash; &ldquo;giá = a×diện tích + b×số phòng
          + c×hệ số vị trí &minus; d×tuổi nhà + ...&rdquo; &mdash; được máy học từ hàng trăm nghìn
          giao dịch thực tế. Khi bạn gõ đặc điểm, máy thay số vào công thức và ra giá trong tích
          tắc.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="linear-regression-in-housing">
        <p>
          Thị trường nhà tại TP.HCM và Hà Nội có hàng triệu giao dịch mỗi năm, mỗi căn khác nhau
          về diện tích, vị trí, tuổi, số phòng, hướng, tầng, v.v. Trước đây, muốn ước giá phải
          nhờ một nhân viên môi giới địa phương &mdash; tốn thời gian, giá khác nhau tuỳ người.
        </p>
        <p>
          Vấn đề cốt lõi: làm sao từ hàng chục nghìn giao dịch đã hoàn tất, xây một công thức{" "}
          <strong>tự động, minh bạch, và nhanh</strong> để định giá bất kỳ căn nào chưa từng bán?
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Hồi quy tuyến tính"
        topicSlug="linear-regression-in-housing"
      >
        <Beat step={1}>
          <p>
            <strong>Thu thập giao dịch.</strong> Các nền tảng như Batdongsan, Meey Land thu dữ
            liệu từ tin đăng đã bán, hồ sơ công chứng, và mạng lưới môi giới. Mỗi bản ghi gồm giá
            bán thực tế kèm nhiều đặc trưng: diện tích, số phòng, tuổi nhà, hướng, tầng, đường vào.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>Chuẩn bị đặc trưng (feature engineering).</strong> &ldquo;Vị trí&rdquo; là chữ,
            mà máy chỉ hiểu số. Nên mỗi quận được biểu diễn bằng một con số &mdash; ví dụ Hoàn Kiếm
            250, Bình Chánh 45. Số này được tính từ trung bình giá bán đã biết ở từng quận. Đây là
            bước quyết định độ chính xác nhất.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>Fit công thức hồi quy tuyến tính.</strong> Máy tìm đường thẳng (hoặc siêu
            phẳng khi có nhiều biến) sao cho &ldquo;giá dự đoán&rdquo; gần nhất với &ldquo;giá bán
            thực tế&rdquo; trong tập dữ liệu. Kết quả là một công thức dạng &ldquo;giá = a × diện
            tích + b × số phòng + c × hệ số quận &minus; d × tuổi nhà + ...&rdquo;.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>Ước giá cho căn chưa từng bán.</strong> Khi bạn gõ một căn mới, máy thay số
            vào công thức vừa học, ra giá và kèm biên độ sai số. Vì công thức minh bạch, người
            dùng thấy được &ldquo;giá cao vì diện tích lớn&rdquo; hay &ldquo;giá thấp vì nhà cũ&rdquo;.
          </p>
        </Beat>
        <Beat step={5}>
          <p>
            <strong>Cập nhật liên tục.</strong> Mỗi tháng có hàng nghìn giao dịch mới. Máy huấn
            luyện lại công thức, các hệ số đổi theo thị trường. Khi hạ tầng tuyến metro mở, hệ số
            vị trí quận mới đó tự tăng.
          </p>
        </Beat>
      </ApplicationMechanism>

      {/* ═══════════════ TRY IT ═══════════════ */}
      <ApplicationTryIt topicSlug="linear-regression-in-housing">
        <div className="space-y-8">
          {/* Phần 1: Predictor với slider */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Home size={18} className="text-accent" />
              Định giá căn hộ của bạn
            </h3>
            <HousePricePredictor />
          </section>

          {/* Phần 2: Scatter plot với residual */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Activity size={18} className="text-accent" />
              20 giao dịch thật quanh bạn &mdash; đường thẳng của mô hình
            </h3>
            <Q2ScatterPlot />
            <Callout variant="info" title="Sai số nói lên điều gì?">
              Khi bạn thấy một điểm <em>cao hơn</em> đường thẳng, nghĩa là giá thực cao hơn mô
              hình dự đoán &mdash; có thể căn đó có đặc điểm mô hình chưa biết (view đẹp, tầng cao,
              hướng Đông Nam). Ngược lại, điểm <em>dưới</em> đường thường là căn bị cũ, đường hẹp,
              hay chủ muốn bán gấp.
            </Callout>
          </section>

          {/* Phần 3: Inline challenges */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Sparkles size={18} className="text-accent" />
              Thử thách
            </h3>

            <InlineChallenge
              question="Đội dữ liệu của bạn fit hồi quy chỉ với 2 biến: diện tích và số phòng. Nhưng họ có 30 đặc trưng khác (hướng, tầng, đường vào, view, pháp lý…) mà KHÔNG đưa vào mô hình. Nguy cơ lớn nhất là gì?"
              options={[
                "Mô hình sẽ rất nhanh vì ít biến",
                "Mô hình sẽ 'gán' toàn bộ ảnh hưởng của các biến bỏ sót vào hai biến còn lại — hệ số bị lệch, dự đoán sai có hệ thống",
                "Mô hình không chạy được",
                "Độ chính xác tăng vì ít biến thì ít nhiễu",
              ]}
              correct={1}
              explanation="Hiện tượng gọi là 'omitted variable bias' — khi bạn bỏ biến quan trọng, ảnh hưởng của chúng bị dồn vào các biến còn lại. Ví dụ: bỏ 'hướng', thì hệ số 'diện tích' có thể bị phồng lên nếu những căn lớn hay nằm hướng đẹp. Kết quả: công thức trông có lý nhưng ước giá sai với những căn có hướng xấu."
            />

            <div className="mt-4">
              <InlineChallenge
                question="Một mô hình dự đoán giá nhà khớp 100% trên 200 giao dịch huấn luyện. Khi đem dự đoán 50 căn mới, sai số trung bình 30%. Vì sao?"
                options={[
                  "Mô hình quá đơn giản",
                  "Mô hình quá phức tạp so với dữ liệu (overfit) — nó học thuộc từng giao dịch mà không nắm được quy luật chung",
                  "Dữ liệu 50 căn mới bị lỗi",
                  "Hồi quy tuyến tính không bao giờ đúng",
                ]}
                correct={1}
                explanation="Mô hình khớp 100% train nhưng sai nhiều trên test là dấu hiệu kinh điển của overfitting. Thường xảy ra khi có quá nhiều biến so với số mẫu, hoặc dùng mô hình quá phức tạp. Giải pháp: thêm dữ liệu, bớt biến rác, hoặc thêm regularization."
              />
            </div>

            <div className="mt-4">
              <InlineChallenge
                question="Khách hỏi: 'Căn 400m² của tôi ở biệt thự ngoại thành nên bao nhiêu?' Mô hình trả lời 18 tỷ. Bạn có nên tin?"
                options={[
                  "Có, vì mô hình đã học từ triệu giao dịch",
                  "Không chắc — mô hình được huấn luyện chủ yếu trên căn 30–200m² ở quận trung tâm, 400m² biệt thự ngoại thành nằm NGOÀI khoảng dữ liệu. Kết quả rất không đáng tin",
                  "Có, hồi quy tuyến tính luôn đúng",
                  "Không, mô hình chỉ biết HCM",
                ]}
                correct={1}
                explanation="Đây là hiện tượng 'extrapolation' (ngoại suy). Mô hình chỉ chạy tốt trong khoảng dữ liệu đã thấy. Vượt ra ngoài khoảng đó, công thức tuyến tính có thể nội suy ra các số vô lý. Luôn kiểm tra xem ca mới có 'giống' tập huấn luyện không trước khi tin con số."
              />
            </div>
          </section>

          <Callout variant="warning" title="Hạn chế của phương pháp">
            Hồi quy tuyến tính không biết về các biến quan trọng mà bạn chưa cho vào: view, hướng,
            pháp lý, khu tiện ích... Nó cũng giả định mọi quan hệ đều là đường thẳng &mdash; trên
            thực tế giá có thể tăng theo bậc thang (mỗi 20m² thêm một mức), hoặc cong theo tuổi
            nhà. Khi thấy hệ số kỳ lạ, hãy hỏi: &ldquo;mình có thiếu biến nào không?&rdquo;.
          </Callout>

          <MiniSummary
            title="Batdongsan &amp; các nền tảng dùng hồi quy tuyến tính như thế nào?"
            points={[
              "Mỗi quận được mã hoá thành một con số (hệ số vị trí) dựa trên giá trung bình đã biết.",
              "Công thức: giá ≈ a·diện tích + b·phòng + c·hệ số vị trí − d·tuổi nhà + điểm chặn.",
              "Máy tự tìm a, b, c, d từ hàng chục nghìn giao dịch thực bằng phương pháp bình phương tối thiểu.",
              "Mỗi hệ số dễ giải thích cho khách: 'tăng diện tích 10m² tại Quận 2 thêm khoảng 810 triệu'.",
              "Vẫn cần kiểm tra sai số và không ngoại suy ra khỏi khoảng dữ liệu đã huấn luyện.",
            ]}
          />

          <p className="text-sm text-muted leading-relaxed">
            Chưa rõ cơ chế bên trong?{" "}
            <TopicLink slug="linear-regression">
              Quay lại bài lý thuyết hồi quy tuyến tính
            </TopicLink>{" "}
            để tự kéo điểm và xem đường thẳng thay đổi như thế nào.
          </p>

          {/* Quiz — kiểm tra hiểu biết ứng dụng */}
          <section className="mt-6">
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sparkles size={18} className="text-accent" />
              Kiểm tra nhanh
            </h3>
            <QuizSection questions={housingQuizQuestions} />
          </section>
        </div>
      </ApplicationTryIt>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="linear-regression-in-housing"
      >
        <Metric
          value="Giá trung bình căn hộ TP.HCM Quận 2 (Thủ Đức) khoảng 60–90 triệu/m² đầu 2024"
          sourceRef={1}
        />
        <Metric
          value="Chung cư Hà Nội tăng ~20% năm 2024, cao nhất một thập kỷ"
          sourceRef={2}
        />
        <Metric
          value="Zestimate (tham chiếu quốc tế) đạt sai số trung vị 1,74% với nhà đang rao bán"
          sourceRef={3}
        />
        <Metric
          value="Meey Land và các nền tảng VN dùng mô hình giá bất động sản cho hàng trăm nghìn tin đăng mỗi tháng"
          sourceRef={4}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Hồi quy tuyến tính"
        topicSlug="linear-regression-in-housing"
      >
        <p>
          Không có hồi quy tuyến tính, mọi việc định giá nhà phải quay lại thời &ldquo;hỏi ba cò
          môi giới, ai nói đúng thì tin&rdquo;. Chậm, đắt, và rất chủ quan.
        </p>
        <p>
          Với hồi quy tuyến tính, một người mua nhà mới có thể ngồi ở Hà Nội, ước giá một căn ở
          TP.HCM trong ba giây &mdash; và quan trọng hơn, hiểu <em>vì sao</em> giá đó: bao nhiêu
          đến từ diện tích, bao nhiêu từ quận, bao nhiêu bị trừ vì nhà cũ. Đó chính là vẻ đẹp của
          công thức tuyến tính: vừa nhanh, vừa minh bạch.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
