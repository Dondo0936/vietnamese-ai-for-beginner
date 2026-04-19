"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 *  THIÊN KIẾN & CÔNG BẰNG TRONG AI — Phiên bản dành cho nhân viên văn phòng
 *  ─────────────────────────────────────────────────────────────────────────
 *  Rewrite bởi Opus 4.7. Đối tượng: HR, quản lý, tuyển dụng, bất cứ ai
 *  phải sống chung với các quyết định do AI đưa ra. Không công thức, không
 *  code — chỉ có sơ đồ, thanh phần trăm và tương tác trực tiếp.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { motion } from "framer-motion";
import {
  AlertTriangle,
  Scale,
  Users,
  FileText,
  ShieldCheck,
  MapPin,
  Eye,
  EyeOff,
  TrendingDown,
} from "lucide-react";

import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  Callout,
  CollapsibleDetail,
  MiniSummary,
  LessonSection,
  SliderGroup,
  ToggleCompare,
  DragDrop,
  MatchPairs,
} from "@/components/interactive";

import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

/* ═══════════════════════════════════════════════════════════════════════════
 *  METADATA
 * ═══════════════════════════════════════════════════════════════════════════ */
export const metadata: TopicMeta = {
  slug: "bias-fairness",
  title: "Bias & Fairness",
  titleVi: "Thiên kiến & Công bằng trong AI",
  description:
    "Nhận diện cách AI học lại định kiến từ dữ liệu quá khứ, và các cách kiểm soát thiên kiến phù hợp với môi trường văn phòng Việt Nam.",
  category: "ai-safety",
  tags: ["bias", "fairness", "ethics", "hr", "office"],
  difficulty: "beginner",
  relatedSlugs: ["alignment", "explainability", "ai-governance"],
  vizType: "interactive",
};

/* ═══════════════════════════════════════════════════════════════════════════
 *  DEMO 1 — BIAS SIMULATOR
 *  Người học kéo 2 thanh: (1) % nữ trong dữ liệu lịch sử, (2) thiên lệch
 *  điểm số của mô hình đối với nhóm thiểu số. Widget vẽ lại tỷ lệ tuyển dụng
 *  dự đoán cho từng giới tính.
 * ═══════════════════════════════════════════════════════════════════════════ */
function BiasSimulator() {
  return (
    <SliderGroup
      title="Mô phỏng AI tuyển dụng học từ dữ liệu lịch sử"
      sliders={[
        {
          key: "pctFemale",
          label: "Tỷ lệ nữ trong dữ liệu tuyển 10 năm qua",
          min: 5,
          max: 50,
          step: 1,
          defaultValue: 22,
          unit: "%",
        },
        {
          key: "modelSkew",
          label: "Mức thiên lệch mà mô hình tự học",
          min: 0,
          max: 40,
          step: 1,
          defaultValue: 18,
          unit: "%",
        },
      ]}
      visualization={(v) => {
        const pctFemale = v.pctFemale;
        const modelSkew = v.modelSkew;
        /* Mô phỏng: mô hình càng nhìn thấy ít nữ, càng trừ điểm nữ.
           Hire rate giả định base 40%, bị điều chỉnh theo thiên lệch. */
        const baseRate = 40;
        const penaltyFemale = Math.round((50 - pctFemale) * 0.4 + modelSkew * 0.8);
        const hireFemale = Math.max(5, baseRate - penaltyFemale);
        const hireMale = Math.min(90, baseRate + Math.round(modelSkew * 0.6));
        const gap = hireMale - hireFemale;
        return (
          <div className="w-full space-y-4 py-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted uppercase tracking-wide">
              <TrendingDown className="h-4 w-4 text-accent" />
              Tỷ lệ được AI đề xuất tuyển (dự đoán)
            </div>

            <BiasBar
              label="Ứng viên nam"
              value={hireMale}
              color="#3b82f6"
              icon="M"
            />
            <BiasBar
              label="Ứng viên nữ"
              value={hireFemale}
              color="#f59e0b"
              icon="F"
            />

            <motion.div
              className={`rounded-lg border p-3 text-sm text-center ${
                gap > 25
                  ? "border-red-400 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200 dark:border-red-700"
                  : gap > 10
                    ? "border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-700"
                    : "border-emerald-400 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-700"
              }`}
              animate={{ scale: [1, 1.02, 1] }}
              key={gap}
              transition={{ duration: 0.25 }}
            >
              <div className="font-semibold">
                Chênh lệch: {gap} điểm phần trăm
              </div>
              <div className="text-xs mt-1">
                {gap > 25
                  ? "Rủi ro cao — AI đang phân biệt rõ rệt"
                  : gap > 10
                    ? "Cần audit — thiên kiến đã hiện lên"
                    : "Gần công bằng"}
              </div>
            </motion.div>
          </div>
        );
      }}
    />
  );
}

function BiasBar({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-foreground">
        <span className="flex items-center gap-2">
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ background: color }}
          >
            {icon}
          </span>
          {label}
        </span>
        <span className="font-mono font-semibold" style={{ color }}>
          {value}%
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-surface">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  DEMO 2 — PROTECTED-ATTRIBUTE LEAKAGE
 *  So sánh hai mô hình: bỏ cột "Giới tính" vs bỏ cả "Giới tính" lẫn "Tên"
 *  + "Trường học". Giải thích trực quan: AI vẫn "đoán" được giới tính
 *  qua các trường còn lại.
 * ═══════════════════════════════════════════════════════════════════════════ */
function LeakageRow({
  label,
  example,
  leaks,
}: {
  label: string;
  example: string;
  leaks: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-3 ${
        leaks
          ? "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20"
          : "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20"
      }`}
    >
      {leaks ? (
        <Eye className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
      ) : (
        <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-sm font-semibold text-foreground">{label}</span>
          <span
            className={`text-[11px] font-mono ${
              leaks
                ? "text-red-700 dark:text-red-300"
                : "text-emerald-700 dark:text-emerald-300"
            }`}
          >
            {leaks ? "RÒ RỈ" : "AN TOÀN"}
          </span>
        </div>
        <div className="text-xs text-muted italic">&ldquo;{example}&rdquo;</div>
      </div>
    </div>
  );
}

function LeakageDemo() {
  return (
    <ToggleCompare
      labelA="Chỉ bỏ cột Giới tính"
      labelB="Bỏ Giới tính + Tên + Trường"
      description="Kéo thử giữa hai cách làm sạch dữ liệu. Chú ý cột nào vẫn còn 'ro rỉ' thông tin nhạy cảm."
      childA={
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-surface px-3 py-2">
            <span className="text-xs font-semibold text-muted uppercase">
              Độ chính xác mô hình
            </span>
            <span className="font-mono text-sm font-bold text-foreground">
              87%
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border-2 border-red-300 bg-red-50 px-3 py-2 dark:border-red-700 dark:bg-red-900/20">
            <span className="text-xs font-semibold text-red-700 dark:text-red-300 uppercase">
              Chênh lệch nam - nữ
            </span>
            <span className="font-mono text-sm font-bold text-red-700 dark:text-red-300">
              28 điểm %
            </span>
          </div>
          <div className="space-y-2">
            <LeakageRow
              label="Tên ứng viên"
              example="Nguyễn Thị Mai — đoán 92% là nữ"
              leaks
            />
            <LeakageRow
              label="Trường học"
              example='"Đại học Phụ nữ" — đoán 99% là nữ'
              leaks
            />
            <LeakageRow
              label="Công việc cũ"
              example='"Nội trợ trước 2018" — đoán 96% là nữ'
              leaks
            />
          </div>
          <Callout variant="warning" title="Kết quả">
            Mô hình vẫn biết giới tính qua đường vòng. Chênh lệch tuyển dụng
            gần như không giảm dù đã bỏ cột Giới tính.
          </Callout>
        </div>
      }
      childB={
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-surface px-3 py-2">
            <span className="text-xs font-semibold text-muted uppercase">
              Độ chính xác mô hình
            </span>
            <span className="font-mono text-sm font-bold text-foreground">
              82%
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border-2 border-emerald-300 bg-emerald-50 px-3 py-2 dark:border-emerald-700 dark:bg-emerald-900/20">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase">
              Chênh lệch nam - nữ
            </span>
            <span className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-300">
              6 điểm %
            </span>
          </div>
          <div className="space-y-2">
            <LeakageRow
              label="Tên ứng viên"
              example="Đã mã hoá thành ID ẩn"
              leaks={false}
            />
            <LeakageRow
              label="Trường học"
              example='Nhóm thành "Top 100 / Top 500 / Khác"'
              leaks={false}
            />
            <LeakageRow
              label="Công việc cũ"
              example='Chuẩn hoá thành "3 năm kinh nghiệm ngành X"'
              leaks={false}
            />
          </div>
          <Callout variant="tip" title="Trade-off">
            Đổi 5% độ chính xác để giảm chênh lệch từ 28% xuống còn 6%.
            Trong hầu hết pháp lý lao động, đây là lựa chọn bắt buộc.
          </Callout>
        </div>
      }
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  DEMO 3 — TYPE SORTER (DragDrop)
 *  Người học kéo 8 ví dụ thực tế vào 4 loại thiên kiến.
 * ═══════════════════════════════════════════════════════════════════════════ */
const BIAS_ITEMS = [
  {
    id: "sampling-1",
    label:
      "Mô hình chấm điểm tín dụng chỉ train trên khách hàng Hà Nội và TP.HCM",
  },
  {
    id: "sampling-2",
    label: "Chatbot AI được dạy từ toàn bộ câu hỏi của sinh viên Bách Khoa",
  },
  {
    id: "historical-1",
    label:
      "AI duyệt vay học tập học rằng nữ ít có khả năng trả nợ vì 10 năm trước phụ nữ ít người đi làm",
  },
  {
    id: "historical-2",
    label:
      "AI sàng lọc CV ưu tiên ứng viên từng là 'đội trưởng' — từ khoá ít xuất hiện trong CV nữ",
  },
  {
    id: "measurement-1",
    label:
      "Hệ thống chấm điểm hiệu suất dùng 'số giờ online Teams' để đo năng suất",
  },
  {
    id: "measurement-2",
    label:
      "AI y tế dự đoán bệnh tim chỉ dùng triệu chứng phổ biến ở nam, bỏ sót triệu chứng ở nữ",
  },
  {
    id: "deployment-1",
    label:
      "Công cụ dịch tiếng Anh cho phòng marketing lại được dùng luôn cho hợp đồng pháp lý",
  },
  {
    id: "deployment-2",
    label:
      "AI nhận diện khuôn mặt train ở Mỹ được lắp vào cửa văn phòng tại Việt Nam, sai nhiều hơn với người bản địa",
  },
] as const;

function TypeSorterDemo() {
  return (
    <DragDrop
      instruction="Kéo từng ví dụ vào đúng loại thiên kiến. Một mục chỉ thuộc một loại."
      items={[...BIAS_ITEMS]}
      zones={[
        {
          id: "sampling",
          label: "Sampling bias (mẫu lệch)",
          accepts: ["sampling-1", "sampling-2"],
        },
        {
          id: "historical",
          label: "Historical bias (lịch sử)",
          accepts: ["historical-1", "historical-2"],
        },
        {
          id: "measurement",
          label: "Measurement bias (đo sai)",
          accepts: ["measurement-1", "measurement-2"],
        },
        {
          id: "deployment",
          label: "Deployment bias (lạm dụng ngữ cảnh)",
          accepts: ["deployment-1", "deployment-2"],
        },
      ]}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  FAIRNESS METRIC VISUAL — 3 tiêu chí công bằng dưới dạng bar chart
 *  KHÔNG công thức, chỉ có thanh phần trăm + mô tả tiếng Việt.
 * ═══════════════════════════════════════════════════════════════════════════ */
function FairnessMetricCard({
  title,
  tagline,
  metaphor,
  barsA,
  barsB,
  verdict,
  verdictTone,
}: {
  title: string;
  tagline: string;
  metaphor: string;
  barsA: { label: string; pct: number }[];
  barsB: { label: string; pct: number }[];
  verdict: string;
  verdictTone: "good" | "warn";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-accent" />
          <h4 className="text-base font-bold text-foreground">{title}</h4>
        </div>
        <p className="text-xs text-muted mt-1">{tagline}</p>
      </div>

      <div className="rounded-lg bg-accent-light/60 p-3 text-sm text-foreground italic border-l-2 border-accent">
        {metaphor}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <div className="text-xs font-semibold text-blue-600">Nhóm A (đa số)</div>
          {barsA.map((b) => (
            <MiniFairnessBar key={b.label} {...b} color="#3b82f6" />
          ))}
        </div>
        <div className="space-y-2">
          <div className="text-xs font-semibold text-amber-600">Nhóm B (thiểu số)</div>
          {barsB.map((b) => (
            <MiniFairnessBar key={b.label} {...b} color="#f59e0b" />
          ))}
        </div>
      </div>

      <div
        className={`rounded-lg border p-3 text-xs leading-relaxed ${
          verdictTone === "good"
            ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-100"
            : "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-100"
        }`}
      >
        {verdict}
      </div>
    </div>
  );
}

function MiniFairnessBar({
  label,
  pct,
  color,
}: {
  label: string;
  pct: number;
  color: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] text-foreground">
        <span>{label}</span>
        <span className="font-mono font-semibold" style={{ color }}>
          {pct}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  4 BIAS TYPE CARDS — dùng trong ExplanationSection
 * ═══════════════════════════════════════════════════════════════════════════ */
function BiasTypeCard({
  icon: Icon,
  nameVi,
  nameEn,
  what,
  example,
  tone,
}: {
  icon: React.ElementType;
  nameVi: string;
  nameEn: string;
  what: string;
  example: string;
  tone: "blue" | "amber" | "purple" | "rose";
}) {
  const palettes: Record<string, { border: string; bg: string; icon: string; title: string }> = {
    blue: {
      border: "border-blue-300 dark:border-blue-700",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      icon: "text-blue-600 dark:text-blue-400",
      title: "text-blue-800 dark:text-blue-200",
    },
    amber: {
      border: "border-amber-300 dark:border-amber-700",
      bg: "bg-amber-50 dark:bg-amber-900/20",
      icon: "text-amber-600 dark:text-amber-400",
      title: "text-amber-800 dark:text-amber-200",
    },
    purple: {
      border: "border-purple-300 dark:border-purple-700",
      bg: "bg-purple-50 dark:bg-purple-900/20",
      icon: "text-purple-600 dark:text-purple-400",
      title: "text-purple-800 dark:text-purple-200",
    },
    rose: {
      border: "border-rose-300 dark:border-rose-700",
      bg: "bg-rose-50 dark:bg-rose-900/20",
      icon: "text-rose-600 dark:text-rose-400",
      title: "text-rose-800 dark:text-rose-200",
    },
  };
  const p = palettes[tone];
  return (
    <div className={`rounded-xl border-2 ${p.border} ${p.bg} p-4 space-y-2`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${p.icon}`} />
        <div>
          <div className={`text-sm font-bold ${p.title}`}>{nameVi}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted font-mono">
            {nameEn}
          </div>
        </div>
      </div>
      <p className="text-xs text-foreground leading-relaxed">
        <strong>Bản chất:</strong> {what}
      </p>
      <p className="text-xs text-muted leading-relaxed italic">
        Ví dụ: {example}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  LEGAL PANEL — Bối cảnh pháp lý Việt Nam
 * ═══════════════════════════════════════════════════════════════════════════ */
function LegalPanel() {
  const laws = [
    {
      name: "Nghị định 13/2023/NĐ-CP",
      scope: "Bảo vệ dữ liệu cá nhân",
      points: [
        "Dữ liệu cá nhân nhạy cảm (giới tính, tôn giáo, sức khoẻ, dân tộc) phải có sự đồng ý riêng của chủ thể.",
        "Doanh nghiệp phải đánh giá tác động (DPIA) khi xử lý dữ liệu nhạy cảm — áp dụng trực tiếp khi dùng AI sàng lọc hồ sơ.",
        "Quyền yêu cầu giải thích quyết định tự động đã có trong luật Việt Nam.",
      ],
    },
    {
      name: "Luật An ninh mạng 2018",
      scope: "Ràng buộc lưu trữ và minh bạch",
      points: [
        "Dữ liệu người dùng Việt Nam phải lưu trữ tại Việt Nam trong một số trường hợp — ảnh hưởng đến cách chọn nhà cung cấp AI.",
        "Trách nhiệm giải trình thuộc về doanh nghiệp sử dụng, không phải bên bán mô hình.",
      ],
    },
    {
      name: "Bộ luật Lao động 2019",
      scope: "Chống phân biệt trong tuyển dụng",
      points: [
        "Cấm phân biệt đối xử về giới tính, độ tuổi, dân tộc, tôn giáo, hoàn cảnh gia đình (Điều 8).",
        "Nếu AI sàng lọc CV gây phân biệt, doanh nghiệp vẫn chịu trách nhiệm pháp lý như con người làm.",
      ],
    },
  ];
  return (
    <div className="space-y-3">
      {laws.map((law) => (
        <div
          key={law.name}
          className="rounded-lg border border-border bg-surface/40 p-4 space-y-2"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-accent" />
            <div>
              <div className="text-sm font-bold text-foreground">{law.name}</div>
              <div className="text-[11px] text-muted">{law.scope}</div>
            </div>
          </div>
          <ul className="space-y-1 pl-5 text-xs text-foreground leading-relaxed list-disc">
            {law.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  INLINE CHALLENGE — Rủi ro cao nhất
 * ═══════════════════════════════════════════════════════════════════════════ */
const HIGH_RISK_CHALLENGE = {
  question:
    "Trong bốn tình huống văn phòng sau, tình huống nào có RỦI RO PHÁP LÝ VÀ ĐẠO ĐỨC CAO NHẤT khi dùng AI?",
  options: [
    "Dùng AI dịch tiếng Anh nháp email chào hàng",
    "Dùng AI viết caption cho bài đăng mạng xã hội nội bộ",
    "Dùng AI chấm điểm CV và loại tự động trước khi con người xem",
    "Dùng AI tóm tắt biên bản họp tuần",
  ],
  correct: 2,
  explanation:
    "Quyết định tuyển dụng ảnh hưởng trực tiếp đến thu nhập, sự nghiệp và nhân phẩm người khác. Nếu AI trượt ứng viên do thiên kiến (như vụ Amazon), doanh nghiệp vi phạm Điều 8 Bộ luật Lao động 2019 và Nghị định 13/2023 về đánh giá tác động dữ liệu cá nhân. Ba tình huống còn lại ít rủi ro vì có con người kiểm duyệt trước khi gửi ra ngoài.",
} as const;

/* ═══════════════════════════════════════════════════════════════════════════
 *  QUIZ
 * ═══════════════════════════════════════════════════════════════════════════ */
const QUIZ: QuizQuestion[] = [
  {
    question:
      "Vì sao AI có thể mang thiên kiến dù bản thân nó 'không có ý thức'?",
    options: [
      "Vì AI cố tình phân biệt để tiết kiệm tài nguyên tính toán",
      "Vì AI học từ dữ liệu quá khứ — nếu quá khứ bất bình đẳng, mô hình sẽ tái tạo lại sự bất bình đẳng đó ở quy mô công nghiệp",
      "Vì AI ở Việt Nam chưa được cập nhật văn hoá địa phương",
      "Vì AI chỉ làm việc đúng khi có người giám sát liên tục",
    ],
    correct: 1,
    explanation:
      "AI không có ý định — nó chỉ tối ưu theo mẫu trong dữ liệu. Khi dữ liệu lịch sử chứa định kiến (ít hồ sơ nữ thành công, ít khách hàng nông thôn được vay), mô hình xem đó là 'tiêu chuẩn' và tự động tái tạo. Khác với con người, mô hình áp dụng định kiến này cho hàng vạn quyết định mỗi ngày.",
  },
  {
    question:
      "Công ty bạn bỏ cột 'Giới tính' khỏi dữ liệu tuyển dụng để tránh phân biệt. Tuy nhiên chênh lệch tỷ lệ tuyển nam-nữ vẫn cao. Nguyên nhân có khả năng nhất là gì?",
    options: [
      "Do mô hình cần vài tháng để tự 'quên' giới tính",
      "Do thông tin giới tính vẫn rò rỉ qua các trường khác như tên, trường học, nghề cũ (proxy bias)",
      "Do phần cứng máy chủ không đủ mạnh",
      "Do chưa tắt tính năng 'memory' của mô hình",
    ],
    correct: 1,
    explanation:
      "Hiện tượng này gọi là 'proxy bias' hay 'leakage'. Mô hình vẫn đoán được giới tính qua các đặc trưng khác: tên Việt có thể đoán 90%+ giới tính, trường nữ sinh, lịch sử nghề nghiệp. Cách đúng: xử lý cả cụm feature tương quan với thuộc tính nhạy cảm, không chỉ bỏ một cột.",
  },
  {
    question:
      "Phòng nhân sự dùng AI chấm điểm 1-5 cho CV. Nhóm A nhận trung bình 4.2 điểm, nhóm B nhận 2.8 điểm. Trước khi đổ lỗi cho AI, bước đầu tiên cần làm là gì?",
    options: [
      "Ngưng dùng AI, quay lại chấm tay",
      "Audit: kiểm tra dữ liệu huấn luyện có cân bằng không, và thử đánh giá công bằng (fairness audit) theo từng nhóm nhân khẩu học",
      "Tăng trọng số cho nhóm B để 'bù đắp'",
      "Đổi sang nhà cung cấp AI khác",
    ],
    correct: 1,
    explanation:
      "Audit trước, hành động sau. Phải hiểu vì sao có chênh lệch (sampling bias? historical bias? đo sai?) mới biết cách sửa đúng. Tăng trọng số mù quáng có thể tạo ra phân biệt ngược. Bỏ AI không giải quyết gốc rễ — con người cũng có thể có cùng định kiến, chỉ là khó đo hơn.",
  },
  {
    question:
      "Tiêu chí công bằng 'Đồng đều cơ hội' (Equal Opportunity) có ý nghĩa gần nhất với câu nào dưới đây?",
    options: [
      "Mọi nhóm được tuyển tỷ lệ bằng nhau, bất kể năng lực",
      "Trong số những ứng viên THẬT SỰ PHÙ HỢP, tỷ lệ được AI chấp nhận phải bằng nhau giữa các nhóm",
      "Mỗi nhóm phải có đại diện ngang nhau trong dữ liệu huấn luyện",
      "AI phải 'mù' với mọi thông tin nhân khẩu học",
    ],
    correct: 1,
    explanation:
      "Equal Opportunity = tỷ lệ chấp nhận đúng (true positive rate) bằng nhau giữa các nhóm. Nếu một nam và một nữ đều có năng lực tương đương, xác suất được AI chọn phải gần bằng nhau. Đây khác với 'Đồng đều tỷ lệ' (Demographic Parity) đòi tỷ lệ tổng bằng nhau bất kể năng lực.",
  },
  {
    type: "fill-blank",
    question:
      "Thiên kiến trong AI thường bắt nguồn từ {blank} không cân bằng, sau đó mô hình khuếch đại và gây ra {blank} với các nhóm yếu thế.",
    blanks: [
      {
        answer: "dữ liệu huấn luyện",
        accept: ["training data", "dữ liệu", "dữ liệu training", "data"],
      },
      {
        answer: "phân biệt đối xử",
        accept: ["discrimination", "phân biệt", "bất công"],
      },
    ],
    explanation:
      "Chuỗi nhân quả chuẩn: dữ liệu huấn luyện phản ánh định kiến xã hội → mô hình học định kiến đó → triển khai ở quy mô → phân biệt đối xử có hệ thống. Mọi nỗ lực giảm thiên kiến hiệu quả đều bắt đầu từ audit dữ liệu, không phải 'sửa mô hình' sau cùng.",
  },
  {
    question:
      "Theo Nghị định 13/2023/NĐ-CP của Việt Nam, đâu là nghĩa vụ CỐT LÕI của doanh nghiệp khi xử lý dữ liệu cá nhân nhạy cảm bằng AI?",
    options: [
      "Chỉ cần thông báo cho người lao động sau khi đã xử lý xong",
      "Có sự đồng ý rõ ràng của chủ thể dữ liệu VÀ thực hiện đánh giá tác động (DPIA) trước khi triển khai",
      "Thuê công ty nước ngoài làm giúp để tránh trách nhiệm",
      "Chỉ áp dụng khi công ty có trên 1000 nhân viên",
    ],
    correct: 1,
    explanation:
      "Nghị định 13/2023 yêu cầu sự đồng ý riêng cho dữ liệu nhạy cảm (giới tính, tôn giáo, sức khoẻ, sinh trắc) và đánh giá tác động trước khi xử lý. Áp dụng cho mọi doanh nghiệp hoạt động tại Việt Nam hoặc xử lý dữ liệu công dân Việt Nam, không phụ thuộc quy mô. Dùng vendor nước ngoài không miễn trừ trách nhiệm.",
  },
  {
    question:
      "Bạn là trưởng phòng HR tại một ngân hàng Việt Nam. Đội IT đề xuất dùng AI chấm điểm tín dụng. Đề xuất nào dưới đây là TỐI THIỂU cần có để an toàn?",
    options: [
      "Chọn vendor nổi tiếng, tin tưởng họ đã test bias",
      "Chạy thử trên 100 khách, nếu không ai phàn nàn thì triển khai",
      "Audit trên dữ liệu Việt Nam thật (không chỉ demo), đo chênh lệch theo giới/vùng miền/độ tuổi, có kênh khiếu nại và quy trình con người phúc tra",
      "Dùng AI trước, nếu có vấn đề thì sửa sau",
    ],
    correct: 2,
    explanation:
      "Ba yếu tố bắt buộc: (1) audit trên dữ liệu thực tế Việt Nam — demo vendor có thể không đại diện; (2) đo chênh lệch theo các nhóm nhạy cảm — không đo thì không biết; (3) có human-in-the-loop và kênh khiếu nại — bảo vệ khi AI sai. Thiếu một trong ba, rủi ro pháp lý và thương hiệu rất cao.",
  },
  {
    question:
      "Vì sao không thể đồng thời đạt tất cả các tiêu chí công bằng (đồng đều tỷ lệ, đồng đều cơ hội, đồng đều TPR+FPR)?",
    options: [
      "Vì chưa có thuật toán đủ mạnh để giải cùng lúc",
      "Vì khi tỷ lệ phù hợp thực sự khác nhau giữa các nhóm, các tiêu chí này mâu thuẫn nhau — đây là 'định lý bất khả thi', không phải vấn đề kỹ thuật",
      "Vì các thư viện AI tại Việt Nam chưa hỗ trợ",
      "Vì phải chọn theo tôn giáo của chủ doanh nghiệp",
    ],
    correct: 1,
    explanation:
      "Đây là định lý bất khả thi về công bằng (Chouldechova 2017, Kleinberg 2016): khi tỷ lệ nền thực sự khác nhau giữa các nhóm, không thể đồng thời thoả các tiêu chí. Tổ chức BUỘC phải chọn tiêu chí ưu tiên dựa trên đạo đức và pháp luật. Không có công thức 'công bằng tuyệt đối' — chỉ có lựa chọn được chứng minh rõ ràng.",
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
 *  MAIN COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════ */
export default function BiasFairnessTopic() {
  return (
    <>
      {/* ── BƯỚC 1: PREDICTION GATE ─────────────────────────────────────── */}
      <PredictionGate
        question="Một mô hình AI dự đoán khả năng trả nợ được train trên dữ liệu 10 năm qua của ngân hàng. Theo bạn, ai sẽ bị đánh giá thấp nhất?"
        options={[
          "Người trẻ mới đi làm",
          "Phụ nữ làm nội trợ trước đây",
          "Người ở nông thôn",
          "Tất cả các nhóm trên",
        ]}
        correct={3}
        explanation="Đáp án đúng là 'tất cả'. 10 năm dữ liệu ngân hàng thường thiếu hồ sơ của cả ba nhóm này — ít người trẻ có lịch sử tín dụng dài, ít phụ nữ có nguồn thu nhập trực tiếp trong hồ sơ, ít người nông thôn dùng dịch vụ ngân hàng. AI học rằng 'thiếu dữ liệu = rủi ro cao', và tự động hạ điểm cả ba. Bài học hôm nay sẽ cho bạn thấy hiện tượng này bằng sơ đồ tương tác."
      >
        <p className="text-sm text-muted mt-2">
          Thiên kiến trong AI không phải là &ldquo;lỗi kỹ thuật hiếm gặp&rdquo; &mdash;
          nó là hệ quả tất yếu khi máy học từ một quá khứ không hoàn hảo.
        </p>
      </PredictionGate>

      {/* ── BƯỚC 2: ẨN DỤ ───────────────────────────────────────────────── */}
      <LessonSection label="Gương chiếu quá khứ" step={1}>
        <div className="space-y-4">
          <p className="text-foreground leading-relaxed">
            Hãy hình dung AI như một tấm <strong>gương chiếu</strong>. Nó không
            tự tạo ra ai, không tự có ý kiến &mdash; nó chỉ phản chiếu lại những
            gì đã xảy ra trong dữ liệu 10 năm qua của công ty bạn.
          </p>
          <p className="text-foreground leading-relaxed">
            Nếu 10 năm qua ngân hàng ít duyệt vay cho phụ nữ làm nội trợ, tấm
            gương sẽ nói: &ldquo;nội trợ = rủi ro cao&rdquo;. Nếu công ty công
            nghệ ít tuyển người trên 40 tuổi, tấm gương sẽ nói: &ldquo;40+ = ít
            phù hợp&rdquo;. Không phải vì tấm gương ác ý &mdash; mà vì đó là
            tất cả những gì nó từng thấy.
          </p>
          <Callout variant="insight" title="Khác biệt lớn nhất giữa AI và con người">
            Một nhân viên HR có định kiến có thể sàng 20 CV mỗi ngày. Một mô
            hình AI có định kiến sàng 20.000 CV mỗi ngày &mdash; cùng một định
            kiến, <strong>áp dụng ở tầm công nghiệp</strong>, và không ai kịp
            kiểm tra từng quyết định.
          </Callout>
        </div>
      </LessonSection>

      {/* ── BƯỚC 3: VISUALIZATION ───────────────────────────────────────── */}
      <VisualizationSection topicSlug={metadata.slug}>
        <LessonSection label="Demo 1 — Kéo thanh để xem thiên kiến hình thành" step={2}>
          <div className="space-y-3">
            <p className="text-sm text-muted">
              Kéo thử thanh &ldquo;tỷ lệ nữ trong dữ liệu&rdquo; xuống thấp,
              rồi tăng &ldquo;mức thiên lệch của mô hình&rdquo;. Quan sát hai
              thanh ngang thay đổi.
            </p>
            <BiasSimulator />
          </div>
        </LessonSection>

        <LessonSection label="Demo 2 — Xoá cột Giới tính là chưa đủ" step={3}>
          <div className="space-y-3">
            <p className="text-sm text-muted">
              Nhiều công ty tin rằng bỏ cột giới tính khỏi dữ liệu là đủ. Thực
              tế, thông tin giới tính rò rỉ qua tên, trường học, nghề cũ. Chuyển
              qua lại giữa hai cách làm sạch dữ liệu để so sánh.
            </p>
            <LeakageDemo />
          </div>
        </LessonSection>

        <LessonSection label="Demo 3 — Phân loại 8 ví dụ thực tế" step={4}>
          <div className="space-y-3">
            <p className="text-sm text-muted">
              Kéo từng ví dụ dưới đây vào đúng loại thiên kiến. Đây là 8 tình
              huống có thật trong môi trường văn phòng Việt Nam.
            </p>
            <TypeSorterDemo />
          </div>
        </LessonSection>
      </VisualizationSection>

      {/* ── BƯỚC 4: AHA MOMENT ──────────────────────────────────────────── */}
      <AhaMoment>
        Xoá cột <strong>&ldquo;giới tính&rdquo;</strong> khỏi dữ liệu không
        làm cho AI công bằng hơn &mdash; mà chỉ làm cho sự thiên kiến{" "}
        <strong>khó phát hiện hơn</strong>. Tên, trường học, địa chỉ, nghề cũ
        đều có thể rò rỉ cùng một thông tin. Công bằng thật sự đòi hỏi{" "}
        <strong>đo đạc kết quả</strong>, không phải giả vờ không nhìn thấy.
      </AhaMoment>

      {/* ── BƯỚC 5: INLINE CHALLENGE ────────────────────────────────────── */}
      <InlineChallenge
        question={HIGH_RISK_CHALLENGE.question}
        options={[...HIGH_RISK_CHALLENGE.options]}
        correct={HIGH_RISK_CHALLENGE.correct}
        explanation={HIGH_RISK_CHALLENGE.explanation}
      />

      {/* ── BƯỚC 6: EXPLANATION SECTION ─────────────────────────────────── */}
      <ExplanationSection topicSlug={metadata.slug}>
        <LessonSection label="Bốn loại thiên kiến bạn sẽ gặp trong văn phòng" step={5}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <BiasTypeCard
              icon={Users}
              nameVi="Thiên kiến lấy mẫu"
              nameEn="Sampling bias"
              what="Dữ liệu huấn luyện không đại diện cho toàn bộ dân số thật. AI chỉ 'biết' những nhóm nó từng thấy."
              example="Mô hình tuyển dụng train 90% từ ứng viên Hà Nội & TP.HCM, đoán sai với miền Trung."
              tone="blue"
            />
            <BiasTypeCard
              icon={FileText}
              nameVi="Thiên kiến lịch sử"
              nameEn="Historical bias"
              what="Dữ liệu chính xác, nhưng phản ánh một xã hội bất bình đẳng. AI tái tạo quá khứ đó."
              example="Ngân hàng 10 năm qua duyệt vay ít cho phụ nữ — AI học rằng 'phụ nữ = rủi ro'."
              tone="amber"
            />
            <BiasTypeCard
              icon={AlertTriangle}
              nameVi="Thiên kiến đo lường"
              nameEn="Measurement bias"
              what="Cách đo 'kết quả' sai lệch giữa các nhóm. Thước đo không phải là sự thật."
              example='Đánh giá năng suất bằng "giờ online" — bất lợi cho ai làm việc hiệu quả nhưng ngắn thời gian.'
              tone="purple"
            />
            <BiasTypeCard
              icon={MapPin}
              nameVi="Thiên kiến triển khai"
              nameEn="Deployment bias"
              what="AI dùng đúng ở ngữ cảnh này lại sai ở ngữ cảnh khác. Train một nơi, dùng một nẻo."
              example="Nhận diện khuôn mặt train ở Mỹ, lắp ở Việt Nam sai nhiều hơn với người bản địa."
              tone="rose"
            />
          </div>
        </LessonSection>

        <LessonSection label="Ba cách đo công bằng — minh hoạ bằng thanh phần trăm" step={6}>
          <div className="space-y-2">
            <p className="text-sm text-muted">
              Không có một định nghĩa &ldquo;công bằng&rdquo; duy nhất. Có ba
              cách đo phổ biến, mỗi cách trả lời một câu hỏi khác nhau. Dưới
              đây là cách chúng hoạt động trên cùng một mô hình tuyển dụng.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 mt-4">
            <FairnessMetricCard
              title="Đồng đều tỷ lệ (Demographic Parity)"
              tagline="Tỷ lệ được chọn bằng nhau, bất kể năng lực"
              metaphor="Câu hỏi: 'Bạn có nhận đủ nam và nữ vào công ty không?' — chỉ nhìn số lượng tổng."
              barsA={[{ label: "Tỷ lệ tuyển", pct: 62 }]}
              barsB={[{ label: "Tỷ lệ tuyển", pct: 61 }]}
              verdict="Đạt: hai cột gần bằng nhau. Nhưng không đảm bảo AI chọn đúng người — có thể đang tuyển đủ số lượng nhưng sai chất lượng để 'bù đắp'."
              verdictTone="good"
            />
            <FairnessMetricCard
              title="Đồng đều cơ hội (Equal Opportunity)"
              tagline="Trong số người THẬT SỰ phù hợp, tỷ lệ được AI chọn bằng nhau"
              metaphor="Câu hỏi: 'Trong số ứng viên xứng đáng, bao nhiêu % được AI chấp nhận?' — chỉ đo trên nhóm có năng lực."
              barsA={[
                { label: "Người xứng đáng được chọn", pct: 85 },
                { label: "Tỷ lệ tổng", pct: 62 },
              ]}
              barsB={[
                { label: "Người xứng đáng được chọn", pct: 84 },
                { label: "Tỷ lệ tổng", pct: 41 },
              ]}
              verdict="Đạt: 85% và 84% gần bằng nhau ở thanh trên. Tỷ lệ tổng chênh vì nhóm B ít người xứng đáng — không phải bất công từ AI."
              verdictTone="good"
            />
            <FairnessMetricCard
              title="Đồng đều sai sót (Equalized Odds)"
              tagline="Cả tỷ lệ chọn đúng và chọn sai phải bằng nhau"
              metaphor="Câu hỏi kép: 'AI có ưu ái một nhóm theo hai hướng — chọn nhiều hơn cả người xứng đáng LẪN người không xứng đáng?'"
              barsA={[
                { label: "Chọn đúng (TPR)", pct: 85 },
                { label: "Chọn sai (FPR)", pct: 28 },
              ]}
              barsB={[
                { label: "Chọn đúng (TPR)", pct: 70 },
                { label: "Chọn sai (FPR)", pct: 12 },
              ]}
              verdict="Chưa đạt: nhóm A cao hơn ở cả hai thanh — AI đang 'dễ tính' với A và 'khó tính' với B. Đây là tiêu chí nghiêm ngặt nhất."
              verdictTone="warn"
            />
          </div>
        </LessonSection>

        <LessonSection label="Bộ công cụ giảm thiên kiến" step={7}>
          <p className="text-sm text-muted mb-3">
            Nối từng kỹ thuật với tình huống phù hợp. Mỗi kỹ thuật giải quyết
            một lớp vấn đề khác nhau &mdash; không có viên đạn bạc.
          </p>
          <MatchPairs
            instruction="Bấm vào một ô Cột A, rồi bấm vào ô Cột B tương ứng."
            pairs={[
              {
                left: "Cân bằng dữ liệu (data balancing)",
                right:
                  "Khi phát hiện một nhóm có quá ít mẫu trong dữ liệu huấn luyện",
              },
              {
                left: "Xoá thuộc tính nhạy cảm + cụm proxy",
                right:
                  "Khi cần triển khai nhanh và chấp nhận giảm chút độ chính xác",
              },
              {
                left: "Ngưỡng riêng theo nhóm (group-specific threshold)",
                right:
                  "Khi điểm số mô hình giữa hai nhóm lệch một cách hệ thống",
              },
              {
                left: "Human-in-the-loop cho quyết định quan trọng",
                right:
                  "Khi hậu quả sai lệch là mất việc, mất khoản vay, mất cơ hội",
              },
              {
                left: "Đánh giá tác động dữ liệu (DPIA)",
                right:
                  "Khi xử lý dữ liệu cá nhân nhạy cảm theo Nghị định 13/2023",
              },
            ]}
          />
        </LessonSection>

        <LessonSection label="Quy tắc vàng cho văn phòng Việt" step={8}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Callout variant="tip" title="Luôn audit trước triển khai">
              Đo chênh lệch kết quả theo giới tính, độ tuổi, vùng miền trên dữ
              liệu Việt Nam thật &mdash; không chỉ demo của vendor.
            </Callout>
            <Callout variant="insight" title="Không bao giờ để AI tự quyết một mình">
              Với quyết định ảnh hưởng đến sinh kế (tuyển dụng, sa thải, lương,
              cho vay), AI chỉ được ĐỀ XUẤT. Con người ký duyệt và giải thích.
            </Callout>
            <Callout variant="warning" title="Có kênh khiếu nại">
              Người bị ảnh hưởng phải có quyền hỏi: &ldquo;Vì sao tôi bị từ
              chối?&rdquo; và được con người phúc tra trong thời gian hợp lý.
            </Callout>
          </div>
        </LessonSection>

        <CollapsibleDetail title="Bối cảnh pháp lý Việt Nam — những gì doanh nghiệp BẮT BUỘC phải biết">
          <div className="pt-3">
            <LegalPanel />
          </div>
        </CollapsibleDetail>

        <Callout variant="warning" title="Định lý bất khả thi">
          <p>
            Một sự thật toán học khó chịu: <strong>không thể đồng thời đạt cả
            ba tiêu chí công bằng</strong> (đồng đều tỷ lệ, đồng đều cơ hội,
            đồng đều sai sót) khi tỷ lệ nền của các nhóm khác nhau. Tổ chức
            BUỘC phải <em>chọn</em> tiêu chí ưu tiên và ghi lại lý do &mdash;
            đây là trách nhiệm đạo đức, không phải bài toán kỹ thuật.
          </p>
        </Callout>
      </ExplanationSection>

      {/* ── BƯỚC 7: MINI SUMMARY ────────────────────────────────────────── */}
      <MiniSummary
        title="5 điều nhân viên văn phòng cần nhớ về thiên kiến AI"
        points={[
          "AI là tấm gương chiếu quá khứ — quá khứ bất bình đẳng thì AI cũng bất bình đẳng, chỉ có điều ở tầm công nghiệp.",
          "Bỏ cột 'giới tính' không làm AI công bằng — tên, trường, nghề cũ vẫn rò rỉ thông tin. Phải đo kết quả, không che dữ liệu.",
          "Bốn loại thiên kiến: lấy mẫu (sampling), lịch sử (historical), đo lường (measurement), triển khai (deployment). Mỗi loại có cách xử lý riêng.",
          "Ba cách đo công bằng trả lời ba câu hỏi khác nhau — không thể đạt tất cả cùng lúc, phải chọn và ghi lại lý do.",
          "Ở Việt Nam: Nghị định 13/2023, Luật An ninh mạng, Điều 8 Bộ luật Lao động đều áp dụng cho quyết định do AI đưa ra. Trách nhiệm cuối cùng vẫn thuộc về doanh nghiệp.",
        ]}
      />

      {/* ── BƯỚC 8: QUIZ ────────────────────────────────────────────────── */}
      <QuizSection questions={QUIZ} />
    </>
  );
}
