"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Coffee, FileText, Mail, Scale, Sparkles } from "lucide-react";

import {
  AhaMoment,
  Callout,
  FillBlank,
  InlineChallenge,
  LessonSection,
  MatchPairs,
  MiniSummary,
  PredictionGate,
  ProgressSteps,
  Reorderable,
  StepReveal,
  ToggleCompare,
  TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────
// Metadata — giữ nguyên slug + các trường bắt buộc
// ─────────────────────────────────────────────────────────────────────────
export const metadata: TopicMeta = {
  slug: "chain-of-thought",
  title: "Chain-of-Thought",
  titleVi: "Chuỗi suy luận từng bước",
  description:
    "Kỹ thuật nhắc AI trình bày suy nghĩ theo từng bước trước khi chốt đáp án — giúp dân văn phòng có câu trả lời chắc tay hơn ở những việc nhiều bước.",
  category: "llm-concepts",
  tags: ["reasoning", "prompt", "cot", "llm"],
  difficulty: "beginner",
  relatedSlugs: ["prompt-engineering", "in-context-learning", "llm-overview"],
  vizType: "interactive",
};

// ─────────────────────────────────────────────────────────────────────────
// Ngân hàng bài toán — tình huống rất đời thường, không cần biết lập trình
// ─────────────────────────────────────────────────────────────────────────
interface OfficeProblem {
  id: string;
  tag: string;
  icon: React.ElementType;
  question: string;
  directAnswer: string;
  directNote: string;
  stepAnswer: string;
  steps: string[];
}

const OFFICE_PROBLEMS: OfficeProblem[] = [
  {
    id: "stacked-discount",
    tag: "Khuyến mãi chồng",
    icon: Sparkles,
    question:
      "Cửa hàng dán bảng: giảm 20%, rồi tới quầy thu ngân giảm thêm 10% trên giá đã giảm. Tổng cộng bạn được giảm bao nhiêu phần trăm so với giá gốc?",
    directAnswer: "30%",
    directNote:
      "AI cộng đại hai con số 20% và 10% → ra 30%. Nghe hợp lý, nhưng sai về bản chất.",
    stepAnswer: "28%",
    steps: [
      "Giả sử món hàng giá gốc là 100.000 đồng cho dễ tính.",
      "Giảm 20% lần đầu: còn lại 100.000 × 0,8 = 80.000 đồng.",
      "Giảm thêm 10% trên 80.000: còn lại 80.000 × 0,9 = 72.000 đồng.",
      "Tổng số tiền được giảm: 100.000 − 72.000 = 28.000 đồng.",
      "Tức là bạn chỉ được giảm thật 28%, không phải 30% như cộng dồn thô.",
    ],
  },
  {
    id: "meeting-room",
    tag: "Sắp phòng họp",
    icon: Coffee,
    question:
      "Phòng họp có 3 công tắc ở hành lang, mỗi cái nối với một đèn trong phòng. Bạn chỉ được mở cửa đúng một lần để vào kiểm tra. Làm sao biết công tắc nào thắp đèn nào?",
    directAnswer: "Bật từng cái rồi chạy vào xem",
    directNote:
      "AI quên mất điều kiện “chỉ được vào phòng đúng một lần” và đề xuất phương án phải vào nhiều lần.",
    stepAnswer: "Dùng thêm dấu hiệu nhiệt của bóng đèn",
    steps: [
      "Bật công tắc số 1, để yên khoảng 5 phút cho bóng ấm lên.",
      "Sau 5 phút, tắt công tắc số 1 và bật công tắc số 2.",
      "Bây giờ mới mở cửa vào phòng (đây là lần vào duy nhất).",
      "Bóng đang sáng chính là công tắc số 2.",
      "Trong hai bóng còn lại: bóng ấm nóng khi sờ vào là công tắc số 1, bóng nguội lạnh là công tắc số 3.",
    ],
  },
  {
    id: "vat-tax",
    tag: "Hoàn thuế VAT",
    icon: FileText,
    question:
      "Hóa đơn ghi tổng tiền thanh toán là 1.100.000 đồng đã bao gồm VAT 10%. Số tiền VAT thật sự bạn nộp là bao nhiêu?",
    directAnswer: "110.000 đồng",
    directNote:
      "AI lấy luôn 10% của 1.100.000 ra 110.000. Nhưng 10% đó là trên giá CHƯA thuế, không phải trên giá đã có thuế.",
    stepAnswer: "100.000 đồng",
    steps: [
      "Gọi giá chưa thuế là X. Theo quy định: X + 10% × X = 1.100.000.",
      "Viết lại: 1,1 × X = 1.100.000 → X = 1.000.000 đồng (giá chưa thuế thật sự).",
      "Số tiền VAT = 1.100.000 − 1.000.000 = 100.000 đồng.",
      "Kiểm tra lại: 10% của 1.000.000 đúng bằng 100.000. Khớp.",
      "Như vậy nếu hoàn thuế VAT, bạn chỉ được hoàn 100.000 đồng — không phải 110.000 đồng.",
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Demo 1 — So sánh “Trả lời thẳng” vs “Suy nghĩ từng bước” trên 3 tình huống
// ─────────────────────────────────────────────────────────────────────────
function DirectVsStepDemo() {
  const [idx, setIdx] = useState(0);
  const problem = OFFICE_PROBLEMS[idx];
  const Icon = problem.icon;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {OFFICE_PROBLEMS.map((p, i) => {
          const active = i === idx;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setIdx(i)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "border-accent bg-accent text-white"
                  : "border-border bg-card text-muted hover:border-accent/50"
              }`}
            >
              <p.icon size={14} />
              {p.tag}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-dashed border-border bg-surface/50 p-4">
        <div className="flex items-start gap-3">
          <Icon size={20} className="mt-0.5 shrink-0 text-accent" />
          <p className="text-sm font-medium text-foreground leading-relaxed">
            {problem.question}
          </p>
        </div>
      </div>

      <ToggleCompare
        labelA="Câu trả lời trực tiếp"
        labelB="Suy nghĩ từng bước"
        description="Bấm thử hai chế độ để thấy AI khác nhau đến mức nào khi có thời gian 'nháp'."
        childA={
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-300">
                Sai
              </span>
              <span className="text-sm text-muted">AI trả lời trong 1 nhịp</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">
              {problem.directAnswer}
            </p>
            <p className="text-sm text-muted leading-relaxed">
              {problem.directNote}
            </p>
          </div>
        }
        childB={
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300">
                Đúng
              </span>
              <span className="text-sm text-muted">
                AI nháp từng bước trước khi chốt
              </span>
            </div>
            <ol className="space-y-2 text-sm text-foreground leading-relaxed">
              {problem.steps.map((s, i) => (
                <li
                  key={i}
                  className="flex gap-2 rounded-lg border border-border/60 bg-card/50 px-3 py-2"
                >
                  <span className="shrink-0 font-semibold text-accent">
                    {i + 1}.
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
            <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-200">
              Đáp án cuối: {problem.stepAnswer}
            </div>
          </div>
        }
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Demo 3 — Hai bản prompt song song, kết quả mô phỏng
// ─────────────────────────────────────────────────────────────────────────
function PromptTemplateDemo() {
  return (
    <ToggleCompare
      labelA="Prompt kiểu cũ"
      labelB="Prompt theo chuỗi suy luận"
      description="Cùng một câu hỏi về phụ cấp — chỉ thay đổi vài câu trong prompt, chất lượng câu trả lời đã rất khác."
      childA={
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface/40 p-3">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-tertiary">
              Prompt bạn viết
            </p>
            <p className="text-sm italic text-foreground leading-relaxed">
              “Nhân viên thử việc có lương cứng 8 triệu, phụ cấp ăn trưa
              730.000, phụ cấp điện thoại 300.000. Tính tổng thu nhập.”
            </p>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
              AI trả lời
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              “Tổng thu nhập khoảng 9 triệu.”
              <br />
              <span className="text-xs text-muted">
                Tròn số, không thấy rõ AI tính gì — bạn không kiểm được.
              </span>
            </p>
          </div>
        </div>
      }
      childB={
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface/40 p-3">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-tertiary">
              Prompt bạn viết
            </p>
            <p className="text-sm italic text-foreground leading-relaxed">
              “Nhân viên thử việc có lương cứng 8 triệu, phụ cấp ăn trưa
              730.000, phụ cấp điện thoại 300.000. <strong>Hãy liệt kê
              từng khoản rồi cộng lại, cuối cùng mới ghi tổng.</strong>”
            </p>
          </div>
          <div className="rounded-xl border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-300">
              AI trả lời
            </p>
            <ol className="space-y-1 text-sm text-foreground leading-relaxed">
              <li>1. Lương cứng: 8.000.000</li>
              <li>2. Phụ cấp ăn trưa: 730.000</li>
              <li>3. Phụ cấp điện thoại: 300.000</li>
              <li className="font-semibold text-green-800 dark:text-green-300">
                Tổng: 9.030.000 đồng
              </li>
            </ol>
            <p className="mt-1.5 text-xs text-muted">
              Có nháp rõ ràng — bạn kiểm tra từng dòng trong 5 giây.
            </p>
          </div>
        </div>
      }
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Thanh tiến trình nhỏ — trang trí cho VisualizationSection
// ─────────────────────────────────────────────────────────────────────────
function DemoStepBadge({
  step,
  total,
  labels,
}: {
  step: number;
  total: number;
  labels: string[];
}) {
  return (
    <div className="mb-3">
      <ProgressSteps current={step} total={total} labels={labels} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Ba mẫu prompt mang sẵn chuỗi suy luận — dùng Callout thay vì CodeBlock
// ─────────────────────────────────────────────────────────────────────────
interface PromptTemplate {
  tag: string;
  title: string;
  icon: React.ElementType;
  tone: "tip" | "info" | "insight";
  situation: string;
  template: string;
}

const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    tag: "Báo cáo tài chính",
    title: "Khi cần tách – cộng nhiều khoản",
    icon: FileText,
    tone: "info",
    situation:
      "Bạn có bảng doanh thu nhiều chi nhánh, cần AI so sánh tháng này với tháng trước và tìm chi nhánh đi lùi.",
    template:
      "Dưới đây là số liệu doanh thu 5 chi nhánh trong 2 tháng. Hãy làm theo thứ tự: (1) liệt kê doanh thu từng chi nhánh từng tháng, (2) tính chênh lệch từng chi nhánh, (3) chỉ ra chi nhánh nào giảm và giảm bao nhiêu, (4) đưa ra nhận định chung ở cuối. Không bỏ qua bước nào.",
  },
  {
    tag: "Soạn email khó",
    title: "Khi phải cân nhắc giọng điệu và nhiều bên",
    icon: Mail,
    tone: "tip",
    situation:
      "Bạn phải trả lời một khách hàng đang khó chịu vì đơn hàng giao trễ, nhưng vẫn cần giữ quan hệ.",
    template:
      "Tôi đang soạn email trả lời khách hàng bị giao trễ 3 ngày. Trước khi viết email cuối, hãy suy nghĩ từng bước: (1) cảm xúc hiện tại của khách là gì, (2) ba điều tối thiểu họ cần nghe, (3) hai điều tuyệt đối tránh nói, (4) mới viết email hoàn chỉnh ở cuối. Hãy trình bày lần lượt bốn phần đó.",
  },
  {
    tag: "Quyết định nhanh",
    title: "Khi so sánh nhiều lựa chọn",
    icon: Scale,
    tone: "insight",
    situation:
      "Sếp cho 3 nhà cung cấp khác nhau, mỗi bên có ưu nhược điểm. Bạn cần đề xuất chọn một bên.",
    template:
      "Tôi có 3 nhà cung cấp A, B, C với bảng thông tin dưới đây. Hãy suy nghĩ qua 4 bước: (1) tiêu chí nào là quan trọng nhất với tình huống của tôi, (2) chấm điểm từng nhà cung cấp trên từng tiêu chí, (3) cộng tổng và xếp hạng, (4) kết luận chọn ai và vì sao. Đừng đưa câu trả lời cuối trước khi đi qua đủ 4 bước.",
  },
];

function PromptTemplateCard({ template }: { template: PromptTemplate }) {
  const Icon = template.icon;
  return (
    <Callout variant={template.tone} title={template.title}>
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted">
          <Icon size={14} />
          {template.tag}
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed">
          <strong>Tình huống: </strong>
          {template.situation}
        </p>
        <div className="rounded-lg border border-border bg-card/70 p-3">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-tertiary">
            Prompt gợi ý (copy rồi đổi số liệu của bạn vào)
          </p>
          <p className="text-sm text-foreground italic leading-relaxed">
            “{template.template}”
          </p>
        </div>
      </div>
    </Callout>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Bảng Zero-shot vs Few-shot — diagram minh họa
// ─────────────────────────────────────────────────────────────────────────
function ZeroVsFewShotDiagram() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-accent-light px-2 py-0.5 text-xs font-semibold text-accent-dark">
            Zero-shot CoT
          </span>
          <span className="text-xs text-muted">Không ví dụ mẫu</span>
        </div>
        <p className="mb-3 text-sm text-foreground/90 leading-relaxed">
          Chỉ cần thêm một câu thần chú vào cuối prompt. Đơn giản nhất, phù hợp
          cho 90% tình huống hàng ngày của dân văn phòng.
        </p>
        <div className="rounded-lg bg-surface/60 p-3 text-sm italic text-foreground leading-relaxed">
          “…[câu hỏi của bạn]. <strong>Hãy suy nghĩ từng bước trước khi trả
          lời.</strong>”
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-accent-light px-2 py-0.5 text-xs font-semibold text-accent-dark">
            Few-shot CoT
          </span>
          <span className="text-xs text-muted">Kèm 1–2 ví dụ mẫu</span>
        </div>
        <p className="mb-3 text-sm text-foreground/90 leading-relaxed">
          Bạn cho AI thấy trước một bài mẫu đã trình bày theo đúng style bạn
          muốn. Dùng khi bạn cần định dạng cố định (bảng, form, mẫu email).
        </p>
        <div className="rounded-lg bg-surface/60 p-3 text-sm italic text-foreground leading-relaxed">
          “Ví dụ: câu hỏi X → nháp 3 bước → đáp án Y.
          <br />
          Bây giờ đến câu của tôi: [câu hỏi thật]. Hãy làm theo đúng mẫu
          trên.”
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Thanh “Khi nào nên dùng / không nên” — trực quan, không cần biểu đồ
// ─────────────────────────────────────────────────────────────────────────
function WhenToUseChart() {
  const cases: Array<{
    label: string;
    good: boolean;
    note: string;
  }> = [
    {
      label: "Tính lương thưởng nhiều khoản",
      good: true,
      note: "Nhiều bước — rất dễ sai nếu cộng gộp.",
    },
    {
      label: "Lên lịch 5 cuộc họp trong 1 ngày",
      good: true,
      note: "Có ràng buộc thời gian và người — cần nháp.",
    },
    {
      label: "So sánh 3 nhà cung cấp",
      good: true,
      note: "Cần chấm điểm từng tiêu chí.",
    },
    {
      label: "Viết một lời chào email",
      good: false,
      note: "Một câu đơn giản — thêm chuỗi suy luận chỉ tốn thời gian.",
    },
    {
      label: "Hỏi thủ đô nước Pháp",
      good: false,
      note: "Câu hỏi tra cứu — AI chỉ cần nhớ, không cần suy luận.",
    },
    {
      label: "Dịch 1 câu tiếng Anh",
      good: false,
      note: "Việc 1 bước — đừng bắt AI nháp dài dòng.",
    },
  ];

  return (
    <div className="grid gap-2 md:grid-cols-2">
      {cases.map((c) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -40px 0px" }}
          transition={{ duration: 0.3 }}
          className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${
            c.good
              ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
              : "border-border bg-surface/40"
          }`}
        >
          <span
            aria-hidden
            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
              c.good ? "bg-green-500" : "bg-muted"
            }`}
          >
            {c.good ? "✓" : "×"}
          </span>
          <div>
            <p className="font-medium text-foreground">{c.label}</p>
            <p className="mt-0.5 text-xs text-muted leading-relaxed">
              {c.note}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Đồng hồ ba điểm chênh lệch — visualize độ chính xác theo cách nhắc
// ─────────────────────────────────────────────────────────────────────────
function AccuracyBars() {
  const rows = [
    {
      label: "Hỏi thẳng, không gợi suy luận",
      pct: 34,
      tone: "bg-red-400 dark:bg-red-500",
      note: "AI đoán cảm tính, dễ lạc đề ở bài nhiều bước.",
    },
    {
      label: "Zero-shot CoT — thêm câu 'suy nghĩ từng bước'",
      pct: 62,
      tone: "bg-amber-400 dark:bg-amber-500",
      note: "Chỉ đổi vài chữ trong prompt đã tăng gần gấp đôi độ đúng.",
    },
    {
      label: "Few-shot CoT — có ví dụ mẫu đã trình bày rõ",
      pct: 78,
      tone: "bg-green-500 dark:bg-green-600",
      note: "Đỉnh nhất khi bạn cần format cố định (bảng, email mẫu, báo cáo).",
    },
  ];

  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.label} className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-foreground">{r.label}</span>
            <span className="font-mono text-sm font-semibold text-accent">
              {r.pct}%
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${r.pct}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className={`h-full rounded-full ${r.tone}`}
            />
          </div>
          <p className="text-xs text-muted">{r.note}</p>
        </div>
      ))}
      <p className="pt-1 text-[11px] italic text-tertiary">
        Con số minh họa — tổng hợp từ các thử nghiệm công khai trên bài toán
        nhiều bước. Với tác vụ văn phòng cụ thể của bạn, mức cải thiện thực tế
        có thể khác.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Câu hỏi kiểm tra cuối bài
// ─────────────────────────────────────────────────────────────────────────
const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Chain-of-Thought (chuỗi suy luận từng bước) giúp ích NHIỀU NHẤT ở loại công việc nào?",
    options: [
      "Viết câu chúc mừng sinh nhật đồng nghiệp",
      "Tính thưởng Tết có nhiều phụ cấp và thuế khác nhau",
      "Gõ chính tả một đoạn văn ngắn",
      "Tra nghĩa một từ tiếng Anh thông dụng",
    ],
    correct: 1,
    explanation:
      "CoT mạnh nhất ở việc có NHIỀU BƯỚC. Tính thưởng Tết phải cộng lương + các loại phụ cấp + trừ thuế — rất dễ sai nếu AI nhảy thẳng. Ba lựa chọn còn lại là việc 1 bước, không cần nháp.",
  },
  {
    question:
      "Trong Zero-shot CoT, câu 'thần chú' đơn giản nào thường được thêm vào cuối prompt?",
    options: [
      "'Trả lời càng ngắn càng tốt'",
      "'Hãy suy nghĩ từng bước trước khi trả lời'",
      "'Chỉ đưa đáp án, đừng giải thích'",
      "'Đoán thử đi'",
    ],
    correct: 1,
    explanation:
      "Chỉ cần thêm 'Hãy suy nghĩ từng bước trước khi trả lời' (hoặc tiếng Anh 'Let's think step by step') — AI sẽ tự trình bày nháp trước khi kết luận.",
  },
  {
    question:
      "Đâu là nhược điểm lớn NHẤT khi bạn dùng Chain-of-Thought cho mọi câu hỏi?",
    options: [
      "AI sẽ trả lời bằng ngôn ngữ khác",
      "Câu trả lời dài hơn, tốn token và tốn thời gian đọc — không cần thiết cho việc đơn giản",
      "AI sẽ không chịu trả lời nữa",
      "AI chỉ trả lời được bằng chữ in hoa",
    ],
    correct: 1,
    explanation:
      "CoT làm câu trả lời dài ra vì AI phải trình bày nháp. Với câu hỏi một bước (chào hỏi, tra cứu, dịch 1 câu), dùng CoT chỉ gây lãng phí thời gian và token.",
  },
  {
    type: "fill-blank",
    question:
      "Chain-of-Thought buộc AI trình bày {blank} trước khi đưa ra đáp án, giúp cải thiện chất lượng ở những việc có {blank}.",
    blanks: [
      { answer: "từng bước", accept: ["step-by-step", "từng-bước", "tung buoc"] },
      {
        answer: "nhiều bước",
        accept: ["multi-step", "lập luận", "suy luận phức tạp"],
      },
    ],
    explanation:
      "CoT buộc mô hình viết ra chuỗi từng bước trung gian thay vì nhảy thẳng tới đáp án. Hiệu quả đặc biệt cho các việc nhiều bước — kế toán, lập kế hoạch, so sánh lựa chọn.",
  },
  {
    question:
      "Đồng nghiệp gửi bạn hóa đơn 5 dòng bằng ngoại tệ, yêu cầu quy ra VND rồi lọc những khoản > 500.000 VND. Bạn nên viết prompt theo kiểu nào?",
    options: [
      "'Cho tôi danh sách khoản trên 500.000' — hỏi thẳng",
      "'Hãy: (1) quy đổi từng dòng sang VND, (2) liệt kê rõ, (3) lọc những dòng > 500.000, (4) tổng cuối cùng' — ép AI đi từng bước",
      "'Tóm tắt hóa đơn bằng 1 câu'",
      "'Viết một bài thơ về hóa đơn này'",
    ],
    correct: 1,
    explanation:
      "Việc này nhiều bước: quy đổi tỉ giá, lọc điều kiện, cộng tổng. Đây chính là tình huống CoT toả sáng — bạn yêu cầu AI nháp rõ từng bước để kiểm soát độ chính xác.",
  },
  {
    question:
      "Tại sao Chain-of-Thought lại hiệu quả — nói một cách không kỹ thuật?",
    options: [
      "Vì AI được “thưởng” mỗi khi viết dài",
      "Vì khi viết ra từng bước, mỗi bước trở thành gợi ý cho bước tiếp theo, giúp AI ít nhảy cóc sai",
      "Vì AI copy đáp án từ Internet nhanh hơn",
      "Vì AI chỉ hiểu khi prompt có nhiều chữ in hoa",
    ],
    correct: 1,
    explanation:
      "Giống học sinh giải toán: khi phải trình bày lời giải, các em ít nhảy cóc hơn. AI cũng vậy — mỗi câu nháp trung gian trở thành ngữ cảnh cho câu tiếp theo, giảm lỗi tích lũy.",
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Component chính
// ─────────────────────────────────────────────────────────────────────────
export default function ChainOfThoughtTopic() {
  return (
    <>
      {/* ============ BƯỚC 1 — DỰ ĐOÁN ============ */}
      <PredictionGate
        question="Cửa hàng dán bảng 'giảm 20%, thêm 10% tại quầy thanh toán'. Tổng cộng bạn được giảm bao nhiêu phần trăm so với giá gốc?"
        options={[
          "30% — cộng thẳng hai con số",
          "28% — giảm kép, ít hơn tổng",
          "25% — trung bình cộng của hai lần giảm",
          "32% — có cộng dồn khuyến mãi",
        ]}
        correct={1}
        explanation="Đáp án đúng là 28%. Lần giảm thứ hai (10%) chỉ áp lên giá đã giảm lần một, không phải giá gốc — nên tổng giảm ít hơn 30%. Đây đúng là kiểu bài nhiều bước mà AI hay trả lời cẩu thả khi bị ép đáp án nhanh. Bài học hôm nay chỉ bạn cách buộc AI 'nháp' để không lặp lại lỗi này."
      >
        <p className="mt-3 text-sm text-muted">
          Câu chuyện về phần trăm giảm kép cũng chính là câu chuyện của tất cả
          những việc nhiều bước ở văn phòng: lương, thuế, thưởng, so sánh nhà
          cung cấp. Cùng xem vì sao một câu “Hãy suy nghĩ từng bước” lại thay
          đổi hoàn toàn cuộc chơi.
        </p>
      </PredictionGate>

      {/* ============ BƯỚC 2 — ẨN DỤ ============ */}
      <p>
        Hãy nhớ thời đi học: cô giáo luôn dặn{" "}
        <strong>“trình bày bài giải, đừng chỉ viết mỗi đáp án”</strong>. Em
        nào nhảy thẳng đến kết quả cuối rất hay sai ở bài nhiều bước, còn em
        nào chịu khó viết từng dòng lại thường đúng, dù chưa phải giỏi nhất.
        Chain-of-Thought làm đúng việc đó với AI: yêu cầu AI
        <strong> viết nháp</strong> trước khi kết luận.
      </p>
      <p>
        Một cách so sánh khác: khi luật sư tranh luận trước toà, họ
        <strong> không</strong> nhảy thẳng đến câu “thân chủ tôi vô tội”.
        Họ dẫn dắt từng mắt xích — chứng cứ A, nhân chứng B, tình tiết C —
        rồi mới chốt. Nhờ đó toà (và cả chính họ) có cơ hội phát hiện chỗ
        lỏng lẻo trước khi quyết định. AI cũng vậy: càng đi qua nhiều mắt
        xích đúng, xác suất đáp án cuối đúng càng cao.
      </p>
      <p>
        Trong công việc văn phòng, “nhiều mắt xích” xuất hiện ở khắp nơi:
        tính công nợ qua nhiều kỳ, so sánh 3 hợp đồng, viết báo cáo nhiều đề
        mục, lên lịch họp có ràng buộc. Bạn càng ép AI trình bày nháp, mức
        kiểm soát của bạn càng cao — và sai sót giảm rõ rệt.
      </p>

      {/* ============ BƯỚC 3 — TRỰC QUAN HÓA ============ */}
      <VisualizationSection topicSlug={metadata.slug}>
        <LessonSection label="Demo 1 — Nhanh vs. nháp kỹ" step={1}>
          <DemoStepBadge
            step={1}
            total={3}
            labels={[
              "So sánh câu trả lời trực tiếp vs. từng bước",
              "Tự xếp các bước suy luận",
              "Hai mẫu prompt cho cùng một câu hỏi",
            ]}
          />
          <p className="mb-3 text-sm text-muted leading-relaxed">
            Cùng một câu hỏi, bật giữa hai chế độ “câu trả lời trực tiếp” và
            “suy nghĩ từng bước”. Bạn sẽ thấy một pattern rất rõ: kiểu trả
            lời nhanh hay sai ở những tình huống nhiều bước thường gặp.
          </p>
          <DirectVsStepDemo />
          <Callout variant="tip" title="Thử đổi tab ở trên">
            Bấm ba tình huống “Khuyến mãi chồng”, “Sắp phòng họp”, “Hoàn thuế
            VAT” rồi toggle giữa hai chế độ. AI đều sai khi trả lời nhanh và
            đều đúng khi được “nháp”.
          </Callout>
        </LessonSection>

        <LessonSection label="Demo 2 — Bạn tự xếp các bước" step={2}>
          <DemoStepBadge
            step={2}
            total={3}
            labels={[
              "So sánh câu trả lời trực tiếp vs. từng bước",
              "Tự xếp các bước suy luận",
              "Hai mẫu prompt cho cùng một câu hỏi",
            ]}
          />
          <p className="mb-3 text-sm text-muted leading-relaxed">
            Tình huống: bạn được sếp giao so sánh ba nhà cung cấp A, B, C rồi
            đề xuất chọn một bên. Các bước dưới đây đang bị xáo. Hãy kéo thả
            để xếp lại đúng thứ tự một chuỗi suy luận lành mạnh.
          </p>
          <Reorderable
            instruction="Kéo thả để sắp xếp 5 bước so sánh nhà cung cấp theo thứ tự đúng."
            items={[
              "Chốt chọn một nhà cung cấp và viết lý do",
              "Liệt kê các tiêu chí quan trọng cho tình huống của mình",
              "Chấm điểm từng nhà cung cấp trên từng tiêu chí",
              "Cộng tổng điểm và xếp hạng ba nhà cung cấp",
              "Thu thập thông tin ba nhà cung cấp vào một bảng",
            ]}
            correctOrder={[4, 1, 2, 3, 0]}
          />
          <Callout variant="insight" title="Ghi nhớ">
            Một chuỗi suy luận tốt luôn đi từ{" "}
            <strong>thu thập → xác định tiêu chí → chấm điểm → tổng
              hợp → kết luận</strong>. Bạn có thể dán nguyên thứ tự này vào
            prompt để AI bám theo.
          </Callout>
        </LessonSection>

        <LessonSection label="Demo 3 — Hai mẫu prompt" step={3}>
          <DemoStepBadge
            step={3}
            total={3}
            labels={[
              "So sánh câu trả lời trực tiếp vs. từng bước",
              "Tự xếp các bước suy luận",
              "Hai mẫu prompt cho cùng một câu hỏi",
            ]}
          />
          <p className="mb-3 text-sm text-muted leading-relaxed">
            Cùng một câu hỏi tính phụ cấp. Chỉ cần thêm một câu dặn “hãy liệt
            kê từng khoản rồi cộng lại”, câu trả lời của AI đã kiểm được rõ
            ràng và bạn có thể đối chiếu với Excel trong 5 giây.
          </p>
          <PromptTemplateDemo />
        </LessonSection>
      </VisualizationSection>

      {/* ============ BƯỚC 4 — AHA ============ */}
      <AhaMoment>
        <strong>Chain-of-Thought không làm AI thông minh hơn — nó cho AI
        thời gian để suy nghĩ.</strong>{" "}
        Khi bạn bắt AI viết nháp từng bước, mỗi bước trung gian trở thành gợi
        ý cho bước tiếp theo. Cũng một mô hình đó, nhưng được phép trình bày
        lời giải, tỉ lệ đúng tăng rõ rệt — đặc biệt ở những việc văn phòng có
        nhiều mắt xích.
      </AhaMoment>

      {/* ============ BƯỚC 5 — INLINE CHALLENGE ============ */}
      <InlineChallenge
        question="Công việc nào SAU ĐÂY sẽ hưởng lợi NHIỀU NHẤT khi bạn thêm 'Hãy suy nghĩ từng bước' vào prompt?"
        options={[
          "Viết một câu chào đầu email cho sếp",
          "Tính tổng công tác phí một chuyến đi 3 ngày, có tỉ giá và thuế",
          "Đặt tên file báo cáo tháng",
          "Dịch câu 'Good morning' sang tiếng Việt",
        ]}
        correct={1}
        explanation="Tính công tác phí là việc nhiều bước: đổi tỉ giá, cộng từng ngày, cộng thuế — rất dễ sai. Ba việc còn lại chỉ một bước, CoT chỉ tốn thêm token chứ không cải thiện gì."
      />

      {/* ============ BƯỚC 6 — GIẢI THÍCH SÂU ============ */}
      <ExplanationSection topicSlug={metadata.slug}>
        <div className="space-y-3">
          <p>
            <strong>Chain-of-Thought</strong> là một kỹ thuật viết prompt —
            KHÔNG phải là một tính năng của AI. Bạn có thể áp dụng ngay với
            ChatGPT, Claude, Gemini hay bất cứ trợ lý AI nào bạn đang dùng mà
            không cần cài thêm gì. Chỉ là cách{" "}
            <TopicLink slug="prompt-engineering">đặt câu hỏi</TopicLink>{" "}
            khác đi một chút.
          </p>
          <p>
            Ý tưởng cốt lõi rất gọn: thay vì hỏi “Đáp án là gì?”, bạn yêu cầu
            AI <strong>viết nháp từng bước trước khi ra đáp án</strong>. Khi
            các bước trung gian hiện ra, bạn có thể đọc qua, phát hiện chỗ AI
            nhầm, và yêu cầu sửa — giống như đọc bài làm của một nhân viên
            thực tập.
          </p>
        </div>

        <StepReveal
          labels={[
            "Khi nào CoT toả sáng",
            "Khi nào đừng dùng CoT",
            "Ba mẫu prompt dành cho văn phòng",
          ]}
        >
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">
              Khi nào CoT toả sáng
            </p>
            <WhenToUseChart />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">
              Khi nào đừng dùng CoT
            </p>
            <Callout variant="warning" title="Đừng ép AI nháp ở việc một bước">
              Với câu hỏi tra cứu nhanh, chào hỏi, dịch câu ngắn — CoT không
              những không giúp, mà còn làm câu trả lời dài ra, tốn token và
              khiến bạn đọc mệt. Quy tắc ngón tay cái: nếu một người văn
              phòng làm việc đó trong 10 giây không cần viết nháp, thì AI
              cũng không cần.
            </Callout>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">
              Ba mẫu prompt dành cho văn phòng (copy và đổi số liệu)
            </p>
            <div className="space-y-3">
              {PROMPT_TEMPLATES.map((t) => (
                <PromptTemplateCard key={t.tag} template={t} />
              ))}
            </div>
          </div>
        </StepReveal>

        <div className="space-y-3 pt-2">
          <p>
            <strong>Hai biến thể bạn nên biết.</strong> Trong tài liệu AI
            tiếng Anh, người ta phân biệt hai cách dùng CoT phổ biến:
          </p>
          <ZeroVsFewShotDiagram />
        </div>

        <div className="space-y-3 pt-2">
          <p>
            <strong>Mức cải thiện cụ thể ra sao?</strong> Thí nghiệm công
            khai trên nhiều mô hình lớn (GPT, Claude, Gemini) đều cho thấy
            cùng một pattern: chỉ cần đổi cách hỏi, độ chính xác trên bài
            nhiều bước có thể tăng từ khoảng một phần ba lên hơn hai phần ba.
          </p>
          <AccuracyBars />
        </div>

        <div className="space-y-3 pt-2">
          <p>
            <strong>Ghép đôi thuật ngữ.</strong> Để ghi nhớ, hãy nối mỗi
            khái niệm bên trái với định nghĩa bên phải.
          </p>
          <MatchPairs
            instruction="Nối mỗi thuật ngữ với định nghĩa đúng — thực hành phản xạ trước khi vào quiz."
            pairs={[
              {
                left: "Chain-of-Thought",
                right:
                  "Kỹ thuật buộc AI trình bày nháp từng bước trước khi chốt đáp án",
              },
              {
                left: "Zero-shot CoT",
                right:
                  "Chỉ thêm câu 'Hãy suy nghĩ từng bước' vào cuối prompt, không kèm ví dụ mẫu",
              },
              {
                left: "Few-shot CoT",
                right:
                  "Cho AI thấy trước 1–2 ví dụ đã trình bày theo style bạn muốn",
              },
              {
                left: "Token",
                right:
                  "Đơn vị AI tính tiền và tính độ dài — càng nhiều chữ nháp thì càng tốn",
              },
            ]}
          />
        </div>

        <div className="space-y-3 pt-2">
          <p>
            <strong>Điền vào chỗ trống</strong> để chốt lại công thức viết
            prompt hiệu quả:
          </p>
          <FillBlank
            template="Để AI trả lời tốt hơn ở việc nhiều bước, hãy yêu cầu AI {bank1} rồi mới {bank2}, và tránh dùng kỹ thuật này cho câu hỏi {bank3}."
            blanks={[
              {
                id: "bank1",
                options: [
                  "trình bày từng bước",
                  "trả lời thật nhanh",
                  "trả lời bằng emoji",
                ],
                correct: 0,
              },
              {
                id: "bank2",
                options: [
                  "chốt đáp án cuối",
                  "gợi ý câu hỏi khác",
                  "thoát cuộc trò chuyện",
                ],
                correct: 0,
              },
              {
                id: "bank3",
                options: [
                  "nhiều bước ràng buộc",
                  "chỉ một bước đơn giản",
                  "chuyên môn khó",
                ],
                correct: 1,
              },
            ]}
          />
        </div>

        <Callout variant="warning" title="Cảnh báo chi phí – thời gian">
          Chain-of-Thought <strong>làm câu trả lời dài hơn</strong>, nên AI
          cũng tính nhiều token hơn (với bản trả phí) và đợi lâu hơn vài
          giây. Chỉ bật CoT cho những việc thực sự nhiều bước. Với câu hỏi
          đơn giản — cứ hỏi thẳng, AI sẽ trả nhanh và rẻ.
        </Callout>

        <div className="pt-2">
          <p>
            <strong>Trong thực tế.</strong> Một số công cụ AI đã tự bật chuỗi
            suy luận bên trong mà không cần bạn nhắc — ví dụ{" "}
            <TopicLink slug="chain-of-thought-in-reasoning-models">
              GPT-o1 và chế độ “Extended Thinking” của Claude
            </TopicLink>
            . Với các mô hình thường, bạn vẫn cần tự chủ động nhắc. Dù ở
            trường hợp nào, hiểu Chain-of-Thought giúp bạn biết lúc nào nên
            chờ AI “nháp kỹ” và lúc nào nên bảo AI “ngắn gọn thôi”.
          </p>
        </div>
      </ExplanationSection>

      {/* ============ BƯỚC 7 — TÓM TẮT ============ */}
      <MiniSummary
        title="Ghi nhớ 5 điều về Chain-of-Thought"
        points={[
          "Chain-of-Thought là cách ĐẶT CÂU HỎI — bắt AI viết nháp từng bước thay vì nhảy thẳng tới đáp án.",
          "Dùng khi việc có nhiều bước: lương thưởng, thuế, so sánh lựa chọn, lên lịch, báo cáo nhiều đề mục.",
          "Không dùng cho câu hỏi một bước như chào hỏi, tra cứu, dịch câu ngắn — sẽ tốn thời gian vô ích.",
          "Zero-shot CoT: thêm câu 'Hãy suy nghĩ từng bước'. Few-shot CoT: kèm 1–2 ví dụ mẫu theo đúng format bạn muốn.",
          "Đánh đổi: câu trả lời dài hơn, tốn token hơn, đợi lâu hơn — nhưng đúng hơn ở những việc nhiều mắt xích.",
        ]}
      />

      {/* ============ BƯỚC 8 — QUIZ ============ */}
      <QuizSection questions={quizQuestions} />
    </>
  );
}
