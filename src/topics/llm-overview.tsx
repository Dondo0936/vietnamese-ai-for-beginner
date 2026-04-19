"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Mail,
  FileText,
  MessageCircle,
  Briefcase,
  GraduationCap,
  Scale,
  Newspaper,
  Megaphone,
  Sparkles,
  Thermometer,
  Eye,
  Clock,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  Callout,
  CollapsibleDetail,
  MiniSummary,
  LessonSection,
  TopicLink,
  MatchPairs,
  SortChallenge,
  ToggleCompare,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "llm-overview",
  title: "Large Language Models",
  titleVi: "LLM",
  description:
    "Làm quen với LLM (mô hình ngôn ngữ lớn) — cỗ máy nằm sau ChatGPT, Claude, Gemini. Hiểu nó đoán chữ thế nào, khi nào tin được, khi nào phải dè chừng.",
  category: "llm-concepts",
  tags: ["llm", "ai-co-ban", "van-phong", "overview"],
  difficulty: "beginner",
  relatedSlugs: ["prompt-engineering", "context-window", "temperature", "hallucination"],
  vizType: "interactive",
};

/* ═══════════════════════════════════════════════════════════════════════════
   DỮ LIỆU CHO VISUALIZATION 1 — Trò chơi "đoán chữ tiếp theo"
   ═══════════════════════════════════════════════════════════════════════════ */

type NextWordCandidate = { word: string; prob: number; tone: "safe" | "mid" | "wild" };
type NextWordScene = {
  id: string;
  context: string;
  icon: typeof Mail;
  situation: string;
  /** danh sách ứng viên ở temperature = 0 (chỉ từ an toàn) */
  baseline: NextWordCandidate[];
};

const NEXT_WORD_SCENES: NextWordScene[] = [
  {
    id: "email",
    context: "Kính gửi anh Minh, em viết email này để xin phép nghỉ",
    icon: Mail,
    situation: "Viết email xin nghỉ phép cho sếp",
    baseline: [
      { word: "phép", prob: 62, tone: "safe" },
      { word: "một", prob: 18, tone: "safe" },
      { word: "làm", prob: 9, tone: "mid" },
      { word: "buổi", prob: 6, tone: "mid" },
      { word: "việc", prob: 3, tone: "wild" },
      { word: "ngơi", prob: 2, tone: "wild" },
    ],
  },
  {
    id: "report",
    context: "Trong quý III vừa qua, doanh thu của công ty đã tăng",
    icon: FileText,
    situation: "Tóm tắt báo cáo kinh doanh",
    baseline: [
      { word: "trưởng", prob: 48, tone: "safe" },
      { word: "mạnh", prob: 21, tone: "safe" },
      { word: "lên", prob: 14, tone: "mid" },
      { word: "đáng", prob: 9, tone: "mid" },
      { word: "gấp", prob: 5, tone: "wild" },
      { word: "vọt", prob: 3, tone: "wild" },
    ],
  },
  {
    id: "customer",
    context: "Khách hàng phàn nàn rằng đơn hàng bị giao trễ, tôi xin",
    icon: MessageCircle,
    situation: "Trả lời khách hàng đang bực bội",
    baseline: [
      { word: "lỗi", prob: 54, tone: "safe" },
      { word: "phép", prob: 22, tone: "safe" },
      { word: "gửi", prob: 11, tone: "mid" },
      { word: "ghi", prob: 7, tone: "mid" },
      { word: "thưa", prob: 4, tone: "wild" },
      { word: "chịu", prob: 2, tone: "wild" },
    ],
  },
];

/** Áp dụng temperature lên baseline: temperature thấp → nghiêng về từ an toàn; cao → san phẳng */
function applyTemperature(
  baseline: NextWordCandidate[],
  temperature: number
): NextWordCandidate[] {
  // temperature 0 → chỉ giữ top 2; temperature 1 → nhân đôi các tone wild
  const t = Math.max(0.01, temperature);
  const adjusted = baseline.map((c) => {
    const boost =
      c.tone === "safe"
        ? Math.pow(1 / t, 1.1)
        : c.tone === "mid"
        ? Math.pow(1 / t, 0.3)
        : Math.pow(1 / t, -0.6); // wild tăng khi t tăng
    return { ...c, prob: c.prob * boost };
  });
  const sum = adjusted.reduce((acc, c) => acc + c.prob, 0);
  return adjusted
    .map((c) => ({ ...c, prob: (c.prob / sum) * 100 }))
    .sort((a, b) => b.prob - a.prob);
}

/* ═══════════════════════════════════════════════════════════════════════════
   DỮ LIỆU CHO VISUALIZATION 2 — Cửa sổ ngữ cảnh (context window)
   ═══════════════════════════════════════════════════════════════════════════ */

type ContextBucket = {
  tokens: number;
  label: string;
  example: string;
  color: string;
};

const CONTEXT_BUCKETS: ContextBucket[] = [
  {
    tokens: 4_000,
    label: "1 email dài",
    example: "Viết email phản hồi khách hàng, có trích nội dung email họ gửi.",
    color: "bg-emerald-500",
  },
  {
    tokens: 32_000,
    label: "Báo cáo 20 trang",
    example: "Tóm tắt báo cáo quý, lấy ra 5 điểm chính, soạn slide dẫn dắt.",
    color: "bg-teal-500",
  },
  {
    tokens: 128_000,
    label: "Sách ~300 trang",
    example: "Đọc cả cuốn 'Atomic Habits', rút ra mục lục cho lớp đào tạo nội bộ.",
    color: "bg-sky-500",
  },
  {
    tokens: 200_000,
    label: "Hợp đồng + phụ lục dày cộm",
    example: "So một hợp đồng thầu 200 trang với bản mới, chỉ ra điều khoản thay đổi.",
    color: "bg-indigo-500",
  },
  {
    tokens: 1_000_000,
    label: "Cả một tủ hồ sơ giấy",
    example: "Nuốt trọn toàn bộ email và ghi chú một dự án 2 năm để trả lời câu hỏi bất kỳ.",
    color: "bg-violet-500",
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   DỮ LIỆU CHO EXPLANATION — bảng công việc văn phòng & hallucination
   ═══════════════════════════════════════════════════════════════════════════ */

const OFFICE_TASKS = [
  {
    icon: Mail,
    role: "Nhân viên văn phòng",
    task: "Soạn email trả khách hàng khó tính, giữ giọng lịch sự",
    fit: "rất hợp",
    note: "LLM bắt chước văn phong dễ, bạn chỉ cần nêu rõ đối tượng và mức độ trang trọng.",
  },
  {
    icon: GraduationCap,
    role: "Giáo viên",
    task: "Chấm 40 bài văn, đưa nhận xét cụ thể cho từng em",
    fit: "rất hợp",
    note: "Dán bài, yêu cầu nhận xét theo 3 tiêu chí — LLM không biết mệt.",
  },
  {
    icon: Scale,
    role: "Luật sư / pháp chế",
    task: "Rà lại hợp đồng 80 trang, gạch chân mọi điều khoản có từ 'độc quyền'",
    fit: "rất hợp",
    note: "Dùng kèm RAG để trích dẫn đúng điều khoản, không bịa án lệ.",
  },
  {
    icon: Newspaper,
    role: "Nhà báo / biên tập",
    task: "Tóm tắt 10 bài báo tiếng Anh về giá dầu, viết lead 60 từ",
    fit: "rất hợp",
    note: "Luôn yêu cầu trích nguồn gốc để tránh bịa số liệu.",
  },
  {
    icon: Megaphone,
    role: "Marketer",
    task: "Đặt tên chiến dịch, viết 10 caption TikTok cho nhãn trà sữa",
    fit: "rất hợp",
    note: "Tăng temperature để có ý tưởng bay bổng, giảm khi cần bám brief.",
  },
  {
    icon: Briefcase,
    role: "Trợ lý hành chính",
    task: "Ghi biên bản cuộc họp 90 phút từ bản ghi âm đã chuyển chữ",
    fit: "rất hợp",
    note: "Yêu cầu model bám vào transcript, không tự thêm thông tin.",
  },
  {
    icon: AlertTriangle,
    role: "Kế toán",
    task: "Tính thuế thu nhập cá nhân chính xác đến từng nghìn đồng",
    fit: "phải cẩn thận",
    note: "LLM là máy đoán chữ, không phải máy tính — luôn đối chiếu lại bằng Excel.",
  },
  {
    icon: ShieldAlert,
    role: "Bác sĩ, dược sĩ",
    task: "Tư vấn liều thuốc cho bệnh nhân cụ thể",
    fit: "đừng giao một mình",
    note: "Rủi ro quá cao: LLM có thể bịa liều, tên thuốc hoặc tương tác.",
  },
];

const PIPELINE_STEPS = [
  "Người học viết câu hỏi, ví dụ: 'Giúp tôi viết email xin nghỉ phép 3 ngày.'",
  "Máy cắt câu thành token — các mảnh chữ nhỏ để model xử lý.",
  "Model đọc hết token, tính xác suất cho MỌI từ có thể xuất hiện tiếp theo.",
  "Chọn một từ theo xác suất, in ra màn hình, rồi lặp lại quá trình cho từ sau.",
  "Lặp đi lặp lại cho tới khi tạo đủ câu trả lời hoặc gặp dấu kết thúc.",
];

const MATCH_PAIRS = [
  {
    left: "Prompt (lời nhắc)",
    right: "Câu bạn nhập vào khung chat — càng rõ ràng, trả lời càng chính xác.",
  },
  {
    left: "Token (mảnh chữ)",
    right: "Đơn vị nhỏ mà LLM đọc — một từ tiếng Việt thường là 2–3 token.",
  },
  {
    left: "Context window (cửa sổ ngữ cảnh)",
    right: "Lượng chữ LLM nhớ được trong một cuộc trò chuyện, đo bằng token.",
  },
  {
    left: "Hallucination (ảo giác)",
    right: "LLM tự tin nói sai: bịa tên sách, số liệu, điều luật không có thật.",
  },
  {
    left: "Temperature (nhiệt độ)",
    right: "Nút vặn độ bay bổng — thấp cho câu chắc chắn, cao cho ý tưởng sáng tạo.",
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   QUIZ
   ═══════════════════════════════════════════════════════════════════════════ */

const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Bạn nhập 'Viết email cảm ơn đối tác sau buổi họp hôm qua'. Về bản chất, LLM sẽ làm gì?",
    options: [
      "Tìm trong kho email mẫu trên Internet rồi copy về",
      "Đoán từng chữ tiếp theo dựa trên xác suất, lặp đi lặp lại đến khi đủ một email",
      "Dịch câu hỏi sang ngôn ngữ máy rồi gõ ra bằng công thức",
      "Gọi điện cho người viết email thật để lấy mẫu",
    ],
    correct: 1,
    explanation:
      "LLM là cỗ máy đoán chữ. Nó xem toàn bộ câu bạn vừa gõ, tính khả năng cho mỗi từ có thể đứng tiếp theo, chọn một, rồi tiếp tục đoán từ kế. Cứ thế cho đến khi bạn có một email hoàn chỉnh.",
  },
  {
    question:
      "Câu trả lời của ChatGPT đôi khi khác nhau dù bạn hỏi đúng một câu. Vì sao?",
    options: [
      "Máy chủ OpenAI mỗi ngày cập nhật câu trả lời mới",
      "LLM chọn từ theo xác suất nên có yếu tố ngẫu nhiên — chỉnh bằng temperature",
      "Có người thật gõ trả lời ở phía sau, nên mỗi lần gõ một kiểu",
      "Do tốc độ mạng của bạn chậm hay nhanh quyết định",
    ],
    correct: 1,
    explanation:
      "Temperature là nút vặn độ ngẫu nhiên. Temperature 0 gần như luôn chọn chữ xác suất cao nhất (đáp án ổn định). Temperature cao cho phép model mạo hiểm — hợp lúc sáng tác, rủi ro khi cần chính xác.",
  },
  {
    question:
      "LLM trả lời 'Theo Luật Lao động 2019 Điều 47...' nhưng điều luật đó không tồn tại. Đây là gì?",
    options: [
      "Lỗi đánh máy của LLM",
      "Hallucination — LLM tự tin nói sai vì nó chỉ đoán chữ 'nghe hợp lý'",
      "Luật đã bị thay đổi, LLM dùng bản cũ",
      "Người dùng gõ sai prompt",
    ],
    correct: 1,
    explanation:
      "Hallucination (ảo giác) là cạm bẫy lớn nhất khi dùng LLM ở công việc. Với chuyện quan trọng — luật, y tế, tài chính — luôn kiểm tra bằng nguồn gốc, hoặc dùng công cụ tra cứu kèm theo (RAG).",
  },
  {
    type: "fill-blank",
    question:
      "LLM đọc câu hỏi của bạn theo từng {blank} rồi đoán {blank} tiếp theo dựa trên ngữ cảnh.",
    blanks: [
      { answer: "token", accept: ["từ", "mảnh chữ", "chữ"] },
      { answer: "từ", accept: ["token", "chữ", "mảnh chữ"] },
    ],
    explanation:
      "Token là đơn vị nhỏ nhất mà LLM xử lý. Một từ tiếng Việt có dấu thường tốn 2–3 token. Tiếng Anh một chữ có khi chỉ tốn 1 token, có khi tốn 3.",
  },
  {
    question:
      "Sếp giao bạn dùng LLM rà hợp đồng 120 trang. Điều đầu tiên cần kiểm tra là gì?",
    options: [
      "LLM có biết tiếng Việt không",
      "Cửa sổ ngữ cảnh (context window) của model có đủ chứa 120 trang không",
      "Đã cài antivirus chưa",
      "Máy tính có bao nhiêu RAM",
    ],
    correct: 1,
    explanation:
      "Nếu hợp đồng vượt quá cửa sổ ngữ cảnh, model sẽ 'quên' phần đầu hoặc phần cuối. Hiện nay Claude, Gemini có ngữ cảnh 200K–2M token — đủ cho hợp đồng dài — nhưng vẫn nên chia nhỏ để an toàn.",
  },
  {
    question:
      "Trong các tình huống sau, đâu là lúc bạn NÊN dè chừng khi giao cho LLM làm một mình?",
    options: [
      "Viết caption Facebook quảng bá quán trà sữa mới mở",
      "Soạn email mời sếp dự tiệc tất niên",
      "Tính thuế thu nhập cá nhân cho 30 nhân viên chính xác đến đồng",
      "Tóm tắt 5 bài báo về xu hướng marketing 2026",
    ],
    correct: 2,
    explanation:
      "Tính thuế đòi hỏi độ chính xác tuyệt đối từng con số. LLM là máy đoán chữ, không phải máy tính — nó có thể nhầm phép cộng với số lớn. Luôn đối chiếu bằng Excel hoặc phần mềm kế toán.",
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT CON — Thanh xác suất "đoán chữ tiếp theo"
   ═══════════════════════════════════════════════════════════════════════════ */

function ProbabilityBars({
  candidates,
}: {
  candidates: NextWordCandidate[];
}) {
  const reduce = useReducedMotion();
  const max = Math.max(...candidates.map((c) => c.prob));
  return (
    <div className="space-y-2">
      {candidates.map((c) => {
        const width = Math.max(4, (c.prob / max) * 100);
        const barColor =
          c.tone === "safe"
            ? "bg-emerald-500"
            : c.tone === "mid"
            ? "bg-sky-500"
            : "bg-rose-500";
        return (
          <div key={c.word} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-sm font-medium text-foreground tabular-nums">
              {c.word}
            </span>
            <div className="flex-1 h-6 rounded-md bg-surface overflow-hidden relative">
              <motion.div
                className={`h-full ${barColor} rounded-md`}
                initial={reduce ? false : { width: 0 }}
                animate={{ width: `${width}%` }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />
            </div>
            <span className="w-16 shrink-0 text-right text-xs tabular-nums text-muted">
              {c.prob.toFixed(1)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT CON — Cửa sổ ngữ cảnh trực quan
   ═══════════════════════════════════════════════════════════════════════════ */

function ContextWindowMeter({ value }: { value: number }) {
  const bucket =
    [...CONTEXT_BUCKETS]
      .reverse()
      .find((b) => value >= b.tokens) ?? CONTEXT_BUCKETS[0];

  // Lên thang log cho thanh tiến trình (vì 4K → 1M là 250 lần)
  const minLog = Math.log10(CONTEXT_BUCKETS[0].tokens);
  const maxLog = Math.log10(CONTEXT_BUCKETS[CONTEXT_BUCKETS.length - 1].tokens);
  const pct = ((Math.log10(value) - minLog) / (maxLog - minLog)) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-accent" />
            <span className="text-sm font-semibold text-foreground">
              {value.toLocaleString("vi-VN")} token
            </span>
          </div>
          <p className="text-xs text-muted mt-0.5">
            ≈ {bucket.label.toLowerCase()}
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-wide text-tertiary">
          càng trái = ít chữ · càng phải = nhiều chữ
        </span>
      </div>

      {/* Thanh log */}
      <div className="relative h-3 rounded-full bg-surface overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${bucket.color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        />
      </div>

      {/* Mốc chuẩn */}
      <div className="flex justify-between text-[10px] text-tertiary">
        {CONTEXT_BUCKETS.map((b) => (
          <span key={b.tokens} className="tabular-nums">
            {b.tokens >= 1_000_000
              ? "1M"
              : b.tokens >= 1_000
              ? `${b.tokens / 1_000}K`
              : b.tokens}
          </span>
        ))}
      </div>

      {/* Ví dụ công việc tương ứng */}
      <motion.div
        key={bucket.label}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-lg border border-border bg-surface p-3"
      >
        <div className="flex items-center gap-2 mb-1">
          <span className={`h-2 w-2 rounded-full ${bucket.color}`} />
          <span className="text-xs font-semibold text-foreground">
            Ví dụ việc văn phòng vừa đủ {bucket.label.toLowerCase()}
          </span>
        </div>
        <p className="text-xs text-muted leading-relaxed">{bucket.example}</p>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TRANG CHÍNH
   ═══════════════════════════════════════════════════════════════════════════ */

export default function LLMOverviewTopic() {
  /* ─── Viz 1: chọn ngữ cảnh văn phòng ─── */
  const [sceneIdx, setSceneIdx] = useState(0);
  /* ─── Viz 2: chỉnh temperature ─── */
  const [temperature, setTemperature] = useState(0.4);
  /* ─── Viz 3: cửa sổ ngữ cảnh ─── */
  const [contextTokens, setContextTokens] = useState(32_000);
  /* ─── Viz 4: so sánh trước/sau LLM cho công việc văn phòng ─── */
  const [officeFilter, setOfficeFilter] =
    useState<"all" | "rat-hop" | "can-than" | "khong-nen">("all");

  const scene = NEXT_WORD_SCENES[sceneIdx];
  const candidates = useMemo(
    () => applyTemperature(scene.baseline, temperature),
    [scene, temperature]
  );

  const filteredTasks = OFFICE_TASKS.filter((t) => {
    if (officeFilter === "all") return true;
    if (officeFilter === "rat-hop") return t.fit === "rất hợp";
    if (officeFilter === "can-than") return t.fit === "phải cẩn thận";
    return t.fit === "đừng giao một mình";
  });

  /* ─── Viz 4: chữ gõ thử "bắt chước LLM" — animation chạy liên tục ─── */
  const [typedIdx, setTypedIdx] = useState(0);
  const sampleSentence = "Kính gửi anh Minh, em xin phép nghỉ 2 ngày do con ốm. Em sẽ bàn giao";
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) {
      setTypedIdx(sampleSentence.length);
      return;
    }
    const id = setInterval(() => {
      setTypedIdx((i) => (i >= sampleSentence.length ? 0 : i + 1));
    }, 85);
    return () => clearInterval(id);
  }, [reduce]);

  return (
    <>
      {/* ═══════════ BƯỚC 1 — HOOK / DỰ ĐOÁN ═══════════ */}
      <LessonSection step={1} totalSteps={8} label="Thử đoán">
        <PredictionGate
          question="Bạn gõ vào ChatGPT: 'Soạn giúp tôi email xin nghỉ phép 3 ngày'. Theo bạn, trong đầu máy đang diễn ra chuyện gì?"
          options={[
            "Máy tra cứu trong một kho email mẫu khổng lồ và copy ra",
            "Máy đọc câu của bạn, rồi đoán từng chữ tiếp theo dựa trên kinh nghiệm đã học",
            "Có một nhân viên OpenAI đang gõ trả lời bạn trong thời gian thực",
            "Máy dịch câu hỏi sang tiếng Anh, rồi chạy một công thức toán ra đáp án",
          ]}
          correct={1}
          explanation="Đúng vậy — LLM là một cỗ máy đoán chữ. Nó nhìn toàn bộ câu bạn đã gõ, tính xác suất cho từng từ có thể đứng tiếp theo, chọn một, rồi lặp lại. Cứ thế cho tới khi email thành hình."
        >
          <p className="text-sm text-muted mt-3">
            Bài hôm nay sẽ cho bạn nhìn tận mắt cỗ máy đoán chữ đó làm việc, bằng
            chính những tình huống văn phòng quen thuộc.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ═══════════ BƯỚC 2 — ẨN DỤ QUÁN PHỞ ═══════════ */}
      <LessonSection step={2} totalSteps={8} label="Ẩn dụ">
        <p>
          Hình dung một bác bán phở Bát Đàn đứng ba mươi năm ở góc phố. Khách
          vừa bước vào, chưa kịp ngồi xuống bác đã biết hôm nay khách gọi{" "}
          <strong>tái gầu hay chín nạm</strong>, có dưa muối hay không. Bác
          không đọc được ý nghĩ ai cả — bác chỉ đã nhìn <em>hàng chục vạn</em>{" "}
          lượt khách, nên bộ não bác nắm được một quy luật mỏng manh nhưng đáng
          tin: người mặc sơ mi, đi xe tay ga, vào lúc 7 giờ sáng thường gọi cái
          gì.
        </p>
        <p>
          <strong>LLM chính là bác bán phở đó, phóng to lên hàng triệu lần.</strong>{" "}
          Nó đã đọc gần như toàn bộ Internet, sách, báo, diễn đàn, email công
          khai... Khi bạn bắt đầu gõ một câu, nó nhìn các chữ đã có, dò lại ký ức
          khổng lồ ấy, rồi đoán chữ tiếp theo nào <em>hợp vai</em> nhất. Đó là
          toàn bộ phép thuật, không có gì hơn.
        </p>
        <p>
          Điều hay là: vì đã đọc quá nhiều, nó biết văn phong email công sở khác
          văn tin nhắn bạn bè, biết câu trong biên bản họp không giống câu trong
          caption Tiktok. Điều đáng sợ là: khi không biết, nó vẫn{" "}
          <strong>đoán một cách tự tin</strong> — đôi khi bịa ra điều luật, tên
          sách, trích dẫn không tồn tại. Dùng LLM ở công việc nghĩa là học cách
          phát huy ưu thế và cảnh giác với điểm yếu đó.
        </p>
      </LessonSection>

      {/* ═══════════ BƯỚC 3 — VISUALIZATION TƯƠNG TÁC ═══════════ */}
      <LessonSection step={3} totalSteps={8} label="Nhìn tận mắt">
        <VisualizationSection topicSlug={metadata.slug}>
          {/* ── Demo 1: Trò chơi "đoán chữ tiếp theo" ───────────────────── */}
          <LessonSection step={1} label="Demo 1 — Đoán chữ tiếp theo">
            <h3 className="text-base font-semibold text-foreground mb-1">
              Bạn là LLM: đoán chữ sắp gõ tiếp theo
            </h3>
            <p className="text-sm text-muted mb-4">
              Chọn một tình huống văn phòng. Máy đang đứng trước câu hỏi:
              &ldquo;chữ nào hợp nhất để gõ tiếp?&rdquo; Mỗi thanh là xác suất
              máy dành cho từng ứng viên.
            </p>

            {/* Chọn tình huống */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
              {NEXT_WORD_SCENES.map((s, i) => {
                const Icon = s.icon;
                const active = i === sceneIdx;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSceneIdx(i)}
                    className={`rounded-lg border p-3 text-left transition-all ${
                      active
                        ? "border-accent bg-accent-light"
                        : "border-border bg-surface hover:border-accent/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon size={14} className={active ? "text-accent" : "text-muted"} />
                      <span className="text-xs font-semibold text-foreground">
                        {s.situation}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Câu đang gõ dở */}
            <div className="rounded-lg bg-surface p-4 mb-3">
              <span className="text-[10px] uppercase tracking-wide text-tertiary block mb-1">
                Câu bạn đã gõ tới đây
              </span>
              <p className="text-sm text-foreground leading-relaxed">
                {scene.context}{" "}
                <motion.span
                  className="inline-block align-middle w-20 h-4 border-b-2 border-accent"
                  animate={reduce ? undefined : { opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              </p>
            </div>

            {/* Bảng xác suất */}
            <ProbabilityBars candidates={candidates} />

            <p className="text-xs text-muted mt-4">
              Xanh lá = chữ an toàn (nghĩa là 'đi đúng đường')&nbsp;· Xanh lam =
              ứng viên tạm được&nbsp;· Hồng = chữ bay bổng, có thể sai
            </p>
          </LessonSection>

          {/* ── Demo 2: Nút vặn temperature ───────────────────────────── */}
          <LessonSection step={2} label="Demo 2 — Nút vặn 'độ bay bổng'">
            <div className="flex items-center gap-2 mb-1">
              <Thermometer size={16} className="text-accent" />
              <h3 className="text-base font-semibold text-foreground">
                Temperature: chắc chắn hay sáng tạo?
              </h3>
            </div>
            <p className="text-sm text-muted mb-4">
              Cũng tình huống trên, nhưng giờ bạn cầm một nút vặn. Ở{" "}
              <strong>temperature thấp</strong>, máy luôn chọn chữ an toàn —
              viết chắc chắn, khô khan. Ở <strong>temperature cao</strong>, máy
              dám chọn chữ lạ — viết bay bổng, nhưng dễ trượt chân.
            </p>

            <div className="rounded-lg bg-surface p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">
                  Temperature
                </label>
                <span className="font-mono text-sm font-semibold text-accent">
                  {temperature.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1.2}
                step={0.05}
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-accent"
                style={{
                  background: `linear-gradient(to right, var(--color-accent) ${
                    (temperature / 1.2) * 100
                  }%, var(--bg-surface-hover, #E2E8F0) ${(temperature / 1.2) * 100}%)`,
                }}
              />
              <div className="flex justify-between text-[10px] text-tertiary mt-1">
                <span>0.00 — cứng như đá</span>
                <span>0.60 — vừa tay</span>
                <span>1.20 — bay như thơ</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[0.1, 0.55, 1.1].map((t) => {
                const label =
                  t <= 0.2
                    ? "Ổn định — hợp lúc viết hợp đồng"
                    : t <= 0.7
                    ? "Cân bằng — hợp email hàng ngày"
                    : "Bay bổng — hợp caption marketing";
                const isActive = Math.abs(t - temperature) < 0.15;
                return (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setTemperature(t)}
                    className={`rounded-md border p-2 text-xs text-left transition-all ${
                      isActive
                        ? "border-accent bg-accent-light text-foreground"
                        : "border-border bg-surface text-muted hover:border-accent/50"
                    }`}
                  >
                    <div className="font-semibold">T = {t}</div>
                    <div>{label}</div>
                  </button>
                );
              })}
            </div>

            <Callout variant="tip" title="Gợi ý thực tế">
              Khi soạn <strong>hợp đồng, báo cáo số liệu</strong> — để temperature
              thấp (dưới 0.3). Khi nghĩ <strong>tên chiến dịch, lời quảng cáo</strong> —
              kéo lên 0.8–1.1 cho ý tưởng đỡ giống nhau.
            </Callout>
          </LessonSection>

          {/* ── Demo 3: Cửa sổ ngữ cảnh ──────────────────────────────── */}
          <LessonSection step={3} label="Demo 3 — Cửa sổ ngữ cảnh">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={16} className="text-accent" />
              <h3 className="text-base font-semibold text-foreground">
                LLM nhớ được bao nhiêu chữ một lúc?
              </h3>
            </div>
            <p className="text-sm text-muted mb-4">
              Mỗi model có một <strong>cửa sổ ngữ cảnh</strong> — giống trí nhớ
              ngắn hạn, đo bằng <em>token</em> (mảnh chữ). Kéo thanh dưới để xem
              mức đó tương đương công việc nào.
            </p>

            <div className="rounded-lg bg-surface p-4 mb-4">
              <input
                type="range"
                min={4_000}
                max={1_000_000}
                step={1_000}
                value={contextTokens}
                onChange={(e) => setContextTokens(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-accent mb-4"
                style={{
                  background: `linear-gradient(to right, var(--color-accent) ${
                    ((Math.log10(contextTokens) - Math.log10(4_000)) /
                      (Math.log10(1_000_000) - Math.log10(4_000))) *
                    100
                  }%, var(--bg-surface-hover, #E2E8F0) ${
                    ((Math.log10(contextTokens) - Math.log10(4_000)) /
                      (Math.log10(1_000_000) - Math.log10(4_000))) *
                    100
                  }%)`,
                }}
              />
              <ContextWindowMeter value={contextTokens} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5">
              {CONTEXT_BUCKETS.map((b) => (
                <button
                  type="button"
                  key={b.tokens}
                  onClick={() => setContextTokens(b.tokens)}
                  className={`rounded-md border p-2 text-[11px] text-left transition-all ${
                    Math.abs(contextTokens - b.tokens) / b.tokens < 0.1
                      ? "border-accent bg-accent-light"
                      : "border-border bg-surface hover:border-accent/50"
                  }`}
                >
                  <div className={`h-1.5 rounded-full ${b.color} mb-1`} />
                  <div className="font-semibold text-foreground">
                    {b.tokens >= 1_000_000
                      ? "1M"
                      : b.tokens >= 1_000
                      ? `${b.tokens / 1_000}K`
                      : b.tokens}{" "}
                    token
                  </div>
                  <div className="text-muted">{b.label}</div>
                </button>
              ))}
            </div>

            <Callout variant="info" title="Mẹo đo trong thực tế">
              Một trang Word (~300 từ tiếng Việt) rơi vào khoảng{" "}
              <strong>600–900 token</strong>. Hợp đồng 50 trang ≈ 40K token —
              hầu hết model hiện nay nuốt trọn không vấn đề.
            </Callout>
          </LessonSection>

          {/* ── Demo 4: LLM "gõ từng chữ" cạnh câu hoàn chỉnh ─────────── */}
          <LessonSection step={4} label="Demo 4 — LLM 'gõ' thế nào?">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={16} className="text-accent" />
              <h3 className="text-base font-semibold text-foreground">
                LLM sinh câu trả lời theo từng từ một
              </h3>
            </div>
            <p className="text-sm text-muted mb-4">
              Ở chế độ streaming, LLM vừa nghĩ vừa &ldquo;gõ&rdquo; — mỗi chữ
              bạn thấy là một lần máy đoán xác suất và chọn từ. Xem nhịp gõ mô
              phỏng dưới đây.
            </p>

            <div className="rounded-lg border border-border bg-surface p-4 font-mono text-sm text-foreground min-h-[88px]">
              {sampleSentence.slice(0, typedIdx)}
              <motion.span
                className="inline-block w-1.5 h-4 bg-accent align-middle ml-0.5"
                animate={reduce ? undefined : { opacity: [1, 0.2, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            </div>

            <Callout variant="insight" title="Vì sao điều này quan trọng?">
              Streaming giúp bạn thấy câu trả lời sớm, nhưng cũng là lúc dễ mắc
              bẫy: nửa đầu nghe hợp lý, nửa sau <em>bịa</em>. Đừng dừng đọc ở
              dòng thứ hai — rà hết câu mới quyết định có dùng hay không.
            </Callout>
          </LessonSection>
        </VisualizationSection>
      </LessonSection>

      {/* ═══════════ BƯỚC 4 — AHA MOMENT ═══════════ */}
      <LessonSection step={4} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          LLM không biết điều gì là <strong>đúng</strong>. Nó biết điều gì{" "}
          <strong>nghe hợp lý</strong> dựa trên hàng núi chữ đã đọc. Đó là vì
          sao email AI viết đọc trôi như người thật, nhưng con số và trích dẫn
          thì vẫn phải tự tay bạn kiểm lại. Biết rõ biên giới đó, bạn biến LLM
          thành trợ lý đắc lực; quên đi, bạn biến nó thành cái bẫy.
        </AhaMoment>
      </LessonSection>

      {/* ═══════════ BƯỚC 5 — THỬ THÁCH GIỮA DÒNG ═══════════ */}
      <LessonSection step={5} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Sếp giao: 'Dùng ChatGPT soạn email gửi khách VIP xin gia hạn hợp đồng, đồng thời trích Điều 5.2 hợp đồng cũ'. Cách làm nào hợp lý nhất?"
          options={[
            "Gõ prompt rồi copy nguyên xi câu trả lời, gửi đi luôn cho tiết kiệm thời gian",
            "Dùng LLM soạn phần lời chào và kết, còn Điều 5.2 thì tự copy từ file hợp đồng gốc — đừng để LLM 'nhớ hộ'",
            "Yêu cầu LLM tự nhớ Điều 5.2 vì nó đã đọc triệu hợp đồng rồi",
            "Không dùng LLM, tự viết tay toàn bộ vì LLM không biết tiếng Việt",
          ]}
          correct={1}
          explanation="LLM soạn câu chữ giỏi, nhưng tuyệt đối đừng để nó 'nhớ hộ' điều khoản cụ thể trong hợp đồng của bạn — nó chưa từng đọc hợp đồng đó. Hãy dán trực tiếp đoạn Điều 5.2 vào prompt, hoặc dùng công cụ RAG để LLM đọc từ nguồn thật."
        />
      </LessonSection>

      {/* ═══════════ BƯỚC 6 — GIẢI THÍCH SÂU (VISUAL-HEAVY) ═══════════ */}
      <LessonSection step={6} totalSteps={8} label="Giải thích">
        <ExplanationSection topicSlug={metadata.slug}>
          <p>
            <strong>LLM (Large Language Model — mô hình ngôn ngữ lớn)</strong>{" "}
            là một cỗ máy đoán chữ tiếp theo, được luyện trên gần như toàn bộ
            chữ viết mà con người từng công khai. Ba chữ &ldquo;lớn&rdquo; có
            nghĩa thật sự:
          </p>

          {/* Bảng 3 cột giải thích 'lớn' nghĩa là gì */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 not-prose my-2">
            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="text-xs uppercase tracking-wide text-tertiary mb-1">
                Lớn về dữ liệu
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">
                ~10.000 tỷ
              </div>
              <div className="text-xs text-muted leading-relaxed">
                từ đã đọc — tương đương gần hết sách, báo, Wikipedia, diễn đàn
                mở trên Internet.
              </div>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="text-xs uppercase tracking-wide text-tertiary mb-1">
                Lớn về tham số
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">
                ~1.700 tỷ
              </div>
              <div className="text-xs text-muted leading-relaxed">
                &ldquo;nút vặn&rdquo; bên trong model — mỗi nút tinh chỉnh cảm
                giác về một mẩu ngữ cảnh.
              </div>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="text-xs uppercase tracking-wide text-tertiary mb-1">
                Lớn về chi phí
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">
                ~$100 triệu
              </div>
              <div className="text-xs text-muted leading-relaxed">
                tiền điện và GPU để huấn luyện một thế hệ model đầu bảng —
                bằng một dự án xây cầu vừa.
              </div>
            </div>
          </div>

          <p>
            Khi bạn gõ một câu, năm bước dưới đây diễn ra chớp nhoáng trong vòng
            chưa đầy một giây:
          </p>

          <SortChallenge
            items={PIPELINE_STEPS}
            correctOrder={[0, 1, 2, 3, 4]}
            instruction="Kéo thả năm bước sau cho đúng thứ tự LLM xử lý câu hỏi của bạn:"
          />

          <Callout variant="insight" title="Đơn giản đến bất ngờ">
            Đằng sau ChatGPT, Claude, Gemini — về cốt lõi — chỉ là vòng lặp
            &ldquo;đoán chữ tiếp theo&rdquo;. Sở dĩ nó nghe thông minh là vì
            vòng lặp đó được chạy qua một bộ não khổng lồ đã đọc gần hết kho
            chữ loài người.
          </Callout>

          {/* Năm thuật ngữ quan trọng — MatchPairs */}
          <p>
            Năm thuật ngữ sau sẽ đi cùng bạn suốt hành trình dùng AI. Ghép cặp
            để chắc chắn đã nắm:
          </p>

          <MatchPairs
            instruction="Nối mỗi thuật ngữ ở Cột A với mô tả đúng ở Cột B."
            pairs={MATCH_PAIRS}
          />

          {/* Bảng công việc văn phòng */}
          <p>
            <strong>Vậy LLM hợp với công việc nào?</strong> Bảng dưới xếp các
            việc văn phòng thường gặp. Bấm bộ lọc để xem chi tiết:
          </p>

          <div className="not-prose flex flex-wrap gap-2 mb-3">
            {[
              { key: "all", label: "Tất cả", color: "bg-accent" },
              { key: "rat-hop", label: "Rất hợp", color: "bg-emerald-500" },
              { key: "can-than", label: "Phải cẩn thận", color: "bg-amber-500" },
              { key: "khong-nen", label: "Đừng giao một mình", color: "bg-rose-500" },
            ].map((f) => {
              const active = officeFilter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() =>
                    setOfficeFilter(f.key as typeof officeFilter)
                  }
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    active
                      ? "bg-accent text-white"
                      : "border border-border bg-surface text-muted hover:text-foreground"
                  }`}
                >
                  <span className={`inline-block h-1.5 w-1.5 rounded-full mr-1.5 ${f.color}`} />
                  {f.label}
                </button>
              );
            })}
          </div>

          <div className="not-prose space-y-2">
            <AnimatePresence initial={false}>
              {filteredTasks.map((t, i) => {
                const Icon = t.icon;
                const color =
                  t.fit === "rất hợp"
                    ? "border-emerald-500/40 bg-emerald-50 dark:bg-emerald-900/20"
                    : t.fit === "phải cẩn thận"
                    ? "border-amber-500/40 bg-amber-50 dark:bg-amber-900/20"
                    : "border-rose-500/40 bg-rose-50 dark:bg-rose-900/20";
                const dot =
                  t.fit === "rất hợp"
                    ? "bg-emerald-500"
                    : t.fit === "phải cẩn thận"
                    ? "bg-amber-500"
                    : "bg-rose-500";
                return (
                  <motion.div
                    key={`${t.role}-${t.task}`}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22, delay: i * 0.03 }}
                    className={`rounded-lg border-l-4 p-3 ${color}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center h-8 w-8 shrink-0 rounded-md bg-card border border-border">
                        <Icon size={16} className="text-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                          <span className="text-xs font-semibold text-foreground">
                            {t.role}
                          </span>
                          <span className="text-[10px] uppercase tracking-wide text-tertiary">
                            {t.fit}
                          </span>
                        </div>
                        <p className="text-sm text-foreground mb-1">{t.task}</p>
                        <p className="text-xs text-muted leading-relaxed">
                          {t.note}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* So sánh trước & sau có LLM — một chi tiết cụ thể */}
          <p>
            Để thấy khác biệt cụ thể, xem một buổi sáng thứ Hai của bạn trước
            và sau khi biết dùng LLM:
          </p>

          <ToggleCompare
            labelA="Không có LLM"
            labelB="Có LLM"
            description="Cùng một nhiệm vụ: 'soạn email phản hồi 8 khách hàng về chính sách đổi trả mới'."
            childA={
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Clock size={14} className="text-rose-500 shrink-0" />
                  <span>
                    <strong>2 giờ 15 phút</strong> để viết tay 8 email, mỗi email
                    3 đoạn.
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                  <span>
                    Đầu giờ viết kỹ, cuối giờ mệt, câu chữ cụt dần — dễ thiếu lịch sự.
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Briefcase size={14} className="text-muted shrink-0" />
                  <span>
                    Không còn thời gian cho việc quan trọng khác: phân tích dữ liệu,
                    chuẩn bị họp.
                  </span>
                </div>
              </div>
            }
            childB={
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Clock size={14} className="text-emerald-500 shrink-0" />
                  <span>
                    <strong>20 phút</strong>: soạn 1 prompt mẫu, LLM sinh 8 bản
                    nháp, bạn biên tập cho khớp giọng công ty.
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Sparkles size={14} className="text-emerald-500 shrink-0" />
                  <span>
                    Chất lượng email ổn định từ cái đầu đến cái cuối — LLM không biết mệt.
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <ShieldAlert size={14} className="text-amber-500 shrink-0" />
                  <span>
                    Vẫn phải đọc lại: LLM có thể dùng từ không phù hợp văn hoá
                    công ty hoặc thêm chi tiết bịa.
                  </span>
                </div>
              </div>
            }
          />

          <Callout variant="warning" title="Ba cạm bẫy đừng quên">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Ảo giác (<TopicLink slug="hallucination">hallucination</TopicLink>):</strong>{" "}
                LLM tự tin bịa ra điều luật, trích dẫn, tên sách — đặc biệt khi
                bạn hỏi chi tiết nhỏ.
              </li>
              <li>
                <strong>Cắt dữ liệu (training cutoff):</strong> model không biết
                tin sau thời điểm huấn luyện. Hỏi &ldquo;tin tuần trước&rdquo; rất rủi ro.
              </li>
              <li>
                <strong>Prompt injection:</strong> nếu bạn dán một email người
                lạ vào để AI tóm tắt, email đó có thể chứa chỉ dẫn ẩn lừa AI làm
                việc có hại.
              </li>
            </ul>
          </Callout>

          <CollapsibleDetail title="Dành cho bạn muốn hiểu sâu hơn — làm sao LLM &ldquo;đọc&rdquo; câu của bạn?">
            <p className="text-sm text-muted leading-relaxed mb-2">
              LLM không nhìn chữ như mắt người. Nó cắt câu thành{" "}
              <em>token</em> — những mảnh nhỏ. Một câu tiếng Việt như &ldquo;Kính
              gửi anh Minh&rdquo; có thể bị cắt thành &ldquo;Kính&rdquo;, &ldquo;
              gửi&rdquo;, &ldquo; anh&rdquo;, &ldquo; Minh&rdquo;. Sau đó mỗi
              token được chuyển thành một dãy số nhiều chiều, để máy có thể so
              sánh &ldquo;gửi&rdquo; với &ldquo;nhận&rdquo; (gần nhau) và với
              &ldquo;bàn ghế&rdquo; (xa nhau).
            </p>
            <p className="text-sm text-muted leading-relaxed mb-2">
              Phần lõi của LLM gọi là <em>Transformer</em>. Nó cho phép mỗi token
              &ldquo;nhìn&rdquo; tất cả các token đã có trong câu cùng một lúc,
              rồi tính xem chúng quan trọng với nhau đến đâu. Nhờ đó, khi model
              đọc &ldquo;Anh ấy đặt hoa lên bàn, rót rượu và chờ cô ấy đến để...&rdquo;,
              nó nối các manh mối &ldquo;hoa&rdquo;, &ldquo;rượu&rdquo;, &ldquo;chờ&rdquo;
              lại để đoán từ tiếp theo có thể là &ldquo;cầu hôn&rdquo; thay vì
              &ldquo;ăn sáng&rdquo;.
            </p>
            <p className="text-sm text-muted leading-relaxed">
              Bạn không cần hiểu công thức. Chỉ cần nhớ: prompt bạn gõ càng có
              ngữ cảnh đầy đủ, LLM càng đoán đúng. Prompt cụt lủn → kết quả nghe
              chung chung.
            </p>
          </CollapsibleDetail>

          <p>
            Hiểu được cỗ máy này sẽ thay đổi cách bạn làm việc. Bài tiếp theo
            trong lộ trình sẽ dạy bạn viết <TopicLink slug="prompt-engineering">
              prompt
            </TopicLink>{" "}
            sao cho LLM đoán đúng hơn — khác biệt giữa người dùng AI khá và
            người dùng AI giỏi nằm ở kỹ năng đó.
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ═══════════ BƯỚC 7 — TÓM TẮT ═══════════ */}
      <LessonSection step={7} totalSteps={8} label="Tóm tắt">
        <MiniSummary
          title="Năm điều mang theo ra khỏi bài"
          points={[
            "LLM là cỗ máy đoán chữ tiếp theo, luyện trên gần như toàn bộ chữ viết công khai của loài người.",
            "Temperature là nút vặn 'độ bay bổng' — thấp cho hợp đồng, cao cho ý tưởng sáng tạo.",
            "Cửa sổ ngữ cảnh là trí nhớ ngắn hạn của LLM; model hiện nay đủ nuốt cả hợp đồng 200 trang.",
            "LLM viết câu trôi chảy nhưng có thể bịa số liệu, điều luật, trích dẫn — luôn kiểm chứng ở việc quan trọng.",
            "Giao cho LLM: soạn email, tóm tắt báo cáo, viết caption. Đừng giao một mình: tính thuế, tư vấn thuốc, khẳng định điều luật.",
          ]}
        />
      </LessonSection>

      {/* ═══════════ BƯỚC 8 — QUIZ ═══════════ */}
      <LessonSection step={8} totalSteps={8} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
