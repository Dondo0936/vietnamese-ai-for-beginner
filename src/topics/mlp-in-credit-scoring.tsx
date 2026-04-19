"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  GraduationCap,
  Calendar,
  Wallet,
  Banknote,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import {
  InlineChallenge,
  MiniSummary,
  Callout,
  SliderGroup,
  StepReveal,
  TopicLink,
} from "@/components/interactive";
import type { TopicMeta } from "@/lib/types";
import ApplicationLayout from "@/components/application/ApplicationLayout";
import ApplicationHero from "@/components/application/ApplicationHero";
import ApplicationProblem from "@/components/application/ApplicationProblem";
import ApplicationMechanism from "@/components/application/ApplicationMechanism";
import Beat from "@/components/application/Beat";
import ApplicationMetrics from "@/components/application/ApplicationMetrics";
import Metric from "@/components/application/Metric";
import ApplicationCounterfactual from "@/components/application/ApplicationCounterfactual";
import ApplicationTryIt from "@/components/application/ApplicationTryIt";

export const metadata: TopicMeta = {
  slug: "mlp-in-credit-scoring",
  title: "MLP in Credit Scoring",
  titleVi: "MLP chấm tín dụng",
  description:
    "Bạn nộp hồ sơ vay trên app ngân hàng Việt. MLP nhìn hàng trăm biến số, bắt được pattern mà hồi quy logistic bỏ lỡ, rồi trả về xác suất vỡ nợ chỉ trong vài giây.",
  category: "neural-fundamentals",
  tags: ["mlp", "credit-scoring", "application", "fintech"],
  difficulty: "beginner",
  relatedSlugs: ["mlp"],
  vizType: "interactive",
  applicationOf: "mlp",
  featuredApp: {
    name: "Upstart",
    productFeature: "AI Credit Scoring",
    company: "Upstart Network, Inc.",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "How AI Drives More Affordable Credit Access",
      publisher: "Upstart",
      url: "https://info.upstart.com/how-ai-drives-more-affordable-credit-access",
      date: "2021-06",
      kind: "engineering-blog",
    },
    {
      title:
        "The Use of Machine Learning for Credit Underwriting: Market and Data Science Context",
      publisher: "FinRegLab",
      url: "https://finreglab.org/wp-content/uploads/2023/12/FinRegLab_2021-09-16_Research-Report_The-Use-of-Machine-Learning-for-Credit-Underwriting_Market-and-Data-Science-Context.pdf",
      date: "2021-09",
      kind: "paper",
    },
    {
      title:
        "Fresh Off IPO, Upstart Aims to Push Boundaries of AI-based Lending",
      publisher: "American Banker",
      url: "https://www.americanbanker.com/news/fresh-off-ipo-upstart-aims-to-push-boundaries-of-ai-based-lending",
      date: "2021-01",
      kind: "news",
    },
    {
      title: "Neural Network Credit Scoring Models",
      publisher: "Computers & Operations Research (Elsevier)",
      url: "https://www.cse.fau.edu/~xqzhu/courses/cap5615/reading/credit.score.pdf",
      date: "2000-01",
      kind: "paper",
    },
  ],
  tocSections: [
    { id: "hero", labelVi: "Công ty nào?" },
    { id: "problem", labelVi: "Vấn đề" },
    { id: "mechanism", labelVi: "Cách giải quyết" },
    { id: "tryIt", labelVi: "Thử tự tay" },
    { id: "metrics", labelVi: "Con số thật" },
    { id: "counterfactual", labelVi: "Nếu không có" },
  ],
};

/* ══════════════════════════════════════════════════════════════════
   Mô phỏng MLP chấm điểm rủi ro
   ══════════════════════════════════════════════════════════════════ */

interface LoanInputs {
  income: number; // thu nhập hàng tháng (triệu VNĐ)
  debtRatio: number; // tỉ lệ nợ hiện tại trên thu nhập (%)
  jobMonths: number; // số tháng làm công việc hiện tại
  education: number; // 0 = THPT, 1 = Cao đẳng, 2 = Đại học, 3 = Sau đại học
  loanAmount: number; // số tiền vay (triệu VNĐ)
}

interface MlpOutput {
  riskProb: number; // xác suất vỡ nợ 0..1
  confidence: number; // độ tin cậy 0..1
  decision: "approve" | "review" | "reject";
  apr: number; // lãi suất năm gợi ý (%)
  keyFactors: { label: string; impact: number }[];
}

function sigmoid(z: number) {
  return 1 / (1 + Math.exp(-z));
}

/** MLP mô phỏng với 2 lớp ẩn — coefficient được chọn tay để minh hoạ trực quan */
function simulateMlp(inp: LoanInputs): MlpOutput {
  // Chuẩn hoá đầu vào về khoảng gần 0..1
  const incomeN = Math.min(1, inp.income / 60); // 0..60tr/tháng
  const dtiN = Math.min(1, inp.debtRatio / 80); // 0..80%
  const jobN = Math.min(1, inp.jobMonths / 72); // 0..72 tháng (6 năm)
  const eduN = inp.education / 3; // 0..3
  const loanN = Math.min(1, inp.loanAmount / 500); // 0..500tr

  // Lớp ẩn 1 (4 nơ-ron) — mỗi nơ-ron đại diện 1 khía cạnh
  const hStability = Math.tanh(
    2.1 * jobN + 1.4 * eduN + 0.7 * incomeN - 1.2 * dtiN - 0.4
  );
  const hCapacity = Math.tanh(
    2.5 * incomeN - 1.8 * loanN - 1.1 * dtiN + 0.2
  );
  const hBurden = Math.tanh(
    2.6 * dtiN + 1.6 * loanN - 1.4 * incomeN - 0.3
  );
  const hGrowth = Math.tanh(
    1.8 * eduN + 1.2 * jobN + 0.6 * incomeN - 0.1
  );

  // Lớp ẩn 2 (3 nơ-ron) — tổ hợp các khía cạnh
  const hRisk = Math.tanh(
    -1.9 * hStability - 1.5 * hCapacity + 2.4 * hBurden - 1.1 * hGrowth + 0.2
  );
  const hTrust = Math.tanh(
    1.7 * hStability + 1.4 * hGrowth + 0.9 * hCapacity - 0.8 * hBurden + 0.1
  );
  const hEdge = Math.tanh(
    0.9 * hGrowth - 0.6 * hBurden + 0.7 * hStability - 0.2
  );

  // Đầu ra: xác suất vỡ nợ
  const z = 2.6 * hRisk - 2.3 * hTrust - 0.8 * hEdge + 0.0;
  const riskProb = sigmoid(z);

  // Độ tin cậy ~ độ &quot;rõ ràng&quot; của đầu ra (càng xa 0.5 càng chắc)
  const confidence = Math.min(1, Math.abs(riskProb - 0.5) * 2 + 0.3);

  // Quyết định
  let decision: MlpOutput["decision"];
  if (riskProb < 0.22) decision = "approve";
  else if (riskProb < 0.5) decision = "review";
  else decision = "reject";

  // APR: thấp khi rủi ro thấp, cao khi rủi ro cao
  const apr = 6 + riskProb * 22;

  // Trọng số đóng góp (gần đúng, chỉ để minh hoạ)
  const keyFactors = [
    { label: "Ổn định công việc", impact: hStability },
    { label: "Khả năng trả", impact: hCapacity },
    { label: "Gánh nặng nợ", impact: -hBurden },
    { label: "Tiềm năng tăng tiến", impact: hGrowth },
  ].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

  return { riskProb, confidence, decision, apr, keyFactors };
}

/* ══════════════════════════════════════════════════════════════════
   Thẻ kết quả
   ══════════════════════════════════════════════════════════════════ */

function DecisionCard({ result }: { result: MlpOutput }) {
  const decisionConfig = {
    approve: {
      label: "Duyệt vay",
      color: "#10b981",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      border: "border-emerald-300 dark:border-emerald-800",
      icon: CheckCircle2,
      note: "Rủi ro thấp — hồ sơ đủ điều kiện duyệt tự động.",
    },
    review: {
      label: "Cần xét duyệt tay",
      color: "#f59e0b",
      bg: "bg-amber-50 dark:bg-amber-900/20",
      border: "border-amber-300 dark:border-amber-800",
      icon: AlertTriangle,
      note: "Vùng xám — chuyên viên tín dụng sẽ xem thêm tài liệu bổ sung.",
    },
    reject: {
      label: "Từ chối",
      color: "#ef4444",
      bg: "bg-rose-50 dark:bg-rose-900/20",
      border: "border-rose-300 dark:border-rose-800",
      icon: XCircle,
      note: "Rủi ro cao — mô hình khuyến nghị không cấp khoản vay này.",
    },
  };
  const cfg = decisionConfig[result.decision];
  const Icon = cfg.icon;

  return (
    <div
      className={`rounded-2xl border-2 ${cfg.border} ${cfg.bg} p-5 space-y-4`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: cfg.color }}
          >
            <Icon size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted font-semibold">
              Quyết định của MLP
            </p>
            <p className="text-base font-bold" style={{ color: cfg.color }}>
              {cfg.label}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wide text-muted font-semibold">
            Xác suất vỡ nợ
          </p>
          <p
            className="text-xl font-bold tabular-nums"
            style={{ color: cfg.color }}
          >
            {(result.riskProb * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      <p className="text-xs text-foreground/85 leading-relaxed">{cfg.note}</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-background/60 p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted font-semibold">
            Độ tin cậy
          </p>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-2 flex-1 rounded-full bg-surface-hover overflow-hidden">
              <motion.div
                className="h-full bg-accent"
                animate={{ width: `${result.confidence * 100}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
              />
            </div>
            <span className="text-xs font-mono tabular-nums text-foreground">
              {(result.confidence * 100).toFixed(0)}%
            </span>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-background/60 p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted font-semibold">
            Lãi suất gợi ý
          </p>
          <p className="text-base font-bold text-foreground tabular-nums mt-1">
            {result.apr.toFixed(1)}% <span className="text-xs font-normal text-muted">/năm</span>
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-[10px] uppercase tracking-wide text-muted font-semibold">
          Yếu tố ảnh hưởng lớn nhất
        </p>
        {result.keyFactors.map((f) => {
          const positive = f.impact > 0;
          const width = Math.min(100, Math.abs(f.impact) * 100);
          return (
            <div key={f.label} className="flex items-center gap-2 text-xs">
              <span className="w-36 text-foreground/80 shrink-0">{f.label}</span>
              <div className="flex-1 h-1.5 rounded-full bg-surface-hover overflow-hidden">
                <motion.div
                  className="h-full"
                  style={{
                    backgroundColor: positive ? "#10b981" : "#ef4444",
                  }}
                  animate={{ width: `${width}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 22 }}
                />
              </div>
              <span
                className="w-10 text-right font-mono tabular-nums"
                style={{ color: positive ? "#10b981" : "#ef4444" }}
              >
                {positive ? "+" : "−"}
                {Math.abs(f.impact).toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Approval flow visualization — ba ô hồ sơ nhỏ chạy qua 4 bước
   ══════════════════════════════════════════════════════════════════ */

interface Applicant {
  name: string;
  shortLabel: string;
  description: string;
  inputs: LoanInputs;
}

const SAMPLE_APPLICANTS: Applicant[] = [
  {
    name: "Chị Lan",
    shortLabel: "Nhân viên văn phòng",
    description:
      "Thu nhập 18tr/tháng, 30 tháng làm cùng công ty, tỉ lệ nợ hiện tại 18%, vay 120tr mua xe máy.",
    inputs: {
      income: 18,
      debtRatio: 18,
      jobMonths: 30,
      education: 2,
      loanAmount: 120,
    },
  },
  {
    name: "Anh Dũng",
    shortLabel: "Freelance thiết kế",
    description:
      "Thu nhập 25tr/tháng nhưng không ổn định, 8 tháng ở địa chỉ hiện tại, nợ thẻ tín dụng 55% thu nhập, vay 80tr.",
    inputs: {
      income: 25,
      debtRatio: 55,
      jobMonths: 8,
      education: 2,
      loanAmount: 80,
    },
  },
  {
    name: "Cô Hà",
    shortLabel: "Công chức",
    description:
      "Thu nhập 12tr/tháng ổn định, 60 tháng cùng cơ quan, tỉ lệ nợ 9%, vay 50tr sửa nhà.",
    inputs: {
      income: 12,
      debtRatio: 9,
      jobMonths: 60,
      education: 2,
      loanAmount: 50,
    },
  },
];

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════ */

export default function MlpInCreditScoringTopic() {
  return (
    <ApplicationLayout metadata={metadata} parentTitleVi="MLP">
      <ApplicationHero
        parentTitleVi="MLP"
        topicSlug="mlp-in-credit-scoring"
      >
        <p>
          Bạn mở app ngân hàng, bấm &ldquo;Vay tiêu dùng&rdquo;, điền 5 ô —
          thu nhập, công việc, học vấn, nợ hiện tại, số tiền muốn vay — bấm
          gửi. Trong vòng vài giây, app đã trả về: <strong>duyệt, cần xem
          thêm, hay từ chối</strong>, kèm lãi suất đề xuất.
        </p>
        <p>
          Đằng sau cái nút ấy không còn là con người ngồi đọc hồ sơ. Đó là
          một <strong>MLP</strong> (mạng nơ-ron nhiều lớp) nhìn đồng thời
          hàng trăm biến số, bắt được các <em>pattern</em> (quy luật) mà mô
          hình thống kê truyền thống bỏ lỡ.
        </p>
        <p>
          Ở Mỹ, <strong>Upstart</strong> tiên phong hướng đi này từ 2014, dùng
          MLP để chấm điểm những người vay &ldquo;thin file&rdquo; — hồ sơ tín
          dụng mỏng, bị FICO từ chối oan. Kết quả: duyệt thêm 27% người vay,
          lãi suất trung bình thấp hơn 16%. Các ngân hàng Việt cũng đang đi
          cùng con đường, áp dụng cho vay tiêu dùng qua app.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="mlp-in-credit-scoring">
        <p>
          Hệ thống chấm điểm truyền thống (ở Mỹ là FICO, ở Việt Nam là điểm
          CIC) chỉ nhìn khoảng 20 biến tài chính: lịch sử trả nợ, tổng dư nợ,
          số năm có tín dụng. Mô hình đứng sau là <strong>hồi quy logistic
          </strong> — tiêu chuẩn ngành ngân hàng từ thập niên 1980.
        </p>
        <p>
          Hạn chế lớn nhất của hồi quy logistic:{" "}
          <em>chỉ bắt được quan hệ tuyến tính</em>. Nó cho rằng &ldquo;thu nhập
          cao hơn 1 triệu = giảm 0,5% rủi ro&rdquo;, đều đặn ở mọi ngưỡng. Thực
          tế đời sống không như vậy: một người thu nhập 5 triệu vay 100 triệu
          và người thu nhập 50 triệu vay 100 triệu có mức rủi ro khác nhau
          không theo tỉ lệ thẳng.
        </p>
        <p>
          Hậu quả: hàng triệu người Việt{" "}
          <strong>thực sự có khả năng trả nợ</strong> — sinh viên vừa ra
          trường, người tự do, tiểu thương — bị ngân hàng từ chối oan chỉ vì{" "}
          <em>hồ sơ mỏng</em> hoặc vì hồ sơ không khớp vào đường thẳng của mô
          hình cũ. Cần một cách chấm điểm:
        </p>
        <ul>
          <li>Bắt được quan hệ phi tuyến giữa thu nhập, nợ, nghề nghiệp.</li>
          <li>
            Tận dụng hàng trăm biến, không chỉ 20 chỉ số tín dụng kinh điển.
          </li>
          <li>Duyệt được trong vài giây để app hoạt động &ldquo;thời gian thật&rdquo;.</li>
          <li>
            Vẫn kiểm tra được bởi cơ quan quản lý — tức là giải thích được vì
            sao từng hồ sơ bị từ chối hay duyệt.
          </li>
        </ul>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="MLP"
        topicSlug="mlp-in-credit-scoring"
      >
        <Beat step={1}>
          <p>
            <strong>Thu thập đặc trưng đa chiều.</strong> Hệ thống lấy về
            khoảng 100–1.600 biến số từ hồ sơ người vay: thu nhập, tỉ lệ nợ,
            số tháng làm công việc hiện tại, trình độ học vấn, địa điểm cư
            trú, lịch sử giao dịch qua ngân hàng, thậm chí cả số lần mở-đóng
            ví điện tử. Tất cả được chuẩn hoá (normalize) về khoảng 0..1 để
            mạng nơ-ron xử lý.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>Lan truyền qua các lớp ẩn.</strong> Dữ liệu chảy qua 2–4
            lớp ẩn. <em>Lớp ẩn 1</em> học các khái niệm trung gian kiểu
            &ldquo;ổn định công việc&rdquo;, &ldquo;khả năng trả&rdquo;,
            &ldquo;gánh nặng nợ hiện tại&rdquo;. <em>Lớp ẩn 2</em> tổ hợp
            chúng thành các khái niệm phức tạp hơn, ví dụ &ldquo;pattern rủi
            ro của khách hàng trẻ có bằng đại học mới ra trường&rdquo; —
            những pattern mà hồi quy logistic không thể bắt vì đòi hỏi tổ
            hợp phi tuyến.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>Đầu ra là xác suất vỡ nợ.</strong> Lớp cuối cùng dùng hàm
            sigmoid (hàm S, nén giá trị về khoảng 0..1). Kết quả là một xác
            suất — ví dụ 0,18 nghĩa là ước lượng 18% khả năng người này
            không trả nợ đúng hạn. Dưới ngưỡng thấp → duyệt tự động, trên
            ngưỡng cao → từ chối, ở giữa → đẩy sang chuyên viên tín dụng xem
            thêm hồ sơ.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>Huấn luyện trên dữ liệu lịch sử.</strong> Ngân hàng có
            hàng triệu khoản vay quá khứ đã biết kết quả (trả đúng, trả
            muộn, hay vỡ nợ). Dùng backpropagation (lan truyền ngược) để
            mạng tự chỉnh trọng số: những cấu hình hồ sơ từng dẫn đến vỡ nợ
            sẽ được đẩy về xác suất cao, ngược lại. Mỗi tháng, mô hình được
            huấn luyện lại với dữ liệu mới để theo kịp nền kinh tế.
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationTryIt topicSlug="mlp-in-credit-scoring">
        <LoanPlayground />
      </ApplicationTryIt>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="mlp-in-credit-scoring"
      >
        <Metric
          value="Mô hình MLP của Upstart duyệt thêm 27% người vay so với mô hình hồi quy logistic truyền thống, với cùng ngưỡng rủi ro"
          sourceRef={1}
        />
        <Metric
          value="Lãi suất trung bình thấp hơn 16% so với mô hình chỉ dùng FICO — nhờ bắt đúng hồ sơ 'thin file' chất lượng tốt"
          sourceRef={1}
        />
        <Metric
          value="Khoảng 70% khoản vay được duyệt hoàn toàn tự động, không cần chuyên viên tín dụng xem xét"
          sourceRef={3}
        />
        <Metric
          value="Upstart IPO tháng 12 năm 2020 với định giá 1,5 tỉ USD — thị trường vốn công nhận hiệu quả của mô hình MLP chấm tín dụng"
          sourceRef={3}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="MLP"
        topicSlug="mlp-in-credit-scoring"
      >
        <p>
          Nếu tắt MLP, quay lại hồi quy logistic cổ điển với 20 biến FICO/CIC:
        </p>
        <ul>
          <li>
            Hàng triệu người vay &ldquo;thin file&rdquo; &mdash; sinh viên mới
            ra trường, người tự do, tiểu thương &mdash; tiếp tục bị từ chối
            oan hoặc phải vay với lãi suất quá cao.
          </li>
          <li>
            Ngân hàng vẫn an toàn <em>về thống kê</em>, nhưng bỏ lỡ một thị
            trường lớn gồm những khách hàng thực sự có khả năng trả nợ.
          </li>
          <li>
            Thời gian duyệt kéo dài vài ngày đến vài tuần, vì hồ sơ rìa phải
            chuyển qua chuyên viên xem tay.
          </li>
        </ul>
        <p>
          MLP không thay thế chuyên viên tín dụng — nó <strong>mở rộng phạm
          vi</strong> ngân hàng tiếp cận. Những hồ sơ rõ ràng được duyệt tự
          động; hồ sơ rìa được chuyển đến đúng người, với bối cảnh đầy đủ. Cả
          ngân hàng và khách hàng đều hưởng lợi.
        </p>
        <div className="not-prose mt-6">
          <ApplicationLearnMoreBlock />
        </div>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}

/* ══════════════════════════════════════════════════════════════════
   LOAN PLAYGROUND — phần chính người dùng tương tác
   ══════════════════════════════════════════════════════════════════ */

function LoanPlayground() {
  const [sampleIdx, setSampleIdx] = useState<number | null>(null);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Banknote size={18} className="text-accent" />
          Hồ sơ vay &mdash; bạn điền, MLP chấm
        </h3>
        <p className="text-sm text-muted leading-relaxed">
          Kéo 5 thanh bên dưới để thử nhiều kiểu hồ sơ vay. MLP sẽ tính lại xác
          suất vỡ nợ tức thì, gợi ý lãi suất, và hiển thị những yếu tố đóng
          góp lớn nhất vào quyết định.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface/40 p-4">
        <p className="text-[11px] font-semibold text-tertiary uppercase tracking-wide mb-2">
          Hoặc bắt đầu từ một hồ sơ mẫu
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {SAMPLE_APPLICANTS.map((app, idx) => {
            const active = sampleIdx === idx;
            return (
              <button
                key={app.name}
                type="button"
                onClick={() => setSampleIdx(idx)}
                className={`text-left rounded-lg border p-3 transition-colors ${
                  active
                    ? "border-accent bg-accent-light"
                    : "border-border bg-card hover:border-accent/40"
                }`}
              >
                <p
                  className={`text-xs font-semibold ${active ? "text-accent-dark" : "text-foreground"}`}
                >
                  {app.name} &mdash; {app.shortLabel}
                </p>
                <p className="text-[11px] text-muted mt-1 leading-snug">
                  {app.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <LoanSliderPanel
        key={sampleIdx ?? -1}
        presetInputs={sampleIdx !== null ? SAMPLE_APPLICANTS[sampleIdx].inputs : null}
      />

      <ApprovalFlowReveal />

      <Callout variant="tip" title="Một con số, nhiều góc nhìn">
        Cùng một con số xác suất vỡ nợ 25% có thể nghĩa là: hồ sơ rìa cần xem
        thêm giấy tờ, hoặc cần lãi suất cao hơn để bù rủi ro. MLP không đưa ra
        quyết định đạo đức &mdash; nó chỉ đưa ra ước lượng. Quyết định cuối
        cùng vẫn thuộc về chính sách tín dụng của từng ngân hàng.
      </Callout>

      <FairnessSection />

      <FairnessChallenge />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SliderGroup bao quanh simulateMlp
   ══════════════════════════════════════════════════════════════════ */

function LoanSliderPanel({ presetInputs }: { presetInputs: LoanInputs | null }) {
  const initial: LoanInputs = presetInputs ?? {
    income: 18,
    debtRatio: 25,
    jobMonths: 24,
    education: 2,
    loanAmount: 100,
  };

  return (
    <SliderGroup
      title="Năm biến số đầu vào"
      sliders={[
        {
          key: "income",
          label: "Thu nhập hàng tháng",
          min: 5,
          max: 60,
          step: 1,
          defaultValue: initial.income,
          unit: " triệu",
        },
        {
          key: "debtRatio",
          label: "Tỉ lệ nợ hiện tại / thu nhập",
          min: 0,
          max: 80,
          step: 1,
          defaultValue: initial.debtRatio,
          unit: "%",
        },
        {
          key: "jobMonths",
          label: "Số tháng làm công việc hiện tại",
          min: 0,
          max: 72,
          step: 1,
          defaultValue: initial.jobMonths,
          unit: " tháng",
        },
        {
          key: "education",
          label: "Trình độ học vấn (0=THPT, 1=Cao đẳng, 2=Đại học, 3=Sau ĐH)",
          min: 0,
          max: 3,
          step: 1,
          defaultValue: initial.education,
        },
        {
          key: "loanAmount",
          label: "Số tiền muốn vay",
          min: 10,
          max: 500,
          step: 10,
          defaultValue: initial.loanAmount,
          unit: " triệu",
        },
      ]}
      visualization={(values) => {
        const inputs: LoanInputs = {
          income: values.income,
          debtRatio: values.debtRatio,
          jobMonths: values.jobMonths,
          education: values.education,
          loanAmount: values.loanAmount,
        };
        const result = simulateMlp(inputs);
        return (
          <div className="w-full flex flex-col md:flex-row gap-4 items-stretch">
            <div className="flex-1 space-y-2">
              <p className="text-[11px] font-semibold text-tertiary uppercase tracking-wide">
                Hồ sơ hiện tại
              </p>
              <ApplicantSummary inputs={inputs} />
            </div>
            <div className="flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${result.decision}-${result.riskProb.toFixed(2)}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                >
                  <DecisionCard result={result} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        );
      }}
    />
  );
}

/* ══════════════════════════════════════════════════════════════════
   Tóm tắt hồ sơ bên trái &mdash; dùng icon cho dễ nhìn
   ══════════════════════════════════════════════════════════════════ */

function ApplicantSummary({ inputs }: { inputs: LoanInputs }) {
  const eduLabels = ["THPT", "Cao đẳng", "Đại học", "Sau đại học"];
  const items = [
    {
      icon: Wallet,
      label: "Thu nhập",
      value: `${inputs.income} triệu/tháng`,
      color: "#0ea5e9",
    },
    {
      icon: AlertTriangle,
      label: "Nợ / thu nhập",
      value: `${inputs.debtRatio}%`,
      color: inputs.debtRatio > 40 ? "#ef4444" : inputs.debtRatio > 20 ? "#f59e0b" : "#10b981",
    },
    {
      icon: Briefcase,
      label: "Công việc hiện tại",
      value: `${inputs.jobMonths} tháng`,
      color: inputs.jobMonths > 24 ? "#10b981" : inputs.jobMonths > 6 ? "#f59e0b" : "#ef4444",
    },
    {
      icon: GraduationCap,
      label: "Học vấn",
      value: eduLabels[inputs.education] ?? "—",
      color: "#8b5cf6",
    },
    {
      icon: Banknote,
      label: "Vay",
      value: `${inputs.loanAmount} triệu`,
      color: "#6366f1",
    },
  ];
  return (
    <div className="space-y-2">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <div
            key={it.label}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-2.5"
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-white shrink-0"
              style={{ backgroundColor: it.color }}
            >
              <Icon size={14} />
            </div>
            <div className="flex-1 flex items-center justify-between">
              <span className="text-xs text-muted">{it.label}</span>
              <span className="text-sm font-semibold text-foreground tabular-nums">
                {it.value}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ApprovalFlowReveal &mdash; StepReveal diễn giải quy trình trong app
   ══════════════════════════════════════════════════════════════════ */

function ApprovalFlowReveal() {
  return (
    <div className="space-y-3">
      <h4 className="text-base font-semibold text-foreground flex items-center gap-2">
        <Calendar size={18} className="text-accent" />
        Một đơn vay đi qua những chặng nào?
      </h4>
      <p className="text-sm text-muted leading-relaxed">
        Bấm <em>Tiếp tục</em> để xem từng bước. Cả quy trình chỉ tính bằng giây
        ở phần tự động, cộng vài giờ &mdash; vài ngày nếu cần chuyên viên xem
        tay.
      </p>
      <StepReveal
        labels={[
          "Bước 1: Nhập hồ sơ",
          "Bước 2: Kiểm tra định danh",
          "Bước 3: MLP chấm rủi ro",
          "Bước 4: Áp dụng chính sách",
          "Bước 5: Phản hồi khách",
        ]}
      >
        {[
          <ApprovalStep
            key="s1"
            icon={Briefcase}
            title="Nhập hồ sơ"
            time="1–3 phút"
            body="Khách điền 5–10 ô trên app: thu nhập, công việc, số tiền vay, kỳ hạn. App đọc thêm dữ liệu ngân hàng liên kết (lịch sử giao dịch, ví điện tử) để lấy hàng trăm biến phụ."
            color="#0ea5e9"
          />,
          <ApprovalStep
            key="s2"
            icon={ShieldCheck}
            title="Kiểm tra định danh"
            time="vài giây"
            body="eKYC: quét CCCD, nhận diện khuôn mặt, đối chiếu với cơ sở dữ liệu quốc gia. Ngăn giả mạo ngay từ cổng &mdash; nếu không qua bước này, MLP không được gọi đến."
            color="#8b5cf6"
          />,
          <ApprovalStep
            key="s3"
            icon={Wallet}
            title="MLP chấm rủi ro"
            time="~100 mili giây"
            body="Toàn bộ hàng trăm biến chảy qua mạng 2–4 lớp ẩn. Đầu ra: xác suất vỡ nợ + danh sách các yếu tố đóng góp lớn nhất (để phục vụ giải thích và kiểm toán)."
            color="#10b981"
          />,
          <ApprovalStep
            key="s4"
            icon={AlertTriangle}
            title="Áp dụng chính sách"
            time="< 1 giây"
            body="Ngân hàng có các ngưỡng: rủi ro < 0,22 &rarr; duyệt tự động; 0,22–0,5 &rarr; chuyển chuyên viên xem thêm tài liệu; > 0,5 &rarr; từ chối. Các quy định chống phân biệt cũng được áp ở đây."
            color="#f59e0b"
          />,
          <ApprovalStep
            key="s5"
            icon={CheckCircle2}
            title="Phản hồi khách"
            time="tức thì"
            body="Nếu duyệt: app hiện số tiền, lãi suất, kỳ hạn. Nếu từ chối: app phải nêu lý do chính, thường là một trong các yếu tố MLP đã đánh dấu đóng góp lớn nhất &mdash; đây là yêu cầu pháp lý."
            color="#ef4444"
          />,
        ]}
      </StepReveal>
    </div>
  );
}

function ApprovalStep({
  icon: Icon,
  title,
  time,
  body,
  color,
}: {
  icon: typeof Briefcase;
  title: string;
  time: string;
  body: string;
  color: string;
}) {
  return (
    <div
      className="rounded-lg border border-border bg-surface/60 p-4 space-y-2"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: color }}
          >
            <Icon size={14} />
          </div>
          <h5 className="text-sm font-semibold text-foreground">{title}</h5>
        </div>
        <span
          className="text-[11px] font-bold px-2 py-0.5 rounded-full tabular-nums"
          style={{ backgroundColor: color + "22", color }}
        >
          {time}
        </span>
      </div>
      <p className="text-sm text-foreground/85 leading-relaxed">{body}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   FairnessSection &mdash; các cân nhắc về công bằng
   ══════════════════════════════════════════════════════════════════ */

function FairnessSection() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <h4 className="text-base font-semibold text-foreground flex items-center gap-2">
        <ShieldCheck size={18} className="text-accent" />
        Công bằng và kiểm toán &mdash; phần ít ai nói nhưng quan trọng nhất
      </h4>
      <p className="text-sm text-foreground/85 leading-relaxed">
        MLP là một &ldquo;hộp đen&rdquo; hơn hồi quy logistic. Với cùng một
        quyết định từ chối, hồi quy logistic trả về đúng một danh sách hệ số
        &ldquo;thu nhập: −0,4, tỉ lệ nợ: +0,6, học vấn: −0,1&rdquo; &mdash; dễ
        nói với khách hàng. MLP có hàng chục nghìn trọng số ẩn, giải thích
        không đơn giản như vậy. Vì thế ngân hàng phải làm thêm vài việc:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FairnessCard
          title="Không dùng biến nhạy cảm"
          body="Luật Mỹ (ECOA) và thông lệ Việt cấm dùng giới tính, sắc tộc, tôn giáo để ra quyết định cho vay. Các biến này không bao giờ vào đầu vào MLP."
          color="#ef4444"
        />
        <FairnessCard
          title="Kiểm tra disparate impact"
          body="So tỉ lệ duyệt của các nhóm khác nhau. Nếu MLP duyệt nữ thấp hơn nam đáng kể mà lý do không giải thích được bằng rủi ro thật, phải chỉnh lại mô hình."
          color="#f59e0b"
        />
        <FairnessCard
          title="Giải thích từng quyết định"
          body="Dùng SHAP, LIME hoặc lớp giải thích riêng để báo cho khách 'vì sao bạn bị từ chối' — thường là 3 yếu tố lớn nhất. Đây là yêu cầu pháp lý ở nhiều nước."
          color="#10b981"
        />
      </div>
      <Callout variant="warning" title="MLP không biết đạo đức">
        Mạng nơ-ron chỉ tối ưu cho &ldquo;dự đoán vỡ nợ&rdquo;. Nếu dữ liệu
        lịch sử có định kiến (ví dụ: trước đây ngân hàng từ chối người vay
        vùng nông thôn, dẫn đến ít dữ liệu, ít ví dụ trả tốt), MLP sẽ học lại
        định kiến đó. Trách nhiệm đảm bảo công bằng thuộc về <em>con người
        thiết kế mô hình</em>, không phải mô hình.
      </Callout>
    </div>
  );
}

function FairnessCard({
  title,
  body,
  color,
}: {
  title: string;
  body: string;
  color: string;
}) {
  return (
    <div
      className="rounded-xl border border-border bg-background/60 p-4 space-y-2"
      style={{ borderTop: `3px solid ${color}` }}
    >
      <h5 className="text-sm font-semibold text-foreground">{title}</h5>
      <p className="text-xs text-foreground/80 leading-relaxed">{body}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   FairnessChallenge &mdash; InlineChallenge cuối bài
   ══════════════════════════════════════════════════════════════════ */

function FairnessChallenge() {
  return (
    <div className="space-y-3">
      <h4 className="text-base font-semibold text-foreground">
        Thử tình huống thực tế
      </h4>
      <InlineChallenge
        question="MLP đang từ chối một lượng lớn hồ sơ từ sinh viên mới ra trường (dưới 1 năm đi làm). Đội vận hành phải phản ứng thế nào?"
        options={[
          "Không làm gì — MLP biết rõ ai rủi ro",
          "Xem lại dữ liệu huấn luyện: có thể thiếu ví dụ sinh viên trả tốt, khiến MLP chưa 'thấy' nhóm này; có thể cần thu thập thêm dữ liệu hoặc áp ngưỡng mềm hơn cho nhóm thin file",
          "Xoá biến 'số tháng làm việc' để tránh phân biệt",
          "Tăng lãi suất gấp đôi cho mọi sinh viên",
        ]}
        correct={1}
        explanation="Khi mô hình ra quyết định thiên lệch với một nhóm, gốc rễ thường ở dữ liệu. Lời giải dài hạn: thu thập thêm dữ liệu cho nhóm thiếu đại diện, hoặc tách thành mô hình con cho nhóm 'thin file'. Xoá biến không giải quyết vì các biến khác (thu nhập, vị trí...) có thể gián tiếp 'mã hoá' lại nhóm đó."
      />
      <InlineChallenge
        question="Một khách bị từ chối và khởi kiện ngân hàng vì 'không biết vì sao'. Ngân hàng cần gì để bảo vệ quyết định này?"
        options={[
          "Không cần gì — MLP là thuật toán, không ai bắt bẻ được",
          "Cần log đầu vào + một báo cáo giải thích kể ra 3 yếu tố lớn nhất dẫn đến từ chối (dùng SHAP hoặc tương đương), kèm chính sách tín dụng áp dụng",
          "Chỉ cần in giấy 'AI đã quyết định'",
          "Đưa khách hàng số điện thoại của nhà cung cấp mô hình",
        ]}
        correct={1}
        explanation="Ở hầu hết các nước, luật bảo vệ người tiêu dùng yêu cầu ngân hàng phải giải thích được quyết định từ chối với các lý do cụ thể, có thể kiểm tra lại được. SHAP/LIME chính là cầu nối giữa 'hộp đen' MLP và nghĩa vụ pháp lý đó."
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Block cuối counterfactual &mdash; Mini summary + link về concept
   ══════════════════════════════════════════════════════════════════ */

function ApplicationLearnMoreBlock() {
  const summaryPoints = useMemo(
    () => [
      "MLP = nhiều perceptron xếp thành nhiều lớp — đủ linh hoạt để bắt quan hệ phi tuyến giữa hàng trăm biến.",
      "Quy trình: nhập hồ sơ → chuẩn hoá → lan truyền qua 2–4 lớp ẩn → sigmoid → xác suất vỡ nợ → áp chính sách.",
      "Lợi thế: duyệt thêm ~27% hồ sơ, lãi suất trung bình thấp hơn 16% so với chỉ dùng FICO (số liệu Upstart 2021).",
      "Rủi ro lớn: hộp đen + định kiến dữ liệu. Cần SHAP/LIME để giải thích, kiểm tra disparate impact, và loại biến nhạy cảm.",
      "MLP không thay thế chuyên viên tín dụng — nó mở rộng phạm vi ngân hàng tiếp cận đúng khách hàng.",
    ],
    []
  );

  return (
    <div className="space-y-5">
      <MiniSummary title="5 điểm chốt về MLP chấm tín dụng" points={summaryPoints} />
      <div className="flex items-center gap-2 text-sm text-muted">
        <ArrowRight size={14} />
        <span>
          Muốn hiểu bên trong MLP hoạt động thế nào &mdash; cách xếp lớp tạo
          ra đường biên phi tuyến? Quay lại bài lý thuyết:{" "}
          <TopicLink slug="mlp">MLP &mdash; Xếp nhiều perceptron thành mạng</TopicLink>
          .
        </span>
      </div>
    </div>
  );
}
