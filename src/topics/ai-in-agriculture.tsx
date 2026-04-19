"use client";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sprout,
  Droplets,
  TrendingUp,
  Truck,
  LineChart,
  Bug,
  Wifi,
  CloudSun,
  MapPin,
  Leaf,
  Thermometer,
  CloudRain,
  Sun,
  Sparkles,
} from "lucide-react";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  TopicLink,
  ToggleCompare,
  TabView,
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

const TOTAL_STEPS = 8;

// ===========================================================================
// Demo 1 — Phát hiện bệnh trên lá lúa qua ảnh chụp điện thoại
// ===========================================================================

type DiseaseCase = {
  id: string;
  label: string;
  location: string;
  condition: string;
  confidence: number;
  regions: { x: number; y: number; r: number }[];
  color: string;
  advice: string;
};

const DISEASE_CASES: DiseaseCase[] = [
  {
    id: "healthy",
    label: "Lá khoẻ",
    location: "Đồng Tháp, đầu vụ",
    condition: "Khoẻ mạnh",
    confidence: 0.94,
    regions: [],
    color: "#16a34a",
    advice: "Tiếp tục lịch tưới và bón phân cân đối. Kiểm tra lại sau 7 ngày.",
  },
  {
    id: "dao_on",
    label: "Đạo ôn",
    location: "Cần Thơ, giữa vụ",
    condition: "Nghi đạo ôn (vết hình thoi xám)",
    confidence: 0.82,
    regions: [{ x: 30, y: 35, r: 10 }, { x: 55, y: 55, r: 12 }, { x: 70, y: 40, r: 8 }],
    color: "#dc2626",
    advice: "Phun Tricyclazole 75WP 1g/lít sáng sớm, cách 7 ngày. Báo khuyến nông xã kiểm tra ruộng lân cận.",
  },
  {
    id: "chay_bia",
    label: "Cháy bìa lá",
    location: "An Giang, cuối vụ",
    condition: "Cháy bìa lá (vi khuẩn Xanthomonas)",
    confidence: 0.78,
    regions: [{ x: 15, y: 30, r: 9 }, { x: 85, y: 55, r: 10 }, { x: 10, y: 70, r: 8 }],
    color: "#f97316",
    advice: "Giảm đạm, tăng kali. Phun Kasugamycin hoặc Đồng oxyclorua. Tháo nước ruộng 1–2 ngày.",
  },
  {
    id: "vang_lun",
    label: "Vàng lùn",
    location: "Sóc Trăng, giữa vụ",
    condition: "Vàng lùn do virus (rầy nâu truyền)",
    confidence: 0.71,
    regions: [{ x: 40, y: 40, r: 16 }, { x: 60, y: 60, r: 15 }],
    color: "#eab308",
    advice: "Phun thuốc trừ rầy ngay (Imidacloprid), nhổ cây bệnh tiêu huỷ. Báo khuyến nông vì có thể lan vùng.",
  },
];

function LeafSVG({
  showOverlay,
  regions,
  color,
}: {
  showOverlay: boolean;
  regions: { x: number; y: number; r: number }[];
  color: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      className="h-full w-full"
      role="img"
      aria-label="Ảnh lá lúa"
    >
      <defs>
        <radialGradient id="leaf-body" cx="0.5" cy="0.5" r="0.6">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#15803d" />
        </radialGradient>
        <radialGradient id="ai-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#fde047" stopOpacity={0.85} />
          <stop offset="60%" stopColor="#f97316" stopOpacity={0.55} />
          <stop offset="100%" stopColor="#dc2626" stopOpacity={0} />
        </radialGradient>
      </defs>
      <path
        d="M50 6 C78 20, 92 48, 78 82 C65 96, 38 94, 24 80 C8 56, 22 20, 50 6 Z"
        fill="url(#leaf-body)"
        stroke="#166534"
        strokeWidth="1.5"
      />
      <path
        d="M50 8 Q52 50, 52 92"
        fill="none"
        stroke="#166534"
        strokeWidth="1"
        opacity={0.5}
      />
      {[18, 32, 46, 60, 74].map((y, i) => (
        <g key={i}>
          <path
            d={`M51 ${y} Q${35 - i} ${y + 6}, ${22 + i * 0.5} ${y + 14}`}
            fill="none"
            stroke="#166534"
            strokeWidth="0.7"
            opacity={0.4}
          />
          <path
            d={`M52 ${y} Q${65 + i} ${y + 6}, ${80 - i * 0.5} ${y + 14}`}
            fill="none"
            stroke="#166534"
            strokeWidth="0.7"
            opacity={0.4}
          />
        </g>
      ))}
      {/* Ground-truth disease spots (always visible on diseased cases) */}
      {regions.map((r, i) => (
        <ellipse
          key={`spot-${i}`}
          cx={r.x}
          cy={r.y}
          rx={r.r * 0.55}
          ry={r.r * 0.3}
          fill={color}
          opacity={0.55}
        />
      ))}
      {/* AI overlay — pulsing heatmap */}
      <AnimatePresence>
        {showOverlay &&
          regions.map((r, i) => (
            <motion.circle
              key={`ai-${i}`}
              cx={r.x}
              cy={r.y}
              r={r.r}
              fill="url(#ai-glow)"
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.4 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            />
          ))}
      </AnimatePresence>
    </svg>
  );
}

function DiseaseDetectionDemo() {
  const [selectedId, setSelectedId] = useState<string>("dao_on");
  const [showAI, setShowAI] = useState<boolean>(true);
  const selected =
    DISEASE_CASES.find((c) => c.id === selectedId) ?? DISEASE_CASES[0];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {DISEASE_CASES.map((c) => {
          const active = c.id === selectedId;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedId(c.id)}
              className={`rounded-xl border-2 p-2 text-left transition-all ${
                active ? "-translate-y-0.5 shadow" : "opacity-80"
              }`}
              style={{
                borderColor: active ? c.color : "var(--color-border)",
              }}
            >
              <div className="text-[10px] uppercase text-muted">
                {c.location}
              </div>
              <div className="text-[12px] font-semibold text-foreground">
                {c.label}
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted">
                Ảnh nông dân chụp
              </div>
              <div className="text-sm font-semibold text-foreground">
                {selected.location}
              </div>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-surface px-2 py-1 text-[11px]">
              <input
                type="checkbox"
                checked={showAI}
                onChange={(e) => setShowAI(e.target.checked)}
                className="accent-accent"
              />
              <span>Bật AI phân tích</span>
            </label>
          </div>
          <div className="mx-auto aspect-square w-full max-w-[260px] rounded-lg bg-surface">
            <LeafSVG
              showOverlay={showAI}
              regions={selected.regions}
              color={selected.color}
            />
          </div>
          <p className="mt-2 text-[11px] text-muted">
            Vùng vàng–cam là chỗ AI &ldquo;nhìn&rdquo; thấy dấu hiệu khác thường.
          </p>
        </div>

        <div className="space-y-3">
          <div
            className="rounded-xl border p-3"
            style={{
              borderColor: `${selected.color}55`,
              backgroundColor: `${selected.color}0D`,
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: selected.color }}
              >
                Kết luận AI
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                style={{ backgroundColor: selected.color }}
              >
                {Math.round(selected.confidence * 100)}% tự tin
              </span>
            </div>
            <div className="mt-1 text-sm font-semibold text-foreground">
              {selected.condition}
            </div>
            <ConfidenceBar value={selected.confidence} color={selected.color} />
          </div>

          <div className="rounded-xl border border-border bg-card p-3">
            <div className="mb-1 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                Khuyến nghị
              </span>
            </div>
            <p className="text-[13px] leading-relaxed text-foreground">
              {selected.advice}
            </p>
          </div>

          <div className="rounded-lg bg-surface p-2 text-[11px] leading-relaxed text-muted">
            {selected.confidence >= 0.8 ? (
              <span>
                <strong className="text-green-600">Đủ tự tin</strong>: app hiển
                thị chẩn đoán và đường dây khuyến nông.
              </span>
            ) : (
              <span>
                <strong className="text-amber-600">Chưa chắc</strong>: app đề
                nghị chụp lại ảnh rõ hơn hoặc gọi khuyến nông trước khi xử lý.
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="text-[11px] italic text-muted">
        Ứng dụng thật (Plantix, VietGap Scan, FPT.AI ForFarming) chạy được trên
        điện thoại cũ, không cần 4G — nông dân chụp ngoài ruộng, AI trả lời
        trong vòng vài giây.
      </p>
    </div>
  );
}

function ConfidenceBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${value * 100}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  );
}

// ===========================================================================
// Demo 2 — Bảng điều khiển tưới nước thông minh
// ===========================================================================

function IrrigationDashboard() {
  const [soil, setSoil] = useState<number>(35); // % soil moisture
  const [rainChance, setRainChance] = useState<number>(20); // % rain next 24h
  const [temp, setTemp] = useState<number>(32); // °C

  const decision = useMemo(() => {
    // Simple rules — visible logic for teaching
    if (soil >= 70)
      return {
        action: "Không tưới",
        color: "#0ea5e9",
        icon: CloudRain,
        reason:
          "Đất đã đủ ẩm. Tưới thêm dễ úng rễ, tăng nguy cơ bệnh đạo ôn cổ bông.",
      };
    if (rainChance >= 70)
      return {
        action: "Chờ mưa",
        color: "#6366f1",
        icon: CloudRain,
        reason:
          "Xác suất mưa cao trong 24 giờ. Đợi mưa tự nhiên sẽ tiết kiệm điện bơm và nước.",
      };
    if (soil <= 25 && temp >= 32)
      return {
        action: "Tưới ngay",
        color: "#dc2626",
        icon: Sun,
        reason:
          "Đất khô + trời nắng gắt. Nếu không tưới trong vài giờ, lá cuốn và giảm năng suất 5–8%.",
      };
    if (soil <= 40)
      return {
        action: "Tưới tối nay",
        color: "#f59e0b",
        icon: Droplets,
        reason:
          "Đất đang xuống dưới mức tối ưu. Tưới khi chiều mát để giảm bốc hơi.",
      };
    return {
      action: "Theo dõi",
      color: "#16a34a",
      icon: CloudSun,
      reason: "Điều kiện ổn. Kiểm tra lại sau 6 giờ hoặc khi thời tiết đổi.",
    };
  }, [soil, rainChance, temp]);

  const DecisionIcon = decision.icon;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <GaugeCard
          label="Độ ẩm đất"
          value={soil}
          unit="%"
          min={0}
          max={100}
          color="#0ea5e9"
          icon={Droplets}
          onChange={setSoil}
        />
        <GaugeCard
          label="Khả năng mưa 24h"
          value={rainChance}
          unit="%"
          min={0}
          max={100}
          color="#6366f1"
          icon={CloudRain}
          onChange={setRainChance}
        />
        <GaugeCard
          label="Nhiệt độ hiện tại"
          value={temp}
          unit="°C"
          min={20}
          max={42}
          color="#dc2626"
          icon={Thermometer}
          onChange={setTemp}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={decision.action}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="rounded-xl border p-4"
          style={{
            borderColor: decision.color,
            backgroundColor: `${decision.color}0F`,
          }}
        >
          <div className="flex items-start gap-3">
            <span
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white"
              style={{ backgroundColor: decision.color }}
            >
              <DecisionIcon className="h-5 w-5" />
            </span>
            <div>
              <div
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: decision.color }}
              >
                AI khuyến nghị
              </div>
              <div className="text-lg font-bold text-foreground">
                {decision.action}
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-foreground">
                {decision.reason}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-2 text-[11px] leading-relaxed text-muted sm:grid-cols-2">
        <div className="rounded-lg bg-surface p-2">
          <strong>Mẹo thử:</strong> đẩy độ ẩm đất xuống 20%, nhiệt độ 36°C —
          xem AI đổi sang &ldquo;Tưới ngay&rdquo;.
        </div>
        <div className="rounded-lg bg-surface p-2">
          <strong>Mẹo thử:</strong> tăng khả năng mưa lên 80% — dù đất khô, AI
          khuyên &ldquo;Chờ mưa&rdquo; để tiết kiệm điện bơm.
        </div>
      </div>

      <p className="text-[11px] italic text-muted">
        Các hệ thật ở Việt Nam (Mimosatek, Hachi Hub, VNPT Smart Agri) dùng
        cảm biến ngoài ruộng kết hợp API thời tiết. AI học dần thói quen nông
        dân và đặc thù từng thửa.
      </p>
    </div>
  );
}

function GaugeCard({
  label,
  value,
  unit,
  min,
  max,
  color,
  icon: Icon,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  color: string;
  icon: typeof Droplets;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
          <Icon className="h-3.5 w-3.5" style={{ color }} />
          {label}
        </span>
        <span
          className="text-lg font-bold tabular-nums"
          style={{ color }}
        >
          {value}
          <span className="text-[10px] text-muted">{unit}</span>
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-accent"
        aria-label={`Điều chỉnh ${label}`}
      />
      <div className="flex justify-between text-[9px] text-muted">
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
}

// ===========================================================================
// Demo 3 — Dự báo năng suất: có AI vs không
// ===========================================================================

type YieldBar = {
  region: string;
  withoutAI: number;
  withAI: number;
  crop: string;
};

const YIELD_BARS: YieldBar[] = [
  { region: "Đồng Tháp", crop: "Lúa hè thu", withoutAI: 5.8, withAI: 7.2 },
  { region: "An Giang", crop: "Lúa đông xuân", withoutAI: 6.2, withAI: 7.6 },
  { region: "Cần Thơ", crop: "Lúa ba vụ", withoutAI: 5.5, withAI: 6.9 },
  { region: "Đắk Lắk", crop: "Cà phê Robusta", withoutAI: 3.1, withAI: 3.8 },
  { region: "Bình Thuận", crop: "Thanh long ruột đỏ", withoutAI: 28.0, withAI: 33.5 },
];

function YieldPredictor() {
  const [selected, setSelected] = useState<string>("Đồng Tháp");
  const bar = YIELD_BARS.find((b) => b.region === selected) ?? YIELD_BARS[0];
  const gain = bar.withAI - bar.withoutAI;
  const gainPct = (gain / bar.withoutAI) * 100;
  const maxY = Math.max(...YIELD_BARS.map((b) => b.withAI)) * 1.1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {YIELD_BARS.map((b) => {
          const active = b.region === selected;
          return (
            <button
              key={b.region}
              type="button"
              onClick={() => setSelected(b.region)}
              className={`rounded-full border px-3 py-1 text-[11px] transition-colors ${
                active
                  ? "border-accent bg-accent text-white"
                  : "border-border bg-card text-muted hover:border-accent/50"
              }`}
            >
              <MapPin className="mr-1 inline h-3 w-3" />
              {b.region}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted">
              {bar.crop} — năng suất dự báo
            </div>
            <div className="text-sm font-semibold text-foreground">
              {bar.region}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase text-muted">Chênh lệch</div>
            <div className="text-sm font-bold text-green-600">
              +{gain.toFixed(1)} tấn/ha
            </div>
            <div className="text-[10px] font-semibold text-green-600">
              (+{gainPct.toFixed(0)}%)
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <BarRow
            label="Không dùng AI"
            sub="Kinh nghiệm, lịch truyền thống"
            value={bar.withoutAI}
            max={maxY}
            color="#94a3b8"
          />
          <BarRow
            label="Có AI hỗ trợ"
            sub="Dự báo sâu bệnh + tưới thông minh + chọn giống"
            value={bar.withAI}
            max={maxY}
            color="#16a34a"
          />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
          <StatChip label="Giảm thuốc BVTV" value="−30%" color="#16a34a" />
          <StatChip label="Giảm nước tưới" value="−25%" color="#0ea5e9" />
          <StatChip label="Tăng thu nhập" value="+15–25%" color="#f59e0b" />
        </div>
      </div>

      <p className="text-[11px] italic text-muted">
        Con số trên là trung bình của các pilot 2022–2024: VIFONET ở Đồng bằng
        sông Cửu Long, FPT.AI ForFarming ở Đắk Lắk, và hợp tác xã lúa thông
        minh ở An Giang.
      </p>
    </div>
  );
}

function BarRow({
  label,
  sub,
  value,
  max,
  color,
}: {
  label: string;
  sub: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = (value / max) * 100;
  return (
    <div>
      <div className="flex items-center justify-between text-[12px]">
        <div>
          <span className="font-semibold text-foreground">{label}</span>{" "}
          <span className="text-[10px] text-muted">— {sub}</span>
        </div>
        <span className="font-bold tabular-nums" style={{ color }}>
          {value.toFixed(1)} t/ha
        </span>
      </div>
      <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-surface">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function StatChip({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className="rounded-lg border p-2 text-center"
      style={{ borderColor: `${color}55`, backgroundColor: `${color}0D` }}
    >
      <div className="text-[9px] uppercase text-muted">{label}</div>
      <div className="text-sm font-bold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

// ===========================================================================
// Component chính
// ===========================================================================

export default function AIInAgricultureTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          "Bác nông dân ở An Giang chụp ảnh lá lúa bằng điện thoại, app AI báo &ldquo;đạo ôn 82% tự tin&rdquo;. Điều này nghĩa là gì?",
        options: [
          "AI chắc chắn 100% là đạo ôn",
          "AI đã so ảnh với hàng ngàn ảnh lá bệnh trong bộ học và thấy 82% giống đạo ôn nhất — nên hành xử có phần: phun thuốc đạo ôn, nhưng vẫn nên hỏi khuyến nông xã vì 18% còn lại có thể là bệnh khác",
          "Đạo ôn sẽ lan 82% cánh đồng",
          "Nông dân đã làm sai kỹ thuật 82%",
        ],
        correct: 1,
        explanation:
          "Con số &ldquo;82% tự tin&rdquo; là mức độ chắc chắn của AI, không phải xác suất bệnh lan. Với bệnh quan trọng, ngưỡng hành động thường 70–80%. Trên 80% thì tin tưởng xử lý; dưới 70% thì chụp lại ảnh rõ hơn hoặc gọi khuyến nông. Đây là nguyên tắc &ldquo;có chừng mực&rdquo; tương tự AI y tế.",
      },
      {
        question:
          "Tại sao app phát hiện bệnh cây ở Việt Nam cần chạy ĐƯỢC khi KHÔNG có 4G?",
        options: [
          "Để nông dân tiết kiệm tiền",
          "Vì nhiều vùng sâu (An Giang, Tây Nguyên, Hà Giang) sóng yếu hoặc không có; app chạy trên điện thoại cũ offline đảm bảo mọi nông dân đều dùng được",
          "Để tránh virus máy tính",
          "Để không cần cập nhật phần mềm",
        ],
        correct: 1,
        explanation:
          "Khoảng 78–82% dân số Việt Nam dùng smartphone (2024), nhưng 4G ở vùng sâu còn chập chờn. Một app cần online sẽ vô dụng ở ruộng xa. Giải pháp: mô hình AI nhẹ chạy trực tiếp trên máy (edge AI / on-device), không cần gửi ảnh lên server.",
      },
      {
        question:
          "Tưới thông minh tiết kiệm được nước và điện như thế nào?",
        options: [
          "Tưới ít nhất có thể, mặc kệ cây",
          "Dùng cảm biến độ ẩm đất + dự báo mưa + AI: nếu trời sắp mưa thì không tưới, nếu đất đã đủ ẩm thì bỏ qua, chỉ tưới khi thực sự cần và đúng thời điểm mát mẻ",
          "Tưới ngẫu nhiên",
          "Tưới gấp đôi lượng bình thường",
        ],
        correct: 1,
        explanation:
          "AI tưới thông minh lấy 3 tín hiệu: (1) độ ẩm đất thực tế, (2) dự báo mưa 24 giờ, (3) nhiệt độ để tính bốc hơi. Kết quả: giảm 20–35% lượng nước, giảm bệnh do úng rễ, và tưới vào chiều tối mát để giảm bốc hơi. Pilot ở Ninh Thuận (thanh long) cho thấy hoá đơn điện bơm giảm khoảng 30%.",
      },
      {
        question:
          "Nền tảng nào là ví dụ Việt Nam đang ứng dụng AI nông nghiệp quy mô lớn?",
        options: [
          "Grab Food",
          "Mimosatek (tưới thông minh IoT + AI), FPT.AI ForFarming (dự báo sâu bệnh và năng suất cà phê), VIFONET (nền tảng nông nghiệp số cho ĐBSCL)",
          "Shopee",
          "Instagram",
        ],
        correct: 1,
        explanation:
          "Ba case study Việt Nam đang vận hành: Mimosatek triển khai cảm biến + AI ở hơn 2000 hộ; FPT.AI ForFarming hợp tác cùng Nestlé Việt Nam cho cà phê Đắk Lắk; VIFONET là platform nông nghiệp số Đồng bằng sông Cửu Long. Bên cạnh đó có Hachi Hub (nhà kính), Agritech startups ở Cần Thơ, Hà Nam.",
      },
      {
        question:
          "Thách thức đặc biệt của AI nông nghiệp Việt Nam so với Mỹ, Hà Lan là gì?",
        options: [
          "Đất Việt Nam ít màu mỡ",
          "(1) Sóng và thiết bị ở nông thôn còn yếu, (2) đa dạng giống cây (lúa Jasmine, ST25, khoai mì KM94) thiếu dữ liệu huấn luyện riêng, (3) rào cản chữ viết cho đồng bào dân tộc — app thường chỉ có tiếng Kinh",
          "Nông dân Việt Nam không thông minh",
          "Không có thách thức nào",
        ],
        correct: 1,
        explanation:
          "Ba thách thức đặc thù: (1) Hạ tầng — sóng chập chờn, điện thoại cũ 2–3 GB RAM; (2) Dữ liệu — bộ ảnh Plantix chủ yếu cho cây Âu–Mỹ, phải tự thu thập ảnh lúa ST25, khoai mì KM94...; (3) Ngôn ngữ — đồng bào H'Mông, Ê Đê, Khmer không phải ai cũng đọc tiếng Kinh. Các dự án tốt dùng giao diện giọng nói và biểu tượng trực quan.",
      },
      {
        question:
          "Giá cả trên thị trường nông sản biến động lớn. AI có thể giúp nông dân như thế nào?",
        options: [
          "AI không liên quan đến giá",
          "Dự báo giá 4–12 tuần tới dựa trên thời tiết, sản lượng, xuất khẩu — giúp nông dân quyết định bán ngay hay trữ, chọn giống vụ sau",
          "AI tự mua nông sản",
          "AI làm giá tăng lên",
        ],
        correct: 1,
        explanation:
          "Mô hình dự báo giá nông sản dùng dữ liệu lịch sử + thời tiết + tin tức xuất khẩu. Ở Việt Nam, các hợp tác xã cà phê Đắk Lắk đã dùng để quyết định trữ kho hay bán ngay. Với thanh long, giá chênh 3–5 lần giữa mùa và trái mùa — dự báo đúng thời điểm thu hoạch quan trọng sống còn.",
      },
      {
        question:
          "Hợp tác xã muốn giao cho AI toàn quyền quyết định phun thuốc cho 200 ha. Cách tiếp cận an toàn nhất?",
        options: [
          "Giao toàn bộ cho AI — máy khách quan hơn",
          "Dùng AI để khuyến nghị; trạm trưởng kiểm tra ngẫu nhiên 10% khuyến nghị mỗi tuần, AI chỉ được tự động hoá sau khi chứng minh đúng trên 95% nhiều vụ liền",
          "Bỏ AI, làm thủ công",
          "Chỉ dùng AI cho lúa, không cho cây khác",
        ],
        correct: 1,
        explanation:
          "Nguyên tắc &ldquo;human-in-the-loop&rdquo;: AI khuyến nghị, con người duyệt — đặc biệt khi quyết định ảnh hưởng đến thu nhập hàng trăm hộ. Sau khi AI chứng minh ổn định qua nhiều vụ, mới cân nhắc tự động hoá một phần, và luôn giữ nút &ldquo;dừng khẩn cấp&rdquo; cho con người.",
      },
      {
        type: "fill-blank",
        question:
          "Tại Đồng bằng sông Cửu Long, AI giúp nông dân phát hiện {blank} trên lá lúa qua ảnh điện thoại, quyết định thời điểm {blank} dựa trên độ ẩm đất và dự báo thời tiết, và dự báo {blank} để lên kế hoạch bán.",
        blanks: [
          {
            answer: "sâu bệnh",
            accept: ["bệnh", "disease", "pests"],
          },
          {
            answer: "tưới nước",
            accept: ["tưới", "irrigation", "watering"],
          },
          {
            answer: "năng suất",
            accept: ["yield", "giá", "sản lượng", "price"],
          },
        ],
        explanation:
          "Ba ứng dụng phổ biến nhất: phát hiện sâu bệnh (chụp ảnh lá), tưới thông minh (cảm biến + thời tiết), và dự báo năng suất/giá (mô hình chuỗi thời gian). Cùng nhau, ba việc này giảm chi phí 25–35% và tăng thu nhập 15–25% cho hộ nông dân tham gia pilot.",
      },
    ],
    [],
  );

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Một nông dân trồng lúa ở Đồng bằng sông Cửu Long dùng AI để làm gì?"
          options={[
            "Dự báo năng suất và giá bán vụ sau",
            "Phát hiện sâu bệnh qua ảnh chụp lá bằng điện thoại",
            "Tối ưu lịch tưới nước dựa trên độ ẩm đất và thời tiết",
            "Tư vấn giá bán, thời điểm thu hoạch và chọn giống vụ sau",
            "Tất cả những việc trên — AI là &ldquo;khuyến nông 24/7&rdquo; trong túi áo",
          ]}
          correct={4}
          explanation="Cả bốn ứng dụng đều đã có pilot thật ở Việt Nam từ 2020–2024. Ảnh chụp lá (Plantix, VietGap Scan) phát hiện đạo ôn, cháy bìa lá, vàng lùn. Cảm biến + AI (Mimosatek) điều khiển tưới ở hơn 2000 hộ. Dự báo năng suất (FPT.AI ForFarming) hợp tác với Nestlé cho cà phê. AI không thay khuyến nông, nhưng giúp khuyến nông tới được mọi hộ, kể cả vùng sâu."
        >
          <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Bối cảnh">
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                Hãy hình dung bác nông dân trồng{" "}
                <strong>10 ha lúa ở Đồng Tháp</strong>. Sáng nào bác cũng dậy
                từ 4 giờ, đi xe máy vòng ruộng. Mắt bác rất tinh — nhưng chỉ
                thấy bệnh <em>khi đã có triệu chứng rõ</em>, tức là khi dịch
                đã lan 5–10%. Đến lúc nhận ra đạo ôn, đã mất 1–3 ha. AI không
                thay bác — nó biến chiếc smartphone trong túi bác thành một
                &ldquo;kính hiển vi&rdquo; và một &ldquo;khuyến nông
                24/7&rdquo;.
              </p>
              <p>
                Việt Nam là <strong>cường quốc nông sản</strong>: top 2 xuất
                khẩu gạo, top 1 hồ tiêu, top 2 cà phê (sau Brazil), top 1 điều
                nhân. Nhưng năng suất/ha thấp hơn Nhật, Hàn, Thái Lan 15–30%.
                Nguyên nhân không phải đất xấu mà là{" "}
                <strong>thông tin đến chậm</strong>: sâu bệnh phát hiện muộn,
                phân bón rải đều thay vì theo đốm, thu hoạch theo kinh nghiệm
                chứ chưa theo dữ liệu.
              </p>
              <p>
                AI giải bài toán này bằng <strong>ba cánh tay</strong>: (1)
                camera điện thoại trên tay nông dân; (2) cảm biến IoT ngoài
                ruộng (độ ẩm, pH, EC); (3) API thời tiết và giá. Ba nguồn cắm
                vào mô hình AI nhẹ —{" "}
                <TopicLink slug="edge-ai">chạy ngay trên điện thoại</TopicLink>{" "}
                — để đưa ra chẩn đoán cho <em>thửa ruộng nhà bác</em>, không
                phải cho cả tỉnh chung chung.
              </p>
              <p>
                Điểm then chốt với Việt Nam là{" "}
                <strong>app phải chạy khi không có 4G</strong>. Sóng ở An Giang,
                Hà Giang, Sóc Trăng còn chập chờn; gửi ảnh lên cloud là xa xỉ.
                Một mô hình nhẹ chạy ngay trong điện thoại — kể cả Android 3
                GB RAM — trả lời trong vài giây, là khác biệt giữa &ldquo;demo
                đẹp&rdquo; và &ldquo;dùng thật ngoài đồng&rdquo;.
              </p>
            </div>
          </LessonSection>

          <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khám phá">
            <VisualizationSection topicSlug="ai-in-agriculture">
              <div className="space-y-8">
                <div>
                  <h3 className="mb-1 text-base font-semibold text-foreground">
                    Bản 1 — Phát hiện bệnh qua ảnh điện thoại
                  </h3>
                  <p className="mb-3 text-[12px] text-muted">
                    Chọn một trường hợp — bật/tắt AI phân tích để thấy vùng
                    &ldquo;nghi ngờ&rdquo; của máy.
                  </p>
                  <DiseaseDetectionDemo />
                </div>

                <div>
                  <h3 className="mb-1 text-base font-semibold text-foreground">
                    Bản 2 — Bảng điều khiển tưới nước thông minh
                  </h3>
                  <p className="mb-3 text-[12px] text-muted">
                    Kéo ba thanh trượt, xem AI đổi quyết định: tưới ngay, chờ
                    mưa, hay bỏ qua.
                  </p>
                  <IrrigationDashboard />
                </div>

                <div>
                  <h3 className="mb-1 text-base font-semibold text-foreground">
                    Bản 3 — Năng suất có AI so với không
                  </h3>
                  <p className="mb-3 text-[12px] text-muted">
                    Bốn vùng, năm cây trồng. Chọn vùng để xem chênh lệch
                    tấn/ha.
                  </p>
                  <YieldPredictor />
                </div>
              </div>
            </VisualizationSection>
          </LessonSection>

          <LessonSection
            step={4}
            totalSteps={TOTAL_STEPS}
            label="Khoảnh khắc Aha"
          >
            <AhaMoment>
              <p>
                AI nông nghiệp là <strong>khuyến nông 24/7 bỏ túi</strong>:
                thay vì chờ cán bộ xã mỗi tuần một lần, bác nông dân có thể
                &ldquo;hỏi&rdquo; điện thoại bất cứ lúc nào — chụp lá lúa nghi
                bệnh, xem có nên tưới hay chờ mưa, biết giá lúa tuần sau. AI
                không làm nông dân hết việc, mà làm{" "}
                <em>kinh nghiệm nhiều năm của khuyến nông</em> nhân rộng cho
                mọi hộ — cả ở Mộc Châu, Cần Thơ, Cà Mau. Giảm 25–35% chi phí
                đầu vào, tăng 15–25% thu nhập, và quan trọng nhất: giảm rủi ro
                mất trắng do phát hiện bệnh muộn.
              </p>
            </AhaMoment>
          </LessonSection>

          <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
            <div className="space-y-4">
              <InlineChallenge
                question="App AI trả về: 'Lá lúa — nghi đạo ôn, 65% tự tin'. Nông dân nên làm gì?"
                options={[
                  "Phun thuốc đạo ôn toàn ruộng ngay",
                  "Chụp lại 2–3 ảnh ở góc sáng rõ hơn hoặc gọi cán bộ khuyến nông xã — 65% là dưới ngưỡng 'đủ tin' (thường 70–80%)",
                  "Bỏ qua hoàn toàn kết quả AI",
                  "Chuyển sang giống khác luôn",
                ]}
                correct={1}
                explanation="65% nghĩa là AI vẫn lăn tăn giữa đạo ôn và bệnh khác. Phun thuốc đạo ôn nếu thực chất là cháy bìa lá thì vừa tốn tiền vừa không trị được. Cách đúng: chụp lại (ảnh mờ/ngược sáng là nguyên nhân phổ biến) hoặc hỏi khuyến nông để có người đối chiếu."
              />
              <InlineChallenge
                question="Một dự án AI muốn triển khai ở xã vùng cao Hà Giang nơi 80% dân là người H'Mông, sóng 3G chập chờn. Thiết kế nào phù hợp nhất?"
                options={[
                  "App cloud yêu cầu 4G ổn định, tiếng Kinh với văn bản dài",
                  "App nhẹ chạy offline, giao diện bằng biểu tượng + giọng nói tiếng H'Mông, đồng bộ dữ liệu khi có sóng",
                  "Cử sinh viên tình nguyện cầm iPad xuống thăm hàng tuần",
                  "Đợi hạ tầng 4G lên đã",
                ]}
                correct={1}
                explanation="Ở vùng sâu, hai rào cản lớn là hạ tầng và ngôn ngữ. App phải chạy offline (mô hình nhẹ trên máy), giao diện đơn giản (biểu tượng thay chữ, giọng nói bản địa), và đồng bộ khi có sóng. Đây là hướng các dự án FPT.AI ForFarming và VIFONET đang đi."
              />
            </div>
          </LessonSection>

          <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Lý thuyết">
            <ExplanationSection>
              <p className="text-sm leading-relaxed">
                AI vào nông nghiệp tập trung vào <strong>năm nhóm ứng dụng</strong>.
                Mỗi nhóm có ví dụ Việt Nam đang vận hành, kèm hiện trạng hạ
                tầng và cạm bẫy thường gặp.
              </p>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <UseCaseCard
                  icon={Bug}
                  title="1. Phát hiện sâu bệnh qua ảnh"
                  description="Chụp lá bằng điện thoại → AI phân loại đạo ôn, cháy bìa, vàng lùn. Đạt 88–93% chính xác. Chạy offline trên Android 3 GB RAM."
                  color="#dc2626"
                />
                <UseCaseCard
                  icon={LineChart}
                  title="2. Dự báo năng suất"
                  description="Kết hợp ảnh vệ tinh + thời tiết + dữ liệu đất → dự báo tấn/ha 4–12 tuần trước thu hoạch. Giúp lên kế hoạch bán, trữ kho."
                  color="#0ea5e9"
                />
                <UseCaseCard
                  icon={Droplets}
                  title="3. Tưới thông minh"
                  description="Cảm biến độ ẩm + API mưa + AI → tưới đúng lúc, đúng lượng. Giảm 20–35% nước, giảm hoá đơn điện bơm 30%."
                  color="#16a34a"
                />
                <UseCaseCard
                  icon={TrendingUp}
                  title="4. Dự báo giá"
                  description="Mô hình chuỗi thời gian + tin xuất khẩu → dự báo giá 4–12 tuần. Hợp tác xã cà phê Đắk Lắk đã dùng để quyết trữ hay bán."
                  color="#f59e0b"
                />
                <UseCaseCard
                  icon={Truck}
                  title="5. Tối ưu chuỗi cung ứng"
                  description="AI lên lộ trình xe tải chở nông sản tươi, giảm hư hao. Ở Đà Lạt – TP.HCM, giảm 15% thời gian vận chuyển rau."
                  color="#8b5cf6"
                />
                <UseCaseCard
                  icon={Sprout}
                  title="+ Phụ trợ: Thuỷ sản và chăn nuôi"
                  description="Camera dưới ao tôm Cà Mau phát hiện bệnh gan tuỵ. Cảm biến chuồng heo ở Hà Nam theo dõi thân nhiệt đàn."
                  color="#06b6d4"
                />
              </div>

              <Callout
                variant="info"
                title="Case study Việt Nam — 6 dự án đang vận hành"
              >
                <ul className="list-disc space-y-1 pl-4 text-[13px]">
                  <li>
                    <strong>Mimosatek</strong>: cảm biến IoT + AI tưới thông
                    minh cho hơn 2.000 hộ trồng rau, trồng nho, cà phê.
                  </li>
                  <li>
                    <strong>FPT.AI ForFarming</strong>: hợp tác với Nestlé
                    Việt Nam dự báo sâu bệnh và năng suất cà phê ở Đắk Lắk.
                  </li>
                  <li>
                    <strong>VIFONET</strong>: nền tảng nông nghiệp số cho
                    Đồng bằng sông Cửu Long, tích hợp khuyến nông và dữ liệu
                    vệ tinh.
                  </li>
                  <li>
                    <strong>Hachi Hub</strong>: hệ nhà kính thông minh (Hà
                    Nam, Đà Lạt) — AI điều khiển nhiệt độ, ẩm, dinh dưỡng
                    theo thời gian thực.
                  </li>
                  <li>
                    <strong>Rynan Technologies (Cần Thơ)</strong>: drone phun
                    thuốc + AI chọn điểm phun cho lúa, giảm 70% thuốc BVTV.
                  </li>
                  <li>
                    <strong>Agritech startups An Giang, Cần Thơ</strong>: các
                    nhóm trẻ đang pilot ứng dụng phát hiện bệnh và phân tích
                    đất.
                  </li>
                </ul>
              </Callout>

              <div className="rounded-xl border border-border bg-card p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-accent" />
                  <span className="text-sm font-semibold text-foreground">
                    Thực tế hạ tầng ở nông thôn Việt Nam (2024–2025)
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 text-[13px] leading-relaxed md:grid-cols-3">
                  <InfraStat label="Smartphone nông thôn" value="≈78–82%" note="Phần lớn là máy cũ 2–4 GB RAM." />
                  <InfraStat label="Phủ sóng 4G nông thôn" value="≈85–90%" note="Vùng núi, sâu ĐBSCL còn chập chờn." />
                  <InfraStat label="5G" value="Thí điểm đô thị" note="Ưu tiên TP lớn; nông thôn còn xa." />
                </div>
                <p className="mt-3 text-[12px] italic text-muted">
                  Hàm ý: app AI nông nghiệp phải nhẹ, chạy offline, tối ưu cho
                  máy cấp thấp. Không thể phụ thuộc vào API cloud.
                </p>
              </div>

              <CollapsibleDetail title="Cạm bẫy đặc thù Việt Nam cần lưu ý">
                <div className="space-y-2 text-[13px] leading-relaxed">
                  <p>
                    <strong>1. Dữ liệu cho giống cây bản địa.</strong> Bộ ảnh
                    PlantVillage chủ yếu cho cây Âu–Mỹ. Lúa Jasmine, ST25,
                    khoai mì KM94, cà phê Robusta cao nguyên, xoài Hoà Lộc —
                    phải tự thu thập. Hợp đồng với hợp tác xã, sinh viên nông
                    nghiệp chụp theo khung chuẩn, bác sĩ cây trồng gán nhãn.
                  </p>
                  <p>
                    <strong>2. Rào cản ngôn ngữ.</strong> Đồng bào H&rsquo;Mông,
                    Ê Đê, Khmer, Ba Na không phải ai cũng đọc tiếng Kinh trôi
                    chảy. App tốt dùng biểu tượng + giọng nói bản địa. Hội
                    phụ nữ xã có thể là đầu mối đào tạo.
                  </p>
                  <p>
                    <strong>3. Niềm tin của nông dân.</strong> Bác có 30 năm
                    kinh nghiệm sẽ không tin app vừa cài. Dự án thành công
                    thường bắt đầu bằng thí điểm 0,1 ha, cho nông dân thấy AI
                    khớp trực giác trước, rồi mới mở rộng.
                  </p>
                  <p>
                    <strong>4. Lệ thuộc cảm biến nhập khẩu.</strong> Cảm biến
                    độ ẩm / EC / pH chất lượng cao nhập Đài Loan, Israel. Giá
                    3–10 triệu/bộ là rào cản cho hộ nhỏ. Startup nội địa đang
                    nội hoá một phần.
                  </p>
                </div>
              </CollapsibleDetail>

              <Callout
                variant="warning"
                title="Những sai lầm thường gặp khi triển khai"
              >
                <ul className="list-disc space-y-1 pl-4 text-[13px]">
                  <li>
                    <strong>Copy mô hình nước ngoài nguyên bản.</strong> Model
                    huấn luyện trên ảnh cà chua Mỹ không nhận được đạo ôn lúa
                    Việt — cần fine-tune với dữ liệu địa phương.
                  </li>
                  <li>
                    <strong>Bỏ qua ngưỡng tự tin.</strong> Ép AI trả lời
                    trong mọi trường hợp sẽ dẫn đến chẩn đoán sai, nông dân
                    phun sai thuốc — tổn hại hơn là không có AI.
                  </li>
                  <li>
                    <strong>Không có đường dây khuyến nông.</strong> AI chỉ
                    thay thế 60–70% việc khuyến nông; case khó vẫn cần người.
                    App không có nút &ldquo;gọi khuyến nông xã&rdquo; là
                    thiếu trách nhiệm.
                  </li>
                  <li>
                    <strong>Dùng data nông dân để bán cho đại lý thuốc.</strong>
                    {" "}
                    Vi phạm đạo đức và pháp luật. Dữ liệu về ruộng, bệnh, thu
                    hoạch phải được bảo vệ và chỉ dùng đúng mục đích công bố.
                  </li>
                </ul>
              </Callout>

              <TabView
                tabs={[
                  {
                    label: "Cho nông dân",
                    content: (
                      <ol className="list-decimal space-y-1 pl-4 text-[13px] leading-relaxed">
                        <li>
                          Thử app phát hiện bệnh trên một thửa nhỏ. So kết quả
                          với khuyến nông xã trong 2 tuần — khớp thì mới mở
                          rộng.
                        </li>
                        <li>
                          Luôn giữ đường dây khuyến nông — AI chưa đúng 100%.
                          Gọi khi độ tự tin dưới 70%.
                        </li>
                        <li>
                          Tham gia hợp tác xã / nhóm Zalo cùng giống cây để
                          chia sẻ kinh nghiệm dùng app.
                        </li>
                      </ol>
                    ),
                  },
                  {
                    label: "Cho hợp tác xã",
                    content: (
                      <ol className="list-decimal space-y-1 pl-4 text-[13px] leading-relaxed">
                        <li>
                          App/cảm biến có tương thích với giống cây địa phương?
                          Đã huấn luyện trên dữ liệu Việt Nam chưa?
                        </li>
                        <li>
                          Chi phí cả vòng đời (cảm biến, pin, bảo trì)? Sau
                          bao lâu hoà vốn?
                        </li>
                        <li>
                          Nhà cung cấp có hỗ trợ tiếng Việt, đường dây khẩn
                          cấp mùa vụ?
                        </li>
                        <li>
                          Dữ liệu ruộng thuộc về ai? Có điều khoản bảo vệ
                          chưa?
                        </li>
                      </ol>
                    ),
                  },
                  {
                    label: "Cho cán bộ khuyến nông",
                    content: (
                      <ol className="list-decimal space-y-1 pl-4 text-[13px] leading-relaxed">
                        <li>
                          Dùng dashboard AI phát hiện sớm điểm nóng trong xã —
                          ưu tiên đi thực địa đúng chỗ.
                        </li>
                        <li>
                          Đưa khuyến nghị AI cho nông dân như góc nhìn thứ
                          hai, không thay kinh nghiệm của mình.
                        </li>
                        <li>
                          Phản hồi ngược: gán nhãn case AI sai cho đơn vị phát
                          triển — mô hình cần dữ liệu địa phương.
                        </li>
                      </ol>
                    ),
                  },
                ]}
              />

              <ToggleCompare
                labelA="Chưa có AI"
                labelB="Có AI hỗ trợ"
                description="Một vụ lúa 3 tháng — so sánh cách ra quyết định"
                childA={
                  <div className="space-y-1.5 text-[13px] leading-relaxed">
                    <p><strong>Phát hiện bệnh</strong>: đi thăm ruộng bằng mắt, thấy khi đã lan 5–10%. Phun đôi khi muộn.</p>
                    <p><strong>Tưới tiêu</strong>: theo lịch cố định. Dư khi sắp mưa, thiếu khi nắng gắt.</p>
                    <p><strong>Bán lúa</strong>: bán ngay vì sợ giá rớt, hoặc trữ rồi lỗ.</p>
                    <p className="italic text-muted">Năng suất 5,8 tấn/ha, chi phí 60%, lợi nhuận ròng 25–30%.</p>
                  </div>
                }
                childB={
                  <div className="space-y-1.5 text-[13px] leading-relaxed">
                    <p><strong>Phát hiện bệnh</strong>: chụp lá → AI báo đạo ôn 82% → phun trúng sớm. Bệnh lan 1–2%.</p>
                    <p><strong>Tưới tiêu</strong>: cảm biến + AI &ldquo;chờ mưa&rdquo; khi 80%, &ldquo;tưới tối&rdquo; khi khô. Giảm 25% nước.</p>
                    <p><strong>Bán lúa</strong>: AI dự báo giá 4 tuần, hợp tác xã đàm phán tập thể.</p>
                    <p className="italic text-muted">Năng suất 7,2 tấn/ha (+25%), chi phí −25–30%, lợi nhuận ròng 40–45%.</p>
                  </div>
                }
              />
            </ExplanationSection>
          </LessonSection>

          <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
            <MiniSummary
              points={[
                "AI nông nghiệp phục vụ 5 nhóm: phát hiện bệnh, dự báo năng suất, tưới thông minh, dự báo giá, tối ưu chuỗi cung ứng.",
                "Ảnh lá + AI trên điện thoại là ứng dụng phổ biến nhất: bật offline, trả lời trong vài giây, chính xác 88–93%.",
                "Tưới thông minh kết hợp cảm biến đất + API mưa + AI: giảm 20–35% nước, giảm hoá đơn điện bơm 30%.",
                "Việt Nam có hệ sinh thái: Mimosatek, FPT.AI ForFarming, VIFONET, Hachi Hub, Rynan, Agritech startups Cần Thơ/An Giang.",
                "Hạ tầng 2024–2025: smartphone ≈80% nông thôn, 4G phủ 85–90%. App BẮT BUỘC chạy offline.",
                "Cạm bẫy: thiếu dữ liệu cho giống cây VN, rào cản ngôn ngữ dân tộc, niềm tin của nông dân, lệ thuộc cảm biến nhập khẩu.",
                "Nguyên tắc human-in-the-loop: AI khuyến nghị, khuyến nông xã + nông dân quyết định — đặc biệt khi bệnh quan trọng hoặc tự tin dưới 80%.",
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

// ===========================================================================
// Supporting components — kept below main for readability
// ===========================================================================

function UseCaseCard({
  icon: Icon,
  title,
  description,
  color,
}: {
  icon: typeof Leaf;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div
      className="rounded-xl border p-3"
      style={{ borderColor: `${color}55`, backgroundColor: `${color}0D` }}
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-white"
          style={{ backgroundColor: color }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>
      <p className="mt-2 text-[12px] leading-relaxed text-foreground">
        {description}
      </p>
    </div>
  );
}

function InfraStat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-lg bg-surface p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted">
        {label}
      </div>
      <div className="text-lg font-bold text-foreground">{value}</div>
      <div className="mt-1 text-[11px] text-muted">{note}</div>
    </div>
  );
}

