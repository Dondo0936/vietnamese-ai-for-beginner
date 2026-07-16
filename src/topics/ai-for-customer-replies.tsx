"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageSquare,
  PackageCheck,
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
  slug: "ai-for-customer-replies",
  title: "AI for Customer Replies",
  titleVi: "AI trả lời tin nhắn khách hàng nhanh và đúng",
  description:
    "Soạn tin nhắn trả lời khách đến bất kể giờ nào, giữ đúng giọng shop và chốt đơn tự nhiên, không cứng nhắc như trả lời tự động.",
  category: "applied-ai",
  tags: ["customer-service", "messaging", "practical", "shop"],
  difficulty: "beginner",
  relatedSlugs: ["ai-for-writing", "prompt-engineering", "getting-started-with-ai"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

const CUSTOMER_MESSAGE =
  "Chị ơi áo dài tay màu be còn size M không ạ? Mai e cần gấp ạ";

const REAL_REPLY_A = `Chắc chắn rồi. Hãy gửi cho tôi tin nhắn của khách (hoặc chụp màn hình cuộc trò chuyện) và cho biết bạn muốn trả lời theo phong cách nào, ví dụ:
- Lịch sự, chuyên nghiệp
- Thân thiện, gần gũi
- Cứng rắn nhưng khéo léo
- Thuyết phục để chốt đơn
Tôi sẽ soạn giúp bạn câu trả lời phù hợp.`;

const REAL_REPLY_B_FULL = `Bạn có thể trả lời lịch sự và tạo cảm giác hỗ trợ khách như sau (nếu còn hàng):
"Dạ chị ơi, áo dài tay màu be bên em còn size M ạ. Nếu chị cần gấp để nhận mai thì chị chốt đơn sớm giúp em nhé, em sẽ ưu tiên xử lý và gửi sớm nhất có thể ạ."

Nếu không chắc còn hàng, bạn có thể nhắn:
"Dạ để em kiểm tra ngay giúp chị xem áo dài tay màu be còn size M không ạ. Chị đợi em 1-2 phút nhé. Nếu còn, em sẽ hỗ trợ lên đơn gấp để chị kịp nhận mai ạ."`;

const REAL_REPLY_B_FIRST =
  "Dạ chị ơi, áo dài tay màu be bên em còn size M ạ. Nếu chị cần gấp để nhận mai thì chị chốt đơn sớm giúp em nhé, em sẽ ưu tiên xử lý và gửi sớm nhất có thể ạ.";

const REAL_REPLY_C =
  "Chào em, sáng chị mới thấy tin nhắn của em nè 🥰 Áo dài tay màu be size M vẫn còn nhé, hiện còn đúng 2 chiếc thôi. Chị lên đơn ngay hôm nay để GHTK giao sớm cho em nha, em chốt lấy 1 hay 2 áo giúp chị nhé? 😊";

type SituationKey = "stock" | "shipping" | "discount" | "late";
type ToneKey = "friendly" | "professional" | "warm";

const SITUATIONS: { key: SituationKey; label: string; icon: React.ElementType }[] = [
  { key: "stock", label: "Hỏi còn hàng", icon: PackageCheck },
  { key: "shipping", label: "Hỏi ship bao lâu", icon: Truck },
  { key: "discount", label: "Hỏi giảm giá", icon: Tags },
  { key: "late", label: "Phàn nàn giao chậm", icon: AlertTriangle },
];

const TONES: { key: ToneKey; label: string }[] = [
  { key: "friendly", label: "Thân thiện" },
  { key: "professional", label: "Lịch sự chuyên nghiệp" },
  { key: "warm", label: "Ấm áp với khách quen" },
];

const REPLY_BANK: Record<SituationKey, Record<ToneKey, string>> = {
  stock: {
    friendly:
      "Dạ mẫu này bên em còn size M nha chị. Nếu chị cần gấp, chị gửi giúp em số điện thoại và địa chỉ, em lên đơn ngay cho kịp ạ.",
    professional:
      "Dạ shop còn size M cho mẫu này ạ. Chị xác nhận giúp em số lượng cần lấy, em kiểm lại kho lần cuối rồi lên đơn cho chị ngay.",
    warm:
      "Còn nha em ơi, màu be size M đang còn ít thôi. Chị giữ trước cho em 1 áo, em gửi chị địa chỉ để chị lên đơn liền nhé.",
  },
  shipping: {
    friendly:
      "Dạ nội thành thường nhận trong 1 đến 2 ngày, tỉnh xa khoảng 2 đến 4 ngày ạ. Chị gửi khu vực nhận hàng, em báo thời gian sát hơn nha.",
    professional:
      "Dạ thời gian giao phụ thuộc khu vực nhận hàng. Chị cho em xin tỉnh thành hoặc quận huyện, em kiểm tra tuyến giao rồi báo lại chính xác.",
    warm:
      "Em ở khu vực nào nè? Chị xem tuyến ship rồi báo ngay để mình canh ngày nhận cho tiện nhất nha.",
  },
  discount: {
    friendly:
      "Dạ mẫu này shop đang để giá tốt rồi ạ. Nếu chị lấy từ 2 sản phẩm, em hỗ trợ thêm freeship hoặc mã nhỏ cho chị nha.",
    professional:
      "Dạ hiện giá niêm yết đã là giá ưu đãi của shop. Nếu chị chốt combo, em có thể kiểm tra thêm chính sách hỗ trợ phí ship.",
    warm:
      "Chị thương em thì em cũng thương lại nè. Em lấy 2 món trở lên, chị xem có mã hỗ trợ ship cho em được không nha.",
  },
  late: {
    friendly:
      "Dạ em xin lỗi chị vì đơn giao chậm ạ. Em kiểm tra với bên vận chuyển ngay và nhắn lại chị trong vài phút nhé.",
    professional:
      "Dạ shop xin lỗi chị vì trải nghiệm chưa tốt. Em sẽ kiểm tra mã vận đơn ngay, xác nhận nguyên nhân và báo lại hướng xử lý cụ thể.",
    warm:
      "Chị xin lỗi em nhiều vì để em phải chờ. Chị kiểm đơn ngay bây giờ, có gì chị báo thật rõ để mình xử lý cho ổn nha.",
  },
};

const GALLERY_CASES = [
  {
    label: "Hỏi còn hàng",
    icon: PackageCheck,
    scenario:
      "Khách hỏi một mẫu áo còn size M không và cần nhận sớm trong ngày mai.",
    output:
      "Dạ mẫu này còn size M nha chị. Hiện shop còn ít hàng, chị chốt giúp em màu và số lượng, em lên đơn trước để kịp giao sớm ạ.",
  },
  {
    label: "Hỏi ship",
    icon: Truck,
    scenario:
      "Khách ở tỉnh khác hỏi nếu đặt hôm nay thì bao lâu nhận được.",
    output:
      "Dạ chị cho em xin tỉnh thành nhận hàng nhé. Thường đơn tỉnh mất khoảng 2 đến 4 ngày, em kiểm tuyến cụ thể rồi báo chị cho chắc ạ.",
  },
  {
    label: "Xin giảm giá",
    icon: Tags,
    scenario:
      "Khách thích sản phẩm nhưng hỏi có bớt thêm được không.",
    output:
      "Dạ giá này shop đang để tốt rồi ạ. Nếu chị lấy thêm 1 món nữa, em kiểm mã hỗ trợ ship hoặc ưu đãi combo cho chị nha.",
  },
  {
    label: "Giao chậm",
    icon: AlertTriangle,
    scenario:
      "Khách khó chịu vì đơn đã qua ngày dự kiến mà chưa tới.",
    output:
      "Dạ shop xin lỗi chị vì đơn giao chậm ạ. Em kiểm tra mã vận đơn ngay với bên vận chuyển và báo lại chị hướng xử lý cụ thể trong vài phút.",
  },
  {
    label: "Phối đồ",
    icon: Sparkles,
    scenario:
      "Khách hỏi áo màu be nên phối với quần gì cho dễ mặc.",
    output:
      "Dạ màu be rất dễ phối chị ạ. Chị mặc với quần jeans xanh nhạt cho trẻ trung, hoặc quần đen ống suông nếu muốn gọn và lịch sự hơn nha.",
  },
];

const PROMPT_TEMPLATES = [
  {
    title: "A. Hỏi còn hàng",
    icon: PackageCheck,
    body: "Bạn là chủ shop thời trang. Soạn tin nhắn trả lời khách hỏi [sản phẩm, màu, size]. Bối cảnh thật: [còn/hết], số lượng: [n], thời gian giao: [thông tin thật]. Giọng thân thiện, ngắn, có câu chốt đơn cuối tin.",
  },
  {
    title: "B. Hỏi ship bao lâu",
    icon: Truck,
    body: "Soạn tin nhắn trả lời khách hỏi thời gian giao. Bối cảnh: khách ở [khu vực], shop dùng [đơn vị vận chuyển], thời gian dự kiến [n ngày]. Giọng rõ ràng, không hứa chắc nếu chưa kiểm tuyến.",
  },
  {
    title: "C. Xin giảm giá",
    icon: Tags,
    body: "Soạn tin nhắn trả lời khách xin giảm giá cho [sản phẩm]. Chính sách thật: [giữ giá/hỗ trợ ship/combo]. Giọng mềm, không làm mất thiện cảm, kết bằng lựa chọn để khách dễ chốt.",
  },
  {
    title: "D. Phàn nàn giao chậm",
    icon: AlertTriangle,
    body: "Soạn tin nhắn xin lỗi khách vì đơn [mã đơn] giao chậm. Thông tin thật: [trạng thái đơn], bước xử lý: [việc shop sẽ làm], thời gian báo lại: [mốc]. Giọng nhận trách nhiệm, không đổ lỗi.",
  },
];

function TranscriptBox({
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

  const labelClass =
    tone === "success"
      ? "text-emerald-900 dark:text-emerald-200"
      : tone === "warn"
        ? "text-amber-900 dark:text-amber-200"
        : "text-muted";

  return (
    <div className={`rounded-lg border p-4 ${toneClass}`}>
      <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${labelClass}`}>
        {label}
      </p>
      <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
        {text}
      </p>
    </div>
  );
}

function ReplyBuilderDemo() {
  const [situation, setSituation] = useState<SituationKey>("stock");
  const [tone, setTone] = useState<ToneKey>("friendly");

  const reply = useMemo(() => REPLY_BANK[situation][tone], [situation, tone]);

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          1. Chọn tình huống khách
        </p>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {SITUATIONS.map((item) => {
            const Icon = item.icon;
            const selected = situation === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setSituation(item.key)}
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
          2. Chọn giọng trả lời
        </p>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          {TONES.map((item) => {
            const selected = tone === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTone(item.key)}
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
          AI soạn mẫu
        </p>
        <motion.div
          key={`${situation}-${tone}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="rounded-xl border border-border bg-surface p-4"
        >
          <div className="mb-2 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-accent" />
            <p className="text-sm font-semibold text-foreground">
              Bản nháp để chủ shop kiểm lại rồi gửi
            </p>
          </div>
          <p className="text-sm leading-relaxed text-foreground">{reply}</p>
        </motion.div>
      </div>
    </div>
  );
}

function ShopUseCaseGalleryDemo() {
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
                  Mẫu trả lời
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

export default function AiForCustomerRepliesTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          "Bạn chỉ gõ cho AI: 'Trả lời giúp tôi khách này'. Điều gì còn thiếu quan trọng nhất?",
        options: [
          "Tên app nhắn tin khách đang dùng",
          "Bối cảnh thật như còn hàng hay không, số lượng, thời gian giao và giọng trả lời",
          "Một câu chào thật dài trước prompt",
          "Một emoji để AI đoán cảm xúc",
        ],
        correct: 1,
        explanation:
          "AI không nhìn thấy kho và không biết tình huống thật. Thiếu bối cảnh, AI chỉ hỏi lại hoặc viết chung chung.",
      },
      {
        question:
          "Rủi ro lớn nhất khi để AI tự khẳng định 'còn hàng' là gì?",
        options: [
          "Tin nhắn quá ngắn",
          "Khách thấy shop trả lời quá nhanh",
          "AI đoán sai tồn kho, khách chốt xong mới biết hết hàng",
          "AI dùng ít emoji",
        ],
        correct: 2,
        explanation:
          "Tồn kho là sự thật vận hành, không phải thứ AI được phép đoán. Chủ shop phải kiểm số lượng trước khi để AI nói chắc.",
      },
      {
        type: "fill-blank",
        question:
          "Một bản giao việc tốt cho AI gồm vai trò, nhiệm vụ, {blank}, định dạng và {blank}.",
        blanks: [
          { answer: "bối cảnh", accept: ["Bối cảnh", "boi canh", "context", "Context"] },
          { answer: "giọng văn", accept: ["Giọng văn", "giong van", "tone", "Tone"] },
        ],
        explanation:
          "Bản giao việc 5 phần giúp AI biết đang đóng vai ai, làm việc gì, dựa trên thông tin thật nào, trả theo format nào và dùng giọng ra sao.",
      },
      {
        question:
          "Khi nào KHÔNG nên để AI tự trả lời khách?",
        options: [
          "Khách hỏi còn size phổ biến",
          "Khách hỏi cách phối đồ đơn giản",
          "Khách có khiếu nại nghiêm trọng hoặc tranh chấp đơn hàng",
          "Khách hỏi thời gian ship dự kiến",
        ],
        correct: 2,
        explanation:
          "Khiếu nại nghiêm trọng, thương lượng lớn hoặc tranh chấp cần chủ shop trực tiếp xử lý. AI có thể soạn nháp, không nên tự gửi.",
      },
      {
        question:
          "Khách quen nhắn hỏi mẫu mới. Giọng nào thường hợp nhất?",
        options: [
          "Ấm áp, gần gũi, vẫn rõ thông tin chính",
          "Cứng rắn như thông báo nội quy",
          "Trang trọng như hợp đồng pháp lý",
          "Không cần trả lời vì khách quen sẽ tự hiểu",
        ],
        correct: 0,
        explanation:
          "Khách quen cần cảm giác được nhớ và được chăm sóc. Giọng ấm áp vẫn phải đi kèm thông tin thật và câu chốt rõ.",
      },
      {
        question:
          "Câu cuối tin nhắn bán hàng nên làm gì?",
        options: [
          "Mở thêm 5 lựa chọn để khách suy nghĩ lâu hơn",
          "Kết bằng một câu chốt rõ để khách dễ trả lời có hoặc không",
          "Chỉ nói 'cảm ơn' rồi dừng",
          "Hứa giao chắc chắn dù chưa kiểm vận chuyển",
        ],
        correct: 1,
        explanation:
          "Tin nhắn tốt không chỉ lịch sự, mà còn giúp khách biết bước tiếp theo: chốt số lượng, gửi địa chỉ hoặc chọn phương án.",
      },
      {
        question:
          "AI hữu ích nhất ở bước nào trong vòng lặp trả lời khách?",
        options: [
          "Tự kiểm kho thay chủ shop",
          "Tự quyết định có bồi thường không",
          "Soạn nhanh bản nháp theo bối cảnh thật chủ shop cung cấp",
          "Tự gửi mọi tin nhắn lúc nửa đêm",
        ],
        correct: 2,
        explanation:
          "AI mạnh ở phần diễn đạt. Chủ shop vẫn chịu trách nhiệm kiểm hàng, kiểm chính sách và quyết định gửi.",
      },
    ],
    []
  );

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Thử đoán">
        <PredictionGate
          question="Khách nhắn hỏi mua hàng lúc 11 giờ đêm. Nếu shop trả lời trong vài phút thay vì để sang hôm sau, điều gì thường xảy ra?"
          options={[
            "Khách thường vẫn còn hứng thú mua và nhiều khả năng chốt đơn hơn hẳn",
            "Khách sẽ khó chịu vì shop trả lời ngoài giờ hành chính",
            "Tốc độ trả lời không quan trọng, chỉ cần sáng mai gửi là như nhau",
            "AI trả lời nhanh nên có thể bỏ qua bước kiểm hàng thật",
          ]}
          correct={0}
          explanation="Khách nhắn giờ nào cũng cần một câu trả lời nhanh, đúng và thân thiện. Điểm chính không phải trực 24 giờ, mà là có một bản nháp tốt để không bỏ lỡ khách khi họ còn đang muốn mua."
        >
          <p className="mt-4 text-sm text-muted">
            Trả lời nhanh chỉ có giá trị khi câu trả lời đúng sự thật: còn hàng
            hay không, giao được lúc nào và khách cần làm gì tiếp.
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
                AI trả lời tin nhắn giống một nhân viên trực đêm.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                Nhân viên này đọc kỹ tin khách và soạn sẵn câu trả lời. Nhưng
                chủ shop vẫn là người xem lại số lượng hàng thật, ngày giao thật
                và bấm gửi.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 pt-2 md:grid-cols-3">
            <div className="rounded-lg bg-surface p-3">
              <MessageSquare className="mb-1 h-5 w-5 text-accent" />
              <p className="text-sm font-semibold text-foreground">
                Khách nhắn
              </p>
              <p className="text-xs text-muted">
                Hỏi còn hàng, ship, giá hoặc phàn nàn.
              </p>
            </div>
            <div className="rounded-lg bg-surface p-3">
              <Wand2 className="mb-1 h-5 w-5 text-accent" />
              <p className="text-sm font-semibold text-foreground">
                AI soạn sẵn
              </p>
              <p className="text-xs text-muted">
                Biến bối cảnh thật thành câu trả lời gọn.
              </p>
            </div>
            <div className="rounded-lg bg-surface p-3">
              <ShieldCheck className="mb-1 h-5 w-5 text-accent" />
              <p className="text-sm font-semibold text-foreground">
                Bạn duyệt và gửi
              </p>
              <p className="text-xs text-muted">
                Kiểm kho, kiểm ngày giao, rồi chốt đơn.
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
                Demo 1, Cùng một tin nhắn khách
              </h3>
              <p className="mb-4 text-sm text-muted">
                Cùng một tin nhắn khách, một bản đoán mò còn hàng hay không,
                một bản biết chắc còn đúng 2 áo.
              </p>
              <div className="mb-4 rounded-xl border border-border bg-surface p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                  Tin nhắn khách thật
                </p>
                <p className="text-sm text-foreground">&quot;{CUSTOMER_MESSAGE}&quot;</p>
              </div>
              <ToggleCompare
                labelA="Trả lời chung chung"
                labelB="Trả lời có bối cảnh thật"
                description="Một bên chỉ có tin nhắn khách, một bên có thêm tồn kho và thời gian giao thật."
                childA={
                  <TranscriptBox
                    label="Bản chung chung, chỉ là nhánh nếu còn hàng"
                    text={REAL_REPLY_B_FIRST}
                    tone="warn"
                  />
                }
                childB={
                  <TranscriptBox
                    label="Bản có bối cảnh thật"
                    text={REAL_REPLY_C}
                    tone="success"
                  />
                }
              />
              <div className="mt-4">
                <TranscriptBox
                  label="Bản B đầy đủ, AI phải tự chia nếu còn hàng và nếu không chắc"
                  text={REAL_REPLY_B_FULL}
                  tone="warn"
                />
              </div>
            </div>

            <div>
              <h3 className="mb-1 text-base font-semibold text-foreground">
                Demo 2, Chọn tình huống và giọng trả lời
              </h3>
              <p className="mb-4 text-sm text-muted">
                Đây là công cụ luyện tập. Những câu dưới là mẫu tổng hợp, không
                phải transcript thật.
              </p>
              <ReplyBuilderDemo />
            </div>

            <div>
              <h3 className="mb-1 text-base font-semibold text-foreground">
                Demo 3, Kho tình huống tin nhắn shop
              </h3>
              <p className="mb-4 text-sm text-muted">
                Nhấp từng tab để xem một khuôn trả lời ngắn cho các tin nhắn
                thường gặp.
              </p>
              <ShopUseCaseGalleryDemo />
            </div>

            <Callout variant="tip" title="Ba quan sát khi thử các demo">
              <ol className="list-inside list-decimal space-y-1 text-sm">
                <li>Giọng đổi theo lựa chọn, nên cùng một ý có thể ra nhiều cách nói.</li>
                <li>Khi có đủ bối cảnh, AI không cần thông minh hơn, chỉ cần trình bày đúng.</li>
                <li>Mỗi loại tin nhắn có một khuôn riêng để khách dễ trả lời tiếp.</li>
              </ol>
            </Callout>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          AI trả lời nhanh, nhưng <strong>nhanh</strong> không phải giá trị
          chính. Giá trị chính là trả lời <strong>đúng bối cảnh thật</strong>:
          còn hàng hay không, giao được lúc nào, khách cần chốt gì tiếp. AI
          không thay bạn kiểm kho, chỉ giúp bạn không bỏ lỡ khách vì chưa kịp
          gõ chữ.
        </AhaMoment>
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <div className="mb-6">
          <TranscriptBox
            label="Bản A thật, khi chủ shop hỏi quá mơ hồ"
            text={REAL_REPLY_A}
          />
        </div>

        <InlineChallenge
          question="Một câu mơ hồ như 'Trả lời giúp tôi khách này' đang thiếu gì?"
          options={[
            "Thiếu bối cảnh thật: còn hàng hay không, số lượng và thời gian giao",
            "Thiếu lời khen AI trước khi nhờ",
            "Thiếu tên điện thoại của khách",
            "Thiếu một câu tiếng Anh để AI hiểu tốt hơn",
          ]}
          correct={0}
          explanation="AI không biết tin nhắn khách, tồn kho, chính sách giao và giọng shop nếu bạn không đưa vào. Vì vậy nó phải hỏi lại hoặc viết rất chung."
        />

        <div className="mt-6">
          <InlineChallenge
            question="AI trả lời 'chắc chắn còn hàng' nhưng thực tế shop đã hết. Cách xử lý đúng là gì?"
            options={[
              "Cứ gửi vì AI đã viết tự tin",
              "Luôn xác nhận số lượng thật trước khi để AI khẳng định còn hàng",
              "Chỉ đổi sang giọng thân thiện hơn",
              "Xóa phần chốt đơn nhưng giữ lời hứa còn hàng",
            ]}
            correct={1}
            explanation="Đừng để AI đoán tồn kho. Hàng còn hay hết phải đến từ dữ liệu thật của shop, sau đó AI mới được diễn đạt lại."
          />
        </div>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Hiểu sâu hơn">
        <ExplanationSection>
          <div>
            <h3 className="mb-3 text-base font-semibold text-foreground">
              Công cụ AI nhắn tin chủ shop có thể dùng
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[
                {
                  name: "ChatGPT bản miễn phí",
                  useFor: "Soạn nhanh tin nhắn, đổi giọng, rút gọn câu trả lời.",
                },
                {
                  name: "Trợ lý AI trong Zalo OA",
                  useFor: "Hỗ trợ phản hồi trong kênh khách Việt hay nhắn.",
                },
                {
                  name: "Chatbot bán hàng",
                  useFor: "Lưu khuôn trả lời, gom câu hỏi thường gặp và hỗ trợ inbox.",
                },
                {
                  name: "Công cụ quản lý fanpage",
                  useFor: "Gợi ý phản hồi, gắn nhãn hội thoại và chia việc cho nhân viên.",
                },
              ].map((tool) => (
                <div
                  key={tool.name}
                  className="space-y-2 rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent" />
                    <p className="text-sm font-semibold text-foreground">
                      {tool.name}
                    </p>
                  </div>
                  <p className="text-xs text-foreground">
                    <strong>Dùng cho:</strong> {tool.useFor}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="mb-3 text-base font-semibold text-foreground">
              Vòng lặp 4 bước: khách nhắn, AI soạn, bạn kiểm, rồi gửi
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              {[
                { label: "1. Khách nhắn", desc: "Đọc đúng nhu cầu trong inbox.", icon: MessageSquare },
                { label: "2. AI soạn", desc: "Tạo bản nháp ngắn theo bối cảnh.", icon: Wand2 },
                { label: "3. Bạn kiểm hàng thật", desc: "Xác nhận tồn kho và ngày giao.", icon: ShieldCheck },
                { label: "4. Gửi", desc: "Chốt rõ để khách trả lời tiếp.", icon: Send },
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
                  title: "AI đoán tồn kho",
                  desc: "Bẫy nguy hiểm nhất: AI nói còn hàng dù shop chưa kiểm hoặc đã hết.",
                  fix: "Luôn đưa số lượng thật trước khi để AI khẳng định.",
                },
                {
                  title: "Giọng quá trang trọng",
                  desc: "Khách quen đọc thấy như tin nhắn tự động, lạnh và xa cách.",
                  fix: "Ghi rõ giọng: thân thiện, gần gũi, không cứng nhắc.",
                },
                {
                  title: "Trả lời chậm vì phải mở app AI",
                  desc: "Có AI nhưng vẫn mất khách vì phải nghĩ lại từ đầu mỗi lần.",
                  fix: "Lưu sẵn khuôn prompt để dán nhanh theo từng loại tin.",
                },
                {
                  title: "Quên chốt đơn rõ",
                  desc: "Tin nhắn lịch sự nhưng không hỏi khách lấy mấy cái, gửi địa chỉ hay chọn phương án nào.",
                  fix: "Kết bằng một câu hỏi ngắn để khách trả lời có hoặc không.",
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

          <Callout variant="insight" title="Bản giao việc 5 phần">
            Khung này giống{" "}
            <TopicLink slug="ai-for-writing">khung tương tự trong bài AI viết</TopicLink>
            : vai trò, nhiệm vụ, bối cảnh, định dạng, giọng văn. Muốn đi sâu
            hơn, xem thêm{" "}
            <TopicLink slug="prompt-engineering">kỹ thuật viết prompt</TopicLink>.
          </Callout>

          <Callout variant="warning" title="Khi KHÔNG nên để AI tự trả lời">
            Khách hỏi giá đặc biệt hoặc thương lượng lớn, khiếu nại nghiêm
            trọng cần chủ shop trực tiếp xử lý, hoặc tin nhắn liên quan đến đơn
            hàng đã có vấn đề pháp lý hay tranh chấp. AI có thể soạn nháp, còn
            quyết định gửi là của bạn.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ khi dùng AI trả lời tin nhắn khách"
          points={[
            "Bối cảnh thật quan trọng hơn tốc độ: còn hàng, số lượng, thời gian giao và chính sách shop.",
            "AI không thay việc kiểm kho. Nó chỉ diễn đạt lại thông tin bạn đã xác nhận.",
            "Mỗi loại tin nhắn nên có một khuôn prompt riêng để phản hồi nhanh hơn.",
            "Luôn có câu chốt rõ cuối tin để khách biết trả lời gì tiếp.",
            "Bẫy lớn nhất là để AI đoán số lượng hàng hoặc hứa điều shop chưa chắc làm được.",
            "Khách quen, khách mới và khách đang bực cần giọng trả lời khác nhau.",
          ]}
        />

        <div className="mt-4 space-y-2 rounded-xl border border-border bg-card p-5">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            Khám phá thêm
          </h4>
          <p className="text-sm leading-relaxed text-muted">
            Muốn luyện bản giao việc rộng hơn? Xem{" "}
            <TopicLink slug="ai-for-writing">AI hỗ trợ viết</TopicLink>. Mới
            bắt đầu dùng AI? Quay về{" "}
            <TopicLink slug="getting-started-with-ai">hướng dẫn bắt đầu</TopicLink>.
          </p>
        </div>
      </LessonSection>

      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
