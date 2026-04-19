"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Syringe,
  Users,
  ShieldAlert,
  HeartPulse,
  TrendingUp,
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
import ApplicationTryIt from "@/components/application/ApplicationTryIt";
import {
  SliderGroup,
  StepReveal,
  InlineChallenge,
  Callout,
  MiniSummary,
  TopicLink,
  ToggleCompare,
} from "@/components/interactive";

export const metadata: TopicMeta = {
  slug: "confusion-matrix-in-medical-testing",
  title: "Confusion Matrix in Medical Testing",
  titleVi: "Ma trận nhầm lẫn trong xét nghiệm y tế",
  description:
    "Câu chuyện xét nghiệm COVID-19: chính xác 99% nghe hay, nhưng khi tỷ lệ nhiễm trong cộng đồng thấp, hàng nghìn người vẫn có thể nhận kết quả dương tính giả.",
  category: "classic-ml",
  tags: ["evaluation", "medical", "covid", "application"],
  difficulty: "intermediate",
  relatedSlugs: ["confusion-matrix"],
  vizType: "interactive",
  applicationOf: "confusion-matrix",
  featuredApp: {
    name: "RT-PCR COVID-19",
    productFeature: "Xét nghiệm chẩn đoán",
    company: "WHO / CDC",
    countryOrigin: "US",
  },
  sources: [
    {
      title:
        "Variation in False-Negative Rate of Reverse Transcriptase Polymerase Chain Reaction–Based SARS-CoV-2 Tests by Time Since Exposure",
      publisher: "Annals of Internal Medicine (Kucirka et al.)",
      url: "https://www.acpjournals.org/doi/10.7326/M20-1495",
      date: "2020-08",
      kind: "paper",
    },
    {
      title:
        "False Negative Tests for SARS-CoV-2 Infection — Challenges and Implications",
      publisher: "New England Journal of Medicine",
      url: "https://www.nejm.org/doi/full/10.1056/NEJMp2015897",
      date: "2020-06",
      kind: "paper",
    },
    {
      title:
        "False-positive COVID-19 results: hidden problems and costs",
      publisher: "The Lancet Respiratory Medicine",
      url: "https://www.thelancet.com/journals/lanres/article/PIIS2213-2600(20)30453-7/fulltext",
      date: "2020-09",
      kind: "paper",
    },
    {
      title: "Interpreting a COVID-19 test result",
      publisher: "The BMJ",
      url: "https://www.bmj.com/content/369/bmj.m1808",
      date: "2020-05",
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

/* ────────────────────────────────────────────────────────────
   POPULATION SIMULATOR — visual component rendering 10 000
   people as a grid of 100 × 100 dots, color-coded by result.
   ──────────────────────────────────────────────────────────── */

type Counts = {
  truePos: number;
  falsePos: number;
  falseNeg: number;
  trueNeg: number;
  ppv: number; // P(bệnh | dương tính)
  npv: number;
};

function computeCounts(
  population: number,
  prevalencePercent: number,
  sensitivityPercent: number,
  specificityPercent: number
): Counts {
  const sick = Math.round((prevalencePercent / 100) * population);
  const healthy = population - sick;
  const truePos = Math.round((sensitivityPercent / 100) * sick);
  const falseNeg = sick - truePos;
  const trueNeg = Math.round((specificityPercent / 100) * healthy);
  const falsePos = healthy - trueNeg;
  const positiveCalls = truePos + falsePos;
  const negativeCalls = trueNeg + falseNeg;
  const ppv = positiveCalls > 0 ? truePos / positiveCalls : 0;
  const npv = negativeCalls > 0 ? trueNeg / negativeCalls : 0;
  return { truePos, falsePos, falseNeg, trueNeg, ppv, npv };
}

function PopulationSimulator({
  values,
}: {
  values: Record<string, number>;
}) {
  const prev = values.prevalence;
  const sens = values.sensitivity;
  const spec = values.specificity;

  const counts = useMemo(
    () => computeCounts(10000, prev, sens, spec),
    [prev, sens, spec]
  );

  // For visual grid (100 people sampled evenly)
  const gridTotal = 100;
  const gridSick = Math.round((prev / 100) * gridTotal);
  const gridTP = Math.round((sens / 100) * gridSick);
  const gridFN = gridSick - gridTP;
  const gridHealthy = gridTotal - gridSick;
  const gridTN = Math.round((spec / 100) * gridHealthy);
  const gridFP = gridHealthy - gridTN;

  const dots: Array<{
    type: "TP" | "FP" | "FN" | "TN";
  }> = [];
  for (let i = 0; i < gridTP; i++) dots.push({ type: "TP" });
  for (let i = 0; i < gridFN; i++) dots.push({ type: "FN" });
  for (let i = 0; i < gridFP; i++) dots.push({ type: "FP" });
  for (let i = 0; i < gridTN; i++) dots.push({ type: "TN" });

  const COLORS = {
    TP: "#10b981",
    FP: "#f59e0b",
    FN: "#ef4444",
    TN: "#3b82f6",
  };

  const ppvPercent = (counts.ppv * 100).toFixed(1);

  return (
    <div className="w-full space-y-4">
      {/* Grid visualisation — 100 people = each dot represents 100 in a 10 000 population */}
      <div className="rounded-lg border border-border bg-card/60 p-3">
        <p className="text-[11px] font-semibold text-tertiary uppercase tracking-wide mb-2 text-center">
          100 người đại diện cho cộng đồng 10 000 người
        </p>
        <div className="grid grid-cols-10 gap-1 max-w-[280px] mx-auto">
          {dots.map((dot, i) => (
            <motion.div
              key={i}
              layout
              className="h-5 w-5 rounded-full"
              style={{ backgroundColor: COLORS[dot.type] }}
              transition={{ duration: 0.2 }}
              title={
                dot.type === "TP"
                  ? "Bệnh — xét nghiệm bắt đúng"
                  : dot.type === "FN"
                    ? "Bệnh — xét nghiệm bỏ sót (âm tính giả)"
                    : dot.type === "FP"
                      ? "Khoẻ — xét nghiệm báo nhầm (dương tính giả)"
                      : "Khoẻ — xét nghiệm đúng"
              }
            />
          ))}
        </div>
      </div>

      {/* Tally row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        <TallyBox
          color={COLORS.TP}
          label="Bệnh — bắt được"
          count={counts.truePos}
        />
        <TallyBox
          color={COLORS.FN}
          label="Bệnh — bỏ sót"
          count={counts.falseNeg}
        />
        <TallyBox
          color={COLORS.FP}
          label="Khoẻ — báo nhầm"
          count={counts.falsePos}
        />
        <TallyBox
          color={COLORS.TN}
          label="Khoẻ — đúng"
          count={counts.trueNeg}
        />
      </div>

      {/* Headline metric: PPV */}
      <div className="rounded-lg border-2 p-4 text-center" style={{ borderColor: "#a855f7", backgroundColor: "#a855f722" }}>
        <p className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide mb-1">
          Khi xét nghiệm báo DƯƠNG TÍNH, khả năng bạn thực sự nhiễm bệnh là bao nhiêu?
        </p>
        <motion.div
          key={ppvPercent}
          initial={{ scale: 1.2, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="text-3xl font-bold tabular-nums"
          style={{ color: "#a855f7" }}
        >
          {ppvPercent}%
        </motion.div>
        <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
          Gọi là <strong>PPV (Positive Predictive Value)</strong> — giá trị tiên đoán dương
        </p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   SENSITIVITY TIMELINE — independent SVG rendering
   ──────────────────────────────────────────────────────────── */

const KUCIRKA_DATA: Array<{ day: number; sensitivity: number; note?: string }> = [
  { day: 1, sensitivity: 0, note: "virus chưa nhân bản đủ" },
  { day: 2, sensitivity: 5 },
  { day: 3, sensitivity: 25 },
  { day: 4, sensitivity: 55, note: "bắt đầu có triệu chứng" },
  { day: 5, sensitivity: 70 },
  { day: 6, sensitivity: 75 },
  { day: 7, sensitivity: 78 },
  { day: 8, sensitivity: 80, note: "đỉnh — thời điểm vàng" },
  { day: 9, sensitivity: 78 },
  { day: 10, sensitivity: 74 },
  { day: 12, sensitivity: 65 },
  { day: 14, sensitivity: 55 },
  { day: 17, sensitivity: 42 },
  { day: 21, sensitivity: 34, note: "miễn dịch tiêu diệt virus" },
];

function SensitivityTimeline() {
  const W = 560;
  const H = 220;
  const padL = 40;
  const padR = 20;
  const padT = 20;
  const padB = 40;
  const maxDay = 21;
  const xAt = (d: number) => padL + (d / maxDay) * (W - padL - padR);
  const yAt = (s: number) => padT + (1 - s / 100) * (H - padT - padB);

  const linePath = KUCIRKA_DATA.map((d, i) =>
    `${i === 0 ? "M" : "L"}${xAt(d.day).toFixed(1)},${yAt(d.sensitivity).toFixed(1)}`
  ).join(" ");

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Độ nhạy RT-PCR theo ngày">
        {/* Horizontal grid */}
        {[0, 25, 50, 75, 100].map((s) => (
          <g key={s}>
            <line
              x1={padL}
              y1={yAt(s)}
              x2={W - padR}
              y2={yAt(s)}
              stroke="currentColor"
              className="text-border"
              strokeWidth={0.5}
            />
            <text
              x={padL - 6}
              y={yAt(s) + 3}
              fontSize={9}
              fill="currentColor"
              className="text-muted"
              textAnchor="end"
            >
              {s}%
            </text>
          </g>
        ))}
        {/* X-axis ticks */}
        {[1, 5, 8, 14, 21].map((d) => (
          <g key={d}>
            <line
              x1={xAt(d)}
              y1={H - padB}
              x2={xAt(d)}
              y2={H - padB + 4}
              stroke="currentColor"
              className="text-muted"
              strokeWidth={0.8}
            />
            <text
              x={xAt(d)}
              y={H - padB + 16}
              fontSize={9}
              fill="currentColor"
              className="text-muted"
              textAnchor="middle"
            >
              ngày {d}
            </text>
          </g>
        ))}
        {/* Curve */}
        <path d={linePath} fill="none" stroke="#a855f7" strokeWidth={2.5} />
        {/* Dots + annotations */}
        {KUCIRKA_DATA.map((d) => (
          <g key={d.day}>
            <circle
              cx={xAt(d.day)}
              cy={yAt(d.sensitivity)}
              r={d.note ? 5 : 3}
              fill={d.note ? "#a855f7" : "#c084fc"}
              stroke="white"
              strokeWidth={1}
            />
            {d.note && (
              <text
                x={xAt(d.day)}
                y={yAt(d.sensitivity) - 10}
                fontSize={8}
                fill="#a855f7"
                textAnchor="middle"
                fontWeight={600}
              >
                {d.note}
              </text>
            )}
          </g>
        ))}
        {/* Gold-zone highlight (days 6-10) */}
        <rect
          x={xAt(6)}
          y={padT}
          width={xAt(10) - xAt(6)}
          height={H - padT - padB}
          fill="#fbbf24"
          opacity={0.12}
        />
        <text
          x={(xAt(6) + xAt(10)) / 2}
          y={padT + 14}
          fontSize={10}
          fill="#b45309"
          textAnchor="middle"
          fontWeight={700}
        >
          Thời điểm vàng
        </text>
        {/* Axis label */}
        <text x={W / 2} y={H - 4} fontSize={10} fill="currentColor" className="text-muted" textAnchor="middle">
          Ngày kể từ phơi nhiễm
        </text>
      </svg>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   PREVALENCE BREAKDOWN — used in ToggleCompare
   ──────────────────────────────────────────────────────────── */

function PrevalenceBreakdown({
  population,
  prevalence,
  sens,
  spec,
}: {
  population: number;
  prevalence: number;
  sens: number;
  spec: number;
}) {
  const c = computeCounts(population, prevalence, sens, spec);
  const positiveCalls = c.truePos + c.falsePos;
  return (
    <div className="space-y-3 text-sm text-foreground/85 leading-relaxed">
      <div className="rounded-lg bg-surface/60 border border-border p-3 space-y-1.5">
        <p>
          Trên <strong>{population.toLocaleString("vi-VN")}</strong> người xét nghiệm ở cộng đồng
          prevalence <strong>{prevalence}%</strong>:
        </p>
        <ul className="list-disc pl-5 space-y-0.5 text-xs">
          <li>
            <strong>{c.truePos.toLocaleString("vi-VN")}</strong> ca thật sự nhiễm được bắt đúng (TP)
          </li>
          <li>
            <strong>{c.falseNeg.toLocaleString("vi-VN")}</strong> ca bệnh bị bỏ sót (FN)
          </li>
          <li>
            <strong>{c.falsePos.toLocaleString("vi-VN")}</strong> người khoẻ bị báo nhầm dương tính
            (FP)
          </li>
          <li>
            <strong>{c.trueNeg.toLocaleString("vi-VN")}</strong> người khoẻ được xác nhận đúng (TN)
          </li>
        </ul>
      </div>
      <div className="rounded-xl border-2 p-3 text-center" style={{ borderColor: "#a855f7", backgroundColor: "#a855f722" }}>
        <p className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide mb-1">
          Trong {positiveCalls.toLocaleString("vi-VN")} ca dương tính, tỉ lệ thật sự nhiễm
        </p>
        <p className="text-3xl font-bold tabular-nums" style={{ color: "#a855f7" }}>
          {(c.ppv * 100).toFixed(1)}%
        </p>
        <p className="text-[11px] text-muted mt-1">
          (PPV — giá trị tiên đoán dương)
        </p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   ANALOGY CARD — four industry examples
   ──────────────────────────────────────────────────────────── */

function AnalogyCard({
  emoji,
  title,
  prevalence,
  lesson,
}: {
  emoji: string;
  title: string;
  prevalence: string;
  lesson: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{emoji}</span>
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>
      <div className="text-[11px] font-mono text-accent">
        Prevalence: {prevalence}
      </div>
      <p className="text-xs text-foreground/80 leading-relaxed">{lesson}</p>
    </div>
  );
}

function TallyBox({
  color,
  label,
  count,
}: {
  color: string;
  label: string;
  count: number;
}) {
  return (
    <div
      className="rounded-lg border p-2"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div
        className="text-[10px] font-semibold uppercase"
        style={{ color }}
      >
        {label}
      </div>
      <motion.div
        key={count}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="text-lg font-bold tabular-nums"
        style={{ color }}
      >
        {count.toLocaleString("vi-VN")}
      </motion.div>
    </div>
  );
}

export default function ConfusionMatrixInMedicalTesting() {
  return (
    <ApplicationLayout metadata={metadata} parentTitleVi="Ma trận nhầm lẫn">
      <ApplicationHero
        parentTitleVi="Ma trận nhầm lẫn"
        topicSlug="confusion-matrix-in-medical-testing"
      >
        <p>
          Năm 2020, hàng tỷ người trên thế giới xếp hàng ngoáy mũi để xét nghiệm COVID-19
          bằng RT-PCR (phản ứng chuỗi polymerase phiên mã ngược — phương pháp phát hiện
          vật liệu di truyền của virus). Kết quả trả về chỉ hai chữ: dương tính hoặc âm tính.
          Một nhãn rất &ldquo;sạch&rdquo;, rất dễ hiểu — nhưng lại che giấu một nghịch lý thống kê
          lớn đến mức nó từng khiến các nước tạm dừng xét nghiệm đại trà.
        </p>
        <p>
          Các bộ xét nghiệm thường được quảng cáo là &ldquo;chính xác 99%&rdquo;. Nghe thật
          yên tâm. Nhưng khi tỷ lệ nhiễm trong cộng đồng còn thấp (ví dụ 1%), cứ 100 người
          nhận kết quả dương tính thì có thể tới một nửa <em>không thật sự nhiễm</em>. Hôm
          nay chúng ta sẽ dùng chính bộ công cụ của bài{" "}
          <TopicLink slug="confusion-matrix">Ma trận nhầm lẫn</TopicLink> để hiểu vì sao.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="confusion-matrix-in-medical-testing">
        <p>
          Xét nghiệm RT-PCR không hoàn hảo. Theo Kucirka và cộng sự (Annals of Internal
          Medicine, 2020), độ nhạy (sensitivity — tỷ lệ phát hiện đúng người bệnh) dao
          động cực lớn theo thời điểm lấy mẫu: gần 0% trong ngày đầu sau phơi nhiễm (virus
          chưa nhân bản đủ), đạt đỉnh khoảng 80% vào ngày thứ tám, rồi giảm dần.
        </p>
        <p>
          Vấn đề cốt lõi của bài học này là: hai chỉ số &ldquo;đẹp&rdquo; trên tờ hướng dẫn (độ
          nhạy và độ đặc hiệu) <strong>không đủ</strong> để trả lời câu hỏi mà bệnh nhân
          thật sự quan tâm: &ldquo;Tôi vừa có kết quả dương tính — khả năng tôi thật sự nhiễm bệnh
          là bao nhiêu?&rdquo; Câu trả lời còn phụ thuộc nặng vào tỷ lệ nhiễm của cộng đồng
          bạn đang sống. Hiệu ứng này gọi là <em>nghịch lý xét nghiệm chẩn đoán</em>.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Ma trận nhầm lẫn"
        topicSlug="confusion-matrix-in-medical-testing"
      >
        <Beat step={1}>
          <p>
            <strong>Độ nhạy (sensitivity).</strong> Trong 100 người thật sự nhiễm bệnh,
            xét nghiệm bắt đúng bao nhiêu? Với RT-PCR COVID-19, con số này dao động từ
            70% đến 98% tuỳ thời điểm lấy mẫu. Khi lấy mẫu sớm quá (ngày 1–2) hoặc muộn
            quá (ngày 14+), độ nhạy tụt nhanh — vì vậy bác sĩ thường yêu cầu xét nghiệm
            lại sau 48 giờ nếu còn nghi ngờ.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>Độ đặc hiệu (specificity).</strong> Trong 100 người thật sự khoẻ mạnh,
            xét nghiệm xác nhận đúng bao nhiêu người khoẻ? RT-PCR có độ đặc hiệu rất cao,
            khoảng 99,1% đến 99,8%. Nghĩa là cứ 1 000 người khoẻ đi xét nghiệm, chỉ 2–9
            người nhận kết quả dương tính giả. Nghe rất tốt — nhưng chính con số nhỏ này
            là nguồn gốc của nghịch lý.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>Tỷ lệ nhiễm của cộng đồng (prevalence) là biến bị bỏ quên.</strong> Giả
            sử một thành phố có tỷ lệ nhiễm 1%. Lấy 10 000 người đi xét nghiệm: chỉ 100
            người thật sự nhiễm. Với độ nhạy 80%, bắt được 80 ca dương tính thật. Nhưng
            với 9 900 người khoẻ và độ đặc hiệu 99%, vẫn có 99 người bị báo nhầm. Tổng cộng
            179 người nhận kết quả dương tính — <strong>trong đó 99 người không hề bệnh</strong>.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>PPV (giá trị tiên đoán dương) = TP / (TP + FP).</strong> Đây mới là
            con số bệnh nhân thật sự quan tâm: &ldquo;khi xét nghiệm báo dương, khả năng tôi
            nhiễm là bao nhiêu?&rdquo;. Với cộng đồng tỷ lệ nhiễm 1%, PPV chỉ khoảng 45% —
            dương tính giả gần bằng dương tính thật. Khi tỷ lệ nhiễm lên 20% (sóng dịch
            mạnh), PPV vọt lên 95% — cùng bộ xét nghiệm, cùng độ nhạy và đặc hiệu.
          </p>
        </Beat>
        <Beat step={5}>
          <p>
            <strong>Chiến lược vàng: xét nghiệm có mục tiêu.</strong> WHO và CDC đều
            khuyến cáo không xét nghiệm đại trà khi tỷ lệ nhiễm thấp, mà tập trung vào nhóm
            có triệu chứng hoặc tiếp xúc gần. Lý do đơn giản: tăng prevalence &rArr; tăng
            PPV &rArr; giảm số người lo lắng, cách ly, nghỉ việc vì dương tính giả. Đây là
            một trong những bài học quan trọng nhất của dịch tễ học hiện đại — và nó xuất
            phát trực tiếp từ bốn ô trong ma trận nhầm lẫn.
          </p>
        </Beat>
      </ApplicationMechanism>

      {/* ── THỬ TỰ TAY: SIMULATOR ── */}
      <ApplicationTryIt topicSlug="confusion-matrix-in-medical-testing">
        <p className="mb-4 text-sm leading-relaxed">
          Ba thanh trượt dưới đây kể hết câu chuyện. Kéo <strong>Prevalence</strong> xuống 1%
          để thấy nghịch lý: ngay cả xét nghiệm 99% chính xác cũng sinh ra hàng trăm kết
          quả dương tính giả trong cộng đồng 10 000 người. Kéo lên 20% để thấy bộ xét
          nghiệm cùng chất lượng bỗng trở nên &ldquo;đáng tin&rdquo; hơn hẳn.
        </p>

        <SliderGroup
          title="Mô phỏng 10 000 người đi xét nghiệm"
          sliders={[
            {
              key: "prevalence",
              label: "Tỷ lệ nhiễm trong cộng đồng",
              min: 1,
              max: 30,
              step: 1,
              defaultValue: 5,
              unit: "%",
            },
            {
              key: "sensitivity",
              label: "Độ nhạy (sensitivity) — bắt được ca bệnh thật",
              min: 50,
              max: 99,
              step: 1,
              defaultValue: 80,
              unit: "%",
            },
            {
              key: "specificity",
              label: "Độ đặc hiệu (specificity) — xác nhận đúng người khoẻ",
              min: 90,
              max: 100,
              step: 0.1,
              defaultValue: 99,
              unit: "%",
            },
          ]}
          visualization={(values) => <PopulationSimulator values={values} />}
        />

        <div className="mt-6 space-y-4">
          <h3 className="text-base font-semibold text-foreground">
            Đi từng bước qua nghịch lý: 10 000 người, prevalence = 1%
          </h3>
          <p className="text-sm text-muted leading-relaxed">
            Ấn <em>Tiếp tục</em> để xem mô hình Bayes đơn giản sinh ra con số gây sốc. Bộ xét
            nghiệm chúng ta dùng có độ nhạy 80%, độ đặc hiệu 99%.
          </p>

          <StepReveal
            labels={[
              "Bước 1 — chia dân số",
              "Bước 2 — đếm TP + FN",
              "Bước 3 — đếm FP + TN",
              "Bước 4 — tổng hợp dương tính",
              "Bước 5 — tính PPV",
            ]}
          >
            {[
              <div key="a" className="rounded-lg border border-border bg-surface/60 p-4">
                <div className="flex items-start gap-3">
                  <Users className="text-accent shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="text-sm text-foreground leading-relaxed">
                      Prevalence 1% &rArr; trong 10 000 người có{" "}
                      <strong className="text-rose-500">100 người nhiễm</strong> và{" "}
                      <strong className="text-emerald-600">9 900 người khoẻ</strong>.
                    </p>
                    <div className="mt-2 flex gap-1 flex-wrap">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                        100 bệnh
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                        9 900 khoẻ
                      </span>
                    </div>
                  </div>
                </div>
              </div>,
              <div key="b" className="rounded-lg border border-border bg-surface/60 p-4">
                <div className="flex items-start gap-3">
                  <HeartPulse className="text-rose-500 shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="text-sm text-foreground leading-relaxed">
                      Trong 100 người nhiễm: độ nhạy 80% &rArr; <strong className="text-emerald-600">80 ca
                      dương tính thật (TP)</strong> và <strong className="text-red-500">20 ca âm tính giả (FN)</strong>
                      . 20 người này tin mình khoẻ và có thể tiếp tục lây cho người khác.
                    </p>
                  </div>
                </div>
              </div>,
              <div key="c" className="rounded-lg border border-border bg-surface/60 p-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="text-sm text-foreground leading-relaxed">
                      Trong 9 900 người khoẻ: độ đặc hiệu 99% &rArr;{" "}
                      <strong className="text-blue-600">9 801 âm tính thật (TN)</strong> và{" "}
                      <strong className="text-amber-600">99 dương tính giả (FP)</strong>. Chỉ 1% sai số
                      trên 9 900 người vẫn là gần <em>một trăm con người</em> bị báo sai.
                    </p>
                  </div>
                </div>
              </div>,
              <div key="d" className="rounded-lg border border-border bg-surface/60 p-4">
                <div className="flex items-start gap-3">
                  <TrendingUp className="text-purple-500 shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="text-sm text-foreground leading-relaxed">
                      Tổng số người nhận kết quả dương tính = TP + FP = 80 + 99 ={" "}
                      <strong>179 người</strong>. Đây là những người hôm nay được gọi báo &ldquo;kết quả
                      dương tính — vui lòng cách ly&rdquo;.
                    </p>
                  </div>
                </div>
              </div>,
              <div key="e" className="rounded-lg border-2 border-purple-400 bg-purple-50 dark:bg-purple-900/20 p-4">
                <div className="flex items-start gap-3">
                  <Syringe className="text-purple-500 shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="text-sm text-foreground leading-relaxed">
                      PPV = TP / (TP + FP) = 80 / 179 ={" "}
                      <strong className="text-purple-600 text-lg">44,7%</strong>. Nghĩa là
                      chưa đến một nửa số người nhận kết quả dương tính là thật sự nhiễm. Đây
                      chính là lý do các nước yêu cầu <strong>xét nghiệm lại lần hai</strong> hoặc kết
                      hợp PCR định lượng trước khi kết luận — để lọc bỏ phần lớn dương tính
                      giả trước khi quyết định cách ly hay điều trị.
                    </p>
                  </div>
                </div>
              </div>,
            ]}
          </StepReveal>
        </div>

        <div className="mt-6">
          <InlineChallenge
            question="Một thành phố đạt tỷ lệ nhiễm 15% trong đợt sóng dịch mạnh. Bộ xét nghiệm có độ nhạy 80%, độ đặc hiệu 99%. PPV bây giờ khoảng bao nhiêu?"
            options={[
              "Vẫn 45% như trường hợp 1% — vì bộ xét nghiệm không đổi",
              "Khoảng 93% — vì prevalence cao hơn khiến số bệnh thật nhiều hơn số báo nhầm",
              "100% — mọi ca dương đều đúng",
              "Không thể tính nếu không biết số người đi xét nghiệm",
            ]}
            correct={1}
            explanation="Với 10 000 người × 15% prevalence: có 1 500 bệnh × 80% = 1 200 TP. Có 8 500 khoẻ × 1% = 85 FP. PPV = 1 200 / (1 200 + 85) ≈ 93%. Cùng bộ xét nghiệm, khi dịch bùng phát, con số đột ngột trở nên đáng tin — đó là toán học, không phải phép màu."
          />
        </div>

        <div className="mt-4">
          <InlineChallenge
            question="Bạn có kết quả xét nghiệm nhanh dương tính ở tỉnh đang có prevalence rất thấp (~1%). Bước khôn ngoan nhất là gì?"
            options={[
              "Tự cách ly luôn 14 ngày và không cần gì thêm",
              "Bỏ qua — chắc chắn là dương tính giả",
              "Làm xét nghiệm PCR xác nhận trong 24 giờ; nếu có triệu chứng, cách ly tạm thời trong khi chờ",
              "Đi xét nghiệm lại 10 bộ test khác cùng lúc",
            ]}
            correct={2}
            explanation="PPV ở prevalence thấp có thể dưới 50%, nên một xét nghiệm nhanh dương tính không đủ kết luận. Quy trình y tế chuẩn: tạm cách ly để phòng ngừa, đi PCR xác nhận. Đây là lý do các xét nghiệm sàng lọc diện rộng luôn đi kèm xét nghiệm thứ cấp."
          />
        </div>

        <Callout variant="warning" title="Ba bài học rút ra cho ngoài ngành y">
          Nguyên lý PPV không chỉ áp dụng cho y tế. Mọi hệ thống AI có{" "}
          <strong>tỷ lệ dương tính cao trong dữ liệu gốc thấp</strong> đều dính nghịch lý
          tương tự: cảnh báo gian lận (chỉ ~0,1% giao dịch là gian lận), sàng lọc CV ứng
          viên, phát hiện deepfake. Luôn hỏi prevalence trước khi tin vào &ldquo;accuracy 99%&rdquo;.
        </Callout>

        {/* Kucirka timeline — sensitivity theo ngày kể từ phơi nhiễm */}
        <div className="mt-8">
          <h3 className="text-base font-semibold text-foreground mb-2">
            Độ nhạy thay đổi theo ngày — nghiên cứu Kucirka (Annals of Internal Medicine, 2020)
          </h3>
          <p className="text-sm text-muted leading-relaxed mb-4">
            Cùng một bộ xét nghiệm, cùng một người bệnh — nhưng kết quả phụ thuộc nặng vào{" "}
            <strong>bạn lấy mẫu ngày thứ mấy</strong> kể từ khi phơi nhiễm. Virus cần thời gian để
            nhân bản đến mức máy đọc được. Biểu đồ dưới đây tóm tắt hai mươi mốt ngày đầu — vì sao
            bác sĩ luôn yêu cầu xét nghiệm lại sau 48 giờ nếu nghi ngờ vẫn còn.
          </p>

          <div className="rounded-xl border border-border bg-card p-4">
            <SensitivityTimeline />
          </div>

          <Callout variant="info" title="Vì sao bác sĩ thường yêu cầu làm lại xét nghiệm sau 48 giờ?">
            Nhìn biểu đồ: ngày 1–3 độ nhạy rất thấp (virus chưa đủ). Ngày 7–9 đạt đỉnh (thời điểm vàng).
            Sau ngày 14 độ nhạy tụt nhanh vì virus bắt đầu bị miễn dịch tiêu diệt. Một xét nghiệm âm
            tính ngày 2 và một xét nghiệm âm tính ngày 8 có <em>ý nghĩa khác hẳn</em> — dù cùng dòng
            chữ &ldquo;âm tính&rdquo; trên tờ kết quả.
          </Callout>
        </div>

        {/* Prevalence toggle — dramatic contrast */}
        <div className="mt-8">
          <h3 className="text-base font-semibold text-foreground mb-2">
            Cùng bộ xét nghiệm, hai đợt dịch khác nhau — PPV thay đổi ra sao?
          </h3>
          <p className="text-sm text-muted leading-relaxed mb-4">
            Bộ xét nghiệm giữ nguyên độ nhạy 80%, độ đặc hiệu 99%. Chỉ tỷ lệ nhiễm trong cộng đồng
            thay đổi. Kết quả đảo ngược hoàn toàn cảm giác của bạn về &ldquo;xét nghiệm có đáng
            tin hay không&rdquo;.
          </p>

          <ToggleCompare
            labelA="Prevalence 1% (dịch yếu)"
            labelB="Prevalence 20% (sóng dịch mạnh)"
            description="Cùng bộ test — cùng độ nhạy 80%, độ đặc hiệu 99%. Chỉ thay đổi tỷ lệ nhiễm."
            childA={
              <PrevalenceBreakdown population={10000} prevalence={1} sens={80} spec={99} />
            }
            childB={
              <PrevalenceBreakdown population={10000} prevalence={20} sens={80} spec={99} />
            }
          />

          <Callout variant="tip" title="Bài học cho các đợt sàng lọc diện rộng">
            Trong giai đoạn dịch yếu, xét nghiệm đại trà có thể gây hại nhiều hơn lợi: người lo
            lắng, cơ quan mất nguồn lực điều tra các ca dương tính giả. Khi dịch bùng phát, cùng bộ
            xét nghiệm trở nên rất đáng tin. Đây là lý do WHO thay đổi khuyến cáo nhiều lần trong
            giai đoạn 2020–2022.
          </Callout>
        </div>

        {/* Cross-industry analogy */}
        <div className="mt-8">
          <h3 className="text-base font-semibold text-foreground mb-2">
            Nghịch lý này xuất hiện ở đâu nữa?
          </h3>
          <p className="text-sm text-muted leading-relaxed mb-4">
            Bất kỳ hệ thống nào phát hiện &ldquo;sự kiện hiếm&rdquo; đều gặp đúng câu chuyện PPV
            thấp. Đây là bốn ví dụ hằng ngày bạn có thể đã gặp:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AnalogyCard
              emoji="💳"
              title="Phát hiện gian lận thẻ tín dụng"
              prevalence="0,1% giao dịch"
              lesson="Độ nhạy cao + độ đặc hiệu 99,9% vẫn có thể sinh ra 9 cảnh báo giả cho mỗi gian lận thật. Ngân hàng dùng hệ thống hai tầng: SMS xác nhận, khoá thẻ tạm thời chờ."
            />
            <AnalogyCard
              emoji="📄"
              title="Sàng lọc CV ứng viên bằng AI"
              prevalence="~5% CV phù hợp"
              lesson="Nếu AI có độ đặc hiệu 95%, trong 100 CV sàng ra thì 95 là phù hợp thật chỉ khi prevalence đủ cao. Nhiều hệ thống bỏ sót ứng viên tốt vì dữ liệu gốc quá mất cân bằng."
            />
            <AnalogyCard
              emoji="🎬"
              title="Phát hiện deepfake trên YouTube"
              prevalence="&lt; 0,01% video"
              lesson="Một bộ phân loại 99% accuracy đánh dấu hàng triệu video thật mỗi ngày. YouTube phải dùng xếp tầng nhiều mô hình + xem xét của con người cho ca dương tính."
            />
            <AnalogyCard
              emoji="📧"
              title="Lọc email phishing"
              prevalence="~1% email doanh nghiệp"
              lesson="Mô hình tốt cần độ đặc hiệu cực cao (99,99%+) mới dùng được, vì xoá nhầm email thật của khách hàng tốn hơn nhiều so với bỏ sót một email phishing — sẽ có lớp phòng thủ khác bắt nó."
            />
          </div>
        </div>

        <div className="mt-6">
          <InlineChallenge
            question="Một công ty tuyên bố mô hình AI phát hiện gian lận của họ đạt 'accuracy 99,5%'. Bạn nên hỏi gì đầu tiên trước khi tin tưởng?"
            options={[
              "Mô hình dùng ngôn ngữ lập trình gì?",
              "Tỷ lệ gian lận thật trong dữ liệu gốc là bao nhiêu, và PPV là bao nhiêu?",
              "Đội phát triển có bao nhiêu PhD?",
              "Chi phí API mỗi lần gọi?",
            ]}
            correct={1}
            explanation="Accuracy vô nghĩa nếu không biết prevalence. Với gian lận chỉ 0,1%, accuracy 99,5% nghĩa là mô hình có thể luôn đoán 'không gian lận' và đạt 99,9%. Câu hỏi đúng: PPV (khi báo gian lận, xác suất đúng là bao nhiêu) và Recall (bắt được bao nhiêu % gian lận thật). Đây là hai con số mà báo cáo marketing thường giấu."
          />
        </div>
      </ApplicationTryIt>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="confusion-matrix-in-medical-testing"
      >
        <Metric
          value="Sensitivity RT-PCR dao động 70–98% tuỳ thời điểm lấy mẫu"
          sourceRef={1}
        />
        <Metric
          value="Tỷ lệ âm tính giả: 100% ngày 1 → 20% ngày 8 → 66% ngày 21"
          sourceRef={1}
        />
        <Metric
          value="Specificity rất cao: dương tính giả chỉ 0,2–0,9%"
          sourceRef={3}
        />
        <Metric
          value="PPV phụ thuộc prevalence cộng đồng — WHO khuyến cáo xét nghiệm có mục tiêu"
          sourceRef={4}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Ma trận nhầm lẫn"
        topicSlug="confusion-matrix-in-medical-testing"
      >
        <p>
          Không hiểu ma trận nhầm lẫn, công chúng sẽ đọc kết quả xét nghiệm theo kiểu đen
          trắng: dương tính = bệnh, âm tính = khoẻ. Hàng triệu người nhận âm tính giả tiếp
          tục sinh hoạt bình thường, lây virus cho gia đình. Hàng trăm nghìn người nhận
          dương tính giả lo lắng, nghỉ việc, cách ly vô ích, tốn kém cả hệ thống y tế.
        </p>
        <p>
          Ma trận nhầm lẫn buộc ta đặt đúng câu hỏi: &ldquo;xét nghiệm này sai ở đâu và sai bao
          nhiêu?&rdquo; Nhờ phân tích bốn ô và con số PPV, các cơ quan y tế đưa ra hướng dẫn
          cụ thể — xét nghiệm lại sau 48 giờ nếu nghi ngờ, ưu tiên lấy mẫu vào ngày có
          triệu chứng, và không dựa vào một kết quả duy nhất để ra quyết định quan trọng.
          Một bảng 2 × 2 đơn giản đã cứu rất nhiều sinh mạng.
        </p>
      </ApplicationCounterfactual>

      {/* Bottom summary */}
      <section className="mb-10">
        <MiniSummary
          title="4 điều cần nhớ khi đọc kết quả xét nghiệm bất kỳ"
          points={[
            "Chính xác (accuracy) không phải là đáng tin. Luôn hỏi thêm độ nhạy, độ đặc hiệu và prevalence cộng đồng.",
            "PPV (xác suất thật sự bệnh khi dương tính) phụ thuộc mạnh vào tỷ lệ nhiễm — cùng bộ xét nghiệm, PPV có thể 45% hay 95% tuỳ tình huống.",
            "Khi prevalence thấp, xét nghiệm đại trà sinh ra rất nhiều dương tính giả. Xét nghiệm có mục tiêu hiệu quả hơn về tổng thể.",
            "Âm tính giả trong sóng dịch là nguy hiểm nhất — người bệnh yên tâm ra ngoài lây lan. Luôn kết hợp với triệu chứng và bối cảnh.",
          ]}
        />
      </section>
    </ApplicationLayout>
  );
}
