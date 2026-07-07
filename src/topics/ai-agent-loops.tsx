"use client";

import { motion } from "framer-motion";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Gauge,
  Layers,
  ShieldCheck,
  Target,
  TimerReset,
  Workflow,
  Zap,
} from "lucide-react";
import {
  AhaMoment,
  Callout,
  CodeBlock,
  InlineChallenge,
  LessonSection,
  MatchPairs,
  MiniSummary,
  PredictionGate,
  StepReveal,
  TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";
import type { ElementType } from "react";

export const metadata: TopicMeta = {
  slug: "ai-agent-loops",
  title: "AI Agent Loops",
  titleVi: "Vòng lặp agent: giao việc cho AI tự chạy đến khi xong",
  description:
    "Bốn kiểu vòng lặp giúp AI agent tự lặp lại công việc đến khi đạt điều kiện dừng: theo lượt, theo mục tiêu, theo lịch và chủ động. Kèm cách giữ chất lượng và quản lý token.",
  category: "ai-agents",
  tags: ["agents", "loops", "automation", "claude-code", "workflow"],
  difficulty: "beginner",
  relatedSlugs: ["agentic-workflows", "ai-coding-assistants", "getting-started-with-ai"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

const summaryPairs = [
  {
    left: "Phần kiểm tra",
    right: "Vòng lặp theo lượt",
  },
  {
    left: "Điều kiện dừng",
    right: "Vòng lặp theo mục tiêu",
  },
  {
    left: "Thời điểm chạy",
    right: "Vòng lặp theo lịch",
  },
  {
    left: "Toàn bộ đề bài",
    right: "Vòng lặp chủ động",
  },
];

const loopSteps = [
  {
    title: "Thu thập ngữ cảnh",
    detail:
      "Agent đọc yêu cầu, file liên quan, phản hồi trước đó và tài liệu cần thiết trước khi chạm vào việc chính.",
  },
  {
    title: "Hành động",
    detail:
      "Agent sửa code, gọi công cụ, viết ghi chú, mở trình duyệt hoặc chạy lệnh đúng với phần việc đang làm.",
  },
  {
    title: "Tự kiểm tra",
    detail:
      "Agent nhìn lại kết quả bằng test, linter, ảnh chụp, log hoặc tiêu chí bạn đã giao từ đầu.",
  },
  {
    title: "Lặp nếu cần",
    detail:
      "Nếu tiêu chí chưa đạt, agent quay lại lấy thêm ngữ cảnh và sửa tiếp thay vì kết luận sớm.",
  },
  {
    title: "Trả lời",
    detail:
      "Khi điều kiện dừng đã đạt hoặc cần thêm ngữ cảnh từ bạn, agent tóm tắt việc đã làm và bằng chứng.",
  },
];

const loopTypes = [
  {
    name: "Theo lượt",
    icon: ClipboardCheck,
    trigger: "Một prompt từ bạn.",
    stop:
      "Claude tự thấy nhiệm vụ đã xong hoặc cần thêm ngữ cảnh từ bạn.",
    primitive: "Không có primitive riêng, đây là mọi prompt bình thường.",
    bestFor: "Việc ngắn, một lần, phạm vi rõ.",
    usage:
      "Viết prompt cụ thể và đóng gói phần tự kiểm tra thành skill, tức bộ hướng dẫn để agent tự kiểm chứng.",
  },
  {
    name: "Theo mục tiêu",
    icon: Target,
    trigger: "Một prompt thủ công có điều kiện đo được.",
    stop:
      "Mục tiêu đạt hoặc chạm số lượt tối đa bạn đặt.",
    primitive: "`/goal`.",
    bestFor: "Việc có tiêu chí xong rõ ràng như test đạt hoặc điểm số vượt ngưỡng.",
    usage:
      "Dùng tiêu chí tất định. Mỗi lần agent định dừng, model đánh giá đọc hội thoại và gửi agent quay lại nếu chưa đạt.",
    commandTitle: "Ví dụ /goal",
    command:
      "/goal get the homepage Lighthouse score to 90 or above, stop after 5 tries.",
  },
  {
    name: "Theo lịch",
    icon: CalendarClock,
    trigger: "Một khoảng thời gian hoặc lịch chạy.",
    stop:
      "Bạn hủy vòng lặp, hoặc công việc hoàn tất như PR đã gộp hay hàng đợi đã rỗng.",
    primitive: "`/loop`, `/schedule`.",
    bestFor:
      "Việc lặp lại hoặc việc phải thăm dò hệ thống ngoài, ví dụ PR, tức yêu cầu gộp code, và CI, tức bộ kiểm tra tự động của dự án.",
    usage:
      "Đặt khoảng cách dài hơn, hoặc chuyển sang phản ứng theo sự kiện khi hệ thống có thể báo cho bạn.",
    commandTitle: "Ví dụ /loop",
    command:
      "/loop 5m check my PR, address review comments, and fix failing CI",
  },
  {
    name: "Chủ động",
    icon: Zap,
    trigger: "Một sự kiện hoặc lịch chạy, không cần bạn ngồi đó theo thời gian thực.",
    stop:
      "Mỗi tác vụ dừng khi mục tiêu của nó đạt; routine, tức lịch chạy tự động, tiếp tục đến khi bạn tắt.",
    primitive:
      "`/schedule`, `/goal`, skills, dynamic workflows và auto mode.",
    bestFor:
      "Dòng việc lặp lại, định nghĩa rõ như triage bug, nâng cấp thư viện hoặc xử lý phản hồi.",
    usage:
      "Chạy routine bằng model nhỏ và nhanh hơn. Chỉ dùng model mạnh nhất cho đoạn cần phán đoán.",
    commandTitle: "Ví dụ /schedule và /goal",
    command:
      "/schedule every hour: check the #project-feedback channel for bug reports. /goal: don't stop until every report found this run is triaged, actioned, and responded to. When fixing a bug, use a workflow to explore three solutions in parallel worktrees and have a judge adversarially review them.",
  },
];

const qualityRules = [
  "Giữ codebase sạch: agent theo mẫu đang có trong dự án, không tự bày phong cách riêng.",
  "Cho agent cách tự kiểm tra bằng skill: mở dev server, thao tác lên thay đổi, xem console, chạy trace hiệu năng, lỗi thì quay lại bước đầu.",
  "Để tài liệu dễ tới: README, docs và lệnh kiểm chứng phải nằm ở nơi agent đọc được khi bắt đầu.",
  "Dùng agent thứ hai với ngữ cảnh mới để đánh giá code, nhất là khi thay đổi có rủi ro.",
  "Khi kết quả chưa đạt, mã hóa bài học vào hệ thống, không chỉ sửa riêng lần chạy đó.",
];

const tokenRules = [
  "Chọn primitive và model đúng với việc, không dùng vòng lặp phức tạp cho việc chỉ cần một lượt.",
  "Viết điều kiện thành công và điều kiện dừng rõ, để agent biết khi nào được ngừng.",
  "Chạy thử trên một lát nhỏ trước khi mở rộng sang cả repo, cả hàng đợi hoặc cả kênh dữ liệu.",
  "Dùng script cho việc tất định, để agent không phải suy luận lại cùng một phép biến đổi.",
  "Đừng chạy routine thường hơn tốc độ thứ được theo dõi thay đổi.",
  "Xem `/usage`; với `/goal` không tham số, bạn thấy số lượt và token, tức đơn vị chữ mà AI xử lý, đã dùng.",
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "`/goal` dừng khi nào?",
    options: [
      "Khi điều kiện đạt hoặc chạm số lượt tối đa bạn đặt",
      "Khi agent chạy hết mọi file trong repo",
      "Khi model đổi sang phiên bản mới hơn",
      "Khi bạn mở lại terminal",
    ],
    correct: 0,
    explanation:
      "`/goal` cần một điều kiện dừng rõ và có thể kèm số lượt tối đa. Agent được gửi quay lại làm tiếp cho đến khi điều kiện đạt hoặc hết lượt.",
  },
  {
    question:
      "Vì sao `/loop` dừng khi bạn tắt máy còn routine của `/schedule` thì không?",
    options: [
      "`/loop` chạy trên máy bạn; `/schedule` chuyển vòng lặp lên cloud, tức máy chủ đám mây",
      "`/loop` chỉ chạy được một lần, còn `/schedule` chạy vô hạn dù không có điều kiện dừng",
      "`/loop` dùng model yếu hơn, còn `/schedule` dùng model mạnh hơn",
      "`/schedule` bỏ qua mọi kiểm tra nên không cần máy bạn",
    ],
    correct: 0,
    explanation:
      "Điểm khác nhau là nơi chạy. `/loop` phụ thuộc máy của bạn; routine từ `/schedule` chạy trên cloud và tiếp tục theo lịch cho đến khi bạn tắt hoặc việc hoàn tất.",
  },
  {
    question: "Vì sao tiêu chí đo đếm được hiệu quả hơn với `/goal`?",
    options: [
      "Vì model đánh giá kiểm tra được rõ ràng, agent không tự kết luận tạm ổn rồi dừng sớm",
      "Vì tiêu chí cảm tính luôn tốn ít token hơn",
      "Vì `/goal` tự chạy test dù bạn không nói test nào cần chạy",
      "Vì mọi task trong repo đều có một điểm số duy nhất",
    ],
    correct: 0,
    explanation:
      "Model đánh giá của `/goal` đọc hội thoại. Tiêu chí như số test đạt hoặc điểm Lighthouse dễ chứng minh hơn tiêu chí mơ hồ như đẹp hơn hay tốt hơn.",
  },
  {
    question: "Vòng lặp chủ động hợp với loại việc nào?",
    options: [
      "Dòng việc lặp lại, định nghĩa rõ: triage bug, nâng cấp thư viện, xử lý phản hồi",
      "Việc chỉ cần bạn hỏi một câu và nghe giải thích",
      "Việc có rủi ro cao nhưng không có người duyệt",
      "Việc sáng tạo chưa biết tiêu chí xong là gì",
    ],
    correct: 0,
    explanation:
      "Chủ động hợp với dòng việc đến đều và có tiêu chí xử lý rõ. Nếu việc mơ hồ hoặc rủi ro cao, cần giữ người duyệt trong vòng.",
  },
];

function LoopTypeGrid() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {loopTypes.map((loop, index) => {
          const Icon = loop.icon;
          return (
            <motion.div
              key={loop.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06, duration: 0.25 }}
              className="rounded-xl border border-border bg-card p-4"
            >
              <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
                <Icon className="h-4 w-4 text-accent" />
                Vòng lặp {loop.name.toLowerCase()}
              </h3>
              <dl className="grid grid-cols-1 gap-2 text-sm">
                <div className="rounded-lg bg-surface p-3">
                  <dt className="mb-1 font-semibold text-foreground">Kích hoạt</dt>
                  <dd className="leading-relaxed text-muted">{loop.trigger}</dd>
                </div>
                <div className="rounded-lg bg-surface p-3">
                  <dt className="mb-1 font-semibold text-foreground">Dừng khi</dt>
                  <dd className="leading-relaxed text-muted">{loop.stop}</dd>
                </div>
                <div className="rounded-lg bg-surface p-3">
                  <dt className="mb-1 font-semibold text-foreground">Công cụ</dt>
                  <dd className="leading-relaxed text-muted">{loop.primitive}</dd>
                </div>
                <div className="rounded-lg bg-surface p-3">
                  <dt className="mb-1 font-semibold text-foreground">Hợp với</dt>
                  <dd className="leading-relaxed text-muted">{loop.bestFor}</dd>
                </div>
              </dl>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                <strong className="text-foreground">Quản lý usage:</strong>{" "}
                {loop.usage}
              </p>
              {loop.command ? (
                <div className="mt-4">
                  <CodeBlock language="bash" title={loop.commandTitle}>
                    {loop.command}
                  </CodeBlock>
                </div>
              ) : null}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function AgenticLoopReveal() {
  return (
    <StepReveal labels={loopSteps.map((step) => step.title)}>
      {loopSteps.map((step, index) => (
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

function RuleGroup({
  title,
  icon: Icon,
  rules,
}: {
  title: string;
  icon: ElementType;
  rules: string[];
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
        <Icon className="h-4 w-4 text-accent" />
        {title}
      </h3>
      <ul className="space-y-2">
        {rules.map((rule) => (
          <li key={rule} className="flex gap-2 text-sm leading-relaxed text-muted">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <span>{rule}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StartQuestions() {
  const questions = [
    "Một việc nào đang làm bạn thành nút thắt?",
    "Bạn viết được phần kiểm tra chưa?",
    "Mục tiêu đã rõ đến mức đo được chưa?",
    "Việc có đến theo lịch hoặc theo sự kiện không?",
  ];

  return (
    <div className="rounded-xl border border-blue-300 bg-blue-50 p-4 text-foreground dark:border-blue-800 dark:bg-blue-900/20">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <TimerReset className="h-4 w-4 text-foreground" />
        Bắt đầu từ một việc thật
      </h3>
      <ul className="space-y-2 text-sm leading-relaxed text-foreground">
        {questions.map((question) => (
          <li key={question} className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-700 dark:bg-blue-300" />
            <span>{question}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AiAgentLoopsTopic() {
  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Cùng dùng một AI agent, vì sao có người chỉ giao việc một câu rồi agent tự chạy đến khi xong, còn bạn phải nhắc từng bước một?"
          options={[
            "Vì họ mua gói AI đắt hơn, model mạnh hơn nên tự biết phải làm gì",
            "Vì họ định nghĩa điều kiện dừng, thay vì ra lệnh từng bước",
            "Vì họ viết prompt dài và chi tiết hơn nhiều lần",
          ]}
          correct={1}
          explanation="Khác biệt nằm ở vòng lặp: agent, tức tác nhân AI, lặp lại chu kỳ làm việc cho đến khi điều kiện dừng được đáp ứng."
        >
          <p className="mt-2 text-sm leading-relaxed text-muted">
            <strong>Vòng lặp</strong> là cách để một agent lặp lại công việc đến
            khi gặp điều kiện dừng. Chu kỳ lõi là: thu thập ngữ cảnh, hành động,
            tự kiểm tra, lặp nếu cần, rồi trả lời.
          </p>
        </PredictionGate>
      </LessonSection>

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <div className="space-y-5">
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-base font-semibold text-foreground">
                <Workflow className="h-4 w-4 text-accent" />
                Nối phần bạn giao với kiểu vòng lặp
              </h3>
              <p className="mb-3 text-sm leading-relaxed text-muted">
                Một bạn làm marketing muốn AI tóm tắt tin nhắn Slack mỗi sáng.
                Bấm một mục ở cột A rồi bấm kiểu vòng lặp phù hợp ở cột B.
              </p>
              <MatchPairs
                instruction="Nối phần bạn giao cho agent với kiểu vòng lặp đúng."
                pairs={summaryPairs}
              />
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Bốn kiểu">
        <div className="space-y-5">
          <p>
            Có bốn cách giao việc cho agent tự lặp. Chúng khác nhau ở thứ kích
            hoạt vòng lặp, điều kiện dừng, primitive, tức công cụ điều khiển, và
            loại việc phù hợp.
          </p>
          <LoopTypeGrid />
          <Callout variant="info" title="Lưu ý sản phẩm">
            `/goal` cần Claude Code bản mới, v2.1.139 trở lên. Model đánh giá
            của `/goal` chỉ đọc hội thoại, không tự chạy lệnh, nên điều kiện
            phải chứng minh được trong nội dung agent trả ra. `/schedule` và
            routines đang ở giai đoạn research preview, tức bản dùng thử nghiên
            cứu, và khả dụng tùy gói tài khoản.
          </Callout>
        </div>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Vòng lặp lõi">
        <div className="space-y-5">
          <AgenticLoopReveal />
          <Callout variant="insight" title="Model đánh giá không thay bạn đoán">
            Với `/goal`, mỗi lần agent định dừng, một model đánh giá sẽ kiểm tra
            điều kiện. Nếu chưa đạt, agent bị gửi quay lại làm tiếp. Vì vậy tiêu
            chí đo đếm được như số test đạt hoặc điểm số hiệu quả hơn tiêu chí
            cảm tính.
          </Callout>
          <AhaMoment>
            Thứ bạn giao cho agent không phải là từng bước làm. Thứ bạn giao là{" "}
            <strong>điều kiện dừng</strong>.
          </AhaMoment>
        </div>
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Chọn công cụ">
        <InlineChallenge
          question="Bạn muốn AI tóm tắt kênh Slack của nhóm vào 8 giờ mỗi sáng, kể cả khi bạn chưa mở máy. Chọn kiểu vòng lặp nào?"
          options={[
            "Theo lượt",
            "Theo mục tiêu",
            "Theo lịch bằng `/loop` trên máy bạn",
            "Theo lịch bằng `/schedule` trên cloud",
          ]}
          correct={3}
          explanation="Đúng là `/schedule` trên cloud. `/loop` chạy trên máy bạn, nên tắt máy là vòng lặp dừng. Routine trên cloud chạy độc lập theo lịch cho đến khi bạn tắt hoặc việc hoàn tất."
        />
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Quy tắc">
        <ExplanationSection topicSlug={metadata.slug}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <RuleGroup
              title="Giữ chất lượng"
              icon={ShieldCheck}
              rules={qualityRules}
            />
            <RuleGroup
              title="Quản lý token"
              icon={Gauge}
              rules={tokenRules}
            />
          </div>
          <Callout variant="tip" title="Bắt đầu bằng cách đơn giản nhất">
            Không phải việc nào cũng cần vòng lặp phức tạp. Hãy bắt đầu bằng
            primitive đơn giản nhất, dùng có chọn lọc, rồi tăng mức tự động hóa
            khi bạn đã thấy nó dừng đúng chỗ.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Liên hệ">
        <div className="space-y-5">
          <MiniSummary
            title="Bốn kiểu vòng lặp cần nhớ"
            points={[
              "Theo lượt: bạn giao phần kiểm tra. Dùng khi bạn đang khám phá hoặc cân nhắc. Công cụ là skill kiểm tra tự viết.",
              "Theo mục tiêu: bạn giao điều kiện dừng. Dùng khi bạn biết rõ xong nghĩa là gì. Công cụ là /goal.",
              "Theo lịch: bạn giao thời điểm chạy. Dùng khi việc diễn ra theo lịch hoặc ở hệ thống ngoài. Công cụ là /loop hoặc /schedule.",
              "Chủ động: bạn giao toàn bộ đề bài. Dùng khi việc lặp lại và được định nghĩa rõ. Công cụ là /schedule, /goal, skills và dynamic workflows, tức quy trình sinh theo tình huống.",
            ]}
          />
          <StartQuestions />
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Layers className="h-4 w-4 text-accent" />
              Học tiếp theo nhánh agent
            </h3>
            <p className="text-sm leading-relaxed text-muted">
              Nếu bạn muốn thấy agent nằm trong quy trình nhiều bước, xem{" "}
              <TopicLink slug="agentic-workflows">
                Agentic workflow: giao việc cho AI chạy nhiều bước
              </TopicLink>
              . Nếu bạn dùng AI trong code hằng ngày, xem{" "}
              <TopicLink slug="ai-coding-assistants">
                AI coding assistants
              </TopicLink>
              . Nếu bạn mới bắt đầu, quay về{" "}
              <TopicLink slug="getting-started-with-ai">
                hướng dẫn bắt đầu với AI
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
