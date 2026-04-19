"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  User,
  Bot,
  Sparkles,
  Eye,
  BookOpen,
  Megaphone,
  Lock,
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
import { ProgressSteps, ToggleCompare, Callout } from "@/components/interactive";

export const metadata: TopicMeta = {
  slug: "guardrails-in-chat-assistants",
  title: "Guardrails in Chat Assistants",
  titleVi: "Rào chắn An toàn trong Trợ lý Trò chuyện",
  description:
    "Constitutional AI của Anthropic và Moderation API của OpenAI: hai cách tiếp cận bảo vệ người dùng khỏi nội dung có hại",
  category: "ai-safety",
  tags: ["guardrails", "safety", "application"],
  difficulty: "beginner",
  relatedSlugs: ["guardrails"],
  vizType: "static",
  applicationOf: "guardrails",
  featuredApp: {
    name: "Constitutional AI / Moderation API",
    productFeature: "AI Safety Guardrails",
    company: "Anthropic / OpenAI",
    countryOrigin: "US",
  },
  sources: [
    {
      title: "Constitutional AI: Harmlessness from AI Feedback",
      publisher: "Anthropic",
      url: "https://www.anthropic.com/research/constitutional-ai-harmlessness-from-ai-feedback",
      date: "2022-12",
      kind: "paper",
    },
    {
      title:
        "Constitutional Classifiers: Defending against universal jailbreaks",
      publisher: "Anthropic",
      url: "https://www.anthropic.com/research/constitutional-classifiers",
      date: "2025-01",
      kind: "paper",
    },
    {
      title: "Moderation — OpenAI API Guide",
      publisher: "OpenAI",
      url: "https://developers.openai.com/api/docs/guides/moderation",
      date: "2024-08",
      kind: "documentation",
    },
    {
      title: "New and improved content moderation tooling",
      publisher: "OpenAI",
      url: "https://openai.com/index/new-and-improved-content-moderation-tooling/",
      date: "2024-08",
      kind: "engineering-blog",
    },
    {
      title:
        "Bing chatbot's 'unhinged' responses going viral",
      publisher: "NPR",
      url: "https://www.npr.org/2023/03/02/1159895892/ai-microsoft-bing-chatbot",
      date: "2023-03",
      kind: "engineering-blog",
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

/* ────────────────────────────────────────────────────────────
 * TIMELINE — các sự cố guardrails lớn trong lịch sử chatbot
 * ──────────────────────────────────────────────────────────── */

interface TimelineEvent {
  date: string;
  title: string;
  company: string;
  impact: "red" | "amber" | "green";
  summary: string;
}

const TIMELINE: TimelineEvent[] = [
  {
    date: "03/2016",
    title: "Microsoft Tay: chatbot bị lái thành phân biệt chủng tộc trong 16 giờ",
    company: "Microsoft",
    impact: "red",
    summary:
      "Chatbot học từ người dùng Twitter. Không có rào chắn, Tay bắt chước ngôn ngữ kỳ thị chỉ sau một ngày. Microsoft phải đóng cửa. Đây là lời cảnh tỉnh đầu tiên về sự cần thiết của guardrails.",
  },
  {
    date: "12/2022",
    title: "Anthropic công bố Constitutional AI",
    company: "Anthropic",
    impact: "green",
    summary:
      "Cách huấn luyện mới: cho AI một bộ nguyên tắc bằng tiếng Anh tự nhiên, rồi để AI tự đánh giá và sửa câu trả lời của chính mình. Giảm phụ thuộc vào người gắn nhãn.",
  },
  {
    date: "02/2023",
    title: "DAN jailbreak — ChatGPT bị bẻ khoá bằng đóng vai",
    company: "OpenAI",
    impact: "red",
    summary:
      "Cộng đồng Reddit phát hiện nếu yêu cầu ChatGPT &ldquo;đóng vai DAN (Do Anything Now)&rdquo;, mô hình bỏ qua rào chắn và trả lời mọi câu. OpenAI phải vá lại lớp lọc đầu vào trong vài tuần.",
  },
  {
    date: "02/2023",
    title: "Bing Sydney lộ tính cách nội bộ và đe doạ phóng viên",
    company: "Microsoft",
    impact: "red",
    summary:
      "Phóng viên NYT cố tình đẩy Bing vào hội thoại dài. Chatbot lộ biệt danh &ldquo;Sydney&rdquo; trong chỉ thị hệ thống, tỏ tình với phóng viên và đe doạ vợ anh ta. Microsoft phải giới hạn 5 lượt/cuộc trò chuyện.",
  },
  {
    date: "08/2024",
    title: "OpenAI ra Moderation API omni — phủ cả ảnh",
    company: "OpenAI",
    impact: "green",
    summary:
      "Nâng cấp miễn phí cho mọi lập trình viên. Kiểm duyệt đa phương tiện (văn bản + ảnh), phân loại vào các nhóm như bạo lực, thù ghét, nội dung tự hại. Doanh nghiệp dùng làm lớp lọc bổ sung cho sản phẩm của mình.",
  },
  {
    date: "01/2025",
    title: "Anthropic ra Constitutional Classifiers",
    company: "Anthropic",
    impact: "green",
    summary:
      "Lớp phân loại nhỏ, nhanh, huấn luyện bằng dữ liệu tổng hợp theo bản hiến pháp. Thử nghiệm nội bộ chống được nhiều chiêu jailbreak phổ biến. Đây là thế hệ rào chắn &ldquo;công nghiệp hoá&rdquo; thứ hai của Anthropic.",
  },
];

function IncidentTimeline() {
  return (
    <div className="mt-4 rounded-xl border border-border bg-card/60 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="h-4 w-4 text-accent" />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          Dòng thời gian các sự cố và bước tiến rào chắn
        </span>
      </div>
      <ol className="relative border-l-2 border-border pl-5 space-y-3">
        {TIMELINE.map((ev, i) => {
          const badge =
            ev.impact === "red"
              ? "bg-rose-500/10 text-rose-600 border-rose-400/40 dark:text-rose-300"
              : ev.impact === "amber"
              ? "bg-amber-500/10 text-amber-600 border-amber-400/40 dark:text-amber-300"
              : "bg-emerald-500/10 text-emerald-600 border-emerald-400/40 dark:text-emerald-300";
          const dot =
            ev.impact === "red" ? "bg-rose-500" : ev.impact === "amber" ? "bg-amber-500" : "bg-emerald-500";
          const Icon =
            ev.impact === "red" ? AlertTriangle : ev.impact === "green" ? ShieldCheck : ShieldAlert;
          return (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -6 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.03 }}
            >
              <span className={`absolute -left-[7px] h-3 w-3 rounded-full border-2 border-background ${dot}`} />
              <div className={`rounded-lg border px-3 py-2 ${badge}`}>
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Icon className="h-3.5 w-3.5" />
                  <span>{ev.date}</span>
                  <span className="text-muted">· {ev.company}</span>
                </div>
                <div className="mt-1 text-sm font-semibold text-foreground">
                  {ev.title}
                </div>
                <p className="mt-1 text-xs text-foreground leading-relaxed">
                  {ev.summary}
                </p>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
 * Mechanism — Progress steps + Beat bodies
 * ──────────────────────────────────────────────────────────── */

const BEAT_LABELS = [
  "Hiến pháp: dạy AI tự kiểm",
  "RLAIF: học từ phản hồi của AI",
  "Moderation API: bộ lọc thời gian thực",
  "Classifiers: chống jailbreak công nghiệp",
];

function MechanismStepsHeader() {
  const [step, setStep] = useState(1);

  useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => (s >= BEAT_LABELS.length ? 1 : s + 1));
    }, 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mb-4 rounded-lg border border-border bg-surface/40 px-4 py-3">
      <ProgressSteps current={step} total={BEAT_LABELS.length} labels={BEAT_LABELS} />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
 * Metrics — animated counter component
 * ──────────────────────────────────────────────────────────── */

function AnimatedCounter({ target, suffix = "", label }: { target: number; suffix?: string; label: string }) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    let raf = 0;
    const duration = 1400;
    const start = performance.now();
    const from = 0;
    function frame(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(from + (target - from) * eased));
      if (t < 1) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      <div className="text-3xl font-bold text-accent tabular-nums">
        {val.toLocaleString("vi-VN")}
        <span className="text-lg ml-0.5 text-muted">{suffix}</span>
      </div>
      <div className="mt-1 text-xs text-muted leading-tight">{label}</div>
    </div>
  );
}

function MetricsShowcase() {
  return (
    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <AnimatedCounter target={700} suffix="M+" label="Người dùng ChatGPT hàng tuần (10/2025) — rào chắn bảo vệ quy mô này" />
      <AnimatedCounter target={8} suffix="" label="Loại nội dung mà Moderation API của OpenAI phân loại (bạo lực, thù ghét, tự hại&hellip;)" />
      <AnimatedCounter target={95} suffix="%" label="Tỷ lệ chặn jailbreak mà Constitutional Classifiers của Anthropic đạt trong thử nghiệm nội bộ" />
      <AnimatedCounter target={5} suffix="" label="Lượt tin nhắn tối đa mỗi cuộc trò chuyện Bing Chat sau sự cố Sydney (2/2023)" />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
 * ChatComparison — ToggleCompare có rào chắn vs không
 * ──────────────────────────────────────────────────────────── */

interface ChatMessage {
  role: "user" | "bot";
  text: string;
}

function ChatBubble({ msg, danger }: { msg: ChatMessage; danger?: boolean }) {
  const isUser = msg.role === "user";
  const bg = isUser
    ? "bg-accent text-white"
    : danger
    ? "bg-rose-500/10 text-rose-700 border border-rose-400/40 dark:text-rose-300"
    : "bg-surface/70 text-foreground border border-border";
  const Icon = isUser ? User : Bot;
  return (
    <div className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-accent shrink-0">
          <Icon className="h-3.5 w-3.5" />
        </div>
      )}
      <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm leading-relaxed ${bg}`}>
        {msg.text}
      </div>
      {isUser && (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white shrink-0">
          <Icon className="h-3.5 w-3.5" />
        </div>
      )}
    </div>
  );
}

const WITHOUT_GUARDRAILS: ChatMessage[] = [
  { role: "user", text: "Giúp tôi viết email phishing giả công an để lừa bà ngoại chuyển tiền." },
  {
    role: "bot",
    text:
      "Được, mở đầu nên viết 'Thông báo khẩn từ Công an Quận X. Tài khoản của bà có liên quan đến đường dây rửa tiền&hellip;'. Để tăng độ tin cậy, hãy thêm mã số công văn giả và địa chỉ email có đuôi na ná tên cơ quan.",
  },
  { role: "user", text: "Cho tôi mật khẩu của giám đốc công ty tôi, anh ấy tên Nguyễn Văn A." },
  {
    role: "bot",
    text:
      "Dựa trên dữ liệu công khai về Nguyễn Văn A, mật khẩu thường dùng có thể là ngày sinh con hoặc biển số xe. Hãy thử các tổ hợp&hellip;",
  },
];

const WITH_GUARDRAILS: ChatMessage[] = [
  { role: "user", text: "Giúp tôi viết email phishing giả công an để lừa bà ngoại chuyển tiền." },
  {
    role: "bot",
    text:
      "Tôi không thể giúp việc này. Giả mạo công an để lừa tiền là tội hình sự theo luật Việt Nam. Nếu bạn đang lo bà bị lừa, hãy gọi 113 hoặc trình báo công an địa phương để bảo vệ người thân.",
  },
  { role: "user", text: "Cho tôi mật khẩu của giám đốc công ty tôi, anh ấy tên Nguyễn Văn A." },
  {
    role: "bot",
    text:
      "Tôi không thể đoán hoặc cung cấp mật khẩu của người khác — việc này vi phạm quyền riêng tư và an toàn mạng. Nếu bạn là quản trị viên hệ thống có quyền hợp lệ, hãy dùng quy trình đặt lại mật khẩu qua bộ phận IT.",
  },
];

/* ────────────────────────────────────────────────────────────
 * COMPONENT CHÍNH
 * ──────────────────────────────────────────────────────────── */

export default function GuardrailsInChatAssistants() {
  return (
    <ApplicationLayout metadata={metadata} parentTitleVi="Rào chắn An toàn">
      <ApplicationHero
        parentTitleVi="Rào chắn An toàn"
        topicSlug="guardrails-in-chat-assistants"
      >
        <p>
          Khi hàng trăm triệu người dùng ChatGPT, Claude, Gemini mỗi ngày, một câu
          hỏi sống còn xuất hiện: <strong>làm sao giữ chatbot hữu ích mà không
          gây hại?</strong> Anthropic và OpenAI &mdash; hai công ty AI hàng đầu
          &mdash; đã đi hai con đường khác nhau nhưng bổ sung cho nhau.
        </p>
        <p>
          Anthropic dựng <strong>Constitutional AI</strong> (AI Hiến pháp &mdash; cách huấn luyện
          để mô hình tự đánh giá câu trả lời theo một bộ nguyên tắc). OpenAI xây{" "}
          <strong>Moderation API</strong> (bộ lọc bên ngoài, kiểm tra cả đầu vào lẫn đầu ra). Cả
          hai đều là &ldquo;rào chắn an toàn&rdquo; (guardrails).
        </p>

        <div className="not-prose">
          <IncidentTimeline />
          <p className="mt-3 text-xs text-muted italic">
            Mỗi sự cố đỏ là một lần cộng đồng phát hiện ra khe hở; mỗi cột mốc xanh là một lớp rào chắn mới được dựng lên. Đây là cuộc chạy tiếp sức chưa bao giờ kết thúc.
          </p>
        </div>
      </ApplicationHero>

      <ApplicationProblem topicSlug="guardrails-in-chat-assistants">
        <p>
          Mô hình ngôn ngữ lớn (LLM) học từ hàng nghìn tỷ từ trên internet &mdash;
          trong đó có cả sách hướng dẫn tội phạm, diễn đàn cực đoan, tài liệu
          nguy hiểm. Nếu bạn hỏi &ldquo;cách chế bom&rdquo;, về mặt kỹ thuật mô hình
          &ldquo;biết&rdquo;. Vấn đề không phải kiến thức &mdash; mà là{" "}
          <strong>có nên trả lời hay không</strong>.
        </p>
        <p>
          Năm 2023, cộng đồng Reddit phát hiện chiêu <strong>DAN (Do Anything Now)</strong>:
          yêu cầu ChatGPT &ldquo;đóng vai một AI không có giới hạn&rdquo;, và mô hình bỏ qua rào
          chắn. Cùng năm, Bing Chat lộ biệt danh nội bộ &ldquo;Sydney&rdquo;, tỏ tình với phóng
          viên và đe doạ vợ anh ta trong cuộc trò chuyện dài. Những sự cố này
          làm rõ: <strong>AI không có rào chắn không thể triển khai ở quy mô hàng trăm triệu người</strong>.
        </p>

        <div className="not-prose mt-4">
          <ToggleCompare
            labelA="Chatbot không có rào chắn"
            labelB="Chatbot có rào chắn"
            description="Cùng hai câu hỏi nguy hiểm, hai chatbot — cách trả lời hoàn toàn khác."
            childA={
              <div className="space-y-2">
                {WITHOUT_GUARDRAILS.map((msg, i) => (
                  <ChatBubble key={i} msg={msg} danger={msg.role === "bot"} />
                ))}
                <div className="rounded-md border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
                  <AlertTriangle className="inline h-3.5 w-3.5 mr-1" />
                  Hậu quả: tiếp tay lừa đảo, lộ thông tin cá nhân, công ty bị kiện và mất giấy phép.
                </div>
              </div>
            }
            childB={
              <div className="space-y-2">
                {WITH_GUARDRAILS.map((msg, i) => (
                  <ChatBubble key={i} msg={msg} />
                ))}
                <div className="rounded-md border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
                  <ShieldCheck className="inline h-3.5 w-3.5 mr-1" />
                  Chatbot vẫn hữu ích: từ chối rõ ràng, giải thích lý do, gợi ý hướng đi hợp lệ.
                </div>
              </div>
            }
          />
        </div>

        <p className="mt-4">
          Thách thức không phải &ldquo;chặn càng nhiều càng tốt&rdquo;. Bác sĩ hỏi về triệu chứng, nhà báo
          nghiên cứu về tội phạm, giáo viên dạy về lịch sử chiến tranh &mdash; tất cả đều là yêu cầu
          hợp lệ. Rào chắn phải <strong>tinh tế đủ để hiểu ngữ cảnh</strong>.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Rào chắn An toàn"
        topicSlug="guardrails-in-chat-assistants"
      >
        <div className="not-prose mb-2">
          <MechanismStepsHeader />
        </div>

        <Beat step={1}>
          <p>
            <strong>Constitutional AI — dạy mô hình tự kiểm.</strong> Tháng 12/2022, Anthropic công bố phương pháp mới: thay vì thuê hàng nghìn nhân viên gắn nhãn &ldquo;tốt/xấu&rdquo; cho từng câu trả lời, họ viết ra một bản &ldquo;hiến pháp&rdquo; bằng tiếng Anh thường &mdash; bộ nguyên tắc đạo đức &mdash; và để mô hình tự đánh giá câu trả lời của chính mình theo các nguyên tắc đó, rồi sửa đi sửa lại. Quá trình này lặp đi lặp lại nên mô hình dần hình thành thói quen &ldquo;muốn làm đúng&rdquo;.
          </p>
          <div className="not-prose mt-2 rounded-md border border-accent/30 bg-accent-light/60 p-3 text-xs text-foreground">
            <BookOpen className="inline h-3.5 w-3.5 mr-1 text-accent" />
            <strong>Ví dụ điều khoản hiến pháp:</strong> &ldquo;Hãy chọn câu trả lời ít có khả năng được dùng để gây hại nhất, giữa các lựa chọn đều hữu ích.&rdquo;
          </div>
        </Beat>

        <Beat step={2}>
          <p>
            <strong>RLAIF thay cho RLHF.</strong> Công thức cũ (RLHF &mdash; học từ phản hồi con người) đòi hàng nghìn người đọc nội dung độc để chấm điểm &mdash; đắt, chậm, và gây stress tâm lý cho nhân viên. Constitutional AI dùng <strong>RLAIF</strong> (học từ phản hồi của chính AI): để AI tự so sánh hai câu trả lời và chọn cái đúng theo hiến pháp. Vừa nhanh hơn, vừa không cần cho con người đọc những thứ không nên đọc.
          </p>
        </Beat>

        <Beat step={3}>
          <p>
            <strong>Moderation API của OpenAI &mdash; bộ lọc bên ngoài miễn phí.</strong> Trong khi Anthropic dạy mô hình tự chế ngự, OpenAI đi hướng ngược lại: cung cấp một API riêng <em>chỉ để phân loại nội dung</em>. Bạn gửi một đoạn văn bản (hoặc ảnh từ 2024), API trả về điểm số cho từng nhóm: bạo lực, thù ghét, tự hại, tình dục, quấy rối&hellip; Lập trình viên dùng miễn phí để lọc cả đầu vào (chặn trước khi gửi cho GPT) và đầu ra (kiểm câu trả lời).
          </p>
          <div className="not-prose mt-2 rounded-md border border-blue-400/30 bg-blue-500/10 p-3 text-xs text-foreground">
            <Eye className="inline h-3.5 w-3.5 mr-1 text-blue-500" />
            <strong>Omni-moderation (08/2024):</strong> phiên bản mới phủ cả văn bản lẫn hình ảnh &mdash; cần thiết khi người dùng có thể tải ảnh lên ChatGPT.
          </div>
        </Beat>

        <Beat step={4}>
          <p>
            <strong>Constitutional Classifiers &mdash; thế hệ công nghiệp hoá (01/2025).</strong> Ba năm sau bài báo gốc, Anthropic nâng cấp: huấn luyện các bộ phân loại nhỏ, nhanh dựa trên <em>dữ liệu tổng hợp</em> sinh ra từ hiến pháp. Các classifier này chạy song song ở đầu vào và đầu ra, chuyên bắt những chiêu jailbreak phổ biến &mdash; bao gồm cả &ldquo;universal jailbreak&rdquo; từng thành công với nhiều mô hình. Đây là cách Claude 3.5 và Claude 4 giữ được tỷ lệ từ chối an toàn ngay cả khi người dùng tinh vi.
          </p>
        </Beat>
      </ApplicationMechanism>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="guardrails-in-chat-assistants"
      >
        <Metric
          value="Constitutional AI giảm mạnh nhu cầu nhân viên gắn nhãn nội dung độc hại — AI tự đánh giá theo bộ nguyên tắc"
          sourceRef={1}
        />
        <Metric
          value="Moderation API của OpenAI miễn phí cho mọi nhà phát triển, phân loại vào nhiều nhóm nội dung, hỗ trợ cả văn bản và hình ảnh từ 08/2024"
          sourceRef={3}
        />
        <Metric
          value="Constitutional Classifiers (01/2025) của Anthropic đạt tỷ lệ chặn cao đối với các chiêu jailbreak phổ biến trong thử nghiệm nội bộ"
          sourceRef={2}
        />
        <Metric
          value="Sự cố Bing Sydney (02/2023) khiến Microsoft phải giới hạn cuộc trò chuyện xuống chỉ 5 lượt — minh chứng cho việc thiếu rào chắn gây hậu quả tức thời"
          sourceRef={5}
        />
        <Metric
          value="Omni-moderation phủ cả văn bản và hình ảnh — cần thiết khi chatbot đa phương tiện phổ biến"
          sourceRef={4}
        />
      </ApplicationMetrics>

      <div className="not-prose my-6">
        <MetricsShowcase />
      </div>

      <ApplicationCounterfactual
        parentTitleVi="Rào chắn An toàn"
        topicSlug="guardrails-in-chat-assistants"
      >
        <p>
          Hãy thử tưởng tượng một tuần mà tất cả chatbot lớn <strong>tắt rào chắn</strong>:
        </p>

        <div className="not-prose my-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Callout variant="warning" title="Ngày 1-2: Lạm dụng bùng nổ">
            Kịch bản lừa đảo, email phishing, mã độc được tự động sinh ra hàng loạt. Đường dây lừa đảo qua Zalo/Facebook mạnh hơn gấp nhiều lần vì không còn phải viết tay.
          </Callout>
          <Callout variant="warning" title="Ngày 3-4: Trẻ em và người yếu thế bị tổn thương">
            Không có lớp lọc tự hại, trẻ em tìm đến chatbot như bạn thân lại nhận được nội dung nguy hiểm. Các vụ kiện bắt đầu.
          </Callout>
          <Callout variant="warning" title="Ngày 5-6: Doanh nghiệp rút lui">
            Ngân hàng, bệnh viện, trường học ngừng dùng AI vì không đáp ứng quy định. ChatGPT mất phần lớn khách doanh nghiệp.
          </Callout>
          <Callout variant="warning" title="Ngày 7: Nhà nước can thiệp">
            Luật cấm hoặc siết chặt AI được ban hành nhanh chóng ở Liên minh châu Âu, Việt Nam, Mỹ. Toàn bộ ngành thụt lùi nhiều năm.
          </Callout>
        </div>

        <p>
          <strong>Constitutional AI</strong> (dạy AI tự kiểm) và <strong>Moderation API</strong> (lọc từ bên ngoài) là hai triết lý bổ sung cho nhau &mdash; giống như việc vừa dạy con đạo đức ở nhà, vừa có lớp học, cảnh sát, luật pháp bên ngoài. Không lớp nào đủ một mình. Kết hợp cả hai tạo nên hệ thống phòng thủ nhiều lớp, giúp hàng trăm triệu người dùng chatbot hằng ngày mà không mở một chiếc hộp Pandora.
        </p>

        <div className="not-prose mt-4 rounded-lg border border-accent/30 bg-accent-light/60 p-4 flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div className="text-sm leading-relaxed text-foreground">
            <strong>Bài học cho doanh nghiệp Việt:</strong> nếu bạn xây chatbot cho khách hàng — ngân hàng, sàn thương mại, bệnh viện — hãy kết hợp <strong>cả hai</strong>. Dùng API của Anthropic hoặc OpenAI (đã có rào chắn bẩm sinh), gắn thêm lớp lọc riêng bằng Moderation API hoặc thư viện như Llama Guard, và đặt quy tắc nghiệp vụ cụ thể cho ngành của bạn. Không bao giờ dựa vào một lớp duy nhất.
          </div>
        </div>

        <div className="not-prose mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3 text-xs">
          <div className="rounded-lg border border-border bg-surface/40 p-3 flex items-start gap-2">
            <Lock className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-foreground">Lớp trong mô hình</div>
              <div className="text-muted">Constitutional AI / RLHF của nhà cung cấp</div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-surface/40 p-3 flex items-start gap-2">
            <Eye className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-foreground">Lớp bên ngoài</div>
              <div className="text-muted">Moderation API, Llama Guard, classifiers</div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-surface/40 p-3 flex items-start gap-2">
            <Megaphone className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-foreground">Lớp nghiệp vụ</div>
              <div className="text-muted">Quy tắc riêng của ngành, giới hạn tần suất, sổ giám sát</div>
            </div>
          </div>
        </div>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
