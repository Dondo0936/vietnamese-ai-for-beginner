"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 *  OVERFITTING & UNDERFITTING IN COMPAS — Ứng dụng thực tế
 *  ─────────────────────────────────────────────────────────────────────────
 *  Rewrite for the student path. Visualisation-first, no code, no LaTeX.
 *  Core story: a 137-feature model overfit historical bias and performed
 *  WORSE than a 2-variable model on the very task it was designed for.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  Users,
  TrendingDown,
} from "lucide-react";

import {
  ToggleCompare,
  InlineChallenge,
  Callout,
  StepReveal,
  CollapsibleDetail,
} from "@/components/interactive";

import ApplicationLayout from "@/components/application/ApplicationLayout";
import ApplicationHero from "@/components/application/ApplicationHero";
import ApplicationProblem from "@/components/application/ApplicationProblem";
import ApplicationMechanism from "@/components/application/ApplicationMechanism";
import Beat from "@/components/application/Beat";
import ApplicationMetrics from "@/components/application/ApplicationMetrics";
import Metric from "@/components/application/Metric";
import ApplicationCounterfactual from "@/components/application/ApplicationCounterfactual";

import type { TopicMeta } from "@/lib/types";

/* ═══════════════════════════════════════════════════════════════════════════
 *  METADATA
 * ═══════════════════════════════════════════════════════════════════════════ */
export const metadata: TopicMeta = {
  slug: "overfitting-underfitting-in-compas",
  title: "Overfitting & Underfitting in COMPAS",
  titleVi: "Overfit trong COMPAS — 137 đặc trưng thua 2 biến",
  description:
    "COMPAS dùng 137 đặc trưng để chấm điểm rủi ro tái phạm nhưng chỉ đạt 65% chính xác — mô hình 2 biến đạt 67%, bóc trần hiện tượng overfit lên thiên kiến lịch sử",
  category: "classic-ml",
  tags: ["fairness", "criminal-justice", "bias", "application"],
  difficulty: "intermediate",
  relatedSlugs: ["overfitting-underfitting"],
  vizType: "interactive",
  applicationOf: "overfitting-underfitting",
  featuredApp: {
    name: "COMPAS",
    productFeature: "Recidivism Risk Assessment",
    company: "Equivant (Northpointe)",
    countryOrigin: "US",
  },
  sources: [
    {
      title:
        "Machine Bias: There's software used across the country to predict future criminals. And it's biased against blacks.",
      publisher: "ProPublica",
      url: "https://www.propublica.org/article/machine-bias-risk-assessments-in-criminal-sentencing",
      date: "2016-05",
      kind: "news",
    },
    {
      title: "The accuracy, fairness, and limits of predicting recidivism",
      publisher: "Science Advances (Dressel & Farid)",
      url: "https://www.science.org/doi/10.1126/sciadv.aao5580",
      date: "2018-01",
      kind: "paper",
    },
    {
      title: "How We Analyzed the COMPAS Recidivism Algorithm",
      publisher: "ProPublica — Methodology",
      url: "https://www.propublica.org/article/how-we-analyzed-the-compas-recidivism-algorithm",
      date: "2016-05",
      kind: "documentation",
    },
  ],
  tocSections: [
    { id: "hero", labelVi: "Công ty nào?" },
    { id: "problem", labelVi: "Vấn đề" },
    { id: "mechanism", labelVi: "Cách giải quyết" },
    { id: "metrics", labelVi: "Con số thật" },
    { id: "counterfactual", labelVi: "Nếu không có" },
  ],
};

/* ═══════════════════════════════════════════════════════════════════════════
 *  TOY DATASET — 24 bị cáo giả định với 2 features (tuổi, số tiền án) và
 *  một nhãn "race" (A/B) để minh hoạ overfit thiên kiến.
 * ═══════════════════════════════════════════════════════════════════════════ */

interface Defendant {
  id: number;
  age: number;
  priors: number;
  race: "A" | "B";
  recidivated: 0 | 1; // thực tế có tái phạm hay không
}

const DEFENDANTS: Defendant[] = [
  // Nhóm A — dữ liệu lịch sử có thiên kiến nhẹ
  { id: 1, age: 22, priors: 3, race: "A", recidivated: 1 },
  { id: 2, age: 35, priors: 1, race: "A", recidivated: 0 },
  { id: 3, age: 28, priors: 0, race: "A", recidivated: 0 },
  { id: 4, age: 41, priors: 2, race: "A", recidivated: 0 },
  { id: 5, age: 19, priors: 4, race: "A", recidivated: 1 },
  { id: 6, age: 50, priors: 0, race: "A", recidivated: 0 },
  { id: 7, age: 30, priors: 2, race: "A", recidivated: 0 },
  { id: 8, age: 24, priors: 3, race: "A", recidivated: 1 },
  { id: 9, age: 38, priors: 1, race: "A", recidivated: 0 },
  { id: 10, age: 45, priors: 0, race: "A", recidivated: 0 },
  { id: 11, age: 26, priors: 2, race: "A", recidivated: 0 },
  { id: 12, age: 33, priors: 1, race: "A", recidivated: 0 },
  // Nhóm B — cùng hồ sơ tội phạm nhưng bị ghi nhận "tái phạm" nhiều hơn
  // trong dữ liệu lịch sử (do tuần tra dày hơn, không phải do hành vi).
  { id: 13, age: 20, priors: 3, race: "B", recidivated: 1 },
  { id: 14, age: 36, priors: 1, race: "B", recidivated: 1 },
  { id: 15, age: 27, priors: 0, race: "B", recidivated: 1 },
  { id: 16, age: 42, priors: 2, race: "B", recidivated: 1 },
  { id: 17, age: 18, priors: 4, race: "B", recidivated: 1 },
  { id: 18, age: 49, priors: 0, race: "B", recidivated: 0 },
  { id: 19, age: 31, priors: 2, race: "B", recidivated: 1 },
  { id: 20, age: 23, priors: 3, race: "B", recidivated: 1 },
  { id: 21, age: 37, priors: 1, race: "B", recidivated: 1 },
  { id: 22, age: 44, priors: 0, race: "B", recidivated: 0 },
  { id: 23, age: 25, priors: 2, race: "B", recidivated: 1 },
  { id: 24, age: 34, priors: 1, race: "B", recidivated: 1 },
];

/* ═══════════════════════════════════════════════════════════════════════════
 *  TOY MODELS
 *  - Simple: quyết định chỉ từ tuổi + số tiền án (không dùng race)
 *  - Complex/Overfit: dùng thêm "race" → học luôn thiên kiến
 * ═══════════════════════════════════════════════════════════════════════════ */

function simpleRiskScore(d: Defendant): number {
  // Công bằng, chỉ dựa vào tuổi và tiền án.
  const ageFactor = Math.max(0, 1 - (d.age - 18) / 40);
  const priorsFactor = Math.min(1, d.priors / 4);
  return 0.55 * priorsFactor + 0.45 * ageFactor;
}

function overfitRiskScore(d: Defendant): number {
  // "Overfit" — dùng thêm race làm proxy, khuếch đại thiên kiến lịch sử.
  const base = simpleRiskScore(d);
  const bias = d.race === "B" ? 0.25 : -0.05;
  return Math.max(0, Math.min(1, base + bias));
}

function predictHighRisk(score: number) {
  return score >= 0.5 ? 1 : 0;
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  METRICS — tỉ lệ dương tính giả (FP) theo nhóm
 * ═══════════════════════════════════════════════════════════════════════════ */

interface FairnessStats {
  accuracy: number;
  fpRateA: number;
  fpRateB: number;
}

function computeStats(
  scoreFn: (d: Defendant) => number,
): FairnessStats {
  let correct = 0;
  let fpA = 0;
  let negA = 0;
  let fpB = 0;
  let negB = 0;
  for (const d of DEFENDANTS) {
    const pred = predictHighRisk(scoreFn(d));
    if (pred === d.recidivated) correct += 1;
    if (d.recidivated === 0) {
      if (d.race === "A") {
        negA += 1;
        if (pred === 1) fpA += 1;
      } else {
        negB += 1;
        if (pred === 1) fpB += 1;
      }
    }
  }
  return {
    accuracy: correct / DEFENDANTS.length,
    fpRateA: negA === 0 ? 0 : fpA / negA,
    fpRateB: negB === 0 ? 0 : fpB / negB,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════ */

export default function OverfittingUnderfittingInCompas() {
  return (
    <ApplicationLayout metadata={metadata} parentTitleVi="Overfit vs Underfit">
      <ApplicationHero
        parentTitleVi="Overfit vs Underfit"
        topicSlug="overfitting-underfitting-in-compas"
      >
        <p>
          Tại Mỹ, hơn 1 triệu người đã từng được công cụ COMPAS (Correctional
          Offender Management Profiling for Alternative Sanctions &mdash; hệ
          thống chấm điểm rủi ro tái phạm) đánh giá. Phần mềm này thu thập 137
          đặc trưng rồi trả về một con số: rủi ro cao hay thấp. Thẩm phán dùng
          con số này để quyết định tạm giam hay tại ngoại.
        </p>
        <p>
          Năm 2016, ProPublica phát hiện: COMPAS đánh giá sai một cách có hệ
          thống &mdash; người da đen bị gán nhãn &ldquo;rủi ro cao&rdquo; nhầm
          gần gấp đôi so với người da trắng. Hai năm sau, Dressel &amp; Farid
          (Dartmouth) chứng minh: <strong>mô hình chỉ dùng 2 biến</strong> (tuổi
          + số tiền án) đạt chính xác <strong>67%</strong>, cao hơn cả COMPAS
          137 biến (<strong>65%</strong>). Đây là ví dụ giáo khoa về overfit
          trong thế giới thật.
        </p>

        {/* HOOK: So sánh trực quan số biến vs độ chính xác */}
        <div className="not-prose mt-5 rounded-2xl border border-border bg-card p-5">
          <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingDown size={16} className="text-red-500" />
            Cái bẫy: thêm đặc trưng &ne; thêm chính xác
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniModelCard
              label="Mô hình 2 biến"
              sub="Chỉ tuổi + số tiền án"
              accuracy="67%"
              tone="good"
            />
            <MiniModelCard
              label="COMPAS — 137 biến"
              sub="Tuổi, tiền án, bảng hỏi tâm lý, mối quan hệ..."
              accuracy="65%"
              tone="bad"
            />
          </div>
          <p className="text-xs text-muted mt-3 leading-relaxed italic">
            135 đặc trưng bổ sung KHÔNG giúp — chúng khiến mô hình học thuộc
            lòng thiên kiến trong dữ liệu lịch sử.
          </p>
        </div>
      </ApplicationHero>

      <ApplicationProblem topicSlug="overfitting-underfitting-in-compas">
        <p>
          Dữ liệu tư pháp Mỹ vốn chứa thiên kiến lịch sử: cảnh sát tuần tra dày
          hơn ở khu vực người thiểu số, nên các nhóm này bị ghi nhận &ldquo;tái
          phạm&rdquo; với tỷ lệ cao hơn <em>trên giấy tờ</em>, dù hành vi thực
          không nhất thiết khác. Khi mô hình &ldquo;học&rdquo; dữ liệu này với
          137 đặc trưng, nó không học &ldquo;ai thực sự có nguy cơ tái
          phạm&rdquo; &mdash; nó học <strong>các khuôn mẫu nhân khẩu học</strong>
          tương quan với lịch sử giam giữ.
        </p>
        <p>
          Đây chính là overfit trong hình hài nguy hiểm nhất: mô hình có{" "}
          <em>train loss</em> thấp trên dữ liệu cũ, nhưng khi triển khai cho hai
          người có cùng hồ sơ tội phạm (cùng tuổi, cùng số tiền án) nhưng khác
          chủng tộc, nó cho ra hai điểm rủi ro hoàn toàn khác nhau. Hậu quả:
          công lý không đồng đều giữa các công dân.
        </p>

        {/* Visual: nhóm tuần tra & dữ liệu ghi nhận */}
        <div className="not-prose mt-5">
          <TiltedDataDiagram />
        </div>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Overfit vs Underfit"
        topicSlug="overfitting-underfitting-in-compas"
      >
        <Beat step={1}>
          <p>
            <strong>COMPAS thu thập 137 đặc trưng.</strong> Hệ thống hỏi bị cáo
            hàng chục câu về hoàn cảnh sống, lịch sử gia đình, bạn bè, công
            việc, kết hợp với hồ sơ tư pháp. Với hàng chục thông tin này, mô
            hình có quá nhiều &ldquo;tự do&rdquo; để khớp từng đặc điểm nhỏ
            nhất trong dữ liệu huấn luyện &mdash; y hệt mô hình đa thức bậc 20
            bạn vừa gặp ở bài lý thuyết.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>Overfit lên thiên kiến lịch sử.</strong> ProPublica phân
            tích 7.000 hồ sơ tại hạt Broward, Florida: tỷ lệ dương tính giả
            (false positive &mdash; gán &ldquo;rủi ro cao&rdquo; cho người
            không tái phạm) ở người da đen là <strong>44,9%</strong>, gần gấp
            đôi so với <strong>23,5%</strong> ở người da trắng. Mô hình đang
            &ldquo;nhớ&rdquo; các mối tương quan xã hội thay vì học nguy cơ
            tái phạm thực sự.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>Dressel &amp; Farid (2018): 2 biến đạt 67%.</strong> Họ
            thay thế 137 đặc trưng bằng <em>hai</em> biến duy nhất: tuổi và số
            tiền án. Mô hình đơn giản hơn &mdash; nhưng chính xác cao hơn
            COMPAS. Đây là bằng chứng giáo khoa: thêm đặc trưng không luôn
            giúp, và nhiều khi chúng phá hoại vì mô hình bắt đầu học nhiễu.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>Con người cũng chỉ đạt 63–67%.</strong> Cùng nghiên cứu,
            400 tình nguyện viên không chuyên dự đoán tái phạm dựa trên mô tả
            ngắn &mdash; cũng đạt 63–67%. Điều này lộ ra giới hạn nội tại của
            bài toán: dự đoán tái phạm cá nhân có trần tự nhiên ~67%. Mọi đặc
            trưng thêm vào không phá được trần đó &mdash; chỉ làm mô hình phức
            tạp hơn và overfit nhiều hơn.
          </p>
        </Beat>

        {/* DEEPEN — ToggleCompare */}
        <div className="not-prose mt-6">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <ShieldAlert size={16} className="text-accent" />
            Mô hình overfit vs mô hình cân bằng — hiệu ứng công bằng
          </h3>
          <FairnessCompare />
        </div>

        {/* DEEPEN — StepReveal through the "why" */}
        <div className="not-prose mt-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Vì sao mô hình 137 biến lại thua mô hình 2 biến?
          </h3>
          <StepReveal
            labels={[
              "1 — Nhiều biến, nhiều tự do",
              "2 — Học nhiễu thay vì quy luật",
              "3 — Khi mang ra thực tế",
              "4 — Hậu quả cho công dân",
            ]}
          >
            {[
              <div
                key="why1"
                className="rounded-lg border border-border bg-surface/60 p-4"
              >
                <p className="text-sm text-foreground/85 leading-relaxed">
                  Thêm đặc trưng = thêm &ldquo;nút vặn&rdquo; cho mô hình. Với
                  137 nút, mô hình có thể vặn vừa đúng từng đặc điểm nhỏ trong
                  dữ liệu lịch sử — kể cả những đặc điểm ngẫu nhiên không liên
                  quan đến tái phạm (ví dụ: mã vùng nhà ở, câu trả lời bảng
                  hỏi tâm lý bất thường).
                </p>
              </div>,
              <div
                key="why2"
                className="rounded-lg border border-border bg-surface/60 p-4"
              >
                <p className="text-sm text-foreground/85 leading-relaxed">
                  Với dữ liệu đào tạo (lịch sử tư pháp Mỹ), các đặc điểm này
                  <em> tình cờ </em>
                  tương quan với nhãn &ldquo;tái phạm&rdquo; do lịch sử tuần
                  tra và giam giữ không đồng đều. Mô hình &ldquo;học
                  thuộc&rdquo; các tương quan giả này &mdash; giống học sinh
                  thuộc đáp án đề cũ mà không hiểu quy luật.
                </p>
              </div>,
              <div
                key="why3"
                className="rounded-lg border border-border bg-surface/60 p-4"
              >
                <p className="text-sm text-foreground/85 leading-relaxed">
                  Khi một bị cáo mới bước vào toà, mô hình áp dụng các tương
                  quan đã học. Hai người có cùng tuổi, cùng số tiền án nhưng
                  khác khu phố, khác trả lời bảng hỏi &mdash; nhận hai điểm
                  rủi ro khác nhau. Phần khác biệt đó <em>không phải</em> rủi
                  ro thực, mà là tiếng vọng của thiên kiến trong dữ liệu huấn
                  luyện.
                </p>
              </div>,
              <div
                key="why4"
                className="rounded-lg border border-border bg-surface/60 p-4"
              >
                <p className="text-sm text-foreground/85 leading-relaxed">
                  Tỷ lệ dương tính giả (gán &ldquo;rủi ro cao&rdquo; nhầm) ở
                  người da đen gấp đôi người da trắng &rArr; nhiều người vô
                  tội bị từ chối tại ngoại. Mô hình 2 biến sạch sẽ hơn: bỏ qua
                  nhân khẩu học, chỉ dựa trên hai thứ có căn cứ rõ ràng.
                </p>
              </div>,
            ]}
          </StepReveal>
        </div>

        {/* DEEPEN — Features vs accuracy curve (slider driven) */}
        <div className="not-prose mt-6">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingDown size={16} className="text-accent" />
            Số đặc trưng vs độ chính xác — đường cong chữ ∩
          </h3>
          <FeatureCountCurve />
        </div>

        {/* CHALLENGE */}
        <div className="not-prose mt-6">
          <InlineChallenge
            question="Một nhà phát triển AI nói: 'Tôi sẽ thêm 50 feature nữa vào mô hình dự đoán tín dụng để tăng độ chính xác.' Căn cứ bài học COMPAS, nhận định nào là ĐÚNG nhất?"
            options={[
              "Đúng — càng nhiều feature càng chính xác",
              "Sai — thêm feature có thể làm mô hình overfit lên thiên kiến trong dữ liệu lịch sử; phải so sánh với baseline đơn giản trước",
              "Đúng, miễn là feature có giá trị p < 0.05",
              "Không liên quan — COMPAS là ngành khác",
            ]}
            correct={1}
            explanation="Bài học COMPAS: mô hình 2 biến thắng mô hình 137 biến. Luôn bắt đầu bằng baseline đơn giản, chỉ thêm feature khi chúng THỰC SỰ cải thiện test accuracy (không phải train). Và quan trọng hơn: kiểm tra fairness metrics (tỷ lệ dương tính giả theo nhóm), không chỉ accuracy tổng."
          />
        </div>

        <div className="not-prose mt-6">
          <InlineChallenge
            question="Bạn là kỹ sư ML được giao dự đoán rủi ro tín dụng tại một ngân hàng Việt Nam. Ngân hàng có dữ liệu lịch sử 10 năm, nhưng bạn biết: trong quá khứ, một số chi nhánh từ chối đơn của người ngoại tỉnh nhiều hơn (thiên kiến địa phương). Bạn nên làm gì?"
            options={[
              "Dùng tất cả dữ liệu 10 năm vì nhiều dữ liệu luôn tốt hơn",
              "Loại bỏ biến 'quê quán' khỏi mô hình và kiểm tra fairness metrics theo từng vùng — tránh lặp lại bài học COMPAS",
              "Không quan trọng vì mô hình sẽ tự học quy luật đúng",
              "Dùng mô hình cực phức tạp để mô hình tự phân biệt đúng-sai",
            ]}
            correct={1}
            explanation="Đúng cách làm ở Việt Nam: (1) ý thức được dữ liệu lịch sử có thiên kiến địa phương, (2) loại hoặc ít nhất giám sát các biến proxy (quê quán, mã bưu điện, tên), (3) đo fairness metrics (accuracy, false positive rate, false negative rate) theo từng phân khúc người dùng. Mô hình phức tạp hơn không 'tự sửa' được thiên kiến — nó chỉ giỏi hơn trong việc nhớ lại."
          />
        </div>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="overfitting-underfitting-in-compas"
      >
        <Metric
          value="COMPAS (137 đặc trưng): chính xác 65% — mô hình 2 biến: 67%"
          sourceRef={2}
        />
        <Metric
          value="Tỷ lệ dương tính giả ở người da đen 44,9% so với 23,5% ở người da trắng"
          sourceRef={1}
        />
        <Metric
          value="Hơn 1 triệu bị cáo tại Mỹ đã được COMPAS đánh giá"
          sourceRef={3}
        />
        <Metric
          value="Tình nguyện viên không chuyên đạt 63–67% — ngang COMPAS"
          sourceRef={2}
        />
      </ApplicationMetrics>

      <ApplicationCounterfactual
        parentTitleVi="Overfit vs Underfit"
        topicSlug="overfitting-underfitting-in-compas"
      >
        <p>
          Nếu không hiểu overfit, ta dễ tin &ldquo;mô hình càng nhiều biến càng
          chính xác&rdquo;. COMPAS minh hoạ điều ngược lại: 137 đặc trưng không
          cải thiện dự đoán mà còn <em>giấu</em> thiên kiến trong lớp vỏ phức
          tạp, khiến việc kiểm tra và phản biện trở nên cực kỳ khó khăn.
        </p>
        <p>
          Hiểu overfit giúp đặt câu hỏi đúng: <strong>trước khi thêm đặc
          trưng</strong>, hãy hỏi &ldquo;Mô hình đơn giản nhất đạt bao nhiêu phần
          trăm?&rdquo; Nếu mô hình 2 biến đã đạt 67% và mô hình 137 biến chỉ
          đạt 65%, vấn đề không phải thiếu dữ liệu &mdash; mà là bài toán có
          giới hạn nội tại, và thêm phức tạp chỉ thêm rủi ro thiên kiến.
        </p>

        {/* CONNECT — collapsible theory reminder */}
        <div className="not-prose mt-5">
          <CollapsibleDetail title="Nối lại với bài lý thuyết">
            <p className="text-sm leading-relaxed">
              Trong bài &ldquo;Overfit vs Underfit&rdquo;, bạn đã thấy đa thức
              bậc 20 khớp 12 điểm train hoàn hảo nhưng sai bét trên test. COMPAS
              là ví dụ cùng bản chất, nhưng hậu quả không phải điểm test tệ
              &mdash; mà là <strong>công lý không đồng đều</strong> cho hàng
              triệu công dân.
            </p>
            <p className="text-sm leading-relaxed mt-2">
              Bài học chung cho mọi dự án ML: <em>luôn có mô hình baseline đơn
              giản</em>, <em>đo khoảng cách train-test</em>,{" "}
              <em>kiểm tra fairness</em> theo các nhóm bảo vệ &mdash; không
              chỉ accuracy tổng.
            </p>
          </CollapsibleDetail>
        </div>

        <Callout variant="insight" title="Ba câu hỏi nên hỏi trước khi thêm feature">
          <ol className="list-decimal list-inside space-y-1 text-sm mt-1">
            <li>
              Baseline đơn giản đạt bao nhiêu? Feature mới cải thiện bao nhiêu
              phần trăm trên <em>test</em> (không phải train)?
            </li>
            <li>
              Feature có phải proxy cho đặc điểm nhạy cảm (chủng tộc, giới
              tính, thu nhập)?
            </li>
            <li>
              Tỷ lệ dương tính giả / âm tính giả có đồng đều giữa các nhóm dân
              số không?
            </li>
          </ol>
        </Callout>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  LOCAL HELPERS — visual mini-components
 * ═══════════════════════════════════════════════════════════════════════════ */

interface MiniModelCardProps {
  label: string;
  sub: string;
  accuracy: string;
  tone: "good" | "bad";
}

function MiniModelCard({ label, sub, accuracy, tone }: MiniModelCardProps) {
  const color = tone === "good" ? "#22c55e" : "#ef4444";
  return (
    <div
      className="rounded-xl border-2 p-4 flex items-center gap-4"
      style={{ borderColor: `${color}60`, backgroundColor: `${color}10` }}
    >
      <div
        className="shrink-0 flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
        style={{ backgroundColor: color }}
      >
        {accuracy}
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted leading-snug">{sub}</p>
      </div>
    </div>
  );
}

function TiltedDataDiagram() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Users size={16} className="text-accent" />
        Vì sao dữ liệu lịch sử đã &ldquo;nghiêng&rdquo; ngay từ đầu
      </p>
      <svg viewBox="0 0 520 180" className="w-full max-w-2xl mx-auto" role="img" aria-label="Sơ đồ dữ liệu thiên kiến">
        {/* Group A */}
        <g>
          <rect x={20} y={30} width={220} height={120} rx={12} fill="#3b82f6" opacity={0.08} stroke="#3b82f6" strokeOpacity={0.35} />
          <text x={130} y={50} fontSize={12} fill="#3b82f6" fontWeight={700} textAnchor="middle">
            Khu phố A — tuần tra thưa
          </text>
          <text x={130} y={68} fontSize={10} fill="currentColor" className="text-muted" textAnchor="middle">
            Cùng số tội → ít bị ghi nhận hơn
          </text>
          {/* tiny people icons */}
          {Array.from({ length: 6 }, (_, i) => (
            <g key={`a-${i}`}>
              <circle cx={45 + (i % 3) * 60} cy={95 + Math.floor(i / 3) * 30} r={6} fill="#3b82f6" opacity={0.8} />
              {i < 2 && (
                <text
                  x={45 + (i % 3) * 60}
                  y={99 + Math.floor(i / 3) * 30}
                  fontSize={7}
                  fill="#fff"
                  textAnchor="middle"
                  fontWeight={700}
                >
                  !
                </text>
              )}
            </g>
          ))}
          <text x={130} y={170} fontSize={9} fill="currentColor" className="text-muted" textAnchor="middle">
            2/6 bị ghi nhận tái phạm
          </text>
        </g>

        {/* Group B */}
        <g>
          <rect x={280} y={30} width={220} height={120} rx={12} fill="#f97316" opacity={0.08} stroke="#f97316" strokeOpacity={0.35} />
          <text x={390} y={50} fontSize={12} fill="#f97316" fontWeight={700} textAnchor="middle">
            Khu phố B — tuần tra dày
          </text>
          <text x={390} y={68} fontSize={10} fill="currentColor" className="text-muted" textAnchor="middle">
            Cùng số tội → bị ghi nhận nhiều hơn
          </text>
          {Array.from({ length: 6 }, (_, i) => (
            <g key={`b-${i}`}>
              <circle cx={305 + (i % 3) * 60} cy={95 + Math.floor(i / 3) * 30} r={6} fill="#f97316" opacity={0.85} />
              {i < 4 && (
                <text
                  x={305 + (i % 3) * 60}
                  y={99 + Math.floor(i / 3) * 30}
                  fontSize={7}
                  fill="#fff"
                  textAnchor="middle"
                  fontWeight={700}
                >
                  !
                </text>
              )}
            </g>
          ))}
          <text x={390} y={170} fontSize={9} fill="currentColor" className="text-muted" textAnchor="middle">
            4/6 bị ghi nhận tái phạm
          </text>
        </g>
      </svg>
      <p className="text-xs text-muted leading-relaxed">
        Nếu hành vi thực tế hai nhóm như nhau, nhưng dữ liệu đã nghiêng &mdash;
        mô hình sẽ &ldquo;học&rdquo; sự nghiêng đó thành quy luật. Mô hình càng
        phức tạp, càng ghi nhớ chính xác độ nghiêng &mdash; và càng xuất ra
        điểm rủi ro cao cho nhóm B một cách hệ thống.
      </p>
    </div>
  );
}

function FairnessCompare() {
  const [model, setModel] = useState<"simple" | "overfit">("simple");
  const scoreFn = model === "simple" ? simpleRiskScore : overfitRiskScore;
  const stats = useMemo(() => computeStats(scoreFn), [scoreFn]);

  return (
    <ToggleCompare
      labelA="Mô hình 2 biến (công bằng)"
      labelB="Mô hình 137 biến (overfit)"
      description="Cùng 24 bị cáo giả định — đổi mô hình để thấy hậu quả công bằng."
      childA={
        <FairnessPanel
          onSelect={() => setModel("simple")}
          stats={model === "simple" ? stats : computeStats(simpleRiskScore)}
          title="Mô hình 2 biến"
          tone="good"
          caption="Chỉ dùng tuổi + số tiền án. Tỷ lệ dương tính giả (FP) gần nhau giữa hai nhóm."
        />
      }
      childB={
        <FairnessPanel
          onSelect={() => setModel("overfit")}
          stats={model === "overfit" ? stats : computeStats(overfitRiskScore)}
          title="Mô hình 137 biến overfit"
          tone="bad"
          caption="Thêm biến proxy cho nhân khẩu học → tỷ lệ FP nhóm B tăng vọt."
        />
      }
    />
  );
}

interface FairnessPanelProps {
  onSelect: () => void;
  stats: FairnessStats;
  title: string;
  tone: "good" | "bad";
  caption: string;
}

function FairnessPanel({ stats, title, tone, caption }: FairnessPanelProps) {
  const color = tone === "good" ? "#22c55e" : "#ef4444";
  return (
    <div className="space-y-3 p-1">
      <div className="flex items-center justify-between gap-3">
        <h5 className="text-sm font-bold" style={{ color }}>
          {title}
        </h5>
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
          style={{ backgroundColor: color }}
        >
          Acc {(stats.accuracy * 100).toFixed(0)}%
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FPBar
          label="Nhóm A"
          rate={stats.fpRateA}
          barColor="#3b82f6"
        />
        <FPBar
          label="Nhóm B"
          rate={stats.fpRateB}
          barColor="#f97316"
        />
      </div>

      <div className="rounded-lg border border-border bg-background p-3">
        <p className="text-xs text-muted leading-relaxed">
          <strong className="text-foreground">Khoảng cách FP:</strong>{" "}
          {Math.abs(stats.fpRateB - stats.fpRateA) * 100 < 10 ? (
            <span className="text-green-600 font-semibold">
              {((stats.fpRateB - stats.fpRateA) * 100).toFixed(0)}% &mdash; gần như đều
            </span>
          ) : (
            <span className="text-red-600 font-semibold">
              +{((stats.fpRateB - stats.fpRateA) * 100).toFixed(0)}% ở nhóm B &mdash; bất công!
            </span>
          )}
        </p>
      </div>

      <p className="text-xs text-muted italic">{caption}</p>
    </div>
  );
}

function FPBar({
  label,
  rate,
  barColor,
}: {
  label: string;
  rate: number;
  barColor: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <p className="text-xs text-muted mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <motion.div
          className="h-4 rounded"
          initial={false}
          animate={{ width: `${Math.max(4, rate * 100)}%` }}
          transition={{ duration: 0.35 }}
          style={{ backgroundColor: barColor }}
        />
        <span className="text-sm font-bold tabular-nums text-foreground">
          {(rate * 100).toFixed(0)}%
        </span>
      </div>
      <p className="text-[10px] text-muted mt-1">Tỷ lệ dương tính giả</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   FeatureCountCurve — interactive slider: số feature vs train/test acc
   ───────────────────────────────────────────────────────────────────────── */
function FeatureCountCurve() {
  const [nFeatures, setNFeatures] = useState(2);

  const stats = useMemo(() => {
    // Empirically inspired curve:
    // Train acc: keeps rising (overfits hard at high count)
    const trainAcc =
      0.62 + 0.33 * (1 - Math.exp(-nFeatures / 15));
    // Test acc: rises to ~67% at n≈3-5, plateaus, drops slightly beyond ~50 features
    let testAcc;
    if (nFeatures <= 5) {
      testAcc = 0.55 + 0.12 * (nFeatures / 5);
    } else if (nFeatures <= 30) {
      testAcc = 0.67 - 0.005 * ((nFeatures - 5) / 25);
    } else {
      testAcc = 0.665 - 0.012 * ((nFeatures - 30) / 100);
    }
    return { trainAcc, testAcc };
  }, [nFeatures]);

  // Pre-build curve points for chart
  const curvePoints = useMemo(() => {
    const train: string[] = [];
    const test: string[] = [];
    const PW = 480;
    const PH = 160;
    const maxFeat = 137;
    for (let i = 1; i <= maxFeat; i++) {
      const x = 40 + ((i - 1) / (maxFeat - 1)) * (PW - 60);
      const ta =
        0.62 + 0.33 * (1 - Math.exp(-i / 15));
      let te;
      if (i <= 5) te = 0.55 + 0.12 * (i / 5);
      else if (i <= 30) te = 0.67 - 0.005 * ((i - 5) / 25);
      else te = 0.665 - 0.012 * ((i - 30) / 100);

      const yTrain = 20 + (1 - ta) * (PH - 40);
      const yTest = 20 + (1 - te) * (PH - 40);
      train.push(`${i === 1 ? "M" : "L"} ${x.toFixed(1)} ${yTrain.toFixed(1)}`);
      test.push(`${i === 1 ? "M" : "L"} ${x.toFixed(1)} ${yTest.toFixed(1)}`);
    }
    return { train: train.join(" "), test: test.join(" ") };
  }, []);

  const cursorX = useMemo(() => {
    const PW = 480;
    return 40 + ((nFeatures - 1) / 136) * (PW - 60);
  }, [nFeatures]);

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <label className="text-sm font-medium text-foreground">
          Số đặc trưng trong mô hình:{" "}
          <span className="font-bold text-accent tabular-nums">{nFeatures}</span>
        </label>
        <div className="flex gap-1">
          {[2, 10, 50, 137].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNFeatures(n)}
              className="rounded-md border border-border bg-card px-2 py-0.5 text-[11px] font-medium text-muted hover:border-accent hover:text-accent"
            >
              = {n}
            </button>
          ))}
        </div>
      </div>

      <input
        type="range"
        min={1}
        max={137}
        value={nFeatures}
        onChange={(e) => setNFeatures(parseInt(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer accent-accent"
      />

      <svg
        viewBox="0 0 500 200"
        className="w-full max-w-2xl mx-auto rounded-md border border-border bg-background"
        role="img"
        aria-label="Đường cong số feature vs accuracy"
      >
        {/* Axes */}
        <line x1={40} y1={180} x2={480} y2={180} stroke="currentColor" className="text-muted" strokeWidth={1} />
        <line x1={40} y1={20} x2={40} y2={180} stroke="currentColor" className="text-muted" strokeWidth={1} />
        {/* Ticks */}
        <text x={30} y={25} fontSize={9} fill="currentColor" className="text-muted" textAnchor="end">100%</text>
        <text x={30} y={100} fontSize={9} fill="currentColor" className="text-muted" textAnchor="end">75%</text>
        <text x={30} y={180} fontSize={9} fill="currentColor" className="text-muted" textAnchor="end">50%</text>
        <text x={260} y={198} fontSize={10} fill="currentColor" className="text-muted" textAnchor="middle">
          Số feature (1 → 137)
        </text>

        {/* 65% line for reference */}
        <line
          x1={40}
          y1={20 + (1 - 0.65) * 140}
          x2={480}
          y2={20 + (1 - 0.65) * 140}
          stroke="#94a3b8"
          strokeWidth={0.5}
          strokeDasharray="3,3"
          opacity={0.6}
        />
        <text x={470} y={20 + (1 - 0.65) * 140 - 3} fontSize={8} fill="#94a3b8" textAnchor="end">
          Trần ~67%
        </text>

        {/* Train curve — keeps rising */}
        <path d={curvePoints.train} fill="none" stroke="#f59e0b" strokeWidth={2.2} />
        {/* Test curve — arcs then drops */}
        <path d={curvePoints.test} fill="none" stroke="#22c55e" strokeWidth={2.2} strokeDasharray="4,3" />

        {/* Cursor */}
        <line x1={cursorX} y1={20} x2={cursorX} y2={180} stroke="#3b82f6" strokeWidth={1} strokeDasharray="4,3" opacity={0.7} />

        {/* Legend */}
        <g transform="translate(320, 20)">
          <line x1={0} y1={0} x2={18} y2={0} stroke="#f59e0b" strokeWidth={2} />
          <text x={22} y={3} fontSize={9} fill="#f59e0b">Train acc</text>
          <line x1={80} y1={0} x2={98} y2={0} stroke="#22c55e" strokeWidth={2} strokeDasharray="3,2" />
          <text x={102} y={3} fontSize={9} fill="#22c55e">Test acc</text>
        </g>
      </svg>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-background p-3 text-center">
          <p className="text-xs text-muted">Train acc @ {nFeatures} feat</p>
          <p className="text-xl font-bold tabular-nums text-amber-500">
            {(stats.trainAcc * 100).toFixed(1)}%
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background p-3 text-center">
          <p className="text-xs text-muted">Test acc @ {nFeatures} feat</p>
          <p
            className={`text-xl font-bold tabular-nums ${
              stats.testAcc < 0.66 ? "text-red-500" : "text-green-600"
            }`}
          >
            {(stats.testAcc * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      <p className="text-xs text-muted italic leading-relaxed">
        Kéo slider từ 2 đến 137 feature. Đường train (cam) luôn tăng &mdash; thêm
        feature luôn giúp khớp train. Đường test (xanh, đứt nét) tăng tới mốc
        3&ndash;5 feature rồi <strong>đi ngang hoặc giảm</strong>. Đây là chữ ∩
        kinh điển của overfit: thêm phức tạp chỉ giúp tới một điểm.
      </p>
    </div>
  );
}
