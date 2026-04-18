"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

/* ══════════════════════════════════════════════════════════════════════
   METADATA
   ══════════════════════════════════════════════════════════════════════ */
export const metadata: TopicMeta = {
  slug: "cross-validation",
  title: "Cross-Validation",
  titleVi: "Kiểm chứng chéo",
  description:
    "Kỹ thuật đánh giá mô hình bằng cách chia dữ liệu thành nhiều fold để huấn luyện và kiểm tra",
  category: "classic-ml",
  tags: ["evaluation", "model-selection", "theory"],
  difficulty: "beginner",
  relatedSlugs: ["bias-variance", "confusion-matrix", "polynomial-regression"],
  vizType: "interactive",
};

/* ══════════════════════════════════════════════════════════════════════
   CONSTANTS & TYPES
   ══════════════════════════════════════════════════════════════════════ */

const TOTAL_STEPS = 7;

/** Palette for fold highlight colours (Perplexity-inspired) */
const FOLD_COLORS = [
  "#3b82f6", // blue
  "#f97316", // orange
  "#22c55e", // green
  "#8b5cf6", // violet
  "#ef4444", // red
  "#0ea5e9", // sky
  "#eab308", // yellow
  "#ec4899", // pink
  "#14b8a6", // teal
  "#a855f7", // purple
];

/** Supported K values in the interactive visualisation */
const K_OPTIONS = [3, 5, 7, 10] as const;
type KValue = (typeof K_OPTIONS)[number];

/** Type of cross-validation strategy for the comparison panel */
type Strategy =
  | "holdout"
  | "kfold"
  | "stratified"
  | "loo"
  | "timeseries"
  | "repeated"
  | "group";

interface StrategyInfo {
  id: Strategy;
  label: string;
  shortVi: string;
  longVi: string;
  prosVi: string[];
  consVi: string[];
  whenVi: string;
  colour: string;
  complexity: "thấp" | "trung bình" | "cao" | "rất cao";
}

/* ══════════════════════════════════════════════════════════════════════
   STATIC DATA TABLES
   ══════════════════════════════════════════════════════════════════════ */

/** Simulated per-fold accuracy scores used in the visualisation */
function getScores(k: KValue): number[] {
  const baseScores: Record<KValue, number[]> = {
    3: [0.83, 0.87, 0.85],
    5: [0.85, 0.88, 0.82, 0.9, 0.86],
    7: [0.84, 0.87, 0.83, 0.89, 0.86, 0.88, 0.85],
    10: [0.85, 0.87, 0.82, 0.9, 0.86, 0.84, 0.89, 0.83, 0.88, 0.85],
  };
  return baseScores[k];
}

/** Rich reference metadata for each cross-validation strategy */
const STRATEGIES: StrategyInfo[] = [
  {
    id: "holdout",
    label: "Hold-out (chia 1 lần)",
    shortVi: "Chia một lần duy nhất 70/30 hoặc 80/20.",
    longVi:
      "Cách đơn giản nhất: xáo trộn rồi cắt một đoạn làm tập kiểm tra. Nhanh, dễ hiểu, nhưng phụ thuộc rất nhiều vào cú 'cắt' đó — có khi may, có khi xui.",
    prosVi: [
      "Rất nhanh — chỉ train 1 lần.",
      "Dễ cài đặt, dễ giải thích cho người mới.",
      "Phù hợp khi dữ liệu rất lớn (hàng triệu mẫu) → variance tự nhiên thấp.",
    ],
    consVi: [
      "Kết quả dao động mạnh theo seed / cách chia.",
      "Nhiều mẫu không được test lần nào, nhiều mẫu khác phí công.",
      "Không đủ tin cậy cho model selection.",
    ],
    whenVi:
      "Dùng khi dữ liệu cực lớn hoặc khi bạn cần một ước lượng nhanh để sàng lọc ý tưởng.",
    colour: "#94a3b8",
    complexity: "thấp",
  },
  {
    id: "kfold",
    label: "K-Fold",
    shortVi: "Chia K phần bằng nhau, luân phiên test.",
    longVi:
      "Xáo trộn dữ liệu rồi chia thành K đoạn. Mỗi lượt chọn 1 đoạn làm test, K-1 đoạn còn lại làm train. Lặp K lần → trung bình K điểm.",
    prosVi: [
      "Mỗi mẫu được test đúng 1 lần, train (K-1) lần.",
      "Trung bình ổn định hơn hold-out rất nhiều.",
      "K = 5 hoặc 10 là mặc định phổ biến trong scikit-learn.",
    ],
    consVi: [
      "Tốn kém gấp K lần hold-out.",
      "Không giữ tỷ lệ lớp — nguy hiểm cho dữ liệu mất cân bằng.",
      "Không phù hợp với chuỗi thời gian (data leakage).",
    ],
    whenVi:
      "Mặc định cho hồi quy và phân loại có dữ liệu cân bằng, kích thước vừa (vài nghìn đến vài trăm nghìn mẫu).",
    colour: "#3b82f6",
    complexity: "trung bình",
  },
  {
    id: "stratified",
    label: "Stratified K-Fold",
    shortVi: "K-Fold nhưng giữ tỷ lệ lớp trong mỗi fold.",
    longVi:
      "Biến thể của K-Fold dành cho bài toán phân loại. Mỗi fold sẽ có cùng tỷ lệ các lớp như toàn bộ dataset → tránh trường hợp 1 fold toàn lớp dương hoặc toàn lớp âm.",
    prosVi: [
      "Bắt buộc khi dữ liệu mất cân bằng (ví dụ 95% âm, 5% dương).",
      "Giảm variance của ước lượng đáng kể so với K-Fold thường.",
      "Không tốn chi phí tính toán thêm.",
    ],
    consVi: [
      "Chỉ áp dụng cho classification (cần nhãn rời rạc).",
      "Không tự động xử lý nhãn đa lớp hiếm — phải kiểm tra tỷ lệ thực tế.",
    ],
    whenVi:
      "Bắt buộc cho mọi bài toán classification, đặc biệt khi tỷ lệ lớp chênh lệch hơn 60/40.",
    colour: "#f97316",
    complexity: "trung bình",
  },
  {
    id: "loo",
    label: "Leave-One-Out (LOO)",
    shortVi: "K = n — mỗi lượt chỉ bỏ ra 1 mẫu.",
    longVi:
      "Trường hợp đặc biệt K-Fold với K = số lượng mẫu. Mỗi lượt train trên n-1 mẫu, test trên đúng 1 mẫu. Lặp n lần.",
    prosVi: [
      "Bias thấp nhất trong các chiến lược CV.",
      "Tận dụng tối đa dữ liệu cho train.",
      "Hữu ích khi dataset quá nhỏ (n < 50).",
    ],
    consVi: [
      "Variance cao — mỗi lượt chỉ test 1 mẫu.",
      "Cực kỳ tốn kém — phải train n lần.",
      "Không thể stratify theo nhãn.",
    ],
    whenVi:
      "Dataset rất nhỏ (vài chục mẫu) hoặc khi thuật toán train cực nhanh (linear regression kín dạng, Nearest Neighbors).",
    colour: "#8b5cf6",
    complexity: "rất cao",
  },
  {
    id: "timeseries",
    label: "Time Series Split",
    shortVi: "Train quá khứ → test tương lai.",
    longVi:
      "Dành riêng cho chuỗi thời gian: không bao giờ shuffle. Fold k train trên [1..k], test trên [k+1]. Mở rộng dần cửa sổ train hoặc giữ cố định (rolling).",
    prosVi: [
      "Mô phỏng đúng tình huống thực tế (dự đoán tương lai).",
      "Loại bỏ hoàn toàn rủi ro data leakage theo thời gian.",
      "Hỗ trợ rolling window cho dữ liệu phi tĩnh.",
    ],
    consVi: [
      "Không tận dụng được toàn bộ dữ liệu làm train.",
      "Variance cao ở fold đầu (train rất nhỏ).",
      "Phức tạp hơn khi kết hợp với gap / purge.",
    ],
    whenVi:
      "Bắt buộc cho giá cổ phiếu, doanh số theo ngày, log server, tín hiệu cảm biến IoT.",
    colour: "#22c55e",
    complexity: "cao",
  },
  {
    id: "repeated",
    label: "Repeated K-Fold",
    shortVi: "Chạy K-Fold nhiều vòng với seed khác nhau.",
    longVi:
      "Lặp toàn bộ quy trình K-Fold R lần, mỗi lần shuffle khác. Kết quả cuối là trung bình của K × R lượt — ước lượng mean và std cực kỳ ổn định.",
    prosVi: [
      "Giảm variance ước lượng tốt nhất có thể.",
      "Tính được khoảng tin cậy (CI) đáng tin cậy.",
      "Thích hợp cho báo cáo khoa học / publication.",
    ],
    consVi: [
      "Chi phí = K × R lần train.",
      "Không giải quyết được vấn đề data leakage nội tại.",
    ],
    whenVi:
      "Khi cần báo cáo chính xác ± bao nhiêu, ví dụ paper học thuật hoặc benchmark mô hình.",
    colour: "#ef4444",
    complexity: "cao",
  },
  {
    id: "group",
    label: "Group K-Fold",
    shortVi: "Đảm bảo cùng nhóm không xuất hiện ở cả train và test.",
    longVi:
      "Nếu dữ liệu có 'nhóm' tự nhiên (cùng bệnh nhân, cùng người dùng, cùng camera), ta phải tránh cho 1 nhóm nằm ở cả train và test → gây data leakage.",
    prosVi: [
      "Phản ánh đúng thực tế triển khai (user/bệnh nhân mới).",
      "Dùng được cho cả regression và classification.",
    ],
    consVi: [
      "Kích thước fold có thể không cân — tuỳ phân bố nhóm.",
      "Cần cột group_id trong dữ liệu.",
    ],
    whenVi:
      "Dữ liệu y khoa, hệ thống gợi ý, phân loại giọng nói nhiều speaker.",
    colour: "#0ea5e9",
    complexity: "cao",
  },
];

/* ══════════════════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════════════════ */

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function std(arr: number[]): number {
  if (arr.length === 0) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
}

function pct(x: number): string {
  return `${(x * 100).toFixed(1)}%`;
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════════ */

export default function CrossValidationTopic() {
  /* ── State ── */
  const [k, setK] = useState<KValue>(5);
  const [activeFold, setActiveFold] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy>("kfold");

  /* ── Derived scores ── */
  const scores = useMemo(() => getScores(k), [k]);
  const avgScore = useMemo(() => mean(scores), [scores]);
  const stdScore = useMemo(() => std(scores), [scores]);
  const minScore = useMemo(() => Math.min(...scores), [scores]);
  const maxScore = useMemo(() => Math.max(...scores), [scores]);

  /* ── Auto-play animation through folds ── */
  useEffect(() => {
    if (!isAnimating) return;
    const interval = setInterval(() => {
      setActiveFold((prev) => {
        const next = prev + 1;
        if (next >= k) {
          setIsAnimating(false);
          return 0;
        }
        return next;
      });
    }, 900);
    return () => clearInterval(interval);
  }, [isAnimating, k]);

  const handleStartAnimation = useCallback(() => {
    setActiveFold(0);
    setIsAnimating(true);
  }, []);

  const handleStopAnimation = useCallback(() => {
    setIsAnimating(false);
  }, []);

  const handleKChange = useCallback((kv: KValue) => {
    setK(kv);
    setActiveFold(0);
    setIsAnimating(false);
  }, []);

  /* ── Strategy detail lookup ── */
  const selectedStrategyInfo = useMemo(
    () => STRATEGIES.find((s) => s.id === selectedStrategy) ?? STRATEGIES[1],
    [selectedStrategy],
  );

  /* ── Quiz questions (8) ── */
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question: "Tại sao cross-validation tốt hơn chia train/test một lần?",
        options: [
          "Cross-validation chạy nhanh hơn",
          "Mỗi điểm dữ liệu đều được dùng để test đúng 1 lần → ước lượng ổn định hơn, ít phụ thuộc vào cách chia",
          "Cross-validation luôn cho accuracy cao hơn",
        ],
        correct: 1,
        explanation:
          "Chia 1 lần → kết quả phụ thuộc vào 'may rủi' của lần chia đó. Cross-validation thử K lần chia khác nhau → trung bình ổn định hơn. Mọi mẫu đều được test → tận dụng tối đa dữ liệu.",
      },
      {
        question: "K=5 hay K=10 tốt hơn?",
        options: [
          "K=10 luôn tốt hơn vì test nhiều hơn",
          "Tuỳ: K=5 nhanh hơn, K=10 ước lượng tốt hơn nhưng chậm gấp đôi. K=5 là mặc định phổ biến.",
          "K=5 luôn tốt hơn vì tập train lớn hơn",
        ],
        correct: 1,
        explanation:
          "K lớn → mỗi fold nhỏ hơn → variance ước lượng cao hơn (nhạy hơn). K nhỏ → tập train nhỏ hơn → bias cao hơn. K=5 hoặc 10 cân bằng tốt. Thực tế thường dùng K=5.",
      },
      {
        question:
          "Dữ liệu chuỗi thời gian (giá Bitcoin theo ngày). Dùng K-Fold bình thường được không?",
        options: [
          "Được — K-Fold hoạt động với mọi dữ liệu",
          "KHÔNG — data leakage! Phải dùng Time Series Split (chỉ train trên quá khứ, test trên tương lai)",
          "Được nếu shuffle dữ liệu trước",
        ],
        correct: 1,
        explanation:
          "K-Fold xáo trộn → dữ liệu tương lai lọt vào training set → mô hình 'nhìn trước' được → accuracy ảo! Time Series Split luôn train trên quá khứ, test trên tương lai → thực tế hơn.",
      },
      {
        type: "fill-blank",
        question:
          "Với 5-Fold Cross-Validation, mỗi điểm dữ liệu được dùng làm tập test đúng {blank} lần. Kết quả cuối là {blank} của 5 lượt đánh giá.",
        blanks: [
          { answer: "1", accept: ["một", "1 lần"] },
          { answer: "trung bình", accept: ["mean", "giá trị trung bình"] },
        ],
        explanation:
          "Đây là tính chất cốt lõi của K-Fold: mỗi mẫu được test đúng 1 lần (không bị bỏ qua, không bị test 2 lần). Kết quả cuối cùng là trung bình của K lượt → ổn định hơn chia 1 lần.",
      },
      {
        question:
          "Dataset có 100 mẫu: 95 âm tính, 5 dương tính (bệnh hiếm). Dùng K-Fold thường, chuyện gì có thể xảy ra?",
        options: [
          "Không có gì — K-Fold luôn hoạt động chính xác.",
          "Một số fold có thể không chứa mẫu dương tính nào → accuracy 95% 'giả' vì mô hình chỉ cần đoán 'âm' là trúng.",
          "Dữ liệu sẽ tự động được cân bằng.",
        ],
        correct: 1,
        explanation:
          "Với 5 mẫu dương và K=5, có thể 1-2 fold trống hoàn toàn lớp dương. Lúc đó precision/recall không tính được và accuracy trở nên vô nghĩa. Luôn dùng StratifiedKFold cho classification mất cân bằng.",
      },
      {
        question:
          "Bạn có dataset y khoa: 500 bệnh nhân, mỗi người có 10 lần quét MRI. Tổng 5000 ảnh. Cách chia nào đúng?",
        options: [
          "Shuffle tất cả 5000 ảnh rồi K-Fold thường.",
          "Group K-Fold theo bệnh nhân — không cho 1 bệnh nhân nằm ở cả train và test.",
          "Stratified K-Fold theo nhãn bệnh.",
        ],
        correct: 1,
        explanation:
          "Các lần quét của CÙNG bệnh nhân rất giống nhau. Nếu chia ngẫu nhiên, một số ảnh của bệnh nhân A sẽ ở train, số khác ở test → mô hình 'nhớ mặt' bệnh nhân chứ không học bệnh lý → accuracy ảo. Group K-Fold đảm bảo bệnh nhân mới không xuất hiện trong training.",
      },
      {
        question: "GridSearchCV làm gì?",
        options: [
          "Tìm hyperparameter tối ưu bằng cách thử mọi tổ hợp và chọn tổ hợp có điểm CV trung bình cao nhất.",
          "Chạy thuật toán grid search không liên quan đến cross-validation.",
          "Chia dữ liệu thành lưới (grid) và test từng ô.",
        ],
        correct: 0,
        explanation:
          "GridSearchCV kết hợp 2 ý tưởng: (1) duyệt toàn bộ tổ hợp hyperparameter (grid), (2) với mỗi tổ hợp, đánh giá bằng K-Fold CV. Cuối cùng chọn tổ hợp có điểm CV cao nhất → đáng tin hơn chia train/test 1 lần.",
      },
      {
        question:
          "Bạn chạy 10-Fold CV và nhận được scores [0.92, 0.91, 0.50, 0.93, 0.90, 0.92, 0.51, 0.91, 0.92, 0.90]. Chẩn đoán?",
        options: [
          "Mô hình rất tốt — trung bình 83%.",
          "Có thể có 2 fold 'xấu' do phân bố lớp không đồng đều hoặc có outlier nhóm mẫu — cần stratify hoặc xem kỹ những mẫu đó.",
          "K quá lớn, nên giảm xuống 3.",
        ],
        correct: 1,
        explanation:
          "Chênh lệch ~40% điểm phần trăm giữa các fold là tín hiệu đỏ. Có thể: (1) phân bố lớp bị lệch ở 2 fold đó → dùng Stratified K-Fold, (2) có outlier hoặc nhóm mẫu hiếm rơi vào đúng 2 fold này → thử Group K-Fold, (3) dataset quá nhỏ. Std cao che giấu bởi mean.",
      },
    ],
    [],
  );

  /* ══════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════════ */
  return (
    <>
      {/* ════════════════ STEP 1: PREDICTION GATE ════════════════ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn ôn thi bằng 1 bộ đề duy nhất, đạt 9 điểm. Bạn có chắc mình giỏi thật không? Hay chỉ tình cờ hợp đề?"
          options={[
            "Chắc chắn giỏi — 9 điểm là 9 điểm",
            "Chưa chắc — nên làm 5 bộ đề khác nhau rồi tính trung bình mới biết thực lực",
            "Không quan trọng — chỉ cần qua điểm liệt",
          ]}
          correct={1}
          explanation="1 đề có thể 'may' hoặc 'xui'. 5 đề cho trung bình ổn định hơn — đó là cross-validation! Thay vì đánh giá model trên 1 tập test duy nhất, ta chia dữ liệu thành K phần và test K lần."
        >
          <div className="mt-4 rounded-xl border border-border bg-surface/60 p-4">
            <p className="text-sm leading-relaxed text-foreground">
              <strong>Phép ẩn dụ:</strong> tưởng tượng một lớp học có 50 bài
              kiểm tra mẫu. Nếu chỉ làm 1 bài và dựa vào kết quả đó để tự tin
              về năng lực, bạn có thể bị đánh lừa bởi việc đề hôm đó hợp bạn.
              Cross-validation biến 1 lần thi thành K lần thi, mỗi lần dùng
              một phần khác nhau để kiểm tra — điểm trung bình mới phản ánh
              đúng trình độ.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Ở trang này, chúng ta sẽ nhìn trực tiếp K-Fold hoạt động:
              các phần dữ liệu luân phiên được giao vai trò train và test,
              rồi so sánh sáu biến thể chính (Hold-out, K-Fold, Stratified,
              Leave-One-Out, Time Series Split, Group K-Fold).
            </p>
          </div>

          {/* ════════════════ STEP 2: VISUALIZATION ════════════════ */}
          <LessonSection
            step={2}
            totalSteps={TOTAL_STEPS}
            label="Khám phá"
          >
            <p className="mb-4 text-sm text-muted leading-relaxed">
              Nhấp vào từng{" "}
              <strong className="text-foreground">fold (lượt)</strong>{" "}
              để xem phần nào train (xám), phần nào test (màu). Nhấn nút{" "}
              <strong className="text-foreground">Auto-play</strong>{" "}
              để xem toàn bộ vòng lặp chạy tự động. Đổi K để cảm nhận sự
              đánh đổi giữa chi phí tính toán và độ ổn định.
            </p>

            <VisualizationSection>
              <div className="space-y-5">
                {/* ─────────── SVG K-Fold diagram ─────────── */}
                <svg
                  viewBox="0 0 520 340"
                  className="w-full rounded-lg border border-border bg-background"
                  aria-label={`Sơ đồ ${k}-Fold Cross Validation`}
                >
                  {/* Title */}
                  <text
                    x={260}
                    y={22}
                    fontSize={13}
                    fill="currentColor"
                    className="text-foreground"
                    textAnchor="middle"
                    fontWeight={700}
                  >
                    {k}-Fold Cross Validation — Fold đang chạy: F{activeFold + 1}
                  </text>

                  {/* Column headers: "Khối dữ liệu 1", "Khối 2"... */}
                  {Array.from({ length: k }, (_, block) => {
                    const blockW = Math.min(62, 380 / k - 4);
                    const bx = 48 + block * (blockW + 4);
                    return (
                      <text
                        key={`hdr-${block}`}
                        x={bx + blockW / 2}
                        y={44}
                        fontSize={9}
                        textAnchor="middle"
                        fill="currentColor"
                        className="text-muted"
                      >
                        Khối {block + 1}
                      </text>
                    );
                  })}

                  {/* Fold rows */}
                  {scores.map((score, fold) => {
                    const y = 58 + fold * (220 / k);
                    const isActive = fold === activeFold;
                    const blockW = Math.min(62, 380 / k - 4);
                    const foldColour =
                      FOLD_COLORS[fold % FOLD_COLORS.length];

                    return (
                      <g
                        key={fold}
                        className="cursor-pointer"
                        onClick={() => {
                          setActiveFold(fold);
                          setIsAnimating(false);
                        }}
                      >
                        <motion.g
                          animate={{ opacity: isActive ? 1 : 0.4 }}
                          transition={{ duration: 0.25 }}
                        >
                          {/* Fold label */}
                          <text
                            x={12}
                            y={y + 15}
                            fontSize={11}
                            fill="currentColor"
                            className="text-muted"
                            fontWeight={isActive ? 700 : 500}
                          >
                            F{fold + 1}
                          </text>

                          {/* Data blocks */}
                          {Array.from({ length: k }, (_, block) => {
                            const bx = 48 + block * (blockW + 4);
                            const isTest = block === fold;
                            return (
                              <g key={block}>
                                <motion.rect
                                  x={bx}
                                  y={y}
                                  width={blockW}
                                  height={22}
                                  rx={5}
                                  fill={isTest ? foldColour : "#64748b"}
                                  opacity={
                                    isTest
                                      ? isActive
                                        ? 0.9
                                        : 0.55
                                      : isActive
                                        ? 0.18
                                        : 0.1
                                  }
                                  stroke={
                                    isTest ? foldColour : "transparent"
                                  }
                                  strokeWidth={isTest ? 2 : 0}
                                  initial={false}
                                  animate={{
                                    opacity: isTest
                                      ? isActive
                                        ? 0.9
                                        : 0.55
                                      : isActive
                                        ? 0.18
                                        : 0.1,
                                  }}
                                  transition={{ duration: 0.35 }}
                                />
                                <text
                                  x={bx + blockW / 2}
                                  y={y + 14}
                                  fontSize={9}
                                  fill={isTest ? "#fff" : "#94a3b8"}
                                  textAnchor="middle"
                                  fontWeight={isTest ? 700 : 500}
                                >
                                  {isTest ? "Test" : "Train"}
                                </text>
                              </g>
                            );
                          })}

                          {/* Score label */}
                          <text
                            x={52 + k * (blockW + 4)}
                            y={y + 15}
                            fontSize={11}
                            fill={foldColour}
                            fontWeight={700}
                          >
                            {pct(score)}
                          </text>
                        </motion.g>
                      </g>
                    );
                  })}

                  {/* Divider */}
                  <line
                    x1={48}
                    y1={58 + scores.length * (220 / k) + 8}
                    x2={48 + k * (Math.min(62, 380 / k - 4) + 4) + 40}
                    y2={58 + scores.length * (220 / k) + 8}
                    stroke="currentColor"
                    className="text-border"
                    strokeWidth={1}
                  />

                  {/* Summary: mean ± std */}
                  <text
                    x={260}
                    y={310}
                    fontSize={14}
                    fill="#22c55e"
                    textAnchor="middle"
                    fontWeight={800}
                  >
                    Trung bình: {pct(avgScore)} ± {pct(stdScore)}
                  </text>
                  <text
                    x={260}
                    y={328}
                    fontSize={10}
                    fill="currentColor"
                    className="text-muted"
                    textAnchor="middle"
                  >
                    Min: {pct(minScore)} · Max: {pct(maxScore)} · K = {k}{" "}
                    fold
                  </text>
                </svg>

                {/* ─────────── Per-fold accuracy bar chart ─────────── */}
                <div className="rounded-lg border border-border bg-surface/50 p-4">
                  <h4 className="mb-3 text-sm font-semibold text-foreground">
                    Độ chính xác từng fold
                  </h4>
                  <div className="flex items-end gap-2 h-28">
                    {scores.map((score, i) => {
                      const heightPct =
                        ((score - 0.6) / 0.4) * 100; // scale 0.6-1.0 → 0-100
                      const foldColour =
                        FOLD_COLORS[i % FOLD_COLORS.length];
                      const isActive = i === activeFold;
                      return (
                        <div
                          key={i}
                          className="flex-1 flex flex-col items-center gap-1"
                        >
                          <span
                            className="text-[10px] font-semibold"
                            style={{ color: foldColour }}
                          >
                            {pct(score)}
                          </span>
                          <motion.div
                            className="w-full rounded-t-md"
                            style={{
                              backgroundColor: foldColour,
                              height: `${Math.max(4, heightPct)}%`,
                              opacity: isActive ? 1 : 0.45,
                            }}
                            animate={{
                              opacity: isActive ? 1 : 0.45,
                              scaleY: isActive ? 1.05 : 1,
                            }}
                            transition={{ duration: 0.3 }}
                          />
                          <span className="text-[10px] text-muted">
                            F{i + 1}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {/* Mean reference line */}
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                    <span className="inline-block h-0.5 w-6 bg-green-500" />
                    <span>
                      Đường trung bình: {pct(avgScore)} (độ lệch chuẩn ±{" "}
                      {pct(stdScore)})
                    </span>
                  </div>
                </div>

                {/* ─────────── Controls ─────────── */}
                <div className="flex flex-wrap items-center gap-3 justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted">
                      K =
                    </span>
                    {K_OPTIONS.map((kv) => (
                      <button
                        key={kv}
                        onClick={() => handleKChange(kv)}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                          k === kv
                            ? "bg-accent text-white"
                            : "border border-border text-muted hover:text-foreground"
                        }`}
                      >
                        {kv}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <AnimatePresence mode="wait">
                      {!isAnimating ? (
                        <motion.button
                          key="play"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={handleStartAnimation}
                          className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent-dark transition-colors"
                        >
                          ▶ Auto-play
                        </motion.button>
                      ) : (
                        <motion.button
                          key="stop"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={handleStopAnimation}
                          className="rounded-lg border border-border px-4 py-1.5 text-sm font-medium text-foreground hover:bg-surface-hover transition-colors"
                        >
                          ■ Dừng
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <p className="text-xs text-muted text-center leading-relaxed">
                  Nhấp từng fold để xem chi tiết, hoặc bấm Auto-play để mô
                  hình chạy đủ vòng lặp. Đổi K = 3 rồi K = 10: bạn có thấy
                  số fold thay đổi phản ánh ngay trên sơ đồ?
                </p>

                {/* ─────────── Strategy comparison panel ─────────── */}
                <div className="rounded-lg border border-border bg-background p-4">
                  <h4 className="mb-3 text-sm font-semibold text-foreground">
                    So sánh các chiến lược chia dữ liệu
                  </h4>
                  <p className="mb-4 text-xs text-muted leading-relaxed">
                    Mỗi chiến lược có điểm mạnh riêng. Bấm vào nút bên dưới
                    để xem giải thích, ưu nhược điểm và tình huống sử dụng
                    phù hợp.
                  </p>

                  {/* Strategy picker */}
                  <div className="mb-4 flex flex-wrap gap-2">
                    {STRATEGIES.map((strat) => (
                      <button
                        key={strat.id}
                        onClick={() => setSelectedStrategy(strat.id)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                          selectedStrategy === strat.id
                            ? "bg-accent text-white border-accent"
                            : "border-border text-muted hover:text-foreground hover:border-accent/50"
                        }`}
                        style={
                          selectedStrategy === strat.id
                            ? {
                                backgroundColor: strat.colour,
                                borderColor: strat.colour,
                              }
                            : {}
                        }
                      >
                        {strat.label}
                      </button>
                    ))}
                  </div>

                  {/* Strategy detail card */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedStrategyInfo.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="rounded-lg border p-4"
                      style={{
                        borderColor: `${selectedStrategyInfo.colour}60`,
                        backgroundColor: `${selectedStrategyInfo.colour}10`,
                      }}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{
                            backgroundColor: selectedStrategyInfo.colour,
                          }}
                        />
                        <h5 className="text-sm font-bold text-foreground">
                          {selectedStrategyInfo.label}
                        </h5>
                        <span className="ml-auto rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] text-muted">
                          Chi phí: {selectedStrategyInfo.complexity}
                        </span>
                      </div>
                      <p className="mb-2 text-sm text-foreground">
                        {selectedStrategyInfo.shortVi}
                      </p>
                      <p className="mb-3 text-xs text-muted leading-relaxed">
                        {selectedStrategyInfo.longVi}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="mb-1 text-xs font-semibold text-green-700 dark:text-green-400">
                            Ưu điểm
                          </p>
                          <ul className="list-disc list-inside space-y-1 text-xs text-muted">
                            {selectedStrategyInfo.prosVi.map((p, i) => (
                              <li key={i}>{p}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="mb-1 text-xs font-semibold text-red-700 dark:text-red-400">
                            Nhược điểm
                          </p>
                          <ul className="list-disc list-inside space-y-1 text-xs text-muted">
                            {selectedStrategyInfo.consVi.map((p, i) => (
                              <li key={i}>{p}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="mt-3 rounded-md bg-background/70 p-2 text-xs text-foreground leading-relaxed">
                        <strong>Khi nào dùng:</strong>{" "}
                        {selectedStrategyInfo.whenVi}
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Quick comparison table */}
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border text-left text-muted">
                          <th className="py-2 pr-3 font-semibold">Chiến lược</th>
                          <th className="py-2 pr-3 font-semibold">
                            Phù hợp
                          </th>
                          <th className="py-2 pr-3 font-semibold">Chi phí</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {STRATEGIES.map((s) => (
                          <tr
                            key={s.id}
                            className={`cursor-pointer hover:bg-surface-hover/40 ${
                              selectedStrategy === s.id
                                ? "bg-surface/60"
                                : ""
                            }`}
                            onClick={() => setSelectedStrategy(s.id)}
                          >
                            <td className="py-1.5 pr-3 font-medium text-foreground">
                              <span
                                className="mr-2 inline-block h-2 w-2 rounded-full align-middle"
                                style={{ backgroundColor: s.colour }}
                              />
                              {s.label}
                            </td>
                            <td className="py-1.5 pr-3 text-muted">
                              {s.shortVi}
                            </td>
                            <td className="py-1.5 pr-3 text-muted">
                              {s.complexity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </VisualizationSection>
          </LessonSection>

          {/* ════════════════ STEP 3: AHA MOMENT ════════════════ */}
          <LessonSection
            step={3}
            totalSteps={TOTAL_STEPS}
            label="Khoảnh khắc Aha"
          >
            <AhaMoment>
              <p>
                <strong>K-Fold Cross-Validation</strong> = luân phiên K
                lần: mỗi lần 1 phần test, còn lại train. Mọi mẫu đều được
                test đúng 1 lần → ước lượng ổn định hơn chia 1 lần!
              </p>
              <p className="mt-3">
                Điểm cuối cùng không phải là 1 con số duy nhất mà là{" "}
                <strong>cặp (trung bình, độ lệch chuẩn)</strong>. Độ lệch
                cho biết mô hình nhạy ra sao với cách chia — std thấp = ổn
                định, std cao = báo động.
              </p>
            </AhaMoment>
          </LessonSection>

          {/* ════════════════ STEP 4: CHALLENGES ════════════════ */}
          <LessonSection
            step={4}
            totalSteps={TOTAL_STEPS}
            label="Thử thách"
          >
            <InlineChallenge
              question="Cross-validation 5-fold cho scores: [95%, 50%, 93%, 48%, 94%]. Trung bình 76%. Có vấn đề gì?"
              options={[
                "Không vấn đề — 76% là điểm thực tế",
                "Variance quá cao (scores dao động mạnh) — có thể dữ liệu không đồng đều hoặc data leakage",
                "Cần tăng K lên 10 để sửa",
              ]}
              correct={1}
              explanation="Scores dao động 48-95% → mô hình không ổn định! Có thể: (1) dữ liệu phân bố không đều giữa các fold → dùng Stratified K-Fold, (2) data leakage, (3) mô hình quá nhạy. Trung bình che giấu vấn đề — luôn xem std!"
            />

            <div className="mt-4">
              <InlineChallenge
                question="Bạn train mô hình phát hiện gian lận thẻ tín dụng (0.5% giao dịch là gian lận). Dataset 1 triệu mẫu. Phương án nào phù hợp nhất?"
                options={[
                  "K-Fold thường với K = 5",
                  "Hold-out 70/30 — dataset đã rất lớn rồi",
                  "Stratified K-Fold với K = 5 để đảm bảo mỗi fold có đủ tỷ lệ gian lận",
                ]}
                correct={2}
                explanation="Với dữ liệu mất cân bằng 99.5/0.5, K-Fold thường có thể cho ra fold thiếu hoàn toàn lớp gian lận. Stratified K-Fold giữ tỷ lệ 0.5% trong mỗi fold → ước lượng precision/recall đáng tin cậy. Hold-out 1 lần tuy nhanh nhưng không đủ ổn định cho báo cáo chính thức."
              />
            </div>
          </LessonSection>

          {/* ════════════════ STEP 5: EXPLANATION ════════════════ */}
          <LessonSection
            step={5}
            totalSteps={TOTAL_STEPS}
            label="Lý thuyết"
          >
            <ExplanationSection>
              {/* ─── Definition ─── */}
              <p>
                <strong>K-Fold Cross-Validation</strong> chia dữ liệu
                thành K phần bằng nhau (gọi là <em>fold</em>). Mỗi lượt:
                1 phần đóng vai test, K-1 phần còn lại đóng vai train. Sau
                K lượt, mỗi mẫu được test đúng 1 lần — và điểm tổng là
                trung bình của K lượt đánh giá riêng biệt.
              </p>

              <p className="mt-3">
                Đây là giải pháp mạnh hơn{" "}
                <TopicLink slug="train-val-test">
                  chia train/val/test một lần
                </TopicLink>{" "}
                vì ta tận dụng hết dữ liệu: mọi điểm đều được train (K-1)
                lần và test 1 lần, thay vì chỉ có 70% train và 30% test cố
                định.
              </p>

              {/* ─── LaTeX formula ─── */}
              <LaTeX block>
                {"\\text{CV Score} = \\frac{1}{K}\\sum_{k=1}^{K} \\text{Score}_k"}
              </LaTeX>

              <p className="text-sm text-muted">
                Với độ lệch chuẩn đi kèm để đo độ ổn định của ước lượng:
              </p>

              <LaTeX block>
                {
                  "\\text{CV Std} = \\sqrt{\\frac{1}{K}\\sum_{k=1}^{K} (\\text{Score}_k - \\overline{\\text{Score}})^2}"
                }
              </LaTeX>

              {/* ─── Variants list ─── */}
              <p>
                <strong>Các biến thể phổ biến:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 pl-2 text-sm">
                <li>
                  <strong>Stratified K-Fold:</strong> Giữ tỷ lệ lớp bằng
                  nhau trong mỗi fold. BẮT BUỘC cho classification với dữ
                  liệu mất cân bằng.
                </li>
                <li>
                  <strong>Leave-One-Out (LOO):</strong> K = n (mỗi fold
                  chỉ 1 mẫu test). Variance cao, chậm, nhưng bias thấp
                  nhất.
                </li>
                <li>
                  <strong>Time Series Split:</strong> Fold 1: train
                  [1–2], test [3]. Fold 2: train [1–3], test [4]. Luôn
                  train trước, test sau.
                </li>
                <li>
                  <strong>Repeated K-Fold:</strong> Chạy K-Fold nhiều lần
                  (mỗi lần shuffle khác) → ổn định hơn, tính được CI.
                </li>
                <li>
                  <strong>Group K-Fold:</strong> Đảm bảo các mẫu cùng
                  nhóm (bệnh nhân, user) không xuất hiện ở cả train và
                  test cùng lúc.
                </li>
                <li>
                  <strong>Nested CV:</strong> CV trong CV — vòng ngoài
                  đánh giá, vòng trong chọn hyperparameter. Đắt nhưng
                  tránh được selection bias.
                </li>
              </ul>

              {/* ─── Callout 1: CV vs overfitting ─── */}
              <Callout variant="tip" title="Cross-validation và Overfitting">
                CV là công cụ chẩn đoán{" "}
                <TopicLink slug="overfitting-underfitting">
                  overfitting/underfitting
                </TopicLink>{" "}
                đáng tin cậy hơn chia 1 lần. Kết hợp với đường cong{" "}
                <TopicLink slug="bias-variance">bias-variance</TopicLink>{" "}
                để hiểu nguyên nhân gốc rễ. Nếu CV score cao nhưng test
                set cuối cùng thấp → có thể đang overfit lên chính quy
                trình CV (chọn mô hình dựa trên CV quá nhiều lần).
              </Callout>

              {/* ─── Callout 2: Grid Search ─── */}
              <Callout
                variant="tip"
                title="Cross-validation + Grid Search"
              >
                Kết hợp CV với grid search để chọn hyperparameter tối ưu.
                Ví dụ: thử <code>max_depth = [3, 5, 7, 10]</code> ×{" "}
                <code>C = [0.1, 1, 10]</code> → 12 tổ hợp × 5 fold = 60
                lần train. Scikit-learn có{" "}
                <code>GridSearchCV</code> tự động hoá toàn bộ quy trình
                này và trả về mô hình tốt nhất.
              </Callout>

              {/* ─── CodeBlock 1: scikit-learn ─── */}
              <CodeBlock
                language="python"
                title="Cross-Validation với scikit-learn"
              >
                {`from sklearn.model_selection import (
    cross_val_score, StratifiedKFold, TimeSeriesSplit,
    GridSearchCV, GroupKFold, RepeatedKFold,
)
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_iris

X, y = load_iris(return_X_y=True)

# 1. Simple K-Fold
scores = cross_val_score(
    RandomForestClassifier(random_state=42),
    X, y, cv=5, scoring="accuracy",
)
print(f"5-Fold: {scores.mean():.1%} ± {scores.std():.1%}")

# 2. Stratified K-Fold (giữ tỷ lệ lớp)
skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
scores_strat = cross_val_score(
    RandomForestClassifier(random_state=42),
    X, y, cv=skf, scoring="accuracy",
)
print(f"Stratified: {scores_strat.mean():.1%} ± {scores_strat.std():.1%}")

# 3. Grid Search + CV
param_grid = {"max_depth": [3, 5, 7], "n_estimators": [50, 100, 200]}
grid = GridSearchCV(
    RandomForestClassifier(random_state=42),
    param_grid, cv=5, scoring="accuracy", n_jobs=-1,
)
grid.fit(X, y)
print(f"Best params: {grid.best_params_}")
print(f"Best CV score: {grid.best_score_:.1%}")

# 4. Repeated K-Fold — chạy 5 lần × 5 fold = 25 lượt
rkf = RepeatedKFold(n_splits=5, n_repeats=5, random_state=42)
scores_rep = cross_val_score(
    RandomForestClassifier(random_state=42),
    X, y, cv=rkf, scoring="accuracy",
)
print(f"Repeated: {scores_rep.mean():.1%} ± {scores_rep.std():.1%} (n={len(scores_rep)})")`}
              </CodeBlock>

              {/* ─── CodeBlock 2: Pipeline + TimeSeriesSplit ─── */}
              <CodeBlock
                language="python"
                title="Pipeline an toàn + Time Series Split"
              >
                {`from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import TimeSeriesSplit, cross_val_score
import pandas as pd

# Pipeline = scaler + model; scaler CHỈ fit trên train của mỗi fold
pipe = Pipeline([
    ("scaler", StandardScaler()),
    ("clf", LogisticRegression(max_iter=1000)),
])

# ─── Ví dụ chuỗi thời gian ───
# df sắp xếp theo ngày tăng dần
df = pd.read_csv("bitcoin.csv").sort_values("date")
X = df[["open", "high", "low", "volume"]].values
y = (df["close"].shift(-1) > df["close"]).astype(int).values[:-1]
X = X[:-1]  # bỏ dòng cuối vì không có nhãn tương lai

tscv = TimeSeriesSplit(n_splits=5, gap=1)
# gap=1: chừa 1 ngày giữa train và test để tránh leakage kiểu "sáng biết giá chiều"

for i, (tr, te) in enumerate(tscv.split(X)):
    print(f"Fold {i+1}: train=[{tr.min()}..{tr.max()}] test=[{te.min()}..{te.max()}]")

scores = cross_val_score(pipe, X, y, cv=tscv, scoring="accuracy")
print(f"TS Split: {scores.mean():.1%} ± {scores.std():.1%}")

# ─── CẢNH BÁO: KHÔNG làm thế này ───
# scaler.fit(X)  # <-- RỒI cross_val_score → LEAKAGE: scaler đã nhìn test set
# Đúng là đặt scaler TRONG pipeline, scikit-learn sẽ fit riêng cho mỗi fold.`}
              </CodeBlock>

              {/* ─── Callout 3: Data leakage warning ─── */}
              <Callout
                variant="warning"
                title="Data Leakage nguy hiểm!"
              >
                KHÔNG được fit scaler / feature selection / imputer trên
                TOÀN BỘ dữ liệu trước khi CV! Phải đặt trong{" "}
                <code>Pipeline</code> để mỗi fold fit riêng. Nếu không →
                thông tin thống kê từ test lọt vào train → accuracy ảo
                (có thể cao hơn 5–10% so với thực tế).
              </Callout>

              {/* ─── Callout 4: Report mean + std ─── */}
              <Callout
                variant="info"
                title="Luôn báo cáo trung bình ± độ lệch chuẩn"
              >
                Một con số đơn lẻ như &ldquo;accuracy 87%&rdquo; vô
                nghĩa nếu không kèm std. Nên báo cáo{" "}
                <strong>87.0% ± 1.8%</strong> (std thấp = ổn định) thay
                vì <strong>87.0% ± 9.5%</strong> (std cao = không tin
                được). Nếu CI 95% trùng với baseline, cải tiến của bạn
                chưa chắc có ý nghĩa thống kê.
              </Callout>

              {/* ─── CollapsibleDetail 1: Math deep-dive ─── */}
              <CollapsibleDetail title="Toán học sâu hơn: bias-variance trade-off của K">
                <div className="space-y-3 text-sm">
                  <p>
                    Chọn K cho K-Fold là một dạng trade-off giữa bias và
                    variance của ước lượng lỗi kiểm tra:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 pl-2">
                    <li>
                      <strong>K nhỏ (ví dụ K=2):</strong> mỗi tập train
                      chỉ có ~50% dữ liệu → mô hình học được từ ít dữ
                      liệu hơn so với khi train trên full dataset → ước
                      lượng lỗi cao hơn thực tế (bias dương).
                    </li>
                    <li>
                      <strong>K lớn (ví dụ K=n, tức LOO):</strong> mỗi
                      tập train gần như toàn bộ dataset → bias thấp.
                      Nhưng K tập train rất giống nhau → K điểm đánh giá
                      tương quan cao → variance của trung bình không
                      giảm nhiều.
                    </li>
                    <li>
                      <strong>K = 5 hoặc 10:</strong> cân bằng tốt.
                      Kohavi (1995) thực nghiệm và đề xuất K = 10 cho
                      nhiều loại bài toán.
                    </li>
                  </ul>
                  <p>Công thức bias xấp xỉ cho K-Fold:</p>
                  <LaTeX block>
                    {
                      "\\text{Bias}(\\hat{L}_{K}) \\approx \\frac{1}{K}\\left[L(n) - L(n - n/K)\\right]"
                    }
                  </LaTeX>
                  <p>
                    trong đó <em>L(m)</em> là lỗi kỳ vọng khi train trên
                    m mẫu. Khi K → n, bias → 0 nhưng variance tăng do
                    tương quan giữa các fold train.
                  </p>
                </div>
              </CollapsibleDetail>

              {/* ─── CollapsibleDetail 2: Nested CV ─── */}
              <CollapsibleDetail title="Nested Cross-Validation — khi cần báo cáo chính thức">
                <div className="space-y-3 text-sm">
                  <p>
                    Khi bạn dùng GridSearchCV, điểm tốt nhất mà grid tìm
                    được <strong>đã là kết quả của quá trình chọn lọc
                    trên CV</strong> → nó lạc quan hơn điểm thực tế.
                    Nested CV giải quyết bằng cách lồng 2 vòng CV:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 pl-2">
                    <li>
                      <strong>Vòng ngoài (outer CV):</strong> đánh giá
                      hiệu năng tổng quát. Chia K_outer fold.
                    </li>
                    <li>
                      <strong>Vòng trong (inner CV):</strong> trong mỗi
                      fold của outer, chạy grid search với K_inner fold
                      để chọn hyperparameter.
                    </li>
                  </ul>
                  <p>
                    Tổng chi phí: K_outer × K_inner × |grid| lần train.
                    Với K_outer = K_inner = 5 và grid 12 tổ hợp → 300
                    lần train. Đắt nhưng là cách duy nhất báo cáo điểm
                    không bị thiên vị cho paper hoặc benchmark công
                    khai.
                  </p>
                  <CodeBlock language="python" title="Nested CV skeleton">
                    {`from sklearn.model_selection import KFold, GridSearchCV, cross_val_score

outer = KFold(n_splits=5, shuffle=True, random_state=42)
inner = KFold(n_splits=3, shuffle=True, random_state=42)

grid = GridSearchCV(estimator=..., param_grid=..., cv=inner)

# cross_val_score gọi grid.fit trong MỖI outer fold
outer_scores = cross_val_score(grid, X, y, cv=outer, scoring="f1_macro")
print(f"Nested CV: {outer_scores.mean():.3f} ± {outer_scores.std():.3f}")`}
                  </CodeBlock>
                </div>
              </CollapsibleDetail>

              {/* ─── Real-world applications ─── */}
              <div className="mt-4">
                <p>
                  <strong>Ứng dụng thực tế:</strong>
                </p>
                <ul className="list-disc list-inside space-y-2 pl-2 text-sm">
                  <li>
                    <strong>Kaggle competition:</strong> hầu hết
                    leaderboard top đều dùng 5-Fold hoặc 10-Fold CV để
                    chọn mô hình, tránh overfitting lên public LB.
                  </li>
                  <li>
                    <strong>Phát hiện gian lận ngân hàng:</strong>{" "}
                    Stratified K-Fold là mặc định do tỷ lệ gian lận rất
                    nhỏ (&lt;1%).
                  </li>
                  <li>
                    <strong>Dự báo nhu cầu điện:</strong> Time Series
                    Split bắt buộc — train trên lịch sử, test trên
                    tương lai.
                  </li>
                  <li>
                    <strong>Phân loại X-quang:</strong> Group K-Fold
                    theo bệnh nhân — tránh 1 bệnh nhân có ảnh ở cả train
                    và test.
                  </li>
                  <li>
                    <strong>A/B testing mô hình:</strong> Repeated K-Fold
                    cho khoảng tin cậy → quyết định có triển khai bản
                    mới không.
                  </li>
                </ul>
              </div>

              {/* ─── Common pitfalls ─── */}
              <div className="mt-4">
                <p>
                  <strong>Các lỗi thường gặp:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-2 pl-2 text-sm">
                  <li>
                    <strong>Fit scaler trên toàn bộ dữ liệu:</strong>{" "}
                    leak mean/std của test set vào train. Cách đúng:
                    đặt scaler trong Pipeline.
                  </li>
                  <li>
                    <strong>
                      Dùng K-Fold cho chuỗi thời gian:
                    </strong>{" "}
                    xáo trộn → tương lai lọt vào quá khứ. Luôn dùng
                    TimeSeriesSplit.
                  </li>
                  <li>
                    <strong>Báo cáo chỉ mean, bỏ std:</strong> bỏ qua
                    thông tin quan trọng về độ ổn định.
                  </li>
                  <li>
                    <strong>
                      GridSearchCV trên toàn bộ dữ liệu rồi chọn mô
                      hình:
                    </strong>{" "}
                    điểm báo cáo đã lạc quan. Dùng nested CV nếu cần
                    báo cáo chính thức.
                  </li>
                  <li>
                    <strong>Quên stratify:</strong> với dữ liệu mất cân
                    bằng, K-Fold thường có thể cho fold trống lớp thiểu
                    số.
                  </li>
                  <li>
                    <strong>Quên group:</strong> bệnh nhân, user,
                    camera — nếu có &ldquo;nhóm&rdquo; tự nhiên, phải
                    dùng Group K-Fold.
                  </li>
                </ol>
              </div>
            </ExplanationSection>
          </LessonSection>

          {/* ════════════════ STEP 6: MINI SUMMARY ════════════════ */}
          <LessonSection
            step={6}
            totalSteps={TOTAL_STEPS}
            label="Tóm tắt"
          >
            <MiniSummary
              points={[
                "K-Fold CV: chia K phần, luân phiên test → mỗi mẫu test đúng 1 lần → ổn định hơn chia 1 lần.",
                "K=5 hoặc 10 phổ biến. Stratified K-Fold cho classification, Time Series Split cho dữ liệu thời gian, Group K-Fold khi có nhóm tự nhiên.",
                "Luôn xem cả mean VÀ std — std cao = mô hình không ổn định hoặc dữ liệu có vấn đề.",
                "GridSearchCV = grid search + CV: tìm hyperparameter tối ưu đáng tin cậy. Dùng nested CV khi báo cáo chính thức.",
                "CẢNH BÁO: fit scaler/encoder TRONG pipeline, không trước CV → tránh data leakage.",
                "Chi phí tính toán = K × |grid| × thời gian 1 lần train. Với model lớn, cân nhắc K=3 hoặc dùng subset để prototype.",
              ]}
            />
          </LessonSection>

          {/* ════════════════ STEP 7: QUIZ ════════════════ */}
          <LessonSection
            step={7}
            totalSteps={TOTAL_STEPS}
            label="Kiểm tra"
          >
            <QuizSection questions={quizQuestions} />
          </LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
