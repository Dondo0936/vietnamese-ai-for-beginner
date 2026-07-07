"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  Eye,
  FileText,
  ListChecks,
  MessageSquare,
  PenLine,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  Callout,
  MiniSummary,
  LessonSection,
  TopicLink,
  ToggleCompare,
  MatchPairs,
  StepReveal,
} from "@/components/interactive";
import { MetricReadout } from "@/components/interactive/MetricReadout";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "ai-for-social-media",
  title: "AI for Social Media",
  titleVi: "AI đăng bài nhiều kênh: một nội dung, năm nền tảng",
  description:
    "Dùng AI biến một nội dung thành năm bản đăng riêng cho Facebook, Threads, X, YouTube và LinkedIn. Kèm quy trình kiểm tra giúp bắt bài đăng lỗi ngay cả khi hệ thống báo thành công.",
  category: "applied-ai",
  tags: ["social-media", "automation", "practical", "office", "workflow"],
  difficulty: "beginner",
  relatedSlugs: ["ai-for-writing", "ai-for-paperwork", "getting-started-with-ai"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

const matchPairs = [
  {
    left: "Link (đường dẫn) nằm ngay trong caption",
    right: "Facebook giảm tiếp cận, nên link để ở bình luận đầu tiên",
  },
  {
    left: "Bài dài vượt giới hạn chữ",
    right: "X cắt chữ hoặc buộc tách thành nhiều đoạn",
  },
  {
    left: "Chuỗi nhiều đoạn, mỗi đoạn giữ một ý",
    right: "Threads và X hợp với dạng thread",
  },
  {
    left: "Video có hình, giọng hoặc cảnh do AI tạo",
    right: "YouTube cần bật khai báo nội dung tổng hợp bằng AI",
  },
];

const platformRules = [
  {
    platform: "Facebook",
    icon: MessageSquare,
    rule:
      "Caption không chứa link. Link để ở bình luận đầu tiên. Caption kết bằng một dòng như: link ở bình luận đầu tiên.",
  },
  {
    platform: "Threads và X",
    icon: PenLine,
    rule:
      "Viết dạng thread, tức chuỗi nhiều đoạn. Link chỉ nằm ở đoạn cuối cùng, không rải link vào từng đoạn.",
  },
  {
    platform: "LinkedIn",
    icon: FileText,
    rule:
      "Link để thẳng trong caption. Nền tảng này không phạt bài chỉ vì caption có link.",
  },
  {
    platform: "YouTube",
    icon: Eye,
    rule:
      "Tiêu đề và mô tả là hai trường riêng. Nếu video có nội dung do AI tạo, bật synthetic media disclosure, tức khai báo nội dung tổng hợp bằng AI.",
  },
];

const pipelineSteps = [
  {
    title: "Soạn bản riêng cho từng kênh",
    detail:
      "Một nội dung gốc được tách thành năm bản đăng: Facebook, Threads, X, YouTube và LinkedIn. Mỗi bản theo luật riêng của nền tảng đó.",
  },
  {
    title: "Cổng kiểm tra",
    detail:
      "QA gate, tức bộ kiểm tra tự động, chặn các lỗi thấy được: Facebook có link trong caption, thiếu file video, thiếu mô tả YouTube, hoặc bài vượt giới hạn chữ.",
  },
  {
    title: "Chạy thử",
    detail:
      "Dry run, tức chạy giả lập không đăng thật, in ra lệnh sẽ chạy và dữ liệu sẽ gửi đi. Bước này giúp bạn kiểm trước khi động vào tài khoản thật.",
  },
  {
    title: "Người duyệt",
    detail:
      "Một người mở bản nháp, đọc từng kênh và quyết định có cho đăng thật hay không. Đây là chốt kiểm soát cuối trước khi bài ra ngoài.",
  },
  {
    title: "Đăng thật",
    detail:
      "Chỉ chạy lệnh thật khi có phê duyệt mới cho đúng nội dung, đúng ngày, đúng phiên làm việc. Không dùng phê duyệt cũ cho bài mới.",
  },
  {
    title: "Đọc lại bản đã lưu",
    detail:
      "Sau khi hệ thống báo thành công, phải đọc lại bài mà nền tảng đã lưu và so với ý định ban đầu: số đoạn, chữ, link, video, giờ đăng.",
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "Vì sao không để link trong caption Facebook?",
    options: [
      "Vì bài có link trong caption bị giảm tiếp cận; link để ở bình luận đầu tiên",
      "Vì Facebook không cho người dùng bấm link",
      "Vì mọi link trên Facebook đều bị xóa tự động",
      "Vì caption Facebook chỉ được viết một câu",
    ],
    correct: 0,
    explanation:
      "Facebook thường giảm tiếp cận với bài có link ngay trong caption. Cách an toàn hơn là để link ở bình luận đầu tiên và nhắc rõ trong caption.",
  },
  {
    question: 'API báo "đăng thành công" nghĩa là gì?',
    options: [
      "Bài đã chắc chắn đúng từng chữ, đủ video và đủ đoạn",
      "Chỉ là lệnh đã được nhận; muốn chắc phải đọc lại bản nền tảng đã lưu",
      "Người duyệt đã mở giao diện và xác nhận",
      "Bài đã có lượt xem đầu tiên",
    ],
    correct: 1,
    explanation:
      "API, tức cổng giao tiếp giữa các phần mềm, có thể nhận lệnh thành công nhưng nền tảng vẫn lưu thiếu đoạn, thiếu video hoặc sửa cấu trúc. Đọc lại bản đã lưu mới là kiểm chứng.",
  },
  {
    question: "Chế độ tự động không giám sát được phép làm gì?",
    options: [
      "Tự đăng nếu bài chỉ có một nền tảng",
      "Soạn bài, kiểm tra, chạy thử, rồi dừng chờ người duyệt. Không tự đăng",
      "Tự đăng nếu API trả về thành công trong lần chạy thử",
      "Bỏ qua người duyệt khi đã có lịch đăng hằng ngày",
    ],
    correct: 1,
    explanation:
      "Tự động không giám sát chỉ nên chuẩn bị đến trạng thái chờ duyệt. Đăng thật cần người duyệt mới cho bài cụ thể.",
  },
  {
    question: "Dùng một caption cho cả năm nền tảng thì sai ở đâu?",
    options: [
      "Sai vì mỗi nền tảng có luật riêng; phải soạn bản riêng cho từng kênh",
      "Sai vì AI không viết được tiếng Việt cho mạng xã hội",
      "Sai vì Facebook, Threads và X dùng chung một giới hạn chữ",
      "Sai vì LinkedIn không cho đăng bài có link",
    ],
    correct: 0,
    explanation:
      "Một caption chung bỏ qua luật riêng của từng nơi: Facebook tránh link trong caption, Threads và X cần thread, LinkedIn giữ link, YouTube tách tiêu đề và mô tả.",
  },
];

function PlatformRuleGrid() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-3">
          <MetricReadout
            label="Nội dung gốc"
            value={1}
            valueClassName="font-mono text-lg font-bold text-foreground"
          />
        </div>
        <div className="rounded-xl border border-border bg-surface p-3">
          <MetricReadout
            label="Nền tảng"
            value={5}
            valueClassName="font-mono text-lg font-bold text-foreground"
          />
        </div>
        <div className="rounded-xl border border-border bg-surface p-3">
          <MetricReadout
            label="Caption cần soạn"
            value={5}
            valueClassName="font-mono text-lg font-bold text-foreground"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {platformRules.map((rule, index) => {
          const Icon = rule.icon;
          return (
            <motion.div
              key={rule.platform}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.25 }}
              className="rounded-xl border border-border bg-card p-4"
            >
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Icon className="h-4 w-4 text-accent" />
                {rule.platform}
              </h3>
              <p className="text-sm leading-relaxed text-muted">{rule.rule}</p>
            </motion.div>
          );
        })}
      </div>

      <Callout variant="insight" title="Một nội dung, năm bản đăng riêng">
        Không bao giờ dùng chung một caption. Phần ý tưởng có thể giống nhau,
        nhưng cách đóng gói phải đổi theo luật của từng nền tảng.
      </Callout>
    </div>
  );
}

function PlatformDraftCompare() {
  const sharedCaption = (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-foreground dark:border-amber-700 dark:bg-amber-900/20">
      <p className="mb-2 flex items-center gap-2 font-semibold">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" />
        Một caption dùng cho mọi nơi
      </p>
      <p className="leading-relaxed">
        Quán cà phê của bạn có menu mùa hè mới. Xem chi tiết tại
        https://example.com/menu. Video do AI dựng minh họa hạt cà phê và ly
        bạc xỉu. Ghé fanpage để đặt bàn hôm nay.
      </p>
      <p className="mt-3 text-xs text-foreground">
        Facebook có link trong caption. X có thể quá dài. YouTube chưa tách
        tiêu đề và mô tả. Threads chưa thành thread.
      </p>
    </div>
  );

  const separatedCaptions = (
    <div className="space-y-2 text-sm">
      {[
        "Facebook: Menu mùa hè đã có trên fanpage quán. Link ở bình luận đầu tiên.",
        "Threads/X: Đoạn 1 nêu món mới, đoạn 2 kể câu chuyện, đoạn cuối mới đặt link.",
        "LinkedIn: Câu chuyện vận hành quán và link đặt bàn nằm ngay trong caption.",
        "YouTube: Tiêu đề riêng, mô tả riêng, bật khai báo nội dung tổng hợp bằng AI.",
      ].map((line) => (
        <p
          key={line}
          className="flex items-start gap-2 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-foreground dark:border-emerald-800 dark:bg-emerald-900/20"
        >
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
          <span>{line}</span>
        </p>
      ))}
    </div>
  );

  return (
    <ToggleCompare
      labelA="Một caption"
      labelB="Năm bản riêng"
      description="Bật qua lại để thấy cùng một ý tưởng được đóng gói khác nhau."
      childA={sharedCaption}
      childB={separatedCaptions}
    />
  );
}

function PipelineReveal() {
  return (
    <StepReveal labels={pipelineSteps.map((step) => step.title)}>
      {pipelineSteps.map((step, index) => (
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

function StoredPostCheck() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Eye className="h-4 w-4 text-accent" />
        Đọc lại bản nền tảng đã lưu
      </h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-foreground dark:border-red-800 dark:bg-red-900/20">
          <p className="mb-1 flex items-center gap-2 font-semibold">
            <ShieldAlert className="h-4 w-4 text-red-700 dark:text-red-400" />
            Chỉ tin phản hồi tạo bài
          </p>
          <p className="text-foreground">
            Hệ thống báo thành công, nhưng bạn chưa biết bài có đủ đoạn, đủ
            video, đúng giờ và đúng caption hay chưa.
          </p>
        </div>
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-foreground dark:border-emerald-800 dark:bg-emerald-900/20">
          <p className="mb-1 flex items-center gap-2 font-semibold">
            <Check className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
            So với bản định đăng
          </p>
          <p className="text-foreground">
            Đọc lại bản đã lưu, đếm số đoạn, mở video đính kèm, kiểm link, kiểm
            giờ đăng và so từng trường với ý định ban đầu.
          </p>
        </div>
      </div>
    </div>
  );
}

function AgentBoundary() {
  const rows = [
    {
      label: "Được làm",
      icon: Check,
      text:
        "AI agent, tức tác nhân AI như Claude Code, có thể soạn bài, chạy cổng kiểm tra, chạy thử và chuẩn bị báo cáo cho người duyệt.",
    },
    {
      label: "Phải dừng",
      icon: AlertTriangle,
      text:
        "Khi đến bước đăng thật, agent phải DỪNG chờ người duyệt. Chế độ tự động không giám sát chỉ được chuẩn bị đến trạng thái chờ duyệt.",
    },
    {
      label: "Lý do",
      icon: ShieldAlert,
      text:
        "Một ngày không đăng thì bù được, một bài đăng hỏng thì không rút lại được. Vì vậy quyền đăng thật không giao cho lịch chạy tự động.",
    },
  ];

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const Icon = row.icon;
        return (
          <div
            key={row.label}
            className="rounded-xl border border-border bg-card p-4"
          >
            <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Icon className="h-4 w-4 text-accent" />
              {row.label}
            </p>
            <p className="text-sm leading-relaxed text-muted">{row.text}</p>
          </div>
        );
      })}
    </div>
  );
}

export default function AiForSocialMediaTopic() {
  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn viết một caption (chú thích bài đăng) thật ưng ý rồi đăng nguyên văn lên năm mạng xã hội. Vì sao trên Facebook bài lại ít người thấy, còn trên X chữ bị cắt mất một nửa?"
          options={[
            "Vì AI viết dở nên mọi nền tảng đều hiểu sai",
            "Vì mỗi nền tảng có luật phân phối và giới hạn chữ riêng",
            "Vì đăng cùng giờ trên nhiều nơi luôn bị chặn",
          ]}
          correct={1}
          explanation="Cùng một ý tưởng nhưng mỗi nền tảng đọc caption theo cách khác nhau. Facebook nhạy với link trong caption, X có giới hạn chữ, Threads hợp với chuỗi ngắn, YouTube lại tách tiêu đề và mô tả."
        >
          <p className="mt-2 text-sm text-muted">
            Bài này không dạy bạn viết nhiều hơn. Bài này dạy bạn biến một nội
            dung thành năm bản đăng đúng luật, rồi kiểm lại để không bị hệ thống
            báo thành công trong khi bài thật bị thiếu.
          </p>
        </PredictionGate>
      </LessonSection>

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-base font-semibold text-foreground">
                <ListChecks className="h-4 w-4 text-accent" />
                Nối đặc điểm caption với nền tảng dễ lỗi
              </h3>
              <p className="mb-3 text-sm leading-relaxed text-muted">
                Bấm một mục ở cột A rồi bấm lỗi tương ứng ở cột B. Đây là bốn
                lỗi phổ biến khi một shop Shopee bán phụ kiện dùng cùng một bài
                cho mọi kênh.
              </p>
              <MatchPairs
                instruction="Nối từng đặc điểm với nền tảng hoặc luật cần nhớ."
                pairs={matchPairs}
              />
            </div>

            <PlatformDraftCompare />
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Luật từng kênh">
        <ExplanationSection topicSlug={metadata.slug}>
          <p>
            Cốt lõi của đăng bài nhiều kênh là <strong>một nội dung, năm bản
            đăng riêng</strong>. Bạn có thể giữ cùng ý chính, cùng video, cùng
            link đích, nhưng caption và trường dữ liệu phải đổi theo từng nơi.
          </p>
          <PlatformRuleGrid />
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Quy trình">
        <div className="space-y-5">
          <PipelineReveal />

          <Callout variant="warning" title="Câu chuyện cần nhớ">
            Chúng tôi lên lịch một chuỗi bài qua scheduler, tức công cụ lên
            lịch. API, tức cổng giao tiếp giữa các phần mềm, báo thành công.
            Nhưng công cụ đã lặng lẽ bỏ đoạn mở đầu: định đăng 4 đoạn, chỉ lưu
            3. Video cũng không được đính kèm, chỉ nằm ở mục gợi ý. Lỗi này chỉ
            được phát hiện khi một người mở giao diện soạn thảo lên xem.
          </Callout>

          <AhaMoment>
            Máy báo <strong>&ldquo;đã đăng thành công&rdquo;</strong> không có
            nghĩa bài đăng đúng như bạn muốn. Muốn chắc, phải đọc lại bản mà
            nền tảng đã lưu và so với bản bạn định đăng.
          </AhaMoment>

          <StoredPostCheck />
        </div>
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <FileText className="h-4 w-4 text-accent" />
              Caption Facebook cần kiểm
            </p>
            <p className="rounded-lg bg-surface p-3 text-sm leading-relaxed text-foreground">
              Shop phụ kiện vừa có bộ dây đeo điện thoại mới. Xem mẫu và đặt
              hàng tại https://example.com/day-deo. Freeship cho 50 đơn đầu
              tiên trong hôm nay.
            </p>
          </div>
          <InlineChallenge
            question="Caption này vi phạm luật Facebook ở đâu?"
            options={[
              "Có link ngay trong caption; link nên để ở bình luận đầu tiên",
              "Có chữ shop nên Facebook không cho hiển thị",
              "Có ưu đãi freeship nên phải chuyển sang YouTube",
              "Caption quá ngắn nên X sẽ cắt mất chữ",
            ]}
            correct={0}
            explanation="Với Facebook, lỗi chính là đặt link ngay trong caption. Bản sửa nên bỏ link khỏi caption, thêm câu link ở bình luận đầu tiên, rồi chuẩn bị bình luận chứa link."
          />
        </div>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Agent">
        <div className="space-y-4">
          <p>
            Khi nối quy trình này với AI agent như Claude Code, bạn không giao
            cho máy quyền đăng thay bạn. Bạn giao phần lặp lại: soạn năm bản
            đăng, chạy cổng kiểm tra, chạy thử, gom lỗi và trình bản chờ duyệt.
          </p>
          <AgentBoundary />
          <Callout variant="info" title="Ranh giới vận hành">
            Chế độ chạy tự động không giám sát chỉ được chuẩn bị và dừng ở
            trạng thái chờ duyệt, không bao giờ tự đăng. Khi không chắc, hệ
            thống phải dừng và để lại báo cáo rõ ràng thay vì đoán.
          </Callout>
        </div>
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Liên hệ">
        <MiniSummary
          title="Những điều cần nhớ khi dùng AI đăng bài nhiều kênh"
          points={[
            "Không dùng một caption cho năm nền tảng. Mỗi nơi có luật riêng về link, độ dài, thread, tiêu đề, mô tả và khai báo nội dung AI.",
            "Cổng kiểm tra và chạy thử giúp bắt lỗi trước khi đăng thật, nhưng chưa thay được người duyệt.",
            "API báo thành công chỉ chứng minh lệnh đã được nhận. Đọc lại bản nền tảng đã lưu mới chứng minh bài đúng.",
            "Tự động không giám sát chỉ chuẩn bị đến chờ duyệt. Quyền đăng thật cần người duyệt mới cho từng bài.",
          ]}
        />

        <div className="mt-4 rounded-xl border border-border bg-card p-5 space-y-2">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-accent" />
            Học tiếp theo quy trình
          </h4>
          <p className="text-sm leading-relaxed text-muted">
            Trước khi phân phối, bạn cần viết nội dung gốc rõ ý. Xem{" "}
            <TopicLink slug="ai-for-writing">
              AI hỗ trợ viết email, báo cáo, slide
            </TopicLink>
            . Nếu công việc của bạn thiên về biểu mẫu và phê duyệt nội bộ, xem{" "}
            <TopicLink slug="ai-for-paperwork">
              AI điền form và giấy tờ
            </TopicLink>
            . Nếu bạn mới bắt đầu, quay về{" "}
            <TopicLink slug="getting-started-with-ai">
              hướng dẫn bắt đầu với AI
            </TopicLink>
            .
          </p>
          <p className="text-sm leading-relaxed text-muted">
            Quy trình này cũng có bản đóng gói thành một agent skill, tức bộ kỹ
            năng đóng gói cho tác nhân AI, dành cho người muốn dùng sẵn trong
            vận hành thật.
          </p>
        </div>
      </LessonSection>

      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
