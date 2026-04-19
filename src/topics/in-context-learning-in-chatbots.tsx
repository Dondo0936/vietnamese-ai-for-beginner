"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Building2,
  BookOpen,
  MessageCircle,
  ShieldCheck,
  UserCog,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Calendar,
  Sparkles,
  ClipboardCheck,
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
import { ToggleCompare, Callout } from "@/components/interactive";

export const metadata: TopicMeta = {
  slug: "in-context-learning-in-chatbots",
  title: "In-Context Learning in Chatbots",
  titleVi: "Học trong Ngữ cảnh ở Chatbot",
  description:
    "Intercom Fin: chatbot hỗ trợ khách hàng dùng học trong ngữ cảnh để trả lời chính xác theo tài liệu riêng của từng công ty.",
  category: "llm-concepts",
  tags: ["in-context-learning", "chatbot", "application"],
  difficulty: "beginner",
  relatedSlugs: ["in-context-learning"],
  vizType: "interactive",
  applicationOf: "in-context-learning",
  featuredApp: {
    name: "Intercom Fin",
    productFeature: "AI Customer Support Chatbot",
    company: "Intercom",
    countryOrigin: "US",
  },
  sources: [
    {
      title:
        "Introducing Fin: Intercom's breakthrough AI chatbot, built on GPT-4",
      publisher: "Intercom Blog",
      url: "https://www.intercom.com/blog/announcing-intercoms-new-ai-chatbot/",
      date: "2023-03",
      kind: "engineering-blog",
    },
    {
      title:
        "Intercom Brings ChatGPT to Customer Service with Fin, the First AI Customer Service Bot Built with GPT-4 Technology",
      publisher: "PR Newswire",
      url: "https://www.prnewswire.com/news-releases/intercom-brings-chatgpt-to-customer-service-with-fin-the-first-ai-customer-service-bot-built-with-gpt-4-technology-301771944.html",
      date: "2023-03",
      kind: "news",
    },
    {
      title:
        "Everything you need to know about Fin, the breakthrough AI bot transforming customer service",
      publisher: "Intercom Blog",
      url: "https://www.intercom.com/blog/fin-ai-bot-customer-service/",
      date: "2023-06",
      kind: "engineering-blog",
    },
    {
      title:
        "Intercom's three lessons for creating a sustainable AI advantage",
      publisher: "OpenAI",
      url: "https://openai.com/index/intercom/",
      date: "2024-03",
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

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED COUNTER — dùng cho Con số thật
// ─────────────────────────────────────────────────────────────────────────────
function AnimatedCounter({
  to,
  suffix = "",
  duration = 1400,
}: {
  to: number;
  suffix?: string;
  duration?: number;
}) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setValue(Math.round(to * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return (
    <span className="tabular-nums font-bold text-3xl md:text-4xl text-accent">
      {value.toLocaleString("vi-VN")}
      {suffix}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TIMELINE ITEMS cho Hero
// ─────────────────────────────────────────────────────────────────────────────
const TIMELINE = [
  {
    date: "11/2022",
    label: "ChatGPT ra mắt",
    desc: "Thế giới thấy chatbot AI đa năng lần đầu tiên.",
  },
  {
    date: "03/2023",
    label: "Intercom ra mắt Fin",
    desc: "Chatbot thương mại đầu tiên chạy trên GPT-4.",
    highlight: true,
  },
  {
    date: "06/2023",
    label: "Mở rộng khách hàng",
    desc: "Doanh nghiệp khắp Mỹ/Anh/Úc bật Fin chỉ sau vài phút cấu hình.",
  },
  {
    date: "2024+",
    label: "Chuẩn mới cho CS",
    desc: "Các đối thủ cũng chuyển sang mô hình “chatbot đọc tài liệu công ty”.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT CHÍNH
// ─────────────────────────────────────────────────────────────────────────────
export default function InContextLearningInChatbots() {
  return (
    <ApplicationLayout metadata={metadata} parentTitleVi="Học trong Ngữ cảnh">
      {/* ═══════════════════════════════════════════════════════════════════
          HERO — timeline visual
          ═══════════════════════════════════════════════════════════════════ */}
      <ApplicationHero
        parentTitleVi="Học trong Ngữ cảnh"
        topicSlug="in-context-learning-in-chatbots"
      >
        <p>
          Tháng 3 năm 2023, Intercom &mdash; nền tảng chăm sóc khách hàng phục vụ hơn 25.000
          doanh nghiệp &mdash; ra mắt <strong>Fin</strong>, chatbot AI thương mại đầu tiên
          chạy trên GPT-4. Fin không trả lời bằng kiến thức chung chung. Fin đọc chính kho
          tài liệu hướng dẫn (knowledge base &mdash; tập hợp các bài hướng dẫn, FAQ của từng
          công ty) rồi trả lời khách theo đúng chính sách của riêng công ty đó.
        </p>
        <p>
          Điểm đặc biệt: Fin không cần đào tạo lại mô hình cho mỗi khách hàng. Nó dùng{" "}
          <strong>học trong ngữ cảnh</strong> &mdash; tức là đưa các đoạn tài liệu liên quan
          vào prompt ngay lúc khách hỏi &mdash; để AI &ldquo;học tạm&rdquo; về sản phẩm cụ thể
          trong đúng một lần trả lời đó.
        </p>

        {/* Timeline visual */}
        <div className="not-prose mt-6">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-accent" />
            Mốc thời gian quan trọng
          </h3>
          <div className="relative">
            {/* Đường trục dọc */}
            <div className="absolute left-[22px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-accent/10 via-accent/60 to-accent/10" />
            <ol className="space-y-4">
              {TIMELINE.map((t, i) => (
                <motion.li
                  key={t.date}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.3, delay: i * 0.08 }}
                  className="relative pl-12"
                >
                  <span
                    className={`absolute left-0 top-1 flex h-11 w-11 items-center justify-center rounded-full border-2 text-[10px] font-bold ${
                      t.highlight
                        ? "border-accent bg-accent text-white shadow-lg shadow-accent/30"
                        : "border-accent/30 bg-card text-accent"
                    }`}
                  >
                    {t.date}
                  </span>
                  <div
                    className={`rounded-xl border p-3 ${
                      t.highlight
                        ? "border-accent/50 bg-accent-light"
                        : "border-border bg-card"
                    }`}
                  >
                    <p className="text-sm font-semibold text-foreground">{t.label}</p>
                    <p className="text-xs text-muted mt-0.5">{t.desc}</p>
                  </div>
                </motion.li>
              ))}
            </ol>
          </div>
        </div>
      </ApplicationHero>

      {/* ═══════════════════════════════════════════════════════════════════
          PROBLEM — ToggleCompare: chatbot generic vs chatbot biết tone công ty
          ═══════════════════════════════════════════════════════════════════ */}
      <ApplicationProblem topicSlug="in-context-learning-in-chatbots">
        <p>
          Mỗi công ty có sản phẩm, chính sách, quy trình riêng. Câu hỏi của khách hầu hết xoay
          quanh những thứ <em>chỉ có trong tài liệu công ty đó</em>: &ldquo;Tôi huỷ đơn được
          không?&rdquo;, &ldquo;Bảo hành mấy tháng?&rdquo;, &ldquo;Giao đến tỉnh X mất bao
          lâu?&rdquo;.
        </p>
        <p>
          Chatbot truyền thống hoạt động theo luật cứng (rule-based): ai đó phải lập trình
          sẵn từng câu hỏi &mdash; từng câu trả lời. Khách hỏi lệch kịch bản → bot &ldquo;tắc
          tị&rdquo; hoặc trả lời sai rồi đẩy sang nhân viên.
        </p>
        <p>
          Bài toán của Intercom: làm sao để một AI <strong>duy nhất</strong> phục vụ 25.000
          doanh nghiệp khác nhau, mỗi nơi một bộ chính sách riêng &mdash; mà không phải thuê
          25.000 đội kỹ sư đi huấn luyện 25.000 mô hình?
        </p>

        {/* ToggleCompare trực quan */}
        <div className="not-prose mt-6">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-accent" />
            Khách hỏi: &ldquo;Tôi đặt hàng 5 ngày rồi, vẫn chưa thấy &mdash; hỗ trợ giúp?&rdquo;
          </h3>
          <ToggleCompare
            labelA="Chatbot chung chung"
            labelB="Chatbot có ngữ cảnh công ty"
            description="Cùng câu hỏi, hai kiểu bot khác nhau trả lời."
            childA={
              <div className="rounded-xl border border-amber-300/60 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700/60 p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                  <XCircle className="h-4 w-4" />
                  <span className="text-xs font-semibold">Bot không biết gì về công ty bạn</span>
                </div>
                <div className="space-y-2 text-sm text-foreground">
                  <div className="rounded-lg bg-white/70 dark:bg-slate-900/40 p-3 italic">
                    &ldquo;Chào bạn! Đơn hàng thường được giao trong 3-7 ngày tuỳ khu vực. Bạn có
                    thể kiểm tra đơn hàng trên trang web người bán. Nếu cần hỗ trợ thêm, vui lòng
                    liên hệ tổng đài.&rdquo;
                  </div>
                </div>
                <ul className="text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                  <li>• Nói chung chung, không đúng chính sách công ty.</li>
                  <li>• Không biết mã đơn, không biết khách ở đâu.</li>
                  <li>• Khách bực, phải gọi tổng đài &mdash; mất thêm 1 nhân viên.</li>
                </ul>
              </div>
            }
            childB={
              <div className="rounded-xl border border-emerald-300/60 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-700/60 p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs font-semibold">
                    Bot đã đọc tài liệu nội bộ + biết đơn hàng của khách
                  </span>
                </div>
                <div className="space-y-2 text-sm text-foreground">
                  <div className="rounded-lg bg-white/70 dark:bg-slate-900/40 p-3 italic">
                    &ldquo;Cảm ơn bạn đã liên hệ. Theo chính sách của chúng tôi, đơn hàng đi tỉnh
                    cam kết 3-5 ngày làm việc. Đơn của bạn (#A-2841) đã quá thời hạn 1 ngày. Tôi
                    đã mở vé xử lý ưu tiên và chuyển thẳng cho đội vận chuyển. Bạn sẽ nhận cập nhật
                    trong 2 giờ. Tham khảo{" "}
                    <span className="underline text-link">Chính sách giao hàng</span>.&rdquo;
                  </div>
                </div>
                <ul className="text-[11px] text-emerald-800 dark:text-emerald-300 space-y-1">
                  <li>• Đúng chính sách riêng của công ty.</li>
                  <li>• Kèm link tới tài liệu nguồn &mdash; khách kiểm tra được.</li>
                  <li>• Mở ticket nội bộ, không cần nhân viên tham gia.</li>
                </ul>
              </div>
            }
          />
        </div>
      </ApplicationProblem>

      {/* ═══════════════════════════════════════════════════════════════════
          MECHANISM — Beats với visuals (ProgressSteps-style)
          ═══════════════════════════════════════════════════════════════════ */}
      <ApplicationMechanism
        parentTitleVi="Học trong Ngữ cảnh"
        topicSlug="in-context-learning-in-chatbots"
      >
        <Beat step={1}>
          <div className="space-y-3">
            <p>
              <strong>Fin quét toàn bộ tài liệu công ty bạn trong vài phút.</strong> Bạn kết
              nối Fin với help center (trung tâm trợ giúp &mdash; trang tài liệu hướng dẫn)
              hoặc Zendesk của bạn. Fin đọc hết, lập chỉ mục, sẵn sàng trả lời. Không cần
              huấn luyện lại mô hình, không cần đội kỹ sư.
            </p>
            <div className="not-prose grid grid-cols-3 gap-2">
              {[
                { icon: BookOpen, label: "Tài liệu HDSD" },
                { icon: ClipboardCheck, label: "Chính sách" },
                { icon: Building2, label: "FAQ nội bộ" },
              ].map((it, i) => (
                <motion.div
                  key={it.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.3 }}
                  className="rounded-lg border border-border bg-card p-2.5 flex flex-col items-center gap-1.5"
                >
                  <it.icon className="h-5 w-5 text-accent" />
                  <span className="text-[11px] text-muted text-center">{it.label}</span>
                </motion.div>
              ))}
            </div>
            <div className="not-prose flex items-center justify-center">
              <ArrowRight className="h-4 w-4 text-accent animate-pulse" />
            </div>
            <div className="not-prose rounded-lg border-2 border-accent/40 bg-accent-light p-3 text-center">
              <span className="text-xs font-semibold text-accent-dark">
                Kho kiến thức được lập chỉ mục
              </span>
            </div>
          </div>
        </Beat>

        <Beat step={2}>
          <div className="space-y-3">
            <p>
              <strong>Khách hỏi &mdash; Fin tìm đoạn tài liệu liên quan nhất rồi nhét vào
              prompt.</strong> Đây chính là khoảnh khắc học trong ngữ cảnh: Fin xây một prompt
              mới có dạng &ldquo;Dưới đây là tài liệu công ty về chính sách bảo hành. Dùng
              tài liệu này để trả lời câu hỏi bên dưới&hellip;&rdquo;, kèm câu hỏi thật của
              khách ở cuối.
            </p>
            <div className="not-prose rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-3 py-2 bg-surface/40 border-b border-border text-[11px] font-semibold text-foreground">
                Prompt Fin xây tự động (rút gọn)
              </div>
              <div className="p-3 space-y-2 text-[11px] font-mono">
                <div className="rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-2 text-foreground">
                  <span className="text-blue-700 dark:text-blue-300 font-semibold">
                    [Tài liệu công ty]
                  </span>
                  <br />
                  Chính sách bảo hành: Sản phẩm được bảo hành 12 tháng kể từ ngày mua. Lỗi do
                  người dùng không được bảo hành&hellip;
                </div>
                <div className="rounded bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-2 text-foreground">
                  <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
                    [Câu hỏi khách]
                  </span>
                  <br />
                  Máy của tôi mua 8 tháng trước bị hỏng, còn bảo hành không?
                </div>
              </div>
            </div>
            <Callout variant="insight" title="Đây chính là ICL trong đời thật">
              Không ai huấn luyện lại GPT-4 về sản phẩm của công ty bạn. Fin chỉ &ldquo;dạy
              tạm&rdquo; AI bằng các đoạn tài liệu kèm theo. Khi cuộc trò chuyện kết thúc, AI
              quên ngay &mdash; nhưng trong đúng lần trả lời đó, nó là &ldquo;chuyên gia&rdquo;
              về sản phẩm của bạn.
            </Callout>
          </div>
        </Beat>

        <Beat step={3}>
          <div className="space-y-3">
            <p>
              <strong>Fin bị &ldquo;khoá miệng&rdquo; để không bịa thông tin.</strong> Intercom
              ép Fin chỉ được nói những gì có trong tài liệu. Kết quả: tỷ lệ bịa (hallucination
              &mdash; AI nói sai sự thật) giảm khoảng 10 lần so với bot không có ràng buộc.
              Mỗi câu trả lời kèm link đến bài viết nguồn để khách tự kiểm tra.
            </p>
            <div className="not-prose grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-red-300/60 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-xs font-semibold text-red-800 dark:text-red-300">
                    Không ràng buộc
                  </span>
                </div>
                <p className="text-[11px] text-red-800 dark:text-red-300">
                  Bot tự tin bịa &ldquo;chính sách&rdquo; nghe hợp lý. Khách tin và công ty ôm
                  hậu quả.
                </p>
              </div>
              <div className="rounded-xl border border-emerald-300/60 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-700 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    Fin có ràng buộc
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                  Chỉ trả lời từ tài liệu. Không tìm thấy → nói &ldquo;Tôi chưa chắc&rdquo; và
                  chuyển nhân viên.
                </p>
              </div>
            </div>
          </div>
        </Beat>

        <Beat step={4}>
          <div className="space-y-3">
            <p>
              <strong>Khi vượt giới hạn, Fin giao lại cho nhân viên.</strong> Câu hỏi ngoài
              phạm vi tài liệu, hoặc khách bày tỏ bực tức, Fin không đoán mò. Nó chuyển ngay
              sang nhân viên hỗ trợ cùng toàn bộ lịch sử chat &mdash; để nhân viên không phải
              hỏi lại từ đầu.
            </p>
            <div className="not-prose rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <span className="h-8 w-8 rounded-full bg-accent-light flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-accent" />
                  </span>
                  <span className="text-xs text-foreground">Fin</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted" />
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <span className="text-xs text-foreground">Nhân viên</span>
                  <span className="h-8 w-8 rounded-full bg-surface border border-border flex items-center justify-center">
                    <UserCog className="h-4 w-4 text-foreground" />
                  </span>
                </div>
              </div>
              <div className="mt-3 rounded-lg bg-surface/40 px-3 py-2 text-[11px] text-muted italic">
                &ldquo;Đã chuyển cho bạn Nguyễn Văn A. Khách hỏi về hoàn tiền đơn quốc tế. Lịch
                sử: 4 tin nhắn, Fin đã gửi 2 link chính sách&hellip;&rdquo;
              </div>
            </div>
          </div>
        </Beat>
      </ApplicationMechanism>

      {/* ═══════════════════════════════════════════════════════════════════
          METRICS — animated counters
          ═══════════════════════════════════════════════════════════════════ */}
      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="in-context-learning-in-chatbots"
      >
        <Metric
          value="Giải quyết tự động lên đến 50% yêu cầu hỗ trợ khách hàng"
          sourceRef={3}
        />
        <Metric
          value="Giảm tỷ lệ ảo giác khoảng 10 lần so với chatbot AI thông thường"
          sourceRef={1}
        />
        <Metric
          value="Triển khai không cần cấu hình — chỉ cần kết nối với help center có sẵn"
          sourceRef={3}
        />
      </ApplicationMetrics>

      {/* Cards trực quan hoá 3 con số trên */}
      <section aria-label="Số liệu hình ảnh" className="-mt-6 mb-10">
        <div className="grid md:grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl border border-border bg-card p-5 space-y-2"
          >
            <div className="flex items-center gap-2 text-muted text-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Vé tự giải quyết</span>
            </div>
            <div className="flex items-baseline gap-1">
              <AnimatedCounter to={50} suffix="%" />
            </div>
            <p className="text-[11px] text-muted">
              Khoảng một nửa vé hỗ trợ &mdash; Fin xử lý gọn, không cần nhân viên can thiệp.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-2xl border border-border bg-card p-5 space-y-2"
          >
            <div className="flex items-center gap-2 text-muted text-xs">
              <ShieldCheck className="h-4 w-4 text-blue-500" />
              <span>Ảo giác giảm</span>
            </div>
            <div className="flex items-baseline gap-1">
              <AnimatedCounter to={10} suffix="×" />
              <span className="text-sm text-muted">so với bot thường</span>
            </div>
            <p className="text-[11px] text-muted">
              Ràng buộc &ldquo;chỉ trả lời từ tài liệu&rdquo; chặn phần lớn tình huống AI tự
              &ldquo;chém&rdquo;.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="rounded-2xl border border-border bg-card p-5 space-y-2"
          >
            <div className="flex items-center gap-2 text-muted text-xs">
              <Sparkles className="h-4 w-4 text-accent" />
              <span>Thời gian bật Fin</span>
            </div>
            <div className="flex items-baseline gap-1">
              <AnimatedCounter to={0} suffix=" cấu hình" />
            </div>
            <p className="text-[11px] text-muted">
              Kết nối help center có sẵn &mdash; Fin tự đọc, tự sẵn sàng. Không cần kỹ sư.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          COUNTERFACTUAL — ToggleCompare: có ICL vs không có ICL
          ═══════════════════════════════════════════════════════════════════ */}
      <ApplicationCounterfactual
        parentTitleVi="Học trong Ngữ cảnh"
        topicSlug="in-context-learning-in-chatbots"
      >
        <p>
          Không có học trong ngữ cảnh, mỗi doanh nghiệp muốn có chatbot AI &ldquo;biết&rdquo;
          sản phẩm mình sẽ phải huấn luyện riêng một mô hình &mdash; tốn vài tháng, tốn đội
          kỹ sư, và mỗi lần cập nhật tài liệu lại phải huấn luyện lại từ đầu.
        </p>

        <div className="not-prose mt-5">
          <ToggleCompare
            labelA="Trước ICL"
            labelB="Với ICL"
            description="Cùng một việc: làm chatbot biết sản phẩm của từng công ty."
            childA={
              <div className="rounded-xl border border-amber-300/60 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700/60 p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                  <XCircle className="h-4 w-4" />
                  <span className="text-xs font-semibold">Mô hình riêng cho từng khách</span>
                </div>
                <ul className="text-xs text-foreground space-y-1.5">
                  <li>• Mất 2-3 tháng huấn luyện cho mỗi công ty.</li>
                  <li>• Cần đội kỹ sư ML đắt đỏ, khó tuyển.</li>
                  <li>• Tài liệu công ty sửa 1 câu → huấn luyện lại cả mô hình.</li>
                  <li>• Chi phí khởi tạo hàng chục nghìn đô-la/công ty.</li>
                  <li>• Không khả thi để phục vụ 25.000 doanh nghiệp.</li>
                </ul>
              </div>
            }
            childB={
              <div className="rounded-xl border border-emerald-300/60 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-700/60 p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs font-semibold">
                    Một mô hình + tài liệu riêng mỗi công ty
                  </span>
                </div>
                <ul className="text-xs text-foreground space-y-1.5">
                  <li>• Kết nối help center xong là bật được.</li>
                  <li>• Không cần kỹ sư ML &mdash; đội hỗ trợ tự làm.</li>
                  <li>• Sửa tài liệu → Fin cập nhật trong vài phút.</li>
                  <li>• Chi phí khởi tạo gần bằng 0, trả theo lượt chat.</li>
                  <li>• Quy mô hàng chục nghìn khách hàng trên cùng hạ tầng.</li>
                </ul>
              </div>
            }
          />
        </div>

        <p className="mt-5">
          Học trong ngữ cảnh cho phép Fin &ldquo;trở thành chuyên gia&rdquo; về bất kỳ sản
          phẩm nào chỉ bằng cách đọc tài liệu &mdash; giống một nhân viên mới học từ sổ tay
          hướng dẫn trong ngày đầu đi làm, rồi làm việc liền ngay chiều hôm đó.
        </p>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}
