"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  MessageSquare,
  Target,
  Users,
  ListChecks,
  Ruler,
  Mic,
  BookOpen as BookIcon,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  TabView,
  MatchPairs,
  DragDrop,
  LessonSection,
  TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "prompt-engineering",
  title: "Prompt Engineering",
  titleVi: "Kỹ thuật viết prompt",
  description:
    "Nghệ thuật thiết kế prompt rõ ràng để AI cho ra kết quả đúng ý — dành cho dân văn phòng, không cần lập trình.",
  category: "llm-concepts",
  tags: ["prompt", "llm", "few-shot", "instruction"],
  difficulty: "beginner",
  relatedSlugs: ["chain-of-thought", "in-context-learning", "temperature"],
  vizType: "interactive",
};

// ─── Dữ liệu cho Demo 1: Prompt Builder ───
// Mỗi thành phần người học bật/tắt → prompt được dựng lại + điểm chất lượng tăng.
interface PromptComponent {
  id: "role" | "task" | "context" | "format" | "tone" | "example";
  label: string;
  icon: typeof Users;
  snippet: string;
  weight: number; // điểm cộng khi bật
  color: string;
}

const PROMPT_COMPONENTS: PromptComponent[] = [
  {
    id: "role",
    label: "Vai trò",
    icon: Users,
    snippet: "Bạn là trợ lý hành chính nhiều năm kinh nghiệm.",
    weight: 12,
    color: "#2563EB",
  },
  {
    id: "task",
    label: "Nhiệm vụ cụ thể",
    icon: Target,
    snippet:
      "Hãy viết email xin nghỉ 3 ngày gửi sếp trực tiếp, lý do: vợ sinh con đầu lòng.",
    weight: 22,
    color: "#059669",
  },
  {
    id: "context",
    label: "Bối cảnh",
    icon: BookIcon,
    snippet:
      "Em đã bàn giao công việc cho chị Lan và sẽ kiểm tra email mỗi tối.",
    weight: 14,
    color: "#7C3AED",
  },
  {
    id: "format",
    label: "Định dạng",
    icon: ListChecks,
    snippet:
      "Định dạng: mở đầu – lý do – cam kết bàn giao – kết thư. Mỗi đoạn 1-2 câu.",
    weight: 12,
    color: "#D97706",
  },
  {
    id: "tone",
    label: "Giọng văn",
    icon: Mic,
    snippet: "Giọng trang trọng nhưng thân thiện, tránh khách sáo cứng nhắc.",
    weight: 10,
    color: "#DB2777",
  },
  {
    id: "example",
    label: "Ví dụ mẫu",
    icon: Sparkles,
    snippet:
      'Ví dụ giọng mong muốn: "Kính gửi anh Minh, em xin phép nghỉ từ thứ 5 đến thứ 7…"',
    weight: 10,
    color: "#DC2626",
  },
];

// ─── Dữ liệu cho Tab gallery (4 khung mẫu cho dân văn phòng) ───
const TEMPLATES = [
  {
    label: "Email xin nghỉ",
    slot1: "Vai trò",
    slot1Value: "Bạn là nhân viên văn phòng biết viết email khéo léo.",
    slot2: "Nhiệm vụ",
    slot2Value:
      "Viết email xin nghỉ 2 ngày gửi sếp, lý do: khám sức khỏe định kỳ.",
    slot3: "Ràng buộc",
    slot3Value: "Độ dài ~80 từ, giọng trang trọng, có đề xuất người thay ca.",
    preview:
      "Kính gửi anh Minh, em xin phép nghỉ thứ 5 và thứ 6 tuần này để khám sức khỏe định kỳ. Trong thời gian em vắng, chị Lan sẽ thay em xử lý báo cáo tuần. Em sẽ kiểm tra email vào buổi tối và phản hồi ngay nếu anh cần. Em xin cảm ơn anh.",
  },
  {
    label: "Tóm tắt cuộc họp",
    slot1: "Vai trò",
    slot1Value: "Bạn là thư ký cuộc họp có khả năng tóm tắt súc tích.",
    slot2: "Nhiệm vụ",
    slot2Value:
      "Tóm tắt đoạn ghi âm cuộc họp 30 phút về kế hoạch Q2 thành biên bản.",
    slot3: "Ràng buộc",
    slot3Value:
      "Dưới 200 từ, chia 3 phần: quyết định chính – công việc giao – mốc thời gian.",
    preview:
      "Quyết định chính: ra mắt sản phẩm A trong tháng 5. Công việc giao: (1) Hương phụ trách landing page trước 20/4, (2) Tú chạy ads thử nghiệm 5 triệu. Mốc quan trọng: chốt bản demo 25/4, đánh giá kết quả 15/5.",
  },
  {
    label: "Bài đăng LinkedIn",
    slot1: "Vai trò",
    slot1Value: "Bạn là content creator chuyên viết LinkedIn cho dân văn phòng.",
    slot2: "Nhiệm vụ",
    slot2Value:
      "Viết bài chia sẻ cảm nhận sau khi hoàn thành khóa học phân tích dữ liệu.",
    slot3: "Ràng buộc",
    slot3Value:
      "Mở bài bằng câu hook gây tò mò, kết thư có CTA kêu gọi kết nối, 150 từ.",
    preview:
      "Ba tháng trước, em còn sợ Excel nâng cao. Hôm nay em vừa hoàn thành khóa phân tích dữ liệu cho marketer. Bài học lớn nhất: công cụ chỉ là phần ngọn, tư duy đặt câu hỏi đúng mới là gốc. Nếu anh chị cũng đang bắt đầu, mình kết nối nhé.",
  },
  {
    label: "Phản hồi khiếu nại",
    slot1: "Vai trò",
    slot1Value: "Bạn là chuyên viên chăm sóc khách hàng kỳ cựu.",
    slot2: "Nhiệm vụ",
    slot2Value:
      "Viết email trả lời khách hàng đang bức xúc vì đơn hàng giao trễ 5 ngày.",
    slot3: "Ràng buộc",
    slot3Value:
      "Giọng đồng cảm, có xin lỗi, có hành động khắc phục cụ thể, dưới 120 từ.",
    preview:
      "Chị Minh thân mến, em thực sự xin lỗi vì đơn hàng #HN2034 đến tay chị chậm tới 5 ngày so với cam kết. Em đã kiểm tra và lỗi nằm ở khâu vận chuyển của đối tác. Để bù đắp, em gửi chị voucher 15% cho đơn tiếp theo và nhờ đội giao hàng ưu tiên mọi đơn của chị trong 3 tháng tới. Mong chị thông cảm.",
  },
];

// ─── 5 pitfalls phổ biến ───
const PITFALLS: { title: string; bad: string; fix: string; variant: "warning" | "tip" | "insight" }[] = [
  {
    title: "Bẫy 1 — Prompt quá ngắn, thiếu bối cảnh",
    bad: '"Viết email xin lỗi"',
    fix: '"Viết email xin lỗi khách hàng doanh nghiệp vì giao báo cáo trễ 2 ngày. Giọng chuyên nghiệp, có cam kết cụ thể, dưới 100 từ."',
    variant: "warning",
  },
  {
    title: "Bẫy 2 — Yêu cầu nhiều thứ trong một câu rối",
    bad: '"Viết email và tóm tắt cuộc họp và dịch sang tiếng Anh"',
    fix: "Tách thành 3 prompt riêng, mỗi prompt một việc. Dùng xong cái này mới chuyển sang cái kế.",
    variant: "tip",
  },
  {
    title: "Bẫy 3 — Không nêu đối tượng đọc",
    bad: '"Viết bài giới thiệu sản phẩm"',
    fix: '"Viết bài giới thiệu máy lọc nước cho khách hàng là mẹ bỉm sữa 28-35 tuổi, ở chung cư Hà Nội."',
    variant: "warning",
  },
  {
    title: "Bẫy 4 — Quên cho ví dụ khi cần giọng đặc thù",
    bad: '"Viết giống giọng của sếp em"',
    fix: "Dán 1-2 email cũ của sếp vào prompt, rồi nói: “Viết tương tự giọng trên, nội dung mới là…”",
    variant: "insight",
  },
  {
    title: "Bẫy 5 — Không nói rõ độ dài & định dạng",
    bad: '"Tóm tắt báo cáo này"',
    fix: '"Tóm tắt báo cáo dưới đây thành 5 bullet, mỗi bullet 1 câu, tổng dưới 120 từ."',
    variant: "tip",
  },
];

// ─── Quiz cuối bài (5 câu) ───
const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Bạn cần AI viết email xin nghỉ 3 ngày gửi sếp. Prompt nào là tốt nhất?",
    options: [
      "Viết email xin nghỉ giúp tôi",
      "Viết email xin nghỉ 3 ngày gửi sếp trực tiếp, lý do: vợ sinh con đầu lòng, giọng trang trọng nhưng thân thiện, có cam kết bàn giao, khoảng 100 từ",
      "Email xin nghỉ ngắn gọn thôi",
      "Giúp tôi nghỉ phép",
    ],
    correct: 1,
    explanation:
      "Prompt tốt phải có: nhiệm vụ cụ thể, người nhận, lý do, giọng văn, ràng buộc. Option B đủ cả năm yếu tố — AI sẽ không phải đoán bừa.",
  },
  {
    question:
      "Khi muốn AI viết đúng giọng văn của bạn, cách hiệu quả nhất là gì?",
    options: [
      "Viết “viết giọng giống tôi”",
      "Dán 1-2 đoạn bạn đã viết trước đó, rồi yêu cầu “viết tương tự giọng trên”",
      "Viết bằng tiếng Anh cho AI dễ hiểu",
      "Gõ in hoa để AI chú ý",
    ],
    correct: 1,
    explanation:
      "AI không biết giọng của bạn trừ khi bạn cho nó xem. Dán ví dụ thật là cách nhanh nhất để AI bắt chước phong cách (few-shot prompting).",
  },
  {
    question:
      "Prompt “Tóm tắt tài liệu này thành 5 gạch đầu dòng, tổng dưới 150 từ, ngôn ngữ đơn giản” tốt vì điều gì?",
    options: [
      "Có nhiều chữ hơn nên AI làm tốt hơn",
      "Đã nêu rõ định dạng (5 bullet), độ dài (dưới 150 từ), và phong cách (đơn giản)",
      "Viết bằng giọng ra lệnh mạnh",
      "Có từ “tóm tắt” nên AI hiểu ngay",
    ],
    correct: 1,
    explanation:
      "Độ dài + định dạng + phong cách là ba ràng buộc (constraints) biến prompt từ mơ hồ thành thực thi được.",
  },
  {
    question:
      "Bạn vừa nhờ AI viết bài, nhưng kết quả chưa đúng ý. Nên làm gì tiếp?",
    options: [
      "Bỏ AI đi, tự viết cho nhanh",
      "Nói lại đúng phần chưa ổn: “Đoạn 2 quá cứng, hãy viết lại nhẹ nhàng hơn, giữ nguyên đoạn 1”",
      "Hỏi lại đúng prompt cũ lần nữa",
      "Khen AI để nó cố gắng hơn",
    ],
    correct: 1,
    explanation:
      "Prompt engineering là vòng lặp: thử → xem kết quả → chỉnh. Bảo AI sửa phần cụ thể nhanh hơn là viết lại từ đầu.",
  },
  {
    type: "fill-blank",
    question:
      "Công thức prompt hiệu quả: {blank} (bạn là ai) + nhiệm vụ cụ thể + {blank} (văn phong) + định dạng & {blank} (bao nhiêu chữ, mấy bullet…).",
    blanks: [
      { answer: "vai trò", accept: ["Vai trò", "role", "Role"] },
      { answer: "giọng văn", accept: ["Giọng văn", "tone", "Tone"] },
      { answer: "độ dài", accept: ["Độ dài", "length", "Length"] },
    ],
    explanation:
      "Bộ khung CRAFT rút gọn: Context (vai trò + bối cảnh) – Role – Action (nhiệm vụ) – Format – Tone. Thiếu bất kỳ mảnh nào, AI sẽ phải đoán.",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// DEMO 1 — PROMPT BUILDER (người học bật/tắt thành phần để dựng prompt)
// ═══════════════════════════════════════════════════════════════════════════
function PromptBuilderDemo() {
  const [enabled, setEnabled] = useState<Record<PromptComponent["id"], boolean>>({
    role: false,
    task: true, // task luôn bật mặc định vì không có task thì chẳng có gì
    context: false,
    format: false,
    tone: false,
    example: false,
  });

  function toggle(id: PromptComponent["id"]) {
    setEnabled((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const score = useMemo(() => {
    // Điểm gốc = 20 nếu có task, 5 nếu không
    let s = enabled.task ? 20 : 5;
    for (const c of PROMPT_COMPONENTS) {
      if (enabled[c.id] && c.id !== "task") s += c.weight;
    }
    return Math.min(100, s);
  }, [enabled]);

  const scoreColor =
    score >= 85 ? "#059669" : score >= 60 ? "#D97706" : "#DC2626";
  const scoreLabel =
    score >= 85 ? "Xuất sắc" : score >= 60 ? "Tạm ổn" : "Còn mơ hồ";

  const composed = PROMPT_COMPONENTS.filter((c) => enabled[c.id])
    .map((c) => c.snippet)
    .join("\n");

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">
        Bật từng mảnh ghép bên dưới và xem prompt được dựng lại theo thời gian
        thực. Thanh bên phải là điểm chất lượng ước lượng.
      </p>

      {/* Grid toggle thành phần */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {PROMPT_COMPONENTS.map((c) => {
          const Icon = c.icon;
          const on = enabled[c.id];
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              className={`flex items-center gap-2 rounded-lg border p-3 text-left text-xs transition-all ${
                on
                  ? "border-accent bg-accent-light shadow-sm"
                  : "border-border bg-surface hover:bg-surface-hover"
              }`}
              aria-pressed={on}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                style={{
                  backgroundColor: on ? c.color : "transparent",
                  color: on ? "#fff" : c.color,
                  border: on ? "none" : `1px solid ${c.color}`,
                }}
              >
                <Icon size={14} />
              </span>
              <span
                className={`flex-1 font-medium ${
                  on ? "text-foreground" : "text-muted"
                }`}
              >
                {c.label}
              </span>
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  on ? "bg-accent" : "bg-border"
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Khối prompt đang dựng + điểm */}
      <div className="grid gap-4 sm:grid-cols-5">
        {/* Prompt đang dựng */}
        <div className="sm:col-span-3 rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/15 p-4 min-h-[140px]">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare
              size={14}
              className="text-blue-600 dark:text-blue-400"
            />
            <span className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
              Prompt đang dựng
            </span>
          </div>
          <AnimatePresence mode="wait">
            <motion.pre
              key={composed}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="whitespace-pre-wrap text-sm font-sans leading-relaxed text-foreground"
            >
              {composed || "(Chưa bật mảnh nào — prompt đang trống)"}
            </motion.pre>
          </AnimatePresence>
        </div>

        {/* Thanh điểm */}
        <div className="sm:col-span-2 rounded-lg border border-border bg-card p-4 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-accent" />
              <span className="text-xs font-semibold uppercase tracking-wide text-accent">
                Điểm chất lượng
              </span>
            </div>
            <div className="flex items-end gap-2">
              <motion.span
                key={score}
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 240 }}
                className="text-4xl font-bold"
                style={{ color: scoreColor }}
              >
                {score}
              </motion.span>
              <span className="text-sm text-muted pb-1">/100</span>
            </div>
            <p
              className="text-xs font-semibold mt-1"
              style={{ color: scoreColor }}
            >
              {scoreLabel}
            </p>
          </div>
          <div className="h-2 w-full rounded-full bg-surface overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: scoreColor }}
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      </div>

      {/* Gợi ý mẹo */}
      {score < 85 && (
        <Callout variant="tip" title="Gợi ý">
          Thử bật thêm <strong>Vai trò</strong>, <strong>Bối cảnh</strong> hoặc{" "}
          <strong>Ví dụ mẫu</strong> — đó là ba mảnh dân văn phòng thường quên,
          nhưng giúp AI đi thẳng vào giọng bạn muốn.
        </Callout>
      )}
      {score >= 85 && (
        <Callout variant="insight" title="Đã đủ gia vị!">
          Prompt của bạn giờ có đủ vai trò, nhiệm vụ, ràng buộc và bối cảnh. AI
          không phải đoán — kết quả sẽ đi đúng ý ngay lần đầu.
        </Callout>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DEMO 2 — GHÉP CẶP PROMPT MƠ HỒ ↔ PROMPT CỤ THỂ
// ═══════════════════════════════════════════════════════════════════════════
function VagueVsSpecificDemo() {
  return (
    <MatchPairs
      instruction="Nối prompt mơ hồ bên trái với phiên bản cụ thể ở bên phải. Bấm một ô ở cột A, rồi bấm ô tương ứng ở cột B."
      pairs={[
        {
          left: "Viết email gửi sếp",
          right:
            "Viết email xin nghỉ 2 ngày gửi sếp trực tiếp, lý do họp phụ huynh, giọng lịch sự, dưới 80 từ",
        },
        {
          left: "Tóm tắt tài liệu này",
          right:
            "Tóm tắt báo cáo dưới đây thành 5 bullet, tổng dưới 150 từ, dành cho người không chuyên",
        },
        {
          left: "Viết bài quảng cáo sản phẩm",
          right:
            "Viết caption Facebook 60 từ cho máy lọc nước, đối tượng mẹ bỉm sữa, giọng ấm áp, có CTA đặt hàng",
        },
        {
          left: "Dịch đoạn này sang tiếng Anh",
          right:
            "Dịch đoạn dưới sang tiếng Anh kinh doanh trang trọng, giữ nguyên thuật ngữ ngành y, không dịch tên riêng",
        },
      ]}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DEMO 3 — PHẪU THUẬT PROMPT (DragDrop các mảnh còn thiếu vào đúng chỗ)
// ═══════════════════════════════════════════════════════════════════════════
function PromptSurgeryDemo() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle
            size={14}
            className="text-red-600 dark:text-red-400"
          />
          <span className="text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
            Prompt bệnh (khó cứu)
          </span>
        </div>
        <p className="text-sm text-foreground italic">
          &ldquo;Viết bài giới thiệu cho sản phẩm mới&rdquo;
        </p>
      </div>

      <p className="text-sm text-muted">
        Kéo từng mảnh ghép vào đúng vùng điều trị. Mỗi vùng chỉ nhận đúng một
        mảnh — AI đang chờ bạn làm rõ!
      </p>

      <DragDrop
        instruction="Kéo 4 mảnh ghép vào 4 ô tương ứng để biến prompt mơ hồ thành prompt rõ ràng."
        items={[
          {
            id: "piece-role",
            label: "Bạn là copywriter chuyên sản phẩm gia dụng",
          },
          {
            id: "piece-context",
            label: "Máy lọc nước RO cho gia đình 4 người",
          },
          {
            id: "piece-constraint",
            label: "Caption Facebook dưới 80 từ, có CTA đặt hàng",
          },
          {
            id: "piece-format",
            label: "Mở bằng câu hook, 3 lợi ích chính, kết bằng lời kêu gọi",
          },
        ]}
        zones={[
          {
            id: "zone-role",
            label: "Vai trò (bạn là ai)",
            accepts: ["piece-role"],
          },
          {
            id: "zone-context",
            label: "Bối cảnh sản phẩm",
            accepts: ["piece-context"],
          },
          {
            id: "zone-constraint",
            label: "Ràng buộc (độ dài, kênh)",
            accepts: ["piece-constraint"],
          },
          {
            id: "zone-format",
            label: "Cấu trúc bài",
            accepts: ["piece-format"],
          },
        ]}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CRAFT — sơ đồ màu (không phải bullet list)
// ═══════════════════════════════════════════════════════════════════════════
function CraftDiagram() {
  const parts = [
    {
      letter: "C",
      label: "Context",
      subLabel: "Bối cảnh",
      example: "Mình đang viết email cho sếp là người rất bận…",
      color: "#7C3AED",
    },
    {
      letter: "R",
      label: "Role",
      subLabel: "Vai trò",
      example: "Bạn là trợ lý hành chính lâu năm…",
      color: "#2563EB",
    },
    {
      letter: "A",
      label: "Action",
      subLabel: "Nhiệm vụ",
      example: "Hãy viết email xin nghỉ 2 ngày…",
      color: "#059669",
    },
    {
      letter: "F",
      label: "Format",
      subLabel: "Định dạng",
      example: "5 bullet, mỗi bullet 1 câu, dưới 120 từ…",
      color: "#D97706",
    },
    {
      letter: "T",
      label: "Tone",
      subLabel: "Giọng văn",
      example: "Trang trọng, ấm, không khách sáo…",
      color: "#DB2777",
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <p className="text-sm text-muted">
        CRAFT là 5 chữ cái bạn nên nhắc bản thân mỗi khi gõ prompt. Mỗi ô bên
        dưới là một mảnh, màu sắc giúp não bạn bám trụ lâu hơn danh sách bullet.
      </p>

      <div className="grid gap-3 sm:grid-cols-5">
        {parts.map((p) => (
          <motion.div
            key={p.letter}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.3 }}
            className="rounded-xl border border-border bg-surface p-3 text-center flex flex-col items-center gap-1"
          >
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
              style={{ backgroundColor: p.color }}
            >
              {p.letter}
            </div>
            <div className="text-sm font-semibold text-foreground mt-1">
              {p.label}
            </div>
            <div className="text-xs text-muted">{p.subLabel}</div>
            <div className="text-[11px] italic text-tertiary mt-1 leading-snug">
              &ldquo;{p.example}&rdquo;
            </div>
          </motion.div>
        ))}
      </div>

      {/* Băng ngang nối các ô */}
      <div className="hidden sm:flex items-center gap-1 justify-center pt-1">
        {parts.map((p, i) => (
          <span key={i} className="flex items-center gap-1">
            <span
              className="h-1 w-10 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            {i < parts.length - 1 && (
              <span className="text-xs text-tertiary">+</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BEFORE / AFTER — hai thẻ cạnh nhau (không phải code)
// ═══════════════════════════════════════════════════════════════════════════
function BeforeAfterCard() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-xl border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Ruler size={14} className="text-red-600 dark:text-red-400" />
          <span className="text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
            Prompt trước
          </span>
        </div>
        <p className="text-sm text-foreground italic">
          &ldquo;Viết báo cáo tuần cho team marketing&rdquo;
        </p>
        <div className="pt-2 border-t border-red-200 dark:border-red-800">
          <span className="text-[11px] font-semibold text-red-700 dark:text-red-300 uppercase tracking-wide">
            Output mơ hồ
          </span>
          <p className="text-xs text-foreground mt-1 leading-relaxed">
            &ldquo;Tuần này team đã làm nhiều việc. Các hoạt động diễn ra tốt.
            Chúng tôi sẽ tiếp tục cố gắng trong tuần tới.&rdquo;
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-green-600 dark:text-green-400" />
          <span className="text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-300">
            Prompt sau
          </span>
        </div>
        <p className="text-sm text-foreground italic">
          &ldquo;Bạn là leader team marketing. Viết báo cáo tuần gửi sếp, 3
          phần: (1) kết quả chính – có số liệu, (2) vấn đề gặp phải, (3) kế
          hoạch tuần sau. Mỗi phần dưới 40 từ, giọng trực tiếp.&rdquo;
        </p>
        <div className="pt-2 border-t border-green-200 dark:border-green-800">
          <span className="text-[11px] font-semibold text-green-700 dark:text-green-300 uppercase tracking-wide">
            Output đi đúng ý
          </span>
          <p className="text-xs text-foreground mt-1 leading-relaxed">
            &ldquo;Kết quả: ads Facebook đạt CPC 4.2k (tốt hơn tuần trước 18%),
            landing page tăng conversion từ 2.1% lên 3.4%. Vấn đề: nội dung
            blog chậm 2 ngày. Kế hoạch: thuê thêm freelancer, đẩy brief trước
            thứ 2.&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT CHÍNH
// ═══════════════════════════════════════════════════════════════════════════
export default function PromptEngineeringTopic() {
  return (
    <>
      {/* ━━━ BƯỚC 1 — HOOK / DỰ ĐOÁN ━━━ */}
      <LessonSection step={1} totalSteps={8} label="Thử đoán">
        <PredictionGate
          question="Bạn nhờ AI viết một email xin nghỉ cho sếp. Hai prompt dưới đây, prompt nào sẽ cho bạn email đúng ý ngay lần đầu?"
          options={[
            "A. “Viết email”",
            "B. “Viết email xin nghỉ 3 ngày gửi sếp, giọng trang trọng nhưng thân thiện, lý do: vợ sinh con đầu lòng. Độ dài ~100 từ.”",
            "Cả hai như nhau, AI đủ thông minh để tự đoán",
          ]}
          correct={1}
          explanation="Prompt B đã nêu rõ đối tượng (sếp), lý do, giọng văn, và độ dài. AI không đọc được suy nghĩ của bạn — bạn phải nói rõ. Đó chính là toàn bộ bản chất của prompt engineering, và bài học hôm nay sẽ biến điều đó thành thói quen."
        >
          <p className="text-sm text-muted mt-4">
            Viết prompt giống như{" "}
            <strong className="text-foreground">
              dặn dò người giúp việc
            </strong>{" "}
            — bạn càng nói rõ ngay từ đầu, sau đó càng đỡ phải sửa đi sửa lại.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ BƯỚC 2 — ẨN DỤ THỰC TẾ ━━━ */}
      <LessonSection step={2} totalSteps={8} label="Ẩn dụ">
        <p>
          Hãy tưởng tượng bạn vừa tuyển một trợ lý mới. Người này{" "}
          <strong>
            rất thông minh, đọc cực nhanh, nhớ mọi thứ bạn vừa nói
          </strong>{" "}
          — nhưng hoàn toàn không biết bạn đang làm gì, khách hàng của bạn là
          ai, hay sếp của bạn khó tính đến mức nào. Nếu bạn chỉ bảo &ldquo;viết
          cái email đó đi&rdquo;, trợ lý sẽ đoán bừa. Nếu bạn đưa đủ chi tiết —
          gửi ai, để làm gì, dài bao nhiêu, giọng nào — trợ lý làm đúng ngay.
        </p>
        <p>
          AI chính là người trợ lý đó. <strong>Prompt là cách bạn dặn dò.</strong>{" "}
          Chất lượng dặn dò quyết định chất lượng sản phẩm. Dặn mơ hồ → làm mơ
          hồ. Dặn rõ → làm đúng. Trong phần tiếp theo, bạn sẽ tự tay lắp ráp
          một prompt từng mảnh và chứng kiến điểm chất lượng tăng ngay trước
          mắt.
        </p>
        <Callout variant="insight" title="Quy tắc cốt lõi">
          Chất lượng <strong>output</strong> của AI gần như chỉ phụ thuộc vào
          chất lượng <strong>prompt</strong> bạn gửi vào. Prompt mơ hồ = output
          mơ hồ. Không có cách nào khác để AI đọc được suy nghĩ của bạn.
        </Callout>
      </LessonSection>

      {/* ━━━ BƯỚC 3 — TRỰC QUAN HÓA (3 DEMO) ━━━ */}
      <LessonSection step={3} totalSteps={8} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          {/* ───── DEMO 1 — PROMPT BUILDER ───── */}
          <LessonSection step={1} totalSteps={3} label="Demo 1 · Prompt Builder">
            <h3 className="text-base font-semibold text-foreground mb-1">
              Tự tay lắp ráp một prompt
            </h3>
            <p className="text-sm text-muted mb-4">
              Bật/tắt từng mảnh ghép. Quan sát prompt được dựng lại và điểm
              chất lượng tăng theo.
            </p>
            <PromptBuilderDemo />
          </LessonSection>

          {/* ───── DEMO 2 — MATCH PAIRS ───── */}
          <LessonSection step={2} totalSteps={3} label="Demo 2 · Ghép cặp">
            <h3 className="text-base font-semibold text-foreground mb-1">
              Prompt mơ hồ ↔ Prompt cụ thể
            </h3>
            <p className="text-sm text-muted mb-4">
              4 prompt văn phòng đời thường. Nối bản mơ hồ với bản đã được
              &ldquo;chỉnh trang&rdquo;.
            </p>
            <VagueVsSpecificDemo />
          </LessonSection>

          {/* ───── DEMO 3 — DRAG DROP SURGERY ───── */}
          <LessonSection step={3} totalSteps={3} label="Demo 3 · Phẫu thuật">
            <h3 className="text-base font-semibold text-foreground mb-1">
              Phẫu thuật một prompt bệnh
            </h3>
            <p className="text-sm text-muted mb-4">
              Một prompt mơ hồ đang nằm trên bàn mổ. Kéo 4 mảnh ghép vào đúng
              vùng để cứu nó.
            </p>
            <PromptSurgeryDemo />
          </LessonSection>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 4 — AHA MOMENT ━━━ */}
      <LessonSection step={4} totalSteps={8} label="Aha">
        <AhaMoment>
          Prompt không phải là một câu lệnh ma thuật — nó là{" "}
          <strong>một bản dặn dò</strong>. Bạn dặn càng rõ ràng ngay từ đầu, AI
          càng không cần bạn phải ngồi sửa lại mỗi lần. Garbage in → garbage
          out. Clear in → clear out.
        </AhaMoment>
      </LessonSection>

      {/* ━━━ BƯỚC 5 — INLINE CHALLENGE ━━━ */}
      <LessonSection step={5} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Sếp vừa nhờ bạn gửi bản tóm tắt cuộc họp 30 phút sáng nay. Bạn muốn AI viết giúp. Prompt nào là tốt nhất?"
          options={[
            "“Tóm tắt cuộc họp”",
            "“Bạn là thư ký cuộc họp. Tóm tắt đoạn ghi âm dưới thành biên bản: 3 phần (quyết định chính – công việc giao – mốc thời gian). Dưới 200 từ, giọng trực tiếp.”",
            "“Tóm tắt meeting này ngắn gọn”",
            "“Giúp tôi viết tóm tắt cuộc họp, làm sao cho hay”",
          ]}
          correct={1}
          explanation="Option B có đủ: vai trò (thư ký), nhiệm vụ (tóm tắt), định dạng (3 phần rõ), độ dài (dưới 200 từ), và giọng văn. AI sẽ ra bản tóm tắt đúng chuẩn ngay lần đầu — không cần bạn ngồi chỉnh."
        />
      </LessonSection>

      {/* ━━━ BƯỚC 6 — GIẢI THÍCH SÂU (VISUAL HEAVY) ━━━ */}
      <LessonSection step={6} totalSteps={8} label="Đi sâu">
        <ExplanationSection>
          <p>
            <strong>Prompt engineering</strong> là kỹ năng thiết kế lời dặn
            (prompt) sao cho AI hiểu chính xác bạn muốn gì — đúng format, đúng
            giọng văn, đúng độ dài, đúng đối tượng. Không cần biết lập trình,
            không cần học toán. Chỉ cần biết cách nói cho rõ.
          </p>

          {/* Sơ đồ CRAFT */}
          <CraftDiagram />

          <p>
            Khi bạn đã có khung CRAFT trong đầu, bước tiếp theo là tránh những
            cái bẫy phổ biến mà dân văn phòng hay vấp. Năm bẫy dưới đây chiếm
            hơn 80% các lần bạn &ldquo;không hài lòng với AI&rdquo;.
          </p>

          {/* 5 pitfalls dạng Callout */}
          <div className="space-y-3">
            {PITFALLS.map((p, i) => (
              <Callout key={i} variant={p.variant} title={p.title}>
                <div className="space-y-1">
                  <p>
                    <span className="font-semibold text-red-700 dark:text-red-300">
                      Bệnh:
                    </span>{" "}
                    {p.bad}
                  </p>
                  <p>
                    <span className="font-semibold text-green-700 dark:text-green-300">
                      Thuốc:
                    </span>{" "}
                    {p.fix}
                  </p>
                </div>
              </Callout>
            ))}
          </div>

          {/* Before / After card */}
          <h4 className="text-sm font-semibold text-foreground mt-4">
            Nhìn sự khác biệt: trước và sau khi áp dụng CRAFT
          </h4>
          <BeforeAfterCard />

          {/* Thư viện template */}
          <h4 className="text-sm font-semibold text-foreground mt-4">
            Thư viện 4 khung prompt cho dân văn phòng
          </h4>
          <p className="text-sm text-muted">
            Bốn tình huống dân văn phòng gặp mỗi tuần. Mỗi khung đã điền sẵn 3
            ô — bạn chỉ việc đổi nội dung cho hợp hoàn cảnh của mình.
          </p>
          <TabView
            tabs={TEMPLATES.map((t) => ({
              label: t.label,
              content: (
                <div className="space-y-3">
                  <div className="grid gap-2 sm:grid-cols-3">
                    {[
                      { k: t.slot1, v: t.slot1Value, color: "#2563EB" },
                      { k: t.slot2, v: t.slot2Value, color: "#059669" },
                      { k: t.slot3, v: t.slot3Value, color: "#D97706" },
                    ].map((row, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-border bg-surface p-3"
                        style={{ borderLeft: `3px solid ${row.color}` }}
                      >
                        <div
                          className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                          style={{ color: row.color }}
                        >
                          {row.k}
                        </div>
                        <div className="text-xs text-foreground leading-snug">
                          {row.v}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg border border-accent/30 bg-accent-light p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={14} className="text-accent" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-accent">
                        AI trả ra
                      </span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">
                      {t.preview}
                    </p>
                  </div>
                </div>
              ),
            }))}
          />

          <p className="mt-4">
            Prompt engineering còn có thêm một số kỹ thuật nâng cao khi bạn
            muốn AI suy luận nhiều bước. Bạn có thể tìm hiểu thêm về{" "}
            <TopicLink slug="chain-of-thought">chain-of-thought</TopicLink>{" "}
            (yêu cầu AI suy nghĩ từng bước trước khi kết luận) và{" "}
            <TopicLink slug="in-context-learning">in-context learning</TopicLink>{" "}
            (cho AI vài ví dụ mẫu ngay trong prompt). Ngoài ra, tham số{" "}
            <TopicLink slug="temperature">temperature</TopicLink> quyết định AI
            sáng tạo hay bảo thủ — hữu ích khi bạn muốn AI cho ra nhiều bản
            nháp khác nhau.
          </p>

          <Callout variant="insight" title="Lặp lại là chìa khóa">
            Không có prompt hoàn hảo ngay lần đầu — kể cả người viết prompt
            chuyên nghiệp. Bí quyết là: thử nhanh → xem AI trả gì → chỉnh một
            phần cụ thể (&ldquo;đoạn 2 quá khô, hãy viết lại ấm hơn&rdquo;) →
            lặp lại. Hai ba lần là ra bản ưng ý, nhanh hơn tự viết rất nhiều.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 7 — TÓM TẮT ━━━ */}
      <LessonSection step={7} totalSteps={8} label="Tóm tắt">
        <MiniSummary
          title="5 điều cần nhớ khi viết prompt"
          points={[
            "Prompt là bản dặn dò cho trợ lý — càng rõ ràng, AI càng đi đúng ý ngay lần đầu",
            "Khung CRAFT: Context (bối cảnh) + Role (vai trò) + Action (nhiệm vụ) + Format (định dạng) + Tone (giọng)",
            "Luôn nêu rõ đối tượng đọc và độ dài — hai mảnh dân văn phòng hay quên nhất",
            "Khi muốn AI viết đúng giọng của mình, dán 1-2 ví dụ mẫu vào prompt, đừng mô tả bằng lời",
            "Không có prompt hoàn hảo lần đầu — nhưng chỉnh sửa từng phần nhanh hơn viết lại từ đầu rất nhiều",
          ]}
        />
      </LessonSection>

      {/* ━━━ BƯỚC 8 — QUIZ ━━━ */}
      <LessonSection step={8} totalSteps={8} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
