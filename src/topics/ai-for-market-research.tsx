"use client";

import { useMemo, useState, type ElementType, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CakeSlice,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Coffee,
  Home,
  ListChecks,
  MapPin,
  Search,
  Shirt,
  ShieldCheck,
  Sparkles,
  Utensils,
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
  slug: "ai-for-market-research",
  title: "AI for Market Research",
  titleVi: "Khảo sát đối thủ trong 1 buổi tối bằng AI",
  description:
    "Dùng AI so sánh giá, mô hình và điểm yếu của đối thủ rồi chỉ ra khoảng trống thị trường, kèm danh sách con số bạn phải tự kiểm chứng trước khi tin.",
  category: "applied-ai",
  tags: ["market-research", "small-business", "practical", "startup"],
  difficulty: "beginner",
  relatedSlugs: ["sentiment-analysis-in-brand-monitoring", "ai-for-writing", "getting-started-with-ai"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

const PROMPT_V =
  "Tôi sắp mở quán cà phê nhỏ, phân tích đối thủ cạnh tranh giúp tôi";

const REAL_REPLY_A = `Để phân tích đối thủ cạnh tranh chính xác, mình cần biết vài thông tin cụ thể, vì "đối thủ" của một quán cà phê phụ thuộc rất nhiều vào vị trí và phân khúc (một quán take-away giá rẻ và một quán cà phê sân vườn sẽ có tập đối thủ hoàn toàn khác nhau, dù ở cùng khu vực).`;

const PROMPT_S = `Bạn là chuyên gia nghiên cứu thị trường F&B tại Việt Nam.
Nhiệm vụ: so sánh 3 chuỗi cà phê Highlands Coffee, Phúc Long và The Coffee House về giá đồ uống phổ biến, mô hình phục vụ và điểm mạnh điểm yếu, rồi chỉ ra khoảng trống mà một quán nhỏ mới mở có thể khai thác.
Bối cảnh: tôi sắp mở quán cà phê take-away khoảng 30m2 gần khu văn phòng ở TP.HCM, ngân sách 300 triệu, chưa có kinh nghiệm F&B.
Định dạng: một bảng so sánh ngắn, sau đó 5 gạch đầu dòng về khoảng trống thị trường, cuối cùng 3 con số tôi cần tự kiểm chứng trước khi tin.
Giọng văn: thẳng thắn, cụ thể, không lý thuyết suông.`;

interface ComparisonRow {
  criterion: string;
  highlands: string;
  phucLong: string;
  coffeeHouse: string;
}

const COMPARISON_ROWS: readonly ComparisonRow[] = [
  {
    criterion: "Giá phổ biến",
    highlands: "Phin sữa đá 29-45k, PhinDi 45-55k, trần ~75k",
    phucLong: "Trà sữa/cà phê phin 30-70k (tùy size S/M/L)",
    coffeeHouse: "Cà phê Việt 29-39k, cà phê máy/cold brew 40-62k",
  },
  {
    criterion: "Mô hình phục vụ",
    highlands:
      "Quán ngồi tại vị trí đắc địa (chân cao ốc VP, TTTM), phục vụ nhanh nhưng vẫn có chỗ ngồi",
    phucLong:
      "Kiosk trong TTTM/siêu thị WinMart + quán riêng, tối ưu bán mang đi",
    coffeeHouse:
      "Quán \"không gian thứ ba\" để làm việc/học, phục vụ chậm hơn vì trải nghiệm ngồi lâu",
  },
  {
    criterion: "Điểm yếu",
    highlands:
      "Vừa tăng giá 10-15% gần đây, dễ bị so sánh \"đắt hơn không đáng\"",
    phucLong:
      "Cà phê không phải thế mạnh cốt lõi, không gian ngồi hạn chế hơn Highlands/TCH",
    coffeeHouse:
      "Chi phí mặt bằng lớn (không gian rộng), tốc độ ra món chậm hơn nếu khách chỉ cần mua nhanh",
  },
];

const HONESTY_CAVEAT =
  "Giá lấy từ các trang tổng hợp/blog, không phải menu chính thức niêm yết tại quầy. Xem phần cần kiểm chứng bên dưới.";

const MARKET_GAP = `Đứng giữa cà phê vỉa hè (15-25k) và chuỗi (29-75k): nhóm khách văn phòng thu nhập trung bình-khá thường thấy chuỗi hơi đắt cho việc uống hàng ngày nhưng muốn chất lượng hơn cà phê vỉa hè. Định vị "chất lượng gần bằng chuỗi, giá gần bằng vỉa hè, tốc độ nhanh hơn cả hai" là khoảng trống rõ nhất.`;

const VERIFY_NUMBERS = `1. Giá thuê mặt bằng thực tế/m² tại khu vực cụ thể bạn nhắm: chỉ đi khảo sát trực tiếp hoặc hỏi môi giới địa phương, không tin số liệu chung chung trên mạng vì chênh lệch giữa các tuyến đường có thể gấp 2-3 lần.
2. Lượng khách văn phòng đi ngang/đi bộ qua vị trí vào giờ cao điểm sáng và chiều: tự đứng đếm 3-5 buổi sáng liên tiếp, đây là số quyết định quán có đủ khách để hòa vốn với ngân sách 300 triệu hay không.
3. Giá vốn nguyên liệu thực tế/ly (cà phê, sữa, ly, ống hút) từ nhà cung cấp bạn sẽ dùng: các con số biên lợi nhuận trên blog thường là ước tính chung, không phản ánh giá sỉ thật bạn sẽ trả, cần báo giá trực tiếp từ nhà cung cấp trước khi lên kế hoạch tài chính.`;

const PROMPT_F =
  "Trong 5 khoảng trống đó, khoảng trống nào làm được với ngân sách 300 triệu? Xếp theo chi phí từ thấp đến cao.";

const REAL_REPLY_C_HEAD = `Xếp theo chi phí thực hiện, từ thấp đến cao (trong ngân sách 300 triệu):
1. Định vị giá giữa vỉa hè và chuỗi, chi phí: gần bằng 0`;

const REAL_REPLY_C_TAIL =
  "Gợi ý thực tế: với 300 triệu, ưu tiên làm tốt mục 1-3 trước (gần như không tốn thêm vốn, chỉ tốn kỷ luật vận hành), dùng mục 4 để tạo dòng tiền ổn định sau 1-2 tháng đầu khi đã hiểu rõ lưu lượng khách thật, và chỉ cân nhắc mục 5 khi đã có số liệu thật về nhu cầu giao hàng. Đừng đầu tư nhân lực giao hàng dựa trên phỏng đoán.";

type ResearchView = "price" | "weakness" | "gap" | "verify";

const RESEARCH_VIEWS: {
  key: ResearchView;
  label: string;
  icon: ElementType;
}[] = [
  { key: "price", label: "Giá của đối thủ", icon: CircleDollarSign },
  { key: "weakness", label: "Điểm yếu của đối thủ", icon: BarChart3 },
  { key: "gap", label: "Khoảng trống thị trường", icon: Search },
  { key: "verify", label: "Con số phải tự kiểm chứng", icon: ClipboardCheck },
];

const BUSINESS_CASES = [
  {
    label: "Quán cà phê",
    icon: Coffee,
    scenario:
      "Bạn chuẩn bị mở một quán nhỏ gần khu văn phòng và muốn biết mình nên cạnh tranh bằng điều gì.",
    prompt: `Vai trò: Bạn là chuyên gia nghiên cứu thị trường F&B tại Việt Nam.
Nhiệm vụ: so sánh [các quán hoặc chuỗi trực tiếp] về giá, mô hình phục vụ, điểm mạnh và điểm yếu.
Bối cảnh: tôi dự định mở [mô hình quán], tại [khu vực], ngân sách [mức ngân sách], kinh nghiệm [mức kinh nghiệm].
Định dạng: bảng so sánh, các khoảng trống thị trường và danh sách số liệu cần tự kiểm chứng.
Giọng văn: thẳng thắn, cụ thể, không lý thuyết suông.`,
  },
  {
    label: "Shop quần áo online",
    icon: Shirt,
    scenario:
      "Bạn bán quần áo qua mạng và muốn tìm chỗ đứng khác với các shop đang nhắm cùng nhóm khách.",
    prompt: `Vai trò: Bạn là chuyên gia nghiên cứu thị trường thời trang bán lẻ tại Việt Nam.
Nhiệm vụ: so sánh [các shop trực tiếp] về nhóm sản phẩm, mức giá, cách bán hàng và điểm yếu.
Bối cảnh: tôi mở shop online bán [dòng sản phẩm] cho [nhóm khách], ngân sách [mức ngân sách].
Định dạng: bảng so sánh, các khoảng trống có thể thử và danh sách dữ liệu cần tự kiểm chứng.
Giọng văn: thực tế, dễ hành động, không dùng số liệu không rõ nguồn.`,
  },
  {
    label: "Tiệm bánh ngọt",
    icon: CakeSlice,
    scenario:
      "Bạn muốn mở tiệm bánh nhỏ và cần phân biệt nhu cầu mua tại chỗ, đặt trước và giao tận nơi.",
    prompt: `Vai trò: Bạn là chuyên gia nghiên cứu thị trường ngành bánh tại Việt Nam.
Nhiệm vụ: so sánh [các tiệm bánh trực tiếp] về sản phẩm chủ lực, mức giá, kênh bán và điểm yếu.
Bối cảnh: tôi dự định mở tiệm tại [khu vực], tập trung vào [nhóm sản phẩm], ngân sách [mức ngân sách].
Định dạng: bảng so sánh, các khoảng trống thị trường và các con số phải khảo sát trực tiếp.
Giọng văn: cụ thể, thận trọng, ưu tiên việc có thể kiểm chứng.`,
  },
  {
    label: "Dọn nhà theo giờ",
    icon: Home,
    scenario:
      "Bạn chuẩn bị bán dịch vụ theo giờ và muốn hiểu đối thủ khác nhau ở tốc độ, độ tin cậy và cách đặt lịch.",
    prompt: `Vai trò: Bạn là chuyên gia nghiên cứu thị trường dịch vụ gia đình tại Việt Nam.
Nhiệm vụ: so sánh [các dịch vụ trực tiếp] về phạm vi phục vụ, cách tính giá, quy trình đặt lịch và điểm yếu.
Bối cảnh: tôi cung cấp dịch vụ tại [khu vực], nhắm tới [nhóm khách], ngân sách [mức ngân sách].
Định dạng: bảng so sánh, các khoảng trống khả thi và danh sách dữ liệu cần gọi hỏi hoặc thử đặt dịch vụ.
Giọng văn: rõ ràng, thực dụng, không phỏng đoán số liệu.`,
  },
  {
    label: "Quán ăn trưa văn phòng",
    icon: Utensils,
    scenario:
      "Bạn muốn phục vụ bữa trưa cho dân văn phòng và cần hiểu điểm nghẽn về giá, tốc độ và giao hàng.",
    prompt: `Vai trò: Bạn là chuyên gia nghiên cứu thị trường F&B cho khu văn phòng.
Nhiệm vụ: so sánh [các quán ăn trực tiếp] về thực đơn, mức giá, tốc độ phục vụ, giao hàng và điểm yếu.
Bối cảnh: tôi dự định mở tại [khu vực], phục vụ [nhóm khách], ngân sách [mức ngân sách].
Định dạng: bảng so sánh, các khoảng trống thị trường và danh sách số liệu cần đo tại chỗ.
Giọng văn: ngắn, thẳng, tập trung vào quyết định vận hành.`,
  },
];

const PROMPT_TEMPLATES = [
  {
    title: "A. So sánh đối thủ trực tiếp",
    icon: Building2,
    body: "Bạn là chuyên gia nghiên cứu thị trường [ngành] tại Việt Nam. Nhiệm vụ: so sánh [các đối thủ] về [giá, mô hình, điểm mạnh, điểm yếu]. Bối cảnh: tôi sắp mở [mô hình] tại [khu vực], ngân sách [số tiền], kinh nghiệm [mức kinh nghiệm]. Định dạng: bảng ngắn, các khoảng trống và các con số cần tự kiểm chứng. Giọng văn: thẳng thắn, cụ thể.",
  },
  {
    title: "B. Tìm khoảng trống cho mô hình nhỏ",
    icon: Search,
    body: "Từ bảng so sánh trên, tìm các nhu cầu khách hàng chưa được phục vụ tốt mà một [mô hình nhỏ] có thể làm với [nguồn lực hiện có]. Với mỗi khoảng trống, nêu lý do, việc cần thử và dữ liệu tôi phải tự kiểm chứng.",
  },
  {
    title: "C. Xếp hạng cơ hội theo ngân sách",
    icon: CircleDollarSign,
    body: "Trong các khoảng trống trên, khoảng trống nào làm được với ngân sách [số tiền]? Xếp theo chi phí từ thấp đến cao. Nêu việc nào có thể thử trước và điều kiện để dừng nếu dữ liệu thật không ủng hộ.",
  },
  {
    title: "D. Lập danh sách số cần kiểm chứng",
    icon: ClipboardCheck,
    body: "Liệt kê các con số trong phân tích mà tôi không nên tin ngay. Với mỗi số, ghi cách tự kiểm chứng, nguồn cần hỏi và quyết định nào sẽ bị ảnh hưởng nếu số đó sai.",
  },
];

function TextCard({
  label,
  children,
  caveat = false,
}: {
  label: string;
  children: ReactNode;
  caveat?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        caveat
          ? "border-amber-600 bg-amber-50/70 dark:border-amber-600 dark:bg-amber-900/20"
          : "border-border bg-surface"
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        {caveat && (
          <AlertTriangle className="h-4 w-4 text-amber-700 dark:text-amber-200" />
        )}
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
          {label}
        </p>
      </div>
      <div className="text-sm leading-relaxed text-foreground">{children}</div>
    </div>
  );
}

function ComparisonTable({
  rows = COMPARISON_ROWS,
}: {
  rows?: readonly ComparisonRow[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="min-w-[780px] w-full border-collapse text-left text-xs">
        <thead className="bg-accent-light text-foreground">
          <tr>
            <th className="border-b border-border p-3 font-semibold">Tiêu chí</th>
            <th className="border-b border-border p-3 font-semibold">Highlands Coffee</th>
            <th className="border-b border-border p-3 font-semibold">Phúc Long</th>
            <th className="border-b border-border p-3 font-semibold">The Coffee House</th>
          </tr>
        </thead>
        <tbody className="text-foreground">
          {rows.map((row) => (
            <tr key={row.criterion} className="border-b border-border last:border-b-0">
              <th className="bg-surface p-3 align-top font-semibold text-foreground">
                {row.criterion}
              </th>
              <td className="p-3 align-top leading-relaxed">{row.highlands}</td>
              <td className="p-3 align-top leading-relaxed">{row.phucLong}</td>
              <td className="p-3 align-top leading-relaxed">{row.coffeeHouse}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RealResultPicker() {
  const [view, setView] = useState<ResearchView>("price");

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Bạn muốn biết gì?
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {RESEARCH_VIEWS.map((item) => {
            const Icon = item.icon;
            const selected = view === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setView(item.key)}
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

      <motion.div
        key={view}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-3 rounded-xl border border-border bg-surface p-4"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <p className="text-sm font-semibold text-foreground">
            Khối thật từ câu trả lời của Claude
          </p>
        </div>
        {view === "price" && <ComparisonTable rows={[COMPARISON_ROWS[0]]} />}
        {view === "weakness" && <ComparisonTable rows={[COMPARISON_ROWS[2]]} />}
        {view === "gap" && (
          <p className="text-sm leading-relaxed text-foreground">{MARKET_GAP}</p>
        )}
        {view === "verify" && (
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
            {VERIFY_NUMBERS}
          </p>
        )}
      </motion.div>
    </div>
  );
}

function BusinessGallery() {
  return (
    <TabView
      tabs={BUSINESS_CASES.map((item) => {
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
                  Khuôn giao việc 5 phần
                </p>
                <p className="whitespace-pre-line font-mono text-xs leading-relaxed text-foreground">
                  {item.prompt}
                </p>
              </div>
            </div>
          ),
        };
      })}
    />
  );
}

export default function AiForMarketResearchTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          "Vì sao AI hỏi lại khi bạn chỉ nói 'phân tích đối thủ cạnh tranh giúp tôi'?",
        options: [
          "Vì AI chỉ nhận câu hỏi bằng tiếng Anh",
          "Vì đối thủ phụ thuộc vị trí và phân khúc nhưng bạn chưa đưa bối cảnh đó",
          "Vì AI không thể so sánh doanh nghiệp",
          "Vì câu hỏi chưa có bảng giá",
        ],
        correct: 1,
        explanation:
          "AI chỉ có những gì bạn gõ ra. Vị trí, phân khúc, mô hình và ngân sách quyết định tập đối thủ cần khảo sát.",
      },
      {
        question: "Bản giao việc 5 phần trong bài gồm những gì?",
        options: [
          "Vai trò, nhiệm vụ, bối cảnh, định dạng và giọng văn",
          "Tên quán, logo, màu sắc, khẩu hiệu và địa chỉ",
          "Giá, doanh thu, lợi nhuận, nhân sự và quảng cáo",
          "Câu hỏi, câu trả lời, hình ảnh, video và đường dẫn",
        ],
        correct: 0,
        explanation:
          "Năm phần giúp AI biết đang đóng vai ai, làm việc gì, dựa trên hoàn cảnh nào, trả theo dạng nào và dùng giọng ra sao.",
      },
      {
        question:
          "Vì sao nên yêu cầu AI nêu '3 con số cần tự kiểm chứng' ngay trong định dạng?",
        options: [
          "Để câu trả lời trông dài hơn",
          "Để AI tự sửa mọi số sai mà không cần bạn",
          "Để tách giả định dễ sai khỏi phần khung và biết mình phải khảo sát gì tiếp",
          "Để thay thế việc hỏi môi giới và nhà cung cấp",
        ],
        correct: 2,
        explanation:
          "Danh sách kiểm chứng biến sự thận trọng thành một phần của kết quả, giúp bạn biết giá thuê, lưu lượng khách và giá vốn nào cần đo thật.",
      },
      {
        question: "Rủi ro khi dùng ngay giá menu lấy từ blog là gì?",
        options: [
          "Blog luôn ghi giá thấp hơn thực tế",
          "Giá có thể cũ, sai hoặc không đúng điểm bán bạn đang khảo sát",
          "AI sẽ không thể tạo bảng",
          "Khách hàng sẽ biết bạn dùng AI",
        ],
        correct: 1,
        explanation:
          "Nguồn tổng hợp không thay menu niêm yết tại quầy. Hãy kiểm giá thật trước khi chốt định vị và giá bán.",
      },
      {
        question: "Bước nào KHÔNG thể giao cho AI?",
        options: [
          "Tạo khung bảng so sánh",
          "Gợi ý câu hỏi cần khảo sát",
          "Xếp các cơ hội theo ngân sách bạn cung cấp",
          "Đứng tại vị trí và đếm khách đi ngang vào giờ cao điểm",
        ],
        correct: 3,
        explanation:
          "AI làm việc với thông tin bạn đưa và nguồn công khai. Lưu lượng tại đúng vị trí phải được đo ngoài thực địa.",
      },
      {
        question:
          "Hỏi tiếp trong cùng hội thoại 'xếp theo chi phí từ thấp đến cao' để làm gì?",
        options: [
          "Để đổi toàn bộ ngành kinh doanh",
          "Để biến danh sách khoảng trống thành thứ tự hành động phù hợp ngân sách",
          "Để AI tự quyết định thuê mặt bằng",
          "Để bỏ qua bước kiểm chứng",
        ],
        correct: 1,
        explanation:
          "Câu hỏi tiếp nối giữ nguyên bối cảnh và buộc AI sắp xếp cơ hội theo giới hạn vốn thực tế của bạn.",
      },
      {
        type: "fill-blank",
        question:
          "AI làm phần {blank} trong vài phút, còn bạn tự {blank} số liệu thật.",
        blanks: [
          { answer: "khung", accept: ["Khung", "bộ khung", "bo khung"] },
          { answer: "kiểm chứng", accept: ["Kiểm chứng", "kiem chung", "kiểm tra", "kiem tra"] },
        ],
        explanation:
          "Kết quả tốt nhất là bộ khung gồm bảng so sánh, khoảng trống và danh sách số phải kiểm chứng. Quyết định thật vẫn dựa trên số liệu bạn tự kiểm chứng.",
      },
    ],
    []
  );

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Thử đoán">
        <div>
          <PredictionGate
            question="Bạn sắp mở quán hoặc bán hàng và gõ cho AI đúng một câu 'phân tích đối thủ cạnh tranh giúp tôi'. Điều gì nhiều khả năng xảy ra nhất?"
            options={[
              "AI đưa ngay bảng phân tích chính xác cho khu vực của bạn",
              "AI hỏi ngược lại vì chưa đủ bối cảnh",
              "AI từ chối vì không có dữ liệu",
              "AI chỉ trả lời lý thuyết marketing",
            ]}
            correct={1}
            explanation="AI chỉ có những gì bạn gõ ra. 'Đối thủ' phụ thuộc vị trí và phân khúc mà bạn chưa nói, nên hỏi lại là phản ứng hợp lý nhất."
          >
            <p className="mt-4 text-sm text-muted">
              Một câu hỏi lại không có nghĩa AI yếu. Nó cho thấy đầu việc đang
              thiếu dữ liệu để xác định đúng đối thủ.
            </p>
          </PredictionGate>
        </div>
      </LessonSection>

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Góc nhìn">
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-light">
              <Search className="h-6 w-6 text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold text-foreground">
                AI khảo sát thị trường giống một nhân viên nghiên cứu cực nhanh
                nhưng ngồi ở văn phòng.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                Nhân viên này tổng hợp nguồn công khai trong vài phút. Việc
                kiểm chứng thực tế, như đứng đếm khách và hỏi giá thuê thật,
                vẫn là của bạn.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 pt-2 md:grid-cols-3">
            <div className="rounded-lg bg-surface p-3">
              <ListChecks className="mb-1 h-5 w-5 text-accent" />
              <p className="text-sm font-semibold text-foreground">Bạn giao việc</p>
              <p className="text-xs text-muted">
                Nêu ngành, đối thủ, bối cảnh, ngân sách và kết quả mong muốn.
              </p>
            </div>
            <div className="rounded-lg bg-surface p-3">
              <Sparkles className="mb-1 h-5 w-5 text-accent" />
              <p className="text-sm font-semibold text-foreground">AI tổng hợp khung</p>
              <p className="text-xs text-muted">
                Gom thành bảng, khoảng trống và danh sách câu hỏi tiếp theo.
              </p>
            </div>
            <div className="rounded-lg bg-surface p-3">
              <MapPin className="mb-1 h-5 w-5 text-accent" />
              <p className="text-sm font-semibold text-foreground">Bạn kiểm chứng số</p>
              <p className="text-xs text-muted">
                Đi khảo sát, đếm khách và xin báo giá thật trước khi quyết định.
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
                Demo 1, Cùng một nhu cầu, hai cách giao việc
              </h3>
              <p className="mb-4 text-sm text-muted">
                Các khối dưới là trao đổi thật với Claude (trợ lý AI của
                Anthropic, có bản miễn phí). Một bên mất vòng hỏi lại, một bên
                ra bảng dùng được ngay.
              </p>
              <ToggleCompare
                labelA="Hỏi mơ hồ"
                labelB="Bản giao việc 5 phần"
                description="Cùng một nhu cầu, một bên mất vòng hỏi lại, một bên ra bảng dùng được ngay."
                childA={
                  <div className="space-y-3">
                    <TextCard label="Prompt V">
                      <p>{PROMPT_V}</p>
                    </TextCard>
                    <TextCard label="Câu trả lời thật">
                      <p>{REAL_REPLY_A}</p>
                    </TextCard>
                    <p className="text-sm leading-relaxed text-foreground">
                      Trong trao đổi thật, Claude tiếp tục hỏi khu vực và concept
                      trước khi phân tích.
                    </p>
                  </div>
                }
                childB={
                  <div className="space-y-3">
                    <TextCard label="Prompt S, bản giao việc 5 phần">
                      <p className="whitespace-pre-line font-mono text-xs leading-relaxed">
                        {PROMPT_S}
                      </p>
                    </TextCard>
                    <ComparisonTable />
                    <TextCard label="Ghi chú trung thực của Claude" caveat>
                      <p>{HONESTY_CAVEAT}</p>
                    </TextCard>
                  </div>
                }
              />
            </div>

            <div>
              <h3 className="mb-1 text-base font-semibold text-foreground">
                Demo 2, Chọn điều bạn muốn biết
              </h3>
              <p className="mb-4 text-sm text-muted">
                Mỗi lựa chọn chỉ đổi khối kết quả đang xem. Toàn bộ nội dung đầu
                ra đều lấy từ câu trả lời thật.
              </p>
              <RealResultPicker />
            </div>

            <div>
              <h3 className="mb-1 text-base font-semibold text-foreground">
                Demo 3, Khuôn giao việc cho nhiều mô hình nhỏ
              </h3>
              <p className="mb-4 text-sm text-muted">
                Đây là các khuôn luyện tập, không phải transcript đã được chụp.
                Chúng không đưa số liệu giả vào chỗ bạn phải tự khảo sát.
              </p>
              <BusinessGallery />
            </div>

            <div>
              <Callout variant="tip" title="Ba quan sát khi thử các demo">
                <ol className="list-inside list-decimal space-y-1 text-sm">
                  <li>Bản giao việc đổi kết quả nhiều hơn việc chỉ trông chờ AI thông minh.</li>
                  <li>Định dạng bảng, gạch đầu dòng và danh sách kiểm chứng quyết định độ dùng được.</li>
                  <li>AI tự thú nhận nguồn số liệu khi bạn yêu cầu chỉ ra chỗ cần kiểm chứng.</li>
                </ol>
              </Callout>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          AI không biết thị trường của bạn. Nó chỉ sắc bén đúng bằng bối cảnh
          bạn đưa. Kết quả tốt nhất của một buổi tối khảo sát bằng AI không phải
          câu trả lời cuối cùng, mà là <strong>bộ khung</strong>: bảng so sánh,
          khoảng trống và danh sách con số bạn phải tự đi kiểm chứng. AI làm
          phần khung trong vài phút, bạn tự kiểm chứng số liệu thật.
        </AhaMoment>
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="'Phân tích đối thủ cạnh tranh giúp tôi' thiếu gì khiến AI phải hỏi lại?"
          options={[
            "Vị trí hoặc khu vực, phân khúc hoặc concept và ngân sách, tức bối cảnh cụ thể",
            "Tên đầy đủ của người hỏi",
            "Một lời khen dành cho AI",
            "Một câu tiếng Anh ở cuối prompt",
          ]}
          correct={0}
          explanation="Đối thủ của một quán take-away và một quán sân vườn khác nhau ngay cả khi ở cùng khu vực. AI cần vị trí, phân khúc và giới hạn vốn để chọn đúng tập so sánh."
        />

        <div className="mt-6">
          <InlineChallenge
            question="AI đưa bảng giá đối thủ 29-75k. Bạn dùng ngay để định giá 18-25k mà không kiểm chứng. Rủi ro là gì?"
            options={[
              "Không có rủi ro vì AI đã trình bày thành bảng",
              "Số từ trang tổng hợp hoặc blog có thể cũ hay sai, phải kiểm giá thật tại quầy và giá vốn thật trước khi chốt",
              "Giá thấp hơn chuỗi luôn bảo đảm có lãi",
              "Chỉ cần hỏi lại AI xem có chắc không",
            ]}
            correct={1}
            explanation="Chính Claude ghi chú rằng giá đến từ nguồn tổng hợp, không phải menu chính thức. Giá bán chỉ nên chốt sau khi kiểm giá tại quầy và báo giá nguyên liệu thật."
          />
        </div>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Hiểu sâu hơn">
        <ExplanationSection>
          <div>
            <h3 className="mb-3 text-base font-semibold text-foreground">
              Công cụ có thể dùng để khảo sát bước đầu
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {[
                {
                  name: "Claude",
                  note: "Có bản miễn phí, là công cụ được dùng trong demo của bài này.",
                },
                {
                  name: "ChatGPT",
                  note: "Có thể dùng để tạo bảng so sánh và tiếp tục hỏi trong cùng hội thoại.",
                },
                {
                  name: "Gemini",
                  note: "Có thể dùng để dựng khung khảo sát và danh sách việc cần kiểm chứng.",
                },
              ].map((tool) => (
                <div
                  key={tool.name}
                  className="space-y-2 rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent" />
                    <p className="text-sm font-semibold text-foreground">{tool.name}</p>
                  </div>
                  <p className="text-xs leading-relaxed text-foreground">{tool.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="mb-3 text-base font-semibold text-foreground">
              Vòng lặp 4 bước cho một buổi tối khảo sát
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              {[
                {
                  label: "1. Giao việc 5 phần",
                  desc: "Nêu vai trò, nhiệm vụ, bối cảnh, định dạng và giọng văn.",
                  icon: ListChecks,
                },
                {
                  label: "2. Đọc khung kết quả",
                  desc: "Xem bảng so sánh và các khoảng trống được đề xuất.",
                  icon: BarChart3,
                },
                {
                  label: "3. Hỏi tiếp",
                  desc: "Giữ cùng hội thoại và yêu cầu xếp cơ hội theo chi phí.",
                  icon: CircleDollarSign,
                },
                {
                  label: "4. Tự kiểm chứng",
                  desc: "Đo ba con số quan trọng trước khi ra quyết định.",
                  icon: ShieldCheck,
                },
              ].map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.label}
                    className="space-y-2 rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-accent" />
                      <p className="text-sm font-semibold text-foreground">{step.label}</p>
                    </div>
                    <p className="text-xs leading-relaxed text-muted">{step.desc}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 space-y-3">
              <TextCard label="Prompt F, hỏi tiếp trong cùng hội thoại">
                <p>{PROMPT_F}</p>
              </TextCard>
              <TextCard label="Đầu và cuối câu trả lời thật">
                <div className="space-y-3">
                  <p className="whitespace-pre-line">{REAL_REPLY_C_HEAD}</p>
                  <p>{REAL_REPLY_C_TAIL}</p>
                </div>
              </TextCard>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="mb-3 text-base font-semibold text-foreground">
              4 cái bẫy thường gặp
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[
                {
                  title: "Tin ngay số liệu AI đưa",
                  desc: "Bẫy nguy hiểm nhất: giá thuê, giá menu và biên lợi nhuận trên mạng có thể sai hoặc cũ.",
                  fix: "Kiểm tại quầy, hỏi môi giới và xin báo giá thật từ nhà cung cấp.",
                },
                {
                  title: "Hỏi quá mơ hồ",
                  desc: "AI phải mất một vòng hỏi lại khu vực và phân khúc trước khi làm việc.",
                  fix: "Dùng bản giao việc 5 phần ngay từ câu đầu.",
                },
                {
                  title: "Quên khai báo ngân sách",
                  desc: "Gợi ý nghe hay nhưng có thể vượt xa khả năng vốn của mô hình nhỏ.",
                  fix: "Nêu ngân sách và yêu cầu xếp cơ hội theo chi phí.",
                },
                {
                  title: "Nghĩ AI thay được khảo sát thực địa",
                  desc: "Chatbot không đứng ở đúng mặt bằng để nhìn lưu lượng khách thật.",
                  fix: "Tự đứng đếm khách và ghi lại dữ liệu trong nhiều buổi.",
                },
              ].map((pitfall) => (
                <div
                  key={pitfall.title}
                  className="space-y-2 rounded-xl border border-amber-600 bg-amber-50/70 p-4 dark:border-amber-600 dark:bg-amber-900/20"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-700 dark:text-amber-200" />
                    <p className="text-sm font-semibold text-foreground">{pitfall.title}</p>
                  </div>
                  <p className="text-xs leading-relaxed text-foreground">{pitfall.desc}</p>
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

          <div>
            <Callout variant="insight" title="Bản giao việc 5 phần">
              Khung vai trò, nhiệm vụ, bối cảnh, định dạng và giọng văn giống{" "}
              <TopicLink slug="ai-for-writing">khung tương tự trong bài AI viết</TopicLink>.
              Muốn đọc review khách hàng như một dạng khảo sát khác, xem{" "}
              <TopicLink slug="sentiment-analysis-in-brand-monitoring">
                phân tích cảm xúc trong theo dõi thương hiệu
              </TopicLink>.
            </Callout>
          </div>

          <div>
            <Callout variant="warning" title="Khi KHÔNG nên dừng ở AI">
              Quyết định xuống tiền thuê mặt bằng, ký hợp đồng nhà cung cấp hoặc
              vay vốn đều khó đảo ngược. Những quyết định này cần số liệu bạn tự
              kiểm chứng, không phải số từ chatbot.
            </Callout>
          </div>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ khi khảo sát đối thủ bằng AI"
          points={[
            "Bối cảnh càng cụ thể, phân tích đối thủ càng cụ thể.",
            "Yêu cầu rõ định dạng: bảng so sánh, khoảng trống và danh sách số cần kiểm chứng.",
            "Hỏi tiếp trong cùng hội thoại để xếp cơ hội theo ngân sách.",
            "AI làm phần khung, bạn kiểm số bằng khảo sát thực địa.",
            "Bẫy lớn nhất là tin số liệu chưa được kiểm chứng.",
            "Một buổi tối tốt kết thúc bằng danh sách việc phải đo, không phải một câu trả lời cuối cùng.",
          ]}
        />

        <div className="mt-4 space-y-2 rounded-xl border border-border bg-card p-5">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            Khám phá thêm
          </h4>
          <p className="text-sm leading-relaxed text-muted">
            Muốn đọc tín hiệu từ review khách hàng? Xem{" "}
            <TopicLink slug="sentiment-analysis-in-brand-monitoring">
              phân tích cảm xúc trong theo dõi thương hiệu
            </TopicLink>.
            Mới bắt đầu dùng AI? Quay về{" "}
            <TopicLink slug="getting-started-with-ai">hướng dẫn bắt đầu</TopicLink>.
          </p>
        </div>
      </LessonSection>

      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <div>
          <QuizSection questions={quizQuestions} />
        </div>
      </LessonSection>
    </>
  );
}
