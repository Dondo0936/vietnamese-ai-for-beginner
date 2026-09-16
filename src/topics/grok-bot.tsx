"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  Bot,
  CalendarDays,
  FolderOpen,
  Laptop,
  Layers,
  MessageSquare,
  Monitor,
  PenLine,
  Smartphone,
  Ticket,
} from "lucide-react";
import {
  AhaMoment,
  Callout,
  InlineChallenge,
  LessonSection,
  MiniSummary,
  PredictionGate,
  StepReveal,
  ToggleCompare,
  TopicLink,
} from "@/components/interactive";
import { MetricReadout } from "@/components/interactive/MetricReadout";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";
import type { ElementType } from "react";

export const metadata: TopicMeta = {
  slug: "grok-bot",
  title: "Grok Bot",
  titleVi: "Grok Bot: máy ảo luôn bật cho đội agent",
  description:
    "Grok Bot là 1 máy ảo Linux luôn bật. Mỗi Bot là một vai trò chạy trên cùng máy đó. File, cookie và đăng nhập dùng chung cho cả tài khoản.",
  category: "ai-agents",
  tags: ["agents", "grok", "automation", "computer-use", "workflow"],
  difficulty: "intermediate",
  relatedSlugs: [
    "agentic-workflows",
    "computer-use",
    "ai-agent-loops",
    "multi-agent",
  ],
  vizType: "interactive",
  sources: [
    {
      title: "Introducing Grok Bot",
      publisher: "xAI",
      url: "https://x.ai/news/introducing-grok-bot",
      date: "2026-08",
      kind: "engineering-blog",
    },
    {
      title: "Designing Grok Bot for a world of persistent agents",
      publisher: "xAI",
      url: "https://x.ai/news/designing-grok-bot",
      date: "2026-09",
      kind: "engineering-blog",
    },
    {
      title: "Grok Bot is now included with more plans",
      publisher: "xAI",
      url: "https://x.ai/news/grok-bot-more-plans",
      date: "2026-08",
      kind: "news",
    },
    {
      title: "Grok Bot 101",
      publisher: "xAI",
      url: "https://x.ai/bot/guides/grok-bot-101",
      date: "2026-09",
      kind: "documentation",
    },
  ],
};

const TOTAL_STEPS = 8;

const roster = [
  {
    id: "ticket",
    name: "Bot ticket",
    role: "Chăm Zalo OA mỗi 15 phút",
    icon: Ticket,
  },
  {
    id: "calendar",
    name: "Bot lịch",
    role: "Nhìn lịch làm và lịch nhà",
    icon: CalendarDays,
  },
  {
    id: "writing",
    name: "Bot viết",
    role: "Soạn trả lời cho khách",
    icon: PenLine,
  },
] as const;

const handoffSteps = [
  {
    title: "Tạo Bot",
    detail:
      "Bạn đặt tên, vai trò và vài câu hướng dẫn. Lần sau mở lại đúng Bot đó. Việc và máy vẫn còn.",
  },
  {
    title: "Đăng nhập app thật",
    detail:
      "Bot mở trình duyệt trên máy ảo, hoặc dùng connector, tức đầu nối sẵn vào app. Bạn đăng nhập Zalo OA hay Google Calendar như vẫn làm trên web.",
  },
  {
    title: "Giao việc",
    detail:
      "Bạn nhắn một lần: kiểm ticket mới mỗi 15 phút, soạn nháp, chỉ gọi bạn khi cần duyệt. Rồi gấp laptop đi họp.",
  },
  {
    title: "Cổng duyệt",
    detail:
      "Việc nhạy cảm dừng lại chờ bạn. Gửi tin cho khách, chuyển tiền, xoá dữ liệu: Bot không tự quyết hộ.",
  },
  {
    title: "Mở lại trên điện thoại",
    detail:
      "Cùng Bot, cùng máy, cùng file. Không cần đăng nhập hay mở thư mục lại. Việc đang dở vẫn nằm đó.",
  },
];

const identityCards: {
  badge: string;
  title: string;
  body: string;
  icon: ElementType;
}[] = [
  {
    badge: "Bot",
    title: "Vai trò",
    body: "Mỗi Bot có tên, việc, và cửa sổ riêng. Lần sau bạn mở đúng Bot đó, việc hôm trước vẫn còn.",
    icon: Bot,
  },
  {
    badge: "Computer",
    title: "Máy chạy dùng chung",
    body: "Cả tài khoản chỉ có 1 máy ảo Linux. File, cookie, phiên đăng nhập nằm trên máy này. 3 Bot đều dùng.",
    icon: Monitor,
  },
  {
    badge: "Group chat",
    title: "Cách ghép",
    body: "Muốn nhiều Bot cùng một việc, bạn cho chúng vào một group chat, tức nhóm chat ghép Bot. Chúng nhắn nhau và chuyển việc, không cần bạn copy ngữ cảnh bằng tay.",
    icon: MessageSquare,
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    question:
      "3 Bot của cùng một tài khoản Grok Bot dùng chung thứ gì?",
    options: [
      "1 máy ảo Linux, kèm file, cookie và đăng nhập của tài khoản",
      "Chỉ dùng chung câu prompt ban đầu, mỗi Bot có 1 máy riêng",
      "Không dùng chung gì. Mỗi Bot là một sản phẩm tách biệt",
      "Chỉ dùng chung model. File và đăng nhập thì khoá theo từng Bot",
    ],
    correct: 0,
    explanation:
      "Mọi Bot của cùng tài khoản nhìn cùng máy, cùng thư mục, cùng phiên đăng nhập. Đặt tên Bot khác nhau không tách được file hay phiên đã đăng nhập.",
  },
  {
    question: "Bot khác một cuộc trò chuyện chat thông thường ở điểm nào?",
    options: [
      "Bot giữ tên, nhớ và máy sang ngày hôm sau. Bạn mở lại đúng Bot đó, không phải kể lại từ đầu",
      "Bot luôn trả lời ngắn hơn một cuộc trò chuyện",
      "Bot không được dùng trình duyệt, chỉ được nói chuyện",
      "Bot tự biến mất khi bạn gấp laptop",
    ],
    correct: 0,
    explanation:
      "Grok Bot giữ tên, nhớ, máy và công cụ theo từng Bot. Ngày hôm sau bạn mở đúng Bot đó, không phải kể lại từ đầu.",
  },
  {
    question: "Vì sao việc còn chạy khi bạn gấp laptop?",
    options: [
      "Máy ảo luôn bật. Laptop của bạn chỉ để xem và ra lệnh",
      "Grok Bot sao chép toàn bộ máy bạn lên điện thoại trước khi bạn gấp",
      "Model nhớ việc trong trọng số, nên không cần máy nào chạy",
      "Zalo OA tự chạy Bot hộ, Grok Bot không cần máy",
    ],
    correct: 0,
    explanation:
      "Máy ảo do xAI giữ hộ. Bạn gấp laptop thì mất màn hình xem, máy ảo vẫn chạy.",
  },
];

const SOURCE_101 = "https://x.ai/bot/guides/grok-bot-101";

function FigureCard({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption: string;
}) {
  return (
    <figure className="rounded-xl border border-border bg-card p-3">
      <Image
        src={src}
        alt={alt}
        width={1600}
        height={1000}
        sizes="(max-width: 1024px) 100vw, 960px"
        className="h-auto w-full rounded-lg"
      />
      <figcaption className="mt-2 text-xs leading-relaxed text-foreground">
        {caption}{" "}
        <a
          href={SOURCE_101}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium underline decoration-border underline-offset-2 hover:decoration-foreground"
        >
          Grok Bot 101, xAI
        </a>
        .
      </figcaption>
    </figure>
  );
}

function IdentityGrid() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {identityCards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.badge}
            className="rounded-xl border border-border bg-card p-4"
          >
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
              <Icon className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              {card.badge}
            </p>
            <p className="font-semibold text-foreground">{card.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-foreground">
              {card.body}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function SharedComputerViz() {
  const [active, setActive] = useState(0);
  const current = roster[active];

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">
        Bấm 1 Bot. Cả 3 đứng trên cùng 1 máy. Cửa sổ làm việc khác nhau,
        nhưng thư mục và phiên Zalo OA thì cả 3 đều thấy.
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {roster.map((bot, index) => {
          const Icon = bot.icon;
          const selected = index === active;
          return (
            <button
              key={bot.id}
              type="button"
              onClick={() => setActive(index)}
              className={`rounded-xl border p-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
                selected
                  ? "border-accent bg-accent-light text-foreground"
                  : "border-border bg-card text-foreground hover:bg-surface"
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Icon className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                {bot.name}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-foreground">
                {bot.role}
              </span>
            </button>
          );
        })}
      </div>
      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="mb-3 text-sm font-semibold text-foreground">
          Máy ảo Linux của tài khoản
        </p>
        <ul className="space-y-2 text-sm leading-relaxed text-foreground">
          <li className="flex gap-2">
            <FolderOpen className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            <span>
              Thư mục <code>/work</code> dùng chung. {current.name} đang mở
              file, 2 Bot kia cũng đọc được.
            </span>
          </li>
          <li className="flex gap-2">
            <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            <span>
              Phiên Zalo OA đã đăng nhập trên máy này. Không phải phiên của
              riêng {current.name}.
            </span>
          </li>
          <li className="flex gap-2">
            <Monitor className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            <span>
              {current.name} có cửa sổ riêng để làm song song. Cửa sổ đó
              giúp bạn gọi đúng Bot. File và đăng nhập thì vẫn dùng chung.
            </span>
          </li>
        </ul>
        <div className="mt-4 rounded-lg border border-border bg-card px-3 py-2">
          <MetricReadout
            label="Chung 1 máy"
            value="Tên Bot không khoá được file hay đăng nhập."
            valueClassName="text-sm font-semibold text-foreground"
          />
        </div>
      </div>
    </div>
  );
}

function LaptopToggle() {
  return (
    <ToggleCompare
      labelA="Laptop đang mở"
      labelB="Laptop đã gấp"
      description="Máy của Bot không nằm trong laptop bạn."
      childA={
        <div className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4">
          <Laptop className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-foreground">
            Bạn thấy Bot ticket đang đọc hàng chờ Zalo OA. Laptop chỉ để xem
            và ra lệnh. Việc chạy trên máy ảo.
          </p>
        </div>
      }
      childB={
        <div className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4">
          <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-foreground">
            Bạn đi họp, gấp máy. Bot ticket vẫn kiểm hàng chờ mỗi 15 phút.
            Buổi chiều mở điện thoại, cùng Bot, cùng file, việc chưa xong vẫn
            nằm đó.
          </p>
        </div>
      }
    />
  );
}

function HandoffReveal() {
  return (
    <StepReveal labels={handoffSteps.map((step) => step.title)}>
      {handoffSteps.map((step, index) => (
        <div
          key={step.title}
          className="rounded-xl border border-border bg-card p-4"
        >
          <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">
              {index + 1}
            </span>
            {step.title}
          </p>
          <p className="text-sm leading-relaxed text-muted">{step.detail}</p>
        </div>
      ))}
    </StepReveal>
  );
}

export default function GrokBotTopic() {
  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Thử đoán">
        <PredictionGate
          question="Chủ quán tạo 3 Bot: chăm ticket Zalo OA, nhìn lịch, soạn trả lời. 3 Bot này dùng chung thứ gì?"
          options={[
            "Mỗi Bot có 1 máy riêng, nên đăng nhập Zalo của Bot ticket thì Bot lịch không thấy",
            "Chúng chỉ dùng chung câu prompt, tức lời giao việc. File và cookie, tức tệp đăng nhập trình duyệt, thì tách theo từng Bot",
            "1 máy ảo, kèm file, cookie và đăng nhập của cả tài khoản",
          ]}
          correct={2}
          explanation="Grok Bot cấp 1 máy ảo Linux cho cả tài khoản. Agent, tức tác nhân AI, chạy trên máy đó. Mỗi cái một tên Bot. Tên Bot khác nhau không tách được file hay phiên đăng nhập."
        >
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Nhiều người nghĩ tạo 3 Bot thì được 3 máy tách nhau. Không. Cả 3
            đứng trên cùng 1 máy. Tên Bot chỉ ghi việc ai làm, không khoá
            file hay đăng nhập.
          </p>
        </PredictionGate>
      </LessonSection>

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Góc nhìn">
        <div className="space-y-4">
          <p>
            Bạn muốn một Bot chăm ticket Zalo OA, nhìn luôn Google
            Calendar, rồi gấp laptop đi họp. Chatbot bình thường dừng khi
            bạn đóng tab. Grok Bot không dừng theo tab.
          </p>
          <p>
            Bạn làm việc với từng <strong>Bot</strong> có tên. Ảnh dưới là
            1 Bot tên Grocery: hội thoại bên trái, màn hình máy ở giữa,
            routine, tức quy trình đã dạy, bên phải. Lần sau bạn mở đúng
            Bot Grocery, không phải kể lại từ đầu.
          </p>
          <FigureCard
            src="/grok-bot/anatomy.jpg"
            alt="Cửa sổ Grok Bot của vai trò Grocery: chat, màn hình máy, và danh sách routine"
            caption="Grocery là 1 Bot có tên, việc, và máy luôn bật. Đóng tab không mất Bot này."
          />
          <IdentityGrid />
        </div>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <div className="space-y-5">
            <p>
              Cả tài khoản chỉ có 1 máy ảo Linux. Ảnh dưới là cái máy đó:
              trình duyệt, thư mục, dock ứng dụng. Laptop bạn chỉ để xem và
              ra lệnh.
            </p>
            <FigureCard
              src="/grok-bot/cloud-computer.jpg"
              alt="Màn hình máy ảo Linux của Grok Bot với dock ứng dụng và giấy dán ghi chú"
              caption="1 máy của cả tài khoản. Gấp laptop không tắt máy này."
            />
            <SharedComputerViz />
            <LaptopToggle />
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <div className="space-y-5">
          <HandoffReveal />
          <p>
            Muốn nhiều Bot cùng một việc, bạn cho chúng vào group chat.
            Chúng nhắn nhau trên cùng 1 máy. Ảnh dưới: Marketplace Bot hỏi
            Chief of Staff Bot, không cần bạn copy ngữ cảnh bằng tay.
          </p>
          <FigureCard
            src="/grok-bot/chain.jpg"
            alt="Marketplace Bot nhắn Chief of Staff Bot trong một chuỗi chuyên gia"
            caption="Nhiều Bot, 1 máy, chúng tự chuyển việc cho nhau."
          />
          <Callout variant="warning" title="Đăng nhập một lần, mọi Bot đều vào được">
            Tài liệu xAI ghi rõ: 3 Bot của cùng tài khoản dùng chung 1 máy
            ảo. Bạn đăng nhập ngân hàng, để mật khẩu admin, hay để file hợp
            đồng trên máy này thì Bot ticket, Bot lịch, Bot viết đều mở
            được. Bảng Allow và Deny bên dưới áp cho cả máy, nên 3 Bot nhìn
            cùng một quy tắc.
          </Callout>
          <FigureCard
            src="/grok-bot/permissions.jpg"
            alt="Bảng Allow và Deny quy định trang nào Bot được vào trên máy dùng chung"
            caption="Quy tắc vào trang nằm trên máy dùng chung. 3 Bot ticket, lịch, viết nhìn cùng một phiên."
          />
          <AhaMoment>
            Bạn giao việc theo từng Bot. File và đăng nhập thì nằm trên 1
            máy của cả tài khoản.
          </AhaMoment>
        </div>
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Đồng nghiệp bảo: để đăng nhập ngân hàng công ty lên Finance Bot thôi, các Bot khác sẽ không thấy. Cách này đúng không?"
          options={[
            "Đúng. Mỗi Bot có 1 máy riêng nên đăng nhập bị khoá theo Bot",
            "Sai. Mọi Bot của cùng tài khoản dùng chung 1 máy, file, cookie và đăng nhập",
            "Đúng, nếu đặt tên Bot là Finance",
            "Sai vì Grok Bot không có trình duyệt",
          ]}
          correct={1}
          explanation="Mọi Bot của cùng tài khoản đều vào được máy đó. Việc nhạy cảm thì đừng để trên máy này, hoặc đừng tạo Bot thứ hai trên cùng tài khoản."
        />
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Hiểu sâu hơn">
        <ExplanationSection topicSlug={metadata.slug}>
          <div className="space-y-4">
            <p>
              Grok Bot là máy ảo do xAI giữ hộ. xAI cấp 1 máy ảo Linux,
              luôn bật, có trình duyệt, hệ thống tệp và terminal. Gói
              SuperGrok (kể cả Plus và Heavy) và gói Cursor Pro, Pro+, Ultra,
              Teams đều kèm Grok Bot. Hạn mức dùng Bot, tức quota, tách khỏi
              hạn mức chat.
            </p>
            <p>
              Có hai cách gắn app. Cách sạch là{" "}
              <strong>connector</strong>, tức đầu nối sẵn: bạn bấm, đăng nhập
              trên trình duyệt máy bạn, xong. Khi chưa có connector, Bot mở
              trình duyệt trên máy ảo và bạn đăng nhập như vào một website.
              xAI cảnh báo cách này vướng khi
              giao diện đổi, phiên hết hạn, và CAPTCHA. Chỗ nào có
              connector thì dùng connector. MCP, tức giao thức gắn công cụ
              ngoài (Model Context Protocol), cũng gắn được khi nhà cung
              cấp hỗ trợ.
            </p>
            <p>
              <strong>Routine</strong> (quy trình bạn dạy một lần) là việc
              bạn chỉ trên app thật, Bot ghi lại đường đi, rồi chạy lại khi
              bạn gọi hoặc theo lịch. Group chat, tức nhóm chat ghép Bot,
              để ticket đưa ngữ cảnh cho Bot viết, Bot viết đưa bản nháp
              cho bạn duyệt.
            </p>
            <Callout variant="info" title="Sản phẩm còn ở bản beta">
              Tháng 8 năm 2026, Grok Bot mới ra. Không có nút chọn model,
              tức model picker, công khai. xAI chọn model hộ bạn. Gói
              doanh nghiệp, tức Enterprise, vẫn trong danh sách chờ. Coi
              mọi đánh giá độ bền hôm nay là tạm thời.
            </Callout>
          </div>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <div className="space-y-5">
          <MiniSummary
            title="3 điều cần nhớ"
            points={[
              "Bot giữ tên, việc và máy luôn bật. Đóng tab hay gấp laptop không mất Bot.",
              "File, cookie và đăng nhập dùng chung theo tài khoản. 3 Bot đều thấy những gì đã đăng nhập trên máy đó.",
              "Cách khác là tự chạy máy trên máy bạn, gọi là OpenClaw. Lúc đó bạn lo máy chạy, xAI không lo hộ.",
            ]}
          />
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <BookOpen className="h-4 w-4 text-accent" />
              So sánh Grok Bot với OpenClaw
            </h3>
            <p className="text-sm leading-relaxed text-muted">
              Bài này chỉ nói máy ảo xAI giữ hộ. OpenClaw là cổng bạn tự
              chạy trên laptop, mini PC hoặc VPS. Chỗ khác nhau, lúc nào
              cầm bên nào, nằm ở{" "}
              <Link
                href="/articles/grok-bot-vs-openclaw"
                className="text-accent-dark border-b border-dotted border-accent-dark/40 transition-opacity hover:border-accent-dark hover:opacity-80 dark:text-accent dark:border-accent/40 dark:hover:border-accent"
              >
                Grok Bot cho bạn cái máy. OpenClaw cho bạn cái cổng.
              </Link>
              .
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Layers className="h-4 w-4 text-accent" />
              Học tiếp trên nhánh agent
            </h3>
            <p className="text-sm leading-relaxed text-muted">
              Muốn thấy agent nằm trong quy trình nhiều bước, xem{" "}
              <TopicLink slug="agentic-workflows">
                Agentic workflow: giao việc cho AI chạy nhiều bước
              </TopicLink>
              . Muốn hiểu agent nhìn màn hình rồi bấm, xem{" "}
              <TopicLink slug="computer-use">AI sử dụng máy tính</TopicLink>
              . Muốn giao việc rồi để agent tự lặp đến khi xong, xem{" "}
              <TopicLink slug="ai-agent-loops">
                Vòng lặp agent: giao việc cho AI tự chạy đến khi xong
              </TopicLink>
              .
            </p>
          </div>
        </div>
      </LessonSection>

      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
