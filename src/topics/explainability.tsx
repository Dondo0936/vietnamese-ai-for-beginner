"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  EyeOff,
  Lock,
  Unlock,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  FileSearch,
  Layers,
  Sparkles,
  Scale,
} from "lucide-react";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  Callout,
  CollapsibleDetail,
  MiniSummary,
  MatchPairs,
  ToggleCompare,
  LessonSection,
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
  difficulty: "advanced",
  relatedSlugs: ["bias-fairness", "alignment", "guardrails"],
  vizType: "interactive",
};

/* ==========================================================================
 *  DEMO 1 — FEATURE IMPORTANCE CHART
 *  Khi bạn "tắt" một yếu tố, xem quyết định có đảo chiều không?
 * ========================================================================== */

interface LoanFeature {
  key: string;
  label: string;
  importance: number; // trọng số (0-100) quyết định
  direction: "positive" | "negative";
  valueText: string;
  color: string;
  icon: string;
}

const LOAN_FEATURES: LoanFeature[] = [
  {
    key: "income",
    label: "Thu nhập hàng tháng",
    importance: 32,
    direction: "positive",
    valueText: "35 triệu",
    color: "#10b981",
    icon: "💰",
  },
  {
    key: "credit-history",
    label: "Lịch sử trả nợ",
    importance: 28,
    direction: "positive",
    valueText: "Sạch 5 năm",
    color: "#10b981",
    icon: "📋",
  },
  {
    key: "debt-ratio",
    label: "Tỷ lệ nợ hiện tại",
    importance: 18,
    direction: "negative",
    valueText: "45% thu nhập",
    color: "#ef4444",
    icon: "📉",
  },
  {
    key: "location",
    label: "Khu vực sinh sống",
    importance: 9,
    direction: "negative",
    valueText: "Quận 8, TP.HCM",
    color: "#ef4444",
    icon: "📍",
  },
  {
    key: "age",
    label: "Độ tuổi",
    importance: 6,
    direction: "positive",
    valueText: "34 tuổi",
    color: "#10b981",
    icon: "🎂",
  },
  {
    key: "job",
    label: "Nghề nghiệp",
    importance: 4,
    direction: "positive",
    valueText: "Kế toán",
    color: "#10b981",
    icon: "💼",
  },
  {
    key: "marital",
    label: "Tình trạng hôn nhân",
    importance: 2,
    direction: "positive",
    valueText: "Đã kết hôn",
    color: "#10b981",
    icon: "💍",
  },
  {
    key: "education",
    label: "Học vấn",
    importance: 1,
    direction: "positive",
    valueText: "Đại học",
    color: "#10b981",
    icon: "🎓",
  },
];

/** Chuyển tổng importance thành quyết định (>50 = duyệt). */
function computeDecision(activeKeys: Set<string>): {
  score: number;
  approved: boolean;
} {
  let score = 50; // điểm khởi đầu
  for (const f of LOAN_FEATURES) {
    if (!activeKeys.has(f.key)) continue;
    score += f.direction === "positive" ? f.importance : -f.importance;
  }
  return { score: Math.max(0, Math.min(100, score)), approved: score >= 50 };
}

function FeatureImportanceDemo() {
  const [active, setActive] = useState<Set<string>>(
    () => new Set(LOAN_FEATURES.map((f) => f.key))
  );

  const { score, approved } = useMemo(() => computeDecision(active), [active]);
  const maxImportance = Math.max(...LOAN_FEATURES.map((f) => f.importance));

  function toggle(key: string) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-background/60 p-4 space-y-3">
        <p className="text-sm text-muted leading-relaxed">
          Mỗi thanh là một yếu tố AI cân nhắc khi xét hồ sơ vay. Nhấn vào thanh
          để tạm <strong>bỏ yếu tố đó ra</strong> — xem quyết định có đổi
          không.
        </p>

        <div className="space-y-2">
          {LOAN_FEATURES.map((f) => {
            const isActive = active.has(f.key);
            const barWidth = (f.importance / maxImportance) * 100;
            return (
              <button
                key={f.key}
                onClick={() => toggle(f.key)}
                className={`w-full text-left rounded-lg border p-2.5 transition-all ${
                  isActive
                    ? "border-border bg-card hover:bg-surface"
                    : "border-dashed border-muted/40 bg-surface/40 opacity-60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{f.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-medium text-foreground truncate">
                        {f.label}
                      </span>
                      <span className="text-xs text-muted shrink-0">
                        {f.valueText}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted/20 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: isActive ? f.color : "#94a3b8",
                        }}
                        animate={{
                          width: isActive ? `${barWidth}%` : "0%",
                        }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1">
                    {f.direction === "positive" ? (
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                    )}
                    <span
                      className={`text-xs font-semibold ${
                        f.direction === "positive"
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {f.direction === "positive" ? "+" : "−"}
                      {f.importance}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quyết định hiển thị */}
      <motion.div
        key={`decision-${approved}-${score}`}
        initial={{ opacity: 0.7, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-xl border-2 p-4 ${
          approved
            ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
            : "border-red-400 bg-red-50 dark:bg-red-900/20"
        }`}
      >
        <div className="flex items-center gap-3">
          {approved ? (
            <CheckCircle2 className="h-8 w-8 text-emerald-600 shrink-0" />
          ) : (
            <XCircle className="h-8 w-8 text-red-600 shrink-0" />
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-base font-bold ${
                  approved
                    ? "text-emerald-800 dark:text-emerald-200"
                    : "text-red-800 dark:text-red-200"
                }`}
              >
                AI quyết định:{" "}
                {approved ? "ĐỒNG Ý CHO VAY" : "TỪ CHỐI CHO VAY"}
              </span>
              <span className="text-sm font-mono text-muted">
                Điểm: {score}/100
              </span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-muted/20 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  approved ? "bg-emerald-500" : "bg-red-500"
                }`}
                animate={{ width: `${score}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      <Callout variant="insight" title="Điều bạn vừa thấy">
        <p>
          Đây chính là <strong>feature importance</strong> — AI không chỉ nói
          &ldquo;đồng ý&rdquo; hay &ldquo;từ chối&rdquo;, mà cho bạn biết{" "}
          <em>yếu tố nào quan trọng đến đâu</em>. Khi bạn bỏ thu nhập (32 điểm)
          ra, quyết định thường đảo chiều. Khi bỏ học vấn (1 điểm) ra, gần như
          không đổi gì.
        </p>
      </Callout>
    </div>
  );
}

/* ==========================================================================
 *  DEMO 2 — LIME-STYLE HIGHLIGHTED APPLICATION
 *  Không công thức, chỉ tô màu: xanh = giúp được duyệt, đỏ = bị trừ điểm
 * ========================================================================== */

interface AppCell {
  label: string;
  value: string;
  effect: "boost" | "hurt" | "neutral";
  reason: string;
}

const APPLICATION_CELLS: AppCell[] = [
  {
    label: "Họ và tên",
    value: "Nguyễn Thị Hương",
    effect: "neutral",
    reason: "Không ảnh hưởng quyết định — chỉ để nhận dạng.",
  },
  {
    label: "Thu nhập/tháng",
    value: "35.000.000 ₫",
    effect: "boost",
    reason:
      "Thu nhập trên ngưỡng 25 triệu → mô hình tăng điểm tin cậy cho khả năng trả nợ.",
  },
  {
    label: "Số tiền muốn vay",
    value: "800.000.000 ₫",
    effect: "hurt",
    reason:
      "Khoản vay lớn hơn 20× lương tháng → mô hình giảm điểm vì rủi ro trả chậm cao.",
  },
  {
    label: "Lịch sử tín dụng",
    value: "Không nợ quá hạn 5 năm",
    effect: "boost",
    reason:
      "Lịch sử sạch → đây là tín hiệu mạnh nhất cho khả năng trả nợ tương lai.",
  },
  {
    label: "Địa chỉ",
    value: "Phường 12, Quận 8, TP.HCM",
    effect: "hurt",
    reason:
      "Mã bưu chính này xuất hiện nhiều trong lịch sử nợ xấu của ngân hàng — mô hình giảm điểm. Đây có thể là dấu hiệu của thiên kiến theo khu vực.",
  },
  {
    label: "Độ tuổi",
    value: "34",
    effect: "boost",
    reason:
      "Khoảng tuổi 30–45 được xem là ổn định về sự nghiệp và thu nhập.",
  },
  {
    label: "Nghề nghiệp",
    value: "Kế toán trưởng",
    effect: "boost",
    reason:
      "Nghề văn phòng có hợp đồng dài hạn → thu nhập ổn định hơn nghề tự do.",
  },
  {
    label: "Học vấn",
    value: "Cử nhân",
    effect: "neutral",
    reason: "Có đóng góp nhỏ nhưng không thay đổi quyết định cuối.",
  },
];

function LimeApplicationDemo() {
  const boostCount = APPLICATION_CELLS.filter((c) => c.effect === "boost")
    .length;
  const hurtCount = APPLICATION_CELLS.filter((c) => c.effect === "hurt").length;

  const withExplanation = (
    <div className="space-y-3">
      <p className="text-xs text-muted text-center">
        Mỗi ô được tô màu theo ảnh hưởng của nó đến quyết định. Di chuột/nhấn
        để xem lý do.
      </p>
      <div className="rounded-xl border-2 border-border bg-background/60 p-4 space-y-2">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <FileSearch className="h-4 w-4 text-accent" />
          <span className="text-sm font-semibold">
            Đơn xin vay — đã giải thích
          </span>
        </div>
        {APPLICATION_CELLS.map((cell) => {
          const bgClass =
            cell.effect === "boost"
              ? "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700"
              : cell.effect === "hurt"
                ? "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700"
                : "bg-surface border-border";
          return (
            <details
              key={cell.label}
              className={`rounded-lg border p-2.5 ${bgClass} transition-colors`}
            >
              <summary className="flex items-center justify-between gap-2 cursor-pointer list-none">
                <span className="text-xs text-muted">{cell.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {cell.value}
                  </span>
                  {cell.effect === "boost" && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                      GIÚP
                    </span>
                  )}
                  {cell.effect === "hurt" && (
                    <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-700 dark:text-red-300 text-[10px] font-bold">
                      TRỪ
                    </span>
                  )}
                </div>
              </summary>
              <p className="mt-2 pt-2 border-t border-border/60 text-xs text-foreground/80 leading-relaxed">
                {cell.reason}
              </p>
            </details>
          );
        })}
      </div>
      <div className="flex gap-2 text-xs justify-center">
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" />
          {boostCount} yếu tố giúp duyệt
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-red-400" />
          {hurtCount} yếu tố bị trừ điểm
        </span>
      </div>
    </div>
  );

  const withoutExplanation = (
    <div className="space-y-3">
      <p className="text-xs text-muted text-center">
        AI chỉ trả lời &ldquo;có/không&rdquo; — bạn không biết vì sao.
      </p>
      <div className="rounded-xl border-2 border-dashed border-muted/40 bg-background/40 p-4 space-y-2">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <EyeOff className="h-4 w-4 text-muted" />
          <span className="text-sm font-semibold text-muted">
            Đơn xin vay — không giải thích
          </span>
        </div>
        {APPLICATION_CELLS.map((cell) => (
          <div
            key={cell.label}
            className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface/40 p-2.5"
          >
            <span className="text-xs text-muted">{cell.label}</span>
            <span className="text-sm font-medium text-foreground">
              {cell.value}
            </span>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-red-400 bg-red-50 dark:bg-red-900/20 p-3 text-center">
        <p className="text-sm font-bold text-red-800 dark:text-red-200">
          Kết quả: TỪ CHỐI
        </p>
        <p className="text-xs text-red-700 dark:text-red-300 mt-1">
          Không có lý do cụ thể. Bạn không biết phải sửa gì để lần sau được
          duyệt.
        </p>
      </div>
    </div>
  );

  return (
    <ToggleCompare
      labelA="Có giải thích"
      labelB="Không giải thích"
      description="So sánh hai cách AI trả lời một đơn xin vay."
      childA={withExplanation}
      childB={withoutExplanation}
    />
  );
}

/* ==========================================================================
 *  DEMO 3 — BLACK-BOX vs WHITE-BOX
 *  Cây quyết định vs Mạng nơ-ron — trực quan, không công thức
 * ========================================================================== */

function WhiteBoxTree() {
  return (
    <svg
      viewBox="0 0 360 240"
      className="w-full h-auto"
      role="img"
      aria-label="Cây quyết định — minh bạch"
    >
      {/* Node gốc */}
      <g>
        <rect
          x={130}
          y={10}
          width={100}
          height={34}
          rx={6}
          fill="#10b981"
          stroke="#059669"
          strokeWidth={2}
        />
        <text
          x={180}
          y={32}
          textAnchor="middle"
          fill="white"
          fontSize={11}
          fontWeight={600}
        >
          Thu nhập ≥ 25tr?
        </text>
      </g>

      {/* Cành */}
      <line x1={155} y1={44} x2={85} y2={80} stroke="#64748b" strokeWidth={2} />
      <line
        x1={205}
        y1={44}
        x2={275}
        y2={80}
        stroke="#64748b"
        strokeWidth={2}
      />
      <text x={110} y={66} fill="var(--text-secondary)" fontSize={11} fontWeight={600}>
        Không
      </text>
      <text x={240} y={66} fill="var(--text-secondary)" fontSize={11} fontWeight={600}>
        Có
      </text>

      {/* Node trái */}
      <g>
        <rect
          x={25}
          y={80}
          width={120}
          height={34}
          rx={6}
          fill="#fecaca"
          stroke="#ef4444"
          strokeWidth={2}
        />
        <text
          x={85}
          y={102}
          textAnchor="middle"
          fill="#991b1b"
          fontSize={11}
          fontWeight={600}
        >
          TỪ CHỐI
        </text>
      </g>

      {/* Node phải */}
      <g>
        <rect
          x={215}
          y={80}
          width={120}
          height={34}
          rx={6}
          fill="#10b981"
          stroke="#059669"
          strokeWidth={2}
        />
        <text
          x={275}
          y={102}
          textAnchor="middle"
          fill="white"
          fontSize={11}
          fontWeight={600}
        >
          Lịch sử sạch?
        </text>
      </g>

      {/* Cành tầng 2 */}
      <line
        x1={250}
        y1={114}
        x2={190}
        y2={150}
        stroke="#64748b"
        strokeWidth={2}
      />
      <line
        x1={300}
        y1={114}
        x2={330}
        y2={150}
        stroke="#64748b"
        strokeWidth={2}
      />
      <text x={205} y={138} fill="var(--text-secondary)" fontSize={11} fontWeight={600}>
        Không
      </text>
      <text x={310} y={138} fill="var(--text-secondary)" fontSize={11} fontWeight={600}>
        Có
      </text>

      {/* Leaf phải-trái */}
      <g>
        <rect
          x={130}
          y={150}
          width={120}
          height={34}
          rx={6}
          fill="#fef3c7"
          stroke="#f59e0b"
          strokeWidth={2}
        />
        <text
          x={190}
          y={172}
          textAnchor="middle"
          fill="#92400e"
          fontSize={11}
          fontWeight={600}
        >
          XEM XÉT THÊM
        </text>
      </g>

      {/* Leaf phải-phải */}
      <g>
        <rect
          x={270}
          y={150}
          width={90}
          height={34}
          rx={6}
          fill="#bbf7d0"
          stroke="#16a34a"
          strokeWidth={2}
        />
        <text
          x={315}
          y={172}
          textAnchor="middle"
          fill="#14532d"
          fontSize={11}
          fontWeight={600}
        >
          ĐỒNG Ý
        </text>
      </g>

      {/* Chú thích */}
      <text x={180} y={215} textAnchor="middle" fill="#475569" fontSize={11}>
        Mỗi nhánh là một câu hỏi rõ ràng — con người đọc được.
      </text>
      <text x={180} y={230} textAnchor="middle" fill="#10b981" fontSize={11} fontWeight={600}>
        Bạn có thể đi từ gốc đến lá và kể lại bằng lời.
      </text>
    </svg>
  );
}

function BlackBoxNeuralNet() {
  // Vẽ mạng nơ-ron với nhiều nốt và rất nhiều đường nối
  const inputs = [30, 70, 110, 150, 190, 230];
  const hidden1 = [30, 60, 90, 120, 150, 180, 210, 240];
  const hidden2 = [30, 60, 90, 120, 150, 180, 210, 240];
  const outputs = [105, 135];

  return (
    <svg
      viewBox="0 0 360 240"
      className="w-full h-auto"
      role="img"
      aria-label="Mạng nơ-ron — hộp đen"
    >
      {/* Nền mờ ám chỉ hộp đen */}
      <rect
        x={30}
        y={8}
        width={300}
        height={210}
        rx={12}
        fill="#0f172a"
        opacity={0.92}
      />

      {/* Input layer */}
      {inputs.map((y, i) => (
        <circle
          key={`in-${i}`}
          cx={55}
          cy={y}
          r={6}
          fill="#3b82f6"
          stroke="#1d4ed8"
          strokeWidth={1}
        />
      ))}

      {/* Hidden 1 */}
      {hidden1.map((y, i) => (
        <circle
          key={`h1-${i}`}
          cx={145}
          cy={y}
          r={5}
          fill="#64748b"
          opacity={0.7}
        />
      ))}

      {/* Hidden 2 */}
      {hidden2.map((y, i) => (
        <circle
          key={`h2-${i}`}
          cx={235}
          cy={y}
          r={5}
          fill="#64748b"
          opacity={0.7}
        />
      ))}

      {/* Output */}
      {outputs.map((y, i) => (
        <circle
          key={`out-${i}`}
          cx={315}
          cy={y}
          r={7}
          fill={i === 0 ? "#10b981" : "#ef4444"}
          stroke="#0f172a"
          strokeWidth={2}
        />
      ))}

      {/* Các đường nối chằng chịt */}
      {inputs.map((yi) =>
        hidden1.map((yh, j) => (
          <line
            key={`l1-${yi}-${j}`}
            x1={61}
            y1={yi}
            x2={140}
            y2={yh}
            stroke="#475569"
            strokeWidth={0.5}
            opacity={0.35}
          />
        ))
      )}
      {hidden1.map((yh1) =>
        hidden2.map((yh2, j) => (
          <line
            key={`l2-${yh1}-${j}`}
            x1={150}
            y1={yh1}
            x2={230}
            y2={yh2}
            stroke="#475569"
            strokeWidth={0.5}
            opacity={0.35}
          />
        ))
      )}
      {hidden2.map((yh) =>
        outputs.map((yo, j) => (
          <line
            key={`l3-${yh}-${j}`}
            x1={240}
            y1={yh}
            x2={309}
            y2={yo}
            stroke="#475569"
            strokeWidth={0.7}
            opacity={0.5}
          />
        ))
      )}

      {/* Nhãn */}
      <text x={55} y={18} textAnchor="middle" fill="#60a5fa" fontSize={11}>
        Đầu vào
      </text>
      <text x={145} y={18} textAnchor="middle" fill="#94a3b8" fontSize={11}>
        ???
      </text>
      <text x={235} y={18} textAnchor="middle" fill="#94a3b8" fontSize={11}>
        ???
      </text>
      <text x={315} y={18} textAnchor="middle" fill="#f59e0b" fontSize={11}>
        Quyết định
      </text>

      {/* Icon khóa */}
      <g transform="translate(175 125)">
        <circle r={18} fill="#fbbf24" opacity={0.25} />
        <text textAnchor="middle" fontSize={20} y={7}>
          🔒
        </text>
      </g>
    </svg>
  );
}

function BlackWhiteBoxDemo() {
  const [show, setShow] = useState<"white" | "black">("white");

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setShow("white")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            show === "white"
              ? "bg-emerald-500 text-white"
              : "bg-surface text-muted hover:bg-surface-hover"
          }`}
        >
          <Unlock className="inline h-3.5 w-3.5 mr-1" /> Hộp trắng — Cây quyết định
        </button>
        <button
          onClick={() => setShow("black")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            show === "black"
              ? "bg-slate-900 text-white"
              : "bg-surface text-muted hover:bg-surface-hover"
          }`}
        >
          <Lock className="inline h-3.5 w-3.5 mr-1" /> Hộp đen — Mạng nơ-ron sâu
        </button>
      </div>

      <div className="rounded-xl border border-border bg-background/60 p-4 min-h-[260px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={show}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
          >
            {show === "white" ? <WhiteBoxTree /> : <BlackBoxNeuralNet />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 p-3 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-200">
            <Unlock className="h-4 w-4" /> Hộp trắng — dễ giải thích
          </div>
          <p className="text-xs text-foreground/80 leading-relaxed">
            Cây quyết định, hồi quy tuyến tính, luật if-then. Bạn đọc lại từng
            bước: &ldquo;Thu nhập ≥ 25 triệu? Nếu có, kiểm tra lịch sử...&rdquo;
            Kết quả được <strong>giải thích sẵn</strong>.
          </p>
        </div>
        <div className="rounded-lg border border-slate-400 bg-slate-100 dark:bg-slate-900/40 p-3 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
            <Lock className="h-4 w-4" /> Hộp đen — khó giải thích
          </div>
          <p className="text-xs text-foreground/80 leading-relaxed">
            Mạng nơ-ron sâu, mô hình ngôn ngữ lớn, rừng ngẫu nhiên nhiều cây.
            Hàng triệu phép nhân nối tiếp — ngay cả kỹ sư cũng không đọc được.
            Cần <strong>công cụ riêng</strong> (SHAP, LIME…) để &ldquo;soi&rdquo;.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
 *  QUIZ — 6 câu, không công thức
 * ========================================================================== */
const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question:
      "AI ngân hàng từ chối bạn vay. Theo nghĩa vụ của Explainable AI, bạn có quyền nhận gì?",
    options: [
      "Chỉ biết kết quả &ldquo;đồng ý&rdquo; hoặc &ldquo;từ chối&rdquo;",
      "Một lời giải thích cá nhân, cụ thể — yếu tố nào đã khiến bạn bị từ chối",
      "Một bản báo cáo ẩn danh của toàn bộ khách hàng bị từ chối",
      "Không có quyền gì nếu ngân hàng dùng AI",
    ],
    correct: 1,
    explanation:
      "Explainable AI yêu cầu giải thích CÁ NHÂN cho từng quyết định — không phải biểu mẫu chung chung &ldquo;do thuật toán&rdquo;. Đây là nguyên tắc được luật hóa ở EU (GDPR Điều 22, EU AI Act) và ngày càng được áp dụng ở Việt Nam (Nghị định 13/2023/NĐ-CP).",
  },
  {
    question:
      "AI từ chối với lý do: &ldquo;Bạn sống ở Quận 8, TP.HCM&rdquo;. Explainability giúp phát hiện điều gì?",
    options: [
      "AI đúng vì Quận 8 có tỷ lệ nợ xấu cao",
      "Dấu hiệu phân biệt gián tiếp: địa chỉ có thể là &ldquo;proxy&rdquo; cho thu nhập/dân tộc — vi phạm luật chống phân biệt",
      "Nên ẩn lý do để tránh tranh cãi",
      "Explainability không liên quan đến công bằng",
    ],
    correct: 1,
    explanation:
      "Giá trị thật của Explainable AI: nó phơi bày các yếu tố đáng ngờ như &ldquo;khu vực sinh sống&rdquo; — có thể là proxy cho dân tộc/thu nhập. Khi thấy được lý do, chúng ta mới có thể phát hiện và sửa thiên kiến ẩn trong mô hình.",
  },
  {
    question:
      "Cây quyết định và mạng nơ-ron sâu — loại nào tự nó đã &ldquo;giải thích được&rdquo;?",
    options: [
      "Cả hai đều rõ ràng",
      "Cây quyết định — mỗi nhánh là một câu hỏi, con người đọc được",
      "Mạng nơ-ron sâu — vì nó chính xác hơn",
      "Không loại nào — luôn cần công cụ bên ngoài",
    ],
    correct: 1,
    explanation:
      "Cây quyết định, hồi quy tuyến tính, luật if-then là &ldquo;mô hình minh bạch&rdquo; (hộp trắng). Mạng nơ-ron sâu với hàng triệu tham số là hộp đen — cần SHAP/LIME/heat-map để &ldquo;soi&rdquo; mới giải thích được.",
  },
  {
    question:
      "Bác sĩ dùng AI đọc X-quang. AI nói &ldquo;Có khối u, 87% chắc chắn&rdquo;. Bác sĩ cần gì thêm?",
    options: [
      "Không cần gì — 87% là đủ",
      "Một bản đồ nhiệt (heat-map) chỉ rõ VÙNG NÀO trên ảnh AI đang nhìn vào",
      "Danh sách các bệnh nhân khác có triệu chứng giống",
      "Số % cao hơn — tối thiểu 99%",
    ],
    correct: 1,
    explanation:
      "Heat-map (như Grad-CAM) cho bác sĩ thấy AI &ldquo;nhìn&rdquo; vào đâu. Nếu AI khoanh đúng chỗ khối u → tin tưởng. Nếu AI khoanh nhầm vào ngày tháng in trên phim → phát hiện được lỗi. Giải thích = công cụ kiểm tra chéo của chuyên gia.",
  },
  {
    question:
      "&ldquo;Local explanation&rdquo;, &ldquo;global explanation&rdquo;, và &ldquo;counterfactual&rdquo; khác nhau thế nào?",
    options: [
      "Tất cả là một — chỉ là cách gọi khác nhau",
      "Local = giải thích 1 quyết định cụ thể; Global = mô hình quan tâm gì nói chung; Counterfactual = &ldquo;nếu tôi đổi X thì kết quả có khác không?&rdquo;",
      "Chỉ local là thật sự hữu ích",
      "Counterfactual là kiểu giải thích đã lỗi thời",
    ],
    correct: 1,
    explanation:
      "Ba góc nhìn khác nhau. Local: &ldquo;Vì sao TÔI bị từ chối?&rdquo;. Global: &ldquo;Mô hình này nói chung coi trọng yếu tố gì?&rdquo;. Counterfactual: &ldquo;Nếu thu nhập tôi tăng 5 triệu thì sao?&rdquo;. Cả ba đều cần để giải thích đầy đủ.",
  },
  {
    question:
      "Một &ldquo;lời giải thích giả&rdquo; (fake explanation) là gì?",
    options: [
      "Lời giải thích đơn giản dễ hiểu",
      "Giải thích nghe hợp lý nhưng KHÔNG phản ánh đúng cách mô hình thật sự ra quyết định",
      "Giải thích bằng tiếng Anh thay vì tiếng Việt",
      "Giải thích có nhiều đồ thị",
    ],
    correct: 1,
    explanation:
      "&ldquo;Giải thích giả&rdquo; (fake explainability) là vấn đề nghiêm trọng: công cụ có thể vẽ ra một lý do nghe xuôi tai nhưng không khớp với cách mô hình thực sự tính toán. Đây là lý do EU AI Act yêu cầu giải thích phải &ldquo;thực chất&rdquo; — phản ánh đúng logic bên trong.",
  },
];

/* ==========================================================================
 *  MAIN COMPONENT
 * ========================================================================== */
export default function ExplainabilityTopic() {
  return (
    <>
      {/* =========================================================
          STEP 1 — PREDICTION GATE
          ========================================================= */}
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Ngân hàng từ chối cho bạn vay. AI đưa ra quyết định. Theo bạn, bạn có quyền đòi hỏi lý do cụ thể không?"
          options={[
            "Có — theo luật, ngân hàng bắt buộc phải giải thích",
            "Không — AI là bí mật kinh doanh, không cần giải thích",
            "Chỉ khi bạn đang ở EU (Liên minh Châu Âu)",
            "Chỉ khi khoản vay dưới 50 triệu",
          ]}
          correct={0}
          explanation="Ở Việt Nam, Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân có điều khoản về quyền được biết lý do khi dữ liệu của bạn bị xử lý tự động. Ở EU, GDPR Điều 22 và EU AI Act đều bắt buộc giải thích. Ở Mỹ, Cục Bảo vệ Tài chính Người tiêu dùng (CFPB) cũng yêu cầu lý do cụ thể. Đây là quyền chung trên toàn thế giới — không chỉ riêng EU."
        />
      </LessonSection>

      {/* =========================================================
          STEP 2 — PROSE + METAPHOR
          ========================================================= */}
      <LessonSection step={2} totalSteps={8} label="Trực giác ban đầu">
        <div className="space-y-4">
          <p className="text-foreground leading-relaxed">
            <strong>Explainability</strong> (khả năng giải thích được) là việc
            AI không chỉ đưa ra kết quả mà còn cho con người biết{" "}
            <em>vì sao</em> kết quả đó ra đời. Khi AI nói &ldquo;đồng ý&rdquo;
            hay &ldquo;từ chối&rdquo;, nó phải chỉ ra yếu tố nào đã đẩy quyết
            định về phía đó và yếu tố nào kéo về phía ngược lại.
          </p>

          <Callout variant="insight" title="Ẩn dụ: AI là hóa đơn thanh toán">
            <p>
              Khi bạn đi siêu thị, nhân viên đưa bạn hóa đơn liệt kê từng món:{" "}
              <em>cà phê 80.000đ, bánh mì 25.000đ…</em>. Bạn không chỉ biết
              tổng 350.000đ — bạn biết trả cho cái gì. Nếu chỉ đưa tờ giấy
              &ldquo;350.000đ&rdquo; không kèm chi tiết, bạn sẽ không tin.
            </p>
            <p className="mt-2">
              AI cũng vậy. Khi nó &ldquo;tính tiền&rdquo; cho một quyết định
              quan trọng — cho vay, tuyển dụng, chẩn đoán bệnh — bạn cần một
              &ldquo;hóa đơn&rdquo; liệt kê từng yếu tố đã góp phần vào quyết
              định đó.
            </p>
          </Callout>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-lg border border-border bg-surface/60 p-3 space-y-1">
              <Shield className="h-5 w-5 text-accent" />
              <p className="text-sm font-semibold">Để bảo vệ người dùng</p>
              <p className="text-xs text-muted leading-relaxed">
                Không ai bị từ chối vay, từ chối khám bệnh, từ chối việc làm
                mà không biết lý do.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface/60 p-3 space-y-1">
              <Scale className="h-5 w-5 text-accent" />
              <p className="text-sm font-semibold">Để tuân thủ luật</p>
              <p className="text-xs text-muted leading-relaxed">
                EU AI Act, GDPR, Nghị định 13/2023 của Việt Nam đều có điều
                khoản về quyền được giải thích.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface/60 p-3 space-y-1">
              <FileSearch className="h-5 w-5 text-accent" />
              <p className="text-sm font-semibold">Để phát hiện lỗi</p>
              <p className="text-xs text-muted leading-relaxed">
                Khi nhìn thấy lý do, nhà phát triển mới biết AI đang dùng yếu
                tố đáng ngờ như địa chỉ hay giới tính.
              </p>
            </div>
          </div>
        </div>
      </LessonSection>

      {/* =========================================================
          STEP 3 — VISUALIZATIONS
          ========================================================= */}
      <LessonSection step={3} totalSteps={8} label="Quan sát">
        <VisualizationSection topicSlug="explainability">
          <div className="space-y-8">
            {/* Demo 1: Feature importance */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white text-xs font-bold">
                  1
                </span>
                <h3 className="text-base font-semibold">
                  Yếu tố nào quan trọng đến đâu?
                </h3>
              </div>
              <p className="text-sm text-muted">
                Hồ sơ xin vay của bạn. AI cân 8 yếu tố. Nhấn vào từng thanh để
                &ldquo;bỏ yếu tố đó ra&rdquo; và xem quyết định có đảo chiều
                không.
              </p>
              <FeatureImportanceDemo />
            </div>

            {/* Demo 2: LIME-style */}
            <div className="space-y-2 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white text-xs font-bold">
                  2
                </span>
                <h3 className="text-base font-semibold">
                  Tô màu đơn xin vay — cách LIME giải thích
                </h3>
              </div>
              <p className="text-sm text-muted">
                LIME là một công cụ phổ biến. Nó tô xanh các ô &ldquo;giúp duyệt&rdquo;
                và đỏ các ô &ldquo;bị trừ điểm&rdquo;. Bạn so sánh: có giải
                thích khác không giải thích thế nào?
              </p>
              <LimeApplicationDemo />
            </div>

            {/* Demo 3: Black vs white box */}
            <div className="space-y-2 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white text-xs font-bold">
                  3
                </span>
                <h3 className="text-base font-semibold">
                  Hộp trắng và hộp đen — hai loại AI
                </h3>
              </div>
              <p className="text-sm text-muted">
                Không phải AI nào cũng như nhau. Một số mô hình tự nó đã rõ
                ràng, còn một số khác thì… chính kỹ sư làm ra cũng không đọc
                được.
              </p>
              <BlackWhiteBoxDemo />
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* =========================================================
          STEP 4 — AHA MOMENT
          ========================================================= */}
      <LessonSection step={4} totalSteps={8} label="Aha">
        <AhaMoment>
          <p>
            Không phải AI nào cũng &ldquo;giải thích được&rdquo; một cách tự
            nhiên.
          </p>
          <p className="mt-2">
            Cây quyết định, luật if-then — giải thích sẵn trong chính cấu trúc.
            Nhưng mạng nơ-ron sâu, mô hình ngôn ngữ lớn (như ChatGPT) —{" "}
            <strong>là hộp đen</strong>. Để &ldquo;hé lộ&rdquo; chúng, chúng
            ta cần công cụ bên ngoài: <strong>SHAP, LIME, Grad-CAM, Attention
            Maps</strong>.
          </p>
          <p className="mt-2 text-sm">
            Giống như kính hiển vi không làm thay đổi vi khuẩn — nó chỉ giúp
            bạn nhìn thấy.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* =========================================================
          STEP 5 — INLINE CHALLENGE
          ========================================================= */}
      <LessonSection step={5} totalSteps={8} label="Thử thách nhanh">
        <InlineChallenge
          question="Một công ty bảo hiểm dùng AI để từ chối bồi thường. Họ nói &ldquo;AI tự quyết định, chúng tôi không biết lý do&rdquo;. Lập luận nào ĐÚNG?"
          options={[
            "Hợp lý — AI quá phức tạp, không ai có thể giải thích",
            "Không chấp nhận được — họ phải đầu tư công cụ giải thích (SHAP/LIME…) hoặc dùng mô hình minh bạch hơn",
            "Chỉ cần họ cho xem mã nguồn là đủ",
            "Nếu AI chính xác thì không cần giải thích",
          ]}
          correct={1}
          explanation="&ldquo;AI phức tạp&rdquo; không phải lý do từ chối giải thích. Cục Bảo vệ Tài chính Mỹ (CFPB) nói rõ: nếu bạn không giải thích được quyết định, bạn không được dùng mô hình đó cho việc ảnh hưởng đến quyền lợi khách hàng. EU AI Act xếp các lĩnh vực như tín dụng, bảo hiểm, tuyển dụng vào &ldquo;rủi ro cao&rdquo; — bắt buộc có giải thích."
        />
      </LessonSection>

      {/* =========================================================
          STEP 6 — EXPLANATION (VISUAL-HEAVY)
          ========================================================= */}
      <LessonSection step={6} totalSteps={8} label="Đào sâu">
        <ExplanationSection topicSlug="explainability">
          {/* 3 kiểu explainability */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Layers className="h-4 w-4 text-accent" />
              Ba kiểu giải thích — ba góc nhìn khác nhau
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Callout variant="insight" title="Local — 1 quyết định">
                <p className="text-sm">
                  &ldquo;Vì sao <strong>TÔI</strong> bị từ chối?&rdquo;
                </p>
                <p className="text-xs mt-1 text-muted">
                  Giải thích cho từng trường hợp cá nhân — SHAP, LIME thường
                  làm việc này.
                </p>
              </Callout>
              <Callout variant="info" title="Global — toàn mô hình">
                <p className="text-sm">
                  &ldquo;Mô hình nói chung coi trọng yếu tố nào nhất?&rdquo;
                </p>
                <p className="text-xs mt-1 text-muted">
                  Dùng để kiểm tra tổng thể — mô hình có công bằng không, có
                  quan tâm đúng yếu tố không.
                </p>
              </Callout>
              <Callout variant="tip" title="Counterfactual — giả định">
                <p className="text-sm">
                  &ldquo;Nếu thu nhập tôi tăng 5 triệu thì có được duyệt
                  không?&rdquo;
                </p>
                <p className="text-xs mt-1 text-muted">
                  Giúp khách hàng biết phải làm gì để lần sau thành công.
                </p>
              </Callout>
            </div>
          </div>

          {/* Tools lineup */}
          <div className="space-y-3 pt-4">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              Ghép tên công cụ với đặc điểm của nó
            </h3>
            <MatchPairs
              instruction="Nhấn một công cụ bên trái, rồi nhấn đặc điểm đúng bên phải."
              pairs={[
                {
                  left: "SHAP",
                  right: "Tính đóng góp công bằng của từng yếu tố dựa trên lý thuyết trò chơi",
                },
                {
                  left: "LIME",
                  right: "Tô màu từng ô trong đơn xin — xanh là giúp, đỏ là trừ điểm",
                },
                {
                  left: "Grad-CAM",
                  right: "Bản đồ nhiệt chỉ ra vùng nào trên ảnh AI đang chú ý",
                },
                {
                  left: "Attention Maps",
                  right: "Cho thấy chữ/token nào mô hình ngôn ngữ đang tập trung vào",
                },
              ]}
            />
          </div>

          {/* Regulatory context */}
          <div className="space-y-3 pt-4">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Scale className="h-4 w-4 text-accent" />
              Khung pháp lý — bạn đang được bảo vệ như thế nào?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-xl border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-900/20 p-3 space-y-1">
                <p className="text-xs font-bold text-blue-800 dark:text-blue-300">
                  EU — GDPR Điều 22
                </p>
                <p className="text-xs text-foreground/80 leading-relaxed">
                  Bạn có quyền không bị &ldquo;quyết định hoàn toàn tự
                  động&rdquo; nếu nó ảnh hưởng đáng kể. Tổ chức phải cung cấp
                  &ldquo;thông tin có ý nghĩa về logic&rdquo;.
                </p>
              </div>
              <div className="rounded-xl border-l-4 border-l-purple-500 bg-purple-50 dark:bg-purple-900/20 p-3 space-y-1">
                <p className="text-xs font-bold text-purple-800 dark:text-purple-300">
                  EU — AI Act (2024)
                </p>
                <p className="text-xs text-foreground/80 leading-relaxed">
                  AI &ldquo;rủi ro cao&rdquo; (tín dụng, tuyển dụng, y tế,
                  giáo dục) <strong>bắt buộc</strong> phải có giải thích
                  &ldquo;thực chất&rdquo; — không chung chung.
                </p>
              </div>
              <div className="rounded-xl border-l-4 border-l-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 p-3 space-y-1">
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Việt Nam — NĐ 13/2023
                </p>
                <p className="text-xs text-foreground/80 leading-relaxed">
                  Nghị định về bảo vệ dữ liệu cá nhân có điều khoản về quyền
                  được biết khi dữ liệu bị xử lý tự động và được phản đối
                  quyết định.
                </p>
              </div>
            </div>
          </div>

          {/* Pitfalls */}
          <div className="pt-4">
            <CollapsibleDetail title="Cạm bẫy: 'giải thích giả' — nghe hay mà không thật">
              <div className="space-y-3 pt-2">
                <p className="text-sm leading-relaxed">
                  Không phải lời giải thích nào của AI cũng đáng tin. Đôi khi
                  công cụ giải thích <em>bịa ra</em> một lý do nghe xuôi tai
                  nhưng KHÔNG phản ánh đúng cách mô hình tính toán.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 p-3">
                    <div className="flex items-center gap-2 font-semibold text-red-800 dark:text-red-200 mb-1">
                      <XCircle className="h-4 w-4" /> Giải thích giả
                    </div>
                    <p className="text-xs leading-relaxed">
                      Công cụ gán lý do cho yếu tố &ldquo;lịch sự&rdquo; (thu
                      nhập, học vấn…) trong khi mô hình thật sự lại đang dựa
                      vào yếu tố nhạy cảm (khu vực, tên, giới tính).
                    </p>
                  </div>
                  <div className="rounded-lg border border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 p-3">
                    <div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-200 mb-1">
                      <CheckCircle2 className="h-4 w-4" /> Giải thích thật
                    </div>
                    <p className="text-xs leading-relaxed">
                      Giải thích nhất quán khi thử trên nhiều ví dụ tương tự,
                      có thể kiểm chứng bằng kiểm định độc lập, và được kỹ sư
                      mô hình xác nhận.
                    </p>
                  </div>
                </div>
                <Callout variant="warning" title="Điều nên nhớ">
                  <p className="text-xs">
                    Khi có một lời giải thích từ AI, hãy hỏi:{" "}
                    <em>&ldquo;Ai kiểm chứng được lời giải thích này?&rdquo;</em>{" "}
                    Nếu không ai làm được — coi chừng đây là giải thích giả.
                  </p>
                </Callout>
              </div>
            </CollapsibleDetail>
          </div>
        </ExplanationSection>
      </LessonSection>

      {/* =========================================================
          STEP 7 — MINI SUMMARY
          ========================================================= */}
      <LessonSection step={7} totalSteps={8} label="Gói gọn">
        <MiniSummary
          title="5 ý cốt lõi"
          points={[
            "Explainability = AI giải thích vì sao nó ra quyết định — như hóa đơn liệt kê từng khoản thanh toán.",
            "Có 3 kiểu giải thích: local (1 quyết định), global (toàn mô hình), counterfactual (nếu đổi X thì sao).",
            "Không phải AI nào cũng tự giải thích được — hộp đen (mạng nơ-ron sâu) cần công cụ bên ngoài như SHAP, LIME, Grad-CAM.",
            "Luật Việt Nam (NĐ 13/2023), EU (GDPR, AI Act), Mỹ (CFPB) đều yêu cầu giải thích cho AI ảnh hưởng đến quyền lợi con người.",
            "Coi chừng 'giải thích giả' — một lý do nghe xuôi tai nhưng không phản ánh đúng mô hình bên trong.",
          ]}
        />
      </LessonSection>

      {/* =========================================================
          STEP 8 — QUIZ
          ========================================================= */}
      <LessonSection step={8} totalSteps={8} label="Kiểm tra hiểu biết">
        <QuizSection questions={QUIZ_QUESTIONS} />
      </LessonSection>
    </>
  );
}
