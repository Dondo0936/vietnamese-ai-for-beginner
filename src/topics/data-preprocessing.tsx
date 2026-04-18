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
  titleVi: "Tiền xử lý dữ liệu — Rửa rau trước khi nấu",
  description:
    "Các bước làm sạch, chuẩn hoá và biến đổi dữ liệu thô trước khi đưa vào mô hình máy học.",
  category: "foundations",
  tags: ["preprocessing", "cleaning", "normalization", "data"],
  difficulty: "beginner",
  relatedSlugs: ["feature-engineering", "train-val-test", "data-pipelines"],
  vizType: "interactive",
};

const TOTAL_STEPS = 7;

/* ─────────────────────────────────────────────────────────────────────────────
 * Dataset definitions — 5 căn hộ Hà Nội, 4 features.
 *   tuoi   — tuổi người mua (số, đôi khi thiếu)
 *   thu_nhap — thu nhập triệu/tháng (số, có outlier)
 *   quan   — quận (categorical)
 *   loai   — loại nhà (categorical)
 * ─────────────────────────────────────────────────────────────────────────── */

type Row = {
  id: number;
  tuoi: number | null;
  thu_nhap: number | null;
  quan: string;
  loai: string;
};

const RAW_ROWS: Row[] = [
  { id: 1, tuoi: 28, thu_nhap: 25, quan: "Hoàn Kiếm", loai: "Chung cư" },
  { id: 2, tuoi: null, thu_nhap: 40, quan: "Ba Đình", loai: "Nhà phố" },
  { id: 3, tuoi: 45, thu_nhap: 9999, quan: "Hoàn Kiếm", loai: "Chung cư" },
  { id: 4, tuoi: 35, thu_nhap: 60, quan: "Cầu Giấy", loai: "Biệt thự" },
  { id: 5, tuoi: 52, thu_nhap: null, quan: "Ba Đình", loai: "Nhà phố" },
];

const QUAN_LIST = ["Hoàn Kiếm", "Ba Đình", "Cầu Giấy"] as const;
const LOAI_LIST = ["Chung cư", "Nhà phố", "Biệt thự"] as const;

/* ─────────────────────────────────────────────────────────────────────────────
 * Quiz — 8 câu bao phủ 5 bước preprocessing + best-practice.
 * ─────────────────────────────────────────────────────────────────────────── */

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "Missing values: khi nào dùng mean imputation, khi nào drop?",
    options: [
      "Luôn dùng mean vì đơn giản",
      "Mean cho missing < 5% random. Drop row khi > 30% missing. Domain-specific imputation cho y tế/tài chính",
      "Luôn drop rows có missing để an toàn",
    ],
    correct: 1,
    explanation:
      "< 5% missing random → mean/median imputation ok. 5-30% → advanced imputation (KNN, MICE). > 30% → drop column (không đủ thông tin). Y tế: missing lab result ≠ random (bệnh nhân không xét nghiệm = có lý do) → cần domain knowledge!",
  },
  {
    question: "Tại sao cần normalize/standardize features?",
    options: [
      "Để data đẹp hơn khi visualize",
      "Features có scale khác nhau (tuổi: 0-100, lương: 0-1B) → gradient descent và distance-based models bị bias bởi feature lớn",
      "Chỉ cần cho deep learning, không cần cho sklearn",
    ],
    correct: 1,
    explanation:
      "KNN: khoảng cách bị dominated bởi feature có range lớn (lương 1B > tuổi 100 → KNN chỉ nhìn lương). Gradient descent: features lớn → gradients lớn → học không ổn định. StandardScaler (mean=0, std=1) cân bằng mọi feature. Tree-based models không cần vì chỉ nhìn rankings.",
  },
  {
    question:
      "Feature 'quận_huyện' có 700 giá trị. One-hot encoding tạo 700 columns. Vấn đề?",
    options: [
      "Không có vấn đề gì, cứ one-hot",
      "Curse of dimensionality: 700 sparse columns. Dùng target encoding (thay category bằng mean(target)) hoặc embedding",
      "Chỉ dùng khi data > 1M rows, nếu ít thì bỏ qua",
    ],
    correct: 1,
    explanation:
      "One-hot 700 categories = 700 sparse columns (hầu hết là 0). Overfit + chậm. Target encoding: thay 'Hoàn Kiếm' bằng mean(giá_nhà) của Hoàn Kiếm = 8.5 tỷ → 1 column, giữ thông tin. Hoặc: embedding (learned representation) cho deep learning.",
  },
  {
    type: "fill-blank",
    question:
      "StandardScaler biến đổi feature x thành z = (x − {blank}) / σ, đảm bảo dữ liệu có trung bình bằng 0 và độ lệch chuẩn bằng 1.",
    blanks: [{ answer: "μ", accept: ["mean", "trung bình", "mu"] }],
    explanation:
      "StandardScaler trừ mean (μ) và chia độ lệch chuẩn (σ): z = (x − μ) / σ. Sau khi scale, mọi feature có phân phối chuẩn hóa với mean=0 và std=1, giúp gradient descent và các thuật toán dựa trên khoảng cách hoạt động công bằng giữa các features.",
  },
  {
    question:
      "Bạn fit StandardScaler trên toàn bộ dataset (gồm cả test set) rồi mới split. Hậu quả?",
    options: [
      "Không sao, kết quả chính xác hơn vì scaler thấy toàn bộ phân phối",
      "Data leakage: scaler 'biết' mean/std của test → model đánh giá trên data nó đã 'nhìn thấy' → accuracy giả tạo",
      "Tốn bộ nhớ nhưng kết quả không đổi",
    ],
    correct: 1,
    explanation:
      "Đây là lỗi kinh điển. fit_transform phải chỉ dùng trên X_train. Với X_val/X_test chỉ transform. Nếu fit trên toàn bộ, thông tin từ test (mean, std, min, max) rò rỉ sang train → accuracy trên test cao giả tạo, khi deploy sẽ sụp đổ.",
  },
  {
    question:
      "Dataset có cột 'giá_nhà' với 1 outlier = 500 tỷ (lỗi nhập — lẽ ra 5 tỷ). Median ≈ 4 tỷ, mean ≈ 7.5 tỷ. Nên làm gì?",
    options: [
      "Giữ nguyên — model sẽ tự xử lý",
      "Điều tra nguyên nhân → nếu là lỗi nhập, sửa về 5 tỷ hoặc drop row. Log-transform giá để giảm ảnh hưởng",
      "Xoá toàn bộ cột giá_nhà",
    ],
    correct: 1,
    explanation:
      "Outlier phải được điều tra — không phải lúc nào cũng là lỗi (CEO thật sự có thu nhập cực cao). Với lỗi nhập rõ: sửa hoặc drop. Với outlier hợp lệ: log-transform (log(giá)) hoặc winsorize (cap ở 99th percentile). Median robust hơn mean.",
  },
  {
    question:
      "Feature 'cấp bậc' có giá trị: junior, mid, senior, lead. Nên encode thế nào?",
    options: [
      "One-hot: 4 cột binary",
      "Ordinal encoding: {junior: 0, mid: 1, senior: 2, lead: 3} — vì có thứ tự tự nhiên",
      "Target encoding với mean(salary) của mỗi cấp",
    ],
    correct: 1,
    explanation:
      "Ordinal encoding phù hợp khi categories CÓ THỨ TỰ tự nhiên (junior < mid < senior < lead). One-hot mất thông tin thứ tự. Target encoding dùng được nhưng cần cẩn thận với data leakage. Cho màu sắc (đỏ, xanh, vàng) — one-hot vì không có thứ tự.",
  },
  {
    question: "Ưu điểm lớn nhất của sklearn Pipeline là gì?",
    options: [
      "Chạy nhanh hơn code tự viết",
      "Tự động áp dụng cùng biến đổi cho train/val/test + tránh data leakage khi dùng với cross_val_score",
      "Dùng ít RAM hơn",
    ],
    correct: 1,
    explanation:
      "Pipeline đảm bảo scaler/imputer chỉ fit trên train fold trong mỗi vòng CV. Không dùng Pipeline → dễ fit scaler 1 lần trên toàn bộ X_train trước CV → leak giữa các fold. Pipeline còn gọn code + dễ deploy (1 object thay vì nhiều step).",
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
 * Component
 * ─────────────────────────────────────────────────────────────────────────── */

export default function DataPreprocessingTopic() {
  const [normalized, setNormalized] = useState(false);
  const [filled, setFilled] = useState(false);
  const [encoded, setEncoded] = useState(false);
  const [deoutliered, setDeoutliered] = useState(false);

  const resetPipeline = useCallback(() => {
    setNormalized(false);
    setFilled(false);
    setEncoded(false);
    setDeoutliered(false);
  }, []);

  /* ── Pipeline applied over RAW_ROWS in fixed order
   * Outlier removal → Missing-value fill → Categorical encode → Normalize
   * (We still let users toggle each step independently for exploration.)  */
  const transformedRows = useMemo(() => {
    // 1) work on a deep copy
    let rows: Row[] = RAW_ROWS.map((r) => ({ ...r }));

    // 2) Remove outliers — tuổi <0 hoặc >100, thu_nhập > 500 triệu
    if (deoutliered) {
      rows = rows.filter((r) => {
        if (r.tuoi != null && (r.tuoi < 0 || r.tuoi > 100)) return false;
        if (r.thu_nhap != null && r.thu_nhap > 500) return false;
        return true;
      });
    }

    // 3) Fill missing — median cho tuổi, median cho thu_nhập
    if (filled) {
      const tuoiList = rows
        .map((r) => r.tuoi)
        .filter((v): v is number => v != null)
        .sort((a, b) => a - b);
      const tnList = rows
        .map((r) => r.thu_nhap)
        .filter((v): v is number => v != null)
        .sort((a, b) => a - b);

      const tuoiMed = tuoiList[Math.floor(tuoiList.length / 2)] ?? 0;
      const tnMed = tnList[Math.floor(tnList.length / 2)] ?? 0;

      rows = rows.map((r) => ({
        ...r,
        tuoi: r.tuoi ?? tuoiMed,
        thu_nhap: r.thu_nhap ?? tnMed,
      }));
    }

    return rows;
  }, [deoutliered, filled]);

  /* ── derived stats for visualization curves ── */
  const rawTuoi = RAW_ROWS.map((r) => r.tuoi).filter(
    (v): v is number => v != null
  );
  const rawThuNhap = RAW_ROWS.map((r) => r.thu_nhap).filter(
    (v): v is number => v != null
  );

  const rawTuoiMean =
    rawTuoi.reduce((s, v) => s + v, 0) / Math.max(rawTuoi.length, 1);
  const rawTuoiStd = Math.sqrt(
    rawTuoi.reduce((s, v) => s + (v - rawTuoiMean) ** 2, 0) /
      Math.max(rawTuoi.length, 1)
  );
  const rawTnMean =
    rawThuNhap.reduce((s, v) => s + v, 0) / Math.max(rawThuNhap.length, 1);

  const cleanTuoi = transformedRows.map((r) => r.tuoi ?? rawTuoiMean);
  const cleanTn = transformedRows.map((r) => r.thu_nhap ?? rawTnMean);

  const cleanTuoiMean =
    cleanTuoi.reduce((s, v) => s + v, 0) / Math.max(cleanTuoi.length, 1);
  const cleanTuoiStd = Math.sqrt(
    cleanTuoi.reduce((s, v) => s + (v - cleanTuoiMean) ** 2, 0) /
      Math.max(cleanTuoi.length, 1)
  );
  const cleanTnMean =
    cleanTn.reduce((s, v) => s + v, 0) / Math.max(cleanTn.length, 1);
  const cleanTnStd = Math.sqrt(
    cleanTn.reduce((s, v) => s + (v - cleanTnMean) ** 2, 0) /
      Math.max(cleanTn.length, 1)
  );

  /* ── helper: normalized (z-score) value for display ── */
  const formatCell = useCallback(
    (value: number | null, kind: "tuoi" | "thu_nhap") => {
      if (value == null) {
        return (
          <span className="text-red-400 italic font-semibold">NaN</span>
        );
      }
      if (!normalized) {
        return <span>{value}</span>;
      }
      const mean = kind === "tuoi" ? cleanTuoiMean : cleanTnMean;
      const std =
        (kind === "tuoi" ? cleanTuoiStd : cleanTnStd) || 1; // avoid /0
      const z = (value - mean) / std;
      return <span className="text-emerald-400">{z.toFixed(2)}</span>;
    },
    [normalized, cleanTuoiMean, cleanTnMean, cleanTuoiStd, cleanTnStd]
  );

  const activeStepCount =
    Number(deoutliered) + Number(filled) + Number(encoded) + Number(normalized);

  /* ── simple density curve polyline for visualisation ── */
  const buildCurve = useCallback(
    (values: number[], width: number, height: number, bins: number) => {
      if (values.length === 0) return "";
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min || 1;
      const binCounts = new Array(bins).fill(0);
      values.forEach((v) => {
        const idx = Math.min(bins - 1, Math.floor(((v - min) / range) * bins));
        binCounts[idx] += 1;
      });
      const maxCount = Math.max(...binCounts, 1);
      const step = width / (bins - 1);
      return binCounts
        .map((c, i) => {
          const x = i * step;
          const y = height - (c / maxCount) * (height - 6) - 2;
          return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ");
    },
    []
  );

  const rawCurve = buildCurve(rawThuNhap, 200, 60, 8);
  const cleanCurve = buildCurve(cleanTn, 200, 60, 8);

  return (
    <>
      {/* ─────────── STEP 1 ── PREDICTION ─────────── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <div className="mb-4">
          <ProgressSteps
            current={1}
            total={TOTAL_STEPS}
            labels={[
              "Dự đoán",
              "Khám phá",
              "Aha",
              "Thử thách",
              "Lý thuyết",
              "Tóm tắt",
              "Kiểm tra",
            ]}
          />
        </div>

        <PredictionGate
          question="Data giá nhà Hà Nội: 15% missing diện tích, 'tuổi' có giá trị -5 (vô nghĩa), 'giá' có outlier 500 tỷ (lỗi nhập). Model accuracy chỉ 55%. Tại sao?"
          options={[
            "Model quá đơn giản — cần đổi sang deep learning",
            "Data bẩn → 'garbage in, garbage out'. Cần tiền xử lý: xử lý missing, loại outliers, sửa errors TRƯỚC khi train",
            "Cần nhiều data hơn — 10× dataset sẽ giải quyết mọi thứ",
          ]}
          correct={1}
          explanation="Garbage in, garbage out! Missing values → model confuse. Outlier 500 tỷ → kéo mean, skew distribution. Tuổi -5 → vô nghĩa. Preprocessing là BƯỚC ĐẦU TIÊN và QUAN TRỌNG NHẤT. Giống rửa rau trước khi nấu — rau bẩn thì món ăn hay cũng tệ!"
        >
          {/* ─────────── STEP 2 ── VISUALIZATION ─────────── */}
          <LessonSection
            step={2}
            totalSteps={TOTAL_STEPS}
            label="Khám phá"
          >
            <p className="mb-4 text-sm text-muted leading-relaxed">
              Thử ấn từng nút bên dưới để xem dữ liệu biến đổi thế nào qua{" "}
              <strong className="text-foreground">4 bước tiền xử lý</strong>.
              Quan sát cột bị hightlight và đường phân phối thay đổi.
            </p>

            <VisualizationSection>
              <div className="space-y-5">
                {/* pipeline buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setDeoutliered((v) => !v)}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                      deoutliered
                        ? "bg-amber-500 text-white"
                        : "bg-card border border-border text-muted hover:text-foreground"
                    }`}
                  >
                    {deoutliered ? "✓ " : ""}Remove Outliers
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilled((v) => !v)}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                      filled
                        ? "bg-red-500 text-white"
                        : "bg-card border border-border text-muted hover:text-foreground"
                    }`}
                  >
                    {filled ? "✓ " : ""}Fill Missing
                  </button>
                  <button
                    type="button"
                    onClick={() => setEncoded((v) => !v)}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                      encoded
                        ? "bg-blue-500 text-white"
                        : "bg-card border border-border text-muted hover:text-foreground"
                    }`}
                  >
                    {encoded ? "✓ " : ""}Encode Categorical
                  </button>
                  <button
                    type="button"
                    onClick={() => setNormalized((v) => !v)}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                      normalized
                        ? "bg-emerald-500 text-white"
                        : "bg-card border border-border text-muted hover:text-foreground"
                    }`}
                  >
                    {normalized ? "✓ " : ""}Normalize
                  </button>
                  <button
                    type="button"
                    onClick={resetPipeline}
                    className="ml-auto rounded-lg px-3 py-2 text-xs font-medium text-muted hover:text-foreground"
                  >
                    ↺ Reset
                  </button>
                </div>

                {/* dataset table */}
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-xs">
                    <thead className="bg-surface text-muted">
                      <tr>
                        <th className="px-3 py-2 text-left">id</th>
                        <th className="px-3 py-2 text-left">tuổi</th>
                        <th className="px-3 py-2 text-left">
                          thu_nhập (triệu)
                        </th>
                        <th className="px-3 py-2 text-left">quận</th>
                        <th className="px-3 py-2 text-left">loại</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transformedRows.map((r) => {
                        const isOutlierRow =
                          r.thu_nhap != null && r.thu_nhap > 500;
                        return (
                          <motion.tr
                            key={r.id}
                            initial={false}
                            animate={{
                              backgroundColor: isOutlierRow
                                ? "rgba(245, 158, 11, 0.12)"
                                : "rgba(0,0,0,0)",
                            }}
                            transition={{ duration: 0.3 }}
                            className="border-t border-border font-mono"
                          >
                            <td className="px-3 py-2">{r.id}</td>
                            <td className="px-3 py-2">
                              {formatCell(r.tuoi, "tuoi")}
                            </td>
                            <td className="px-3 py-2">
                              {formatCell(r.thu_nhap, "thu_nhap")}
                            </td>
                            <td className="px-3 py-2">
                              {encoded ? (
                                <span className="text-blue-400">
                                  [
                                  {QUAN_LIST.map((q) =>
                                    q === r.quan ? 1 : 0
                                  ).join(",")}
                                  ]
                                </span>
                              ) : (
                                r.quan
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {encoded ? (
                                <span className="text-blue-400">
                                  [
                                  {LOAI_LIST.map((l) =>
                                    l === r.loai ? 1 : 0
                                  ).join(",")}
                                  ]
                                </span>
                              ) : (
                                r.loai
                              )}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* status bar */}
                <div className="flex items-center justify-between rounded-lg bg-surface px-4 py-2 text-xs">
                  <span className="text-muted">
                    Đã áp dụng{" "}
                    <strong className="text-foreground">
                      {activeStepCount}/4
                    </strong>{" "}
                    bước · Số hàng còn lại:{" "}
                    <strong className="text-foreground">
                      {transformedRows.length}
                    </strong>
                    /{RAW_ROWS.length}
                  </span>
                  <span className="text-muted">
                    {normalized
                      ? "Cột số hiển thị z-score (chuẩn hoá)"
                      : "Cột số hiển thị giá trị thô"}
                  </span>
                </div>

                {/* distribution curves */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-border bg-surface p-3">
                    <p className="mb-2 text-xs font-semibold text-muted">
                      Phân phối thu_nhập — RAW (có outlier)
                    </p>
                    <svg viewBox="0 0 200 70" className="w-full h-auto">
                      <rect
                        x={0}
                        y={0}
                        width={200}
                        height={70}
                        fill="#0f172a"
                        rx={4}
                      />
                      <path
                        d={rawCurve}
                        stroke="#f59e0b"
                        strokeWidth={1.5}
                        fill="none"
                      />
                      <text
                        x={4}
                        y={12}
                        fontSize={7}
                        fill="#94a3b8"
                      >{`mean≈${rawTnMean.toFixed(0)}`}</text>
                    </svg>
                    <p className="mt-1 text-[10px] text-tertiary">
                      Outlier 9999 kéo mean lệch hẳn.
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface p-3">
                    <p className="mb-2 text-xs font-semibold text-muted">
                      Phân phối thu_nhập — sau pipeline ({activeStepCount}/4)
                    </p>
                    <svg viewBox="0 0 200 70" className="w-full h-auto">
                      <rect
                        x={0}
                        y={0}
                        width={200}
                        height={70}
                        fill="#0f172a"
                        rx={4}
                      />
                      <path
                        d={cleanCurve}
                        stroke="#22c55e"
                        strokeWidth={1.5}
                        fill="none"
                      />
                      <text
                        x={4}
                        y={12}
                        fontSize={7}
                        fill="#94a3b8"
                      >{`mean≈${cleanTnMean.toFixed(0)}`}</text>
                    </svg>
                    <p className="mt-1 text-[10px] text-tertiary">
                      Phân phối gần chuẩn hơn, robust hơn với model.
                    </p>
                  </div>
                </div>

                {/* legend / helper */}
                <div className="rounded-lg border border-dashed border-border bg-surface/60 p-3 text-[11px] text-muted leading-relaxed">
                  <strong className="text-foreground">Gợi ý:</strong> thứ tự
                  đề nghị để tránh data leakage là Remove Outliers → Fill
                  Missing → Encode → Normalize. Bạn có thể thử đảo thứ tự để
                  quan sát khác biệt.
                </div>
              </div>
            </VisualizationSection>
          </LessonSection>

          {/* ─────────── STEP 3 ── AHA ─────────── */}
          <LessonSection
            step={3}
            totalSteps={TOTAL_STEPS}
            label="Khoảnh khắc Aha"
          >
            <AhaMoment>
              <p>
                80% thời gian làm ML là{" "}
                <strong>xử lý dữ liệu</strong>, chỉ 20% là train model. Data
                sạch + model đơn giản{" "}
                <strong>thường đánh bại</strong> data bẩn + model phức tạp.{" "}
                <strong>Rửa rau trước khi nấu</strong> — món ăn ngon bắt đầu
                từ khâu chuẩn bị nguyên liệu, không phải bí kíp gia vị!
              </p>
            </AhaMoment>

            <div className="mt-4">
              <Callout variant="insight" title="Nguyên tắc vàng">
                Luôn tách <code>X_train</code>, <code>X_val</code>,{" "}
                <code>X_test</code> TRƯỚC khi xử lý. Sau đó mọi biến đổi học
                từ train set, rồi apply (không fit lại) lên val/test.
              </Callout>
            </div>
          </LessonSection>

          {/* ─────────── STEP 4 ── CHALLENGE ─────────── */}
          <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
            <InlineChallenge
              question="Feature 'thu nhập' (VND): range 5 triệu - 500 triệu. Feature 'tuổi': range 18-65. Dùng KNN. Kết quả bị dominated bởi thu nhập. Fix?"
              options={[
                "Dùng model khác — KNN không phù hợp",
                "StandardScaler: chuyển cả hai về mean=0, std=1. Sau đó KNN nhìn cả tuổi và thu nhập công bằng",
                "Bỏ feature thu nhập — để KNN chỉ nhìn tuổi",
              ]}
              correct={1}
              explanation="Không scale: khoảng cách KNN = sqrt((500M-5M)^2 + (65-18)^2) ≈ sqrt((495M)^2 + 47^2) ≈ 495M. Tuổi bị ignore hoàn toàn! Sau StandardScaler: cả hai features ở scale tương tự → KNN xem xét cả hai công bằng."
            />

            <div className="mt-5">
              <InlineChallenge
                question="Dataset giao dịch ngân hàng. 99.8% giao dịch bình thường, 0.2% là fraud. Bạn fit StandardScaler trên toàn bộ dataset rồi split. Điều gì sai?"
                options={[
                  "Không sai — dataset imbalanced là chuyện thường",
                  "Data leakage: mean/std của toàn bộ set (bao gồm fraud test cases) rò rỉ vào train → model thấy phân phối fraud chưa bao giờ gặp thật sự",
                  "Cần dùng MinMaxScaler thay vì StandardScaler",
                ]}
                correct={1}
                explanation="Kinh điển lỗi data leakage. Cách đúng: split TRƯỚC, fit scaler trên X_train, transform X_val/X_test. Với imbalanced data còn nguy hiểm hơn: các outlier nhỏ trong test ảnh hưởng mean/std toàn cục → train thấy 'ảo' phân phối của test."
              />
            </div>
          </LessonSection>

          {/* ─────────── STEP 5 ── EXPLANATION ─────────── */}
          <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
            <ExplanationSection>
              <p>
                <strong>Data Preprocessing</strong> là tập hợp các bước biến
                dữ liệu thô (bẩn, thiếu, không cùng đơn vị) thành dữ liệu
                sạch, chuẩn hoá, sẵn sàng cho mô hình. Sau bước này ta thường
                sang{" "}
                <TopicLink slug="feature-engineering">
                  feature engineering
                </TopicLink>{" "}
                để tạo thêm đặc trưng có ý nghĩa, rồi chia dữ liệu qua{" "}
                <TopicLink slug="train-val-test">train/val/test</TopicLink>.
              </p>

              <p>
                <strong>5 bước chuẩn của pipeline:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>Missing values:</strong> mean/median/mode
                  imputation, KNN imputation, MICE, hoặc drop.
                </li>
                <li>
                  <strong>Outliers:</strong> IQR, Z-score, Isolation Forest,
                  domain rules.
                </li>
                <li>
                  <strong>Encoding:</strong> OneHot (ít categories), Ordinal
                  (có thứ tự), Target/Leave-one-out (nhiều categories).
                </li>
                <li>
                  <strong>Scaling:</strong> StandardScaler, MinMaxScaler,
                  RobustScaler, QuantileTransformer.
                </li>
                <li>
                  <strong>Feature selection:</strong> correlation, mutual
                  information, L1 regularisation, tree importances.
                </li>
              </ul>

              <LaTeX block>
                {
                  "\\text{Z-score: } z = \\frac{x - \\mu}{\\sigma} \\quad |z| > 3 \\Rightarrow \\text{outlier}"
                }
              </LaTeX>
              <LaTeX block>
                {
                  "\\text{IQR: } [Q_1 - 1.5 \\cdot \\mathrm{IQR}, \\; Q_3 + 1.5 \\cdot \\mathrm{IQR}]"
                }
              </LaTeX>
              <LaTeX block>
                {
                  "\\text{MinMax: } x' = \\frac{x - x_{\\min}}{x_{\\max} - x_{\\min}} \\in [0, 1]"
                }
              </LaTeX>

              <Callout variant="warning" title="Data Leakage">
                QUAN TRỌNG: fit scaler/imputer CHỈ trên train set! Đừng fit
                trên toàn bộ data (bao gồm test) → thông tin test &apos;rò
                rỉ&apos; vào train → kết quả giả tạo. Xem thêm về{" "}
                <TopicLink slug="python-for-ml">Python cho ML</TopicLink> để
                dùng sklearn Pipeline tự động tránh data leakage.
              </Callout>

              <Callout variant="info" title="Scaling nào cho trường hợp nào?">
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>StandardScaler:</strong> phân phối gần chuẩn,
                    linear / gradient-based models.
                  </li>
                  <li>
                    <strong>MinMaxScaler:</strong> cần giới hạn [0,1] (ảnh,
                    neural nets với sigmoid).
                  </li>
                  <li>
                    <strong>RobustScaler:</strong> có outliers (dùng median
                    và IQR thay vì mean/std).
                  </li>
                  <li>
                    <strong>QuantileTransformer:</strong> ép về phân phối
                    chuẩn hoặc uniform — mạnh nhưng che phân phối gốc.
                  </li>
                </ul>
              </Callout>

              <Callout variant="tip" title="Mẹo thực chiến">
                Khi chưa biết nên chọn scaling/imputation nào,{" "}
                <strong>dùng ColumnTransformer với Pipeline</strong> và cross
                validate toàn bộ pipeline. sklearn sẽ làm đúng việc tách
                train/val fold để tránh leakage.
              </Callout>

              <CodeBlock
                language="python"
                title="Pipeline tiền xử lý đúng cách"
              >
                {`from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer

# ── numeric branch ──
numeric_pipeline = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler()),
])

# ── categorical branch ──
categorical_pipeline = Pipeline([
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("encoder", OneHotEncoder(handle_unknown="ignore")),
])

# ── combined preprocessor ──
preprocessor = ColumnTransformer([
    ("num", numeric_pipeline, ["tuoi", "dien_tich", "thu_nhap"]),
    ("cat", categorical_pipeline, ["quan", "loai_nha"]),
])

# ── fit only on train, transform everything else ──
preprocessor.fit(X_train)
X_train_clean = preprocessor.transform(X_train)
X_val_clean   = preprocessor.transform(X_val)    # không fit!
X_test_clean  = preprocessor.transform(X_test)   # không fit!

# Ghép thẳng vào model để tránh leakage trong CV:
from sklearn.ensemble import RandomForestClassifier
full = Pipeline([
    ("prep", preprocessor),
    ("clf",  RandomForestClassifier(n_estimators=200, random_state=42)),
])
full.fit(X_train, y_train)
print("Accuracy:", full.score(X_test, y_test))`}
              </CodeBlock>

              <CodeBlock
                language="python"
                title="RandomForestClassifier — pipeline end-to-end"
              >
                {`from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42,
)

# Pipeline bảo đảm scaler/imputer chỉ fit trên fold train trong mỗi vòng CV
clf = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler",  StandardScaler()),
    ("model",   RandomForestClassifier(
        n_estimators=300,
        max_depth=None,
        n_jobs=-1,
        random_state=42,
    )),
])

scores = cross_val_score(clf, X_train, y_train, cv=5, scoring="roc_auc")
print(f"CV AUC = {scores.mean():.3f} ± {scores.std():.3f}")

clf.fit(X_train, y_train)
print("Test AUC:", clf.score(X_test, y_test))`}
              </CodeBlock>

              <div className="mt-2 rounded-xl border border-border bg-card p-4 text-sm leading-relaxed text-foreground/90">
                <p className="mb-2 font-semibold text-foreground">
                  Checklist &ldquo;sanity check&rdquo; sau khi preprocess
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted">
                  <li>
                    Không còn <code>NaN</code> / <code>None</code> trong{" "}
                    <code>X_train</code>, <code>X_val</code>,{" "}
                    <code>X_test</code>.
                  </li>
                  <li>
                    Với numeric: <code>mean ≈ 0</code>,{" "}
                    <code>std ≈ 1</code> (StandardScaler) hoặc trong{" "}
                    <code>[0, 1]</code> (MinMax).
                  </li>
                  <li>
                    Với categorical: không xuất hiện chuỗi tiếng Việt thô —
                    đã thành số hoặc indicator columns.
                  </li>
                  <li>
                    Shape <code>X_val</code> và <code>X_test</code> khớp với
                    <code>X_train</code> về số cột.
                  </li>
                  <li>
                    Không có feature nào có biến động cực hẹp (std ≈ 0) →
                    những cột này nên drop.
                  </li>
                </ul>
              </div>

              <p className="mt-4">
                <strong>Thứ tự các bước quan trọng</strong>: đảo lộn thứ tự
                sẽ sinh ra kết quả khác. Ví dụ, nếu bạn scale trước khi xử
                lý outlier thì outlier vẫn bóp méo mean/std của scaler, scale
                ra bị lệch. Quy tắc ngón tay cái:
              </p>
              <ol className="list-decimal list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>Split</strong> train/val/test.
                </li>
                <li>
                  <strong>Handle outliers</strong> (cap/drop/log-transform)
                  trên train.
                </li>
                <li>
                  <strong>Impute missing</strong> (median/KNN) trên train.
                </li>
                <li>
                  <strong>Encode categoricals</strong> (OneHot/Ordinal/Target).
                </li>
                <li>
                  <strong>Scale numeric</strong> (StandardScaler/RobustScaler).
                </li>
                <li>
                  <strong>Feature selection</strong> (L1, mutual info, tree
                  importances).
                </li>
                <li>
                  <strong>Fit model</strong> và đánh giá trên val.
                </li>
              </ol>

              <LaTeX block>
                {
                  "\\mathrm{IQR} = Q_3 - Q_1, \\quad \\text{outlier nếu } x < Q_1 - 1.5 \\,\\mathrm{IQR} \\lor x > Q_3 + 1.5 \\,\\mathrm{IQR}"
                }
              </LaTeX>

              <p>
                <strong>Khi nào dùng median thay vì mean?</strong> Khi phân
                phối lệch (skewed) hoặc có outlier. Mean bị kéo bởi giá trị
                cực đoan còn median thì không. Ví dụ giá nhà ở thành phố
                lớn: mean &gt; median vì phân phối lệch phải. Impute bằng
                median mới hợp lý.
              </p>

              <CodeBlock language="python" title="RobustScaler cho dữ liệu có outliers">
                {`from sklearn.preprocessing import RobustScaler
import pandas as pd

# Dữ liệu mô phỏng: thu_nhập với outlier
df = pd.DataFrame({
    "thu_nhap": [25, 30, 40, 55, 60, 9_999],  # outlier cuối
})

scaler = RobustScaler()   # dùng median và IQR thay vì mean/std
df["thu_nhap_scaled"] = scaler.fit_transform(df[["thu_nhap"]])

print(df)
# Outlier không làm méo median/IQR → các giá trị hợp lệ
# được scale về gần 0, outlier bị đẩy ra xa nhưng không kéo
# toàn bộ phân phối lệch như StandardScaler.`}
              </CodeBlock>

              <CodeBlock
                language="python"
                title="KNNImputer — impute theo hàng xóm gần nhất"
              >
                {`from sklearn.impute import KNNImputer
import numpy as np

X = np.array([
    [28,  25, 1],
    [np.nan, 40, 0],
    [45, 60, 1],
    [35, np.nan, 0],
    [52, 35, 1],
])

imputer = KNNImputer(n_neighbors=2, weights="distance")
X_filled = imputer.fit_transform(X)
print(X_filled)

# KNN imputer tìm k hàng gần nhất (theo các feature KHÁC)
# rồi trung bình hoá (weighted) để điền giá trị thiếu.
# Tốt hơn mean imputation vì giữ mối quan hệ giữa features.`}
              </CodeBlock>

              <Callout variant="info" title="Cross-validation thân thiện với Pipeline">
                Thay vì tự viết split → scale → fit → eval lặp lại, hãy đưa
                toàn bộ quy trình vào một Pipeline rồi dùng{" "}
                <code>cross_val_score</code> hoặc{" "}
                <code>GridSearchCV</code>. sklearn đảm bảo mỗi fold tự fit
                preprocessing trên train-fold và transform val-fold — đúng
                bản chất của một đánh giá honest.
              </Callout>

              <CollapsibleDetail title="Chi tiết: vì sao Pipeline tránh được data leakage trong CV">
                <p className="text-sm text-muted leading-relaxed">
                  Khi bạn gọi{" "}
                  <code className="text-foreground">
                    cross_val_score(pipeline, X, y, cv=5)
                  </code>
                  , sklearn lặp 5 lần. Trong mỗi lần, dữ liệu được chia
                  train/val theo fold rồi TOÀN BỘ pipeline được fit trên
                  train-fold và đánh giá trên val-fold. Vì vậy imputer và
                  scaler chỉ &quot;nhìn&quot; train-fold.
                </p>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  Nếu bạn tự viết <code>scaler.fit(X)</code> trước khi gọi
                  cross_val_score, scaler đã thấy toàn bộ X → thông tin val
                  đã rò rỉ vào transform của train → metric CV tăng ảo. Đây
                  là lý do Pipeline được xem là best practice &quot;default
                  on&quot; trong sklearn.
                </p>
              </CollapsibleDetail>

              <CollapsibleDetail title="Chi tiết: Target encoding có bị leak không?">
                <p className="text-sm text-muted leading-relaxed">
                  Target encoding thay category bằng aggregate của target (vd
                  mean giá_nhà theo quận). Nếu bạn tính mean trên toàn bộ
                  train trước CV, thông tin của fold val rò rỉ vào encoding
                  của fold train.
                </p>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  Lời giải: dùng <code>category_encoders.TargetEncoder</code>{" "}
                  bên trong Pipeline, hoặc{" "}
                  <code>OutOfFoldTargetEncoder</code>: với mỗi row, encoding
                  tính từ các row KHÁC FOLD. Regularise thêm với{" "}
                  <em>smoothing</em> (blend global mean + category mean theo
                  cỡ nhóm) để tránh overfit trên category hiếm.
                </p>
              </CollapsibleDetail>
            </ExplanationSection>
          </LessonSection>

              <p className="mt-4">
                <strong>Pitfall thực tế:</strong> nhiều dataset có feature
                &ldquo;ngày tạo&rdquo; hoặc &ldquo;timestamp&rdquo;. Nếu bạn
                split ngẫu nhiên thì train có thể chứa ngày tương lai so với
                test → thông tin &ldquo;tương lai&rdquo; rò rỉ. Với time-
                series luôn split theo thời gian, scale dùng statistics của
                window quá khứ.
              </p>

              <LaTeX block>
                {
                  "\\text{Log-transform: } x' = \\log(1 + x) \\quad \\text{(skew phải → phân phối cân đối hơn)}"
                }
              </LaTeX>

              <CodeBlock
                language="python"
                title="Xử lý skewed feature bằng log1p"
              >
                {`import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler

df = pd.DataFrame({
    "gia_nha": [3.2, 3.8, 4.5, 5.1, 6.0, 7.8, 9.2, 15.0, 80.0],  # tỷ
})

# Bước 1: log1p — nén đuôi phải
df["log_gia"] = np.log1p(df["gia_nha"])

# Bước 2: StandardScaler trên log-space
scaler = StandardScaler()
df["log_gia_scaled"] = scaler.fit_transform(df[["log_gia"]])

print(df.describe())
# Phân phối log_gia_scaled gần chuẩn hơn nhiều so với
# gia_nha_scaled — gradient descent và các model tuyến tính
# học ổn định hơn.`}
              </CodeBlock>

              <div className="mt-2 rounded-xl border border-border bg-card p-4 text-sm leading-relaxed text-foreground/90">
                <p className="mb-2 font-semibold text-foreground">
                  Tại sao tree-based models không cần scaling?
                </p>
                <p className="text-muted">
                  Cây quyết định chia nhánh dựa trên điều kiện{" "}
                  <em>x &lt; threshold</em>. Scaling chỉ đổi đơn vị của{" "}
                  <em>x</em> nhưng không đổi thứ tự các điểm — nên kết quả
                  split giữ nguyên. Vì vậy RandomForest, XGBoost, LightGBM,
                  CatBoost chạy tốt trên dữ liệu thô (chỉ cần impute missing
                  và encode categorical).
                </p>
                <p className="mt-2 text-muted">
                  Ngược lại, KNN / SVM với kernel RBF / linear regression /
                  logistic regression / neural network PHẢI scale, vì dùng
                  khoảng cách hoặc gradient descent trên feature space.
                </p>
              </div>

              <div className="mt-4 rounded-xl border border-border bg-card p-4 text-sm leading-relaxed text-foreground/90">
                <p className="mb-2 font-semibold text-foreground">
                  Khi nào nên drop feature thay vì impute?
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted">
                  <li>
                    Feature có <strong>&gt; 60% missing</strong> và không
                    thấy pattern rõ — thường drop.
                  </li>
                  <li>
                    Feature <strong>gần như không biến động</strong>{" "}
                    (<code>std ≈ 0</code>) — không có tín hiệu.
                  </li>
                  <li>
                    Feature <strong>highly correlated</strong> với feature
                    khác (r &gt; 0.95) — giữ 1 cái, bỏ cái còn lại.
                  </li>
                  <li>
                    Feature bị <strong>data leakage</strong> (biết tương
                    lai, biết label) — drop NGAY lập tức.
                  </li>
                </ul>
              </div>

              <p className="mt-4">
                <strong>Một ví dụ hoàn chỉnh.</strong> Hãy hình dung bạn xây
                model dự đoán khách có vay hay không từ form ngân hàng.
                Dataset gồm 25 cột: 18 numeric (tuổi, thu nhập, số nợ, điểm
                tín dụng, số tháng làm việc, ...), 7 categorical (tỉnh,
                nghề, loại nhà, tình trạng hôn nhân, ...). 8% rows có ít
                nhất 1 missing. 2 rows có thu nhập &gt; 10 tỷ/tháng (outlier
                — nhập nhầm đơn vị).
              </p>

              <ol className="mt-2 list-decimal list-inside space-y-1 pl-2 text-sm">
                <li>
                  Split stratified theo label (approve/reject) với tỉ lệ
                  70/15/15.
                </li>
                <li>
                  Trên train: đánh dấu 2 rows outlier, quyết định là lỗi
                  nhập → sửa hoặc drop.
                </li>
                <li>
                  Impute missing numeric bằng median của train, missing
                  categorical bằng mode của train.
                </li>
                <li>
                  OneHot cho 7 cột categorical → ~40 columns. Nếu có column
                  quá nhiều levels (vd &ldquo;tỉnh&rdquo; 63 levels) xem xét
                  target encoding.
                </li>
                <li>
                  StandardScaler cho 18 numeric column. OneHot column là 0/1
                  nên không cần scale (đã ở cùng scale).
                </li>
                <li>
                  Huấn luyện baseline LogisticRegression với{" "}
                  <code>class_weight=&quot;balanced&quot;</code>, rồi thử
                  RandomForest/XGBoost.
                </li>
                <li>
                  Đánh giá bằng ROC-AUC trên val set, tune hyperparameters
                  bằng GridSearchCV.
                </li>
              </ol>

              <p className="mt-3">
                Quy trình trên được đóng gói trong 1 Pipeline duy nhất — khi
                deploy ta chỉ gọi <code>pipeline.predict(new_row)</code> và
                mọi bước preprocessing được áp dụng tự động, không lo lệch
                train/serving.
              </p>

              <CodeBlock
                language="python"
                title="Serialise pipeline để dùng cho serving"
              >
                {`import joblib

# Sau khi fit xong trên train
full.fit(X_train, y_train)

# Lưu toàn bộ pipeline (preprocessor + model) ra 1 file
joblib.dump(full, "loan_model.joblib")

# Tại API serving:
model = joblib.load("loan_model.joblib")

def predict(row: dict) -> float:
    import pandas as pd
    X_new = pd.DataFrame([row])          # 1 row, các cột như train
    proba = model.predict_proba(X_new)    # preprocessing chạy tự động
    return float(proba[0, 1])             # xác suất "approve"

# Lưu ý khi deploy:
#   1. Dùng CÙNG schema (tên cột, dtype) với X_train.
#   2. Với categorical mới chưa từng thấy, OneHotEncoder(handle_unknown="ignore")
#      sẽ cho vector 0 — tránh crash.
#   3. Bật logging để phát hiện drift sớm.`}
              </CodeBlock>

              <p className="mt-4 text-sm text-muted">
                Với người mới, ghi nhớ mantra: <em>&ldquo;split đầu tiên,
                Pipeline khi nào cũng được, leakage là kẻ thù số một&rdquo;</em>.
                Chỉ cần giữ đúng 3 nguyên tắc này, 80% bug preprocessing
                trong sự nghiệp ML của bạn sẽ tự biến mất.
              </p>

          {/* ─────────── STEP 6 ── SUMMARY ─────────── */}
          <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
            <MiniSummary
              points={[
                "Preprocessing = 80% thời gian ML. 'Garbage in, garbage out' — data sạch là nền tảng.",
                "5 bước: Missing values → Outliers → Encoding → Scaling → Feature Selection.",
                "KHÔNG fit scaler/imputer trên test data — data leakage làm kết quả giả tạo.",
                "StandardScaler cho gradient-based models và KNN. Tree-based models thường không cần scaling.",
                "Dùng sklearn Pipeline + ColumnTransformer để tự động tránh leakage khi cross validate.",
                "Target/Ordinal encoding phù hợp cho high-cardinality; OneHot cho ít categories và không có thứ tự.",
              ]}
            />

            <div className="mt-4">
              <StepReveal
                labels={["Split", "Clean", "Encode", "Scale", "Fit model"]}
              >
                <div className="rounded-lg border border-border bg-surface p-3 text-xs text-muted">
                  <strong className="text-foreground">Bước 1 — Split:</strong>{" "}
                  chia dữ liệu thành train/val/test trước TIÊN NHẤT, trước cả
                  khi inspect statistics.
                </div>
                <div className="rounded-lg border border-border bg-surface p-3 text-xs text-muted">
                  <strong className="text-foreground">Bước 2 — Clean:</strong>{" "}
                  xử lý missing và outliers chỉ dựa trên statistics của train
                  set.
                </div>
                <div className="rounded-lg border border-border bg-surface p-3 text-xs text-muted">
                  <strong className="text-foreground">
                    Bước 3 — Encode:
                  </strong>{" "}
                  OneHot/Ordinal/Target. Fit encoder trên train, transform
                  val/test.
                </div>
                <div className="rounded-lg border border-border bg-surface p-3 text-xs text-muted">
                  <strong className="text-foreground">Bước 4 — Scale:</strong>{" "}
                  StandardScaler/MinMaxScaler/RobustScaler. Giữ scaler để
                  apply cho data mới khi deploy.
                </div>
                <div className="rounded-lg border border-border bg-surface p-3 text-xs text-muted">
                  <strong className="text-foreground">
                    Bước 5 — Fit model:
                  </strong>{" "}
                  huấn luyện, đánh giá trên val, tune hyperparameters, cuối
                  cùng test.
                </div>
              </StepReveal>
            </div>
          </LessonSection>

          {/* ─────────── STEP 7 ── QUIZ ─────────── */}
          <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
            <p className="mb-3 text-sm text-muted leading-relaxed">
              8 câu hỏi bao phủ cả 5 bước pipeline cùng best-practice thực
              chiến. Trả lời hết để xem kết quả tổng thể.
            </p>
            <QuizSection questions={QUIZ_QUESTIONS} />

            <div className="mt-6 rounded-xl border border-border bg-surface/60 p-4 text-xs text-muted leading-relaxed">
              <p className="mb-1 font-semibold text-foreground">
                Bước tiếp theo
              </p>
              <p>
                Sau khi data đã sạch, bạn chuyển sang{" "}
                <TopicLink slug="feature-engineering">
                  Feature engineering
                </TopicLink>{" "}
                để tạo biến hữu ích, rồi{" "}
                <TopicLink slug="train-val-test">
                  chia train/val/test
                </TopicLink>{" "}
                để đánh giá trung thực.
              </p>
            </div>
          </LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
