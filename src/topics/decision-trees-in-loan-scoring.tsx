"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  CreditCard,
  Home,
  FileSignature,
  Briefcase,
  CheckCircle2,
  XCircle,
  Scale,
  ArrowDownRight,
  Info,
  RotateCcw,
} from "lucide-react";
import type { TopicMeta } from "@/lib/types";
import ApplicationLayout from "@/components/application/ApplicationLayout";
import ApplicationHero from "@/components/application/ApplicationHero";
import ApplicationProblem from "@/components/application/ApplicationProblem";
import ApplicationMechanism from "@/components/application/ApplicationMechanism";
import Beat from "@/components/application/Beat";
import ApplicationMetrics from "@/components/application/ApplicationMetrics";
import Metric from "@/components/application/Metric";
import ApplicationCounterfactual from "@/components/application/ApplicationCounterfactual";
import {
  InlineChallenge,
  Callout,
  StepReveal,
  LessonSection,
  MiniSummary,
  TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";

/* ════════════════════════════════════════════════════════════════════
 * METADATA
 * ════════════════════════════════════════════════════════════════════ */
export const metadata: TopicMeta = {
  slug: "decision-trees-in-loan-scoring",
  title: "Decision Trees in Credit Scoring",
  titleVi: "Cây quyết định chấm tín dụng",
  description:
    "Khách có vay được không? Nhập thu nhập, nợ, lịch sử rồi xem cây quyết định chạy qua từng câu hỏi để đưa ra câu trả lời có/không.",
  category: "classic-ml",
  tags: ["classification", "finance", "credit-scoring", "application"],
  difficulty: "beginner",
  relatedSlugs: ["decision-trees"],
  vizType: "interactive",
  applicationOf: "decision-trees",
  featuredApp: {
    name: "FICO Score",
    productFeature: "Credit Scoring",
    company: "Fair Isaac Corporation",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "Explainable Machine Learning in Credit Risk Management",
      publisher: "FICO Blog",
      url: "https://www.fico.com/blogs/explainable-machine-learning-credit-risk-management",
      date: "2020-06",
      kind: "engineering-blog",
    },
    {
      title: "Machine Learning and the FICO Score",
      publisher: "FICO Blog",
      url: "https://www.fico.com/blogs/machine-learning-and-fico-score",
      date: "2019-09",
      kind: "engineering-blog",
    },
    {
      title: "Using Alternative Data in Credit Underwriting",
      publisher: "Consumer Financial Protection Bureau (CFPB)",
      url: "https://www.consumerfinance.gov/data-research/research-reports/using-alternative-data-in-credit-underwriting/",
      date: "2019-12",
      kind: "documentation",
    },
    {
      title: "A Survey of Credit Scoring Research Based on Machine Learning",
      publisher: "Springer — Computational Economics",
      url: "https://link.springer.com/article/10.1007/s10614-023-10467-7",
      date: "2023-08",
      kind: "paper",
    },
    {
      title: "What Is a FICO Score?",
      publisher: "FICO",
      url: "https://www.myfico.com/credit-education/credit-scores",
      date: "2024-01",
      kind: "documentation",
    },
  ],
  tocSections: [
    { id: "hero", labelVi: "Công ty nào?" },
    { id: "problem", labelVi: "Vấn đề" },
    { id: "mechanism", labelVi: "Cách giải quyết" },
    { id: "visualization", labelVi: "Thử nộp đơn" },
    { id: "metrics", labelVi: "Con số thật" },
    { id: "counterfactual", labelVi: "Nếu không có" },
  ],
};

/* ════════════════════════════════════════════════════════════════════
 * CÂY QUYẾT ĐỊNH ĐƠN GIẢN HÓA
 * Mô phỏng pha đầu của hệ chấm điểm tín dụng: 4 câu hỏi, 8 lá.
 * Không phải model thật của FICO, chỉ lấy cho dễ hiểu — các tiêu chí
 * đúng tinh thần ngành (thu nhập, nợ hiện có, lịch sử trễ hạn, thời
 * gian mở tài khoản tín dụng đầu tiên).
 * ════════════════════════════════════════════════════════════════════ */
interface Applicant {
  income: number; // triệu VND / tháng
  debtRatio: number; // tỉ lệ nợ/thu nhập, 0–1
  hasLatePayment: boolean; // có trễ hạn > 30 ngày trong 2 năm qua
  yearsOfHistory: number; // thời gian có tín dụng (năm)
}

type QNodeId =
  | "root"
  | "qDebt"
  | "qLate"
  | "qHistory"
  | "qHistory2"
  | "qDebt2"
  | "leafApprove"
  | "leafApproveLow"
  | "leafReview"
  | "leafReject"
  | "leafRejectHistory"
  | "leafApproveHistory"
  | "leafApproveCond"
  | "leafRejectDebt";

interface DTNode {
  id: QNodeId;
  kind: "question" | "approve" | "approve-low" | "review" | "reject";
  text?: string;
  hint?: string;
  feature?: keyof Applicant;
  condition?: (a: Applicant) => boolean;
  yesId?: QNodeId;
  noId?: QNodeId;
  outcomeLabel?: string;
  outcomeReason?: string;
}

/* Tree layout (đồ họa dễ đọc) */
const TREE: Record<QNodeId, DTNode> = {
  root: {
    id: "root",
    kind: "question",
    text: "Thu nhập ≥ 15 triệu / tháng?",
    hint: "Bước 1 — khả năng trả nợ cơ bản",
    feature: "income",
    condition: (a) => a.income >= 15,
    yesId: "qDebt",
    noId: "qDebt2",
  },
  qDebt: {
    id: "qDebt",
    kind: "question",
    text: "Tỉ lệ nợ / thu nhập ≤ 40%?",
    hint: "Bước 2 — đã gánh quá nhiều nợ hiện có chưa",
    feature: "debtRatio",
    condition: (a) => a.debtRatio <= 0.4,
    yesId: "qLate",
    noId: "leafReject",
  },
  qLate: {
    id: "qLate",
    kind: "question",
    text: "Không có khoản trễ hạn > 30 ngày trong 24 tháng?",
    hint: "Bước 3 — lịch sử thanh toán",
    feature: "hasLatePayment",
    condition: (a) => !a.hasLatePayment,
    yesId: "qHistory",
    noId: "leafRejectHistory",
  },
  qHistory: {
    id: "qHistory",
    kind: "question",
    text: "Có ít nhất 3 năm lịch sử tín dụng?",
    hint: "Bước 4 — thời gian mở tài khoản",
    feature: "yearsOfHistory",
    condition: (a) => a.yearsOfHistory >= 3,
    yesId: "leafApprove",
    noId: "leafApproveCond",
  },
  qHistory2: {
    id: "qHistory2",
    kind: "question",
    text: "Có ít nhất 5 năm lịch sử tín dụng?",
    hint: "Bước 2b — với thu nhập thấp, lịch sử dài quan trọng hơn",
    feature: "yearsOfHistory",
    condition: (a) => a.yearsOfHistory >= 5,
    yesId: "qDebt2",
    noId: "leafReview",
  },
  qDebt2: {
    id: "qDebt2",
    kind: "question",
    text: "Tỉ lệ nợ / thu nhập ≤ 30%?",
    hint: "Bước 3b — với thu nhập thấp, ngưỡng nợ chặt hơn",
    feature: "debtRatio",
    condition: (a) => a.debtRatio <= 0.3,
    yesId: "leafApproveLow",
    noId: "leafRejectDebt",
  },
  leafApprove: {
    id: "leafApprove",
    kind: "approve",
    outcomeLabel: "Duyệt — hạn mức cao",
    outcomeReason:
      "Thu nhập tốt, nợ dưới ngưỡng, không trễ hạn, lịch sử dài — hồ sơ đạt mọi tiêu chí ưu tiên.",
  },
  leafApproveCond: {
    id: "leafApproveCond",
    kind: "approve-low",
    outcomeLabel: "Duyệt có điều kiện — hạn mức trung bình",
    outcomeReason:
      "Thu nhập và nợ ổn, lịch sử chưa đủ 3 năm → duyệt nhưng hạn mức ban đầu thấp hơn để giảm rủi ro.",
  },
  leafApproveLow: {
    id: "leafApproveLow",
    kind: "approve-low",
    outcomeLabel: "Duyệt — hạn mức thấp",
    outcomeReason:
      "Thu nhập dưới mức ưu tiên nhưng có lịch sử lâu năm và nợ rất thấp → duyệt với hạn mức bảo thủ.",
  },
  leafReview: {
    id: "leafReview",
    kind: "review",
    outcomeLabel: "Xem xét thêm hồ sơ",
    outcomeReason:
      "Thu nhập thấp, lịch sử ngắn → hệ thống không đủ cơ sở quyết; chuyển hồ sơ cho chuyên viên xem xét.",
  },
  leafReject: {
    id: "leafReject",
    kind: "reject",
    outcomeLabel: "Từ chối",
    outcomeReason:
      "Thu nhập đạt mức nhưng tỉ lệ nợ đã cao hơn 40% — thêm nợ nữa sẽ khiến người vay quá tải.",
  },
  leafRejectHistory: {
    id: "leafRejectHistory",
    kind: "reject",
    outcomeLabel: "Từ chối",
    outcomeReason:
      "Có khoản trễ hạn trên 30 ngày trong 24 tháng — tín hiệu rủi ro cao theo thống kê ngành.",
  },
  leafRejectDebt: {
    id: "leafRejectDebt",
    kind: "reject",
    outcomeLabel: "Từ chối",
    outcomeReason:
      "Thu nhập thấp cộng với nợ hiện có trên 30% → hồ sơ không đáp ứng yêu cầu cẩn trọng của ngân hàng.",
  },
  leafApproveHistory: {
    id: "leafApproveHistory",
    kind: "approve",
    outcomeLabel: "Duyệt",
    outcomeReason: "",
  },
};

/* Toạ độ vẽ cây (thủ công cho rõ ràng) */
const NODE_POS: Record<QNodeId, { x: number; y: number }> = {
  root: { x: 400, y: 40 },
  qDebt: { x: 580, y: 130 },
  qDebt2: { x: 220, y: 220 },
  qLate: { x: 700, y: 220 },
  qHistory: { x: 790, y: 310 },
  qHistory2: { x: 130, y: 130 },
  leafApprove: { x: 840, y: 400 },
  leafApproveCond: { x: 720, y: 400 },
  leafReview: { x: 60, y: 220 },
  leafReject: { x: 490, y: 220 },
  leafRejectHistory: { x: 610, y: 310 },
  leafRejectDebt: { x: 290, y: 310 },
  leafApproveLow: { x: 150, y: 310 },
  leafApproveHistory: { x: 0, y: 0 },
};

const TREE_W = 880;
const TREE_H = 450;

/* Đi theo cây để lấy đường dự đoán */
function runTree(applicant: Applicant): QNodeId[] {
  const path: QNodeId[] = [];
  let id: QNodeId = "root";
  for (let step = 0; step < 12; step++) {
    const n: DTNode = TREE[id];
    path.push(id);
    if (n.kind !== "question") return path;
    const cond = n.condition;
    const yesId = n.yesId;
    const noId = n.noId;
    if (!cond || !yesId || !noId) return path;
    const ok: boolean = cond(applicant);
    id = ok ? yesId : noId;
  }
  return path;
}

function outcomeStyle(kind: DTNode["kind"]) {
  switch (kind) {
    case "approve":
      return {
        color: "#059669",
        soft: "#10b98115",
        icon: CheckCircle2,
        label: "Duyệt",
      };
    case "approve-low":
      return {
        color: "#0ea5e9",
        soft: "#0ea5e915",
        icon: CheckCircle2,
        label: "Duyệt",
      };
    case "review":
      return {
        color: "#f59e0b",
        soft: "#f59e0b15",
        icon: Scale,
        label: "Xem xét",
      };
    case "reject":
      return {
        color: "#dc2626",
        soft: "#dc262615",
        icon: XCircle,
        label: "Từ chối",
      };
    default:
      return {
        color: "#6366f1",
        soft: "#6366f115",
        icon: Info,
        label: "",
      };
  }
}

/* Ba hồ sơ mẫu cho StepReveal */
const CASES: { label: string; applicant: Applicant; story: string }[] = [
  {
    label: "Hồ sơ 1 — Kỹ sư phần mềm, 28 tuổi",
    applicant: { income: 35, debtRatio: 0.25, hasLatePayment: false, yearsOfHistory: 6 },
    story:
      "Thu nhập 35 triệu/tháng, hiện đang trả góp điện thoại (nợ 25% thu nhập), chưa từng trễ hạn, có thẻ tín dụng 6 năm. Hệ thống chạy qua 4 câu hỏi trong cây và ra kết quả duyệt hạn mức cao.",
  },
  {
    label: "Hồ sơ 2 — Nhân viên bán hàng, 24 tuổi",
    applicant: { income: 11, debtRatio: 0.22, hasLatePayment: false, yearsOfHistory: 1 },
    story:
      "Thu nhập 11 triệu/tháng, nợ hiện tại bằng 22% thu nhập, chưa có lịch sử trễ hạn, nhưng mới mở thẻ tín dụng đầu tiên năm ngoái. Thu nhập dưới ngưỡng 15 triệu → cây rẽ sang nhánh khác và đòi hỏi nhiều bằng chứng hơn.",
  },
  {
    label: "Hồ sơ 3 — Chủ quán ăn, 35 tuổi",
    applicant: { income: 22, debtRatio: 0.55, hasLatePayment: false, yearsOfHistory: 8 },
    story:
      "Thu nhập 22 triệu/tháng, nhưng nợ hiện tại đã chiếm 55% thu nhập (vay mua quán), chưa trễ hạn, lịch sử tín dụng 8 năm. Dù lịch sử tốt, tỉ lệ nợ vượt ngưỡng an toàn → cây trả về kết quả từ chối.",
  },
];

/* ════════════════════════════════════════════════════════════════════
 * COMPONENT ĐƠN — form nhập + cây highlight
 * ════════════════════════════════════════════════════════════════════ */
function LoanPlayground() {
  const [applicant, setApplicant] = useState<Applicant>({
    income: 20,
    debtRatio: 0.3,
    hasLatePayment: false,
    yearsOfHistory: 4,
  });

  const path = useMemo(() => runTree(applicant), [applicant]);
  const leafId = path[path.length - 1];
  const leaf = TREE[leafId];
  const style = outcomeStyle(leaf.kind);

  function reset() {
    setApplicant({
      income: 20,
      debtRatio: 0.3,
      hasLatePayment: false,
      yearsOfHistory: 4,
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* FORM trái — đơn vay */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
          <div className="flex items-center gap-2">
            <FileSignature size={16} className="text-accent" />
            <span className="text-sm font-semibold text-foreground">
              Đơn xin vay — thông tin khách hàng
            </span>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-surface/50 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Wallet size={14} className="text-sky-500" />
                <span className="text-xs font-semibold text-foreground">
                  Thu nhập / tháng
                </span>
                <span className="ml-auto text-xs font-bold tabular-nums text-sky-500">
                  {applicant.income} triệu
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={60}
                step={1}
                value={applicant.income}
                onChange={(e) =>
                  setApplicant((p) => ({ ...p, income: parseInt(e.target.value) }))
                }
                className="w-full h-2 rounded-full cursor-pointer accent-sky-500"
              />
              <div className="flex justify-between text-[10px] text-tertiary mt-0.5">
                <span>5 tr</span>
                <span>30 tr</span>
                <span>60 tr</span>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-surface/50 p-3">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard size={14} className="text-purple-500" />
                <span className="text-xs font-semibold text-foreground">
                  Tỉ lệ nợ hiện có / thu nhập
                </span>
                <span className="ml-auto text-xs font-bold tabular-nums text-purple-500">
                  {(applicant.debtRatio * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={0.8}
                step={0.05}
                value={applicant.debtRatio}
                onChange={(e) =>
                  setApplicant((p) => ({
                    ...p,
                    debtRatio: parseFloat(e.target.value),
                  }))
                }
                className="w-full h-2 rounded-full cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-[10px] text-tertiary mt-0.5">
                <span>0%</span>
                <span>40%</span>
                <span>80%</span>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-surface/50 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Home size={14} className="text-emerald-500" />
                <span className="text-xs font-semibold text-foreground">
                  Số năm có tín dụng
                </span>
                <span className="ml-auto text-xs font-bold tabular-nums text-emerald-500">
                  {applicant.yearsOfHistory} năm
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={15}
                step={1}
                value={applicant.yearsOfHistory}
                onChange={(e) =>
                  setApplicant((p) => ({
                    ...p,
                    yearsOfHistory: parseInt(e.target.value),
                  }))
                }
                className="w-full h-2 rounded-full cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-tertiary mt-0.5">
                <span>0</span>
                <span>7</span>
                <span>15</span>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-surface/50 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase size={14} className="text-amber-500" />
                <span className="text-xs font-semibold text-foreground">
                  Có khoản trễ hạn trên 30 ngày trong 2 năm qua?
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setApplicant((p) => ({ ...p, hasLatePayment: false }))
                  }
                  className={`flex-1 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    !applicant.hasLatePayment
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-semibold"
                      : "border-border bg-card text-muted hover:bg-surface"
                  }`}
                >
                  Không
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setApplicant((p) => ({ ...p, hasLatePayment: true }))
                  }
                  className={`flex-1 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    applicant.hasLatePayment
                      ? "bg-red-500/10 border-red-500 text-red-700 dark:text-red-300 font-semibold"
                      : "border-border bg-card text-muted hover:bg-surface"
                  }`}
                >
                  Có
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={reset}
                className="text-xs px-3 py-1 rounded-full border border-border text-muted hover:text-foreground"
              >
                <RotateCcw size={11} className="inline mr-1" /> Đặt lại mặc định
              </button>
            </div>
          </div>

          {/* Kết quả */}
          <AnimatePresence mode="wait">
            <motion.div
              key={leafId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="rounded-xl p-4 border"
              style={{
                backgroundColor: style.soft,
                borderColor: style.color + "60",
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <style.icon size={16} style={{ color: style.color }} />
                <span
                  className="text-sm font-bold"
                  style={{ color: style.color }}
                >
                  {leaf.outcomeLabel}
                </span>
              </div>
              <p className="text-xs text-foreground/85 leading-relaxed">
                {leaf.outcomeReason}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* CÂY phải — highlight đường đi */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownRight size={16} className="text-accent" />
            <span className="text-sm font-semibold text-foreground">
              Cây quyết định đang chạy qua hồ sơ của bạn
            </span>
          </div>
          <TreeCanvas path={path} />
          <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-tertiary">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-indigo-500" /> Câu hỏi
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Duyệt
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-sky-500" /> Duyệt hạn mức thấp
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Xem xét
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500" /> Từ chối
            </span>
          </div>
        </div>
      </div>

      {/* Lối đi giải thích */}
      <div className="rounded-xl border border-border bg-surface/40 p-3">
        <div className="text-xs font-semibold text-foreground mb-2">
          Đường đi cụ thể của hồ sơ này
        </div>
        <ol className="space-y-1.5">
          {path.slice(0, -1).map((id, idx) => {
            const node = TREE[id];
            const nextId = path[idx + 1];
            const chose = node.yesId === nextId ? "yes" : "no";
            return (
              <li key={id} className="flex items-start gap-2 text-xs">
                <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-accent/15 text-[10px] font-bold text-accent">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <p className="text-foreground">{node.text}</p>
                  <p
                    className="mt-0.5"
                    style={{
                      color: chose === "yes" ? "#059669" : "#dc2626",
                    }}
                  >
                    → Trả lời: {chose === "yes" ? "Có" : "Không"}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

/* Vẽ cây với highlight */
function TreeCanvas({ path }: { path: QNodeId[] }) {
  const edges: { from: QNodeId; to: QNodeId; branch: "yes" | "no" }[] = [];
  (Object.values(TREE) as DTNode[]).forEach((n) => {
    if (n.yesId) edges.push({ from: n.id, to: n.yesId, branch: "yes" });
    if (n.noId) edges.push({ from: n.id, to: n.noId, branch: "no" });
  });

  const pathSet = new Set(path);
  const pathEdgeSet = new Set(
    path.slice(0, -1).map((id, i) => `${id}>${path[i + 1]}`),
  );

  return (
    <svg
      viewBox={`0 0 ${TREE_W} ${TREE_H}`}
      className="w-full"
      role="img"
      aria-label={`Cây quyết định chấm tín dụng, đường đi gồm ${path.length} bước`}
    >
      {/* edges */}
      {edges.map((e) => {
        const from = NODE_POS[e.from];
        const to = NODE_POS[e.to];
        const onPath = pathEdgeSet.has(`${e.from}>${e.to}`);
        const color = e.branch === "yes" ? "#10b981" : "#ef4444";
        return (
          <motion.line
            key={`${e.from}-${e.to}`}
            x1={from.x}
            y1={from.y + 20}
            x2={to.x}
            y2={to.y - 20}
            stroke={color}
            strokeOpacity={onPath ? 1 : 0.25}
            strokeWidth={onPath ? 3 : 1.2}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3 }}
          />
        );
      })}
      {/* yes/no markers */}
      {edges.map((e) => {
        const from = NODE_POS[e.from];
        const to = NODE_POS[e.to];
        const onPath = pathEdgeSet.has(`${e.from}>${e.to}`);
        return (
          <text
            key={`lbl-${e.from}-${e.to}`}
            x={(from.x + to.x) / 2}
            y={(from.y + to.y) / 2 + 3}
            fontSize={10}
            fontWeight={700}
            textAnchor="middle"
            fill={e.branch === "yes" ? "#059669" : "#b91c1c"}
            opacity={onPath ? 1 : 0.35}
          >
            {e.branch === "yes" ? "Có" : "Không"}
          </text>
        );
      })}
      {/* nodes */}
      {(Object.values(TREE) as DTNode[]).map((n) => {
        const pos = NODE_POS[n.id];
        if (!pos || pos.x === 0) return null;
        const isActive = pathSet.has(n.id);
        if (n.kind === "question") {
          return (
            <g key={n.id}>
              <rect
                x={pos.x - 90}
                y={pos.y - 22}
                width={180}
                height={44}
                rx={10}
                fill="#6366f1"
                fillOpacity={isActive ? 0.22 : 0.08}
                stroke="#6366f1"
                strokeOpacity={isActive ? 1 : 0.3}
                strokeWidth={isActive ? 2 : 1}
              />
              <text
                x={pos.x}
                y={pos.y - 5}
                textAnchor="middle"
                fontSize={10}
                fontWeight={700}
                fill="#4f46e5"
              >
                {n.text}
              </text>
              <text
                x={pos.x}
                y={pos.y + 12}
                textAnchor="middle"
                fontSize={8.5}
                fill="currentColor"
                className="text-muted"
              >
                {n.hint}
              </text>
            </g>
          );
        }
        const s = outcomeStyle(n.kind);
        return (
          <g key={n.id}>
            <rect
              x={pos.x - 80}
              y={pos.y - 22}
              width={160}
              height={44}
              rx={10}
              fill={s.color}
              fillOpacity={isActive ? 0.28 : 0.1}
              stroke={s.color}
              strokeOpacity={isActive ? 1 : 0.3}
              strokeWidth={isActive ? 2 : 1}
            />
            <text
              x={pos.x}
              y={pos.y + 2}
              textAnchor="middle"
              fontSize={10}
              fontWeight={700}
              fill={s.color}
            >
              {n.outcomeLabel}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ════════════════════════════════════════════════════════════════════
 * COMPONENT CHÍNH
 * ════════════════════════════════════════════════════════════════════ */
export default function DecisionTreesInLoanScoring() {
  return (
    <ApplicationLayout metadata={metadata} parentTitleVi="Cây quyết định">
      <ApplicationHero
        parentTitleVi="Cây quyết định"
        topicSlug="decision-trees-in-loan-scoring"
      >
        <p>
          Bạn nộp đơn vay mua xe máy. Chỉ vài giây sau khi bấm nút, ngân hàng đã biết bạn
          có được duyệt hay không — và nếu được, mức lãi suất là bao nhiêu. Đằng sau
          quyết định &ldquo;chỉ vài giây&rdquo; đó là cây quyết định chạy qua vài câu hỏi
          về thu nhập, nợ hiện tại, lịch sử thanh toán.
        </p>
        <p>
          Phần tiếp theo sẽ cho bạn đóng vai hệ thống chấm điểm: kéo thanh thu nhập,
          chọn &ldquo;có/không&rdquo; trễ hạn, và xem cây sáng lên từng bước cho đến khi
          ra kết quả. Không cần lập trình, không cần công thức.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="decision-trees-in-loan-scoring">
        <p>
          Mỗi ngày các ngân hàng lớn ở Việt Nam nhận hàng chục nghìn đơn vay: từ vay tiêu
          dùng nhỏ (mua điện thoại, xe máy) đến vay trung dài hạn (mua nhà, ô tô). Không
          có chuyên viên nào đọc tay đủ nhanh cho ngần ấy đơn. Hệ thống chấm điểm tự động
          phải phân loại người vay thành các nhóm rủi ro — nhưng cũng phải giải thích
          được lý do khi từ chối.
        </p>
        <p>
          Luật tín dụng ở Mỹ (Equal Credit Opportunity Act, Đạo luật cơ hội tín dụng bình
          đẳng) và hướng dẫn của Ngân hàng Nhà nước Việt Nam đều yêu cầu: khi từ chối, tổ
          chức tín dụng phải nêu lý do cụ thể. Mô hình &ldquo;hộp đen&rdquo; không đáp
          ứng được yêu cầu này — cây quyết định thì có, vì mỗi nhánh là một lý do đọc
          được.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Cây quyết định"
        topicSlug="decision-trees-in-loan-scoring"
      >
        <Beat step={1}>
          <p>
            <strong>Gom thông tin đầu vào.</strong> Hệ thống lấy thông tin tài chính của
            người vay từ nhiều nguồn: thu nhập khai báo, dữ liệu ngân hàng liên kết, lịch
            sử thanh toán với các khoản vay cũ, thời gian đã mở thẻ tín dụng đầu tiên, tỉ
            lệ nợ đang gánh so với thu nhập. Mỗi con số sẽ là một &ldquo;đặc trưng&rdquo;
            mà cây quyết định sẽ đặt câu hỏi về nó.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>Chạy qua chuỗi câu hỏi.</strong> Bắt đầu từ gốc: &ldquo;Thu nhập có
            đủ không?&rdquo;. Nếu có, cây rẽ sang nhánh câu hỏi tiếp: &ldquo;Tỉ lệ nợ
            dưới 40% không?&rdquo;. Nếu không có thu nhập cao, cây đi nhánh khác với yêu
            cầu chặt hơn về lịch sử. Mỗi câu hỏi loại bớt một phần khả năng — giống trò
            &ldquo;20 câu hỏi&rdquo; bạn chơi hồi nhỏ.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>Chạm lá — kết luận.</strong> Sau 3–4 câu hỏi, đường đi chạm một lá.
            Mỗi lá là một quyết định cụ thể: duyệt hạn mức cao, duyệt có điều kiện, yêu
            cầu xem xét thêm, hoặc từ chối. Quan trọng: mỗi lá đi kèm lý do — là chính
            chuỗi câu hỏi vừa trả lời. Người vay nhận được thư từ chối có nêu rõ:
            &ldquo;Tỉ lệ nợ vượt ngưỡng an toàn&rdquo;.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>Nhiều cây hợp lực.</strong> Một cây đơn hay thay đổi khi dữ liệu
            biến động. Thực tế FICO và các hệ thống lớn dùng{" "}
            <strong>gradient boosted trees</strong> — hàng trăm cây được xây tuần tự, mỗi
            cây sửa lỗi của cây trước, rồi bỏ phiếu chung. Điều này tăng độ chính xác lên
            khoảng 20% so với scorecard cổ điển, mà vẫn giải thích được từng quyết định
            nhờ cấu trúc cây.
          </p>
        </Beat>
      </ApplicationMechanism>

      {/* ═══ TRỰC QUAN HÓA ═══ */}
      <VisualizationSection topicSlug={metadata.slug}>
        <LessonSection label="Nộp thử một đơn vay — xem cây chạy" step={1}>
          <p className="text-sm text-muted mb-3 leading-relaxed">
            Bạn vừa ngồi vào ghế của hệ thống chấm điểm. Điều chỉnh bốn ô bên dưới để mô
            phỏng một hồ sơ, rồi xem bên phải: cây sẽ sáng dần từ gốc xuống lá, mỗi bước
            trả lời một câu hỏi về bạn.
          </p>
          <LoanPlayground />
        </LessonSection>

        <LessonSection label="Ba hồ sơ mẫu — ba kết quả khác nhau" step={2}>
          <p className="text-sm text-muted mb-3 leading-relaxed">
            Ba câu chuyện dưới đây là các hồ sơ đặc trưng của khách hàng Việt Nam. Nhấn{" "}
            &ldquo;Tiếp tục&rdquo; để đi qua từng hồ sơ và xem vì sao mỗi hồ sơ dẫn đến
            một kết quả riêng.
          </p>
          <StepReveal labels={CASES.map((c) => c.label.split(" — ")[0])}>
            {CASES.map((c, idx) => {
              const path = runTree(c.applicant);
              const leaf = TREE[path[path.length - 1]];
              const s = outcomeStyle(leaf.kind);
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-border bg-surface/40 p-4 space-y-3"
                >
                  <h4 className="text-sm font-semibold text-foreground">{c.label}</h4>
                  <p className="text-xs text-foreground/85 leading-relaxed">{c.story}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="rounded-lg bg-background border border-border p-2">
                      <div className="text-tertiary">Thu nhập</div>
                      <div className="font-semibold text-foreground">
                        {c.applicant.income} triệu
                      </div>
                    </div>
                    <div className="rounded-lg bg-background border border-border p-2">
                      <div className="text-tertiary">Nợ / thu nhập</div>
                      <div className="font-semibold text-foreground">
                        {(c.applicant.debtRatio * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="rounded-lg bg-background border border-border p-2">
                      <div className="text-tertiary">Năm có tín dụng</div>
                      <div className="font-semibold text-foreground">
                        {c.applicant.yearsOfHistory} năm
                      </div>
                    </div>
                    <div className="rounded-lg bg-background border border-border p-2">
                      <div className="text-tertiary">Trễ hạn 30+</div>
                      <div className="font-semibold text-foreground">
                        {c.applicant.hasLatePayment ? "Có" : "Không"}
                      </div>
                    </div>
                  </div>
                  <div
                    className="rounded-lg p-3 border text-xs"
                    style={{
                      backgroundColor: s.soft,
                      borderColor: s.color + "60",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <s.icon size={14} style={{ color: s.color }} />
                      <span className="font-semibold" style={{ color: s.color }}>
                        {leaf.outcomeLabel}
                      </span>
                    </div>
                    <p className="text-foreground/85 leading-relaxed">
                      {leaf.outcomeReason}
                    </p>
                  </div>
                  <TreeCanvas path={path} />
                </div>
              );
            })}
          </StepReveal>
        </LessonSection>

        <LessonSection label="Thử thách — Cây chỉ &ldquo;dán nhãn&rdquo;, nhưng có công bằng không?" step={3}>
          <InlineChallenge
            question="Giả sử một cây được huấn luyện trên dữ liệu cũ và nó luôn từ chối người không có xe hơi. Điều này có công bằng không?"
            options={[
              "Công bằng — vì dữ liệu lịch sử cho thấy người có xe hơi ít nợ xấu hơn",
              "Không công bằng — 'có xe hơi' phản ánh thu nhập và tầng lớp hơn là khả năng trả nợ; và gián tiếp lọc theo giới tính / vùng miền",
              "Chỉ có bác sĩ mới đánh giá được",
              "Không quan trọng — miễn là cây có accuracy cao",
            ]}
            correct={1}
            explanation="Đây là ví dụ kinh điển của 'proxy bias' (thành kiến gián tiếp). Đặc trưng có vẻ trung tính (có/không xe hơi) lại gắn chặt với thu nhập, vùng sinh sống, giới. Cây quyết định 'học thuộc' mẫu có sẵn trong dữ liệu cũ, trong đó nhiều nhóm bị từ chối không công bằng. Giải pháp: kiểm tra fairness sau khi train, loại bỏ feature proxy, và dùng các kỹ thuật giảm thiên lệch (reweighing, adversarial debiasing)."
          />
          <div className="mt-4">
            <Callout variant="warning" title="Đừng nhầm 'giải thích được' với 'công bằng'">
              Cây quyết định <em>giải thích được</em> từng quyết định — đó là lý do pháp
              luật yêu cầu nó trong tín dụng. Nhưng &ldquo;giải thích được&rdquo; không
              tự động có nghĩa &ldquo;công bằng&rdquo;. Một cây giải thích rõ ràng lý do
              từ chối, nhưng nếu lý do đó dựa trên đặc trưng thay thế cho chủng tộc hay
              giới tính, thì quyết định vẫn bất công. Ngân hàng nghiêm túc phải kiểm tra
              công bằng song song với kiểm tra độ chính xác.
            </Callout>
          </div>
        </LessonSection>
      </VisualizationSection>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="decision-trees-in-loan-scoring"
      >
        <Metric
          value="Hơn 200 triệu người Mỹ trưởng thành được chấm điểm FICO"
          sourceRef={5}
        />
        <Metric
          value="90% ngân hàng lớn nhất nước Mỹ dùng điểm FICO trong quyết định cho vay"
          sourceRef={5}
        />
        <Metric
          value="Hơn 10 tỷ lượt truy vấn điểm FICO mỗi năm"
          sourceRef={2}
        />
        <Metric
          value="Gradient boosted trees (ensemble cây) cải thiện 20% độ chính xác so với scorecard cổ điển"
          sourceRef={4}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Cây quyết định"
        topicSlug="decision-trees-in-loan-scoring"
      >
        <p>
          Không có cây quyết định, hệ chấm điểm tín dụng hoặc phải quay về viết luật tay
          (tốn công, không bắt kịp dữ liệu mới) hoặc dùng mạng nơ-ron &ldquo;hộp
          đen&rdquo; (chính xác hơn nhưng không giải thích được từng quyết định — vi phạm
          quy định của Ngân hàng Nhà nước và hướng dẫn công bằng tín dụng quốc tế).
        </p>
        <p>
          Cây quyết định mang lại điều hiếm có: vừa phân loại chính xác, vừa giải thích
          minh bạch. Mỗi nhánh là một lý do đọc được — từ &ldquo;trễ hạn 30 ngày&rdquo;
          đến &ldquo;nợ vượt ngưỡng an toàn&rdquo;. Trong lĩnh vực nơi mỗi quyết định
          ảnh hưởng đến cuộc sống một con người, tính minh bạch này không chỉ là ưu điểm
          kỹ thuật mà còn là yêu cầu đạo đức và pháp lý.
        </p>
        <div className="mt-4">
          <MiniSummary
            title="Bài học chính từ hồ sơ thật"
            points={[
              "Cây quyết định trả lời câu hỏi 'duyệt hay không' bằng 3–4 câu hỏi rõ ràng, không có ma thuật.",
              "Đường đi qua cây chính là lời giải thích — ngân hàng có thể đưa trực tiếp cho khách hàng khi từ chối.",
              "Một cây đơn yếu. Thực tế dùng nhiều cây ensemble (boosted trees) để tăng accuracy, vẫn giữ tính đọc được.",
              "Giải thích được ≠ công bằng: vẫn phải kiểm tra fairness để tránh proxy bias dựa vào vùng miền, giới, tuổi.",
            ]}
          />
        </div>
        <p className="mt-4 text-sm leading-relaxed">
          Muốn hiểu kỹ hơn phần thuật toán đứng sau — cách cây tự chọn câu hỏi, Gini, max
          depth — xem lại bài lý thuyết:{" "}
          <TopicLink slug="decision-trees">Cây quyết định</TopicLink>.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
