"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  MessageSquare,
  ClipboardCheck,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  LessonSection,
  TopicLink,
  CollapsibleDetail,
  ToggleCompare,
  SliderGroup,
  Reorderable,
  MatchPairs,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// METADATA
// ─────────────────────────────────────────────────────────────────────────────
export const metadata: TopicMeta = {
  slug: "in-context-learning",
  title: "In-Context Learning",
  titleVi: "Học trong ngữ cảnh",
  description:
    "Khả năng mô hình AI làm tác vụ mới chỉ từ vài ví dụ bạn gửi trong prompt, không cần huấn luyện lại.",
  category: "llm-concepts",
  tags: ["icl", "few-shot", "zero-shot", "prompt"],
  difficulty: "beginner",
  relatedSlugs: ["prompt-engineering", "chain-of-thought", "fine-tuning-vs-prompting"],
  vizType: "interactive",
};

// ─────────────────────────────────────────────────────────────────────────────
// DỮ LIỆU — phân loại phản hồi khách hàng tiếng Việt
// ─────────────────────────────────────────────────────────────────────────────
// Mỗi cấp độ "số ví dụ" (shot) trả về một output mô phỏng khác nhau để người
// học cảm nhận rõ tác động của ICL. Các con số % là con số minh hoạ giáo dục
// — chúng phản ánh xu hướng thực tế của ICL (tăng nhanh 0→3, chậm dần sau đó).
type ShotDemo = {
  label: string;
  examples: Array<{ review: string; label: string }>;
  aiAnswer: string;
  quality: number; // 0–100, phần trăm "đúng ý bạn"
  note: string;
  hit: boolean;
};

const CUSTOMER_INPUT = "Nhân viên thân thiện nhưng đồ ăn hơi lạt";

const SHOT_DEMOS: Record<number, ShotDemo> = {
  0: {
    label: "Không ví dụ",
    examples: [],
    aiAnswer:
      "Đây là nhận xét có cả mặt tích cực (nhân viên thân thiện) lẫn tiêu cực (đồ ăn hơi lạt), cần xem xét tổng thể…",
    quality: 25,
    note:
      "Không có ví dụ, AI không biết bạn muốn output gì. Nó viết một câu dài thay vì chọn một nhãn.",
    hit: false,
  },
  1: {
    label: "1 ví dụ",
    examples: [{ review: "Quán này tuyệt vời, tôi sẽ quay lại!", label: "Tích cực" }],
    aiAnswer: "Tích cực",
    quality: 55,
    note:
      "Mới có 1 ví dụ thuộc nhãn Tích cực, AI thiên lệch theo nhãn nó đã thấy — dù nhận xét thực ra là trung tính.",
    hit: false,
  },
  3: {
    label: "3 ví dụ",
    examples: [
      { review: "Quán này tuyệt vời, tôi sẽ quay lại!", label: "Tích cực" },
      { review: "Dịch vụ quá tệ, chờ 40 phút không ai ra", label: "Tiêu cực" },
      { review: "Giá hợp lý, không gian ổn, đồ ăn được", label: "Trung tính" },
    ],
    aiAnswer: "Trung tính",
    quality: 90,
    note:
      "3 ví dụ phủ đủ 3 nhãn → AI hiểu bạn muốn chọn 1 nhãn và biết nhãn trung tính là lựa chọn đúng cho câu có cả khen lẫn chê nhẹ.",
    hit: true,
  },
};

const SHOT_LEVELS = [0, 1, 3] as const;

// ─────────────────────────────────────────────────────────────────────────────
// DEMO 2 — KÉO VÍ DỤ VÀO PROMPT (Reorderable)
// Người học sắp xếp ví dụ để tạo prompt "phiên dịch email khách hàng sang
// phong cách công ty" — thứ tự hợp lý: khen trước, chê sau, trung tính cuối.
// ─────────────────────────────────────────────────────────────────────────────
const PROMPT_BUILDER_ITEMS = [
  "Câu mô tả nhiệm vụ: \"Viết email phản hồi khách hàng theo tone công ty.\"",
  "Ví dụ 1 — khen sản phẩm  →  Cảm ơn chân thành + gợi ý sản phẩm liên quan.",
  "Ví dụ 2 — phàn nàn giao hàng  →  Xin lỗi ngắn + đưa mã giảm giá xin lỗi.",
  "Ví dụ 3 — hỏi chính sách đổi trả  →  Trả lời rõ ràng, đính kèm link.",
  "Câu hỏi thật của khách: \"Tôi muốn biết chính sách bảo hành sản phẩm A?\"",
];

// Thứ tự đúng: task đầu → 3 ví dụ → câu hỏi cuối
const PROMPT_BUILDER_CORRECT = [0, 1, 2, 3, 4];

// ─────────────────────────────────────────────────────────────────────────────
// DEMO 3 — TRÍCH XUẤT THÔNG TIN HOÁ ĐƠN (ToggleCompare)
// ─────────────────────────────────────────────────────────────────────────────
const INVOICE_TEXT =
  "Ngày 15/03/2025, Công ty TNHH Ánh Dương mua 12 thùng nước suối Aquafina, đơn giá 85.000đ/thùng, tổng 1.020.000đ, đã thanh toán chuyển khoản.";

// ─────────────────────────────────────────────────────────────────────────────
// BẢNG SO SÁNH 3 CHẾ ĐỘ (Zero / One / Few shot)
// ─────────────────────────────────────────────────────────────────────────────
const MODE_PANELS = [
  {
    key: "zero",
    title: "Zero-shot — không ví dụ",
    subtitle: "Chỉ mô tả việc cần làm",
    emoji: <MessageSquare className="h-5 w-5" />,
    accent: "border-slate-300 bg-slate-50 dark:bg-slate-800/40 dark:border-slate-700",
    headerColor: "text-slate-700 dark:text-slate-200",
    bullets: [
      "Prompt cực ngắn, rẻ nhất.",
      "Phù hợp việc quen thuộc (tóm tắt, dịch).",
      "Dễ sai format khi việc lạ.",
    ],
    example: "Hãy phân loại cảm xúc câu sau: \"…\"",
  },
  {
    key: "one",
    title: "One-shot — 1 ví dụ",
    subtitle: "Một mẫu để AI bắt chước",
    emoji: <Sparkles className="h-5 w-5" />,
    accent: "border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700/60",
    headerColor: "text-amber-700 dark:text-amber-300",
    bullets: [
      "AI khoá được format đầu ra.",
      "Dễ thiên lệch theo nhãn ví dụ duy nhất.",
      "Nên dùng khi format mới, task đơn giản.",
    ],
    example: "Mẫu: \"Quán tuyệt vời!\" → Tích cực\n\nGiờ phân loại: \"…\"",
  },
  {
    key: "few",
    title: "Few-shot — 3–5 ví dụ",
    subtitle: "Phủ đủ mọi trường hợp",
    emoji: <ClipboardCheck className="h-5 w-5" />,
    accent: "border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-700/60",
    headerColor: "text-emerald-700 dark:text-emerald-300",
    bullets: [
      "Sweet spot cho hầu hết việc văn phòng.",
      "Cần phủ mọi nhãn bạn muốn AI trả về.",
      "Chất lượng tăng nhanh, sau 5–8 ví dụ tăng chậm.",
    ],
    example:
      "Mẫu 1: \"Dịch vụ tệ\" → Tiêu cực\nMẫu 2: \"Rất hài lòng!\" → Tích cực\nMẫu 3: \"Bình thường\" → Trung tính\n\nGiờ phân loại: \"…\"",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CÁC CẶP NỐI — loại việc vs số ví dụ khuyên dùng
// ─────────────────────────────────────────────────────────────────────────────
const TASK_EXAMPLE_PAIRS = [
  { left: "Tóm tắt email dài thành 3 gạch đầu dòng", right: "0 ví dụ (zero-shot) là đủ" },
  { left: "Viết email theo đúng tone công ty bạn", right: "2–3 ví dụ email cũ của bạn" },
  { left: "Trích xuất 5 trường từ hoá đơn Việt", right: "3–5 ví dụ đầy đủ trường" },
  { left: "Phân loại phản hồi thành 4 nhãn hiếm gặp", right: "5–8 ví dụ cover mọi nhãn" },
];

// ─────────────────────────────────────────────────────────────────────────────
// QUIZ
// ─────────────────────────────────────────────────────────────────────────────
const quizQuestions: QuizQuestion[] = [
  {
    question:
      "\"In-context learning\" (ICL) trong một câu đơn giản nhất là gì?",
    options: [
      "Bạn gửi dữ liệu của công ty lên máy chủ để AI được huấn luyện lại.",
      "Bạn cho AI vài ví dụ ngay trong prompt, AI làm theo mà không cần ai huấn luyện lại gì cả.",
      "AI tự động tìm thông tin trên Internet rồi trả lời.",
      "Một loại model mới chỉ hoạt động offline.",
    ],
    correct: 1,
    explanation:
      "ICL là cách bạn \"dạy tạm\" AI bằng vài ví dụ trong prompt. Không có huấn luyện lại, không có upload dữ liệu — chỉ là bạn viết ví dụ vào ô chat. Khi đóng cửa sổ chat, AI quên ngay — vì đây không phải học vĩnh viễn.",
  },
  {
    question:
      "Bạn muốn AI trả lời email khách hàng theo tone công ty của bạn. Cách nào rẻ nhất, nhanh nhất, mà vẫn hiệu quả?",
    options: [
      "Thuê chuyên gia AI huấn luyện riêng một mô hình cho công ty.",
      "Copy 3 email mẫu bạn đã viết trước đây dán vào chat, rồi nhờ AI viết email mới theo phong cách tương tự.",
      "Chờ AI phiên bản mới biết tiếng Việt tốt hơn.",
      "Gửi toàn bộ hộp thư cho AI đọc trước 1 tuần.",
    ],
    correct: 1,
    explanation:
      "Đây là few-shot ICL điển hình: 3 ví dụ là đủ để AI bắt chước tone. Không tốn một đồng huấn luyện, không chờ đợi. Nếu 3 ví dụ chưa đủ, bạn có thể thêm 1–2 ví dụ nữa — nhưng thường 3 là đẹp rồi.",
  },
  {
    question:
      "Bạn kéo từ 3 ví dụ lên 30 ví dụ trong prompt. Hệ quả rõ nhất là gì?",
    options: [
      "Chất lượng câu trả lời tăng gấp 10 lần.",
      "Không thay đổi gì cả.",
      "Prompt dài hơn → tốn phí token hơn, chậm hơn, nhưng chất lượng hầu như không tăng thêm.",
      "AI tự xoá bớt ví dụ để vừa context.",
    ],
    correct: 2,
    explanation:
      "Sau 5–8 ví dụ tốt, lợi ích tăng thêm rất nhỏ (diminishing returns). Bạn chỉ tốn thêm tiền mà không tốt hơn bao nhiêu. 3–5 ví dụ đa dạng thường là sweet spot.",
  },
  {
    question:
      "Bạn có 3 ví dụ: 2 dán nhãn \"Tích cực\", 1 dán nhãn \"Tiêu cực\" (không có ví dụ \"Trung tính\"). Gửi câu \"Bình thường, không có gì đặc biệt\" — AI sẽ có xu hướng gì?",
    options: [
      "Trả về \"Trung tính\" dù chưa thấy ví dụ nào.",
      "Ép vào một trong 2 nhãn đã thấy (Tích cực hoặc Tiêu cực), vì AI bắt chước pattern ví dụ.",
      "Từ chối trả lời.",
      "Tự động thêm một nhãn mới mà không ai yêu cầu.",
    ],
    correct: 1,
    explanation:
      "ICL rất \"nhìn mẫu mà đoán format\". Nếu ví dụ không phủ nhãn bạn muốn, AI sẽ ép câu trả lời về các nhãn đã thấy. Quy tắc vàng: luôn phủ đủ mọi nhãn trong bộ ví dụ.",
  },
  {
    question:
      "Đồng nghiệp hỏi: \"Mình đưa 3 ví dụ lên chat, ngày mai AI có nhớ không?\"",
    options: [
      "Nhớ vĩnh viễn, vì AI học từ bạn.",
      "Quên hoàn toàn khi bạn mở cuộc chat mới — ví dụ chỉ sống trong phiên hiện tại.",
      "Chỉ nhớ với tài khoản của bạn, không nhớ với người khác.",
      "Nhớ 24 giờ rồi quên.",
    ],
    correct: 1,
    explanation:
      "ICL không thay đổi \"bộ não\" của AI. Khi bạn mở chat mới, bạn phải dán lại ví dụ nếu muốn AI theo tone đó. Đây cũng là lý do nhiều công ty lưu bộ ví dụ vào \"system prompt\" để không phải copy mỗi lần.",
  },
  {
    question:
      "Sếp hỏi: \"Việc nào xứng đáng chi tiền để huấn luyện lại (fine-tune) thay vì dán ví dụ mỗi lần?\"",
    options: [
      "Mọi việc — fine-tune luôn tốt hơn.",
      "Khi bạn có vài ví dụ và vài người dùng.",
      "Khi mỗi tháng bạn chạy hàng trăm nghìn request giống nhau và cần prompt thật ngắn, tiết kiệm dài hạn.",
      "Khi bạn muốn thử mô hình mới lần đầu.",
    ],
    correct: 2,
    explanation:
      "Fine-tune rẻ/request nhưng đắt khởi tạo. Chỉ đáng khi traffic lớn, bài toán ổn định. Với việc văn phòng hằng ngày (vài chục-vài trăm lần/tháng), ICL là đúng — nhanh, rẻ, dễ sửa.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT CHÍNH
// ─────────────────────────────────────────────────────────────────────────────
export default function InContextLearningTopic() {
  return (
    <>
      {/* ═════════════════════════════════════════════════════════════════════
          BƯỚC 1 — DỰ ĐOÁN
          ═════════════════════════════════════════════════════════════════════ */}
      <LessonSection step={1} totalSteps={8} label="Thử đoán">
        <PredictionGate
          question="Bạn cho AI xem 3 email trả lời khách hàng theo phong cách công ty bạn, rồi nhờ viết email thứ 4 — bạn nghĩ chất lượng sẽ thế nào so với lúc không có ví dụ?"
          options={[
            "Không khác gì — AI vẫn viết như cũ.",
            "Kém hơn — ví dụ làm AI bối rối.",
            "Tốt hơn rõ rệt — AI bắt chước tone của bạn ngay.",
          ]}
          correct={2}
          explanation="Đây chính là trải nghiệm hầu hết người dùng công sở bất ngờ nhất: chỉ cần 2–3 ví dụ dán vào chat, AI bắt được giọng viết của bạn. Kỹ thuật này có tên riêng — in-context learning — và nó là món quà miễn phí đi kèm mọi mô hình AI hiện đại."
        >
          <p className="text-sm text-muted mt-4">
            Hôm nay bạn sẽ thấy cùng một AI, cùng một câu hỏi, nhưng kết quả đổi khác hoàn toàn khi
            bạn thêm 0, 1, hay 3 ví dụ vào prompt.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ═════════════════════════════════════════════════════════════════════
          BƯỚC 2 — ẨN DỤ
          ═════════════════════════════════════════════════════════════════════ */}
      <LessonSection step={2} totalSteps={8} label="Kết nối với đời sống">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Giống như dạy nhân viên mới trong ngày đầu tiên
          </h3>
          <p className="text-sm text-foreground leading-relaxed">
            Hãy tưởng tượng bạn vừa tuyển một bạn nhân viên cực thông minh nhưng chưa biết văn hoá
            công ty. Bạn có hai cách:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-accent/40 bg-accent-light p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white text-xs font-bold">
                  A
                </span>
                <span className="text-sm font-semibold text-accent-dark">
                  Cho xem 3 email mẫu
                </span>
              </div>
              <p className="text-sm text-foreground">
                Bạn in 3 email bạn đã từng viết, đưa cho nhân viên xem. Họ viết email mới theo cùng
                tone — <strong>ngay trong ngày đầu.</strong>
              </p>
              <p className="text-xs text-muted italic">
                Đây là <strong>in-context learning</strong> của con người.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-400 text-white text-xs font-bold">
                  B
                </span>
                <span className="text-sm font-semibold text-foreground">
                  Gửi đi học khoá 3 tháng
                </span>
              </div>
              <p className="text-sm text-foreground">
                Bạn gửi nhân viên đi đào tạo chuyên sâu về phong cách công ty. Kiến thức ngấm vĩnh
                viễn, nhưng phải trả học phí và <strong>chờ 3 tháng.</strong>
              </p>
              <p className="text-xs text-muted italic">
                Đây là <strong>fine-tuning</strong> — huấn luyện lại mô hình.
              </p>
            </div>
          </div>
          <Callout variant="insight" title="Điểm mấu chốt">
            Với 99% công việc văn phòng hằng ngày (viết email, tóm tắt cuộc họp, phân loại phản hồi,
            trích xuất hoá đơn), bạn chỉ cần cách A. Vài ví dụ dán vào prompt là đủ — không cần
            đội kỹ sư, không cần huấn luyện, không cần chờ đợi.
          </Callout>
        </div>
      </LessonSection>

      {/* ═════════════════════════════════════════════════════════════════════
          BƯỚC 3 — VISUALIZATION (3 DEMO TƯƠNG TÁC)
          ═════════════════════════════════════════════════════════════════════ */}
      <LessonSection step={3} totalSteps={8} label="Tự tay thử">
        <VisualizationSection topicSlug={metadata.slug}>
          {/* ── DEMO 1 — SliderGroup: 0 → 1 → 3 ví dụ ──────────────── */}
          <LessonSection label="Demo 1 — Kéo thanh số ví dụ và xem AI đổi câu trả lời">
            <p className="text-sm text-muted mb-4">
              Cùng một câu nhận xét của khách, cùng một AI. Chỉ khác: có bao nhiêu ví dụ trong
              prompt. Kéo thanh dưới đây từ <strong>0 → 1 → 3</strong> để thấy AI &ldquo;thay đổi
              thái độ&rdquo; thế nào.
            </p>
            <SliderGroup
              sliders={[
                {
                  key: "shots",
                  label: "Số ví dụ trong prompt",
                  min: 0,
                  max: 2,
                  step: 1,
                  defaultValue: 0,
                },
              ]}
              visualization={(vals) => {
                const idx = Math.round(vals.shots ?? 0);
                const shot = SHOT_LEVELS[Math.max(0, Math.min(SHOT_LEVELS.length - 1, idx))];
                const demo = SHOT_DEMOS[shot];
                return (
                  <div className="w-full space-y-3">
                    {/* Prompt được xây */}
                    <div className="rounded-lg border border-border bg-card overflow-hidden">
                      <div className="px-3 py-1.5 border-b border-border bg-surface/40 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-foreground">
                          Prompt đang gửi AI
                        </span>
                        <span className="text-[10px] text-tertiary">
                          {shot === 0 ? "zero-shot" : `${shot}-shot`}
                        </span>
                      </div>
                      <AnimatePresence initial={false}>
                        {demo.examples.map((ex, i) => (
                          <motion.div
                            key={`${shot}-${i}`}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.22, delay: i * 0.04 }}
                            className="px-3 py-1.5 border-b border-border bg-surface/20 text-[11px]"
                          >
                            <span className="text-tertiary">Mẫu {i + 1}: </span>
                            <span className="text-foreground">&ldquo;{ex.review}&rdquo;</span>
                            <span className="text-accent font-medium"> → {ex.label}</span>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      <div className="px-3 py-2 border-b border-border text-[11px]">
                        <span className="text-tertiary">Câu hỏi thật: </span>
                        <span className="text-foreground font-medium">
                          &ldquo;{CUSTOMER_INPUT}&rdquo;
                        </span>
                      </div>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={shot}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.25 }}
                          className="px-3 py-2 bg-accent-light"
                        >
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] text-accent font-bold uppercase tracking-wide">
                              AI trả lời
                            </span>
                            {demo.hit ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 text-amber-500" />
                            )}
                          </div>
                          <p className="text-[12px] text-foreground leading-snug">
                            {demo.aiAnswer}
                          </p>
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Thanh chất lượng */}
                    <div className="rounded-lg border border-border bg-card p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-muted">Chất lượng &ldquo;đúng ý bạn&rdquo;</span>
                        <span className="text-[11px] font-bold text-accent">
                          {demo.quality}%
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-surface overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 via-accent to-emerald-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${demo.quality}%` }}
                          transition={{ duration: 0.4 }}
                        />
                      </div>
                      <p className="mt-2 text-[11px] text-muted italic leading-relaxed">
                        {demo.note}
                      </p>
                    </div>
                  </div>
                );
              }}
            />
          </LessonSection>

          {/* ── DEMO 2 — Sắp xếp prompt (Reorderable) ────────────────── */}
          <LessonSection label="Demo 2 — Tự xếp prompt đúng thứ tự">
            <p className="text-sm text-muted mb-4">
              Một prompt few-shot tốt có thứ tự rất rõ: <strong>task → ví dụ → câu hỏi</strong>.
              Các dòng dưới đây đang bị xáo trộn. Kéo chúng về đúng thứ tự một prompt hiệu quả
              thường có.
            </p>
            <Reorderable
              items={PROMPT_BUILDER_ITEMS}
              correctOrder={PROMPT_BUILDER_CORRECT}
              instruction="Gợi ý: bắt đầu bằng mô tả nhiệm vụ, kết thúc bằng câu hỏi thật."
            />
            <Callout variant="tip" title="Tại sao thứ tự quan trọng?">
              AI đọc prompt từ trên xuống dưới. Task ở đầu giúp AI biết &ldquo;mình đang làm gì&rdquo;.
              Ví dụ ở giữa dạy format. Câu hỏi ở cuối giúp AI tập trung vào phần cần trả lời. Đảo lộn
              thứ tự → AI dễ trả lời ví dụ thay vì câu hỏi thật.
            </Callout>
          </LessonSection>

          {/* ── DEMO 3 — Trích xuất hoá đơn (ToggleCompare) ────────── */}
          <LessonSection label="Demo 3 — Trích xuất hoá đơn: không ví dụ vs có ví dụ">
            <p className="text-sm text-muted mb-4">
              Bạn là nhân viên kế toán. Bạn muốn AI đọc một đoạn mô tả bằng tiếng Việt và trích ra
              các trường (ngày, khách hàng, số lượng, giá, tổng tiền) thành bảng. Đây là lúc
              few-shot toả sáng rõ rệt nhất.
            </p>

            <div className="rounded-lg border border-border bg-surface/40 p-3 mb-4 text-xs">
              <span className="text-tertiary">Đoạn mô tả hoá đơn (input): </span>
              <span className="text-foreground italic">&ldquo;{INVOICE_TEXT}&rdquo;</span>
            </div>

            <ToggleCompare
              labelA="Zero-shot (mơ ước)"
              labelB="Few-shot (có 2 ví dụ)"
              description="Cùng đoạn hoá đơn, cùng AI. Chỉ khác: có hay không 2 ví dụ mẫu."
              childA={
                <div className="rounded-xl border border-amber-300/60 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700/60 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                      AI đoán format — mỗi lần một kiểu
                    </span>
                  </div>
                  <div className="rounded-lg bg-white/60 dark:bg-slate-900/40 p-3 text-xs font-mono text-foreground leading-relaxed whitespace-pre-wrap">
                    {`Đây là một hoá đơn bán hàng. Công ty TNHH Ánh
Dương đã mua 12 thùng nước suối Aquafina
vào ngày 15 tháng 3 năm 2025. Đơn giá
mỗi thùng là 85.000 đồng. Tổng cộng là
1.020.000đ và đã thanh toán chuyển khoản.`}
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 italic">
                    Output là một đoạn văn — không thể nhập thẳng vào Excel. Ngày mai bạn hỏi hoá
                    đơn khác, AI có thể viết kiểu hoàn toàn khác.
                  </p>
                </div>
              }
              childB={
                <div className="rounded-xl border border-emerald-300/60 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-700/60 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                      AI khoá đúng format bạn cần — lần nào cũng thế
                    </span>
                  </div>
                  <div className="rounded-lg overflow-hidden border border-emerald-200 dark:border-emerald-800 bg-white/70 dark:bg-slate-900/40">
                    <table className="w-full text-xs">
                      <thead className="bg-emerald-100/60 dark:bg-emerald-900/30">
                        <tr>
                          <th className="text-left px-2.5 py-1.5 font-semibold text-emerald-900 dark:text-emerald-200">
                            Trường
                          </th>
                          <th className="text-left px-2.5 py-1.5 font-semibold text-emerald-900 dark:text-emerald-200">
                            Giá trị
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ["Ngày", "15/03/2025"],
                          ["Khách hàng", "Công ty TNHH Ánh Dương"],
                          ["Mặt hàng", "Nước suối Aquafina"],
                          ["Số lượng", "12 thùng"],
                          ["Đơn giá", "85.000đ"],
                          ["Tổng tiền", "1.020.000đ"],
                          ["Thanh toán", "Chuyển khoản"],
                        ].map(([k, v], i) => (
                          <tr
                            key={k}
                            className={i % 2 === 0 ? "bg-white/40 dark:bg-slate-900/20" : ""}
                          >
                            <td className="px-2.5 py-1 font-medium text-foreground">{k}</td>
                            <td className="px-2.5 py-1 text-foreground">{v}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300 italic">
                    Copy nguyên vào Excel, hoặc chuyển sang Google Sheets, hoặc gửi hệ thống kế toán.
                    Mỗi hoá đơn đều trả về đúng 7 trường, đúng thứ tự.
                  </p>
                </div>
              }
            />

            <Callout variant="insight" title="Quy luật trích xuất">
              Khi bạn cần AI trả về đúng một bảng/JSON/format cứng, <strong>luôn luôn</strong> cho
              2–3 ví dụ. Mô tả bằng lời &ldquo;hãy trích ra các trường&rdquo; gần như không bao giờ
              đủ — AI cần <em>thấy</em> chứ không chỉ <em>nghe tả</em>.
            </Callout>
          </LessonSection>
        </VisualizationSection>
      </LessonSection>

      {/* ═════════════════════════════════════════════════════════════════════
          BƯỚC 4 — AHA MOMENT
          ═════════════════════════════════════════════════════════════════════ */}
      <LessonSection step={4} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          Bạn vừa thấy AI &ldquo;học&rdquo; một việc hoàn toàn mới chỉ từ vài ví dụ —{" "}
          <strong>không cần huấn luyện lại, không cần code, không cần upload dữ liệu.</strong>{" "}
          Đây chính là <strong>in-context learning</strong>: bạn &ldquo;dạy tạm&rdquo; AI bằng vài
          mẫu trong prompt, và AI bắt chước ngay trong lần trả lời đó. Đây là siêu năng lực miễn phí
          đi kèm mọi mô hình AI hiện đại — và là lý do tại sao prompt của bạn &ldquo;có ví dụ&rdquo;
          luôn đánh bại prompt không có ví dụ.
        </AhaMoment>
      </LessonSection>

      {/* ═════════════════════════════════════════════════════════════════════
          BƯỚC 5 — THỬ THÁCH NHỎ
          ═════════════════════════════════════════════════════════════════════ */}
      <LessonSection step={5} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Bạn dán 4 ví dụ phân loại cảm xúc vào chat. Xong câu cuối bạn lại yêu cầu AI dịch sang tiếng Anh một câu khác. AI sẽ làm gì?"
          options={[
            "Phân loại câu đó — vì AI đã học phân loại từ 4 ví dụ trên.",
            "Dịch sang tiếng Anh — vì câu hỏi cuối ưu tiên hơn, ví dụ chỉ là gợi ý.",
            "Báo lỗi vì prompt mâu thuẫn.",
          ]}
          correct={1}
          explanation="AI nhìn toàn bộ context, nhưng câu hỏi cuối cùng mới là &ldquo;mệnh lệnh&rdquo;. Ví dụ chỉ là gợi ý format — nếu câu cuối nói rõ &ldquo;dịch&rdquo;, AI dịch. Đây là lý do nhiều người viết prompt sai: nhét ví dụ nhưng câu cuối viết lạc hướng."
        />
        <p className="text-sm text-muted mt-4">
          Muốn đào sâu kỹ thuật viết prompt? Xem{" "}
          <TopicLink slug="prompt-engineering">prompt engineering</TopicLink>. Muốn AI vừa bắt
          chước format vừa suy luận từng bước? Ghé{" "}
          <TopicLink slug="chain-of-thought">chain-of-thought</TopicLink>.
        </p>
      </LessonSection>

      {/* ═════════════════════════════════════════════════════════════════════
          BƯỚC 6 — GIẢI THÍCH SÂU (VISUAL-HEAVY, KHÔNG CODE, KHÔNG MATH)
          ═════════════════════════════════════════════════════════════════════ */}
      <LessonSection step={6} totalSteps={8} label="Hiểu sâu hơn">
        <ExplanationSection topicSlug={metadata.slug}>
          {/* ── 3 chế độ ICL dưới dạng 3 thẻ trực quan ──────────────── */}
          <div className="not-prose">
            <h3 className="text-base font-semibold text-foreground mb-3">
              Ba chế độ học trong ngữ cảnh — chọn theo việc
            </h3>
            <div className="grid md:grid-cols-3 gap-3">
              {MODE_PANELS.map((m) => (
                <motion.div
                  key={m.key}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.3 }}
                  className={`rounded-2xl border-2 p-4 space-y-3 ${m.accent}`}
                >
                  <div className="flex items-center gap-2">
                    <div className={m.headerColor}>{m.emoji}</div>
                    <div>
                      <p className={`text-sm font-bold ${m.headerColor}`}>{m.title}</p>
                      <p className="text-[11px] text-muted">{m.subtitle}</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-white/60 dark:bg-slate-900/40 p-2.5 text-[11px] font-mono text-foreground whitespace-pre-wrap leading-relaxed min-h-[72px]">
                    {m.example}
                  </div>
                  <ul className="space-y-1 text-[11px] text-foreground">
                    {m.bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <ArrowRight className={`h-3 w-3 mt-0.5 shrink-0 ${m.headerColor}`} />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── Khi nào few-shot thất bại? 3 thẻ cảnh báo ──────────── */}
          <div className="not-prose mt-8 space-y-3">
            <h3 className="text-base font-semibold text-foreground">
              Ba lúc few-shot &ldquo;quay xe&rdquo; — cần tránh
            </h3>
            <Callout variant="warning" title="1. Ví dụ mâu thuẫn nhau">
              Bạn dán ví dụ 1: &ldquo;Dịch vụ chậm&rdquo; → Tiêu cực. Ví dụ 2: &ldquo;Dịch vụ
              chậm&rdquo; → Trung tính. AI sẽ bối rối và chọn một cách ngẫu nhiên. Luôn rà lại bộ
              ví dụ: cùng đầu vào phải cùng nhãn.
            </Callout>
            <Callout variant="warning" title="2. Format không nhất quán">
              Ví dụ 1 viết &ldquo;→ Tích cực.&rdquo; (có dấu chấm). Ví dụ 2 viết &ldquo;→
              tích cực&rdquo; (viết thường). AI sẽ pha trộn 2 kiểu ở câu trả lời mới và bạn mất
              format cứng. Copy-paste chính xác, đừng gõ lại.
            </Callout>
            <Callout variant="warning" title="3. Rò rỉ thông tin nhạy cảm">
              Ví dụ bạn dán có chứa số CMND, số tài khoản, email thật của khách? Nó sẽ được gửi
              nguyên văn lên máy chủ AI mỗi lần bạn dùng. Thay tên/số thật bằng placeholder (Nguyễn
              Văn A, 0900-000-000) trong mọi ví dụ.
            </Callout>
          </div>

          {/* ── MatchPairs: loại việc ↔ số ví dụ khuyên dùng ───────── */}
          <div className="not-prose mt-8">
            <h3 className="text-base font-semibold text-foreground mb-2">
              Nối việc bạn cần làm với số ví dụ khuyên dùng
            </h3>
            <p className="text-sm text-muted mb-3">
              Không phải việc nào cũng cần 5 ví dụ. Thử nối xem bạn đoán đúng bao nhiêu.
            </p>
            <MatchPairs
              pairs={TASK_EXAMPLE_PAIRS}
              instruction="Chọn một mục Cột A, rồi chọn một mục Cột B để nối."
            />
          </div>

          {/* ── Checklist dùng prompt có ví dụ hiệu quả ────────────── */}
          <div className="not-prose mt-8 rounded-2xl border border-border bg-surface/40 p-5">
            <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-accent" />
              Danh sách 6 việc cần làm khi viết prompt có ví dụ
            </h3>
            <ol className="space-y-2.5 text-sm">
              {[
                "Viết 1 câu mô tả nhiệm vụ ở đầu prompt — AI cần biết đang làm gì.",
                "Chọn 2–3 ví dụ đa dạng, phủ đủ mọi nhãn/trường hợp bạn muốn AI trả về.",
                "Copy ví dụ chính xác từng ký tự, kể cả dấu câu — format phải nhất quán.",
                "Che dữ liệu nhạy cảm bằng tên/số giả trước khi dán lên.",
                "Đặt câu hỏi thật ở cuối prompt, với cùng format như ví dụ (vd: \"Câu mới: … →\").",
                "Thử 5–10 câu thật, đếm xem AI đúng mấy lần — nếu sai nhiều, sửa ví dụ chứ không tăng số ví dụ.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-white text-[11px] font-bold">
                    {i + 1}
                  </span>
                  <span className="text-foreground leading-relaxed">{item}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* ── Ẩn danh chi tiết: vì sao AI làm được? ──────────────── */}
          <div className="not-prose mt-8">
            <CollapsibleDetail title="Vì sao AI &ldquo;học&rdquo; được mà không cần huấn luyện?">
              <div className="space-y-3 text-sm text-foreground">
                <p>
                  Câu trả lời ngắn: AI <strong>không học thật</strong>. Nó chỉ cực kỳ giỏi{" "}
                  <em>nhận ra pattern</em>.
                </p>
                <p>
                  Trong quá trình được đào tạo ban đầu (pre-training), AI đã đọc hàng tỷ ví dụ dạng
                  &ldquo;đầu vào → đầu ra&rdquo; (bài tập sách giáo khoa, câu hỏi-đáp trên web, hướng
                  dẫn code, v.v.). Nó học được một &ldquo;kỹ năng phổ quát&rdquo;: thấy vài ví dụ là
                  nhận ra &ldquo;à, đây là loại công việc tôi đã gặp&rdquo; và bắt chước format.
                </p>
                <p>
                  Khi bạn dán 3 email vào chat, AI không &ldquo;ghi nhớ&rdquo; email đó vào não. Nó
                  chỉ đọc chúng trong một lần trả lời duy nhất — giống thợ may nhìn 3 mẫu áo và may
                  theo, rồi quên ngay khi khách ra về. Đó là lý do đóng chat xong, AI sẽ không nhớ
                  gì.
                </p>
                <p>
                  Một ẩn dụ khác: bộ ví dụ giống như &ldquo;bản đồ nhanh&rdquo; bạn dúi vào tay
                  taxi. Tài xế đã biết đường Hà Nội (pre-training), bạn chỉ cần đưa bản đồ điểm đến
                  cụ thể của chuyến đi này (prompt) và tài xế đi theo. Xuống xe là bản đồ đó không
                  còn tác dụng.
                </p>
              </div>
            </CollapsibleDetail>
          </div>
        </ExplanationSection>
      </LessonSection>

      {/* ═════════════════════════════════════════════════════════════════════
          BƯỚC 7 — TÓM TẮT
          ═════════════════════════════════════════════════════════════════════ */}
      <LessonSection step={7} totalSteps={8} label="Tóm tắt">
        <MiniSummary
          title="Năm điều cần nhớ về học trong ngữ cảnh"
          points={[
            "Bạn “dạy” AI bằng cách dán vài ví dụ vào prompt — không cần upload, không cần huấn luyện, miễn phí.",
            "0 ví dụ (zero-shot) hợp việc quen; 3–5 ví dụ (few-shot) là sweet spot cho đa số việc văn phòng; nhiều hơn 8 thường không tốt hơn nữa.",
            "Chất lượng ví dụ quan trọng hơn số lượng — 3 ví dụ đa dạng ăn đứt 10 ví dụ na ná nhau.",
            "Ví dụ phải phủ mọi nhãn/trường hợp bạn muốn AI trả về, format tuyệt đối nhất quán.",
            "AI quên ngay khi đóng chat — muốn dùng lại, hãy lưu prompt mẫu trong Notion/Google Docs.",
          ]}
        />
      </LessonSection>

      {/* ═════════════════════════════════════════════════════════════════════
          BƯỚC 8 — QUIZ
          ═════════════════════════════════════════════════════════════════════ */}
      <LessonSection step={8} totalSteps={8} label="Kiểm tra hiểu bài">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
