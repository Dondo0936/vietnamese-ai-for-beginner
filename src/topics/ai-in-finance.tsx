"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  AlertTriangle,
  CreditCard,
  TrendingUp,
  Bot,
  Landmark,
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
} from "lucide-react";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CollapsibleDetail,
  MatchPairs,
  TabView,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "ai-in-finance",
  title: "AI in Finance",
  titleVi: "AI trong Tài chính",
  description:
    "Ứng dụng AI thực tế tại ngân hàng, ví điện tử và công ty tài chính Việt Nam",
  category: "applied-ai",
  tags: ["fraud-detection", "credit-scoring", "banking", "fintech"],
  difficulty: "beginner",
  relatedSlugs: ["ai-in-healthcare", "ai-in-education", "ai-coding-assistants"],
  vizType: "interactive",
  tocSections: [{ id: "explanation", labelVi: "Giải thích" }],
};

const TOTAL_STEPS = 8;

// ---------------------------------------------------------------------------
// DEMO 1 — Mô phỏng phát hiện gian lận theo thời gian thực
// ---------------------------------------------------------------------------

type SimTxn = {
  id: number;
  label: string;
  amount: number;
  merchant: string;
  location: string;
  device: string;
  time: string;
  risk: number; // 0..100, điểm rủi ro do AI chấm
  truth: "legit" | "fraud";
};

const SAMPLE_TXNS: SimTxn[] = [
  {
    id: 1,
    label: "Mua cà phê sáng",
    amount: 55000,
    merchant: "Highlands Coffee",
    location: "Hà Nội, VN",
    device: "iPhone đã dùng 2 năm",
    time: "07:42 thứ Hai",
    risk: 4,
    truth: "legit",
  },
  {
    id: 2,
    label: "Thanh toán Shopee",
    amount: 340000,
    merchant: "Shopee Mall",
    location: "TP.HCM, VN",
    device: "iPhone đã dùng 2 năm",
    time: "20:15 thứ Tư",
    risk: 9,
    truth: "legit",
  },
  {
    id: 3,
    label: "Chuyển khoản cho mẹ",
    amount: 5_000_000,
    merchant: "Vietcombank Internal",
    location: "Đà Nẵng, VN",
    device: "iPhone đã dùng 2 năm",
    time: "19:00 cuối tháng",
    risk: 12,
    truth: "legit",
  },
  {
    id: 4,
    label: "Mua vé máy bay bất ngờ",
    amount: 4_200_000,
    merchant: "Vietjet Air",
    location: "Hà Nội, VN",
    device: "iPhone đã dùng 2 năm",
    time: "23:58 thứ Bảy",
    risk: 38,
    truth: "legit",
  },
  {
    id: 5,
    label: "Thanh toán ví lạ",
    amount: 12_500_000,
    merchant: "Unknown-Crypto-Site",
    location: "Singapore",
    device: "Android mới đăng nhập",
    time: "03:24 thứ Hai",
    risk: 72,
    truth: "fraud",
  },
  {
    id: 6,
    label: "Rút tiền mặt ATM nước ngoài",
    amount: 18_000_000,
    merchant: "ATM tại Nigeria",
    location: "Lagos, NG",
    device: "Android lạ",
    time: "04:11 rạng sáng",
    risk: 88,
    truth: "fraud",
  },
  {
    id: 7,
    label: "Gift card giá trị cao",
    amount: 9_900_000,
    merchant: "Gift-Card-Shop",
    location: "Không xác định",
    device: "Web browser mới",
    time: "02:08 thứ Ba",
    risk: 81,
    truth: "fraud",
  },
  {
    id: 8,
    label: "Đặt phòng khách sạn",
    amount: 2_100_000,
    merchant: "Booking.com",
    location: "Hội An, VN",
    device: "iPhone đã dùng 2 năm",
    time: "15:10 thứ Sáu",
    risk: 18,
    truth: "legit",
  },
];

function FraudSimulator() {
  const [threshold, setThreshold] = useState(55);
  const [hovered, setHovered] = useState<number | null>(null);

  const stats = useMemo(() => {
    let bat_dung = 0; // TP
    let bao_nham = 0; // FP
    let lot_luoi = 0; // FN
    let an_toan = 0; // TN
    let chan_dung_vnd = 0;
    let chan_nham_vnd = 0;
    let lot_vnd = 0;
    for (const t of SAMPLE_TXNS) {
      const flagged = t.risk >= threshold;
      if (flagged && t.truth === "fraud") {
        bat_dung += 1;
        chan_dung_vnd += t.amount;
      } else if (flagged && t.truth === "legit") {
        bao_nham += 1;
        chan_nham_vnd += t.amount;
      } else if (!flagged && t.truth === "fraud") {
        lot_luoi += 1;
        lot_vnd += t.amount;
      } else {
        an_toan += 1;
      }
    }
    return {
      bat_dung,
      bao_nham,
      lot_luoi,
      an_toan,
      chan_dung_vnd,
      chan_nham_vnd,
      lot_vnd,
    };
  }, [threshold]);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">
          Demo 1 — Phát hiện gian lận thời gian thực
        </h3>
        <p className="text-sm text-muted">
          AI chấm điểm rủi ro cho từng giao dịch (0–100). Giao dịch có điểm
          vượt ngưỡng sẽ bị chặn hoặc yêu cầu xác thực thêm. Hãy kéo thanh
          ngưỡng để thấy AI bắt được fraud — và chặn nhầm người dùng — như
          thế nào.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface/60 p-4">
        <div className="mb-3 flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">
            Ngưỡng chặn của AI
          </label>
          <span className="rounded-md bg-accent-light px-2 py-0.5 font-mono text-sm font-semibold text-accent">
            {threshold}
          </span>
        </div>
        <input
          type="range"
          min={10}
          max={95}
          step={1}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="w-full accent-accent"
          aria-label="Ngưỡng chặn giao dịch"
        />
        <div className="mt-1 flex justify-between text-xs text-muted">
          <span>Ngặt (chặn nhiều, phiền user)</span>
          <span>Lỏng (ít phiền, lọt nhiều fraud)</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-2 text-left">Giao dịch</th>
              <th className="px-3 py-2 text-right">Số tiền (VND)</th>
              <th className="px-3 py-2 text-right">Điểm AI</th>
              <th className="px-3 py-2 text-center">Kết quả</th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_TXNS.map((t) => {
              const flagged = t.risk >= threshold;
              const isFraud = t.truth === "fraud";
              let badge: {
                bg: string;
                text: string;
                label: string;
                icon: typeof CheckCircle2;
              };
              if (flagged && isFraud) {
                badge = {
                  bg: "bg-emerald-100 dark:bg-emerald-900/30",
                  text: "text-emerald-800 dark:text-emerald-300",
                  label: "Chặn đúng fraud",
                  icon: ShieldCheck,
                };
              } else if (flagged && !isFraud) {
                badge = {
                  bg: "bg-purple-100 dark:bg-purple-900/30",
                  text: "text-purple-800 dark:text-purple-300",
                  label: "Chặn nhầm",
                  icon: AlertTriangle,
                };
              } else if (!flagged && isFraud) {
                badge = {
                  bg: "bg-red-100 dark:bg-red-900/30",
                  text: "text-red-800 dark:text-red-300",
                  label: "Fraud lọt lưới",
                  icon: XCircle,
                };
              } else {
                badge = {
                  bg: "bg-slate-100 dark:bg-slate-800/50",
                  text: "text-slate-700 dark:text-slate-300",
                  label: "OK",
                  icon: CheckCircle2,
                };
              }
              const BadgeIcon = badge.icon;
              return (
                <tr
                  key={t.id}
                  onMouseEnter={() => setHovered(t.id)}
                  onMouseLeave={() => setHovered(null)}
                  className={`border-t border-border transition-colors ${
                    hovered === t.id ? "bg-accent-light/40" : ""
                  }`}
                >
                  <td className="px-3 py-2">
                    <div className="font-medium text-foreground">{t.label}</div>
                    <div className="text-xs text-muted">
                      {t.merchant} · {t.location} · {t.time}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-foreground">
                    {t.amount.toLocaleString("vi-VN")}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 font-mono text-xs font-semibold ${
                        t.risk >= 70
                          ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                          : t.risk >= 40
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                      }`}
                    >
                      {t.risk}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${badge.bg} ${badge.text}`}
                    >
                      <BadgeIcon className="h-3 w-3" />
                      {badge.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Chặn đúng fraud"
          value={stats.bat_dung}
          sub={`${(stats.chan_dung_vnd / 1_000_000).toFixed(1)} triệu VND`}
          tone="emerald"
        />
        <StatCard
          label="Chặn nhầm user"
          value={stats.bao_nham}
          sub={`${(stats.chan_nham_vnd / 1_000_000).toFixed(1)} triệu VND`}
          tone="purple"
        />
        <StatCard
          label="Fraud lọt lưới"
          value={stats.lot_luoi}
          sub={`${(stats.lot_vnd / 1_000_000).toFixed(1)} triệu VND`}
          tone="red"
        />
        <StatCard
          label="Giao dịch sạch"
          value={stats.an_toan}
          sub="Đi qua trơn tru"
          tone="slate"
        />
      </div>

      <Callout variant="insight" title="Vì sao có hai loại sai?">
        Không có ngưỡng nào hoàn hảo. Hạ ngưỡng xuống 30: AI bắt được hầu hết
        fraud nhưng chặn nhầm cả những giao dịch Shopee, Booking bình thường.
        Nâng lên 80: ít chặn nhầm nhưng fraud lớn vẫn lọt. Ngân hàng Việt
        Nam chọn ngưỡng dựa trên <em>chi phí</em>: một giao dịch fraud 10
        triệu lọt đau hơn 100 giao dịch 500 nghìn bị chặn nhầm.
      </Callout>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: number;
  sub: string;
  tone: "emerald" | "purple" | "red" | "slate";
}) {
  const tones: Record<typeof tone, string> = {
    emerald:
      "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200",
    purple:
      "border-purple-300 bg-purple-50 text-purple-900 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-200",
    red: "border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200",
    slate:
      "border-slate-300 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-200",
  };
  return (
    <div className={`rounded-xl border p-3 ${tones[tone]}`}>
      <div className="text-xs uppercase tracking-wide opacity-80">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      <div className="mt-0.5 text-xs opacity-75">{sub}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DEMO 2 — Credit scoring: giải thích quyết định
// ---------------------------------------------------------------------------

type CreditFeature = {
  key: string;
  label: string;
  description: string;
  weight: number; // Tác động lên điểm tín dụng. Âm = kéo xuống, dương = nâng lên.
  baseline: boolean;
};

const CREDIT_FEATURES: CreditFeature[] = [
  {
    key: "salary",
    label: "Lương chuyển khoản đều 3 năm",
    description: "Thu nhập ổn định là tín hiệu mạnh nhất",
    weight: +22,
    baseline: true,
  },
  {
    key: "dti",
    label: "Nợ/thu nhập < 30%",
    description: "Hệ số DTI thấp — còn khả năng trả thêm",
    weight: +14,
    baseline: true,
  },
  {
    key: "history",
    label: "Lịch sử CIC 24 tháng sạch",
    description: "Chưa từng chậm nợ tại bất kỳ TCTD nào",
    weight: +18,
    baseline: true,
  },
  {
    key: "age_acc",
    label: "Tài khoản mở > 5 năm",
    description: "Độ dài mối quan hệ với ngân hàng",
    weight: +6,
    baseline: true,
  },
  {
    key: "savings",
    label: "Sổ tiết kiệm > 100 triệu",
    description: "Bộ đệm tài chính trong trường hợp xấu",
    weight: +10,
    baseline: false,
  },
  {
    key: "late_cc",
    label: "Thẻ tín dụng chậm 1 kỳ",
    description: "Một lần chậm gần đây",
    weight: -15,
    baseline: false,
  },
  {
    key: "many_apps",
    label: "Hỏi vay 5 nơi trong 30 ngày",
    description: "Khát vốn — tín hiệu rủi ro",
    weight: -12,
    baseline: false,
  },
  {
    key: "new_job",
    label: "Mới đổi việc < 6 tháng",
    description: "Thu nhập chưa đủ lâu để tin",
    weight: -8,
    baseline: false,
  },
];

function CreditScoreExplainer() {
  const [active, setActive] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const f of CREDIT_FEATURES) init[f.key] = f.baseline;
    return init;
  });

  const total = useMemo(() => {
    let score = 50; // điểm khởi đầu trung bình
    for (const f of CREDIT_FEATURES) {
      if (active[f.key]) score += f.weight;
    }
    return Math.max(0, Math.min(100, score));
  }, [active]);

  const decision = useMemo(() => {
    if (total >= 80) {
      return {
        label: "Duyệt hạn mức cao",
        desc: "Lãi suất ưu đãi, phê duyệt tự động",
        tone: "bg-emerald-500 text-white",
        ring: "ring-emerald-400",
      };
    }
    if (total >= 60) {
      return {
        label: "Duyệt tiêu chuẩn",
        desc: "Hạn mức trung bình, cần bổ sung hồ sơ",
        tone: "bg-sky-500 text-white",
        ring: "ring-sky-400",
      };
    }
    if (total >= 40) {
      return {
        label: "Cân nhắc thủ công",
        desc: "Chuyển cho chuyên viên thẩm định xem xét",
        tone: "bg-amber-500 text-white",
        ring: "ring-amber-400",
      };
    }
    return {
      label: "Từ chối",
      desc: "Khuyến nghị cải thiện hồ sơ rồi thử lại",
      tone: "bg-red-500 text-white",
      ring: "ring-red-400",
    };
  }, [total]);

  const contributions = useMemo(() => {
    return CREDIT_FEATURES.filter((f) => active[f.key]).sort(
      (a, b) => Math.abs(b.weight) - Math.abs(a.weight),
    );
  }, [active]);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <div>
        <h3 className="text-base font-semibold text-foreground">
          Demo 2 — AI giải thích vì sao cho vay hay từ chối
        </h3>
        <p className="text-sm text-muted">
          Hồ sơ ban đầu: chị Lan, 32 tuổi, nhân viên văn phòng tại TP.HCM,
          xin vay mua xe. Bật/tắt các đặc điểm để thấy AI cập nhật điểm
          tín dụng và quyết định tức thời.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-2">
          {CREDIT_FEATURES.map((f) => {
            const on = active[f.key];
            const positive = f.weight > 0;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() =>
                  setActive((prev) => ({ ...prev, [f.key]: !prev[f.key] }))
                }
                className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                  on
                    ? positive
                      ? "border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20"
                      : "border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-900/20"
                    : "border-border bg-surface/60 opacity-60 hover:opacity-100"
                }`}
              >
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {f.label}
                  </div>
                  <div className="text-xs text-muted">{f.description}</div>
                </div>
                <span
                  className={`shrink-0 rounded-md px-2 py-0.5 font-mono text-xs font-semibold ${
                    positive
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                  }`}
                >
                  {positive ? "+" : ""}
                  {f.weight}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-border bg-surface/40 p-4">
            <div className="text-xs uppercase tracking-wide text-muted">
              Điểm tín dụng dự đoán
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <motion.span
                key={total}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="text-5xl font-bold tabular-nums text-foreground"
              >
                {total}
              </motion.span>
              <span className="text-sm text-muted">/ 100</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <motion.div
                initial={false}
                animate={{ width: `${total}%` }}
                transition={{ duration: 0.25 }}
                className="h-full bg-gradient-to-r from-red-400 via-amber-400 to-emerald-500"
              />
            </div>
          </div>

          <div
            className={`rounded-xl p-4 ring-2 ${decision.tone} ${decision.ring}`}
          >
            <div className="text-xs uppercase tracking-wide opacity-85">
              Quyết định AI đề xuất
            </div>
            <div className="mt-1 text-lg font-semibold">{decision.label}</div>
            <div className="mt-0.5 text-xs opacity-90">{decision.desc}</div>
          </div>

          <div className="rounded-xl border border-border bg-surface/40 p-3 text-xs">
            <div className="mb-2 font-semibold text-foreground">
              Yếu tố đóng góp mạnh nhất
            </div>
            <ul className="space-y-1">
              {contributions.slice(0, 3).map((f) => (
                <li key={f.key} className="flex items-center justify-between">
                  <span className="text-muted">{f.label}</span>
                  <span
                    className={`font-mono font-semibold ${
                      f.weight > 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {f.weight > 0 ? "+" : ""}
                    {f.weight}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <Callout variant="warning" title="Quyền được giải thích">
        Theo Nghị định 13/2023 của Chính phủ về bảo vệ dữ liệu cá nhân và
        Thông tư 13/2018 của NHNN, khách hàng bị từ chối vay CÓ QUYỀN yêu
        cầu ngân hàng giải thích lý do. AI không được là "hộp đen" — ngân
        hàng phải trả lời cụ thể: "Hồ sơ bị từ chối chủ yếu do lịch sử chậm
        nợ thẻ tín dụng (−15 điểm) và việc hỏi vay nhiều nơi trong 30 ngày
        (−12 điểm)." Đây là lý do mọi mô hình chấm điểm tín dụng tại VN
        phải có lớp giải thích kèm theo.
      </Callout>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DEMO 3 — Bản đồ ứng dụng AI tại các ngân hàng Việt Nam
// ---------------------------------------------------------------------------

function VietnameseBankMap() {
  const bankPairs = useMemo(
    () => [
      {
        left: "Vietcombank",
        right: "Cảnh báo giao dịch bất thường 24/7 trên app VCB Digibank",
      },
      {
        left: "Techcombank",
        right: "Chấm điểm tín dụng tức thời cho thẻ và vay tiêu dùng",
      },
      {
        left: "MB Bank",
        right: "Trợ lý ảo MB Buddy tư vấn sản phẩm qua chat và thoại",
      },
      {
        left: "VPBank",
        right: "Hệ thống AML giám sát rửa tiền và khách hàng nhạy cảm",
      },
      {
        left: "TPBank",
        right: "eKYC bằng nhận diện khuôn mặt và sinh trắc học giọng nói",
      },
      {
        left: "VietinBank",
        right: "Dự báo dòng tiền và gợi ý sản phẩm tiết kiệm phù hợp",
      },
      {
        left: "BIDV",
        right: "Phân tích hành vi để ngăn chặn chiếm đoạt tài khoản",
      },
      {
        left: "ACB",
        right: "Robo-advisor tư vấn phân bổ đầu tư cho khách hàng ưu tiên",
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <div>
        <h3 className="text-base font-semibold text-foreground">
          Demo 3 — Ghép ngân hàng Việt Nam với ứng dụng AI của họ
        </h3>
        <p className="text-sm text-muted">
          Tám ngân hàng hàng đầu Việt Nam đều đã triển khai AI, nhưng mỗi
          nhà tập trung vào mảng khác nhau. Thử ghép cặp xem bạn đoán đúng
          bao nhiêu. Đây là các thông tin đã được các ngân hàng công bố
          công khai giai đoạn 2024–2025.
        </p>
      </div>
      <MatchPairs
        pairs={bankPairs}
        instruction="Chọn một ngân hàng ở cột trái, rồi chọn ứng dụng AI tương ứng ở cột phải."
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Trang chính
// ---------------------------------------------------------------------------

export default function AIInFinanceTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          "Một khách hàng bị ngân hàng chặn giao dịch 2 triệu VND lúc 3 giờ sáng ở nước ngoài. Theo góc nhìn AI chống gian lận, đây là biểu hiện của điều gì?",
        options: [
          "Ngân hàng cố tình làm khó khách hàng",
          "AI phát hiện giao dịch lệch pattern bình thường (giờ giấc, địa điểm, thiết bị) và yêu cầu xác thực thêm để bảo vệ tài khoản",
          "Hệ thống bị lỗi kỹ thuật",
        ],
        correct: 1,
        explanation:
          "Mỗi tài khoản có một 'profile' hành vi riêng: giờ hoạt động, địa điểm, hạn mức quen thuộc, loại merchant hay mua. Khi một giao dịch lệch đủ xa khỏi profile đó — ví dụ 3 giờ sáng giờ VN = giờ ngủ, địa điểm mới, thiết bị mới — điểm rủi ro vọt lên. Ngân hàng sẽ chặn hoặc gửi OTP/thông báo để bạn xác nhận. Đây là cơ chế chuẩn tại Vietcombank, Techcombank, MB.",
      },
      {
        question:
          "Vì sao hạ ngưỡng chặn xuống quá thấp KHÔNG phải là giải pháp tốt để bắt nhiều fraud hơn?",
        options: [
          "Vì GPU chạy chậm",
          "Vì quá nhiều user bị chặn nhầm, mất niềm tin vào dịch vụ, và chi phí xử lý khiếu nại tăng vọt",
          "Vì AI không đủ thông minh",
        ],
        correct: 1,
        explanation:
          "Hạ ngưỡng = AI cảnh giác cao hơn = nhiều fraud bị bắt NHƯNG cũng nhiều giao dịch bình thường bị chặn nhầm. Trải nghiệm user tệ, trung tâm tổng đài quá tải, khách hàng chuyển ngân hàng khác. Chi phí ẩn của 'chặn nhầm' lớn hơn nhiều so với cảm giác 'chặn được fraud'. Các ngân hàng Việt Nam cân đối dựa trên cost matrix thực tế của mình.",
      },
      {
        question:
          "Khách hàng bị từ chối vay. Theo Nghị định 13/2023, ngân hàng phải làm gì?",
        options: [
          "Không cần giải thích, đây là quyền quyết định của ngân hàng",
          "Giải thích cụ thể yếu tố chính khiến hồ sơ bị từ chối và hướng dẫn cải thiện",
          "Chỉ nói 'không đủ điều kiện' là đủ",
        ],
        correct: 1,
        explanation:
          "Nghị định 13/2023 về bảo vệ dữ liệu cá nhân và các văn bản của NHNN yêu cầu các quyết định tự động ảnh hưởng đến quyền lợi khách hàng (ví dụ từ chối vay) phải có khả năng giải thích. Đây cũng là lý do các ngân hàng buộc phải dùng mô hình chấm điểm có thể giải thích được — không thể dùng mô hình 'hộp đen' thuần túy cho quyết định tín dụng.",
      },
      {
        question:
          "Vai trò chính của chatbot Biti của MB Bank hay trợ lý ảo của các ngân hàng VN hiện nay là gì?",
        options: [
          "Thay thế hoàn toàn nhân viên tổng đài",
          "Trả lời các câu hỏi cơ bản và hướng dẫn giao dịch đơn giản 24/7, chuyển các ca phức tạp sang nhân viên con người",
          "Bán chéo sản phẩm bảo hiểm là nhiệm vụ duy nhất",
        ],
        correct: 1,
        explanation:
          "Chatbot ngân hàng 2024–2025 xử lý tốt các câu hỏi lặp đi lặp lại: tra cứu số dư, hướng dẫn mở thẻ, giải thích phí, hỗ trợ reset mật khẩu. Các ca phức tạp hơn — khiếu nại giao dịch, thương thảo lãi vay, tư vấn đầu tư lớn — vẫn chuyển cho nhân viên. Mô hình 'human-in-the-loop' này giảm 40–60% tải tổng đài mà không làm giảm chất lượng dịch vụ.",
      },
      {
        question:
          "Ngân hàng triển khai AI giám sát rửa tiền (AML). Trong bối cảnh Việt Nam, yêu cầu pháp lý chính đến từ đâu?",
        options: [
          "Không có yêu cầu cụ thể",
          "Luật Phòng chống rửa tiền 2022 và các thông tư của NHNN yêu cầu báo cáo giao dịch đáng ngờ",
          "Chỉ áp dụng với ngân hàng nước ngoài",
        ],
        correct: 1,
        explanation:
          "Luật Phòng chống rửa tiền 2022 (thay thế luật 2012) và Thông tư 09/2023 của NHNN buộc các TCTD phát hiện, báo cáo giao dịch đáng ngờ. Khối lượng giao dịch ở VN đã vượt quá khả năng rà soát thủ công, nên AI AML trở thành công cụ bắt buộc. VPBank, Techcombank đã đầu tư mạnh vào mảng này sau 2023.",
      },
      {
        question:
          "Anh Nam đăng nhập MoMo tại Hà Nội lúc 8h sáng. 10 phút sau, có yêu cầu chuyển 15 triệu VND từ IP Singapore. Hệ thống nên phản ứng thế nào?",
        options: [
          "Chấp nhận luôn vì đã đăng nhập thành công",
          "Chặn hoặc yêu cầu xác thực mạnh (OTP, Face ID) — vì pattern di chuyển địa lý không thể xảy ra và số tiền lớn",
          "Gửi tin nhắn xin lỗi rồi chấp nhận",
        ],
        correct: 1,
        explanation:
          "Đây là pattern điển hình của 'account takeover' sau phishing OTP. Hệ thống thấy: (1) đăng nhập thiết bị mới ở địa điểm mới, (2) giao dịch lớn bất thường, (3) khoảng cách địa lý không thể di chuyển trong 10 phút. Kết hợp các tín hiệu này cho điểm rủi ro rất cao. MoMo, ZaloPay thực tế đều có layer xác thực mạnh cho các ca như vậy.",
      },
      {
        question:
          "Robo-advisor đưa gợi ý đầu tư cho khách hàng. Trách nhiệm cuối cùng khi gợi ý sai và khách hàng thua lỗ thuộc về ai?",
        options: [
          "Mô hình AI — nó là thứ đưa ra quyết định",
          "Ngân hàng hoặc công ty tài chính triển khai robo-advisor — AI là công cụ, trách nhiệm pháp lý vẫn thuộc về tổ chức vận hành",
          "Khách hàng phải tự chịu 100%",
        ],
        correct: 1,
        explanation:
          "AI không phải là chủ thể pháp lý. Ngân hàng/công ty CKDL triển khai robo-advisor phải chịu trách nhiệm về: (1) chất lượng mô hình, (2) bộ câu hỏi đánh giá khẩu vị rủi ro, (3) cảnh báo rủi ro rõ ràng, (4) kênh khiếu nại. Ủy ban CKDL Việt Nam và các quy định về sản phẩm đầu tư bán lẻ áp dụng cho cả sản phẩm dùng AI.",
      },
      {
        type: "fill-blank",
        question:
          "Năm ứng dụng chính của AI trong ngân hàng VN gồm: chống {blank}, chấm điểm {blank}, {blank} khách hàng, tư vấn {blank}, và giám sát {blank}.",
        blanks: [
          {
            answer: "gian lận",
            accept: ["fraud", "lừa đảo", "gian lan"],
          },
          {
            answer: "tín dụng",
            accept: ["credit", "tin dung", "tín nhiệm"],
          },
          {
            answer: "chatbot",
            accept: ["trợ lý ảo", "chat bot", "chat"],
          },
          {
            answer: "đầu tư",
            accept: ["robo-advisor", "investment", "dau tu"],
          },
          {
            answer: "rửa tiền",
            accept: ["AML", "rua tien", "money laundering"],
          },
        ],
        explanation:
          "Chống gian lận (fraud detection), chấm điểm tín dụng (credit scoring), chatbot khách hàng, tư vấn đầu tư (robo-advisor), và giám sát rửa tiền (AML/KYC) là 5 trụ cột AI mà hầu hết ngân hàng Việt Nam đều đã triển khai tính đến 2025.",
      },
    ],
    [],
  );

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Trong 5 năm qua, các ngân hàng Việt Nam dùng AI cho bốn mục đích chính. Theo bạn là mục đích nào?"
          options={[
            "Chỉ để chống gian lận giao dịch thẻ",
            "Chỉ để tư vấn đầu tư cho khách VIP",
            "Chỉ để chấm điểm tín dụng khoản vay",
            "Cả bốn: chống gian lận, chấm điểm tín dụng, chatbot khách hàng, và tư vấn đầu tư — cộng thêm giám sát rửa tiền",
          ]}
          correct={3}
          explanation="Các ngân hàng top Việt Nam đã triển khai AI ở nhiều mảng cùng lúc. Vietcombank, Techcombank, MB, VPBank, TPBank, VietinBank, BIDV, ACB đều có hệ thống chống gian lận thời gian thực, chấm điểm tín dụng tự động, chatbot/trợ lý ảo và robo-advisor cho khách ưu tiên. Mảng thứ năm — giám sát rửa tiền (AML) — đã trở nên bắt buộc sau Luật Phòng chống rửa tiền 2022."
        >
          <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Phép ẩn dụ">
            <p>
              Hãy hình dung mỗi tài khoản ngân hàng của bạn giống như một{" "}
              <strong>chiếc xe đang đi trên đường cao tốc</strong>. Hầu hết
              các chuyến đi là bình thường: bạn lái đến chỗ làm, đi chợ, đưa
              con đi học. Camera giao thông dọc đường ghi lại từng biển số,
              từng tốc độ, từng lần dừng đèn đỏ. Cả đời chiếc xe đó có một
              "dáng đi" rất riêng.
            </p>
            <p>
              Một ngày đẹp trời, camera ghi được chiếc xe đi tốc độ 150km/h
              lúc 3 giờ sáng ở một tỉnh cách nhà 800km. Rất có thể là chủ xe
              đi công tác đột xuất — nhưng cũng rất có thể xe đã bị trộm.
              Camera không kết luận thay chủ xe. Nó chỉ{" "}
              <strong>nhấc điện thoại gọi hỏi</strong>: "Anh có đang lái chiếc
              xe biển số 30A-12345 không?" Nếu có, mọi chuyện tiếp tục. Nếu
              không, công an được báo ngay.
            </p>
            <p>
              AI trong ngân hàng làm đúng việc của hệ thống camera đó. Mỗi
              giao dịch là một "khoảng đường". AI học <em>dáng đi</em> của
              bạn — giờ nào hay mua gì, địa điểm nào quen thuộc, thiết bị
              nào đáng tin. Khi có gì đó <em>lệch quá xa</em> khỏi dáng đi
              bình thường, nó không tự quyết liệu đây là gian lận hay không
              — nó <strong>leo thang xác thực</strong>: gửi OTP, yêu cầu
              Face ID, gọi điện xác nhận. Con người bạn vẫn là người nói
              "đúng" hay "sai" lời cuối.
            </p>
          </LessonSection>

          <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khám phá">
            <VisualizationSection topicSlug={metadata.slug}>
              <div className="flex flex-col gap-8">
                <FraudSimulator />
                <CreditScoreExplainer />
                <VietnameseBankMap />
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
                AI trong ngân hàng không phải là "thuật toán ma thuật đoán
                tương lai". Nó là một <strong>chiếc kính lúp xác suất</strong>:
                nhìn vào biển dữ liệu giao dịch để phát hiện tín hiệu mà mắt
                người không kịp thấy.
              </p>
              <p>
                Bài học cốt lõi: mọi ứng dụng — chống gian lận, chấm điểm
                tín dụng, chatbot, robo-advisor — đều phải trả lời cùng một
                câu hỏi:{" "}
                <em>
                  chi phí khi tôi sai một kiểu so với sai kiểu ngược lại
                  lớn đến đâu, và đâu là ngưỡng cân bằng tối ưu?
                </em>{" "}
                Công nghệ thì có thể thay đổi theo thời gian, nhưng câu hỏi
                đánh đổi này thì không.
              </p>
            </AhaMoment>
          </LessonSection>

          <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
            <InlineChallenge
              question="Ngân hàng A bật AI chống gian lận ở ngưỡng ngặt. Trong một tháng, số fraud bị chặn tăng 40%, nhưng số khiếu nại 'tôi bị chặn oan' tăng 300% và tổng đài quá tải. Phản ứng hợp lý nhất?"
              options={[
                "Tắt AI, quay về chỉ dùng rule cứng",
                "Giảm ngưỡng để ít chặn hơn, đồng thời thêm lớp xác thực mềm (OTP, Face ID) cho vùng xám thay vì chặn cứng",
                "Nâng ngưỡng lên nữa để chắc chắn hơn",
              ]}
              correct={1}
              explanation="Khiếu nại tăng 300% là chỉ báo trải nghiệm user đã sập. Giải pháp không phải tắt AI, mà điều chỉnh ngưỡng kết hợp với 'leo thang xác thực': giao dịch trong vùng rủi ro trung bình không bị chặn thẳng — chỉ cần OTP hoặc Face ID. User thật vượt qua dễ dàng, kẻ gian thì không có OTP. Đây là cách MoMo, ZaloPay, các ví điện tử VN xử lý."
            />
            <InlineChallenge
              question="Mô hình chấm điểm tín dụng của ngân hàng B từ chối chị Hoa với lý do 'không đủ điều kiện'. Chị Hoa khiếu nại. Ngân hàng phải làm gì?"
              options={[
                "Giữ nguyên câu trả lời ban đầu",
                "Cung cấp giải thích cụ thể (ví dụ: DTI cao, lịch sử chậm nợ), theo đúng Nghị định 13/2023 về bảo vệ dữ liệu cá nhân",
                "Yêu cầu chị Hoa tự chứng minh mình đủ điều kiện",
              ]}
              correct={1}
              explanation="Nghị định 13/2023 yêu cầu các quyết định tự động ảnh hưởng đến quyền lợi khách hàng phải có khả năng giải thích. Ngân hàng buộc phải cung cấp yếu tố chính khiến hồ sơ bị từ chối. Đây là lý do các mô hình chấm điểm tín dụng tại VN phải kèm lớp giải thích — không thể là hộp đen thuần."
            />
            <InlineChallenge
              question="Chatbot MB Buddy trả lời sai một câu hỏi quan trọng về lãi suất và khách hàng đã ra quyết định dựa trên đó. Trách nhiệm thuộc về ai?"
              options={[
                "Khách hàng tự chịu — đã đồng ý điều khoản sử dụng",
                "MB Bank — chatbot là công cụ do MB triển khai, mọi phát ngôn qua kênh chính thức đều thuộc trách nhiệm ngân hàng",
                "Đội kỹ sư AI — họ viết code sai",
              ]}
              correct={1}
              explanation="Chatbot không phải chủ thể pháp lý. MB Bank chịu trách nhiệm mọi phát ngôn qua kênh chính thức — bất kể do con người hay AI phát ra. Đây là lý do tất cả chatbot ngân hàng VN đều có disclaimer, và các câu hỏi nhạy cảm (lãi vay thực, cam kết pháp lý) thường được chuyển cho nhân viên con người xác nhận."
            />
          </LessonSection>

          <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích">
            <ExplanationSection topicSlug={metadata.slug}>
              <p>
                Năm mảng lớn của AI trong ngân hàng Việt Nam hiện nay đều đã
                chạy production tại các ngân hàng top. Mỗi mảng có một câu
                hỏi cốt lõi riêng — hiểu từng câu hỏi, bạn hiểu 80% bức
                tranh.
              </p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Callout variant="info" title="1. Chống gian lận giao dịch">
                  <p className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                    <span>
                      AI chấm điểm rủi ro tức thời cho từng giao dịch, dựa
                      trên hành vi lịch sử của chủ tài khoản. Giao dịch lệch
                      pattern sẽ bị chặn hoặc yêu cầu xác thực thêm.{" "}
                      <strong>Ví dụ VN 2024–2025:</strong> VPBank công bố
                      giảm hơn 60% thiệt hại do gian lận thẻ sau khi nâng
                      cấp hệ thống AI; Techcombank vận hành trung tâm giám
                      sát 24/7 với AI làm tầng lọc đầu tiên.
                    </span>
                  </p>
                </Callout>

                <Callout variant="info" title="2. Chấm điểm tín dụng">
                  <p className="flex items-start gap-2">
                    <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                    <span>
                      AI dự đoán xác suất trả nợ dựa trên lịch sử CIC, dòng
                      tiền, hồ sơ nghề nghiệp, DTI và hành vi số.{" "}
                      <strong>Ví dụ VN:</strong> Techcombank phê duyệt
                      nhanh thẻ tín dụng qua AI; FE Credit và Home Credit
                      xử lý hồ sơ vay tiêu dùng tự động trong vài phút; VIB
                      và TPBank dùng AI cho eKYC + scoring để mở thẻ từ
                      xa.
                    </span>
                  </p>
                </Callout>

                <Callout variant="info" title="3. Chatbot & trợ lý ảo">
                  <p className="flex items-start gap-2">
                    <Bot className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                    <span>
                      Các trợ lý ảo như MB Buddy, trợ lý của VCB, VPBank
                      xử lý câu hỏi lặp đi lặp lại 24/7, giải phóng nhân
                      viên tổng đài cho các ca phức tạp.{" "}
                      <strong>Xu hướng 2025:</strong> chuyển từ chatbot
                      trả lời kịch bản sang trợ lý dùng LLM có kiểm soát
                      (có disclaimer, có logging, có human-in-the-loop
                      cho câu khó).
                    </span>
                  </p>
                </Callout>

                <Callout
                  variant="info"
                  title="4. Tư vấn đầu tư (robo-advisor)"
                >
                  <p className="flex items-start gap-2">
                    <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                    <span>
                      Gợi ý phân bổ danh mục dựa trên khẩu vị rủi ro và
                      mục tiêu khách hàng. Tại VN, các công ty chứng
                      khoán (SSI, VPS, HSC, VCSC) và ACB, VPBank Priority
                      đã triển khai phiên bản đơn giản cho khách ưu tiên,
                      kèm disclaimer rõ ràng về rủi ro.
                    </span>
                  </p>
                </Callout>

                <Callout
                  variant="info"
                  title="5. Giám sát rửa tiền (AML/KYC)"
                >
                  <p className="flex items-start gap-2">
                    <FileCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                    <span>
                      Phát hiện pattern rửa tiền phức tạp (structuring,
                      smurfing, giao dịch vòng). AI phân tích mạng lưới
                      giao dịch giữa nhiều tài khoản — điều mà con người
                      không làm được ở quy mô hàng triệu lệnh/ngày.{" "}
                      <strong>Sau Luật PCRT 2022</strong>, mảng này đã
                      trở thành bắt buộc tại mọi ngân hàng Việt Nam.
                    </span>
                  </p>
                </Callout>

                <Callout variant="info" title="Bên cạnh 5 mảng trên">
                  <p className="flex items-start gap-2">
                    <Landmark className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                    <span>
                      Các ngân hàng còn dùng AI cho dự báo dòng tiền ATM,
                      tối ưu lịch trực chi nhánh, phân khúc khách hàng để
                      marketing, phát hiện chuyển khoản lừa đảo giữa
                      người dùng (pig-butchering), và phân tích cảm xúc
                      phản hồi khách hàng.
                    </span>
                  </p>
                </Callout>
              </div>

              <h3>Bối cảnh pháp lý Việt Nam 2024–2025</h3>
              <p>
                AI trong ngân hàng không tự do phát triển — nó nằm trong một
                mạng lưới văn bản pháp lý đan xen nhau. Hiểu đúng bối cảnh
                này giúp nhân viên ngân hàng biết vì sao một số tính năng
                AI nghe có vẻ đơn giản lại bị chậm triển khai nhiều tháng
                cho các đợt kiểm tra nội bộ.
              </p>

              <TabView
                tabs={[
                  {
                    label: "Luật & nghị định",
                    content: (
                      <ul className="list-disc space-y-2 pl-5 text-sm">
                        <li>
                          <strong>Luật Phòng chống rửa tiền 2022</strong> —
                          thay thế luật 2012, siết chặt nghĩa vụ báo cáo
                          giao dịch đáng ngờ. Là động lực chính để các
                          ngân hàng đầu tư AI AML.
                        </li>
                        <li>
                          <strong>Nghị định 13/2023/NĐ-CP</strong> về bảo
                          vệ dữ liệu cá nhân — yêu cầu sự đồng ý rõ ràng
                          khi xử lý dữ liệu và quyền được giải thích cho
                          các quyết định tự động.
                        </li>
                        <li>
                          <strong>Luật các tổ chức tín dụng 2024</strong>{" "}
                          (hiệu lực từ 2024) — cập nhật khung pháp lý cho
                          hoạt động ngân hàng, bao gồm dịch vụ tài chính
                          số.
                        </li>
                      </ul>
                    ),
                  },
                  {
                    label: "Thông tư NHNN",
                    content: (
                      <ul className="list-disc space-y-2 pl-5 text-sm">
                        <li>
                          <strong>Thông tư 09/2023/TT-NHNN</strong> về
                          quản trị rủi ro — bao gồm rủi ro mô hình khi
                          dùng AI cho quyết định kinh doanh.
                        </li>
                        <li>
                          <strong>Thông tư 13/2018/TT-NHNN</strong> (và
                          các sửa đổi) về quản trị rủi ro tín dụng —
                          ràng buộc các mô hình chấm điểm phải có
                          validation và kiểm tra backtest định kỳ.
                        </li>
                        <li>
                          <strong>Quy định eKYC</strong> — cho phép mở
                          tài khoản, phát hành thẻ từ xa qua AI nhận
                          diện khuôn mặt và OCR giấy tờ, miễn tuân thủ
                          yêu cầu chống giả mạo (liveness detection).
                        </li>
                      </ul>
                    ),
                  },
                  {
                    label: "Chuẩn quốc tế áp dụng",
                    content: (
                      <ul className="list-disc space-y-2 pl-5 text-sm">
                        <li>
                          <strong>Basel III / Basel IV</strong> về yêu
                          cầu vốn tối thiểu — buộc các mô hình rủi ro
                          phải có validation độc lập và hệ số vốn phù
                          hợp với chất lượng mô hình.
                        </li>
                        <li>
                          <strong>FATF 40 Recommendations</strong> — là
                          tham chiếu cho hệ thống AML của Việt Nam.
                        </li>
                        <li>
                          <strong>PCI DSS</strong> cho dữ liệu thẻ — áp
                          dụng cho mọi hệ thống lưu trữ hoặc xử lý thẻ
                          tín dụng, kể cả khi AI chỉ đọc để đánh giá.
                        </li>
                      </ul>
                    ),
                  },
                ]}
              />

              <h3>Ba câu chuyện thực tế đáng nhớ 2024–2025</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <StoryCard
                  bank="Techcombank"
                  title="Chấm điểm tín dụng tức thời"
                  body="Hệ thống AI của Techcombank cho phép phê duyệt thẻ tín dụng và khoản vay tiêu dùng trong vài phút thay vì vài ngày. Kết hợp CIC, dòng tiền TCB và hành vi số trong app."
                  icon={Clock}
                />
                <StoryCard
                  bank="VPBank"
                  title="AI chống gian lận 2024"
                  body="VPBank công bố giảm mạnh thiệt hại do fraud thẻ sau khi nâng cấp hệ thống AI năm 2024, kết hợp với xác thực sinh trắc học trên app VPBank NEO."
                  icon={ShieldCheck}
                />
                <StoryCard
                  bank="MB Bank"
                  title="Trợ lý ảo MB Buddy"
                  body="MB Buddy trên app MB Bank xử lý hàng triệu câu hỏi mỗi tháng, từ tra cứu số dư đến hướng dẫn giao dịch — giải phóng tổng đài cho các ca phức tạp."
                  icon={Bot}
                />
              </div>

              <CollapsibleDetail title="Vì sao Techcombank & Vietcombank thường được lấy làm ví dụ?">
                <p>
                  Hai lý do chính. Thứ nhất, quy mô dữ liệu: các ngân hàng
                  này có hàng chục triệu khách hàng và xử lý hàng chục
                  triệu giao dịch mỗi ngày, đủ lớn để các mô hình học được
                  pattern đáng tin cậy. Ngân hàng nhỏ hơn thường phải thuê
                  mô hình từ bên thứ ba hoặc dùng chung dữ liệu với công ty
                  mẹ/đối tác.
                </p>
                <p>
                  Thứ hai, độ minh bạch: các ngân hàng này thường xuyên
                  công bố báo cáo thường niên, tham dự hội thảo ngành và
                  chia sẻ ca nghiên cứu. Các tổ chức tài chính khác có thể
                  đang làm AI mạnh không kém — chúng ta chỉ thiếu thông
                  tin công khai để trích dẫn.
                </p>
              </CollapsibleDetail>

              <CollapsibleDetail title="Những cái bẫy thường gặp khi triển khai AI trong ngân hàng">
                <ul className="list-disc space-y-2 pl-5 text-sm">
                  <li>
                    <strong>Lệch phân phối (data drift):</strong> pattern
                    gian lận thay đổi theo mùa, theo công nghệ mới (QR, ví
                    điện tử). Mô hình không được retrain định kỳ sẽ nhanh
                    chóng lạc hậu.
                  </li>
                  <li>
                    <strong>Bias trong chấm điểm tín dụng:</strong> nếu dữ
                    liệu lịch sử đã thiên lệch theo giới tính/vùng miền/thu
                    nhập, mô hình sẽ học và khuếch đại bias đó. Cần kiểm
                    tra công bằng định kỳ và điều chỉnh.
                  </li>
                  <li>
                    <strong>Chatbot trả lời sai vấn đề nhạy cảm:</strong>{" "}
                    lãi suất, điều khoản hợp đồng, cam kết pháp lý — các
                    chủ đề này luôn cần human-in-the-loop, không để AI tự
                    trả lời.
                  </li>
                  <li>
                    <strong>Phụ thuộc vào một nhà cung cấp duy nhất:</strong>{" "}
                    nhiều ngân hàng VN đang dùng dịch vụ AI cloud của một
                    nhà cung cấp nước ngoài. Rủi ro: thay đổi giá, thay
                    đổi điều khoản, gián đoạn xuyên biên giới.
                  </li>
                  <li>
                    <strong>Thiếu logging đầy đủ:</strong> khi khách hàng
                    khiếu nại một quyết định AI, ngân hàng không thể tái
                    hiện chính xác input và output. Thanh tra NHNN sẽ
                    không chấp nhận "mô hình đã thay đổi nên không tái
                    hiện được".
                  </li>
                </ul>
              </CollapsibleDetail>

              <CollapsibleDetail title="Góc nhìn nhân viên: làm sao để nói chuyện với AI trong công việc?">
                <p>
                  Nếu bạn làm tại ngân hàng/ví điện tử và muốn tận dụng AI
                  trong công việc thường ngày (không phải xây mô hình), ba
                  nguyên tắc nên nhớ:
                </p>
                <ul className="list-disc space-y-2 pl-5 text-sm">
                  <li>
                    <strong>Biết đâu là kênh chính thức.</strong> Hầu hết
                    ngân hàng có LLM nội bộ đã được kiểm duyệt (ví dụ qua
                    Azure OpenAI, Google Vertex có hợp đồng VPN). Không
                    dùng ChatGPT public cho dữ liệu khách hàng — đây là vi
                    phạm Nghị định 13/2023.
                  </li>
                  <li>
                    <strong>Luôn verify output AI.</strong> AI có thể bịa
                    số liệu, bịa điều khoản, nhầm văn bản pháp lý. Mọi
                    output đi đến khách hàng phải qua người xem.
                  </li>
                  <li>
                    <strong>
                      Ghi log các phiên làm việc với AI nếu liên quan quyết
                      định.
                    </strong>{" "}
                    Nhiều ngân hàng đã yêu cầu nhân viên lưu prompt + output
                    cho các công việc nhạy cảm như rà soát hồ sơ hay phân
                    loại khiếu nại.
                  </li>
                </ul>
              </CollapsibleDetail>

              <p className="text-sm text-muted">
                Khi bạn đã nắm năm trụ cột và khung pháp lý này, hầu hết tin
                tức về "ngân hàng ABC ra mắt AI XYZ" sẽ rơi vào một trong
                các ô có sẵn — và bạn sẽ biết câu hỏi phù hợp để đặt ra.
              </p>
            </ExplanationSection>
          </LessonSection>

          <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
            <MiniSummary
              title="Những điều cần nhớ"
              points={[
                "Năm mảng AI chính trong ngân hàng VN: chống gian lận, chấm điểm tín dụng, chatbot, robo-advisor, giám sát rửa tiền.",
                "Mọi ứng dụng đều xoay quanh đánh đổi giữa hai loại sai lầm — chi phí của sai kiểu A so với sai kiểu B quyết định ngưỡng tối ưu, không phải accuracy.",
                "AI trong ngân hàng không thay thế con người — nó lọc và gợi ý, con người vẫn là người ký tên cuối cùng.",
                "Khung pháp lý VN: Luật PCRT 2022, Nghị định 13/2023 về dữ liệu cá nhân, Thông tư 09/2023 về quản trị rủi ro, cùng các chuẩn Basel III và FATF.",
                "Các ví dụ thực tế 2024–2025: Techcombank chấm điểm tức thời, VPBank chống fraud, MB Buddy trả lời 24/7, VPBank/Techcombank giám sát AML.",
                "Quyền khách hàng: được giải thích khi bị từ chối vay, được xác thực thêm thay vì chặn cứng, được khiếu nại với logging đầy đủ.",
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

function StoryCard({
  bank,
  title,
  body,
  icon: Icon,
}: {
  bank: string;
  title: string;
  body: string;
  icon: typeof CheckCircle2;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-2 rounded-xl border border-border bg-surface/60 p-4"
    >
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-accent-light p-2">
          <Icon className="h-4 w-4 text-accent" />
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-accent">
          <Building2 className="h-3 w-3" />
          {bank}
        </div>
      </div>
      <div className="text-sm font-semibold text-foreground">{title}</div>
      <div className="text-xs text-muted">{body}</div>
    </motion.div>
  );
}
