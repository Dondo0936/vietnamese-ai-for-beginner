"use client";

// AI Governance in Enterprise — case study Microsoft Responsible AI Standard.
// Trình bày dưới góc nhìn người làm văn phòng Việt Nam: timeline, metric động,
// so sánh trước/sau khi có committee.

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  ShieldCheck,
  AlertTriangle,
  Users,
  FileCheck,
  Gauge,
  Layers,
  CheckCircle2,
  XCircle,
  Building2,
  ClipboardList,
  Eye,
  LifeBuoy,
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
import { ToggleCompare, Callout, ProgressSteps } from "@/components/interactive";

// Metadata — giữ nguyên để không phá routing/TOC.
export const metadata: TopicMeta = {
  slug: "ai-governance-in-enterprise",
  title: "AI Governance in Enterprise",
  titleVi: "Quản trị AI trong Doanh nghiệp",
  description:
    "Microsoft Responsible AI Standard: Làm thế nào một tập đoàn 220.000 nhân viên quản trị hàng trăm dự án AI cùng lúc — khung và bài học cho doanh nghiệp Việt Nam.",
  category: "ai-safety",
  tags: ["ai-governance", "regulation", "application"],
  difficulty: "intermediate",
  relatedSlugs: ["ai-governance"],
  vizType: "static",
  applicationOf: "ai-governance",
  featuredApp: {
    name: "Microsoft Responsible AI Standard",
    productFeature: "Khung quản trị AI doanh nghiệp toàn cầu",
    company: "Microsoft Corporation",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "Microsoft Responsible AI Standard, v2",
      publisher: "Microsoft",
      url: "https://www.microsoft.com/en-us/ai/responsible-ai",
      date: "2022-06",
      kind: "documentation",
    },
    {
      title: "Responsible AI Transparency Report 2024",
      publisher: "Microsoft",
      url: "https://www.microsoft.com/en-us/corporate-responsibility/responsible-ai-transparency-report",
      date: "2024-05",
      kind: "documentation",
    },
    {
      title: "Microsoft's framework for building AI systems responsibly",
      publisher: "Microsoft On the Issues",
      url: "https://blogs.microsoft.com/on-the-issues/2022/06/21/microsofts-framework-for-building-ai-systems-responsibly/",
      date: "2022-06",
      kind: "engineering-blog",
    },
    {
      title: "EU AI Act — Shaping Europe's digital future",
      publisher: "European Commission",
      url: "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai",
      date: "2024-08",
      kind: "documentation",
    },
    {
      title:
        "Governing AI: A Blueprint for the Future (Microsoft policy report)",
      publisher: "Microsoft",
      url: "https://query.prod.cms.rt.microsoft.com/cms/api/am/binary/RW14Gtw",
      date: "2023-05",
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

// ---------- Dữ liệu timeline — các mốc trưởng thành AI governance ----------
const TIMELINE = [
  {
    year: "2016",
    label: "FATE Group",
    description:
      "Microsoft Research thành lập nhóm FATE (Fairness, Accountability, Transparency, Ethics) — những nghiên cứu đầu tiên về AI có trách nhiệm.",
    icon: Users,
    color: "#3b82f6",
  },
  {
    year: "2018",
    label: "Nguyên tắc AI",
    description:
      "Microsoft công bố 6 nguyên tắc AI (fairness, reliability, privacy, inclusiveness, transparency, accountability) — xương sống mọi chính sách sau này.",
    icon: ShieldCheck,
    color: "#a855f7",
  },
  {
    year: "2019",
    label: "AETHER Committee",
    description:
      "Hội đồng AETHER (AI, Ethics & Effects in Engineering and Research) họp định kỳ, duyệt các dự án AI rủi ro cao trước triển khai.",
    icon: Building2,
    color: "#f59e0b",
  },
  {
    year: "2022",
    label: "RAI Standard v2",
    description:
      "Responsible AI Standard v2 — tiêu chuẩn bắt buộc áp dụng cho mọi team AI toàn công ty: impact assessment, fit-for-purpose test, sign-off.",
    icon: FileCheck,
    color: "#22c55e",
  },
  {
    year: "2024",
    label: "Transparency Report",
    description:
      "Báo cáo minh bạch Responsible AI lần đầu công bố công khai: bao nhiêu hệ thống đã audit, loại rủi ro phát hiện, cách xử lý.",
    icon: Eye,
    color: "#ec4899",
  },
];

// ---------- 5 beats của cơ chế vận hành RAI Standard ----------
const BEATS = [
  {
    title: "Impact Assessment trước mọi dự án AI",
    icon: ClipboardList,
    body: "Mỗi team AI phải hoàn thành Responsible AI Impact Assessment: mô tả use case, dữ liệu, nhóm người bị ảnh hưởng, rủi ro theo 6 nguyên tắc. Không có IA = không được ngân sách.",
  },
  {
    title: "Office of Responsible AI (ORA)",
    icon: Building2,
    body: "Phòng ORA trực thuộc General Counsel, làm trọng tài giữa kỹ thuật và pháp chế. Có quyền dừng dự án nếu phát hiện rủi ro không giảm thiểu được.",
  },
  {
    title: "Sensitive Uses review — rủi ro cao phải qua hội đồng",
    icon: AlertTriangle,
    body: "Use case chạm nhóm 'sensitive' (nhận diện khuôn mặt, cơ quan chính phủ, y tế, giáo dục trẻ em) tự động kích hoạt review cấp công ty. Có case bị từ chối triển khai.",
  },
  {
    title: "Red-team & pre-release testing",
    icon: Gauge,
    body: "Trước khi model generative AI release, đội red-team nội bộ + bên ngoài cố gắng phá: prompt injection, content harm, bias. Kết quả phải được ORA phê duyệt.",
  },
  {
    title: "Incident response & cải tiến liên tục",
    icon: LifeBuoy,
    body: "Sự cố (hallucination có hại, lộ dữ liệu, bias mới) có kênh báo cáo riêng. Bài học đưa trở lại Standard — cập nhật checklist, training, quy trình.",
  },
];

// ---------- Component đếm số chạy lên (dùng cho Metric động) ----------
function AnimatedCounter({
  value,
  suffix = "",
  duration = 1.5,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -20% 0px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const target = value;
    function tick(now: number) {
      const elapsed = (now - start) / 1000;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {display.toLocaleString("vi-VN")}
      {suffix}
    </span>
  );
}

// ---------- Timeline hiển thị trưởng thành governance ----------
function GovernanceTimeline() {
  return (
    <div className="not-prose my-6 rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Layers size={18} className="text-accent" />
        <h3 className="text-sm font-semibold text-foreground">
          Tám năm xây dựng khung AI governance tại Microsoft
        </h3>
      </div>
      <ol className="relative space-y-5 pl-8 before:absolute before:left-3 before:top-2 before:h-[calc(100%-1rem)] before:w-[2px] before:bg-border">
        {TIMELINE.map((t, i) => {
          const Icon = t.icon;
          return (
            <motion.li
              key={t.year}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "0px 0px -10% 0px" }}
              transition={{ duration: 0.35, delay: i * 0.08 }}
              className="relative"
            >
              <span
                className="absolute -left-8 top-0 flex h-7 w-7 items-center justify-center rounded-full border-2"
                style={{
                  borderColor: t.color,
                  backgroundColor: `${t.color}22`,
                }}
              >
                <Icon size={13} style={{ color: t.color }} />
              </span>
              <div className="flex items-baseline gap-2">
                <span
                  className="text-base font-bold"
                  style={{ color: t.color }}
                >
                  {t.year}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {t.label}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {t.description}
              </p>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}

// ---------- Một Beat card — hiển thị beat mechanism với icon và progress ----------
function BeatCard({
  step,
  total,
  title,
  icon: Icon,
  body,
}: {
  step: number;
  total: number;
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  body: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.35, delay: step * 0.06 }}
      className="not-prose rounded-lg border border-border bg-card p-4"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-light text-accent">
          <Icon size={18} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-1">
            <h4 className="text-sm font-semibold text-foreground">{title}</h4>
            <span className="shrink-0 hidden sm:block">
              <ProgressSteps current={step} total={total} />
            </span>
          </div>
          <p className="text-xs leading-relaxed text-muted">{body}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ---------- Mechanism visual giữa Hero và Metrics: cần-có vs không-có committee ----------
function BeforeAfterToggle() {
  return (
    <div className="not-prose my-6">
      <ToggleCompare
        labelA="Không có governance"
        labelB="Có RAI committee"
        description="Cùng một sự cố: AI chatbot hỗ trợ khách hàng trả lời sai về chính sách đổi trả, khiến khách bị thiệt. Hai kịch bản xử lý."
        childA={
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <XCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
              <div>
                <div className="text-sm font-semibold text-foreground">
                  Ngày 1-7: Không ai phát hiện
                </div>
                <p className="text-xs text-muted mt-0.5 leading-relaxed">
                  Không có monitoring dashboard. Chỉ khi khách hàng khiếu nại
                  trên mạng xã hội, công ty mới biết.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <XCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
              <div>
                <div className="text-sm font-semibold text-foreground">
                  Ngày 8: Lúng túng ai chịu trách nhiệm
                </div>
                <p className="text-xs text-muted mt-0.5 leading-relaxed">
                  IT đổ cho vendor OpenAI, marketing đổ cho IT, CEO chưa biết
                  phải xin lỗi thế nào. Mất 3-5 ngày để có một tiếng nói
                  chính thức.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <XCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
              <div>
                <div className="text-sm font-semibold text-foreground">
                  Tuần 2-4: Báo chí, phạt, mất khách
                </div>
                <p className="text-xs text-muted mt-0.5 leading-relaxed">
                  Không có tài liệu governance để chứng minh công ty đã nỗ
                  lực. Thanh tra, phạt, khách hàng rời đi.
                </p>
              </div>
            </div>
          </div>
        }
        childB={
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" />
              <div>
                <div className="text-sm font-semibold text-foreground">
                  Giờ 1-4: Monitoring phát hiện, kill-switch
                </div>
                <p className="text-xs text-muted mt-0.5 leading-relaxed">
                  Dashboard bắt được lượng khiếu nại tăng bất thường.
                  On-call duty bật kill-switch, chuyển sang human agent.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" />
              <div>
                <div className="text-sm font-semibold text-foreground">
                  Giờ 24-72: Incident response team
                </div>
                <p className="text-xs text-muted mt-0.5 leading-relaxed">
                  AI Ethics Officer, Legal, PR họp theo playbook. Thông
                  báo chính thức cho khách bị ảnh hưởng kèm phương án bù.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" />
              <div>
                <div className="text-sm font-semibold text-foreground">
                  Tuần 2: Post-mortem không đổ lỗi, sửa hệ thống
                </div>
                <p className="text-xs text-muted mt-0.5 leading-relaxed">
                  Rút bài học, cập nhật checklist, retrain model. Có tài
                  liệu đầy đủ để làm việc với thanh tra nếu cần.
                </p>
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
}

export default function AiGovernanceInEnterprise() {
  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Quản trị AI"
    >
      <ApplicationHero
        parentTitleVi="Quản trị AI"
        topicSlug="ai-governance-in-enterprise"
      >
        <p>
          Microsoft là một trong những công ty công nghệ lớn nhất thế giới &mdash;
          220.000 nhân viên, có mặt tại hơn 190 quốc gia, đồng thời cũng là
          nhà đầu tư lớn nhất của OpenAI. Khi AI bùng nổ năm 2023, Microsoft
          cần một khung quản trị đủ mạnh để vận hành hàng trăm dự án AI cùng
          lúc &mdash; từ Copilot trong Word cho đến các dịch vụ cloud cho chính
          phủ Mỹ.
        </p>
        <p>
          Câu trả lời là <strong>Responsible AI Standard v2</strong> &mdash; bộ
          tiêu chuẩn bắt buộc áp dụng nội bộ từ tháng 6/2022, được hậu thuẫn
          bởi <strong>Office of Responsible AI (ORA)</strong>, hội đồng{" "}
          <strong>AETHER</strong>, và nhóm <strong>Responsible AI Champs</strong>{" "}
          có mặt tại mọi sản phẩm. Đây là case study tốt nhất để người làm văn
          phòng Việt Nam hình dung một bộ máy governance thực sự vận hành ra
          sao.
        </p>
        <GovernanceTimeline />
      </ApplicationHero>

      <ApplicationProblem topicSlug="ai-governance-in-enterprise">
        <p>
          Trước khi có Responsible AI Standard, ngay cả Microsoft cũng từng gặp
          các sự cố AI đáng kể &mdash; ví dụ Tay Chatbot (2016) bị troll dạy nói
          nội dung phân biệt chủng tộc trong 24 giờ, hay các lo ngại về nhận
          diện khuôn mặt được bán cho cơ quan thực thi pháp luật.
        </p>
        <p>
          Vấn đề cốt lõi của mọi doanh nghiệp lớn khi triển khai AI là{" "}
          <strong>không thể để mỗi team tự quyết</strong>. Một quyết định AI
          chạm dữ liệu khách hàng đồng thời là quyết định pháp lý (NĐ 13, GDPR),
          quyết định bảo mật, quyết định thương hiệu, và quyết định đạo đức. Không
          có quy trình chung, mỗi sự cố trở thành một cuộc khủng hoảng truyền
          thông, và ban lãnh đạo luôn bị động.
        </p>
        <BeforeAfterToggle />
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Quản trị AI"
        topicSlug="ai-governance-in-enterprise"
      >
        <Beat step={1}>
          <BeatCard
            step={1}
            total={BEATS.length}
            title={BEATS[0].title}
            icon={BEATS[0].icon}
            body={BEATS[0].body}
          />
        </Beat>
        <Beat step={2}>
          <BeatCard
            step={2}
            total={BEATS.length}
            title={BEATS[1].title}
            icon={BEATS[1].icon}
            body={BEATS[1].body}
          />
        </Beat>
        <Beat step={3}>
          <BeatCard
            step={3}
            total={BEATS.length}
            title={BEATS[2].title}
            icon={BEATS[2].icon}
            body={BEATS[2].body}
          />
        </Beat>
        <Beat step={4}>
          <BeatCard
            step={4}
            total={BEATS.length}
            title={BEATS[3].title}
            icon={BEATS[3].icon}
            body={BEATS[3].body}
          />
        </Beat>
        <Beat step={5}>
          <BeatCard
            step={5}
            total={BEATS.length}
            title={BEATS[4].title}
            icon={BEATS[4].icon}
            body={BEATS[4].body}
          />
        </Beat>

        <div className="mt-6">
          <Callout variant="insight" title="Bài học cho doanh nghiệp Việt Nam">
            <p>
              Không cần 220.000 nhân viên mới có AI governance. Một công ty
              500-2000 người có thể bắt đầu với: (1) một AI Ethics Champion
              kiêm nhiệm, (2) một template Impact Assessment 2 trang, (3) một
              committee 3 người (IT + pháp chế + kinh doanh) họp hàng tháng.
              Microsoft cũng bắt đầu từ những bước nhỏ như vậy năm 2016.
            </p>
          </Callout>
        </div>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="ai-governance-in-enterprise"
      >
        <Metric
          value="Responsible AI Standard v2 bắt buộc áp dụng cho mọi team AI tại Microsoft từ tháng 6/2022"
          sourceRef={1}
        />
        <Metric
          value="6 nguyên tắc AI: fairness, reliability & safety, privacy & security, inclusiveness, transparency, accountability"
          sourceRef={3}
        />
        <Metric
          value="Báo cáo Responsible AI Transparency 2024 công bố chi tiết hàng trăm hệ thống đã audit và phương pháp xử lý sự cố"
          sourceRef={2}
        />
        <Metric
          value="EU AI Act (2024) trở thành luật AI toàn diện đầu tiên thế giới, ảnh hưởng mọi công ty bán AI vào thị trường 450 triệu người tiêu dùng EU"
          sourceRef={4}
        />
        <Metric
          value="Microsoft đề xuất 5-point blueprint về AI governance trong báo cáo 'Governing AI' 2023, nhiều quốc gia tham khảo"
          sourceRef={5}
        />
      </ApplicationMetrics>

      <div className="not-prose my-8 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <StatCard
          value={220000}
          suffix=""
          label="Nhân viên Microsoft"
          sub="Tất cả bị ràng buộc bởi RAI Standard"
          color="#3b82f6"
          icon={Users}
        />
        <StatCard
          value={6}
          suffix=""
          label="Nguyên tắc RAI"
          sub="Xương sống cho mọi quyết định AI"
          color="#a855f7"
          icon={ShieldCheck}
        />
        <StatCard
          value={8}
          suffix=" năm"
          label="Xây dựng khung"
          sub="Từ FATE 2016 đến Transparency Report 2024"
          color="#f59e0b"
          icon={Layers}
        />
        <StatCard
          value={450}
          suffix=" triệu"
          label="Người tiêu dùng EU"
          sub="Bảo vệ bởi EU AI Act song song"
          color="#22c55e"
          icon={Gauge}
        />
      </div>

      <ApplicationCounterfactual
        parentTitleVi="Quản trị AI"
        topicSlug="ai-governance-in-enterprise"
      >
        <p>
          Nếu Microsoft không có Responsible AI Standard, hình dung thứ gần như
          chắc chắn xảy ra khi Copilot ra mắt năm 2023: mỗi khu vực thị trường
          (Mỹ, EU, châu Á) sẽ có cách xử lý khác nhau với cùng một sự cố; mỗi
          sản phẩm sẽ có checklist riêng không tương thích; và khi EU AI Act
          có hiệu lực, Microsoft sẽ phải xây lại mọi thứ từ đầu.
        </p>
        <p>
          Thực tế ngược lại đã xảy ra &mdash; Microsoft triển khai Copilot tương
          đối nhanh trên 190 quốc gia chính vì đã có sẵn Impact Assessment
          template, Sensitive Uses review, và ORA đóng vai trò trọng tài. Công
          ty Việt Nam có hai lựa chọn: đầu tư governance bây giờ (khi AI chưa
          phổ biến) hoặc vật lộn sau khi đã có 10-20 sản phẩm AI chạy song
          song.
        </p>
        <p>
          Bài học thực dụng: governance không phải gánh nặng làm chậm AI. Nó
          là điều kiện cần để AI ra thị trường nhanh &mdash; và bền vững.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}

// ---------- StatCard dùng cho khối metric động giữa trang ----------
function StatCard({
  value,
  suffix,
  label,
  sub,
  color,
  icon: Icon,
}: {
  value: number;
  suffix: string;
  label: string;
  sub: string;
  color: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-border bg-card p-4"
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: `${color}22`, color }}
        >
          <Icon size={16} />
        </span>
        <span className="text-xs font-medium text-muted uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="text-2xl font-bold" style={{ color }}>
        <AnimatedCounter value={value} suffix={suffix} />
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted">{sub}</p>
    </motion.div>
  );
}
