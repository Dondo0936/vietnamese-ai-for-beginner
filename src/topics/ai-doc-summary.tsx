"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  MessageSquare,
  PenLine,
  Send,
  ShieldCheck,
  Sparkles,
  Tags,
  Truck,
  Wand2,
} from "lucide-react";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  TopicLink,
  ToggleCompare,
  TabView,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "ai-doc-summary",
  title: "AI for Document Summaries",
  titleVi: "AI tóm tắt tài liệu dài, nắm ý chính trong 10 phút",
  description:
    "Rút điểm quan trọng và rủi ro từ báo cáo dài bằng AI, đủ nhanh để đọc trước một cuộc họp mà không cần đọc hết tài liệu.",
  category: "applied-ai",
  tags: ["summarization", "reports", "practical", "office"],
  difficulty: "beginner",
  relatedSlugs: ["ai-for-meeting-notes", "ai-for-writing", "hallucination"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

const SOURCE_DOCUMENT = `BÁO CÁO KẾT QUẢ KINH DOANH QUÝ 2 NĂM 2026 - CÔNG TY TNHH THƯƠNG MẠI ĐIỆN TỬ VIETSHOP

1. TỔNG QUAN KẾT QUẢ KINH DOANH
Trong quý 2 năm 2026, công ty ghi nhận doanh thu đạt 42 tỷ đồng, tăng trưởng so với quý 1. Lợi nhuận sau thuế đạt 3.8 tỷ đồng. Số lượng đơn hàng xử lý trong quý đạt 185.000 đơn, trung bình 2.050 đơn mỗi ngày. Tỷ lệ đơn hàng bị hoàn trả giảm xuống còn 4.2 phần trăm, thấp hơn mức 6.1 phần trăm của quý trước.

2. TÌNH HÌNH KÊNH BÁN HÀNG
Kênh Shopee tiếp tục là kênh đóng góp doanh thu lớn nhất, chiếm 52 phần trăm tổng doanh thu. Kênh TikTok Shop tăng trưởng mạnh nhất trong quý, đóng góp 28 phần trăm doanh thu. Kênh website riêng chỉ đóng góp 12 phần trăm, và Facebook đóng góp 8 phần trăm còn lại.

3. VẤN ĐỀ VẬN HÀNH KHO BÃI
Kho trung tâm tại Bình Dương gặp tình trạng quá tải vào giữa quý do lượng đơn tăng đột biến trong đợt khuyến mãi giữa năm. Thời gian xử lý đơn trung bình tăng từ 1.2 ngày lên 2.5 ngày trong giai đoạn cao điểm.

4. CHI PHÍ MARKETING VÀ HIỆU QUẢ
Chi phí marketing trong quý là 6.5 tỷ đồng, chiếm 15.5 phần trăm doanh thu. Chi phí thu hút một khách hàng mới trung bình là 85.000 đồng, giảm so với mức 110.000 đồng của quý trước.

5. RỦI RO VÀ THÁCH THỨC QUÝ 3
Ban lãnh đạo xác định ba rủi ro chính cho quý 3. Thứ nhất, chi phí vận chuyển có thể tăng do biến động giá nhiên liệu. Thứ hai, cạnh tranh giá trên TikTok Shop ngày càng gay gắt. Thứ ba, kho Bình Dương cần được mở rộng trước mùa cao điểm cuối năm.

6. KẾ HOẠCH HÀNH ĐỘNG QUÝ 3
Công ty đặt mục tiêu doanh thu quý 3 đạt 48 tỷ đồng, mở kho vệ tinh thứ hai tại miền Bắc, tăng ngân sách quảng cáo TikTok Shop thêm 20 phần trăm, và triển khai hệ thống quản lý kho bán tự động.`;

const REAL_REPLY_A = `Được. Bạn hãy tải lên tài liệu (PDF, Word, ảnh chụp, hoặc dán nội dung vào đây), tôi sẽ giúp bạn tóm tắt.
Bạn có thể cho biết thêm nếu muốn:
- Tóm tắt ngắn (5-10 ý chính)
- Tóm tắt chi tiết theo từng mục
- Rút ra kết luận, điểm quan trọng, số liệu
- Làm bản tóm tắt để học tập/thuyết trình/báo cáo
Gửi tài liệu là tôi xử lý ngay.`;

const REAL_REPLY_B = `Điểm quan trọng
- Shopee vẫn là kênh doanh thu lớn nhất với 52%, trong khi TikTok Shop tăng trưởng mạnh lên 28% tổng doanh thu.
- Hiệu quả marketing được cải thiện khi chi phí thu hút khách hàng mới giảm từ 110.000 xuống 85.000 đồng và công ty đặt mục tiêu doanh thu quý 3 là 48 tỷ đồng.

Rủi ro cần chú ý
- Kho Bình Dương có nguy cơ quá tải khi sản lượng tăng, từng khiến thời gian xử lý đơn kéo dài từ 1,2 lên 2,5 ngày trong cao điểm.
- Chi phí vận chuyển có thể tăng do biến động giá nhiên liệu và cạnh tranh giá trên TikTok Shop ngày càng gay gắt.`;

type DocType = "business" | "contract" | "research" | "legal";
type SummaryLength = "fiveLines" | "bySection";

const DOC_TYPES: { key: DocType; label: string; icon: React.ElementType }[] = [
  { key: "business", label: "Báo cáo kinh doanh", icon: FileText },
  { key: "contract", label: "Hợp đồng", icon: ShieldCheck },
  { key: "research", label: "Tài liệu nghiên cứu", icon: Sparkles },
  { key: "legal", label: "Biên bản pháp lý", icon: PenLine },
];

const SUMMARY_LENGTHS: { key: SummaryLength; label: string }[] = [
  { key: "fiveLines", label: "5 dòng" },
  { key: "bySection", label: "Theo mục" },
];

const SUMMARY_BANK: Record<DocType, Record<SummaryLength, string>> = {
  business: {
    fiveLines:
      "Doanh thu quý 2 đạt 42 tỷ đồng. Shopee chiếm 52%, TikTok Shop chiếm 28%. Chi phí thu hút khách hàng giảm còn 85.000 đồng. Rủi ro chính là kho Bình Dương quá tải và chi phí vận chuyển có thể tăng. Quý 3 đặt mục tiêu 48 tỷ đồng.",
    bySection:
      "Điểm chính: doanh thu, đơn hàng và hiệu quả marketing đều cải thiện. Kênh bán: Shopee vẫn lớn nhất, TikTok Shop tăng mạnh. Rủi ro: kho Bình Dương quá tải, chi phí vận chuyển và cạnh tranh giá. Hành động: mở kho miền Bắc và triển khai quản lý kho bán tự động.",
  },
  contract: {
    fiveLines:
      "Hợp đồng cần xem kỹ phạm vi công việc, phí, hạn thanh toán, điều khoản phạt và quyền chấm dứt. Điểm rủi ro là điều khoản mơ hồ về nghiệm thu. Cần hỏi lại phần trách nhiệm khi có chậm tiến độ.",
    bySection:
      "Phạm vi: liệt kê việc bên cung cấp phải làm. Thanh toán: kiểm tra mốc trả tiền và chứng từ. Rủi ro: phạt chậm, nghiệm thu không rõ, quyền đơn phương chấm dứt. Việc cần làm: đánh dấu điều khoản cần luật sư hoặc quản lý duyệt.",
  },
  research: {
    fiveLines:
      "Tài liệu nêu xu hướng nhu cầu tăng, nhóm khách hàng trẻ phản hồi tốt hơn, nhưng dữ liệu khảo sát còn hẹp. Rủi ro là kết luận có thể chưa đại diện cho toàn thị trường. Nên dùng như tín hiệu ban đầu, không dùng làm quyết định cuối.",
    bySection:
      "Mục tiêu: hiểu thị trường và hành vi khách. Phát hiện chính: nhu cầu tăng ở nhóm khách trẻ. Giới hạn: mẫu khảo sát nhỏ và thiếu dữ liệu vùng ngoài đô thị. Hành động: kiểm chứng bằng phỏng vấn thêm và số liệu bán hàng thật.",
  },
  legal: {
    fiveLines:
      "Biên bản ghi nhận các bên đã thống nhất một số điểm, nhưng còn mục chờ xác nhận. Rủi ro là cách diễn đạt có thể ảnh hưởng trách nhiệm pháp lý. Không nên chỉ dựa vào bản tóm tắt, cần đọc lại từng điều khoản quan trọng.",
    bySection:
      "Các điểm đã thống nhất: ghi theo từng bên và thời điểm. Điểm chưa rõ: trách nhiệm, thời hạn và bằng chứng đi kèm. Rủi ro: diễn giải sai nghĩa pháp lý. Việc cần làm: đối chiếu bản gốc và nhờ người có chuyên môn kiểm tra.",
  },
};

const GALLERY_CASES = [
  {
    label: "Báo cáo tài chính",
    icon: Tags,
    scenario:
      "Bạn có báo cáo quý với doanh thu, chi phí, lợi nhuận và kế hoạch kỳ tới.",
    output:
      "Điểm chính: doanh thu tăng nhưng chi phí vận hành cần theo dõi. Rủi ro: dòng tiền và chi phí vận chuyển. Hành động: kiểm lại số liệu lớn trước khi trình bày.",
  },
  {
    label: "Hợp đồng đối tác",
    icon: ShieldCheck,
    scenario:
      "Bạn cần đọc nhanh hợp đồng dịch vụ trước buổi gọi với nhà cung cấp.",
    output:
      "Điểm cần chú ý: phạm vi dịch vụ, mốc thanh toán, điều khoản phạt và quyền chấm dứt. Rủi ro: nghiệm thu chưa rõ, dễ tranh cãi khi bàn giao.",
  },
  {
    label: "Nghiên cứu thị trường",
    icon: Sparkles,
    scenario:
      "Team gửi tài liệu khảo sát dài, bạn cần biết khách hàng đang quan tâm điều gì.",
    output:
      "Điểm chính: khách hàng ưu tiên giá, tốc độ giao và đánh giá thật. Rủi ro: mẫu khảo sát nhỏ, cần đối chiếu với dữ liệu bán hàng nội bộ.",
  },
  {
    label: "Biên bản cổ đông",
    icon: MessageSquare,
    scenario:
      "Bạn cần nắm quyết định, tỷ lệ biểu quyết và các việc cần làm sau họp.",
    output:
      "Quyết định: giữ lại các nghị quyết đã thông qua, tỷ lệ biểu quyết và người phụ trách. Rủi ro: không được bỏ qua điều kiện hiệu lực hoặc hạn công bố.",
  },
  {
    label: "Đề xuất dự án",
    icon: Truck,
    scenario:
      "Một phòng ban gửi đề xuất mở kho mới, bạn cần tách lợi ích và rủi ro.",
    output:
      "Điểm chính: mở rộng kho giúp giảm tải và rút ngắn giao hàng. Rủi ro: chi phí triển khai, nhân sự vận hành và thời điểm trước mùa cao điểm.",
  },
];

const PROMPT_TEMPLATES = [
  {
    title: "A. Tóm tắt báo cáo kinh doanh",
    icon: FileText,
    body: "Bạn là trợ lý điều hành. Từ báo cáo dưới đây, rút ra 3 điểm quan trọng nhất, 2 rủi ro cần chú ý và 3 hành động nên làm tiếp. Chỉ dùng thông tin có trong tài liệu, không suy đoán thêm. Tài liệu: [dán nội dung].",
  },
  {
    title: "B. Tóm tắt hợp đồng",
    icon: ShieldCheck,
    body: "Bạn là trợ lý đọc hợp đồng. Tóm tắt tài liệu dưới đây thành: phạm vi công việc, nghĩa vụ mỗi bên, mốc thanh toán, điều khoản phạt và điểm cần hỏi lại. Chỉ dùng thông tin có trong tài liệu, không suy đoán thêm. Hợp đồng: [dán nội dung].",
  },
  {
    title: "C. Tóm tắt 5 dòng cho người bận",
    icon: Clock,
    body: "Tóm tắt tài liệu dưới đây trong đúng 5 dòng cho người sắp vào họp. Ưu tiên số liệu, quyết định, rủi ro và việc cần làm. Chỉ dùng thông tin có trong tài liệu, không suy đoán thêm. Tài liệu: [dán nội dung].",
  },
  {
    title: "D. Trích rủi ro và hành động cần làm",
    icon: AlertTriangle,
    body: "Đọc tài liệu dưới đây và chỉ trích ra 2 phần: rủi ro cần chú ý và hành động cần làm. Với mỗi ý, ghi bằng chứng ngắn từ tài liệu gốc. Chỉ dùng thông tin có trong tài liệu, không suy đoán thêm. Tài liệu: [dán nội dung].",
  },
];

function TextBox({
  label,
  text,
  tone = "neutral",
}: {
  label: string;
  text: string;
  tone?: "neutral" | "warn" | "success";
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-600 bg-emerald-50/70 dark:border-emerald-600 dark:bg-emerald-900/20"
      : tone === "warn"
        ? "border-amber-600 bg-amber-50/70 dark:border-amber-600 dark:bg-amber-900/20"
        : "border-border bg-surface";
  const Icon =
    tone === "success" ? CheckCircle2 : tone === "warn" ? AlertTriangle : FileText;

  return (
    <div className={`rounded-lg border p-4 ${toneClass}`}>
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-accent" />
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
          {label}
        </p>
      </div>
      <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
        {text}
      </p>
    </div>
  );
}

function SummaryBuilderDemo() {
  const [docType, setDocType] = useState<DocType>("business");
  const [length, setLength] = useState<SummaryLength>("fiveLines");

  const output = useMemo(
    () => SUMMARY_BANK[docType][length],
    [docType, length]
  );

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          1. Chọn loại tài liệu
        </p>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
          {DOC_TYPES.map((item) => {
            const Icon = item.icon;
            const selected = docType === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setDocType(item.key)}
                className={`rounded-xl border-2 p-3 text-left transition-colors ${
                  selected
                    ? "border-accent bg-accent-light text-foreground font-semibold"
                    : "border-border bg-card text-foreground hover:border-accent/40 hover:bg-surface"
                }`}
              >
                <Icon className="mb-2 h-5 w-5 text-accent" />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          2. Chọn độ dài tóm tắt
        </p>
        <div className="grid grid-cols-2 gap-2">
          {SUMMARY_LENGTHS.map((item) => {
            const selected = length === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setLength(item.key)}
                className={`rounded-xl border-2 px-4 py-3 text-left text-sm transition-colors ${
                  selected
                    ? "border-accent bg-accent-light text-foreground font-semibold"
                    : "border-border bg-card text-foreground hover:border-accent/40 hover:bg-surface"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          AI soạn mẫu luyện tập
        </p>
        <motion.div
          key={`${docType}-${length}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="rounded-xl border border-border bg-surface p-4"
        >
          <div className="mb-2 flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-accent" />
            <p className="text-sm font-semibold text-foreground">
              Mẫu tóm tắt để bạn kiểm lại
            </p>
          </div>
          <p className="text-sm leading-relaxed text-foreground">{output}</p>
        </motion.div>
      </div>
    </div>
  );
}

function SummaryUseCaseGalleryDemo() {
  return (
    <TabView
      tabs={GALLERY_CASES.map((item) => {
        const Icon = item.icon;
        return {
          label: item.label,
          content: (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-light text-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                    Tình huống luyện tập
                  </p>
                  <p className="text-sm text-foreground">{item.scenario}</p>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-surface p-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                  Mẫu đầu ra
                </p>
                <p className="text-sm leading-relaxed text-foreground">
                  {item.output}
                </p>
              </div>
            </div>
          ),
        };
      })}
    />
  );
}

export default function AiDocSummaryTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          "Bạn chỉ gõ cho AI: 'Tóm tắt giúp tôi tài liệu này' nhưng không dán tài liệu. Điều gì còn thiếu?",
        options: [
          "Tên phần mềm đọc PDF",
          "Tài liệu thật, vì AI không tự biết nội dung báo cáo",
          "Một câu chào trang trọng hơn",
          "Logo công ty trong prompt",
        ],
        correct: 1,
        explanation:
          "AI cần file, ảnh chụp hoặc nội dung được dán vào. Không có dữ liệu gốc, nó chỉ có thể hỏi lại hoặc viết rất chung.",
      },
      {
        question:
          "Trong lần thử thật, bản tóm tắt ghi thêm một con số phần trăm tăng trưởng không có trong báo cáo gốc. Đây là rủi ro gì?",
        options: [
          "AI trình bày quá ngắn",
          "AI tự suy ra số liệu không có trong tài liệu gốc",
          "AI dùng sai cỡ chữ",
          "AI tóm tắt quá nhiều rủi ro",
        ],
        correct: 1,
        explanation:
          "Số liệu không có trong tài liệu phải bị loại hoặc kiểm lại ngay. Với báo cáo kinh doanh, một con số sai có thể làm sai quyết định.",
      },
      {
        question: "Một tóm tắt trước cuộc họp nên ưu tiên cấu trúc nào?",
        options: [
          "Lời mở đầu dài và cảm nghĩ cá nhân",
          "Điểm quan trọng, rủi ro cần chú ý và hành động tiếp theo",
          "Toàn bộ tài liệu viết lại thành văn xuôi",
          "Chỉ liệt kê tiêu đề từng trang",
        ],
        correct: 1,
        explanation:
          "Người sắp vào họp cần biết điều gì quan trọng, rủi ro nằm ở đâu và nên làm gì tiếp.",
      },
      {
        question: "Khi nào KHÔNG nên tin bản tóm tắt AI một cách mù quáng?",
        options: [
          "Khi tài liệu có số liệu tài chính dùng cho quyết định lớn",
          "Khi bạn chỉ cần đọc lướt email nội bộ ít rủi ro",
          "Khi tài liệu rất ngắn và đã rõ",
          "Khi bạn chỉ luyện prompt mẫu",
        ],
        correct: 0,
        explanation:
          "Tài liệu tài chính, pháp lý hoặc bảo mật cần đối chiếu bản gốc kỹ. AI có thể giúp đọc nhanh, nhưng không thay bước kiểm chứng.",
      },
      {
        type: "fill-blank",
        question:
          "Prompt tốt nên yêu cầu AI chỉ dùng thông tin có trong {blank} và không {blank} thêm.",
        blanks: [
          { answer: "tài liệu", accept: ["tai lieu", "tài liệu gốc", "tai lieu goc"] },
          { answer: "suy đoán", accept: ["suy doan", "đoán", "doan"] },
        ],
        explanation:
          "Câu này giảm rủi ro AI tự lấp khoảng trống bằng thông tin nghe có vẻ hợp lý.",
      },
      {
        question:
          "Sau khi nhận bản tóm tắt có nhiều số liệu, bước kiểm quan trọng nhất là gì?",
        options: [
          "Đổi sang giọng văn trang trọng",
          "Đối chiếu các số liệu chính với tài liệu gốc trước khi dùng",
          "Yêu cầu AI thêm ví dụ cho hay hơn",
          "Xóa hết số liệu khỏi tài liệu",
        ],
        correct: 1,
        explanation:
          "Số liệu là phần dễ gây hậu quả nhất nếu sai. Hãy kiểm doanh thu, tỷ lệ, ngày tháng và tên bên liên quan.",
      },
      {
        question: "Giá trị chính của AI khi đọc tài liệu dài là gì?",
        options: [
          "Thay bạn chịu trách nhiệm về quyết định",
          "Lọc đúng phần bạn hỏi từ tài liệu dài để bạn kiểm nhanh hơn",
          "Tự ký hợp đồng thay bạn",
          "Luôn hiểu đúng phần quan trọng nhất mà không cần hướng dẫn",
        ],
        correct: 1,
        explanation:
          "AI mạnh ở việc lọc và sắp xếp. Bạn vẫn cần nói rõ tiêu chí quan trọng và kiểm lại các điểm nhạy cảm.",
      },
    ],
    []
  );

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Thử đoán">
        <PredictionGate
          question="Một báo cáo kinh doanh dài 6 mục, nhiều số liệu. Đọc hết và tự rút điểm quan trọng mất khoảng 20-30 phút. AI có thể rút thời gian này xuống còn khoảng bao nhiêu nếu bạn hỏi đúng?"
          options={[
            "Còn vài phút để AI lọc ý chính, sau đó bạn kiểm lại số liệu quan trọng",
            "Vẫn luôn mất đúng 20-30 phút vì AI chỉ gõ lại từng câu",
            "Còn 0 phút vì AI tự chịu trách nhiệm thay bạn",
            "Chỉ nhanh hơn nếu tài liệu không có con số nào",
          ]}
          correct={0}
          explanation="AI không có giá trị vì đọc nhanh hơn con người theo nghĩa thần kỳ. Giá trị là nó lọc đúng phần bạn yêu cầu, như điểm quan trọng và rủi ro, để bạn tập trung kiểm phần cần dùng."
        >
          <p className="mt-4 text-sm text-muted">
            Tài liệu dài không đáng sợ nhất ở số trang. Điều khó là biết phần
            nào cần đọc trước cuộc họp.
          </p>
        </PredictionGate>
      </LessonSection>

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Góc nhìn">
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-light">
              <PenLine className="h-6 w-6 text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold text-foreground">
                AI tóm tắt tài liệu giống một trợ lý đọc trước báo cáo dài.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                Trợ lý này có thể báo lại đúng phần bạn cần. Nhưng nếu bạn
                không nói rõ cần điểm quan trọng, rủi ro hay hành động, nó có
                thể chọn sai trọng tâm.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 pt-2 md:grid-cols-3">
            <div className="rounded-lg bg-surface p-3">
              <FileText className="mb-1 h-5 w-5 text-accent" />
              <p className="text-sm font-semibold text-foreground">
                Bạn đưa tài liệu
              </p>
              <p className="text-xs text-muted">
                File, ảnh chụp hoặc nội dung dán đủ rõ để AI có dữ liệu gốc.
              </p>
            </div>
            <div className="rounded-lg bg-surface p-3">
              <Wand2 className="mb-1 h-5 w-5 text-accent" />
              <p className="text-sm font-semibold text-foreground">
                AI lọc và tóm tắt
              </p>
              <p className="text-xs text-muted">
                Chỉ lấy phần bạn yêu cầu như số liệu, rủi ro và việc cần làm.
              </p>
            </div>
            <div className="rounded-lg bg-surface p-3">
              <ShieldCheck className="mb-1 h-5 w-5 text-accent" />
              <p className="text-sm font-semibold text-foreground">
                Bạn kiểm số liệu trước khi dùng
              </p>
              <p className="text-xs text-muted">
                Đối chiếu bản gốc, nhất là số tiền, tỷ lệ, ngày tháng và cam kết.
              </p>
            </div>
          </div>
        </div>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-8">
            <div>
              <h3 className="mb-1 text-base font-semibold text-foreground">
                Demo 1, tài liệu 6 mục trước cuộc họp
              </h3>
              <p className="mb-4 text-sm text-muted">
                Không có tài liệu thật, AI không tự biết nội dung báo cáo.
              </p>
              <div className="mb-4">
                <TextBox
                  label="Tài liệu nguồn"
                  text={SOURCE_DOCUMENT}
                />
              </div>
              <ToggleCompare
                labelA="AI hỏi lại vì chưa có tài liệu"
                labelB="Tóm tắt đúng 2 phần cần, có số liệu thật"
                description="Một bên chỉ có yêu cầu mơ hồ, một bên có tài liệu thật và prompt đủ rõ."
                childA={
                  <TextBox
                    label="Reply A thật"
                    text={REAL_REPLY_A}
                    tone="warn"
                  />
                }
                childB={
                  <TextBox
                    label="Reply B thật, đã bỏ một bullet có số liệu không kiểm chứng"
                    text={REAL_REPLY_B}
                    tone="success"
                  />
                }
              />
            </div>

            <div>
              <h3 className="mb-1 text-base font-semibold text-foreground">
                Demo 2, chọn loại tài liệu và độ dài tóm tắt
              </h3>
              <p className="mb-4 text-sm text-muted">
                Đây là công cụ luyện tập. Các mẫu không lấy từ tài liệu thật,
                trừ báo cáo kinh doanh ở Demo 1.
              </p>
              <SummaryBuilderDemo />
            </div>

            <div>
              <h3 className="mb-1 text-base font-semibold text-foreground">
                Demo 3, kho tình huống tóm tắt tài liệu
              </h3>
              <p className="mb-4 text-sm text-muted">
                Nhấp từng tab để xem cách tóm tắt thay đổi theo loại tài liệu.
              </p>
              <SummaryUseCaseGalleryDemo />
            </div>

            <Callout variant="tip" title="Ba quan sát khi thử các demo">
              <ol className="list-inside list-decimal space-y-1 text-sm">
                <li>Không có tài liệu thật, AI chỉ có thể hỏi lại hoặc viết chung chung.</li>
                <li>Cùng một tài liệu có thể tóm tắt khác nhau tùy mục tiêu họp.</li>
                <li>Số liệu trong bản tóm tắt cần được đối chiếu trước khi dùng.</li>
              </ol>
            </Callout>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          Giá trị chính không phải AI đọc nhanh hơn bạn, mà AI lọc đúng phần bạn
          cần như điểm quan trọng và rủi ro thay vì đọc tuần tự từ đầu. Nhưng AI
          có thể tự suy ra số liệu không có trong tài liệu gốc nếu bạn không yêu
          cầu rõ chỉ dùng thông tin có trong tài liệu. Vì vậy, số liệu phải được
          kiểm lại luôn.
        </AhaMoment>
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <div className="mb-6">
          <TextBox
            label="Reply A thật, khi người dùng hỏi quá mơ hồ"
            text={REAL_REPLY_A}
          />
        </div>

        <InlineChallenge
          question="Một câu mơ hồ như 'Tóm tắt giúp tôi tài liệu này' nhưng không dán nội dung đang thiếu gì?"
          options={[
            "Tài liệu thật, vì AI không tự bịa nội dung báo cáo",
            "Một câu yêu cầu bằng tiếng Anh",
            "Tên người sẽ dự họp",
            "Một lời cảm ơn ở cuối prompt",
          ]}
          correct={0}
          explanation="AI cần file, ảnh chụp hoặc nội dung dán vào. Nếu thiếu tài liệu, nó không có dữ kiện để tóm tắt."
        />

        <div className="mt-6">
          <InlineChallenge
            question="Bản tóm tắt AI viết có một con số phần trăm không xuất hiện trong tài liệu gốc. Cách xử lý đúng là gì?"
            options={[
              "Gửi luôn vì bản tóm tắt nhìn có cấu trúc",
              "Luôn đối chiếu số liệu với tài liệu gốc và yêu cầu AI chỉ dùng thông tin có trong tài liệu",
              "Chỉ đổi sang giọng văn trang trọng hơn",
              "Xóa tên công ty khỏi bản tóm tắt là đủ",
            ]}
            correct={1}
            explanation="Một số liệu nghe hợp lý vẫn có thể sai nếu tài liệu gốc không nêu. Prompt nên chặn suy đoán từ đầu, và người dùng phải kiểm lại trước khi dùng."
          />
        </div>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Hiểu sâu hơn">
        <ExplanationSection>
          <div>
            <h3 className="mb-3 text-base font-semibold text-foreground">
              Công cụ tóm tắt tài liệu phổ biến cho dân văn phòng VN
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[
                {
                  name: "ChatGPT free",
                  useFor: "Dán nội dung thủ công, yêu cầu tóm tắt theo mục và kiểm lại số liệu.",
                  icon: MessageSquare,
                },
                {
                  name: "Google NotebookLM",
                  useFor: "Làm việc với tài liệu dài hoặc nhiều nguồn cần hỏi đáp lại.",
                  icon: FileText,
                },
                {
                  name: "Microsoft Copilot",
                  useFor: "Tóm tắt trong luồng Word, Outlook hoặc tài liệu nội bộ của công ty.",
                  icon: Sparkles,
                },
                {
                  name: "OCR cộng AI",
                  useFor: "Chuyển tài liệu scan thành chữ trước khi đưa vào AI để tóm tắt.",
                  icon: Wand2,
                },
              ].map((tool) => {
                const Icon = tool.icon;
                return (
                  <div
                    key={tool.name}
                    className="space-y-2 rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-accent" />
                      <p className="text-sm font-semibold text-foreground">
                        {tool.name}
                      </p>
                    </div>
                    <p className="text-xs text-foreground">
                      <strong>Dùng cho:</strong> {tool.useFor}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="mb-3 text-base font-semibold text-foreground">
              Vòng lặp 4 bước: có tài liệu, AI tóm tắt, bạn kiểm, dùng trong họp
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              {[
                { label: "1. Có tài liệu thật", desc: "PDF, Word, ảnh chụp hoặc nội dung dán vào.", icon: FileText },
                { label: "2. AI tóm tắt theo yêu cầu", desc: "Nêu rõ cần điểm chính, rủi ro và hành động.", icon: Wand2 },
                { label: "3. Bạn đối chiếu số liệu", desc: "Kiểm doanh thu, tỷ lệ, ngày tháng và tên bên liên quan.", icon: ShieldCheck },
                { label: "4. Dùng trong họp hoặc báo cáo", desc: "Chỉ dùng sau khi các điểm nhạy cảm đã được kiểm.", icon: Send },
              ].map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.label}
                    className="space-y-2 rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-accent" />
                      <p className="text-sm font-semibold text-foreground">
                        {step.label}
                      </p>
                    </div>
                    <p className="text-xs text-muted">{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="mb-3 text-base font-semibold text-foreground">
              4 cái bẫy thường gặp
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[
                {
                  title: "AI tự suy ra số liệu không có trong tài liệu gốc",
                  desc: "Bẫy nguy hiểm nhất. Trong một lần thử thật, bản tóm tắt ghi thêm một con số phần trăm tăng trưởng không có trong báo cáo gốc.",
                  fix: "Yêu cầu chỉ dùng thông tin có trong tài liệu và kiểm lại mọi số liệu trước khi dùng.",
                },
                {
                  title: "Bỏ sót rủi ro quan trọng",
                  desc: "Nếu bạn chỉ yêu cầu tóm tắt chung, AI có thể ưu tiên điểm sáng và bỏ qua phần rủi ro.",
                  fix: "Ghi rõ cần trích riêng rủi ro, thách thức và bằng chứng trong tài liệu.",
                },
                {
                  title: "Tóm tắt quá chung chung",
                  desc: "Tài liệu dài nhưng prompt không giới hạn số ý khiến đầu ra giống lời giới thiệu hơn là bản dùng được.",
                  fix: "Yêu cầu số lượng cụ thể như 3 điểm chính, 2 rủi ro, 3 hành động.",
                },
                {
                  title: "Nhầm số liệu giữa các mục",
                  desc: "Tài liệu có nhiều bảng tương tự nhau dễ làm AI trộn tỷ lệ, mốc thời gian hoặc tên hạng mục.",
                  fix: "Yêu cầu nêu bằng chứng ngắn và đối chiếu lại với bản gốc.",
                },
              ].map((pitfall) => (
                <div
                  key={pitfall.title}
                  className="space-y-2 rounded-xl border border-amber-600 bg-amber-50/70 p-4 dark:border-amber-600 dark:bg-amber-900/20"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-700 dark:text-amber-200" />
                    <p className="text-sm font-semibold text-foreground">
                      {pitfall.title}
                    </p>
                  </div>
                  <p className="text-xs leading-relaxed text-foreground">
                    {pitfall.desc}
                  </p>
                  <p className="text-xs leading-relaxed text-foreground">
                    <strong>Cách tránh:</strong> {pitfall.fix}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="mb-3 text-base font-semibold text-foreground">
              4 khuôn prompt copy được ngay
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {PROMPT_TEMPLATES.map((template) => {
                const Icon = template.icon;
                return (
                  <div
                    key={template.title}
                    className="space-y-2 rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-accent" />
                      <p className="text-sm font-semibold text-foreground">
                        {template.title}
                      </p>
                    </div>
                    <p className="rounded bg-surface p-2 font-mono text-xs leading-relaxed text-foreground">
                      {template.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <Callout variant="insight" title="Vẫn là bản giao việc 5 phần">
            Bài này nối tiếp{" "}
            <TopicLink slug="ai-for-meeting-notes">AI viết biên bản họp</TopicLink>{" "}
            và{" "}
            <TopicLink slug="ai-for-writing">AI hỗ trợ viết</TopicLink>
            : vai trò, nhiệm vụ, bối cảnh, định dạng và giọng văn. Với tài
            liệu dài, thêm một câu cực quan trọng là chỉ dùng thông tin có trong
            tài liệu, không suy đoán thêm.
          </Callout>

          <Callout variant="warning" title="Khi KHÔNG nên để AI tự tóm tắt">
            Không nên để AI tự tóm tắt rồi dùng ngay với hợp đồng pháp lý cần
            đọc từng điều khoản, tài liệu có số liệu tài chính dùng để ra quyết
            định lớn, hoặc tài liệu có thông tin bảo mật không nên dán vào công
            cụ AI công cộng.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ khi dùng AI tóm tắt tài liệu dài"
          points={[
            "AI cần tài liệu thật, không thể tự biết nội dung báo cáo nếu bạn không dán hoặc tải lên.",
            "Prompt tốt nói rõ vai trò, nhiệm vụ, bối cảnh, định dạng và giọng văn.",
            "Với tài liệu kinh doanh, hãy yêu cầu tách điểm quan trọng và rủi ro cần chú ý.",
            "Luôn thêm câu chỉ dùng thông tin có trong tài liệu, không suy đoán thêm.",
            "Số liệu, ngày tháng, tên bên liên quan và cam kết phải được đối chiếu với bản gốc.",
            "Không dùng bản tóm tắt AI chưa kiểm cho tài liệu pháp lý, tài chính lớn hoặc dữ liệu bảo mật.",
          ]}
        />

        <div className="mt-4 space-y-2 rounded-xl border border-border bg-card p-5">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            Khám phá thêm
          </h4>
          <p className="text-sm leading-relaxed text-muted">
            Muốn biến nội dung họp thành việc cần làm? Xem{" "}
            <TopicLink slug="ai-for-meeting-notes">AI viết biên bản họp</TopicLink>.
            Muốn luyện cách giao việc cho AI rõ hơn? Xem{" "}
            <TopicLink slug="ai-for-writing">AI hỗ trợ viết</TopicLink>.
          </p>
        </div>
      </LessonSection>

      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
