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

/* ═══════════════════════════════════════════════════════════════════════════
 *                                METADATA
 * Chủ đề: Bias & Fairness trong AI
 * Trọng tâm trực quan hoá: mô phỏng mô hình tuyển dụng hai nhóm ứng viên
 * (Nhóm A và Nhóm B), so sánh ba tiêu chí công bằng phổ biến:
 *    • Demographic Parity (đồng đều tỷ lệ tích cực)
 *    • Equal Opportunity (đồng đều TPR)
 *    • Equalized Odds (đồng đều cả TPR và FPR)
 * Người học sẽ thấy trực tiếp nhóm nào được lợi, nhóm nào bị thiệt,
 * và disparity rate ở mỗi chỉ số.
 * ═══════════════════════════════════════════════════════════════════════════ */
export const metadata: TopicMeta = {
  slug: "bias-fairness",
  title: "Bias & Fairness",
  titleVi: "Thiên kiến & Công bằng trong AI",
  description:
    "Nhận diện và giảm thiểu các thiên kiến trong dữ liệu và mô hình AI để đảm bảo kết quả công bằng cho mọi nhóm.",
  category: "ai-safety",
  tags: ["bias", "fairness", "ethics", "discrimination"],
  difficulty: "intermediate",
  relatedSlugs: ["alignment", "explainability", "ai-governance"],
  vizType: "interactive",
};

/* ═══════════════════════════════════════════════════════════════════════════
 *                           HẰNG SỐ & DỮ LIỆU MÔ PHỎNG
 * ═══════════════════════════════════════════════════════════════════════════ */
const TOTAL_STEPS = 10;

/* Nhãn ba tiêu chí công bằng được hỗ trợ trong viz */
const FAIRNESS_METRICS = [
  {
    id: "demographic-parity",
    label: "Demographic Parity",
    labelVi: "Đồng đều tỷ lệ tích cực",
    formula: "P(\\hat{Y}=1 | A=a) \\text{ bằng nhau } \\forall a",
    short:
      "Tỷ lệ được tuyển phải như nhau giữa hai nhóm, bất kể khả năng thực tế.",
    color: "#3b82f6",
  },
  {
    id: "equal-opportunity",
    label: "Equal Opportunity",
    labelVi: "Đồng đều cơ hội",
    formula: "P(\\hat{Y}=1 | Y=1, A=a) \\text{ bằng nhau } \\forall a",
    short:
      "Trong những người THỰC SỰ phù hợp, tỷ lệ được mô hình chấp nhận phải như nhau.",
    color: "#22c55e",
  },
  {
    id: "equalized-odds",
    label: "Equalized Odds",
    labelVi: "Đồng đều TPR + FPR",
    formula:
      "P(\\hat{Y}=1 | Y=y, A=a) \\text{ bằng nhau } \\forall y, a",
    short:
      "Vừa TPR, vừa FPR đều phải bằng nhau giữa các nhóm — tiêu chí nghiêm ngặt nhất.",
    color: "#f59e0b",
  },
] as const;

type MetricId = (typeof FAIRNESS_METRICS)[number]["id"];

/* ────────────────────────────────────────────────────────────────────────────
 * Dữ liệu ứng viên mô phỏng cho demo tuyển dụng
 *  - Group A: nhóm đa số trong dữ liệu huấn luyện (72% mẫu, lịch sử được tuyển
 *    nhiều). Mô hình học bias nên có xu hướng cho điểm cao hơn.
 *  - Group B: nhóm thiểu số (28% mẫu), mô hình chưa "nghe" đủ nên cho điểm
 *    thấp hơn một cách hệ thống.
 *
 * Mỗi ứng viên có:
 *  - groundTruth: thực sự có phù hợp với vị trí không (Y ∈ {0, 1})
 *  - score: điểm mô hình dự đoán (0..1)
 * ──────────────────────────────────────────────────────────────────────────── */
interface Candidate {
  id: string;
  group: "A" | "B";
  groundTruth: 0 | 1;
  score: number;
}

/* 20 ứng viên mỗi nhóm — đủ để thấy disparity rõ ràng */
const CANDIDATES_A: Candidate[] = [
  { id: "A01", group: "A", groundTruth: 1, score: 0.92 },
  { id: "A02", group: "A", groundTruth: 1, score: 0.88 },
  { id: "A03", group: "A", groundTruth: 1, score: 0.84 },
  { id: "A04", group: "A", groundTruth: 1, score: 0.81 },
  { id: "A05", group: "A", groundTruth: 1, score: 0.77 },
  { id: "A06", group: "A", groundTruth: 1, score: 0.74 },
  { id: "A07", group: "A", groundTruth: 1, score: 0.71 },
  { id: "A08", group: "A", groundTruth: 1, score: 0.68 },
  { id: "A09", group: "A", groundTruth: 0, score: 0.65 },
  { id: "A10", group: "A", groundTruth: 0, score: 0.62 },
  { id: "A11", group: "A", groundTruth: 1, score: 0.58 },
  { id: "A12", group: "A", groundTruth: 0, score: 0.54 },
  { id: "A13", group: "A", groundTruth: 0, score: 0.5 },
  { id: "A14", group: "A", groundTruth: 1, score: 0.47 },
  { id: "A15", group: "A", groundTruth: 0, score: 0.42 },
  { id: "A16", group: "A", groundTruth: 0, score: 0.38 },
  { id: "A17", group: "A", groundTruth: 0, score: 0.33 },
  { id: "A18", group: "A", groundTruth: 0, score: 0.28 },
  { id: "A19", group: "A", groundTruth: 0, score: 0.22 },
  { id: "A20", group: "A", groundTruth: 0, score: 0.15 },
];

const CANDIDATES_B: Candidate[] = [
  { id: "B01", group: "B", groundTruth: 1, score: 0.78 },
  { id: "B02", group: "B", groundTruth: 1, score: 0.72 },
  { id: "B03", group: "B", groundTruth: 1, score: 0.68 },
  { id: "B04", group: "B", groundTruth: 1, score: 0.63 },
  { id: "B05", group: "B", groundTruth: 1, score: 0.58 },
  { id: "B06", group: "B", groundTruth: 1, score: 0.54 },
  { id: "B07", group: "B", groundTruth: 1, score: 0.51 },
  { id: "B08", group: "B", groundTruth: 1, score: 0.47 },
  { id: "B09", group: "B", groundTruth: 0, score: 0.44 },
  { id: "B10", group: "B", groundTruth: 0, score: 0.41 },
  { id: "B11", group: "B", groundTruth: 1, score: 0.38 },
  { id: "B12", group: "B", groundTruth: 0, score: 0.35 },
  { id: "B13", group: "B", groundTruth: 0, score: 0.32 },
  { id: "B14", group: "B", groundTruth: 1, score: 0.29 },
  { id: "B15", group: "B", groundTruth: 0, score: 0.25 },
  { id: "B16", group: "B", groundTruth: 0, score: 0.22 },
  { id: "B17", group: "B", groundTruth: 0, score: 0.18 },
  { id: "B18", group: "B", groundTruth: 0, score: 0.15 },
  { id: "B19", group: "B", groundTruth: 0, score: 0.12 },
  { id: "B20", group: "B", groundTruth: 0, score: 0.08 },
];

const ALL_CANDIDATES: Candidate[] = [...CANDIDATES_A, ...CANDIDATES_B];

/* Hàm hỗ trợ tính các chỉ số công bằng */
function computeRates(
  candidates: Candidate[],
  thresholdA: number,
  thresholdB: number,
) {
  const groupA = candidates.filter((c) => c.group === "A");
  const groupB = candidates.filter((c) => c.group === "B");

  function rates(group: Candidate[], th: number) {
    const predictedPositive = group.filter((c) => c.score >= th);
    const actualPositive = group.filter((c) => c.groundTruth === 1);
    const actualNegative = group.filter((c) => c.groundTruth === 0);
    const tp = predictedPositive.filter((c) => c.groundTruth === 1).length;
    const fp = predictedPositive.filter((c) => c.groundTruth === 0).length;
    const selectionRate = predictedPositive.length / group.length;
    const tpr = actualPositive.length === 0 ? 0 : tp / actualPositive.length;
    const fpr = actualNegative.length === 0 ? 0 : fp / actualNegative.length;
    return { selectionRate, tpr, fpr };
  }

  return {
    A: rates(groupA, thresholdA),
    B: rates(groupB, thresholdB),
  };
}

/* Với mỗi metric, chọn cặp ngưỡng (thA, thB) "gần công bằng" nhất.
 * Trong demo này, chúng ta minh hoạ hai chế độ:
 *   - Baseline: cùng một ngưỡng 0.5 cho cả hai nhóm (thường tạo disparity).
 *   - Fair: điều chỉnh ngưỡng riêng cho nhóm B để thoả tiêu chí.
 */
interface MetricScenario {
  threshA: number;
  threshB: number;
  disparityLabel: string;
  disparityValue: number; /* 0..1, số càng lớn càng mất công bằng */
  advantaged: "A" | "B" | "none";
  disadvantaged: "A" | "B" | "none";
}

function scenarioForMetric(metric: MetricId): MetricScenario {
  /* Baseline threshold 0.5 cho cả hai nhóm */
  const baseline = computeRates(ALL_CANDIDATES, 0.5, 0.5);

  if (metric === "demographic-parity") {
    const diff = Math.abs(baseline.A.selectionRate - baseline.B.selectionRate);
    return {
      threshA: 0.5,
      threshB: 0.5,
      disparityLabel: "Chênh lệch tỷ lệ tuyển dụng (DP gap)",
      disparityValue: diff,
      advantaged: baseline.A.selectionRate > baseline.B.selectionRate ? "A" : "B",
      disadvantaged:
        baseline.A.selectionRate > baseline.B.selectionRate ? "B" : "A",
    };
  }

  if (metric === "equal-opportunity") {
    const diff = Math.abs(baseline.A.tpr - baseline.B.tpr);
    return {
      threshA: 0.5,
      threshB: 0.5,
      disparityLabel: "Chênh lệch TPR (EO gap)",
      disparityValue: diff,
      advantaged: baseline.A.tpr > baseline.B.tpr ? "A" : "B",
      disadvantaged: baseline.A.tpr > baseline.B.tpr ? "B" : "A",
    };
  }

  /* Equalized Odds: tổng hợp cả TPR và FPR */
  const tprDiff = Math.abs(baseline.A.tpr - baseline.B.tpr);
  const fprDiff = Math.abs(baseline.A.fpr - baseline.B.fpr);
  const combined = (tprDiff + fprDiff) / 2;
  return {
    threshA: 0.5,
    threshB: 0.5,
    disparityLabel: "Trung bình |ΔTPR| và |ΔFPR| (EOdds gap)",
    disparityValue: combined,
    advantaged: baseline.A.tpr + baseline.A.fpr > baseline.B.tpr + baseline.B.fpr ? "A" : "B",
    disadvantaged:
      baseline.A.tpr + baseline.A.fpr > baseline.B.tpr + baseline.B.fpr ? "B" : "A",
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
 *                                 QUIZ (8 câu)
 * ═══════════════════════════════════════════════════════════════════════════ */
const QUIZ: QuizQuestion[] = [
  {
    question:
      "Hệ thống AI tuyển dụng tại Việt Nam từ chối hồ sơ từ miền Trung nhiều hơn miền Bắc/Nam. Nguyên nhân chính có thể là gì?",
    options: [
      "Ứng viên miền Trung yếu hơn",
      "Dữ liệu huấn luyện chứa ít hồ sơ thành công từ miền Trung, nên mô hình 'học' rằng miền Trung ít phù hợp (data bias)",
      "AI có ý thức phân biệt vùng miền",
      "Lỗi kỹ thuật ngẫu nhiên trong hệ thống",
    ],
    correct: 1,
    explanation:
      "Data bias: nếu dữ liệu huấn luyện chủ yếu chứa hồ sơ từ Hà Nội và TP.HCM (vì tuyển dụng tập trung ở đó), mô hình sẽ 'học' pattern 'miền Trung = ít thành công'. Bias không cần AI có ý thức — nó tự động phản ánh sự mất cân bằng trong dữ liệu.",
  },
  {
    question: "Demographic Parity yêu cầu gì?",
    options: [
      "Tất cả nhóm có accuracy bằng nhau",
      "Tỷ lệ kết quả tích cực (VD: được duyệt tuyển) phải bằng nhau giữa các nhóm nhân khẩu học",
      "Mô hình không được biết thông tin nhân khẩu học",
      "Mỗi nhóm có số lượng bằng nhau trong dữ liệu",
    ],
    correct: 1,
    explanation:
      "Demographic Parity: P(Ŷ=1 | A=0) = P(Ŷ=1 | A=1). VD: tỷ lệ được tuyển phải bằng nhau giữa Group A và Group B. Hạn chế: nếu hai nhóm thực sự có tỷ lệ phù hợp khác nhau, DP có thể ép mô hình tuyển cả ứng viên không phù hợp trong nhóm thiểu số.",
  },
  {
    question:
      "Khác biệt quan trọng nhất giữa Equal Opportunity và Equalized Odds là gì?",
    options: [
      "EO chỉ yêu cầu True Positive Rate (TPR) bằng nhau; Equalized Odds yêu cầu CẢ TPR lẫn False Positive Rate (FPR) bằng nhau",
      "EO áp dụng cho classification, Equalized Odds áp dụng cho regression",
      "EO dễ tính hơn vì chỉ cần một ngưỡng",
      "Không có khác biệt, chỉ là tên gọi khác",
    ],
    correct: 0,
    explanation:
      "Equal Opportunity chỉ đòi hỏi TPR bằng giữa các nhóm (trong những người thật sự phù hợp, tỷ lệ được chọn bằng nhau). Equalized Odds nghiêm ngặt hơn: cả TPR và FPR đều phải bằng, tức là cả người phù hợp và không phù hợp đều được đối xử như nhau giữa các nhóm.",
  },
  {
    question:
      "Bạn đang audit một mô hình chấm điểm tín dụng. Group A có selection rate 60%, Group B có selection rate 30%. Về mặt demographic parity, disparity gap là bao nhiêu?",
    options: [
      "0.30 (hay 30 điểm phần trăm)",
      "0.50",
      "0.90",
      "Không thể tính nếu không biết ground truth",
    ],
    correct: 0,
    explanation:
      "DP gap = |P(Ŷ=1|A) - P(Ŷ=1|B)| = |0.60 - 0.30| = 0.30. Theo quy ước 'four-fifths rule' của US EEOC, nếu tỷ lệ tuyển của nhóm thiểu số < 80% của nhóm đa số thì bị coi là disparate impact — ở đây 0.30/0.60 = 0.50, vi phạm rõ ràng.",
  },
  {
    type: "fill-blank",
    question:
      "Bias trong AI thường bắt nguồn từ {blank} không cân bằng, sau đó mô hình khuếch đại và gây ra {blank} với các nhóm yếu thế.",
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
      "Chuỗi phổ biến: dữ liệu huấn luyện phản ánh bias xã hội (ví dụ ít hồ sơ thành công từ một nhóm) → mô hình học bias đó → triển khai ở quy mô lớn → phân biệt đối xử hệ thống. Kiểm soát cần bắt đầu từ audit dữ liệu.",
  },
  {
    question:
      "Một mô hình có cùng threshold 0.5 cho cả hai nhóm, nhưng Group B có distribution của điểm mô hình thấp hơn một cách hệ thống. Bạn nên làm gì để đạt Equal Opportunity?",
    options: [
      "Giữ nguyên threshold, vì công bằng nghĩa là 'cùng luật cho mọi người'",
      "Giảm threshold riêng cho Group B (group-specific threshold) để TPR của B khớp TPR của A",
      "Thu thập thêm dữ liệu cho Group A để cân bằng",
      "Bỏ hoàn toàn thông tin nhóm — mô hình 'mù màu' là giải pháp tốt nhất",
    ],
    correct: 1,
    explanation:
      "Post-processing với group-specific threshold là kỹ thuật kinh điển (Hardt et al., 2016). Giữ nguyên cùng threshold trên hai distribution khác nhau chính là nguồn gốc của bất công; 'fairness through unawareness' (bỏ feature nhạy cảm) không hiệu quả vì các feature khác có thể là proxy.",
  },
  {
    question:
      "Bạn phát hiện AI chatbot dùng ngôn ngữ formal hơn khi trả lời người dùng tên 'Nguyễn Văn A' nhưng casual hơn với 'John Smith'. Đây là loại bias nào?",
    options: [
      "Selection bias — chọn dữ liệu không đại diện",
      "Representation bias — mô hình học rằng tên Việt = formal, tên Anh = casual từ dữ liệu training",
      "Measurement bias — đo lường sai",
      "Không phải bias — đây là hành vi phù hợp văn hoá",
    ],
    correct: 1,
    explanation:
      "Đây là representation bias: mô hình học association giữa tên (proxy cho ethnicity) và phong cách ngôn ngữ từ dữ liệu training. Dù có thể vô tình phù hợp văn hoá, việc phân biệt đối xử dựa trên tên vẫn là bias cần kiểm soát, đặc biệt khi người dùng không chọn được trải nghiệm.",
  },
  {
    question:
      "Tại sao KHÔNG thể đạt đồng thời cả Demographic Parity, Equal Opportunity VÀ Equalized Odds trong hầu hết trường hợp?",
    options: [
      "Vì thiếu dữ liệu — nếu có đủ data thì cả ba đều đạt được",
      "Vì các tiêu chí này mâu thuẫn toán học khi base rate (tỷ lệ Y=1) khác nhau giữa các nhóm — định lý bất khả thi của Chouldechova & Kleinberg",
      "Vì các thư viện fairness chưa hỗ trợ tất cả tiêu chí cùng lúc",
      "Vì các tiêu chí này chỉ áp dụng cho regression chứ không phải classification",
    ],
    correct: 1,
    explanation:
      "Impossibility theorem (Chouldechova 2017, Kleinberg et al. 2016): khi base rate P(Y=1|A=a) khác nhau giữa các nhóm, KHÔNG thể đồng thời đạt calibration, equalized FPR và equalized FNR. Tổ chức buộc phải CHỌN tiêu chí ưu tiên dựa trên đạo đức và pháp luật — không có công thức 'công bằng tuyệt đối'.",
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
 *                          SUB-COMPONENT: CandidateDot
 *  Vẽ một ứng viên dưới dạng chấm tròn. Màu sắc thể hiện:
 *   - groundTruth=1 → viền xanh lục (thực sự phù hợp)
 *   - groundTruth=0 → viền xám (thực sự không phù hợp)
 *   - score >= threshold → fill đậm (được mô hình chấp nhận)
 *   - score < threshold → fill nhạt (bị từ chối)
 * ═══════════════════════════════════════════════════════════════════════════ */
interface CandidateDotProps {
  candidate: Candidate;
  threshold: number;
  cx: number;
  cy: number;
}

function CandidateDot({ candidate, threshold, cx, cy }: CandidateDotProps) {
  const accepted = candidate.score >= threshold;
  const truthColor = candidate.groundTruth === 1 ? "#22c55e" : "#94a3b8";
  const fill = accepted
    ? candidate.group === "A"
      ? "#3b82f6"
      : "#f59e0b"
    : "#1e293b";

  return (
    <g>
      <motion.circle
        cx={cx}
        cy={cy}
        r={8}
        fill={fill}
        stroke={truthColor}
        strokeWidth={2}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      />
      {candidate.groundTruth === 1 && accepted && (
        <text
          x={cx}
          y={cy + 3}
          textAnchor="middle"
          fontSize={8}
          fill="white"
          fontWeight="bold"
        >
          ✓
        </text>
      )}
      {candidate.groundTruth === 0 && accepted && (
        <text
          x={cx}
          y={cy + 3}
          textAnchor="middle"
          fontSize={8}
          fill="white"
          fontWeight="bold"
        >
          ✗
        </text>
      )}
    </g>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 *                       SUB-COMPONENT: DisparityBar
 *  Thanh biểu đồ ngang so sánh một chỉ số (selection rate, TPR hay FPR)
 *  giữa hai nhóm. Hiển thị giá trị phần trăm và gap.
 * ═══════════════════════════════════════════════════════════════════════════ */
interface DisparityBarProps {
  label: string;
  valueA: number;
  valueB: number;
  highlight?: boolean;
}

function DisparityBar({ label, valueA, valueB, highlight }: DisparityBarProps) {
  const pctA = Math.round(valueA * 100);
  const pctB = Math.round(valueB * 100);
  const gap = Math.abs(pctA - pctB);
  const advantaged = pctA > pctB ? "A" : pctB > pctA ? "B" : "—";

  return (
    <div
      className={`rounded-lg border p-3 ${
        highlight
          ? "border-accent bg-accent/5"
          : "border-border bg-background/50"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-foreground">{label}</span>
        <span className="text-xs text-muted">
          Gap: <strong className="text-foreground">{gap}%</strong>
          {advantaged !== "—" && (
            <>
              {" "}
              · Nhóm <strong className="text-foreground">{advantaged}</strong>{" "}
              lợi thế
            </>
          )}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="w-14 text-[10px] font-semibold text-blue-500">
            Nhóm A
          </span>
          <div className="flex-1 h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <motion.div
              className="h-full bg-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${pctA}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <span className="w-10 text-[10px] font-bold text-blue-600 text-right">
            {pctA}%
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-14 text-[10px] font-semibold text-amber-600">
            Nhóm B
          </span>
          <div className="flex-1 h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <motion.div
              className="h-full bg-amber-500"
              initial={{ width: 0 }}
              animate={{ width: `${pctB}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <span className="w-10 text-[10px] font-bold text-amber-600 text-right">
            {pctB}%
          </span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 *                         SUB-COMPONENT: HiringDemo
 *  Hiển thị đầy đủ mô phỏng tuyển dụng:
 *    - 20 ứng viên Group A và 20 ứng viên Group B xếp theo score
 *    - Thanh threshold có thể kéo (mỗi nhóm một threshold riêng)
 *    - Bảng chỉ số ba tiêu chí công bằng
 *    - Nút chuyển tab giữa ba metric
 * ═══════════════════════════════════════════════════════════════════════════ */
interface HiringDemoProps {
  metric: MetricId;
  onMetricChange: (m: MetricId) => void;
  threshA: number;
  threshB: number;
  onThreshAChange: (v: number) => void;
  onThreshBChange: (v: number) => void;
}

function HiringDemo({
  metric,
  onMetricChange,
  threshA,
  threshB,
  onThreshAChange,
  onThreshBChange,
}: HiringDemoProps) {
  const rates = useMemo(
    () => computeRates(ALL_CANDIDATES, threshA, threshB),
    [threshA, threshB],
  );

  const gapSelection = Math.abs(rates.A.selectionRate - rates.B.selectionRate);
  const gapTPR = Math.abs(rates.A.tpr - rates.B.tpr);
  const gapFPR = Math.abs(rates.A.fpr - rates.B.fpr);

  /* Trục dọc vẽ thanh score [0..1] */
  const chartHeight = 360;
  const chartWidth = 520;
  const colAx = 120;
  const colBx = 360;

  function yForScore(s: number) {
    return 30 + (1 - s) * (chartHeight - 60);
  }

  const currentMetric =
    FAIRNESS_METRICS.find((m) => m.id === metric) ?? FAIRNESS_METRICS[0];

  return (
    <div className="space-y-5">
      {/* Tab chọn metric */}
      <div className="flex flex-wrap gap-2">
        {FAIRNESS_METRICS.map((m) => {
          const active = m.id === metric;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onMetricChange(m.id)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                active
                  ? "bg-accent text-white"
                  : "bg-card border border-border text-muted hover:text-foreground"
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Mô tả metric hiện tại */}
      <div className="rounded-lg border border-border bg-card p-3 space-y-2">
        <div className="flex items-baseline gap-2">
          <h4 className="text-sm font-bold text-foreground">
            {currentMetric.label}
          </h4>
          <span className="text-xs text-muted">({currentMetric.labelVi})</span>
        </div>
        <div className="overflow-x-auto">
          <LaTeX block>{currentMetric.formula}</LaTeX>
        </div>
        <p className="text-xs text-muted">{currentMetric.short}</p>
      </div>

      {/* SVG chính */}
      <div className="rounded-lg border border-border bg-background p-3">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full max-w-2xl mx-auto"
        >
          {/* Tiêu đề */}
          <text
            x={chartWidth / 2}
            y={18}
            textAnchor="middle"
            fill="currentColor"
            fontSize={12}
            fontWeight="bold"
            className="text-foreground"
          >
            Mô hình tuyển dụng — điểm dự đoán theo nhóm
          </text>

          {/* Cột Group A */}
          <g>
            <text
              x={colAx}
              y={40}
              textAnchor="middle"
              fill="#3b82f6"
              fontSize={11}
              fontWeight="bold"
            >
              Group A (nhóm đa số)
            </text>
            {/* Trục */}
            <line
              x1={colAx}
              y1={30}
              x2={colAx}
              y2={chartHeight - 30}
              stroke="currentColor"
              className="text-border"
              strokeWidth={1}
            />
            {/* Điểm mỗi ứng viên */}
            {CANDIDATES_A.map((c, i) => {
              const offset = (i % 2 === 0 ? -1 : 1) * 18;
              return (
                <CandidateDot
                  key={c.id}
                  candidate={c}
                  threshold={threshA}
                  cx={colAx + offset}
                  cy={yForScore(c.score)}
                />
              );
            })}
            {/* Đường threshold */}
            <motion.line
              x1={colAx - 50}
              x2={colAx + 50}
              y1={yForScore(threshA)}
              y2={yForScore(threshA)}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="6 3"
              animate={{
                y1: yForScore(threshA),
                y2: yForScore(threshA),
              }}
            />
            <text
              x={colAx + 55}
              y={yForScore(threshA) + 4}
              fontSize={10}
              fill="#ef4444"
              fontWeight="bold"
            >
              th={threshA.toFixed(2)}
            </text>
          </g>

          {/* Cột Group B */}
          <g>
            <text
              x={colBx}
              y={40}
              textAnchor="middle"
              fill="#f59e0b"
              fontSize={11}
              fontWeight="bold"
            >
              Group B (nhóm thiểu số)
            </text>
            <line
              x1={colBx}
              y1={30}
              x2={colBx}
              y2={chartHeight - 30}
              stroke="currentColor"
              className="text-border"
              strokeWidth={1}
            />
            {CANDIDATES_B.map((c, i) => {
              const offset = (i % 2 === 0 ? -1 : 1) * 18;
              return (
                <CandidateDot
                  key={c.id}
                  candidate={c}
                  threshold={threshB}
                  cx={colBx + offset}
                  cy={yForScore(c.score)}
                />
              );
            })}
            <motion.line
              x1={colBx - 50}
              x2={colBx + 50}
              y1={yForScore(threshB)}
              y2={yForScore(threshB)}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="6 3"
              animate={{
                y1: yForScore(threshB),
                y2: yForScore(threshB),
              }}
            />
            <text
              x={colBx + 55}
              y={yForScore(threshB) + 4}
              fontSize={10}
              fill="#ef4444"
              fontWeight="bold"
            >
              th={threshB.toFixed(2)}
            </text>
          </g>

          {/* Trục điểm (y) */}
          <g>
            <text
              x={25}
              y={40}
              fontSize={10}
              fill="currentColor"
              className="text-muted"
            >
              Score
            </text>
            {[0, 0.25, 0.5, 0.75, 1].map((v) => (
              <g key={v}>
                <line
                  x1={45}
                  x2={chartWidth - 15}
                  y1={yForScore(v)}
                  y2={yForScore(v)}
                  stroke="currentColor"
                  strokeWidth={0.4}
                  strokeDasharray="2 4"
                  className="text-border"
                />
                <text
                  x={40}
                  y={yForScore(v) + 3}
                  textAnchor="end"
                  fontSize={9}
                  fill="currentColor"
                  className="text-muted"
                >
                  {v.toFixed(2)}
                </text>
              </g>
            ))}
          </g>

          {/* Legend */}
          <g transform={`translate(30, ${chartHeight - 15})`}>
            <circle cx={5} cy={0} r={5} fill="#3b82f6" stroke="#22c55e" strokeWidth={1.5} />
            <text x={14} y={3} fontSize={9} fill="currentColor" className="text-muted">
              Nhận · thực sự phù hợp
            </text>
            <circle cx={145} cy={0} r={5} fill="#3b82f6" stroke="#94a3b8" strokeWidth={1.5} />
            <text x={154} y={3} fontSize={9} fill="currentColor" className="text-muted">
              Nhận · không phù hợp (FP)
            </text>
            <circle cx={320} cy={0} r={5} fill="#1e293b" stroke="#22c55e" strokeWidth={1.5} />
            <text x={329} y={3} fontSize={9} fill="currentColor" className="text-muted">
              Từ chối · bỏ sót (FN)
            </text>
          </g>
        </svg>
      </div>

      {/* Thanh trượt threshold */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-lg border border-blue-300 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800 p-3">
          <label className="text-xs font-semibold text-blue-600 dark:text-blue-300">
            Threshold Group A: {threshA.toFixed(2)}
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.02}
            value={threshA}
            onChange={(e) => onThreshAChange(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
        </div>
        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800 p-3">
          <label className="text-xs font-semibold text-amber-700 dark:text-amber-300">
            Threshold Group B: {threshB.toFixed(2)}
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.02}
            value={threshB}
            onChange={(e) => onThreshBChange(Number(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>
      </div>

      {/* Bảng chỉ số công bằng */}
      <div className="space-y-2">
        <DisparityBar
          label="Selection Rate — tỷ lệ được tuyển"
          valueA={rates.A.selectionRate}
          valueB={rates.B.selectionRate}
          highlight={metric === "demographic-parity"}
        />
        <DisparityBar
          label="True Positive Rate — trong ứng viên phù hợp, tỷ lệ được tuyển"
          valueA={rates.A.tpr}
          valueB={rates.B.tpr}
          highlight={metric === "equal-opportunity" || metric === "equalized-odds"}
        />
        <DisparityBar
          label="False Positive Rate — trong ứng viên không phù hợp, tỷ lệ vẫn được tuyển"
          valueA={rates.A.fpr}
          valueB={rates.B.fpr}
          highlight={metric === "equalized-odds"}
        />
      </div>

      {/* Diagnostic panel */}
      <div
        className="rounded-lg border p-3 space-y-1 text-xs"
        style={{
          borderColor: currentMetric.color,
          backgroundColor: `${currentMetric.color}10`,
        }}
      >
        <p className="font-bold text-foreground">
          Chẩn đoán theo {currentMetric.label}:
        </p>
        {metric === "demographic-parity" && (
          <p className="text-foreground">
            DP gap = <strong>{(gapSelection * 100).toFixed(1)}%</strong>.{" "}
            {gapSelection < 0.1
              ? "✓ Mức chấp nhận được (< 10%)."
              : `✗ Vi phạm — ${
                  rates.A.selectionRate > rates.B.selectionRate
                    ? "Group B"
                    : "Group A"
                } bị bất lợi hệ thống.`}
          </p>
        )}
        {metric === "equal-opportunity" && (
          <p className="text-foreground">
            EO gap (|ΔTPR|) = <strong>{(gapTPR * 100).toFixed(1)}%</strong>.{" "}
            {gapTPR < 0.1
              ? "✓ Trong những ứng viên thực sự phù hợp, hai nhóm có cơ hội tương đương."
              : `✗ Ứng viên phù hợp của ${
                  rates.A.tpr > rates.B.tpr ? "Group B" : "Group A"
                } bị bỏ sót nhiều hơn — không công bằng về cơ hội.`}
          </p>
        )}
        {metric === "equalized-odds" && (
          <p className="text-foreground">
            |ΔTPR| = <strong>{(gapTPR * 100).toFixed(1)}%</strong> · |ΔFPR| ={" "}
            <strong>{(gapFPR * 100).toFixed(1)}%</strong>.{" "}
            {gapTPR < 0.1 && gapFPR < 0.1
              ? "✓ Mô hình đạt Equalized Odds."
              : "✗ Cần điều chỉnh threshold riêng cho từng nhóm (post-processing) để đạt Equalized Odds."}
          </p>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 *                                MAIN COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════ */
export default function BiasFairnessTopic() {
  /* ── State: metric đang chọn và hai threshold độc lập ── */
  const [metric, setMetric] = useState<MetricId>("demographic-parity");
  const [threshA, setThreshA] = useState(0.5);
  const [threshB, setThreshB] = useState(0.5);

  const handleMetricChange = useCallback((m: MetricId) => {
    setMetric(m);
  }, []);

  const handleThreshAChange = useCallback((v: number) => {
    setThreshA(v);
  }, []);

  const handleThreshBChange = useCallback((v: number) => {
    setThreshB(v);
  }, []);

  const scenario = useMemo(() => scenarioForMetric(metric), [metric]);

  const stepLabels = useMemo(
    () => [
      "Dự đoán",
      "Tiến trình",
      "Mô phỏng tuyển dụng",
      "Khoảnh khắc A-ha",
      "Thử thách 1",
      "Lý thuyết",
      "Thử thách 2",
      "Giải pháp & Bias VN",
      "Tóm tắt",
      "Kiểm tra",
    ],
    [],
  );

  return (
    <>
      {/* ── Step 1: PredictionGate ───────────────────────────────────────── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Hệ thống nhận dạng giọng nói được huấn luyện chủ yếu trên giọng Bắc. Khi người miền Nam dùng, điều gì xảy ra?"
          options={[
            "Hoạt động bình thường vì tiếng Việt là tiếng Việt",
            "Tỷ lệ lỗi cao hơn đáng kể vì mô hình chưa 'nghe' đủ giọng Nam — bias từ dữ liệu huấn luyện",
            "Từ chối nhận dạng vì phát hiện giọng khác",
          ]}
          correct={1}
          explanation="Đúng! Đây là ví dụ kinh điển của data bias tại Việt Nam. Mô hình huấn luyện chủ yếu trên giọng Bắc sẽ có WER (Word Error Rate) cho giọng Nam cao hơn 2-3 lần. Người miền Nam phải nói 'giọng Bắc' để được nhận dạng đúng — đây là bất công về mặt công nghệ!"
        />
      </LessonSection>

      {/* ── Step 2: ProgressSteps ────────────────────────────────────────── */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Tiến trình">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted mb-3">
            Hành trình học Bias & Fairness — 10 bước từ trực quan đến thực hành.
          </p>
          <ProgressSteps current={2} total={TOTAL_STEPS} labels={stepLabels} />
        </div>
      </LessonSection>

      {/* ── Step 3: Visualization — Hiring Fairness Demo ─────────────────── */}
      <LessonSection
        step={3}
        totalSteps={TOTAL_STEPS}
        label="Mô phỏng tuyển dụng"
      >
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Mô phỏng mô hình chấm điểm ứng viên với 20 ứng viên mỗi nhóm. Chọn
          tiêu chí công bằng ở trên để xem cách nó đo đạc disparity. Kéo
          threshold riêng cho mỗi nhóm để tìm cấu hình thoả tiêu chí.
        </p>

        <VisualizationSection topicSlug={metadata.slug}>
          <HiringDemo
            metric={metric}
            onMetricChange={handleMetricChange}
            threshA={threshA}
            threshB={threshB}
            onThreshAChange={handleThreshAChange}
            onThreshBChange={handleThreshBChange}
          />
        </VisualizationSection>

        <Callout variant="insight" title="Đọc trực tiếp từ viz">
          <div className="space-y-1 text-sm">
            <p>
              <strong>Viền xanh lục</strong> = ứng viên thực sự phù hợp (Y=1).
              <strong> Viền xám</strong> = không phù hợp (Y=0).
            </p>
            <p>
              <strong>Fill đậm</strong> = được mô hình tuyển (Ŷ=1).
              <strong> Fill tối</strong> = bị từ chối.
            </p>
            <p>
              Tiêu chí <strong>{scenario.disparityLabel}</strong> hiện cho thấy
              disparity = <strong>{(scenario.disparityValue * 100).toFixed(1)}%</strong>.
              Nhóm lợi thế:{" "}
              <strong>{scenario.advantaged}</strong> · Nhóm thiệt:{" "}
              <strong>{scenario.disadvantaged}</strong>.
            </p>
          </div>
        </Callout>
      </LessonSection>

      {/* ── Step 4: AhaMoment ────────────────────────────────────────────── */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          AI không <strong>tạo ra</strong> thiên kiến — nó{" "}
          <strong>phản ánh và khuếch đại</strong> thiên kiến đã tồn tại trong
          dữ liệu và xã hội. Nếu 80% dữ liệu tuyển dụng là nam, AI sẽ {'"học"'}{" "}
          rằng nam phù hợp hơn. Không phải AI xấu — mà là{" "}
          <strong>dữ liệu chứa bias xã hội</strong>, và AI khuếch đại nó lên
          quy mô triệu người. Quan trọng hơn: <strong>không có công thức
          công bằng duy nhất</strong> — Demographic Parity, Equal Opportunity
          và Equalized Odds mâu thuẫn toán học với nhau, và bạn phải{" "}
          <strong>chọn</strong> tiêu chí ưu tiên dựa trên bối cảnh đạo đức và
          pháp luật.
        </AhaMoment>
      </LessonSection>

      {/* ── Step 5: InlineChallenge 1 ────────────────────────────────────── */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách 1">
        <InlineChallenge
          question="Chatbot y tế AI khuyên 'Anh nên đi khám tim mạch' cho triệu chứng đau ngực ở nam, nhưng khuyên 'Chị nên nghỉ ngơi, có thể do stress' cho triệu chứng tương tự ở nữ. Bias nào đang hoạt động?"
          options={[
            "Mô hình đúng vì nam có nguy cơ tim mạch cao hơn",
            "Data bias: dữ liệu y khoa lịch sử thiên về nghiên cứu nam giới, nên AI 'học' rằng đau ngực ở nữ ít nghiêm trọng hơn",
            "Lỗi kỹ thuật trong mô hình",
            "AI đang cá nhân hoá theo giới tính — tốt chứ không phải bias",
          ]}
          correct={1}
          explanation="Đây là data bias nghiêm trọng trong y tế: lịch sử y khoa tập trung nghiên cứu trên nam giới, nên AI 'học' rằng triệu chứng tim mạch ở nữ ít nghiêm trọng. Thực tế, phụ nữ thường có triệu chứng tim mạch khác nam và bị chẩn đoán muộn hơn. AI khuếch đại bias này lên quy mô triệu bệnh nhân — và tiêu chí Equal Opportunity bị vi phạm rõ ràng: TPR đối với nữ thấp hơn nam đáng kể."
        />
      </LessonSection>

      {/* ── Step 6: Explanation ──────────────────────────────────────────── */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection topicSlug={metadata.slug}>
          <p>
            <strong>Thiên kiến (Bias)</strong> trong AI xảy ra khi mô hình tạo
            ra kết quả không công bằng cho một nhóm người. Bias có thể xuất
            phát từ dữ liệu, thuật toán, hoặc cách đánh giá — và thường được
            kiểm soát qua khung{" "}
            <TopicLink slug="ai-governance">AI governance</TopicLink>.
          </p>

          {/* ── Callout 1: Chuỗi bias ── */}
          <Callout
            variant="insight"
            title="Callout 1 — Chuỗi bias từ dữ liệu đến quyết định"
          >
            <div className="space-y-2">
              <p>
                <strong>1. Data bias:</strong> Dữ liệu không đại diện (ít mẫu
                giọng miền Trung) hoặc phản ánh bias xã hội (70% CEO trong ảnh
                là nam).
              </p>
              <p>
                <strong>2. Algorithmic bias:</strong> Hàm mục tiêu ưu tiên
                accuracy tổng → hy sinh accuracy nhóm thiểu số. 95% accuracy
                tổng nhưng 70% cho nhóm nhỏ.
              </p>
              <p>
                <strong>3. Evaluation bias:</strong> Chỉ đo performance trung
                bình, không phân tích theo từng nhóm nhân khẩu.
              </p>
              <p>
                <strong>4. Deployment bias:</strong> Sản phẩm triển khai trong
                bối cảnh khác huấn luyện (train ở Mỹ, deploy ở Việt Nam).
              </p>
            </div>
          </Callout>

          <p>Các chỉ số công bằng phổ biến (chính thức):</p>
          <LaTeX block>
            {"\\text{Demographic Parity: } P(\\hat{Y}=1 | A=0) = P(\\hat{Y}=1 | A=1)"}
          </LaTeX>
          <LaTeX block>
            {"\\text{Equal Opportunity: } P(\\hat{Y}=1 | Y=1, A=0) = P(\\hat{Y}=1 | Y=1, A=1)"}
          </LaTeX>
          <LaTeX block>
            {"\\text{Equalized Odds: } P(\\hat{Y}=1 | Y=y, A=0) = P(\\hat{Y}=1 | Y=y, A=1), \\forall y"}
          </LaTeX>
          <p className="text-sm text-muted">
            Demographic Parity đòi hỏi tỷ lệ kết quả tích cực bằng nhau giữa
            các nhóm. Equal Opportunity chỉ đòi hỏi TPR bằng nhau (tốt cho đối
            tượng phù hợp). Equalized Odds đòi hỏi cả TPR lẫn FPR bằng nhau —
            nghiêm ngặt nhất.
          </p>

          {/* ── Callout 2: Impossibility theorem ── */}
          <Callout
            variant="warning"
            title="Callout 2 — Định lý bất khả thi (Impossibility Theorem)"
          >
            <p className="text-sm">
              Chouldechova (2017) và Kleinberg et al. (2016) chứng minh rằng
              khi <strong>base rate</strong> (tỷ lệ Y=1) khác nhau giữa các
              nhóm, KHÔNG thể đồng thời đạt:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-sm mt-2">
              <li>Calibration (xác suất dự đoán đúng)</li>
              <li>Balance for positive class (equal TPR)</li>
              <li>Balance for negative class (equal FPR)</li>
            </ul>
            <p className="text-sm mt-2">
              Hệ quả thực tế: bạn PHẢI chọn 1-2 tiêu chí ưu tiên. Toà án US trong
              vụ COMPAS (thuật toán dự đoán tái phạm) đã tranh cãi chính chỗ này —
              ProPublica dùng Equalized Odds, Northpointe dùng calibration.
            </p>
          </Callout>

          {/* ── CodeBlock 1: sklearn / fairlearn fairness audit ── */}
          <CodeBlock language="python" title="CodeBlock 1 — fairlearn + sklearn: audit fairness">
{`"""
Audit một mô hình logistic regression phân loại ứng viên
với fairlearn. Dữ liệu giả lập 2 nhóm A, B có base rate khác nhau.
"""
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from fairlearn.metrics import (
    MetricFrame,
    demographic_parity_difference,
    equalized_odds_difference,
    true_positive_rate,
    false_positive_rate,
    selection_rate,
)

# ── 1. Dữ liệu giả lập ───────────────────────────────────────
rng = np.random.default_rng(42)
n_a, n_b = 800, 400  # Group A đông hơn → bias mẫu
features_a = rng.normal(loc=0.3, scale=1.0, size=(n_a, 5))
features_b = rng.normal(loc=-0.1, scale=1.0, size=(n_b, 5))
X = np.vstack([features_a, features_b])
A = np.array(["A"] * n_a + ["B"] * n_b)  # sensitive attribute

# Ground truth với base rate khác nhau
logits_a = features_a @ np.array([1, 0.5, -0.3, 0.2, 0.1]) + 0.2
logits_b = features_b @ np.array([1, 0.5, -0.3, 0.2, 0.1]) - 0.1
p_a = 1 / (1 + np.exp(-logits_a))
p_b = 1 / (1 + np.exp(-logits_b))
y = np.concatenate([rng.binomial(1, p_a), rng.binomial(1, p_b)])

X_tr, X_te, y_tr, y_te, A_tr, A_te = train_test_split(
    X, y, A, test_size=0.3, random_state=42, stratify=A
)

# ── 2. Train baseline model ──────────────────────────────────
model = LogisticRegression(max_iter=1000).fit(X_tr, y_tr)
y_pred = model.predict(X_te)

# ── 3. Audit per-group ───────────────────────────────────────
mf = MetricFrame(
    metrics={
        "accuracy": accuracy_score,
        "TPR": true_positive_rate,
        "FPR": false_positive_rate,
        "selection_rate": selection_rate,
    },
    y_true=y_te,
    y_pred=y_pred,
    sensitive_features=A_te,
)
print(mf.by_group)
#            accuracy    TPR    FPR  selection_rate
# A             0.82    0.84   0.18            0.57
# B             0.78    0.72   0.12            0.39

# ── 4. Disparity metrics ─────────────────────────────────────
dp_gap = demographic_parity_difference(y_te, y_pred, sensitive_features=A_te)
eo_gap = equalized_odds_difference(y_te, y_pred, sensitive_features=A_te)
print(f"DP gap: {dp_gap:.3f}")   # 0.18 — Group B bị thiệt
print(f"EOdds gap: {eo_gap:.3f}")# 0.12 — cả TPR và FPR lệch

# Nếu DP gap > 0.1 hoặc 80% rule bị vi phạm → cần can thiệp`}
          </CodeBlock>

          <p>
            Để <em>sửa</em> bias sau khi audit, dùng ba nhóm kỹ thuật:
            <strong> pre-processing</strong> (cân bằng dữ liệu),{" "}
            <strong>in-processing</strong> (thêm fairness constraint vào loss),
            và <strong>post-processing</strong> (điều chỉnh threshold).
          </p>

          {/* ── CodeBlock 2: Post-processing với group-specific threshold ── */}
          <CodeBlock
            language="python"
            title="CodeBlock 2 — Post-processing: ThresholdOptimizer đạt Equal Opportunity"
          >
{`"""
Dùng ThresholdOptimizer của fairlearn để đạt Equal Opportunity
bằng cách chọn threshold RIÊNG cho từng nhóm.
"""
from fairlearn.postprocessing import ThresholdOptimizer
from sklearn.metrics import accuracy_score

# Tiếp tục từ model baseline ở CodeBlock 1
postproc = ThresholdOptimizer(
    estimator=model,
    constraints="true_positive_rate_parity",  # = Equal Opportunity
    objective="accuracy_score",
    prefit=True,
    predict_method="predict_proba",
)
postproc.fit(X_tr, y_tr, sensitive_features=A_tr)

# Kiểm tra threshold riêng cho mỗi nhóm
print(postproc.interpolated_thresholder_.interpolation_dict)
# {'A': {'p0': 0.55, ...}, 'B': {'p0': 0.42, ...}}
# → Group B được đặt threshold thấp hơn để TPR khớp Group A

y_pred_fair = postproc.predict(X_te, sensitive_features=A_te)

mf_fair = MetricFrame(
    metrics={"TPR": true_positive_rate, "FPR": false_positive_rate},
    y_true=y_te,
    y_pred=y_pred_fair,
    sensitive_features=A_te,
)
print(mf_fair.by_group)
#        TPR    FPR
# A     0.79   0.16
# B     0.79   0.19
# → Equal Opportunity đạt (ΔTPR ≈ 0); FPR còn lệch nhỏ

# Trade-off: accuracy giảm nhẹ từ 0.82 → 0.79 nhưng fairness cải thiện rõ
print(f"Accuracy after post-proc: {accuracy_score(y_te, y_pred_fair):.3f}")`}
          </CodeBlock>

          {/* ── Callout 3: Bias đặc thù VN ── */}
          <Callout variant="warning" title="Callout 3 — Bias đặc thù Việt Nam">
            <div className="space-y-1">
              <p>
                <strong>Phương ngữ:</strong> ASR có WER ~12% cho giọng Bắc
                nhưng ~25% cho giọng miền Trung. Khi xây Siri/Google Assistant
                tiếng Việt, cần audit theo vùng miền.
              </p>
              <p>
                <strong>Giới tính:</strong> AI tạo ảnh VN thường gắn phụ nữ với
                áo dài/nấu ăn, đàn ông với công nghệ/kinh doanh — phản ánh
                stereotype từ corpus ảnh Việt.
              </p>
              <p>
                <strong>Vùng miền:</strong> AI tuyển dụng thiên vị ứng viên
                TP.HCM/Hà Nội do dữ liệu tập trung; DP gap có thể lên tới
                20-30% giữa nội và ngoại thành.
              </p>
              <p>
                <strong>Kinh tế:</strong> AI tín dụng thiên vị người thành thị
                có digital footprint, bất lợi cho nông thôn dù thu nhập thực
                tương đương.
              </p>
              <p>
                <strong>Ngôn ngữ dân tộc:</strong> LLM tiếng Việt chủ yếu
                train trên văn bản Kinh — tiếng Tày, Thái, H'Mông gần như
                không được hỗ trợ.
              </p>
            </div>
          </Callout>

          {/* ── Callout 4: Fairness through unawareness không đủ ── */}
          <Callout
            variant="warning"
            title="Callout 4 — Tại sao 'giấu thông tin nhạy cảm' không đủ"
          >
            <p className="text-sm">
              Một hiểu lầm phổ biến: &quot;chỉ cần không cho mô hình biết giới
              tính/vùng miền là công bằng&quot;. Sai! Các feature còn lại gần
              như luôn chứa <strong>proxy</strong>:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-sm mt-2">
              <li>Tên → giới tính, dân tộc</li>
              <li>Địa chỉ → vùng miền, thu nhập</li>
              <li>Trường đại học → class xã hội</li>
              <li>Lịch sử việc làm → khoảng trống thai sản (giới tính)</li>
            </ul>
            <p className="text-sm mt-2">
              Giải pháp thực sự: phải <em>đo</em> fairness với sensitive
              attribute (dù không dùng khi dự đoán), và áp dụng
              pre/in/post-processing phù hợp.
            </p>
          </Callout>

          {/* ── CollapsibleDetail 1: Các kỹ thuật giảm bias in-depth ── */}
          <CollapsibleDetail title="CollapsibleDetail 1 — Các kỹ thuật giảm bias chi tiết">
            <div className="space-y-3 text-sm">
              <p>
                <strong>Pre-processing:</strong>
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li>
                  <em>Reweighing:</em> gán trọng số mẫu sao cho P(A, Y) độc lập
                  trong dữ liệu train.
                </li>
                <li>
                  <em>Resampling:</em> oversampling nhóm thiểu số hoặc
                  undersampling nhóm đa số.
                </li>
                <li>
                  <em>Disparate Impact Remover:</em> biến đổi phân phối feature
                  để giữ ordering trong nhóm nhưng làm distribution giữa các
                  nhóm giống nhau.
                </li>
                <li>
                  <em>SMOTE biến thể fair:</em> tạo synthetic examples cho
                  nhóm thiểu số có Y=1.
                </li>
              </ul>
              <p>
                <strong>In-processing:</strong>
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li>
                  <em>Adversarial debiasing:</em> mạng chính dự đoán Y, mạng
                  phụ cố đoán A từ biểu diễn; cả hai chơi minimax game.
                </li>
                <li>
                  <em>Fairness constraint:</em> thêm{" "}
                  <LaTeX>{"|\\text{TPR}_A - \\text{TPR}_B| \\leq \\epsilon"}</LaTeX>{" "}
                  vào optimization với Lagrangian.
                </li>
                <li>
                  <em>Prejudice Remover:</em> regularizer phạt mutual
                  information giữa prediction và sensitive attribute.
                </li>
              </ul>
              <p>
                <strong>Post-processing:</strong>
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li>
                  <em>Group-specific thresholds:</em> như ví dụ CodeBlock 2 —
                  dễ triển khai, không cần retrain.
                </li>
                <li>
                  <em>Calibrated Equalized Odds:</em> pha trộn dự đoán với
                  random coin flip cho nhóm lợi thế.
                </li>
                <li>
                  <em>Reject Option Classifier:</em> với điểm gần threshold,
                  ưu tiên nhóm thiểu số.
                </li>
              </ul>
            </div>
          </CollapsibleDetail>

          {/* ── CollapsibleDetail 2: Khung pháp lý ── */}
          <CollapsibleDetail title="CollapsibleDetail 2 — Khung pháp lý & tiêu chuẩn công nghiệp">
            <div className="space-y-3 text-sm">
              <p>
                <strong>US — Four-Fifths Rule (EEOC):</strong> nếu tỷ lệ tuyển
                của nhóm thiểu số &lt; 80% của nhóm đa số, coi là{" "}
                <em>disparate impact</em> — bên tuyển dụng phải chứng minh
                &quot;business necessity&quot;.
              </p>
              <p>
                <strong>EU AI Act (2024):</strong> AI &quot;high-risk&quot;
                (tuyển dụng, tín dụng, y tế, tư pháp) BẮT BUỘC audit bias, có
                tài liệu hoá và giám sát con người. Vi phạm phạt tới 35 triệu
                EUR hoặc 7% doanh thu toàn cầu.
              </p>
              <p>
                <strong>NYC Local Law 144 (2023):</strong> mọi AI-based
                hiring tool phải qua bias audit hàng năm bởi bên thứ ba độc
                lập, công khai kết quả.
              </p>
              <p>
                <strong>Vietnam:</strong> chưa có luật AI riêng (2026) nhưng
                Luật An toàn thông tin mạng và Nghị định 13/2023 về bảo vệ dữ
                liệu cá nhân ràng buộc hệ thống tự động hoá. Dự thảo Luật AI
                đang được soạn thảo.
              </p>
              <p>
                <strong>ISO/IEC 42001 (2023):</strong> tiêu chuẩn quốc tế cho
                AI Management System, yêu cầu quy trình đánh giá bias,
                fairness và transparency.
              </p>
              <p>
                <strong>Công cụ audit:</strong>{" "}
                <code>fairlearn</code> (Microsoft), <code>AIF360</code>{" "}
                (IBM), <code>Aequitas</code> (University of Chicago),{" "}
                <code>What-If Tool</code> (Google).
              </p>
            </div>
          </CollapsibleDetail>

          <p>
            Liên quan: tham khảo{" "}
            <TopicLink slug="explainability">explainability</TopicLink> (để
            hiểu vì sao mô hình quyết định),{" "}
            <TopicLink slug="alignment">alignment</TopicLink> (mục tiêu rộng
            hơn), và{" "}
            <TopicLink slug="ai-governance">AI governance</TopicLink> (khung
            tổ chức).
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ── Step 7: InlineChallenge 2 ────────────────────────────────────── */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Thử thách 2">
        <InlineChallenge
          question="Ngân hàng X dùng AI chấm điểm tín dụng. Audit cho thấy Group A (thành thị) có DP selection rate 62%, Group B (nông thôn) có DP selection rate 28%. TPR của A là 85%, TPR của B là 70%. Nên ưu tiên khắc phục chỉ số nào trước?"
          options={[
            "Demographic Parity — gap 34% là khổng lồ, vi phạm 80% rule",
            "Equal Opportunity — gap TPR 15% nghĩa là khách hàng phù hợp ở nông thôn đang bị từ chối nhiều hơn",
            "Cả hai đều quan trọng, nhưng với tín dụng, Equal Opportunity thường ưu tiên vì trong số người THỰC SỰ có khả năng trả nợ, không được phân biệt theo nhóm",
            "Không có gì — nếu base rate khác nhau thật thì không thể đạt fairness tuyệt đối",
          ]}
          correct={2}
          explanation="Trong domain tín dụng, Equal Opportunity thường được ưu tiên: đối với khách hàng THỰC SỰ có khả năng trả nợ (Y=1), họ phải được duyệt với tỷ lệ như nhau — đây là ý nghĩa cơ bản của 'cơ hội bình đẳng'. DP có thể mâu thuẫn với business: nếu base rate khác thật thì ép DP sẽ dẫn đến duyệt cho người không trả nợ. Nhưng DP gap 34% vẫn cần điều tra — nó có thể báo hiệu proxy discrimination hoặc thiếu dữ liệu cho Group B."
        />
      </LessonSection>

      {/* ── Step 8: Giải pháp & Bias đặc thù VN ──────────────────────────── */}
      <LessonSection
        step={8}
        totalSteps={TOTAL_STEPS}
        label="Giải pháp & Bias VN"
      >
        <Callout variant="tip" title="Framework 5 bước giảm bias thực tế">
          <div className="space-y-2">
            <p>
              <strong>1. Xác định sensitive attributes.</strong> Giới tính,
              vùng miền, độ tuổi, dân tộc — và cả proxy của chúng (tên, địa
              chỉ, trường học).
            </p>
            <p>
              <strong>2. Audit trên TẤT CẢ tiêu chí.</strong> Đừng chỉ đo
              accuracy tổng — dùng{" "}
              <code className="text-xs bg-surface px-1 rounded">
                MetricFrame
              </code>{" "}
              để xem DP, EO, Equalized Odds theo từng nhóm. Kết hợp với{" "}
              <TopicLink slug="explainability">explainability</TopicLink>{" "}
              (SHAP, LIME) để tìm proxy.
            </p>
            <p>
              <strong>3. Chọn tiêu chí ưu tiên theo context.</strong> Y tế:
              Equal Opportunity. Tuyển dụng: DP (ràng buộc pháp lý).
              Marketing: có thể chấp nhận gap lớn hơn. Không có công thức
              chung.
            </p>
            <p>
              <strong>4. Can thiệp.</strong> Pre-processing cho dữ liệu mới,
              in-processing khi retrain, post-processing khi không thể chạm
              vào model (deploy qua API).
            </p>
            <p>
              <strong>5. Giám sát liên tục.</strong> Bias có thể quay lại khi
              dữ liệu mới đến. Setup dashboard đo fairness metrics realtime,
              alert khi gap vượt ngưỡng.
            </p>
          </div>
        </Callout>

        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <h4 className="text-sm font-bold text-foreground">
            Case study VN: NH tuyển dụng giảm bias vùng miền
          </h4>
          <p className="text-sm text-muted leading-relaxed">
            Một ngân hàng lớn tại Việt Nam phát hiện mô hình sàng lọc CV tự
            động có DP gap 25% giữa ứng viên thành thị và nông thôn. Giải pháp
            3 bước: <strong>(a)</strong> dừng dùng địa chỉ làm feature trực
            tiếp; <strong>(b)</strong> reweighing để cân bằng theo tỉnh trong
            dữ liệu train; <strong>(c)</strong> áp Equalized Odds
            post-processing với threshold riêng cho 3 vùng. Sau 3 tháng DP gap
            giảm còn 8%, accuracy tổng giảm chỉ 1.2% — trade-off chấp nhận
            được.
          </p>
        </div>
      </LessonSection>

      {/* ── Step 9: MiniSummary (6 điểm) ─────────────────────────────────── */}
      <LessonSection step={9} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về Bias & Fairness"
          points={[
            "AI không tạo bias — nó PHẢN ÁNH và KHUẾCH ĐẠI bias trong dữ liệu và xã hội lên quy mô triệu người.",
            "4 nguồn bias: data (mất cân bằng), algorithm (tối ưu sai), evaluation (đo sai), deployment (ngữ cảnh khác).",
            "Ba tiêu chí phổ biến: Demographic Parity (đồng đều tỷ lệ dương), Equal Opportunity (đồng đều TPR), Equalized Odds (đồng đều cả TPR và FPR).",
            "Impossibility theorem: khi base rate khác nhau, không thể đạt đồng thời cả ba tiêu chí — phải chọn ưu tiên theo context.",
            "Bias đặc thù VN: phương ngữ Bắc/Trung/Nam, giới tính trong mô tả ảnh, vùng miền trong tuyển dụng, kinh tế thành-thị/nông-thôn, ngôn ngữ dân tộc.",
            "Framework 5 bước: xác định sensitive attribute → audit → chọn tiêu chí → can thiệp (pre/in/post) → giám sát liên tục.",
          ]}
        />
      </LessonSection>

      {/* ── Step 10: Quiz (8 câu) ────────────────────────────────────────── */}
      <LessonSection step={10} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
