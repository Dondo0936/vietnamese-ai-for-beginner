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
  slug: "feature-engineering",
  title: "Feature Engineering",
  titleVi: "Kỹ thuật đặc trưng — Nghệ thuật chọn nguyên liệu",
  description:
    "Quá trình tạo, chọn lọc và biến đổi các đặc trưng đầu vào để mô hình máy học dễ học và dự đoán chính xác hơn.",
  category: "foundations",
  tags: ["features", "engineering", "transformation", "selection"],
  difficulty: "beginner",
  relatedSlugs: ["data-preprocessing", "dimensionality-curse", "train-val-test"],
  vizType: "interactive",
};

const TOTAL_STEPS = 7;

// ---------------------------------------------------------------------------
// Feature transformation playground types
// ---------------------------------------------------------------------------

type CellValue = string | number | boolean;

interface Column {
  key: string;
  label: string;
  kind: "raw" | "derived";
  transform?: TransformId;
  width?: string;
}

interface Row {
  id: string;
  cells: Record<string, CellValue>;
}

type TransformId =
  | "extract-hour"
  | "log-transform"
  | "one-hot"
  | "tf-idf";

interface TransformSpec {
  id: TransformId;
  label: string;
  description: string;
  accuracyGain: number; // percentage points
  icon: string;
  appliesTo: string; // source column key
  addedColumns: Column[];
}

// ---------------------------------------------------------------------------
// Seed data — 3 rows, 4 raw features (date, price, address, category)
// ---------------------------------------------------------------------------

const RAW_COLUMNS: Column[] = [
  { key: "date", label: "date", kind: "raw", width: "w-36" },
  { key: "price", label: "price (VND)", kind: "raw", width: "w-32" },
  { key: "address", label: "address", kind: "raw", width: "w-56" },
  { key: "category", label: "category", kind: "raw", width: "w-28" },
];

const RAW_ROWS: Row[] = [
  {
    id: "r1",
    cells: {
      date: "2024-11-03 08:15:00",
      price: 125000,
      address: "42 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội",
      category: "food",
    },
  },
  {
    id: "r2",
    cells: {
      date: "2024-11-04 19:42:00",
      price: 8500000,
      address: "12 Nguyễn Huệ, Quận 1, TP HCM",
      category: "electronics",
    },
  },
  {
    id: "r3",
    cells: {
      date: "2024-11-05 12:03:00",
      price: 450000,
      address: "7 Trần Phú, Hải Châu, Đà Nẵng",
      category: "food",
    },
  },
];

// Transform specifications
const TRANSFORMS: TransformSpec[] = [
  {
    id: "extract-hour",
    label: "Extract Hour",
    description:
      "Tách giờ, ngày-trong-tuần, is_weekend từ cột date. Giúp model học pattern thời gian (rush hour, cuối tuần).",
    accuracyGain: 4.2,
    icon: "⏱",
    appliesTo: "date",
    addedColumns: [
      { key: "hour", label: "hour", kind: "derived", transform: "extract-hour", width: "w-20" },
      {
        key: "dow",
        label: "day_of_week",
        kind: "derived",
        transform: "extract-hour",
        width: "w-28",
      },
      {
        key: "is_weekend",
        label: "is_weekend",
        kind: "derived",
        transform: "extract-hour",
        width: "w-24",
      },
    ],
  },
  {
    id: "log-transform",
    label: "Log Transform",
    description:
      "log(1 + price) nén phân phối lệch (skewed) về gần Gaussian. Quan trọng cho linear models — tránh outlier kéo hệ số.",
    accuracyGain: 5.8,
    icon: "㏒",
    appliesTo: "price",
    addedColumns: [
      {
        key: "log_price",
        label: "log1p(price)",
        kind: "derived",
        transform: "log-transform",
        width: "w-32",
      },
    ],
  },
  {
    id: "one-hot",
    label: "One-Hot Encode",
    description:
      "Biến category (chuỗi) thành nhiều cột nhị phân 0/1 — model tuyến tính không hiểu chữ, chỉ hiểu số.",
    accuracyGain: 6.5,
    icon: "#",
    appliesTo: "category",
    addedColumns: [
      {
        key: "cat_food",
        label: "cat_food",
        kind: "derived",
        transform: "one-hot",
        width: "w-24",
      },
      {
        key: "cat_electronics",
        label: "cat_electronics",
        kind: "derived",
        transform: "one-hot",
        width: "w-28",
      },
    ],
  },
  {
    id: "tf-idf",
    label: "TF-IDF",
    description:
      "Vector hoá text address: mỗi từ quan trọng thành feature. TF-IDF cân nhắc tần suất địa phương và toàn cục.",
    accuracyGain: 7.1,
    icon: "📝",
    appliesTo: "address",
    addedColumns: [
      {
        key: "tfidf_city",
        label: "tfidf[city]",
        kind: "derived",
        transform: "tf-idf",
        width: "w-28",
      },
      {
        key: "tfidf_district",
        label: "tfidf[district]",
        kind: "derived",
        transform: "tf-idf",
        width: "w-32",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Deterministic transform implementations
// ---------------------------------------------------------------------------

function parseDate(s: string): Date {
  return new Date(s.replace(" ", "T"));
}

const DOW_VI = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function applyExtractHour(row: Row): Record<string, CellValue> {
  const d = parseDate(String(row.cells.date));
  const hour = d.getHours();
  const dow = d.getDay();
  const isWeekend = dow === 0 || dow === 6;
  return {
    hour,
    dow: DOW_VI[dow],
    is_weekend: isWeekend,
  };
}

function applyLogTransform(row: Row): Record<string, CellValue> {
  const price = Number(row.cells.price);
  return {
    log_price: Number(Math.log1p(price).toFixed(3)),
  };
}

function applyOneHot(row: Row): Record<string, CellValue> {
  const cat = String(row.cells.category);
  return {
    cat_food: cat === "food" ? 1 : 0,
    cat_electronics: cat === "electronics" ? 1 : 0,
  };
}

// simple deterministic TF-IDF proxy — for demo only
function applyTfIdf(row: Row): Record<string, CellValue> {
  const addr = String(row.cells.address).toLowerCase();
  const cityTokens = ["hà nội", "hcm", "đà nẵng"];
  const districtTokens = [
    "hoàn kiếm",
    "quận 1",
    "hải châu",
    "cầu giấy",
    "ba đình",
  ];
  const tfidfCity =
    cityTokens.find((t) => addr.includes(t)) !== undefined ? 0.72 : 0;
  const tfidfDistrict =
    districtTokens.find((t) => addr.includes(t)) !== undefined ? 0.58 : 0;
  return {
    tfidf_city: Number(tfidfCity.toFixed(2)),
    tfidf_district: Number(tfidfDistrict.toFixed(2)),
  };
}

function applyTransform(
  rows: Row[],
  transformId: TransformId,
): Row[] {
  const fn = {
    "extract-hour": applyExtractHour,
    "log-transform": applyLogTransform,
    "one-hot": applyOneHot,
    "tf-idf": applyTfIdf,
  }[transformId];
  return rows.map((r) => ({
    ...r,
    cells: { ...r.cells, ...fn(r) },
  }));
}

function formatCell(v: CellValue | undefined): string {
  if (v === undefined) return "—";
  if (typeof v === "boolean") return v ? "✓" : "✗";
  if (typeof v === "number") {
    if (Math.abs(v) >= 10000) return v.toLocaleString("vi-VN");
    return String(v);
  }
  return v;
}

// ---------------------------------------------------------------------------
// Playground component
// ---------------------------------------------------------------------------

const BASE_ACCURACY = 58.4; // percent

function FeaturePlayground() {
  const [applied, setApplied] = useState<TransformId[]>([]);

  const columns = useMemo<Column[]>(() => {
    const extra: Column[] = [];
    for (const tid of applied) {
      const spec = TRANSFORMS.find((t) => t.id === tid);
      if (spec) extra.push(...spec.addedColumns);
    }
    return [...RAW_COLUMNS, ...extra];
  }, [applied]);

  const rows = useMemo<Row[]>(() => {
    let current = RAW_ROWS;
    for (const tid of applied) {
      current = applyTransform(current, tid);
    }
    return current;
  }, [applied]);

  const currentAccuracy = useMemo(() => {
    const gained = applied.reduce((sum, tid) => {
      const spec = TRANSFORMS.find((t) => t.id === tid);
      return sum + (spec?.accuracyGain ?? 0);
    }, 0);
    return Math.min(BASE_ACCURACY + gained, 99);
  }, [applied]);

  const previousAccuracy = useMemo(() => {
    if (applied.length === 0) return BASE_ACCURACY;
    const last = applied[applied.length - 1];
    const spec = TRANSFORMS.find((t) => t.id === last);
    return currentAccuracy - (spec?.accuracyGain ?? 0);
  }, [applied, currentAccuracy]);

  const toggleTransform = useCallback((tid: TransformId) => {
    setApplied((prev) => {
      if (prev.includes(tid)) return prev.filter((x) => x !== tid);
      return [...prev, tid];
    });
  }, []);

  const resetAll = useCallback(() => setApplied([]), []);

  const lastAddedKeys = useMemo<Set<string>>(() => {
    if (applied.length === 0) return new Set();
    const last = applied[applied.length - 1];
    const spec = TRANSFORMS.find((t) => t.id === last);
    return new Set((spec?.addedColumns ?? []).map((c) => c.key));
  }, [applied]);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-foreground">
          Sân chơi biến đổi feature
        </h3>
        <p className="text-xs text-tertiary mt-1">
          Bảng bắt đầu với 4 feature thô. Bấm một biến đổi để thêm cột mới —
          xem accuracy thay đổi trước / sau mỗi bước.
        </p>
      </div>

      {/* Transform buttons */}
      <div className="flex flex-wrap gap-2">
        {TRANSFORMS.map((t) => {
          const active = applied.includes(t.id);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => toggleTransform(t.id)}
              className={`group px-3 py-2 rounded-md border text-xs font-medium transition-colors flex items-center gap-2 ${
                active
                  ? "border-accent/60 bg-accent/10 text-accent"
                  : "border-border bg-surface text-muted hover:text-foreground hover:border-accent/40"
              }`}
            >
              <span className="text-sm" aria-hidden>
                {t.icon}
              </span>
              <span>{t.label}</span>
              <span className="text-[10px] opacity-70">
                +{t.accuracyGain.toFixed(1)}%
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={resetAll}
          disabled={applied.length === 0}
          className="ml-auto px-3 py-2 rounded-md border border-border text-xs text-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Accuracy meter */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
              Model accuracy (Logistic Regression, k-fold CV)
            </div>
            <div className="text-xs text-tertiary mt-1">
              Baseline (4 feature thô) → sau mỗi transform được apply
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-foreground">
              {currentAccuracy.toFixed(1)}%
            </div>
            <div className="text-[11px] text-green-600 dark:text-green-400">
              {applied.length > 0 && (
                <>
                  Δ +{(currentAccuracy - previousAccuracy).toFixed(1)}% từ bước
                  trước
                </>
              )}
              {applied.length === 0 && <>Baseline</>}
            </div>
          </div>
        </div>
        <div className="h-3 rounded-full bg-surface border border-border overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-400 to-green-500"
            initial={false}
            animate={{ width: `${currentAccuracy}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
          {TRANSFORMS.map((t) => {
            const active = applied.includes(t.id);
            return (
              <div
                key={t.id}
                className={`rounded-md border px-2 py-1 ${
                  active
                    ? "border-green-400/60 bg-green-500/10 text-green-700 dark:text-green-300"
                    : "border-border bg-surface text-muted"
                }`}
              >
                {t.icon} {t.label}: {active ? `+${t.accuracyGain.toFixed(1)}%` : "—"}
              </div>
            );
          })}
        </div>
      </div>

      {/* Data table */}
      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-border bg-surface">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`text-left px-3 py-2 font-semibold whitespace-nowrap ${
                    c.kind === "derived"
                      ? "text-accent"
                      : "text-foreground"
                  } ${c.width ?? ""}`}
                >
                  <div className="flex items-center gap-1">
                    {c.label}
                    {c.kind === "derived" && (
                      <span className="text-[9px] uppercase tracking-wider opacity-60">
                        derived
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border last:border-0"
              >
                {columns.map((c) => {
                  const highlighted = lastAddedKeys.has(c.key);
                  return (
                    <td
                      key={c.key}
                      className={`px-3 py-2 font-mono whitespace-nowrap ${
                        highlighted
                          ? "bg-accent/10 text-accent"
                          : c.kind === "derived"
                            ? "text-foreground"
                            : "text-muted"
                      }`}
                    >
                      {formatCell(row.cells[c.key])}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Active transform explanation */}
      {applied.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="rounded-lg border border-accent/30 bg-accent/5 p-4 space-y-2"
        >
          <div className="text-[11px] font-semibold uppercase tracking-wider text-accent">
            Đang áp dụng ({applied.length})
          </div>
          <ul className="space-y-2">
            {applied.map((tid, idx) => {
              const spec = TRANSFORMS.find((t) => t.id === tid);
              if (!spec) return null;
              return (
                <li
                  key={tid}
                  className="flex items-start gap-3 text-xs text-foreground"
                >
                  <span className="text-muted font-mono">{idx + 1}.</span>
                  <div>
                    <span className="font-semibold">
                      {spec.icon} {spec.label}
                    </span>
                    <span className="text-muted"> — áp lên cột </span>
                    <code className="text-accent">{spec.appliesTo}</code>
                    <p className="text-tertiary mt-0.5">{spec.description}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </motion.div>
      )}

      {/* Baseline vs current */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-md border border-border bg-surface p-3">
          <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
            Trước feature engineering
          </div>
          <div className="mt-1 text-lg font-bold text-foreground">
            {BASE_ACCURACY.toFixed(1)}%
          </div>
          <p className="text-[11px] text-tertiary">
            Model xử lý 4 feature thô. Ngày/địa chỉ/danh mục là chuỗi → model
            tuyến tính không hiểu.
          </p>
        </div>
        <div className="rounded-md border border-green-400/40 bg-green-500/5 p-3">
          <div className="text-[11px] font-semibold text-green-700 dark:text-green-300 uppercase tracking-wider">
            Sau {applied.length} transform
          </div>
          <div className="mt-1 text-lg font-bold text-green-700 dark:text-green-300">
            {currentAccuracy.toFixed(1)}%
          </div>
          <p className="text-[11px] text-tertiary">
            Mỗi transform biến feature thô thành tín hiệu số model có thể học.
            Gain cộng dồn gần như tuyến tính khi feature độc lập.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quiz questions (8)
// ---------------------------------------------------------------------------

const quizQuestions: QuizQuestion[] = [
  {
    question: "Tại sao feature engineering quan trọng hơn chọn algorithm?",
    options: [
      "Không đúng — algorithm quan trọng hơn",
      "Features tốt giúp MODEL ĐƠN GIẢN cũng dự đoán tốt. Features tệ thì model phức tạp cũng không cứu được",
      "Feature engineering nhanh hơn training",
    ],
    correct: 1,
    explanation:
      "'Garbage features in, garbage predictions out.' Linear regression với features tốt thường thắng deep learning với features tệ. Andrew Ng: '80% thời gian ML là feature engineering.' Features là NGUYÊN LIỆU — nguyên liệu tươi thì món ăn ngon, dù bếp giỏi nào.",
  },
  {
    question: "Dự đoán giá nhà tại Hà Nội. Feature 'số nhà' (ví dụ: 42) có hữu ích không?",
    options: [
      "Có — số nhà ảnh hưởng giá",
      "KHÔNG — số nhà là ID, không có quan hệ với giá. Thêm feature noise → model overfit",
      "Tuỳ thuộc model",
    ],
    correct: 1,
    explanation:
      "Số nhà là identifier, không phải feature có ý nghĩa. Nhà số 42 không đắt hơn nhà số 41. Thêm features vô nghĩa → model học noise → overfit. Features tốt: diện tích, số phòng, khoảng cách Metro, quận/huyện. Chọn features = loại bỏ nhiễu!",
  },
  {
    question:
      "Feature 'ngày sinh' của user có giúp dự đoán sở thích âm nhạc không? Nên xử lý thế nào?",
    options: [
      "Dùng trực tiếp ngày sinh làm feature",
      "Tạo features mới: tuổi (2025 - năm_sinh), thế_hệ (Gen Z/Millennial/Gen X), tháng_sinh (zodiac effect)",
      "Bỏ đi vì ngày sinh không liên quan",
    ],
    correct: 1,
    explanation:
      "Ngày sinh raw không hữu ích (30/05/1995 ≠ pattern). Nhưng FEATURES ĐƯỢC TẠO TỪ ngày sinh rất hữu ích: tuổi (30) → Gen Z, thế_hệ → correlated với sở thích nhạc. Đây là core của feature engineering: biến đổi raw data thành features có ý nghĩa!",
  },
  {
    question:
      "Vì sao log-transform lên 'price' giúp linear model tốt lên dù giữ nguyên thông tin?",
    options: [
      "Vì log làm dữ liệu nhỏ hơn",
      "Vì price thường lệch phải (long tail): log nén outlier, giúp phân phối gần Gaussian — linear model giả định vậy",
      "Vì log nhanh hơn tính toán",
    ],
    correct: 1,
    explanation:
      "Nhiều biến tài chính/giá cả có phân phối log-normal. Log-transform đưa về gần Gaussian → MSE/MAE hoạt động đúng kỳ vọng, outlier không kéo hệ số. Tree-based model ít cần hơn vì chia khoảng bằng threshold.",
  },
  {
    question:
      "One-hot encoding cho category có 1000 giá trị (ví dụ 1000 quận/huyện) có vấn đề gì?",
    options: [
      "Không sao, cứ thêm 1000 cột",
      "Tạo ma trận rất thưa, tăng chiều đột ngột → curse of dimensionality; nên dùng target encoding hoặc embedding",
      "Sai kỹ thuật",
    ],
    correct: 1,
    explanation:
      "1000 cột 0/1 cho mỗi row → memory + thời gian train tăng, model có thể overfit vì cột nào cũng rare. Giải pháp: target encoding (thay category bằng mean(target)) hoặc entity embedding (học vector dày).",
  },
  {
    question: "TF-IDF khác gì với đếm từ (count vectorizer)?",
    options: [
      "TF-IDF chỉ dùng cho tiếng Anh",
      "TF-IDF nhân term frequency với inverse document frequency — phạt từ xuất hiện ở QUÁ nhiều document (the, a) và thưởng từ đặc trưng",
      "Không có khác biệt",
    ],
    correct: 1,
    explanation:
      "Count vectorizer: 'the' xuất hiện 50 lần → feature mạnh nhưng vô nghĩa. TF-IDF: IDF(the) ≈ 0 nên tf * idf ≈ 0. Từ đặc trưng (tên riêng, thuật ngữ) có IDF cao → giữ trọng số.",
  },
  {
    question: "Interaction feature (diện_tích × số_tầng) có ích khi nào?",
    options: [
      "Luôn luôn có ích",
      "Khi mô hình KHÔNG tự học được tương tác giữa hai feature (linear model); tree-based thường tự phát hiện",
      "Chỉ cho deep learning",
    ],
    correct: 1,
    explanation:
      "Linear model giả định additive: y = w1*x1 + w2*x2. Không tự học x1*x2. Thêm interaction feature cho phép linear học 'nhà 2 tầng, diện tích lớn' như một tín hiệu mới. Tree-based, neural net tự học interaction.",
  },
  {
    type: "fill-blank",
    question:
      "Interaction feature kết hợp hai features để tạo thông tin mới. Ví dụ: diện_tích × số_tầng tạo ra feature '{blank}' thể hiện tổng diện tích sử dụng của ngôi nhà.",
    blanks: [
      {
        answer: "tổng_diện_tích_sàn",
        accept: [
          "tổng diện tích sàn",
          "total_floor_area",
          "diện tích sàn",
          "floor_area",
        ],
      },
    ],
    explanation:
      "Interaction features (đặc trưng tương tác) kết hợp hai hoặc nhiều features thô để tạo ra đặc trưng mới có ý nghĩa mà model khó tự học. diện_tích × số_tầng = tổng_diện_tích_sàn, một chỉ số phản ánh tốt hơn quy mô thực tế của bất động sản.",
  },
];


// ---------------------------------------------------------------------------
// Topic component
// ---------------------------------------------------------------------------

export default function FeatureEngineeringTopic() {
  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn dự đoán giá nhà ở Hà Nội. Data có: diện tích, số phòng, năm xây, địa chỉ text ('42 Lý Thường Kiệt, Hoàn Kiếm'). Model accuracy chỉ 60%. Thiếu gì?"
          options={[
            "Cần model phức tạp hơn (deep learning)",
            "Cần feature engineering: từ địa chỉ text → extract quận/huyện, khoảng cách trung tâm, gần Metro? → accuracy tăng 85%+",
            "Cần nhiều data hơn",
          ]}
          correct={1}
          explanation="Địa chỉ text '42 Lý Thường Kiệt' model không hiểu. Feature engineering: extract 'Hoàn Kiếm' (quận), tính khoảng cách Hồ Gươm (2km), gần Metro (500m), mặt phố (có). Features này CÓ Ý NGHĨA → model hiểu 'nhà ở trung tâm, gần Metro = đắt'. Accuracy tăng 25%+!"
        />
      </LessonSection>

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <FeaturePlayground />
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Feature Engineering giống{" "}
            <strong>chọn nguyên liệu nấu ăn</strong>. Nguyên liệu tươi, chất
            lượng → món ăn ngon dù bếp bình thường. Nguyên liệu tệ → món ăn tệ
            dù bếp giỏi.{" "}
            <strong>80% thời gian ML là feature engineering</strong> — không
            phải training model! Features tốt cũng giúp tránh{" "}
            <TopicLink slug="overfitting-underfitting">overfitting</TopicLink>{" "}
            bằng cách loại bỏ noise.
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Dự đoán khách hàng Shopee có mua hàng trong 7 ngày tới không. Feature nào HỮU ÍCH NHẤT?"
          options={[
            "User ID (mã khách hàng)",
            "số_ngày_từ_lần_mua_cuối, tần_suất_mua_30_ngày, giá_trung_bình_đơn, số_sản_phẩm_trong_giỏ",
            "màu_avatar (màu hình đại diện)",
          ]}
          correct={1}
          explanation="User ID là identifier (không có pattern). Màu avatar không liên quan. Nhưng: số_ngày_từ_lần_mua_cuối (recency), tần_suất_mua (frequency), giá_trung_bình (monetary) = RFM features — kinh điển trong e-commerce. số_sản_phẩm_trong_giỏ = intent signal mạnh!"
        />

        <InlineChallenge
          question="Bạn có 50.000 sản phẩm với mô tả text. Feature nào giúp model phân loại danh mục tốt nhất?"
          options={[
            "Độ dài mô tả (số ký tự)",
            "TF-IDF trên n-grams (1-2) của mô tả sau khi loại stopwords và lowercase",
            "ID sản phẩm hash MD5",
          ]}
          correct={1}
          explanation="Độ dài mô tả yếu — sản phẩm điện tử có thể có mô tả dài bằng thực phẩm. Hash ID là noise. TF-IDF trên n-grams bắt được 'laptop 14 inch', 'áo thun nam' — những cụm đặc trưng cho category. Đây là baseline mạnh trước khi dùng embedding."
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Feature Engineering</strong> là quá trình biến đổi raw data
            thành features có ý nghĩa giúp model học hiệu quả hơn. Thường được
            thực hiện sau bước{" "}
            <TopicLink slug="data-preprocessing">
              tiền xử lý dữ liệu
            </TopicLink>{" "}
            và trước khi đưa vào model. Features tốt giúp cân bằng{" "}
            <TopicLink slug="bias-variance">
              bias-variance tradeoff
            </TopicLink>{" "}
            — không quá đơn giản (high bias) cũng không quá phức tạp (high
            variance).
          </p>
          <p>
            <strong>5 kỹ thuật chính:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              <strong>Tạo feature mới:</strong> ngày_sinh → tuổi, thế_hệ.
              địa_chỉ → quận, khoảng_cách
            </li>
            <li>
              <strong>Encoding:</strong> Categorical → one-hot, target
              encoding. Text → TF-IDF, embeddings
            </li>
            <li>
              <strong>Scaling:</strong> StandardScaler (mean=0, std=1),
              MinMaxScaler (0-1)
            </li>
            <li>
              <strong>Feature selection:</strong> Loại features vô nghĩa,
              giảm chiều, giảm overfitting
            </li>
            <li>
              <strong>Interaction features:</strong> diện_tích x số_tầng =
              tổng_diện_tích_sàn
            </li>
          </ul>

          <LaTeX block>
            {
              "\\text{StandardScaler: } x' = \\frac{x - \\mu}{\\sigma} \\quad \\text{MinMax: } x' = \\frac{x - x_{\\min}}{x_{\\max} - x_{\\min}}"
            }
          </LaTeX>

          <p>
            Một cách đo <strong>tầm quan trọng feature</strong> có nền tảng toán
            học là <em>Shapley value</em> mượn từ lý thuyết trò chơi. Với tập
            feature N và hàm dự đoán f, đóng góp của feature i cho một dự đoán
            cụ thể là:
          </p>
          <LaTeX block>
            {
              "\\phi_i = \\sum_{S \\subseteq N \\setminus \\{i\\}} \\frac{|S|!\\,(|N|-|S|-1)!}{|N|!} \\left[f(S \\cup \\{i\\}) - f(S)\\right]"
            }
          </LaTeX>
          <p className="text-sm text-muted">
            Công thức này là cơ sở của <strong>SHAP</strong> — công cụ tiêu
            chuẩn để đánh giá "feature vừa tạo có đóng góp thật không". Khi làm
            feature engineering, bạn có thể kiểm thử: sau mỗi bước thêm
            feature mới, đo mean(|SHAP|) để biết feature đó được model dùng bao
            nhiêu. Nếu mean(|SHAP|) ≈ 0 → feature đó là dư thừa, nên cân nhắc
            bỏ.
          </p>

          <p className="mt-3">
            <strong>Target encoding (mean encoding).</strong> Thay category
            bằng E[y | X=x], tức là giá trị trung bình target cho mỗi category.
            Cần smoothing để tránh overfit với category hiếm:
          </p>
          <LaTeX block>
            {
              "\\hat{y}_{\\text{te}}(x) = \\frac{n_x \\cdot \\bar{y}_x + m \\cdot \\bar{y}}{n_x + m}"
            }
          </LaTeX>
          <p className="text-sm text-muted">
            Trong đó n_x là số lần category xuất hiện, ȳ_x là mean target của
            category đó, ȳ là mean toàn bộ, và m là "sức mạnh prior" (thường
            10-30). Càng ít dữ liệu → encoding càng gần mean toàn bộ → chống
            leak. Kết hợp với K-fold: fit encoder trên các fold khác, transform
            trên fold hiện tại.
          </p>

          <p className="mt-3">
            <strong>Weight of Evidence (WoE) và Information Value (IV).</strong>{" "}
            Tiêu chuẩn trong credit scoring. Với binary target (good/bad) và
            mỗi bin:
          </p>
          <LaTeX block>
            {
              "\\text{WoE}_{i} = \\ln \\frac{P(\\text{good} \\mid \\text{bin}_i)}{P(\\text{bad} \\mid \\text{bin}_i)} \\quad\\quad \\text{IV} = \\sum_i (P_{g,i} - P_{b,i}) \\cdot \\text{WoE}_i"
            }
          </LaTeX>
          <p className="text-sm text-muted">
            WoE monotonic với log-odds → tương thích tuyệt vời với logistic
            regression. IV cho biết "sức mạnh phân loại" của feature: IV &lt;
            0.02 = bỏ, 0.1–0.3 = vừa, &gt; 0.5 = cực mạnh (cảnh giác leak). Quy
            trình typical: (1) bin feature bằng equal-frequency / decision tree
            / custom business rules, (2) tính WoE cho mỗi bin, (3) thay giá trị
            gốc bằng WoE, (4) dùng logistic regression.
          </p>

          <p className="mt-3">
            <strong>Polynomial features.</strong> Với linear/logistic khi quan
            hệ phi tuyến nhẹ:
          </p>
          <LaTeX block>
            {
              "\\phi_2(x_1, x_2) = (1,\\, x_1,\\, x_2,\\, x_1^2,\\, x_1 x_2,\\, x_2^2)"
            }
          </LaTeX>
          <p className="text-sm text-muted">
            Sinh bởi <code>PolynomialFeatures(degree=2)</code> trong sklearn.
            Cẩn thận: số feature tăng O(p^d) — với 20 feature và degree 3 đã
            có hơn 1700 cột. Luôn kết hợp với Ridge/Lasso, chuẩn hoá trước
            polynomial để ổn định số học, và xem xét{" "}
            <code>interaction_only=True</code> nếu chỉ cần tương tác chứ không
            cần bậc cao.
          </p>

          <Callout variant="tip" title="Target Encoding">
            Categorical feature có nhiều giá trị (1000 quận/huyện) → one-hot
            tạo 1000 cột (quá nhiều!). Target encoding: thay mỗi category bằng
            mean(target) của category đó. Ví dụ: Hoàn Kiếm → mean(giá) = 8.5
            tỷ. Giảm chiều + giữ thông tin! Kỹ thuật này đặc biệt hữu ích khi
            kết hợp với{" "}
            <TopicLink slug="linear-regression">
              hồi quy tuyến tính
            </TopicLink>{" "}
            — một trong những model được hưởng lợi nhiều nhất từ feature
            engineering tốt.
          </Callout>

          <Callout variant="warning" title="Data leakage khi encoding">
            Target encoding nếu làm trên toàn bộ data TRƯỚC khi split sẽ leak
            target vào train set của các fold khác. Luôn fit encoder trên
            train fold, transform trên val/test — giống như scaler.
          </Callout>

          <Callout variant="info" title="Khi nào bỏ feature engineering?">
            Với text, image, audio + đủ data: end-to-end deep learning
            (transformer, CNN) thường tự học feature tốt hơn manual. Với
            tabular (&lt; 10k rows, mixed types): feature engineering + GBDT
            vẫn vô địch trên Kaggle.
          </Callout>

          <Callout variant="warning" title="Đừng over-engineer">
            Thêm 200 feature &quot;cho chắc&quot; thường hại hơn lợi:
            curse of dimensionality, model khó generalize, pipeline chậm. Bắt
            đầu với 10-20 feature có ý nghĩa, đo impact từng feature.
          </Callout>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <div className="rounded-md border border-border bg-surface p-3">
              <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                Numeric features
              </div>
              <ul className="list-disc list-inside text-xs space-y-1 text-foreground mt-1">
                <li>Scaling (Standard, MinMax, Robust)</li>
                <li>Log / Box-Cox cho skewed distribution</li>
                <li>Binning (age → age_group)</li>
                <li>Polynomial / interaction terms</li>
              </ul>
            </div>
            <div className="rounded-md border border-border bg-surface p-3">
              <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                Categorical features
              </div>
              <ul className="list-disc list-inside text-xs space-y-1 text-foreground mt-1">
                <li>One-hot (low cardinality)</li>
                <li>Target / mean encoding</li>
                <li>Frequency encoding</li>
                <li>Entity embedding (neural net)</li>
              </ul>
            </div>
            <div className="rounded-md border border-border bg-surface p-3">
              <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                Temporal features
              </div>
              <ul className="list-disc list-inside text-xs space-y-1 text-foreground mt-1">
                <li>hour, day_of_week, is_weekend</li>
                <li>Seasonality (sin/cos cho periodic)</li>
                <li>Time since last event</li>
                <li>Rolling window aggregates</li>
              </ul>
            </div>
            <div className="rounded-md border border-border bg-surface p-3">
              <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                Text features
              </div>
              <ul className="list-disc list-inside text-xs space-y-1 text-foreground mt-1">
                <li>TF-IDF / Bag-of-words</li>
                <li>N-grams (1-3)</li>
                <li>Sentence embeddings (SBERT)</li>
                <li>Length, sentiment, readability</li>
              </ul>
            </div>
          </div>

          <TabView
            tabs={[
              {
                label: "sklearn pipeline",
                content: (
                  <CodeBlock
                    language="python"
                    title="feature_engineering_pipeline.py"
                  >
                    {`import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

# Raw dataframe
# columns: date (str), price (int), address (str), category (str)
df = pd.read_csv("transactions.csv", parse_dates=["date"])
df["hour"] = df["date"].dt.hour
df["dow"] = df["date"].dt.dayofweek
df["is_weekend"] = df["dow"].isin([5, 6]).astype(int)
df["log_price"] = (df["price"] + 1).apply(lambda x: math.log(x))

numeric = ["log_price", "hour"]
categorical = ["category", "dow"]
text = "address"

preprocess = ColumnTransformer(
    transformers=[
        ("num", StandardScaler(), numeric),
        ("cat", OneHotEncoder(handle_unknown="ignore"), categorical),
        ("txt", TfidfVectorizer(ngram_range=(1, 2), max_features=200), text),
    ],
    remainder="drop",
)

pipe = Pipeline([
    ("features", preprocess),
    ("model", LogisticRegression(max_iter=1000)),
])

pipe.fit(X_train, y_train)
print("Accuracy:", pipe.score(X_test, y_test))`}
                  </CodeBlock>
                ),
              },
              {
                label: "Feature selection",
                content: (
                  <CodeBlock
                    language="python"
                    title="feature_selection.py"
                  >
                    {`from sklearn.feature_selection import (
    SelectKBest, mutual_info_classif, VarianceThreshold,
)
from sklearn.ensemble import RandomForestClassifier

# 1. Loại feature có variance gần 0 (constant-ish)
vt = VarianceThreshold(threshold=0.01)
X_vt = vt.fit_transform(X)

# 2. Giữ top-K theo mutual information với target
skb = SelectKBest(mutual_info_classif, k=50)
X_k = skb.fit_transform(X_vt, y)

# 3. Importance từ model (permutation / gain)
rf = RandomForestClassifier(n_estimators=200, random_state=42)
rf.fit(X_k, y)
importance = pd.Series(rf.feature_importances_, index=feature_names)
importance.sort_values(ascending=False).head(20)

# 4. Kiểm tra correlation > 0.95 và loại bỏ trùng lặp`}
                  </CodeBlock>
                ),
              },
              {
                label: "Log / target encoding",
                content: (
                  <CodeBlock
                    language="python"
                    title="encoding_tricks.py"
                  >
                    {`import numpy as np
from category_encoders import TargetEncoder

# Log transform an toàn (tránh log(0))
df["log_price"] = np.log1p(df["price"])

# Target encoding có smoothing để tránh overfit
te = TargetEncoder(smoothing=10.0)
df["district_te"] = te.fit_transform(df["district"], y_train)

# Frequency encoding — đơn giản, mạnh cho GBDT
freq = df["district"].value_counts(normalize=True)
df["district_freq"] = df["district"].map(freq)

# Interaction: kết hợp hai categorical thành một
df["district_x_type"] = df["district"].astype(str) + "_" + df["type"].astype(str)`}
                  </CodeBlock>
                ),
              },
            ]}
          />

          <CollapsibleDetail title="Deep dive: vì sao tree-based model ít cần scaling">
            <p className="text-sm">
              Decision tree chia node bằng threshold (ví dụ:{" "}
              <code>price &lt; 500000</code>). Kết quả chia không phụ thuộc
              vào scale — chỉ phụ thuộc vào thứ tự. Do đó StandardScaler,
              MinMaxScaler là no-op với tree.
            </p>
            <p className="text-sm">
              Ngược lại linear model và neural net cộng weighted sum of
              features. Nếu một feature có scale 1e6 và feature khác 0-1,
              gradient sẽ bị dominate bởi feature to → training chậm, unstable.
              Scaling là điều kiện tiên quyết.
            </p>
            <p className="text-sm">
              Log-transform vẫn có ích cho tree khi target bị skewed — loss
              MSE/MAE trên log-scale ổn định hơn. Nhưng không bắt buộc cho
              feature input.
            </p>
          </CollapsibleDetail>

          <CodeBlock language="python" title="target_woe_polynomial.py">
            {`# ------------------------------------------------------------------
# Target encoding có K-fold, WoE binning, và Polynomial features
# ------------------------------------------------------------------
import numpy as np, pandas as pd
from sklearn.model_selection import KFold
from sklearn.preprocessing import PolynomialFeatures, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import Ridge, LogisticRegression

# 1) K-fold target encoding cho category cardinality cao ---------------
def kfold_target_encode(df, cat_col, target_col, n_splits=5, m=20):
    """Out-of-fold mean encoding có smoothing để tránh leak."""
    kf = KFold(n_splits=n_splits, shuffle=True, random_state=42)
    global_mean = df[target_col].mean()
    out = np.zeros(len(df))
    for tr_idx, val_idx in kf.split(df):
        tr, val = df.iloc[tr_idx], df.iloc[val_idx]
        stats = tr.groupby(cat_col)[target_col].agg(["mean", "count"])
        stats["smoothed"] = (
            stats["count"] * stats["mean"] + m * global_mean
        ) / (stats["count"] + m)
        out[val_idx] = val[cat_col].map(stats["smoothed"]).fillna(global_mean)
    return out

df["district_te"] = kfold_target_encode(df, "district", "price")

# 2) Weight of Evidence cho credit scoring -----------------------------
def compute_woe(df, feature, target, bins=10):
    df = df.copy()
    df["_bin"] = pd.qcut(df[feature], q=bins, duplicates="drop")
    g = df.groupby("_bin")[target].agg(["count", "sum"])
    g["bad"] = g["sum"]
    g["good"] = g["count"] - g["bad"]
    total_good, total_bad = g["good"].sum(), g["bad"].sum()
    # +0.5 Laplace để tránh log(0)
    g["pg"] = (g["good"] + 0.5) / (total_good + 0.5)
    g["pb"] = (g["bad"] + 0.5) / (total_bad + 0.5)
    g["woe"] = np.log(g["pg"] / g["pb"])
    g["iv"] = (g["pg"] - g["pb"]) * g["woe"]
    return g, g["iv"].sum()

woe_table, iv_value = compute_woe(train_df, "income", "default")
print(f"IV = {iv_value:.3f}  (>0.3 là rất mạnh)")

# Thay giá trị gốc bằng WoE cho từng bin
bin_to_woe = woe_table["woe"].to_dict()
df["income_woe"] = pd.qcut(
    df["income"], q=10, duplicates="drop"
).map(bin_to_woe)

# 3) Polynomial features — dùng với Ridge để tránh bùng nổ collinearity
poly_pipe = Pipeline([
    ("scale", StandardScaler()),
    ("poly", PolynomialFeatures(degree=2, interaction_only=False,
                                 include_bias=False)),
    ("ridge", Ridge(alpha=1.0)),
])
poly_pipe.fit(X_train[["sqft", "age", "location"]], y_train)
print("R²:", poly_pipe.score(X_test[["sqft", "age", "location"]], y_test))`}
          </CodeBlock>

          <CodeBlock language="python" title="featuretools_deep_fe.py">
            {`# ------------------------------------------------------------------
# Featuretools: Deep Feature Synthesis — tự động sinh feature từ schema
# ------------------------------------------------------------------
import featuretools as ft

# Giả sử có 3 bảng: customers, orders, order_items (quan hệ 1-n-n)
es = ft.EntitySet(id="ecommerce")
es = es.add_dataframe(dataframe_name="customers",
                      dataframe=customers, index="customer_id")
es = es.add_dataframe(dataframe_name="orders",
                      dataframe=orders, index="order_id",
                      time_index="order_date")
es = es.add_dataframe(dataframe_name="items",
                      dataframe=order_items, index="item_id")

es = es.add_relationship("customers", "customer_id",
                         "orders", "customer_id")
es = es.add_relationship("orders", "order_id",
                         "items", "order_id")

# DFS tự sinh aggregation (SUM, MEAN, COUNT) và transform (DAY, MONTH)
feature_matrix, feature_defs = ft.dfs(
    entityset=es,
    target_dataframe_name="customers",
    agg_primitives=["sum", "mean", "count", "std", "max", "min"],
    trans_primitives=["day", "month", "weekday", "time_since_previous"],
    max_depth=2,
    cutoff_time=pd.Timestamp("2025-01-01"),  # tránh leak: không dùng data sau mốc
)
print(f"Sinh ra {feature_matrix.shape[1]} features tự động.")
print(feature_defs[:10])   # in 10 feature đầu để kiểm tra

# Lưu ý: max_depth=2 nghĩa là cho phép chain 2 cấp aggregation.
# Deep FE có thể tạo hàng trăm feature — nên kết hợp với feature selection
# (mutual information, permutation importance) để lọc xuống ~30 feature
# mạnh nhất trước khi feed vào model.

# Có thể kết hợp với sklearn pipeline:
from sklearn.feature_selection import SelectKBest, mutual_info_classif
from lightgbm import LGBMClassifier

pipeline = Pipeline([
    ("select", SelectKBest(mutual_info_classif, k=30)),
    ("model", LGBMClassifier(n_estimators=500, learning_rate=0.05)),
])
pipeline.fit(feature_matrix, y)`}
          </CodeBlock>

          <CollapsibleDetail title="Feature store: quản lý features trong production">
            <p className="text-sm">
              Khi pipeline ML lên production, cùng một feature có thể cần ở 2
              nơi: (1) offline training (batch, Spark/SQL), (2) online serving
              (low latency, key-value store). Feature store (Feast, Tecton,
              SageMaker) giải quyết:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>
                <strong>Nhất quán định nghĩa:</strong> feature được định nghĩa
                một lần, dùng cả offline và online.
              </li>
              <li>
                <strong>Point-in-time correctness:</strong> tránh data leakage
                khi tạo training set từ history.
              </li>
              <li>
                <strong>Chia sẻ giữa team:</strong> team A tạo feature, team B
                consume — không phải viết lại.
              </li>
              <li>
                <strong>Monitoring drift:</strong> phân phối feature theo thời
                gian — alert khi lệch train.
              </li>
            </ul>
            <p className="text-sm">
              Với project nhỏ, feature store là overkill. Bắt đầu bằng
              pipeline sklearn đóng gói bằng pickle. Lên feature store khi có
              &gt; 5 pipeline chia sẻ feature.
            </p>
          </CollapsibleDetail>

          <p className="mt-4">
            <strong>Tín hiệu feature tốt:</strong>
          </p>
          <ul className="list-disc list-inside text-sm space-y-1 pl-2">
            <li>Có mối quan hệ rõ ràng với target (qua EDA hoặc mutual info).</li>
            <li>Ổn định giữa train và production (không drift).</li>
            <li>Tính được tại thời điểm dự đoán (không leak future).</li>
            <li>Dễ giải thích — phục vụ debug và audit.</li>
            <li>Không trùng lặp — correlation &lt; 0.95 với feature khác.</li>
          </ul>

          <p className="mt-3">
            <strong>Dấu hiệu feature xấu:</strong> có corr rất cao với target
            (&gt; 0.99 — khả năng leak), NaN rate cao (&gt; 30%), chỉ xuất
            hiện trong train, hoặc phụ thuộc thời gian không kiểm soát (ví dụ
            ID tăng dần).
          </p>

          <CollapsibleDetail title="Time-series feature engineering — lag, rolling, expanding, sinusoidal encoding">
            <div className="space-y-2 text-sm text-foreground/80">
              <p>
                Time-series có luật chơi riêng: mỗi feature dùng tại thời điểm
                t phải CHỈ phụ thuộc vào dữ liệu của {"["}...t-1{"]"}, không
                được nhìn tương lai. Các mẫu feature kinh điển:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Lag features:</strong> <code>y(t-1), y(t-7),
                  y(t-30)</code>. Bắt quán tính ngắn hạn và chu kỳ tuần/tháng.
                </li>
                <li>
                  <strong>Rolling window aggregates:</strong>{" "}
                  <code>rolling_mean_7, rolling_std_14, rolling_max_30</code>.
                  Dùng <code>shift(1)</code> để loại giá trị hiện tại.
                </li>
                <li>
                  <strong>Expanding window:</strong>{" "}
                  <code>expanding_mean</code> từ đầu chuỗi đến t-1 — đo xu
                  hướng dài hạn, không cần tham số window size.
                </li>
                <li>
                  <strong>Sinusoidal encoding</strong> cho thời gian tuần hoàn:
                  thay hour ∈ [0, 23] bằng{" "}
                  <code>(sin(2π·h/24), cos(2π·h/24))</code>. Cần thiết vì
                  23h và 0h "gần nhau" trong thực tế, nhưng xa nhau nếu chỉ
                  encode thành số nguyên.
                </li>
                <li>
                  <strong>Fourier features</strong> cho seasonality nhiều chu
                  kỳ (năm, tuần, ngày) — dùng trong Prophet.
                </li>
                <li>
                  <strong>Event-based:</strong> time since last event, time to
                  next holiday, days_since_signup — mạnh cho churn và
                  conversion models.
                </li>
              </ul>
              <LaTeX block>
                {
                  "\\mathrm{sin}_{h}(t) = \\sin\\!\\left(\\frac{2\\pi \\cdot h(t)}{24}\\right),\\quad \\mathrm{cos}_{h}(t) = \\cos\\!\\left(\\frac{2\\pi \\cdot h(t)}{24}\\right)"
                }
              </LaTeX>
              <p className="text-xs text-muted">
                Lưu ý validation: dùng <code>TimeSeriesSplit</code> của sklearn
                — KHÔNG KFold ngẫu nhiên. Với dữ liệu có gap / hierarchy
                (nhiều chuỗi cùng lúc), có thể cần{" "}
                <code>group_id</code> để tránh leak giữa các chuỗi.
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="Leak gốc thời gian — 5 bẫy kinh điển">
            <div className="space-y-2 text-sm text-foreground/80">
              <ol className="list-decimal pl-5 space-y-1">
                <li>
                  <strong>Target leak qua aggregation:</strong>{" "}
                  <code>mean(target by district)</code> trên toàn bộ data →
                  train fold thấy được target của val fold.
                </li>
                <li>
                  <strong>Future information leak:</strong> tính{" "}
                  <code>rolling_mean_7</code> bao gồm cả t, hoặc dùng
                  aggregate của toàn bộ chuỗi khi training trên t &lt; T.
                </li>
                <li>
                  <strong>Label leak qua chữ ký feature:</strong> feature{" "}
                  "account_status_last_seen" trong fraud detection có thể chứa
                  thông tin hậu khi fraud đã được phát hiện.
                </li>
                <li>
                  <strong>Random split cho time series:</strong> KFold trộn
                  ngẫu nhiên làm train fold có cả quá khứ + tương lai so với
                  val fold.
                </li>
                <li>
                  <strong>Pre-processing leak:</strong> StandardScaler hoặc
                  TargetEncoder fit trên toàn bộ data trước khi split. Phải fit
                  trên train fold, transform trên val/test.
                </li>
              </ol>
              <p className="text-xs text-muted">
                Dấu hiệu leak: accuracy train &gt; 99% và val &gt; 95% nhưng
                production drop về 70%. Luôn chạy 1 baseline đơn giản (model
                đoán mode) — nếu model của bạn chênh quá xa nhưng prod lại
                kém, khả năng leak rất cao.
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="Featuretools vs tsfresh vs manual — chọn khi nào?">
            <div className="space-y-2 text-sm text-foreground/80">
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Featuretools (DFS):</strong> tốt cho dữ liệu quan
                  hệ (nhiều bảng có khoá ngoại). Tự sinh aggregation + transform
                  tuân thủ cutoff time. Ít phù hợp với chuỗi thời gian thuần
                  (1 bảng, 1 chuỗi).
                </li>
                <li>
                  <strong>tsfresh:</strong> chuyên sinh hàng trăm feature
                  thống kê cho chuỗi thời gian (autocorrelation, entropy, FFT,
                  wavelet). Đi kèm hypothesis testing để lọc.
                </li>
                <li>
                  <strong>Manual + domain knowledge:</strong> vẫn thắng khi
                  bạn hiểu business. "Số ngày trước dịp 30/4" hay "lượt xem
                  page sau khi nhận email" không công cụ nào tự sinh được.
                </li>
              </ul>
              <p className="text-xs text-muted">
                Hybrid là con đường thực tế: dùng tool để "brute force" lần 1,
                rồi chọn lọc + thêm feature domain-specific bằng tay. Trên
                Kaggle, winning solutions thường có 60% manual + 40%
                auto-generated.
              </p>
            </div>
          </CollapsibleDetail>

          <div className="rounded-lg border border-border bg-surface p-4 mt-4 space-y-2">
            <div className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Quy trình feature engineering đề xuất
            </div>
            <ol className="list-decimal list-inside text-sm space-y-1 text-muted">
              <li>
                EDA: phân phối, missing, outlier, corr với target cho mỗi
                feature thô.
              </li>
              <li>
                Baseline model với feature thô + encoding tối thiểu. Ghi lại
                metric.
              </li>
              <li>
                Thêm từng nhóm feature (temporal → categorical → text). Đo
                gain mỗi bước.
              </li>
              <li>
                Feature selection: bỏ feature có importance thấp hoặc trùng.
              </li>
              <li>
                Cross-validate kỹ, kiểm tra leakage bằng time-based split nếu
                có yếu tố thời gian.
              </li>
              <li>
                Đóng gói pipeline (sklearn Pipeline, ColumnTransformer) để
                reproducible.
              </li>
            </ol>
          </div>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          points={[
            "Feature engineering biến đổi raw data thành features có ý nghĩa — thường chiếm 80% thời gian ML.",
            "5 kỹ thuật: tạo feature mới, encoding, scaling, selection, interaction features.",
            "Features tốt + model đơn giản > Features tệ + model phức tạp. 'Nguyên liệu quyết định món ăn.'",
            "Loại features vô nghĩa (ID, noise) giảm overfitting; thêm features có ý nghĩa tăng accuracy.",
            "Log-transform cho skewed numeric; one-hot/target encoding cho categorical; TF-IDF/embedding cho text.",
            "Đóng gói bằng sklearn Pipeline/ColumnTransformer để reproducible và tránh data leakage.",
          ]}
        />
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
