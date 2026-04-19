"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Thermometer,
  Flame,
  Snowflake,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Mail,
  Lightbulb,
  FileText,
  MessageCircle,
  Code2,
  Search,
  Wand2,
  RefreshCw,
} from "lucide-react";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  MatchPairs,
  LessonSection,
  TopicLink,
  CollapsibleDetail,
  StepReveal,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "temperature",
  title: "Temperature",
  titleVi: "Temperature — Nút sáng tạo của AI",
  description:
    "Nút chỉnh độ ngẫu nhiên của AI: khi nào nên vặn thấp để có câu trả lời chắc chắn, khi nào vặn cao để có ý tưởng mới.",
  category: "llm-concepts",
  tags: ["temperature", "sampling", "llm", "generation"],
  difficulty: "advanced",
  relatedSlugs: ["top-k-top-p", "hallucination", "prompt-engineering"],
  vizType: "interactive",
};

/* ────────────────────────────────────────────────────────────
   DỮ LIỆU: ba prompt mô phỏng văn phòng, output thay đổi theo
   nhiệt độ 0.0 → 2.0.
   ──────────────────────────────────────────────────────────── */

type PromptKey = "fact" | "story" | "email";

interface PromptDemo {
  key: PromptKey;
  label: string;
  icon: typeof Search;
  question: string;
  hint: string;
  outputs: {
    range: [number, number];
    tone: string;
    toneColor: string;
    text: string;
    warning?: string;
  }[];
}

const PROMPT_DEMOS: PromptDemo[] = [
  {
    key: "fact",
    label: "Câu hỏi có đáp án",
    icon: Search,
    question: "Thủ đô của Việt Nam là gì?",
    hint: "Đáp án chỉ có một — bạn không cần AI sáng tạo.",
    outputs: [
      {
        range: [0.0, 0.3],
        tone: "Chính xác",
        toneColor: "#0ea5e9",
        text: "Thủ đô của Việt Nam là Hà Nội.",
      },
      {
        range: [0.31, 0.9],
        tone: "Chính xác, diễn đạt đa dạng",
        toneColor: "#10b981",
        text: "Hà Nội là thủ đô của Việt Nam — trung tâm chính trị, văn hóa và lịch sử của cả nước.",
      },
      {
        range: [0.91, 1.4],
        tone: "Vẫn đúng, nhưng bắt đầu lan man",
        toneColor: "#f59e0b",
        text:
          "Hà Nội, thành phố nghìn năm tuổi bên sông Hồng, là thủ đô hiện nay của Việt Nam. Một số giai đoạn lịch sử từng có kinh đô khác, nhưng Hà Nội là thủ đô chính thức đương đại.",
      },
      {
        range: [1.41, 2.0],
        tone: "Có thể bịa chi tiết",
        toneColor: "#ef4444",
        text:
          "Thủ đô của Việt Nam là Hà Nội — nơi có 36 phố phường cổ, được thành lập năm 1010 bởi Lý Thái Tổ, và là thành phố đông dân thứ hai cả nước sau TP Đà Nẵng.",
        warning:
          "Câu trả lời đã chèn thông tin sai: TP đông dân nhất Việt Nam là TP.HCM, không phải Đà Nẵng.",
      },
    ],
  },
  {
    key: "story",
    label: "Ý tưởng sáng tạo",
    icon: Wand2,
    question: "Đặt 1 slogan quảng cáo cho quán cà phê mới mở ở Sài Gòn.",
    hint: "Bạn đang cần ý tưởng — độ đa dạng chính là giá trị.",
    outputs: [
      {
        range: [0.0, 0.3],
        tone: "Nhàm, an toàn",
        toneColor: "#6b7280",
        text: "“Cà phê ngon — giá hợp lý — phục vụ tận tình.”",
        warning:
          "Quá chung chung. AI chỉ dám chọn cụm từ phổ biến nhất nên slogan mất cá tính.",
      },
      {
        range: [0.31, 0.9],
        tone: "Hơi mới",
        toneColor: "#3b82f6",
        text: "“Một ngụm Sài Gòn — buổi sáng nào cũng đáng thức dậy.”",
      },
      {
        range: [0.91, 1.4],
        tone: "Sáng tạo, có hồn",
        toneColor: "#10b981",
        text: "“Sài Gòn gọi tên bạn — bằng mùi cà phê lúc 6 giờ sáng.”",
      },
      {
        range: [1.41, 2.0],
        tone: "Quá đà, có thể khó hiểu",
        toneColor: "#ef4444",
        text: "“Mỗi giọt cà phê — một nốt nhạc lạc trong con hẻm tiền kiếp.”",
        warning:
          "Nghe hay nhưng khách hàng khó hiểu. Đôi khi temperature quá cao sinh ra những câu văn vẻ mà không ai chọn đặt lên biển hiệu.",
      },
    ],
  },
  {
    key: "email",
    label: "Email công việc",
    icon: Mail,
    question: "Viết email gửi sếp xin nghỉ phép thứ Sáu tuần sau.",
    hint: "Cần lịch sự, rõ ràng, có chút ấm áp — không quá máy móc, không quá bay bổng.",
    outputs: [
      {
        range: [0.0, 0.3],
        tone: "Đúng cấu trúc nhưng khô khan",
        toneColor: "#6b7280",
        text:
          "Kính gửi anh/chị, em xin phép nghỉ ngày thứ Sáu tuần sau. Em sẽ bàn giao công việc trước khi nghỉ. Em cảm ơn.",
      },
      {
        range: [0.31, 0.9],
        tone: "Tự nhiên, chuyên nghiệp",
        toneColor: "#10b981",
        text:
          "Chào anh, em viết email này xin phép nghỉ ngày thứ Sáu tuần sau vì có việc gia đình. Em đã sắp xếp lịch và sẽ bàn giao phần báo cáo tuần cho bạn Linh để không ảnh hưởng tiến độ. Em cảm ơn anh.",
      },
      {
        range: [0.91, 1.4],
        tone: "Thân mật hơi quá cho email công việc",
        toneColor: "#f59e0b",
        text:
          "Anh ơi, tuần sau thứ Sáu em có việc nhà hơi cấp, em xin phép nghỉ một hôm nha anh. Em đã giao lại hết task cho Linh rồi, anh yên tâm. Cảm ơn anh lắm ạ!",
        warning:
          "Văn phong mạng xã hội lọt vào email chính thức — không phải lúc nào sếp cũng thoải mái với tông này.",
      },
      {
        range: [1.41, 2.0],
        tone: "Lạc đề",
        toneColor: "#ef4444",
        text:
          "Kính gửi anh — có những ngày thứ Sáu thuộc về sương mù, và ngày thứ Sáu ấy của em là tuần sau. Em xin phép tạm rời văn phòng để trở về với gia đình, rồi quay lại mang theo nhiều năng lượng hơn.",
        warning: "Không còn giống email công việc — đã biến thành tản văn.",
      },
    ],
  },
];

function getOutputForTemp(demo: PromptDemo, temp: number) {
  return (
    demo.outputs.find(
      (o) => temp >= o.range[0] && temp <= o.range[1],
    ) ?? demo.outputs[0]
  );
}

/* ────────────────────────────────────────────────────────────
   DỮ LIỆU: 5 lần chạy cùng prompt ở 3 nhiệt độ khác nhau
   ──────────────────────────────────────────────────────────── */

const PROMPT_REPEAT = "Viết 1 câu mở đầu cho bài đăng LinkedIn về buổi họp sáng nay.";

const REPEAT_RUNS: Record<"T0" | "T07" | "T15", string[]> = {
  T0: [
    "Buổi họp sáng nay rất hiệu quả.",
    "Buổi họp sáng nay rất hiệu quả.",
    "Buổi họp sáng nay rất hiệu quả.",
    "Buổi họp sáng nay rất hiệu quả.",
    "Buổi họp sáng nay rất hiệu quả.",
  ],
  T07: [
    "Buổi họp sáng nay là một trong những cuộc trao đổi rõ ràng nhất tuần này.",
    "Sáng nay cả nhóm ngồi lại 45 phút — và ra khỏi phòng với kế hoạch cụ thể cho quý sau.",
    "Có những buổi họp kéo dài nhưng chẳng đi đến đâu, và có những buổi 45 phút thay đổi hẳn hướng đi — sáng nay thuộc loại thứ hai.",
    "Cảm giác rất vui khi buổi họp kết thúc mà ai cũng biết việc mình cần làm tiếp theo.",
    "Nếu phải chọn một cuộc họp đáng giá trong tuần, mình sẽ chọn sáng nay.",
  ],
  T15: [
    "Sáng nay, giữa hai ly cà phê và một bảng kế hoạch đầy màu, team mình đã vỡ òa vì tìm ra lời giải.",
    "Có những buổi họp bình thường — rồi có buổi họp làm mình muốn viết một bài LinkedIn dài 10 đoạn.",
    "Bảy con người, một chiếc bảng trắng và vài mảnh giấy note vàng đã viết lại chiến lược của cả quý.",
    "Không phải buổi họp nào cũng đáng kể — nhưng buổi sáng nay thì làm mình nhớ lại vì sao mình chọn nghề này.",
    "Một vài buổi họp đi qua như sương sớm, một vài buổi họp làm mình đứng lên thay đổi kế hoạch cả năm.",
  ],
};

/* ────────────────────────────────────────────────────────────
   QUIZ
   ──────────────────────────────────────────────────────────── */

const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Bạn đặt câu hỏi 'Năm nay là năm bao nhiêu?' với temperature = 1.5. Chuyện gì khả năng cao xảy ra?",
    options: [
      "AI từ chối trả lời",
      "AI vẫn trả lời đúng năm, nhưng cách diễn đạt ngẫu nhiên và có thể kèm chi tiết bịa",
      "AI trả lời nhanh hơn",
      "AI chuyển sang tiếng Anh",
    ],
    correct: 1,
    explanation:
      "Temperature cao không làm AI 'quên' kiến thức cơ bản, nó chỉ làm AI sẵn sàng chọn những từ ít phổ biến hơn — dẫn đến câu trả lời dài dòng và đôi khi chèn thêm chi tiết sai.",
  },
  {
    question:
      "Nhóm kế toán công ty bạn muốn AI trích xuất số hoá đơn và số tiền từ hàng ngàn file PDF. Nên đặt temperature bao nhiêu?",
    options: [
      "1.5 — để AI sáng tạo hơn",
      "1.0 — mặc định",
      "0 đến 0.3 — cần kết quả ổn định, lặp lại được",
      "Không quan trọng, temperature không ảnh hưởng tới việc trích xuất",
    ],
    correct: 2,
    explanation:
      "Trích xuất dữ liệu cần ổn định: cùng một file phải cho cùng kết quả. Temperature thấp giúp AI luôn chọn phương án chắc chắn nhất, giảm rủi ro pipeline bị lỗi.",
  },
  {
    question:
      "Khẳng định nào về temperature là ĐÚNG?",
    options: [
      "Temperature cao làm AI thông minh hơn",
      "Temperature thấp làm AI ngu đi",
      "Temperature chỉ thay đổi độ ngẫu nhiên khi chọn từ, không thay đổi chất lượng kiến thức của mô hình",
      "Temperature kiểm soát tốc độ phản hồi của AI",
    ],
    correct: 2,
    explanation:
      "AI biết cùng một lượng kiến thức dù temperature bằng 0 hay bằng 2. Temperature chỉ điều chỉnh việc AI có 'dám' đi chệch khỏi lựa chọn an toàn hay không.",
  },
  {
    question:
      "Bạn chạy prompt viết slogan quảng cáo 3 lần với temperature = 0. Kết quả sẽ thế nào?",
    options: [
      "3 slogan hoàn toàn khác nhau",
      "3 slogan gần như giống hệt nhau",
      "Lần đầu tốt nhất, hai lần sau kém dần",
      "Phụ thuộc vào kiểu máy tính bạn đang dùng",
    ],
    correct: 1,
    explanation:
      "Với temperature = 0, AI luôn chọn lựa chọn chắc chắn nhất. Vì vậy nếu dùng cho việc brainstorm slogan, bạn sẽ chỉ nhận được một phương án lặp đi lặp lại — không hữu dụng khi cần đa dạng.",
  },
  {
    question:
      "Nhận định nào ĐÚNG về quan hệ giữa temperature và 'ảo giác' (hallucination) trong các tác vụ cần sự thật?",
    options: [
      "Temperature càng cao càng giảm ảo giác",
      "Temperature không liên quan đến ảo giác",
      "Temperature cao tăng nguy cơ ảo giác vì AI dễ chọn từ có xác suất thấp — và chi tiết sai thường nằm ở đó",
      "Chỉ có prompt mới ảnh hưởng đến ảo giác",
    ],
    correct: 2,
    explanation:
      "Khi bạn hỏi câu có đáp án thực tế, thông tin đúng thường tập trung ở một vài từ có xác suất cao. Temperature cao mở cửa cho AI chọn từ ít phổ biến hơn — và chính đó là nơi các chi tiết bịa xuất hiện.",
  },
  {
    question:
      "Tác vụ nào sau đây phù hợp nhất với temperature khoảng 1.0 – 1.2?",
    options: [
      "Trích xuất thông tin từ CV ứng viên",
      "Tạo 10 tiêu đề khác nhau cho cùng một bài blog",
      "Tóm tắt biên bản cuộc họp",
      "Dịch hợp đồng pháp lý",
    ],
    correct: 1,
    explanation:
      "Tạo nhiều biến thể cho cùng một nội dung là ví dụ điển hình cần temperature cao. Ba tác vụ còn lại đều cần độ chính xác và nhất quán — nên đặt temperature thấp.",
  },
];

/* ────────────────────────────────────────────────────────────
   COMPONENT CHÍNH
   ──────────────────────────────────────────────────────────── */

export default function TemperatureTopic() {
  const [temp, setTemp] = useState(0.7);
  const [activeDemo, setActiveDemo] = useState<PromptKey>("email");
  const [repeatMode, setRepeatMode] = useState<"T0" | "T07" | "T15">("T07");

  const activePromptDemo = useMemo(
    () => PROMPT_DEMOS.find((d) => d.key === activeDemo) ?? PROMPT_DEMOS[0],
    [activeDemo],
  );
  const currentOutput = useMemo(
    () => getOutputForTemp(activePromptDemo, temp),
    [activePromptDemo, temp],
  );

  const tempLabel =
    temp <= 0.3
      ? "Rất thấp — câu trả lời chắc chắn, ít đổi"
      : temp <= 0.9
        ? "Cân bằng — mặc định cho hầu hết công việc"
        : temp <= 1.4
          ? "Cao — nhiều đa dạng, phù hợp sáng tạo"
          : "Rất cao — có thể đi lạc hoặc bịa chi tiết";

  const bandColor =
    temp <= 0.3
      ? "#0ea5e9"
      : temp <= 0.9
        ? "#10b981"
        : temp <= 1.4
          ? "#f59e0b"
          : "#ef4444";

  return (
    <>
      {/* ━━━ BƯỚC 1 — DỰ ĐOÁN ━━━ */}
      <LessonSection step={1} totalSteps={8} label="Thử đoán">
        <PredictionGate
          question="Bạn hỏi AI: 'Thủ đô của Việt Nam là gì?' rồi vặn nút temperature lên rất cao. Chuyện gì sẽ xảy ra?"
          options={[
            "AI vẫn trả lời 'Hà Nội' nhưng diễn đạt ngẫu nhiên, đôi khi kèm chi tiết bịa",
            "AI đổi câu trả lời sang 'Đà Nẵng' hoặc 'Huế' một cách ngẫu nhiên",
            "AI từ chối trả lời vì thấy câu hỏi nhạy cảm",
            "AI tạo ra địa danh không có thật",
          ]}
          correct={0}
          explanation="Temperature cao không thay đổi kiến thức của AI — nó chỉ làm AI 'liều' hơn khi chọn từ. Với câu hỏi có đáp án rõ ràng, AI vẫn sẽ nói 'Hà Nội', nhưng câu văn xung quanh sẽ dài hơn, ngẫu nhiên hơn, và đôi khi chèn thêm chi tiết sai."
        >
          <p className="text-sm text-muted mt-4 leading-relaxed">
            Hãy tưởng tượng bạn có một cái <strong>nút vặn</strong> trên mỗi công cụ AI. Vặn thấp: câu
            trả lời luôn giống nhau, chắc chắn, nhưng nhàm. Vặn cao: câu trả lời bay bổng, sáng tạo,
            nhưng đôi khi lạc đề. Cả bài này là để bạn biết <em>khi nào nên vặn bên nào</em>.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ BƯỚC 2 — ẨN DỤ ━━━ */}
      <LessonSection step={2} totalSteps={8} label="Hiểu bằng hình ảnh">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Thermometer size={20} className="text-accent" /> Temperature giống cái nút âm lượng
          </h3>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Khi bạn bật một bài hát, bạn có cái nút âm lượng. Vặn nhỏ: nghe rõ từng lời, không ai
            trong phòng bị làm phiền, nhưng cảm xúc hơi thiếu. Vặn to: cảm xúc tràn đầy, nhưng bắt
            đầu có tiếng rè, hàng xóm khó chịu, và đôi khi bạn không còn nghe rõ lời.
          </p>
          <p className="text-sm text-foreground/85 leading-relaxed">
            <strong>Temperature của AI chính là cái nút đó — nhưng cho sự sáng tạo.</strong> Vặn
            thấp: AI nói đúng, nói chắc, lặp lại được. Vặn cao: AI sáng tạo, đa dạng, nhưng có thể
            “rè” — tức là bịa chi tiết hoặc lạc đề.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
            <div className="rounded-xl border border-sky-200 bg-sky-50 dark:bg-sky-900/20 dark:border-sky-800 p-4 space-y-1">
              <div className="flex items-center gap-2 text-sky-700 dark:text-sky-300">
                <Snowflake size={16} />
                <span className="text-sm font-semibold">Vặn thấp (0 – 0.3)</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Như đọc thông báo. Cùng câu hỏi → cùng câu trả lời. An toàn, lặp lại được.
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-4 space-y-1">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <ShieldCheck size={16} />
                <span className="text-sm font-semibold">Vặn vừa (0.4 – 0.9)</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Như nói chuyện tự nhiên. Đủ chắc chắn, đủ linh hoạt. Mặc định cho email, tóm tắt,
                hỏi đáp.
              </p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4 space-y-1">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <Flame size={16} />
                <span className="text-sm font-semibold">Vặn cao (1.0 – 1.4)</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Như brainstorm. Mỗi lần ra một ý khác nhau. Hữu ích khi cần đa dạng.
              </p>
            </div>
          </div>
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 3 — TRỰC QUAN HOÁ ━━━ */}
      <LessonSection step={3} totalSteps={8} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          {/* ── DEMO 1: Nút chỉnh temperature cho 3 prompt ── */}
          <LessonSection label="Thử nghiệm 1: Một cái nút, ba loại câu hỏi" step={1}>
            <p className="text-sm text-muted mb-4 leading-relaxed">
              Chọn một loại công việc, rồi kéo thanh temperature. Cùng một cái nút sẽ cho kết quả
              rất khác nhau tuỳ việc bạn đang làm.
            </p>

            {/* Chọn prompt */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-5">
              {PROMPT_DEMOS.map((demo) => {
                const Icon = demo.icon;
                const active = demo.key === activeDemo;
                return (
                  <button
                    key={demo.key}
                    type="button"
                    onClick={() => setActiveDemo(demo.key)}
                    className={`text-left rounded-xl border p-3 transition-colors ${
                      active
                        ? "border-accent bg-accent-light"
                        : "border-border bg-card hover:border-accent/40"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon
                        size={14}
                        className={active ? "text-accent" : "text-muted"}
                      />
                      <span
                        className={`text-xs font-semibold ${active ? "text-accent-dark" : "text-foreground"}`}
                      >
                        {demo.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted leading-snug">{demo.hint}</p>
                  </button>
                );
              })}
            </div>

            {/* Prompt đang chạy */}
            <div className="rounded-xl border border-border bg-surface/50 p-4 mb-3">
              <p className="text-[11px] font-semibold text-tertiary uppercase tracking-wide mb-1">
                Prompt
              </p>
              <p className="text-sm text-foreground">&ldquo;{activePromptDemo.question}&rdquo;</p>
            </div>

            {/* Output — chuyển mượt theo temperature */}
            <div className="rounded-xl border-2 bg-card p-4 min-h-[130px] relative overflow-hidden"
                 style={{ borderColor: currentOutput.toneColor + "80" }}>
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: currentOutput.toneColor + "22",
                    color: currentOutput.toneColor,
                  }}
                >
                  {currentOutput.tone}
                </span>
                <span className="text-[11px] text-tertiary tabular-nums">T = {temp.toFixed(2)}</span>
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={`${activeDemo}-${currentOutput.text}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="text-sm text-foreground/90 leading-relaxed"
                >
                  {currentOutput.text}
                </motion.p>
              </AnimatePresence>
              {currentOutput.warning && (
                <div className="mt-3 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/60 rounded-lg p-2">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span>{currentOutput.warning}</span>
                </div>
              )}
            </div>

            {/* Slider */}
            <div className="mt-5 max-w-xl mx-auto">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Thermometer size={16} className="text-accent" />
                  <span className="text-sm font-medium text-foreground">Temperature</span>
                </div>
                <span
                  className="text-sm font-bold tabular-nums px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: bandColor + "22", color: bandColor }}
                >
                  {temp.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={2}
                step={0.05}
                value={temp}
                onChange={(e) => setTemp(parseFloat(e.target.value))}
                aria-label="Temperature"
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #0ea5e9 0%, #10b981 40%, #f59e0b 70%, #ef4444 100%)`,
                }}
              />
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-tertiary flex items-center gap-1">
                  <Snowflake size={9} /> 0 — cố định
                </span>
                <span className="text-[10px] text-tertiary">1 — mặc định</span>
                <span className="text-[10px] text-tertiary flex items-center gap-1">
                  <Flame size={9} /> 2 — hỗn loạn
                </span>
              </div>
              <p className="text-xs text-muted mt-2 text-center italic">{tempLabel}</p>
            </div>
          </LessonSection>

          {/* ── DEMO 2: Một prompt chạy 5 lần ở 3 nhiệt độ ── */}
          <LessonSection label="Thử nghiệm 2: Cùng một prompt, chạy 5 lần" step={2}>
            <p className="text-sm text-muted mb-4 leading-relaxed">
              Bấm vào ba tab dưới đây để thấy: cùng một prompt, nhưng temperature khác nhau sẽ tạo
              ra mức độ <strong>trùng lặp</strong> hoàn toàn khác.
            </p>

            <div className="rounded-xl border border-border bg-surface/50 p-4 mb-3">
              <p className="text-[11px] font-semibold text-tertiary uppercase tracking-wide mb-1">
                Prompt
              </p>
              <p className="text-sm text-foreground">&ldquo;{PROMPT_REPEAT}&rdquo;</p>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {(
                [
                  { key: "T0", label: "T = 0", desc: "Luôn giống nhau", color: "#0ea5e9" },
                  { key: "T07", label: "T = 0.7", desc: "Đa dạng vừa phải", color: "#10b981" },
                  { key: "T15", label: "T = 1.5", desc: "Rất ngẫu hứng", color: "#ef4444" },
                ] as const
              ).map((m) => {
                const active = m.key === repeatMode;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setRepeatMode(m.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                      active
                        ? "text-white border-transparent"
                        : "text-muted border-border bg-card hover:bg-surface"
                    }`}
                    style={{
                      backgroundColor: active ? m.color : undefined,
                    }}
                  >
                    {m.label} — {m.desc}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={repeatMode}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-2"
                >
                  {REPEAT_RUNS[repeatMode].map((text, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
                    >
                      <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-[11px] font-bold text-accent">
                        #{i + 1}
                      </span>
                      <p className="text-sm text-foreground/85 leading-relaxed">{text}</p>
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            <Callout variant="insight" title="Quan sát quan trọng">
              Ở T = 0, cả 5 lần chạy ra câu y hệt. Ở T = 0.7, 5 câu khác nhau nhưng vẫn cùng tông.
              Ở T = 1.5, 5 câu bay bổng theo 5 hướng khác nhau — hay khi cần ý tưởng, nhưng hỗn
              loạn khi cần nhất quán.
            </Callout>
          </LessonSection>

          {/* ── DEMO 3: Ghép công việc với nhiệt độ đề xuất ── */}
          <LessonSection label="Thử nghiệm 3: Ghép công việc với mức nhiệt" step={3}>
            <p className="text-sm text-muted mb-4 leading-relaxed">
              Đây là 5 tình huống thường gặp ở văn phòng. Hãy ghép mỗi việc với khoảng temperature
              phù hợp nhất. Bấm &ldquo;Kiểm tra&rdquo; để xem đáp án.
            </p>

            <MatchPairs
              instruction="Ghép công việc (Cột A) với khoảng temperature đề xuất (Cột B)."
              pairs={[
                {
                  left: "Kiểm tra lỗi chính tả hợp đồng",
                  right: "T = 0 – 0.2 — cần nhất quán, kiểm toán được",
                },
                {
                  left: "Brainstorm 10 tên sản phẩm mới",
                  right: "T = 1.0 – 1.3 — cần đa dạng, chấp nhận phương án dở",
                },
                {
                  left: "Viết email gửi khách hàng",
                  right: "T = 0.5 – 0.8 — cần lịch sự tự nhiên, không máy móc",
                },
                {
                  left: "Tóm tắt biên bản họp",
                  right: "T = 0.2 – 0.4 — cần trung thành với sự thật",
                },
                {
                  left: "Viết caption cho bài đăng mạng xã hội",
                  right: "T = 0.8 – 1.1 — cần có hồn, có cá tính",
                },
              ]}
            />
          </LessonSection>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 4 — AHA ━━━ */}
      <LessonSection step={4} totalSteps={8} label="Khoảnh khắc hiểu">
        <AhaMoment>
          Temperature không quyết định AI <strong>thông minh</strong> hay <strong>ngu</strong> —
          nó chỉ quyết định AI có <strong>dám đi chệch</strong> khỏi phương án an toàn hay không.
          <br />
          <br />
          Temperature cao không khiến AI giỏi hơn. Temperature thấp không khiến AI dốt đi. Chúng
          chỉ là <em>hai tính cách</em> của cùng một mô hình: <strong>nghiêm túc và an toàn</strong>
          , hoặc <strong>phóng khoáng và bất ngờ</strong>.
        </AhaMoment>
      </LessonSection>

      {/* ━━━ BƯỚC 5 — THỬ THÁCH ━━━ */}
      <LessonSection step={5} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Bạn là trợ lý giám đốc, cần AI viết 5 phiên bản khác nhau cho cùng một lời mời dự sự kiện khai trương. Nên đặt temperature bao nhiêu?"
          options={[
            "T = 0 — để câu nào cũng giống nhau cho đỡ rối",
            "T = 0.2 — gần như cố định, chỉ đổi vài từ",
            "T = 0.9 – 1.2 — cần đa dạng giữa các phiên bản để giám đốc chọn",
            "T = 2.0 — càng cao càng tốt",
          ]}
          correct={2}
          explanation="Mục tiêu ở đây là 'có 5 bản khác nhau để chọn'. Temperature quanh 1.0 vừa đủ đa dạng mà vẫn giữ được sự lịch sự. T = 2.0 thường cho ra những câu bay bổng quá mức, không phù hợp với thư mời chính thức."
        />
      </LessonSection>

      {/* ━━━ BƯỚC 6 — GIẢI THÍCH ━━━ */}
      <LessonSection step={6} totalSteps={8} label="Giải thích">
        <ExplanationSection>
          <p className="leading-relaxed">
            Khi AI viết một câu, nó không biết trước câu đó sẽ như thế nào. Nó chọn{" "}
            <strong>từ tiếp theo</strong> dựa trên một <strong>danh sách xác suất</strong> — giống
            như khi bạn chọn món trong thực đơn, bạn &ldquo;chấm điểm&rdquo; mỗi món rồi chọn. Temperature
            là cái nút quyết định bạn{" "}
            <strong>luôn chọn món điểm cao nhất</strong> hay{" "}
            <strong>thỉnh thoảng thử món lạ</strong>.
          </p>

          {/* Hình minh hoạ phân phối xác suất — SVG, không có LaTeX */}
          <div className="rounded-xl border border-border bg-surface/40 p-5 my-4">
            <p className="text-xs font-semibold text-tertiary uppercase tracking-wide mb-2">
              AI đang chọn từ tiếp theo cho câu &ldquo;Sáng nay tôi ăn ___&rdquo;
            </p>
            <svg viewBox="0 0 520 240" className="w-full max-w-lg mx-auto">
              {/* Nền lưới */}
              {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
                const y = 200 - frac * 160;
                return (
                  <line
                    key={frac}
                    x1={50}
                    y1={y}
                    x2={500}
                    y2={y}
                    stroke="var(--border)"
                    strokeWidth={0.5}
                    strokeDasharray="2,3"
                    opacity={0.4}
                  />
                );
              })}
              <line x1={50} y1={200} x2={500} y2={200} stroke="var(--border)" strokeWidth={1} />

              {/* Hai phân phối vẽ chồng nhau */}
              {[
                { label: "phở", low: 0.68, high: 0.30, color: "#0ea5e9" },
                { label: "cơm", low: 0.18, high: 0.24, color: "#2563eb" },
                { label: "bún", low: 0.09, high: 0.20, color: "#7c3aed" },
                { label: "bánh mì", low: 0.04, high: 0.15, color: "#d97706" },
                { label: "xôi", low: 0.01, high: 0.11, color: "#dc2626" },
              ].map((item, i) => {
                const barWidth = 36;
                const gap = 50;
                const xBase = 80 + i * (barWidth + gap);
                const hLow = item.low * 160;
                const hHigh = item.high * 160;
                return (
                  <g key={item.label}>
                    {/* Temperature thấp — thanh đặc */}
                    <rect
                      x={xBase}
                      y={200 - hLow}
                      width={barWidth}
                      height={hLow}
                      rx={3}
                      fill={item.color}
                      opacity={0.85}
                    />
                    {/* Temperature cao — viền nét đứt chồng lên */}
                    <rect
                      x={xBase}
                      y={200 - hHigh}
                      width={barWidth}
                      height={hHigh}
                      rx={3}
                      fill="none"
                      stroke={item.color}
                      strokeWidth={1.5}
                      strokeDasharray="4,3"
                    />
                    {/* Nhãn từ */}
                    <text
                      x={xBase + barWidth / 2}
                      y={218}
                      textAnchor="middle"
                      fontSize={11}
                      fill="var(--text-secondary)"
                    >
                      {item.label}
                    </text>
                  </g>
                );
              })}

              {/* Chú thích */}
              <g>
                <rect x={50} y={10} width={14} height={10} fill="#0ea5e9" opacity={0.85} rx={2} />
                <text x={70} y={19} fontSize={10} fill="var(--text-primary)">
                  Temperature thấp — &ldquo;phở&rdquo; gần như luôn thắng
                </text>
                <rect
                  x={50}
                  y={26}
                  width={14}
                  height={10}
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth={1.5}
                  strokeDasharray="4,3"
                  rx={2}
                />
                <text x={70} y={35} fontSize={10} fill="var(--text-primary)">
                  Temperature cao — các món khác cũng có cơ hội
                </text>
              </g>
            </svg>
            <p className="text-xs text-muted text-center mt-2 italic leading-relaxed">
              Temperature thấp &rArr; cột &ldquo;phở&rdquo; cao vượt trội, AI luôn chọn nó. Temperature cao
              &rArr; các cột gần bằng nhau, AI có thể chọn bất cứ món nào.
            </p>
          </div>

          <p className="leading-relaxed mt-4">
            Dưới đây là <strong>5 loại công việc phổ biến nhất</strong> ở văn phòng, kèm mức
            temperature gợi ý. Đây không phải quy tắc cứng — chỉ là điểm xuất phát tốt.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
            {[
              {
                icon: Search,
                title: "Hỏi đáp có đáp án",
                temp: "0 – 0.3",
                desc: "Tra cứu thông tin, dịch chính xác, trả lời câu hỏi có sự thật.",
                color: "#0ea5e9",
              },
              {
                icon: FileText,
                title: "Trích xuất & tóm tắt",
                temp: "0.2 – 0.5",
                desc: "Lấy số liệu từ tài liệu, tóm tắt báo cáo, phân loại email.",
                color: "#10b981",
              },
              {
                icon: MessageCircle,
                title: "Email & hội thoại",
                temp: "0.5 – 0.8",
                desc: "Viết email, trả lời khách hàng — đủ tự nhiên, không máy móc.",
                color: "#22c55e",
              },
              {
                icon: Sparkles,
                title: "Viết nội dung dài",
                temp: "0.7 – 1.0",
                desc: "Bài blog, bài đăng mạng xã hội, nội dung marketing có cá tính.",
                color: "#f59e0b",
              },
              {
                icon: Lightbulb,
                title: "Brainstorm & sáng tạo",
                temp: "1.0 – 1.3",
                desc: "Đặt tên sản phẩm, slogan, ý tưởng chiến dịch — cần đa dạng tối đa.",
                color: "#ef4444",
              },
              {
                icon: Code2,
                title: "Viết / sửa code",
                temp: "0 – 0.2",
                desc: "Code cần chính xác cú pháp. Temperature cao thường sinh ra bug lạ.",
                color: "#6366f1",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-xl border bg-card p-4 space-y-1.5"
                  style={{ borderLeft: `4px solid ${item.color}` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon size={16} style={{ color: item.color }} />
                      <span className="text-sm font-semibold text-foreground">{item.title}</span>
                    </div>
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full tabular-nums"
                      style={{ backgroundColor: item.color + "22", color: item.color }}
                    >
                      T {item.temp}
                    </span>
                  </div>
                  <p className="text-xs text-muted leading-snug">{item.desc}</p>
                </div>
              );
            })}
          </div>

          <Callout variant="warning" title="Bẫy phổ biến: bịa chuyện khi vặn cao">
            Khi bạn hỏi AI một <strong>sự thật</strong> (năm sinh, số liệu, tên người, quy định
            pháp luật) với temperature cao, khả năng AI <strong>bịa chi tiết</strong> tăng lên đáng
            kể. Lý do đơn giản: thông tin đúng thường tập trung ở một vài từ có xác suất cao, còn
            temperature cao làm AI &ldquo;liều&rdquo; chọn những từ ít phổ biến hơn — và chính đó là nơi cái
            sai xuất hiện. Với mọi việc liên quan đến sự thật, hãy vặn temperature xuống dưới 0.3.
          </Callout>

          <h4 className="text-sm font-semibold text-foreground mt-6 mb-2">
            Ghép nhanh: khoảng temperature ↔ mục đích
          </h4>
          <MatchPairs
            instruction="Ghép mỗi khoảng temperature với mục đích sử dụng hợp lý nhất."
            pairs={[
              { left: "T = 0", right: "Cần kết quả y hệt nhau mỗi lần chạy (trích xuất, kiểm toán)" },
              { left: "T = 0.3", right: "Tóm tắt tài liệu, trả lời câu hỏi có đáp án" },
              { left: "T = 0.7", right: "Mặc định cho hội thoại, email, Q&A" },
              { left: "T = 1.2", right: "Brainstorm ý tưởng, viết nội dung sáng tạo" },
            ]}
          />

          <h4 className="text-sm font-semibold text-foreground mt-6 mb-2">
            Quy trình 4 bước chọn temperature cho một công việc mới
          </h4>
          <StepReveal
            labels={[
              "Bước 1: Xác định loại việc",
              "Bước 2: Hỏi về độ lặp lại",
              "Bước 3: Thử mức mặc định",
              "Bước 4: Điều chỉnh nhẹ",
            ]}
          >
            {[
              <div key="s1" className="rounded-lg bg-surface/60 border border-border p-4">
                <p className="text-sm text-foreground leading-relaxed">
                  <strong>Loại việc quan trọng hơn bạn nghĩ.</strong> Đây là việc cần{" "}
                  <em>sự thật</em> (tra cứu, trích xuất, dịch chính xác), hay cần{" "}
                  <em>đa dạng</em> (brainstorm, viết quảng cáo, đặt tên)? Hai nhóm này cần
                  temperature khác nhau rõ rệt.
                </p>
              </div>,
              <div key="s2" className="rounded-lg bg-surface/60 border border-border p-4">
                <p className="text-sm text-foreground leading-relaxed">
                  <strong>Bạn có cần cùng câu hỏi &rArr; cùng câu trả lời không?</strong> Nếu có
                  (ví dụ: chấm điểm bài thi, tự động hóa quy trình) &rArr; T = 0. Nếu không bắt
                  buộc &rArr; tuỳ mức độ đa dạng mong muốn.
                </p>
              </div>,
              <div key="s3" className="rounded-lg bg-surface/60 border border-border p-4">
                <p className="text-sm text-foreground leading-relaxed">
                  <strong>Bắt đầu ở T = 0.7</strong> (mặc định của hầu hết công cụ). Chạy 3 lần
                  cùng prompt để cảm nhận độ đa dạng. Nếu kết quả đã ổn &rArr; dừng ở đây.
                </p>
              </div>,
              <div key="s4" className="rounded-lg bg-surface/60 border border-border p-4">
                <p className="text-sm text-foreground leading-relaxed">
                  <strong>Nếu kết quả quá nhàm</strong> &rArr; tăng 0.2 (thành 0.9, 1.1).{" "}
                  <strong>Nếu kết quả bịa hoặc lạc đề</strong> &rArr; giảm 0.3 (thành 0.4, 0.1).
                  Hiếm khi bạn cần ra ngoài khoảng 0 – 1.3 cho công việc văn phòng thật.
                </p>
              </div>,
            ]}
          </StepReveal>

          <Callout variant="tip" title="Mẹo khi công cụ AI không cho chỉnh temperature">
            Không phải công cụ nào cũng cho bạn chỉnh temperature (ChatGPT web, Claude.ai, Gemini
            web không có nút này). Khi đó, bạn vẫn &ldquo;điều khiển&rdquo; tính cách của AI{" "}
            <strong>thông qua prompt</strong>. Ví dụ: viết &ldquo;trả lời ngắn gọn, chính xác, không bịa&rdquo;
            có tác dụng tương tự như hạ temperature. Viết &ldquo;hãy sáng tạo, cho tôi 5 phương án rất
            khác nhau&rdquo; có tác dụng tương tự như nâng temperature.
          </Callout>

          <p className="mt-4 leading-relaxed">
            Temperature thường đi cùng với hai tham số anh em: <TopicLink slug="top-k-top-p">top-k và top-p</TopicLink>.
            Bạn chưa cần học chúng để dùng AI hiệu quả — temperature là đủ cho 90% tình huống văn
            phòng. Nhưng nếu bạn bắt đầu gọi AI qua API, đọc thêm về hai tham số đó để kiểm soát
            tốt hơn những trường hợp hiếm gặp.
          </p>

          <CollapsibleDetail title="Vì sao gọi là 'nhiệt độ'?">
            <p className="text-sm leading-relaxed">
              Cái tên &ldquo;temperature&rdquo; mượn từ vật lý. Trong vật lý, khi đun nóng một chất,
              các phân tử chuyển động hỗn loạn hơn &mdash; giống như khi ta vặn nút sáng tạo của
              AI lên cao, các lựa chọn từ cũng &ldquo;nhảy nhót&rdquo; hỗn loạn hơn. Khi làm lạnh
              về gần không độ, các phân tử gần như đứng yên &mdash; giống AI ở temperature = 0
              luôn chọn cùng một từ. Ẩn dụ nghe sang trọng, nhưng ý nghĩa thực tế rất đơn giản: đây
              là <strong>nút điều chỉnh mức độ ngẫu nhiên</strong>.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Tại sao T = 0 vẫn đôi khi cho kết quả khác nhau?">
            <p className="text-sm leading-relaxed">
              Lý thuyết: T = 0 &rArr; cùng prompt &rArr; cùng câu trả lời. Thực tế: có hai lý do
              kết quả vẫn đôi khi khác. <strong>Một:</strong> nhiều từ cùng điểm cao nhất, AI phải
              &ldquo;bốc thăm&rdquo; giữa chúng. <strong>Hai:</strong> phép tính trên máy tính có
              sai số nhỏ khi chạy trên các phần cứng khác nhau hoặc khi hệ thống xử lý theo lô. Với
              người dùng văn phòng bình thường, T = 0 đủ đảm bảo tính ổn định thực tế trong 99%
              trường hợp.
            </p>
          </CollapsibleDetail>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 7 — TÓM TẮT ━━━ */}
      <LessonSection step={7} totalSteps={8} label="Tóm tắt">
        <MiniSummary
          title="4 điều cần nhớ về temperature"
          points={[
            "Temperature là nút chỉnh mức độ ngẫu nhiên của AI, không phải nút chỉnh độ thông minh.",
            "Cần sự thật, sự ổn định, sự lặp lại &rArr; vặn thấp (0 – 0.3). Cần đa dạng, sáng tạo &rArr; vặn cao (0.9 – 1.3).",
            "Với 90% việc văn phòng (email, tóm tắt, hỏi đáp), T = 0.5 – 0.8 là vừa đủ.",
            "Temperature cao trên câu hỏi có sự thật &rArr; tăng nguy cơ AI bịa chi tiết. Luôn hạ xuống dưới 0.3 khi cần tra cứu.",
            "Khi công cụ không cho chỉnh temperature, hãy điều khiển bằng prompt: 'ngắn gọn, chính xác' thay cho thấp; 'sáng tạo, nhiều phương án' thay cho cao.",
          ]}
        />
      </LessonSection>

      {/* ━━━ BƯỚC 8 — QUIZ ━━━ */}
      <LessonSection step={8} totalSteps={8} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
        <div className="mt-6 flex items-center justify-center">
          <div className="flex items-center gap-2 text-xs text-muted">
            <RefreshCw size={12} />
            Bạn có thể làm lại quiz bất cứ lúc nào.
          </div>
        </div>
      </LessonSection>
    </>
  );
}
