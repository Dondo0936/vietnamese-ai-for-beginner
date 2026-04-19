"use client";

import { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database,
  Droplet,
  Filter,
  Sliders,
  Tags,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  LessonSection,
  TopicLink,
  CollapsibleDetail,
  TabView,
  CodeBlock,
  LaTeX,
  StepReveal,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "data-preprocessing",
  title: "Data Preprocessing",
  titleVi: "Tiền xử lý dữ liệu — Làm sạch trước khi học",
  description:
    "80% thời gian của một data scientist là làm sạch dữ liệu. Bài này cho bạn nhìn thấy từng thao tác: điền thiếu, lọc ngoại lai, chuẩn hoá, mã hoá — kèm đoạn pandas ngắn cho từng bước.",
  category: "foundations",
  tags: ["preprocessing", "cleaning", "normalization", "data"],
  difficulty: "beginner",
  relatedSlugs: ["python-for-ml", "feature-engineering", "train-val-test"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

/* ────────────────────────────────────────────────────────────
   DATASET giả lập — 8 hàng căn hộ Hà Nội, có đủ lỗi thường gặp.
   ──────────────────────────────────────────────────────────── */

type Row = {
  id: number;
  tuoi: number | null;
  thu_nhap: number | null;
  quan: string;
  loai: string;
  note?: string;
};

const RAW_ROWS: Row[] = [
  { id: 1, tuoi: 28, thu_nhap: 25, quan: "Hoàn Kiếm", loai: "Chung cư" },
  { id: 2, tuoi: null, thu_nhap: 40, quan: "Ba Đình", loai: "Nhà phố", note: "tuổi thiếu" },
  { id: 3, tuoi: 45, thu_nhap: 9999, quan: "Hoàn Kiếm", loai: "Chung cư", note: "thu nhập = 9999 (ngoại lai)" },
  { id: 4, tuoi: 35, thu_nhap: 60, quan: "Cầu Giấy", loai: "Biệt thự" },
  { id: 5, tuoi: 52, thu_nhap: null, quan: "Ba Đình", loai: "Nhà phố", note: "thu nhập thiếu" },
  { id: 6, tuoi: 33, thu_nhap: 48, quan: "Cầu Giấy", loai: "Chung cư" },
  { id: 7, tuoi: -3, thu_nhap: 30, quan: "Hoàn Kiếm", loai: "Nhà phố", note: "tuổi = -3 (lỗi nhập)" },
  { id: 8, tuoi: 41, thu_nhap: 55, quan: "Ba Đình", loai: "Biệt thự" },
];

const QUAN_LIST = ["Hoàn Kiếm", "Ba Đình", "Cầu Giấy"] as const;
const LOAI_LIST = ["Chung cư", "Nhà phố", "Biệt thự"] as const;

/* Helpers — thống kê đơn giản trên mảng đã lọc null */

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function std(values: number[]): number {
  if (values.length === 0) return 1;
  const m = mean(values);
  const v = values.reduce((s, x) => s + (x - m) ** 2, 0) / values.length;
  return Math.sqrt(v) || 1;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function minMax(values: number[]): [number, number] {
  if (values.length === 0) return [0, 1];
  return [Math.min(...values), Math.max(...values)];
}

/* ────────────────────────────────────────────────────────────
   QUIZ — 5 câu, có cả multiple-choice và fill-blank.
   ──────────────────────────────────────────────────────────── */

const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Cột 'thu_nhập' có một hàng ghi 9999 triệu/tháng (rõ ràng lỗi nhập). Bạn nên xử lý thế nào đầu tiên?",
    options: [
      "Kệ nó — model sẽ tự bỏ qua",
      "Xoá cả cột 'thu_nhập'",
      "Điều tra nguyên nhân, sửa nếu là lỗi nhập hoặc loại ra, dùng median để tóm tắt vì median không bị outlier kéo",
      "Tăng temperature để AI học thêm trường hợp lạ",
    ],
    correct: 2,
    explanation:
      "Outlier kiểu lỗi nhập phải được điều tra và xử lý. Median rất 'lì' trước outlier (giá trị ở giữa, không bị một con 9999 kéo lệch), còn mean thì bị bóp méo ngay lập tức. Luôn điều tra — có outlier thật (CEO thu nhập rất cao) cần giữ lại.",
  },
  {
    question:
      "Cột 'quận' có 3 giá trị: Hoàn Kiếm, Ba Đình, Cầu Giấy (không có thứ tự). Cách encode hợp lý nhất?",
    options: [
      "Gán 0, 1, 2 — đơn giản nhất",
      "One-hot encoding — mỗi quận thành một cột 0/1",
      "Xoá cột vì model không hiểu chữ",
      "Giữ nguyên dạng chuỗi",
    ],
    correct: 1,
    explanation:
      "Các quận không có thứ tự tự nhiên (Hoàn Kiếm không 'lớn hơn' Ba Đình). Nếu gán 0/1/2, model sẽ hiểu nhầm là có thứ bậc. One-hot tạo 3 cột nhị phân, mỗi cột đại diện cho một giá trị — model học đúng bản chất. Với cấp bậc (junior/senior) mới dùng ordinal (số có thứ tự).",
  },
  {
    type: "fill-blank",
    question:
      "Công thức z-score: z = (x − {blank}) / σ. Điền ký hiệu hoặc tên của giá trị trung bình.",
    blanks: [{ answer: "μ", accept: ["mean", "trung bình", "mu", "M"] }],
    explanation:
      "z-score = (x − μ) / σ: trừ trung bình rồi chia độ lệch chuẩn. Sau biến đổi, mỗi đặc trưng có μ = 0 và σ = 1 — gradient descent và KNN không còn bị một đặc trưng 'to' lấn át các đặc trưng nhỏ.",
  },
  {
    question:
      "Cột 'điện_thoại_phụ' có 35% giá trị bị thiếu. Phương án hợp lý nhất?",
    options: [
      "Mean imputation cho mọi trường hợp",
      "Drop cả cột luôn — quá nhiều thiếu",
      "Điều tra tại sao thiếu. Nếu 'thiếu' mang thông tin (khách không có) → tạo cột chỉ báo is_missing=1, có thể drop cột gốc. Nếu thiếu ngẫu nhiên và cần cột này → dùng mô hình imputer hoặc drop cột",
      "Điền bằng giá trị 0 cho chắc",
    ],
    correct: 2,
    explanation:
      "35% missing là ngưỡng cần cân nhắc. 'Thiếu' đôi khi mang nhiều thông tin hơn giá trị thật — ví dụ khách hàng không có điện thoại phụ. Hãy tạo cờ is_missing trước, rồi tuỳ tình huống mới drop. Điền 0 cho dữ liệu số rất nguy hiểm — 0 có nghĩa là giá trị thật, không phải 'không biết'.",
  },
  {
    question:
      "Bạn fit StandardScaler trên toàn bộ dữ liệu (gồm cả tập test) rồi mới chia train/test. Hậu quả?",
    options: [
      "Tốt hơn — scaler thấy toàn bộ phân phối",
      "Không ảnh hưởng gì",
      "Data leakage — thông tin của tập test rò rỉ vào scaler, khiến độ chính xác báo cáo cao giả tạo",
      "Chỉ sai khi dùng deep learning",
    ],
    correct: 2,
    explanation:
      "Lỗi kinh điển. Đúng quy trình: chia train/val/test TRƯỚC, sau đó fit scaler chỉ trên train, rồi gọi transform cho val và test. Nếu fit trên toàn bộ, mean và std của tập test đã 'chui' vào bước biến đổi của tập train — kết quả báo cáo đẹp nhưng khi deploy gặp dữ liệu mới sẽ sụp đổ.",
  },
  {
    question:
      "Tree-based model (Random Forest, XGBoost) có cần scale đặc trưng không?",
    options: [
      "Có — mọi model đều cần scale",
      "Không — cây chỉ so sánh theo ngưỡng (x < t), scale không đổi thứ tự các điểm nên split giữ nguyên",
      "Chỉ cần khi có missing values",
      "Chỉ cần khi có one-hot",
    ],
    correct: 1,
    explanation:
      "Cây quyết định split bằng điều kiện x < t. Khi scale, thứ tự các điểm theo x không đổi, do đó điểm split tối ưu cũng không đổi. Ngược lại, KNN, SVM, Logistic Regression, Neural Network đều nhạy với scale và bắt buộc phải chuẩn hoá.",
  },
];

/* ────────────────────────────────────────────────────────────
   COMPONENT CHÍNH
   ──────────────────────────────────────────────────────────── */

export default function DataPreprocessingTopic() {
  /* 4 toggle độc lập cho demo pipeline trực quan */
  const [deoutliered, setDeoutliered] = useState(false);
  const [filled, setFilled] = useState(false);
  const [encoded, setEncoded] = useState(false);
  const [normalized, setNormalized] = useState(false);

  const resetPipeline = useCallback(() => {
    setDeoutliered(false);
    setFilled(false);
    setEncoded(false);
    setNormalized(false);
  }, []);

  const transformedRows = useMemo(() => {
    let rows: Row[] = RAW_ROWS.map((r) => ({ ...r }));

    if (deoutliered) {
      rows = rows.filter((r) => {
        if (r.tuoi != null && (r.tuoi < 0 || r.tuoi > 100)) return false;
        if (r.thu_nhap != null && r.thu_nhap > 500) return false;
        return true;
      });
    }

    if (filled) {
      const tuoiValid = rows
        .map((r) => r.tuoi)
        .filter((v): v is number => v != null);
      const tnValid = rows
        .map((r) => r.thu_nhap)
        .filter((v): v is number => v != null);
      const tuoiMed = median(tuoiValid);
      const tnMed = median(tnValid);

      rows = rows.map((r) => ({
        ...r,
        tuoi: r.tuoi ?? tuoiMed,
        thu_nhap: r.thu_nhap ?? tnMed,
      }));
    }

    return rows;
  }, [deoutliered, filled]);

  /* Thống kê cho hiển thị z-score nếu bật normalize */
  const cleanTuoi = transformedRows
    .map((r) => r.tuoi)
    .filter((v): v is number => v != null);
  const cleanTn = transformedRows
    .map((r) => r.thu_nhap)
    .filter((v): v is number => v != null);

  const meanTuoi = mean(cleanTuoi);
  const stdTuoi = std(cleanTuoi);
  const meanTn = mean(cleanTn);
  const stdTn = std(cleanTn);

  const formatNumber = useCallback(
    (value: number | null, kind: "tuoi" | "thu_nhap") => {
      if (value == null) {
        return <span className="text-red-500 font-semibold italic">NaN</span>;
      }
      if (!normalized) {
        return <span className="text-foreground">{value}</span>;
      }
      const m = kind === "tuoi" ? meanTuoi : meanTn;
      const s = kind === "tuoi" ? stdTuoi : stdTn;
      const z = (value - m) / s;
      return (
        <span className="text-emerald-500 tabular-nums">{z.toFixed(2)}</span>
      );
    },
    [normalized, meanTuoi, meanTn, stdTuoi, stdTn],
  );

  const activeCount =
    Number(deoutliered) + Number(filled) + Number(encoded) + Number(normalized);

  return (
    <>
      {/* ━━━ BƯỚC 1 — DỰ ĐOÁN ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Hook">
        <PredictionGate
          question="Bạn có bảng dữ liệu căn hộ: 15% cột 'diện tích' bị thiếu, một hàng ghi tuổi chủ = -3 (lỗi nhập), một hàng ghi thu nhập = 9999 triệu (nhập nhầm). Bạn huấn luyện model, accuracy chỉ 55%. Vì sao?"
          options={[
            "Vì model quá đơn giản — phải dùng deep learning",
            "Vì dữ liệu bẩn: 'garbage in, garbage out'. Phải làm sạch trước khi huấn luyện",
            "Vì chưa đủ dữ liệu — cần thêm 10x dataset",
            "Vì chưa dùng temperature đủ cao",
          ]}
          correct={1}
          explanation="Đây là bài học số 1 của mọi data scientist. Missing values làm model 'loạn', outlier kéo lệch thống kê, giá trị vô nghĩa (tuổi âm) huấn luyện thành tín hiệu sai. Làm sạch dữ liệu là bước có tác động lớn nhất lên chất lượng — hơn cả việc đổi kiến trúc model."
        >
          <div className="mt-4 rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Database size={18} className="text-accent" />
              <h3 className="text-sm font-semibold text-foreground">
                80% thời gian của một data scientist = làm sạch dữ liệu
              </h3>
            </div>
            <p className="text-sm text-foreground/85 leading-relaxed">
              Khi bạn đọc blog về Machine Learning, mọi người hay khoe model
              &ldquo;state of the art&rdquo;. Nhưng ngoài thực tế, một ML
              engineer dành{" "}
              <strong>phần lớn thời gian để rửa dữ liệu</strong> — điền chỗ
              thiếu, bỏ giá trị vô lý, chuẩn hoá đơn vị, mã hoá cột chữ. Bài này
              cho bạn chạm tay vào từng bước đó: bấm nút, thấy dữ liệu biến
              đổi, và đọc đoạn pandas tương ứng.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { icon: Droplet, label: "Điền chỗ thiếu", color: "#ef4444" },
                { icon: Filter, label: "Bỏ giá trị vô lý", color: "#f59e0b" },
                { icon: Tags, label: "Mã hoá cột chữ", color: "#3b82f6" },
                { icon: Sliders, label: "Chuẩn hoá", color: "#10b981" },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.label}
                    className="rounded-lg border border-border bg-surface/50 p-2 flex items-center gap-2"
                  >
                    <Icon size={14} style={{ color: s.color }} />
                    <span className="text-[11px] font-medium text-foreground">
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ BƯỚC 2 — ẨN DỤ / BỨC TRANH LỚN ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Ẩn dụ">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Sparkles size={18} className="text-accent" />
            Dữ liệu thô giống rau vừa hái — chưa rửa, chưa nhặt
          </h3>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Bạn đi chợ mua mớ rau cải. Ở ngoài đồng, có bùn, có lá sâu, có cọng
            héo, có con ốc bám rễ. Đầu bếp giỏi không bao giờ cho nguyên mớ rau
            vào nồi — người đó nhặt, rửa, cắt, rồi mới nấu.
          </p>
          <p className="text-sm text-foreground/85 leading-relaxed">
            <strong>Dữ liệu thô cũng thế.</strong> Thu thập từ form, từ cảm
            biến, từ log ứng dụng — luôn có ô để trống, có giá trị lỗi, có đơn
            vị khác nhau. Nếu &ldquo;cho luôn vào nồi&rdquo; (train model),
            món ăn sẽ dở — dù bạn có công thức &ldquo;state of the art&rdquo;.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-4">
              <p className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 dark:text-red-300 mb-1">
                <XCircle size={12} aria-hidden="true" />
                Không làm sạch
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Model &ldquo;học&rdquo; cả NaN và outlier → dự đoán lệch → báo
                cáo sai → sếp mất tiền.
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-4">
              <p className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-1">
                <CheckCircle2 size={12} aria-hidden="true" />
                Có làm sạch
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Model nhận dữ liệu &ldquo;chín tới&rdquo; → học ra pattern
                thật → dự đoán ổn định cả khi deploy.
              </p>
            </div>
          </div>
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 3 — REVEAL / SANDBOX ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Sandbox">
        <VisualizationSection topicSlug={metadata.slug}>
          <p className="text-sm text-muted mb-4 leading-relaxed">
            Đây là 8 hàng dữ liệu căn hộ Hà Nội. Cột có vấn đề đã được{" "}
            <strong>đánh dấu nền vàng</strong>. Bấm từng nút dưới đây để thấy
            hàng biến đổi thế nào. Bấm lại để tắt bước đó — so sánh trước / sau.
          </p>

          {/* ── Thanh nút 4 thao tác ── */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              onClick={() => setDeoutliered((v) => !v)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                deoutliered
                  ? "bg-amber-500 text-white border border-amber-500"
                  : "bg-card border border-border text-muted hover:text-foreground hover:border-amber-400"
              }`}
            >
              <Filter size={13} />
              {deoutliered ? "✓ " : ""}Lọc ngoại lai
            </button>
            <button
              type="button"
              onClick={() => setFilled((v) => !v)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                filled
                  ? "bg-red-500 text-white border border-red-500"
                  : "bg-card border border-border text-muted hover:text-foreground hover:border-red-400"
              }`}
            >
              <Droplet size={13} />
              {filled ? "✓ " : ""}Điền giá trị thiếu
            </button>
            <button
              type="button"
              onClick={() => setEncoded((v) => !v)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                encoded
                  ? "bg-blue-500 text-white border border-blue-500"
                  : "bg-card border border-border text-muted hover:text-foreground hover:border-blue-400"
              }`}
            >
              <Tags size={13} />
              {encoded ? "✓ " : ""}One-hot encode
            </button>
            <button
              type="button"
              onClick={() => setNormalized((v) => !v)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                normalized
                  ? "bg-emerald-500 text-white border border-emerald-500"
                  : "bg-card border border-border text-muted hover:text-foreground hover:border-emerald-400"
              }`}
            >
              <Sliders size={13} />
              {normalized ? "✓ " : ""}Chuẩn hoá (z-score)
            </button>
            <button
              type="button"
              onClick={resetPipeline}
              className="ml-auto rounded-lg px-3 py-2 text-xs font-medium text-muted hover:text-foreground flex items-center gap-1.5"
            >
              <RotateCcw size={13} />
              Đặt lại
            </button>
          </div>

          {/* ── Bảng dữ liệu ── */}
          <div className="overflow-x-auto rounded-xl border border-border mb-3">
            <table className="w-full text-xs">
              <thead className="bg-surface text-tertiary">
                <tr>
                  <th className="px-3 py-2 text-left">id</th>
                  <th className="px-3 py-2 text-left">tuổi</th>
                  <th className="px-3 py-2 text-left">thu_nhập (triệu)</th>
                  <th className="px-3 py-2 text-left">quận</th>
                  <th className="px-3 py-2 text-left">loại</th>
                  <th className="px-3 py-2 text-left">ghi chú</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {transformedRows.map((r) => {
                    const isOutlier =
                      (r.thu_nhap != null && r.thu_nhap > 500) ||
                      (r.tuoi != null && (r.tuoi < 0 || r.tuoi > 100));
                    const hasMissing = r.tuoi == null || r.thu_nhap == null;
                    const bg = isOutlier
                      ? "rgba(245, 158, 11, 0.14)"
                      : hasMissing
                        ? "rgba(239, 68, 68, 0.10)"
                        : "rgba(0,0,0,0)";
                    return (
                      <motion.tr
                        key={r.id}
                        layout
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0, backgroundColor: bg }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-border font-mono"
                      >
                        <td className="px-3 py-2">{r.id}</td>
                        <td className="px-3 py-2">
                          {formatNumber(r.tuoi, "tuoi")}
                        </td>
                        <td className="px-3 py-2">
                          {formatNumber(r.thu_nhap, "thu_nhap")}
                        </td>
                        <td className="px-3 py-2">
                          {encoded ? (
                            <span className="text-blue-500 text-[11px]">
                              [
                              {QUAN_LIST.map((q) =>
                                q === r.quan ? 1 : 0,
                              ).join(",")}
                              ]
                            </span>
                          ) : (
                            <span className="text-foreground">{r.quan}</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {encoded ? (
                            <span className="text-blue-500 text-[11px]">
                              [
                              {LOAI_LIST.map((l) =>
                                l === r.loai ? 1 : 0,
                              ).join(",")}
                              ]
                            </span>
                          ) : (
                            <span className="text-foreground">{r.loai}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-[10px] text-tertiary italic">
                          {r.note ?? ""}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* ── Thanh trạng thái ── */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface/60 px-4 py-2 text-xs">
            <span className="text-muted">
              Đã áp dụng{" "}
              <strong className="text-foreground">{activeCount}/4</strong> bước
              {" · "}
              Hàng còn lại:{" "}
              <strong className="text-foreground">
                {transformedRows.length}
              </strong>
              /{RAW_ROWS.length}
            </span>
            <span className="text-muted italic">
              {normalized
                ? "Cột số hiển thị dạng z-score (đơn vị độ lệch chuẩn)"
                : "Cột số hiển thị giá trị gốc"}
            </span>
          </div>

          {/* ── Code pandas đi kèm với thao tác đang bật ── */}
          <div className="mt-5">
            <p className="text-xs font-semibold text-tertiary uppercase tracking-wide mb-2">
              Bạn vừa chạy đoạn pandas tương đương
            </p>
            <CodeBlock language="python" title="pipeline.py (các bước bật/tắt theo nút)">
{buildLiveSnippet({ deoutliered, filled, encoded, normalized })}
            </CodeBlock>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 4 — DEEPEN / TABVIEW THEO CHUYÊN ĐỀ ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Đào sâu">
        <p className="text-sm text-muted mb-3 leading-relaxed">
          Bốn thao tác trên không phải là &ldquo;một nút bấm&rdquo; duy nhất —
          mỗi thao tác có nhiều biến thể tuỳ tình huống. Bấm qua các tab để
          thấy trước/sau của từng lựa chọn, kèm đoạn pandas ngắn.
        </p>
        <TabView
          tabs={[
            {
              label: "Missing values",
              content: (
                <div className="space-y-4">
                  <p className="text-sm text-foreground/85 leading-relaxed">
                    Có 4 chiến lược phổ biến cho dữ liệu thiếu. Mỗi chiến lược
                    phù hợp với một tình huống.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <MissingCard
                      title="Drop row"
                      desc="Xoá nguyên hàng có dữ liệu thiếu. Dùng khi số hàng thiếu < 5% và thiếu ngẫu nhiên."
                      color="#ef4444"
                      before="[28, NaN, 45]"
                      after="[28, 45]"
                    />
                    <MissingCard
                      title="Mean imputation"
                      desc="Điền bằng giá trị trung bình của cột. Dễ, nhưng dễ bị outlier kéo lệch."
                      color="#f59e0b"
                      before="[28, NaN, 45]"
                      after="[28, 36.5, 45]"
                    />
                    <MissingCard
                      title="Median imputation"
                      desc="Điền bằng trung vị. 'Lì' hơn trước outlier — lựa chọn mặc định an toàn."
                      color="#10b981"
                      before="[28, NaN, 45, 500]"
                      after="[28, 45, 45, 500]"
                    />
                    <MissingCard
                      title="Forward-fill"
                      desc="Dùng giá trị gần nhất trước đó. Hữu ích cho chuỗi thời gian (price, sensor)."
                      color="#3b82f6"
                      before="[1.0, NaN, NaN, 1.3]"
                      after="[1.0, 1.0, 1.0, 1.3]"
                    />
                  </div>
                  <CodeBlock language="python" title="pandas — 4 cách xử lý missing">
{`import pandas as pd

df.dropna(subset=["thu_nhap"])                  # 1. Drop row
df["thu_nhap"].fillna(df["thu_nhap"].mean())     # 2. Mean
df["thu_nhap"].fillna(df["thu_nhap"].median())   # 3. Median
df["thu_nhap"].ffill()                           # 4. Forward-fill`}
                  </CodeBlock>
                  <Callout variant="tip" title="Mẹo chọn nhanh">
                    &lt; 5% thiếu ngẫu nhiên → drop row. 5–30% → median (hoặc
                    KNN imputer). &gt; 30% → cân nhắc drop cột, hoặc tạo cờ{" "}
                    <code>is_missing</code> vì &ldquo;thiếu&rdquo; chính là tín
                    hiệu.
                  </Callout>
                </div>
              ),
            },
            {
              label: "Outliers",
              content: (
                <div className="space-y-4">
                  <p className="text-sm text-foreground/85 leading-relaxed">
                    Ngoại lai có thể là lỗi nhập, có thể là hiện tượng thật
                    hiếm gặp. Hai công thức phát hiện phổ biến:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <OutlierCard
                      label="Z-score"
                      body={
                        <>
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Đếm giá trị lệch bao nhiêu độ lệch chuẩn so với
                            trung bình.
                          </p>
                          <p className="text-[11px] text-muted mt-1">
                            Điều kiện: |z| &gt; 3 → coi là ngoại lai.
                          </p>
                        </>
                      }
                      code={`z = (df["x"] - df["x"].mean()) / df["x"].std()
df_clean = df[z.abs() <= 3]`}
                    />
                    <OutlierCard
                      label="IQR"
                      body={
                        <>
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            Dựa trên tứ phân vị Q1, Q3. Không nhạy với outlier
                            (khác z-score).
                          </p>
                          <p className="text-[11px] text-muted mt-1">
                            Điều kiện: ngoài [Q1 − 1.5 · IQR, Q3 + 1.5 · IQR].
                          </p>
                        </>
                      }
                      code={`q1, q3 = df["x"].quantile([0.25, 0.75])
iqr = q3 - q1
lo, hi = q1 - 1.5 * iqr, q3 + 1.5 * iqr
df_clean = df[df["x"].between(lo, hi)]`}
                    />
                  </div>
                  <Callout variant="warning" title="Đừng xoá outlier vội">
                    Luôn điều tra trước. Một CEO có thu nhập 500 triệu/tháng
                    không phải lỗi — họ tồn tại thật. Với dữ liệu lệch phải
                    (income, price), hãy thử log-transform thay vì xoá.
                  </Callout>
                </div>
              ),
            },
            {
              label: "Scaling",
              content: (
                <div className="space-y-4">
                  <p className="text-sm text-foreground/85 leading-relaxed">
                    Khi &ldquo;tuổi&rdquo; nằm trong 0–100 mà &ldquo;thu
                    nhập&rdquo; trong 5–500, KNN và gradient descent sẽ bị
                    &ldquo;thu nhập&rdquo; lấn át. Scaling đưa mọi cột về cùng
                    thang đo.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <ScaleCard
                      title="Standard (z-score)"
                      desc="Trừ mean, chia std. Kết quả có mean=0, std=1. Mặc định cho tuyến tính."
                      range="μ = 0 · σ = 1"
                      code={`from sklearn.preprocessing import StandardScaler
scaler = StandardScaler()
X_s = scaler.fit_transform(X_train)`}
                    />
                    <ScaleCard
                      title="Min-Max"
                      desc="Kéo mọi giá trị về [0, 1]. Hữu ích cho ảnh, neural net với sigmoid."
                      range="min = 0 · max = 1"
                      code={`from sklearn.preprocessing import MinMaxScaler
scaler = MinMaxScaler()
X_s = scaler.fit_transform(X_train)`}
                    />
                  </div>
                  <div className="rounded-xl border border-border bg-surface/40 p-4">
                    <p className="text-xs font-semibold text-tertiary uppercase tracking-wide mb-2">
                      Trực quan — cùng 6 giá trị thu nhập, ba thang đo khác nhau
                    </p>
                    <ScaleComparisonSvg values={[25, 30, 40, 48, 55, 500]} />
                  </div>
                </div>
              ),
            },
            {
              label: "Encoding",
              content: (
                <div className="space-y-4">
                  <p className="text-sm text-foreground/85 leading-relaxed">
                    Model chỉ &ldquo;nhìn&rdquo; được số. Với cột chữ (quận,
                    loại nhà, cấp bậc), bạn cần biến chữ thành số — và có
                    nhiều cách.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <EncodeCard
                      title="One-hot"
                      when="Category không có thứ tự (quận, màu, loại sản phẩm)."
                      example='"Hoàn Kiếm" → [1, 0, 0]  "Ba Đình" → [0, 1, 0]'
                      note="Mỗi giá trị thành 1 cột 0/1. Bùng nổ cột khi có > 100 category."
                    />
                    <EncodeCard
                      title="Label / Ordinal"
                      when="Category có thứ tự (junior < senior < lead, size S < M < L)."
                      example='junior=0, mid=1, senior=2, lead=3'
                      note="Giữ được thứ tự, nhưng model sẽ 'hiểu nhầm' nếu category không có thứ tự thật."
                    />
                  </div>
                  <CodeBlock language="python" title="pandas + sklearn — cả hai cách encode">
{`# One-hot với pandas
df = pd.get_dummies(df, columns=["quan"], prefix="quan")

# Ordinal với sklearn
from sklearn.preprocessing import OrdinalEncoder
enc = OrdinalEncoder(categories=[["junior","mid","senior","lead"]])
df["cap_bac"] = enc.fit_transform(df[["cap_bac"]])`}
                  </CodeBlock>
                </div>
              ),
            },
          ]}
        />

        <div className="mt-6">
          <p className="text-sm text-muted mb-2">
            Thứ tự thường gặp của cả pipeline:
          </p>
          <StepReveal
            labels={[
              "1. Split train/val/test",
              "2. Xử lý outlier",
              "3. Điền missing",
              "4. Encode",
              "5. Scale",
              "6. Train model",
            ]}
          >
            {[
              <StepBlock
                key="s1"
                color="#6366f1"
                body="Luôn chia dữ liệu TRƯỚC mọi bước xử lý. Nếu không, mọi thống kê (mean, std, median) đều bị 'pha trộn' giữa train và test → data leakage."
              />,
              <StepBlock
                key="s2"
                color="#f59e0b"
                body="Phát hiện outlier bằng IQR hoặc z-score trên tập train. Quyết định: sửa (nếu là lỗi nhập), cắt ngọn (winsorize), hay log-transform. Không dùng thống kê của test."
              />,
              <StepBlock
                key="s3"
                color="#ef4444"
                body="Imputer học median của train → transform cho cả val/test bằng CÙNG median đó. Tuyệt đối không tính median riêng trên val/test."
              />,
              <StepBlock
                key="s4"
                color="#3b82f6"
                body="One-hot (hoặc ordinal) học các category từ train. Nếu val/test có category mới, dùng handle_unknown='ignore' để tránh crash."
              />,
              <StepBlock
                key="s5"
                color="#10b981"
                body="StandardScaler / MinMaxScaler fit trên train, transform cho val/test. Tree-based model có thể bỏ qua bước này."
              />,
              <StepBlock
                key="s6"
                color="#8b5cf6"
                body="Đến lúc này dữ liệu mới sạch. Huấn luyện model, đánh giá trên val, tune hyperparameter, cuối cùng mới chạm vào test."
              />,
            ]}
          </StepReveal>
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 5 — AHA ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Aha">
        <AhaMoment>
          <p>
            <strong>
              Mô hình không biết dữ liệu của bạn bẩn đâu — nó học đúng những gì
              bạn đưa vào.
            </strong>{" "}
            Nếu bạn đưa tuổi = -3, model sẽ &ldquo;học&rdquo; rằng có tồn tại
            người tuổi âm. Nếu bạn cho nó NaN, nó sẽ khớp với NaN. Nếu &ldquo;thu
            nhập&rdquo; lớn gấp 10 lần &ldquo;tuổi&rdquo;, gradient descent sẽ
            chỉ nghe &ldquo;thu nhập&rdquo;.
          </p>
          <p className="mt-3">
            Làm sạch dữ liệu không &ldquo;xa xỉ&rdquo; — nó là khoản đầu tư có
            lợi tức cao nhất trong toàn bộ pipeline ML. Data sạch + model đơn
            giản thường đánh bại data bẩn + model phức tạp.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ━━━ BƯỚC 6 — CHALLENGE ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Bạn đang xử lý dataset khách hàng với cột 'email_phụ'. 30% hàng có giá trị thiếu. Phương án hợp lý nhất?"
          options={[
            "Điền mọi ô thiếu bằng 0 (dù đây là cột chữ) để không còn NaN",
            "Drop ngay cột vì hơn 5% thiếu",
            "Hỏi: tại sao thiếu? Nếu khách không có email phụ (tức 'thiếu' mang thông tin) → tạo cờ has_secondary_email, rồi có thể bỏ cột gốc",
            "Dùng temperature cao để AI bù vào",
          ]}
          correct={2}
          explanation="Với 30% thiếu, bước đầu tiên là hỏi vì sao. Nếu 'không có email phụ' là bản chất của dữ liệu, thì 'NaN' chính là tín hiệu. Tạo cờ is_missing / has_secondary_email giữ được thông tin đó. Việc điền ngẫu nhiên sẽ tạo tín hiệu giả. Drop vội cũng có thể vứt bỏ thông tin quý."
        />

        <div className="mt-4">
          <InlineChallenge
            question="Bạn có cột 'thu_nhập' range 5–500 triệu và cột 'tuổi' range 18–65. Bạn dùng KNN để phân loại. Vấn đề?"
            options={[
              "Không có vấn đề gì",
              "KNN tính khoảng cách bằng Euclidean. Thu_nhập (max 500) lấn át tuổi (max 65) → kết quả chỉ dựa trên thu nhập",
              "KNN chỉ chạy được với cột chữ",
              "Tuổi không phải đặc trưng hợp lệ",
            ]}
            correct={1}
            explanation="Khoảng cách Euclidean: sqrt((495)^2 + (47)^2) ≈ 498. Tuổi bị ignore hoàn toàn. Fix: StandardScaler hoặc MinMaxScaler cho cả hai cột → khoảng cách cân bằng. KNN, K-Means, SVM, Logistic Regression đều cần scale."
          />
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 7 — EXPLAIN ━━━ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Giải thích">
        <ExplanationSection topicSlug={metadata.slug}>
          <p>
            Tiền xử lý là tập hợp các bước biến dữ liệu thô thành dữ liệu sẵn
            sàng cho model. Ở đây, hai công thức thường gặp nhất trong công việc
            hàng ngày:
          </p>

          <div className="rounded-xl border border-border bg-surface/40 p-4 my-3">
            <p className="text-xs font-semibold text-tertiary uppercase tracking-wide mb-2">
              Công thức 1 — Chuẩn hoá bằng z-score
            </p>
            <LaTeX block>{"z = \\dfrac{x - \\mu}{\\sigma}"}</LaTeX>
            <p className="text-sm text-foreground/80 leading-relaxed">
              Nghĩa đơn giản: &ldquo;giá trị x lệch bao nhiêu độ lệch chuẩn
              so với trung bình&rdquo;. Sau khi biến đổi, cột có mean = 0 và
              std = 1. Gradient descent không còn bị cột &ldquo;to&rdquo; lấn
              át cột &ldquo;nhỏ&rdquo;, KNN xem mọi đặc trưng công bằng.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface/40 p-4 my-3">
            <p className="text-xs font-semibold text-tertiary uppercase tracking-wide mb-2">
              Công thức 2 — Min-max scaling
            </p>
            <LaTeX block>
              {"x' = \\dfrac{x - x_{\\min}}{x_{\\max} - x_{\\min}}"}
            </LaTeX>
            <p className="text-sm text-foreground/80 leading-relaxed">
              Kéo mọi giá trị vào đoạn [0, 1]. Hữu ích khi model yêu cầu đầu vào
              bị giới hạn (sigmoid, image pixels). Nhược điểm: nhạy với
              outlier — một giá trị cực đại sẽ &ldquo;dí&rdquo; mọi giá trị
              khác về gần 0.
            </p>
          </div>

          <h4 className="text-sm font-semibold text-foreground mt-5 mb-2">
            Đoạn pandas thường dùng: z-score và min-max cùng một cột
          </h4>
          <CodeBlock language="python" title="scaling với sklearn">
{`from sklearn.preprocessing import StandardScaler, MinMaxScaler

std_scaler = StandardScaler()
minmax = MinMaxScaler()

X_train_std = std_scaler.fit_transform(X_train[["tuoi", "thu_nhap"]])
X_train_mm  = minmax.fit_transform(X_train[["tuoi", "thu_nhap"]])

X_val_std   = std_scaler.transform(X_val[["tuoi", "thu_nhap"]])   # không fit!
X_val_mm    = minmax.transform(X_val[["tuoi", "thu_nhap"]])`}
          </CodeBlock>

          <Callout variant="warning" title="Quy tắc vàng: fit trên train, transform cho val/test">
            Mọi bước biến đổi (imputer, scaler, encoder) chỉ được học từ tập
            train. Val và test chỉ được gọi <code>transform</code>. Vi phạm quy
            tắc này gọi là <strong>data leakage</strong> — kết quả báo cáo cao
            giả tạo, khi deploy sẽ lộ ra.
          </Callout>

          <h4 className="text-sm font-semibold text-foreground mt-5 mb-2">
            Ghép pipeline đầu tới cuối
          </h4>
          <CodeBlock language="python" title="sklearn Pipeline — mọi bước trong 1 object">
{`from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

clf = Pipeline([
    ("impute", SimpleImputer(strategy="median")),
    ("scale",  StandardScaler()),
    ("model",  LogisticRegression(max_iter=500)),
])
clf.fit(X_train, y_train)
clf.score(X_test, y_test)`}
          </CodeBlock>

          <Callout variant="tip" title="Vì sao nên dùng Pipeline">
            Pipeline đóng gói tất cả các bước vào 1 object. Khi deploy, bạn chỉ
            cần gọi <code>clf.predict(new_row)</code> — các bước tiền xử lý
            được áp dụng tự động, không sợ lệch giữa training và serving.
          </Callout>

          <h4 className="text-sm font-semibold text-foreground mt-5 mb-2">
            Pipeline cho cột số + cột chữ riêng biệt
          </h4>
          <p className="text-sm text-foreground/80 leading-relaxed">
            Khi cột số và cột chữ cần xử lý khác nhau, tách thành hai nhánh rồi
            gộp lại bằng <code>ColumnTransformer</code>:
          </p>
          <CodeBlock language="python" title="2 nhánh — định nghĩa pipeline từng loại">
{`from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder

num_pipe = Pipeline([
    ("impute", SimpleImputer(strategy="median")),
    ("scale",  StandardScaler()),
])
cat_pipe = Pipeline([
    ("impute", SimpleImputer(strategy="most_frequent")),
    ("onehot", OneHotEncoder(handle_unknown="ignore")),
])`}
          </CodeBlock>
          <CodeBlock language="python" title="Gộp hai nhánh thành một preprocessor">
{`prep = ColumnTransformer([
    ("num", num_pipe, ["tuoi", "thu_nhap"]),
    ("cat", cat_pipe, ["quan", "loai"]),
])
X_train_clean = prep.fit_transform(X_train)
X_test_clean  = prep.transform(X_test)  # không fit!`}
          </CodeBlock>

          <CollapsibleDetail title="Khi nào chọn median thay vì mean?">
            <p className="text-sm leading-relaxed">
              Khi phân phối lệch phải (income, price, population) hoặc có
              outlier. Mean bị outlier kéo lệch, median không. Nguyên tắc an
              toàn: mặc định median, chỉ chọn mean khi bạn đã check phân phối
              gần chuẩn.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Tree-based model có thực sự không cần scale?">
            <p className="text-sm leading-relaxed">
              Đúng. Random Forest, XGBoost, LightGBM, CatBoost split bằng điều
              kiện <code>x &lt; t</code>. Scaling không đổi thứ tự các điểm
              theo x → split tối ưu giữ nguyên. Tuy nhiên các model này vẫn cần
              xử lý missing và encode categorical.
            </p>
          </CollapsibleDetail>

          <p className="mt-4 leading-relaxed">
            Khi dữ liệu đã sạch, bước tiếp theo là{" "}
            <TopicLink slug="feature-engineering">
              feature engineering
            </TopicLink>{" "}
            — tạo đặc trưng mới có ý nghĩa. Để ôn kỹ năng pandas nền tảng, xem
            lại{" "}
            <TopicLink slug="python-for-ml">Python cho ML</TopicLink>.
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 8 — TÓM TẮT + QUIZ ━━━ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Ôn tập">
        <MiniSummary
          title="5 điều cần nhớ về tiền xử lý"
          points={[
            "Làm sạch dữ liệu là bước có tác động lớn nhất lên chất lượng model — trước cả việc đổi kiến trúc.",
            "4 thao tác cốt lõi: điền missing, lọc outlier, encode category, scale số.",
            "Luôn chia train/val/test TRƯỚC, rồi fit mọi biến đổi chỉ trên train.",
            "Median 'lì' trước outlier — dùng khi phân phối lệch hoặc có giá trị cực trị.",
            "Dùng sklearn Pipeline để đóng gói — mỗi bước áp dụng tự động khi deploy.",
          ]}
        />

        <div className="mt-6">
          <p className="text-sm text-muted mb-3 leading-relaxed">
            Sáu câu để chắc chắn bạn đã nắm được nguyên tắc.
          </p>
          <QuizSection questions={quizQuestions} />
        </div>

        <div className="mt-6">
          <Callout variant="tip" title="Xem ứng dụng thực tế">
            Uber xử lý hàng tỷ điểm GPS nhiễu để tính ETA — đó là bài toán tiền
            xử lý quy mô lớn. Đọc{" "}
            <TopicLink slug="data-preprocessing-in-uber-eta">
              Tiền xử lý trong Uber ETA
            </TopicLink>
            {" "}để thấy các kỹ thuật trong bài này được triển khai trong
            production như thế nào.
          </Callout>
        </div>
      </LessonSection>
    </>
  );
}

/* ────────────────────────────────────────────────────────────
   HELPERS cục bộ — tách nhỏ để JSX chính đọc dễ.
   ──────────────────────────────────────────────────────────── */

function buildLiveSnippet({
  deoutliered,
  filled,
  encoded,
  normalized,
}: {
  deoutliered: boolean;
  filled: boolean;
  encoded: boolean;
  normalized: boolean;
}): string {
  const lines: string[] = ["import pandas as pd", "df = pd.read_csv('houses.csv')"];
  if (deoutliered) {
    lines.push(
      "df = df[(df['tuoi'].between(0, 100)) & (df['thu_nhap'] <= 500)]  # lọc ngoại lai",
    );
  }
  if (filled) {
    lines.push(
      "df['tuoi']     = df['tuoi'].fillna(df['tuoi'].median())",
      "df['thu_nhap'] = df['thu_nhap'].fillna(df['thu_nhap'].median())",
    );
  }
  if (encoded) {
    lines.push("df = pd.get_dummies(df, columns=['quan', 'loai'])  # one-hot");
  }
  if (normalized) {
    lines.push(
      "from sklearn.preprocessing import StandardScaler",
      "num = ['tuoi', 'thu_nhap']",
      "df[num] = StandardScaler().fit_transform(df[num])",
    );
  }
  if (lines.length === 2) {
    lines.push("# Bật các nút bên trên để thêm bước vào pipeline");
  }
  return lines.join("\n");
}

function MissingCard({
  title,
  desc,
  color,
  before,
  after,
}: {
  title: string;
  desc: string;
  color: string;
  before: string;
  after: string;
}) {
  return (
    <div
      className="rounded-xl border bg-card p-4 space-y-2"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted leading-snug">{desc}</p>
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="rounded-md bg-surface/60 p-2">
          <p className="text-[10px] font-semibold text-tertiary uppercase">
            Trước
          </p>
          <p className="font-mono text-xs text-foreground/90">{before}</p>
        </div>
        <div className="rounded-md bg-surface/60 p-2">
          <p className="text-[10px] font-semibold text-tertiary uppercase">
            Sau
          </p>
          <p
            className="font-mono text-xs"
            style={{ color }}
          >
            {after}
          </p>
        </div>
      </div>
    </div>
  );
}

function OutlierCard({
  label,
  body,
  code,
}: {
  label: string;
  body: React.ReactNode;
  code: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
      <div className="flex items-center gap-2">
        <AlertTriangle size={14} className="text-amber-500" />
        <p className="text-sm font-semibold text-foreground">{label}</p>
      </div>
      {body}
      <pre className="rounded-md bg-surface/80 p-2 text-[11px] font-mono text-foreground/85 overflow-x-auto leading-relaxed">
        {code}
      </pre>
    </div>
  );
}

function ScaleCard({
  title,
  desc,
  range,
  code,
}: {
  title: string;
  desc: string;
  range: string;
  code: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <span className="text-[10px] font-mono text-emerald-500 px-2 py-0.5 rounded-full bg-emerald-500/10">
          {range}
        </span>
      </div>
      <p className="text-xs text-muted leading-snug">{desc}</p>
      <pre className="rounded-md bg-surface/80 p-2 text-[11px] font-mono text-foreground/85 overflow-x-auto leading-relaxed">
        {code}
      </pre>
    </div>
  );
}

function ScaleComparisonSvg({ values }: { values: number[] }) {
  const [mn, mx] = minMax(values);
  const m = mean(values);
  const s = std(values);
  const rows: { label: string; points: number[]; color: string; hint: string }[] = [
    { label: "Gốc", points: values, color: "#94a3b8", hint: `range ${mn}–${mx}` },
    {
      label: "Min-Max",
      points: values.map((v) => (v - mn) / (mx - mn)),
      color: "#3b82f6",
      hint: "[0, 1]",
    },
    {
      label: "Z-score",
      points: values.map((v) => (v - m) / s),
      color: "#10b981",
      hint: "μ≈0 · σ≈1",
    },
  ];
  return (
    <svg viewBox="0 0 420 160" className="w-full">
      {rows.map((r, rowIdx) => {
        const y = 30 + rowIdx * 45;
        const rowMin = Math.min(...r.points);
        const rowMax = Math.max(...r.points);
        const span = rowMax - rowMin || 1;
        return (
          <g key={r.label}>
            <text x={4} y={y + 4} fontSize={11} fill="var(--text-secondary)">
              {r.label}
            </text>
            <text
              x={4}
              y={y + 18}
              fontSize={11}
              fill="var(--text-tertiary)"
              fontStyle="italic"
            >
              {r.hint}
            </text>
            <line
              x1={70}
              x2={410}
              y1={y}
              y2={y}
              stroke="var(--border)"
              strokeWidth={1}
            />
            {r.points.map((p, i) => {
              const cx = 70 + ((p - rowMin) / span) * 340;
              return (
                <circle
                  key={i}
                  cx={cx}
                  cy={y}
                  r={4}
                  fill={r.color}
                  opacity={0.85}
                />
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

function EncodeCard({
  title,
  when,
  example,
  note,
}: {
  title: string;
  when: string;
  example: string;
  note: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
      <div className="flex items-center gap-2">
        <CheckCircle2 size={14} className="text-blue-500" />
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      <p className="text-xs text-foreground/80 leading-snug">
        <strong>Dùng khi:</strong> {when}
      </p>
      <p className="text-[11px] font-mono text-blue-500 bg-blue-500/10 rounded px-2 py-1">
        {example}
      </p>
      <p className="text-[11px] text-muted italic leading-snug">{note}</p>
    </div>
  );
}

function StepBlock({ color, body }: { color: string; body: string }) {
  return (
    <div
      className="rounded-lg border bg-surface/60 p-3 text-xs text-foreground/85 leading-relaxed"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      {body}
    </div>
  );
}
