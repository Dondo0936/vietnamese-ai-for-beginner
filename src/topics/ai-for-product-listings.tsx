"use client";

import { useMemo, useState } from "react";
import type { ElementType } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  BadgePercent,
  CheckCircle2,
  ClipboardList,
  Gift,
  Globe2,
  Home,
  PackageCheck,
  PenLine,
  Send,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  Sparkles,
  Star,
  Tags,
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
  slug: "ai-for-product-listings",
  title: "AI for Product Listings",
  titleVi: "AI viết mô tả sản phẩm cho 30 món trong 1 giờ",
  description:
    "Biến vài dòng thông tin thô thành mô tả sản phẩm bán hàng, đủ điểm nổi bật và lời kêu gọi mua, cho từng món trong shop.",
  category: "applied-ai",
  tags: ["product-listing", "copywriting", "practical", "shop"],
  difficulty: "beginner",
  relatedSlugs: ["ai-for-writing", "ai-for-customer-replies", "getting-started-with-ai"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

const REAL_REPLY_A = `Được. Bạn gửi cho tôi các thông tin về sản phẩm, tôi sẽ viết mô tả phù hợp.
Bạn có thể cung cấp:
- Tên sản phẩm:
- Loại sản phẩm/ngành hàng:
- Điểm nổi bật:
- Chất liệu/thành phần:
- Kích thước, màu sắc, thông số (nếu có):
- Đối tượng khách hàng:
- Phong cách mong muốn (sang trọng, ngắn gọn, bán hàng, chuyên nghiệp, dễ thương...):
- Kênh đăng (Shopee, website, Facebook, TikTok Shop, catalogue...):
Nếu bạn chỉ có vài dòng thông tin thô, cứ gửi, tôi sẽ giúp viết lại thành mô tả hoàn chỉnh.`;

const REAL_REPLY_B = `Áo thun cotton form rộng unisex. Item basic dễ mặc cho mọi outfit ngày.
- Chất liệu cotton 100% mềm mại, thoáng khí, thấm hút tốt, mặc cả ngày vẫn dễ chịu.
- Form rộng unisex, phù hợp cả nam và nữ từ 18 đến 25 tuổi, phối quần jeans, short hay layer đều đẹp.
- Có 5 màu trẻ trung để lựa chọn, giá chỉ 149K, dễ sắm nhiều màu thay đổi phong cách.
Thiết kế đơn giản nhưng chất lượng, chiếc áo này sẽ là món đồ không thể thiếu trong tủ đồ. Chốt đơn ngay hôm nay để chọn màu yêu thích nhé!`;

type ProductKey = "shirt" | "lipstick" | "home" | "snack";
type VoiceKey = "young" | "premium" | "funny";

const PRODUCT_TYPES: {
  key: ProductKey;
  label: string;
  icon: ElementType;
  facts: string;
}[] = [
  {
    key: "shirt",
    label: "Áo thun",
    icon: Shirt,
    facts: "cotton mềm, form rộng, dễ phối đồ",
  },
  {
    key: "lipstick",
    label: "Son môi",
    icon: Sparkles,
    facts: "màu dễ dùng, chất son mịn, nhỏ gọn",
  },
  {
    key: "home",
    label: "Đồ gia dụng nhỏ",
    icon: Home,
    facts: "gọn, tiết kiệm chỗ, dùng hằng ngày",
  },
  {
    key: "snack",
    label: "Đồ ăn vặt",
    icon: ShoppingBag,
    facts: "giòn, vị đậm, hợp ăn cùng bạn bè",
  },
];

const VOICES: { key: VoiceKey; label: string }[] = [
  { key: "young", label: "Trẻ trung" },
  { key: "premium", label: "Sang trọng" },
  { key: "funny", label: "Hài hước" },
];

const SAMPLE_BANK: Record<ProductKey, Record<VoiceKey, string>> = {
  shirt: {
    young:
      "Áo thun form rộng dễ mặc cho cả đi học, đi chơi lẫn dạo phố. Chất cotton mềm, thoáng, phối với jeans hay short đều ổn. Có nhiều màu cơ bản để bạn đổi phong cách mỗi ngày. Chọn màu yêu thích và chốt đơn ngay nhé.",
    premium:
      "Áo thun cotton form rộng dành cho phong cách tối giản nhưng chỉn chu. Chất vải mềm, đứng form vừa đủ, phù hợp mặc riêng hoặc layer. Một item cơ bản để tủ đồ luôn dễ phối. Đặt ngay để chọn màu còn sẵn.",
    funny:
      "Chiếc áo dành cho những ngày không biết mặc gì nhưng vẫn muốn trông ổn. Form rộng dễ thở, cotton mềm dễ chịu, phối bừa với quần jeans cũng ra outfit. Lấy một màu hay gom nhiều màu đều hợp lý.",
  },
  lipstick: {
    young:
      "Màu son dễ dùng cho đi học, đi làm và đi chơi. Chất son mịn, lên môi nhẹ, giúp gương mặt tươi hơn chỉ sau vài giây. Thiết kế nhỏ gọn để bỏ túi mỗi ngày. Thêm vào giỏ và chọn màu hợp mood hôm nay nhé.",
    premium:
      "Thỏi son với sắc màu thanh lịch, phù hợp dùng hằng ngày hoặc những buổi hẹn quan trọng. Chất son mịn, dễ tán, tạo cảm giác gọn gàng và tự tin. Chọn màu bạn yêu thích để hoàn thiện túi trang điểm.",
    funny:
      "Son nhỏ nhưng quyền lực. Sáng ra chỉ cần quẹt một chút là mặt bớt buồn ngủ ngay. Màu dễ dùng, chất son mịn, bỏ túi không chiếm chỗ. Chốt màu trước khi lại phân vân thêm cả buổi nhé.",
  },
  home: {
    young:
      "Món đồ gia dụng nhỏ giúp góc bếp gọn hơn và việc nhà nhẹ hơn. Thiết kế dễ dùng, tiết kiệm chỗ, phù hợp căn hộ nhỏ hoặc phòng trọ. Dùng mỗi ngày không cầu kỳ. Thêm vào giỏ để căn bếp tiện hơn nhé.",
    premium:
      "Sản phẩm gia dụng nhỏ với thiết kế gọn, tiện và dễ đặt trong nhiều không gian. Phù hợp cho người muốn tối ưu sinh hoạt hằng ngày mà không làm bếp bị rối. Đặt hàng để nâng cấp góc nhà của bạn.",
    funny:
      "Nhỏ thôi nhưng đỡ bừa hẳn. Món này sinh ra để việc nhà bớt lỉnh kỉnh, bếp bớt chật và bạn bớt thở dài. Dùng dễ, cất gọn, hợp với ai thích nhà cửa ngăn nắp mà không muốn cố quá.",
  },
  snack: {
    young:
      "Món ăn vặt giòn, vị đậm và rất hợp cho lúc xem phim, học nhóm hoặc tụ tập bạn bè. Gói nhỏ dễ chia, hương vị dễ nghiện nhưng vẫn tiện mang theo. Thêm vào giỏ để cuối tuần có đồ nhâm nhi nhé.",
    premium:
      "Đồ ăn vặt với hương vị rõ, kết cấu giòn và cách đóng gói tiện dùng. Phù hợp để tiếp khách nhẹ, chuẩn bị cho buổi xem phim hoặc làm món quà nhỏ. Đặt ngay để luôn có sẵn một món ngon trong nhà.",
    funny:
      "Mở gói là cuộc họp gia đình tự nhiên đông đủ. Giòn, đậm vị, ăn một miếng dễ tiện tay thêm miếng nữa. Hợp xem phim, tám chuyện hoặc cứu đói lúc buồn miệng. Chốt vài gói cho chắc nhé.",
  },
};

const LISTING_CASES = [
  {
    label: "Mới ra mắt",
    icon: Sparkles,
    scenario:
      "Shop vừa nhập mẫu túi canvas mới, cần bài đăng giới thiệu nhanh trên Facebook.",
    output:
      "Túi canvas mới về với form đứng, quai chắc và ngăn rộng cho đồ đi học, đi làm. Màu dễ phối, chất vải nhẹ, hợp dùng mỗi ngày. Inbox shop để chọn màu còn sẵn nhé.",
  },
  {
    label: "Giảm giá",
    icon: BadgePercent,
    scenario:
      "Một mẫu áo sơ mi đang giảm cuối tuần, cần mô tả ngắn có lý do mua ngay.",
    output:
      "Áo sơ mi basic đang có ưu đãi cuối tuần. Chất vải mềm, dễ phối với quần jeans hoặc chân váy, phù hợp đi làm lẫn đi chơi. Số lượng ưu đãi có hạn, chốt size sớm để shop giữ hàng nhé.",
  },
  {
    label: "Quà tặng",
    icon: Gift,
    scenario:
      "Shop bán set nến thơm mini muốn gợi ý làm quà sinh nhật hoặc cảm ơn.",
    output:
      "Set nến thơm mini nhỏ xinh, hương nhẹ và hộp gọn đẹp, phù hợp làm quà sinh nhật, quà cảm ơn hoặc quà tự thưởng. Chọn mùi bạn thích, shop gói sẵn để tặng ngay.",
  },
  {
    label: "Best-seller",
    icon: Star,
    scenario:
      "Một mẫu bình nước bán chạy cần mô tả nhấn vào lý do khách hay mua lại.",
    output:
      "Bình nước best-seller của shop nhờ dung tích vừa đủ, nắp kín và dáng gọn dễ mang theo. Dùng đi học, đi làm hay tập luyện đều tiện. Đặt thêm màu yêu thích trước khi hết lượt hàng này nhé.",
  },
  {
    label: "Nhập khẩu",
    icon: Globe2,
    scenario:
      "Shop bán đồ gia dụng nhập khẩu, cần nói rõ lợi ích nhưng không phóng đại.",
    output:
      "Sản phẩm gia dụng nhập khẩu với thiết kế gọn, vật liệu chắc và cách dùng đơn giản. Phù hợp cho gia đình muốn đồ bền, tiện và dễ vệ sinh. Shop khuyên bạn kiểm thông số trước khi đặt để chọn đúng nhu cầu.",
  },
];

const PROMPT_TEMPLATES = [
  {
    title: "A. Mô tả sản phẩm thời trang",
    icon: Shirt,
    body: "Bạn là chủ shop thời trang online. Viết mô tả cho [tên sản phẩm]. Thông tin thật: chất liệu [x], form [x], màu [x], giá [x], khách mục tiêu [x]. Định dạng 80 đến 100 từ, có gạch đầu dòng và câu kêu gọi mua. Giọng trẻ trung, gần gũi.",
  },
  {
    title: "B. Mô tả đồ gia dụng hoặc tiêu dùng",
    icon: Home,
    body: "Viết mô tả bán hàng cho [tên sản phẩm]. Thông tin thật: công dụng [x], kích thước [x], vật liệu [x], điểm tiện lợi [x], lưu ý sử dụng [x]. Giọng rõ ràng, đáng tin, không phóng đại công dụng.",
  },
  {
    title: "C. Mô tả sản phẩm giảm giá gấp",
    icon: Tags,
    body: "Viết mô tả ngắn cho sản phẩm đang giảm giá: [tên sản phẩm]. Thông tin thật: giá cũ [x], giá mới [x], thời hạn ưu đãi [x], số lượng còn [x], lý do nên mua [x]. Giọng thúc đẩy nhưng không gây áp lực quá mức.",
  },
  {
    title: "D. Mô tả ngắn cho TikTok Shop",
    icon: ShoppingBag,
    body: "Viết mô tả dưới 50 từ cho TikTok Shop về [tên sản phẩm]. Chỉ dùng các thông tin này: [chất liệu], [lợi ích chính], [giá], [đối tượng khách]. Giọng nhanh, dễ hiểu, có một câu chốt đơn.",
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

  const ToneIcon = tone === "success" ? CheckCircle2 : tone === "warn" ? AlertTriangle : ClipboardList;

  return (
    <div className={`rounded-lg border p-4 ${toneClass}`}>
      <div className={`mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${labelClass}`}>
        <ToneIcon className="h-4 w-4" />
        <p>{label}</p>
      </div>
      <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
        {text}
      </p>
    </div>
  );
}

function ProductListingBuilderDemo() {
  const [product, setProduct] = useState<ProductKey>("shirt");
  const [voice, setVoice] = useState<VoiceKey>("young");

  const sample = useMemo(() => SAMPLE_BANK[product][voice], [product, voice]);
  const selectedProduct = PRODUCT_TYPES.find((item) => item.key === product);

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          1. Chọn loại sản phẩm
        </p>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {PRODUCT_TYPES.map((item) => {
            const Icon = item.icon;
            const selected = product === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setProduct(item.key)}
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
          2. Chọn giọng văn
        </p>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          {VOICES.map((item) => {
            const selected = voice === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setVoice(item.key)}
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
          key={`${product}-${voice}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="rounded-xl border border-border bg-surface p-4"
        >
          <div className="mb-2 flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-accent" />
            <p className="text-sm font-semibold text-foreground">
              Bản nháp cần chủ shop kiểm lại
            </p>
          </div>
          <p className="mb-3 text-xs leading-relaxed text-muted">
            Thông tin giả định để luyện: {selectedProduct?.facts}
          </p>
          <p className="text-sm leading-relaxed text-foreground">{sample}</p>
        </motion.div>
      </div>
    </div>
  );
}

function ListingSituationGalleryDemo() {
  return (
    <TabView
      tabs={LISTING_CASES.map((item) => {
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
                  Mẫu mô tả
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

export default function AiForProductListingsTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          "Bạn chỉ gõ: 'Viết mô tả sản phẩm giúp tôi'. Điều gì còn thiếu quan trọng nhất?",
        options: [
          "Thông tin thật về sản phẩm như chất liệu, giá, điểm nổi bật và khách mục tiêu",
          "Một lời khen AI trước khi nhờ viết",
          "Tên đối thủ cạnh tranh của shop",
          "Một câu tiếng Anh để AI viết hay hơn",
        ],
        correct: 0,
        explanation:
          "Không có thông tin thật, AI chỉ có thể hỏi lại hoặc viết chung chung. Chất liệu, giá và đối tượng khách phải đến từ shop.",
      },
      {
        question:
          "Rủi ro lớn nhất khi AI tự thêm công dụng cho mỹ phẩm hoặc thực phẩm là gì?",
        options: [
          "Mô tả có thể quá ngắn",
          "AI có thể phóng đại công dụng, khiến bài đăng sai hoặc nguy hiểm",
          "Khách sẽ thấy shop dùng AI quá nhanh",
          "Bài đăng có ít dấu chấm hơn bình thường",
        ],
        correct: 1,
        explanation:
          "Với hàng tiêu dùng, mỹ phẩm và thực phẩm, công dụng phải chính xác. Không để AI tự thêm lời hứa chưa được xác nhận.",
      },
      {
        question:
          "Một mô tả sản phẩm tốt thường nên có gì?",
        options: [
          "Tên sản phẩm, điểm nổi bật, thông tin thật, lợi ích cho khách và câu kêu gọi mua",
          "Thật nhiều tính từ càng hoa mỹ càng tốt",
          "Chỉ cần một câu khen sản phẩm đẹp",
          "Một đoạn dài không cần gạch đầu dòng",
        ],
        correct: 0,
        explanation:
          "Mô tả bán hàng cần vừa rõ thông tin vừa dễ đọc. Gạch đầu dòng giúp khách quét nhanh điểm đáng mua.",
      },
      {
        question:
          "Khi nào KHÔNG nên để AI tự thêm chi tiết vào mô tả?",
        options: [
          "Khi đổi giọng từ trẻ trung sang lịch sự",
          "Khi thông tin liên quan đến y tế, bảo hành, đổi trả hoặc thông số kỹ thuật chưa xác nhận",
          "Khi muốn mô tả ngắn hơn 50 từ",
          "Khi sản phẩm có nhiều màu",
        ],
        correct: 1,
        explanation:
          "Các chi tiết này ảnh hưởng trực tiếp đến an toàn, cam kết và khiếu nại. Chủ shop phải xác nhận trước.",
      },
      {
        question:
          "Vì sao một khuôn prompt tốt giúp viết mô tả cho 30 sản phẩm nhanh hơn?",
        options: [
          "Vì AI tự biết giá thật của từng món",
          "Vì bạn chỉ đổi vài dòng thông tin thật, không phải bắt đầu từ trang trắng mỗi lần",
          "Vì không cần đọc lại trước khi đăng",
          "Vì mọi sản phẩm nên dùng cùng một mô tả",
        ],
        correct: 1,
        explanation:
          "Khuôn prompt giữ nguyên vai trò, format và giọng. Mỗi món chỉ cần thay tên, chất liệu, giá và điểm nổi bật.",
      },
      {
        question:
          "TikTok Shop cần mô tả rất ngắn. Bạn nên ghi gì trong prompt?",
        options: [
          "Viết càng chi tiết càng tốt",
          "Dưới 50 từ, nêu lợi ích chính và một câu chốt đơn",
          "Không cần giới hạn độ dài",
          "Hãy viết theo kiểu văn học",
        ],
        correct: 1,
        explanation:
          "Kênh ngắn cần prompt nêu rõ giới hạn số từ. Nếu không, AI thường viết dài hơn nhu cầu.",
      },
      {
        question:
          "Nếu AI viết sai chất liệu sản phẩm, bước đúng trước khi đăng là gì?",
        options: [
          "Đối chiếu với thông tin sản phẩm thật và sửa trước khi đăng",
          "Giữ nguyên vì AI viết nghe chuyên nghiệp",
          "Chỉ đổi emoji cuối bài",
          "Đăng trước rồi sửa nếu khách hỏi",
        ],
        correct: 0,
        explanation:
          "Chất liệu là thông tin thật. Chủ shop chịu trách nhiệm kiểm và sửa, AI chỉ là người soạn nháp.",
      },
    ],
    []
  );

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Thử đoán">
        <PredictionGate
          question="Shop có 30 sản phẩm chưa có mô tả. Viết tay từng cái mất khoảng 10 phút một món. AI có thể rút thời gian này xuống còn khoảng bao nhiêu?"
          options={[
            "Khoảng vài phút một món khi đã có khuôn prompt dùng lại",
            "Gần như 0 giây vì AI tự biết mọi thông tin sản phẩm",
            "Vẫn 10 phút một món vì AI chỉ thay bạn gõ chữ",
            "Một ngày vì phải huấn luyện AI riêng cho từng shop",
          ]}
          correct={0}
          explanation="Khi có khuôn prompt, bạn không bắt đầu từ trang trắng nữa. Bạn chỉ thay tên sản phẩm, chất liệu, giá, khách mục tiêu và để AI dựng bản nháp có cấu trúc."
        >
          <p className="mt-4 text-sm text-muted">
            Tốc độ đến từ việc dùng lại khuôn giao việc, không phải từ chuyện AI
            gõ nhanh hơn bạn.
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
                AI viết mô tả sản phẩm giống một nhân viên content ngồi cả ngày viết bài đăng.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                Nhân viên này viết rất nhanh, nhưng chỉ giỏi khi bạn đưa đủ
                thông tin thật về sản phẩm: chất liệu, giá, màu, đối tượng
                khách và kênh đăng.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 pt-2 md:grid-cols-3">
            <div className="rounded-lg bg-surface p-3">
              <PackageCheck className="mb-1 h-5 w-5 text-accent" />
              <p className="text-sm font-semibold text-foreground">
                Bạn đưa thông tin sản phẩm
              </p>
              <p className="text-xs text-muted">
                Tên, chất liệu, giá, màu, khách mục tiêu.
              </p>
            </div>
            <div className="rounded-lg bg-surface p-3">
              <Wand2 className="mb-1 h-5 w-5 text-accent" />
              <p className="text-sm font-semibold text-foreground">
                AI viết mô tả có cấu trúc
              </p>
              <p className="text-xs text-muted">
                Mở đầu, gạch đầu dòng, lợi ích, chốt mua.
              </p>
            </div>
            <div className="rounded-lg bg-surface p-3">
              <ShieldCheck className="mb-1 h-5 w-5 text-accent" />
              <p className="text-sm font-semibold text-foreground">
                Bạn kiểm giá và thông số rồi đăng
              </p>
              <p className="text-xs text-muted">
                Đối chiếu lại với hàng thật trước khi bấm đăng.
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
                Demo 1, Hỏi mơ hồ và giao việc đủ thông tin
              </h3>
              <p className="mb-4 text-sm text-muted">
                Không có thông tin thật về sản phẩm, AI không tự bịa ra chất
                liệu hay giá được.
              </p>
              <ToggleCompare
                labelA="AI hỏi lại vì chưa có thông tin"
                labelB="Mô tả đầy đủ, có gạch đầu dòng và lời kêu gọi mua"
                description="Cùng là nhờ viết mô tả, nhưng một bên thiếu dữ kiện, một bên có đủ 5 phần giao việc."
                childA={
                  <TranscriptBox
                    label="Reply A, AI cần hỏi lại"
                    text={REAL_REPLY_A}
                    tone="warn"
                  />
                }
                childB={
                  <TranscriptBox
                    label="Reply B, bản mô tả có cấu trúc"
                    text={REAL_REPLY_B}
                    tone="success"
                  />
                }
              />
            </div>

            <div>
              <h3 className="mb-1 text-base font-semibold text-foreground">
                Demo 2, Chọn loại sản phẩm và giọng văn
              </h3>
              <p className="mb-4 text-sm text-muted">
                Đây là công cụ luyện tập. Những câu dưới là mẫu tổng hợp, không
                phải transcript thật.
              </p>
              <ProductListingBuilderDemo />
            </div>

            <div>
              <h3 className="mb-1 text-base font-semibold text-foreground">
                Demo 3, Kho tình huống listing thường gặp
              </h3>
              <p className="mb-4 text-sm text-muted">
                Nhấp từng tab để xem một cách viết ngắn cho từng tình huống bán
                hàng phổ biến.
              </p>
              <ListingSituationGalleryDemo />
            </div>

            <Callout variant="tip" title="Ba quan sát khi thử các demo">
              <ol className="list-inside list-decimal space-y-1 text-sm">
                <li>Một mô tả tốt bắt đầu từ thông tin thật, không phải từ câu chữ hoa mỹ.</li>
                <li>Cùng một sản phẩm có thể đổi giọng cho từng kênh bán hoặc nhóm khách.</li>
                <li>Khuôn prompt giúp bạn làm hàng loạt mà vẫn kiểm được từng chi tiết.</li>
              </ol>
            </Callout>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          Giá trị chính không phải AI viết nhanh hơn bạn gõ, mà là một{" "}
          <strong>khuôn prompt tốt</strong> dùng lại được cho cả 30 sản phẩm.
          Mỗi lần bạn chỉ đổi vài dòng thông tin thật. AI không biết giá thật
          hay chất liệu thật nếu bạn không ghi ra, nên mô tả chỉ đúng khi thông
          tin đưa vào đúng.
        </AhaMoment>
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Một câu mơ hồ như 'Viết mô tả sản phẩm giúp tôi' đang thiếu gì?"
          options={[
            "Thông tin thật về sản phẩm như chất liệu, giá, đối tượng khách và điểm nổi bật",
            "Tên AI mà bạn đang dùng",
            "Một câu mở đầu thật dài",
            "Một hashtag thịnh hành",
          ]}
          correct={0}
          explanation="AI không tự biết sản phẩm đang bán là gì, chất liệu ra sao, giá bao nhiêu hoặc khách nào sẽ mua. Thiếu dữ kiện thật thì AI phải hỏi lại hoặc viết chung chung."
        />

        <div className="mt-6">
          <InlineChallenge
            question="Mô tả AI viết ghi sai chất liệu hoặc phóng đại công dụng sản phẩm. Cách xử lý đúng là gì?"
            options={[
              "Đăng luôn vì câu chữ nghe thuyết phục",
              "Luôn đối chiếu mô tả với thông tin sản phẩm thật trước khi đăng",
              "Chỉ đổi sang giọng hài hước hơn",
              "Giữ phần công dụng, xóa phần giá",
            ]}
            correct={1}
            explanation="AI không được tự thêm chi tiết chưa xác nhận. Chủ shop phải kiểm chất liệu, giá, thông số và công dụng thật trước khi đăng."
          />
        </div>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Hiểu sâu hơn">
        <ExplanationSection>
          <div>
            <h3 className="mb-3 text-base font-semibold text-foreground">
              Công cụ AI viết mô tả sản phẩm chủ shop có thể dùng
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[
                {
                  name: "ChatGPT miễn phí",
                  useFor: "Viết tay từng sản phẩm, đổi giọng, rút gọn mô tả trước khi đăng.",
                },
                {
                  name: "AI trong Shopee hoặc TikTok Shop Seller Center",
                  useFor: "Gợi ý mô tả ngay trong luồng đăng sản phẩm của sàn.",
                },
                {
                  name: "Canva Magic Write",
                  useFor: "Soạn caption ngắn đi kèm ảnh sản phẩm hoặc banner khuyến mãi.",
                },
                {
                  name: "CapCut AI",
                  useFor: "Gợi ý mô tả ngắn khi làm video bán hàng hoặc video giới thiệu sản phẩm.",
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
              Vòng lặp 4 bước: có thông tin, AI viết, bạn kiểm, rồi đăng
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              {[
                { label: "1. Có thông tin sản phẩm thật", desc: "Tên, chất liệu, giá, màu, thông số.", icon: PackageCheck },
                { label: "2. AI viết mô tả theo khuôn", desc: "Dùng format đã lưu để ra bản nháp.", icon: Wand2 },
                { label: "3. Bạn kiểm giá và chất liệu", desc: "Đối chiếu với hàng thật và nhà cung cấp.", icon: ShieldCheck },
                { label: "4. Đăng lên kênh bán", desc: "Chỉnh độ dài theo Shopee, Facebook hoặc TikTok Shop.", icon: Send },
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
                  title: "AI phóng đại công dụng",
                  desc: "Bẫy nguy hiểm nhất với hàng tiêu dùng, mỹ phẩm và thực phẩm.",
                  fix: "Ghi rõ: không thêm công dụng chưa được xác nhận.",
                },
                {
                  title: "Mô tả sai chất liệu",
                  desc: "Thông tin đầu vào mơ hồ khiến AI đoán cotton, da hoặc inox không đúng.",
                  fix: "Dán chất liệu thật từ nhãn hàng hoặc nhà cung cấp.",
                },
                {
                  title: "Giọng văn lệch khách",
                  desc: "Sản phẩm cho khách 18 đến 25 tuổi nhưng mô tả lại quá trang trọng.",
                  fix: "Ghi rõ độ tuổi, phong cách và kênh bán trong prompt.",
                },
                {
                  title: "Mô tả quá dài",
                  desc: "Kênh cần ngắn như TikTok Shop nhưng AI viết như bài blog.",
                  fix: "Ghi rõ giới hạn số từ, ví dụ dưới 50 từ.",
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
            Bài này dùng cùng logic với{" "}
            <TopicLink slug="ai-for-writing">AI hỗ trợ viết</TopicLink> và{" "}
            <TopicLink slug="ai-for-customer-replies">AI trả lời tin nhắn khách</TopicLink>
            : vai trò, nhiệm vụ, bối cảnh, định dạng và giọng văn. Khác nhau
            ở chỗ sản phẩm cần thông tin thật về giá, chất liệu và thông số.
          </Callout>

          <Callout variant="warning" title="Khi KHÔNG nên để AI tự thêm chi tiết">
            Không để AI tự thêm công dụng y tế hoặc sức khỏe cần chính xác tuyệt
            đối, cam kết bảo hành hoặc chính sách đổi trả, và số liệu kỹ thuật
            như dung tích hay công suất khi bạn chưa xác nhận với nhà cung cấp.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ khi dùng AI viết mô tả sản phẩm"
          points={[
            "Prompt mơ hồ khiến AI hỏi lại hoặc viết chung chung.",
            "Thông tin thật về chất liệu, giá, màu, thông số và khách mục tiêu phải đến từ shop.",
            "Khuôn prompt giúp viết hàng loạt vì mỗi sản phẩm chỉ cần đổi vài dòng dữ kiện.",
            "AI có thể đổi giọng cho từng kênh bán, nhưng bạn phải kiểm lại trước khi đăng.",
            "Bẫy nguy hiểm nhất là AI phóng đại công dụng hoặc tự thêm chi tiết chưa xác nhận.",
            "Mô tả tốt nên rõ cấu trúc: điểm nổi bật, lợi ích, thông tin thật và câu kêu gọi mua.",
          ]}
        />

        <div className="mt-4 space-y-2 rounded-xl border border-border bg-card p-5">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            Khám phá thêm
          </h4>
          <p className="text-sm leading-relaxed text-muted">
            Muốn luyện bản giao việc rộng hơn? Xem{" "}
            <TopicLink slug="ai-for-writing">AI hỗ trợ viết</TopicLink>. Muốn
            trả lời khách sau khi họ hỏi mua? Xem{" "}
            <TopicLink slug="ai-for-customer-replies">AI trả lời tin nhắn khách</TopicLink>.
          </p>
        </div>
      </LessonSection>

      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
