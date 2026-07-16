"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  MessageSquare,
  PenLine,
  Send,
  ShieldCheck,
  Sparkles,
  Tags,
  Truck,
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
  slug: "ai-for-meeting-notes",
  title: "AI for Meeting Notes",
  titleVi: "AI viết biên bản họp trong 5 phút",
  description:
    "Biến bản ghi cuộc họp thô thành biên bản rõ ràng: quyết định chính và việc cần làm kèm người phụ trách.",
  category: "applied-ai",
  tags: ["meeting-notes", "summarization", "practical", "office"],
  difficulty: "beginner",
  relatedSlugs: ["ai-for-writing", "ai-for-customer-replies", "getting-started-with-ai"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

const MEETING_TRANSCRIPT = `Minh: Chào mọi người, mình bắt đầu họp tuần nhé. Đầu tiên là tình hình dự án website mới.
Lan: Bên em đã xong phần thiết kế trang chủ, dự kiến gửi bản demo cho anh Minh vào thứ Năm này.
Minh: Ok, còn phần backend thì sao Tuấn?
Tuấn: Backend em đang làm phần đăng nhập, hơi chậm hơn dự kiến vì phát sinh lỗi với API bên thứ ba. Em cần thêm 3 ngày nữa.
Minh: Được, vậy deadline chung dời sang thứ Ba tuần sau nhé. Tuấn nhớ báo sớm nếu vẫn chưa xong.
Lan: Anh Minh ơi, còn vụ ngân sách quảng cáo tháng này thì sao ạ?
Minh: Ngân sách được duyệt 50 triệu, tăng so với tháng trước 10 triệu. Chị Hà bên marketing sẽ gửi kế hoạch chi tiết trước thứ Sáu.
Hà: Dạ vâng, em sẽ tập trung chạy quảng cáo trên Facebook và TikTok, có thể thử thêm Google Ads nếu ngân sách còn dư.
Minh: Tốt. Việc tiếp theo là phỏng vấn ứng viên vị trí designer, ai phụ trách nhỉ?
Lan: Em phụ trách, đã hẹn 2 ứng viên vào thứ Tư tuần sau, buổi sáng và buổi chiều.
Minh: Ok nhớ mời thêm Tuấn ngồi phỏng vấn cùng để đánh giá kỹ năng phối hợp code nhé.
Tuấn: Dạ được ạ.
Minh: Cuối cùng, tuần sau công ty có buổi team building, mọi người sắp xếp công việc để tham gia đầy đủ nhé. Cảm ơn mọi người, họp đến đây thôi.`;

const REAL_REPLY_A = `Được. Vui lòng tải lên nội dung cuộc họp, có thể là:
- File âm thanh (MP3, M4A, WAV...)
- File video (MP4, MOV...)
- Bản ghi (transcript) dạng TXT, DOCX, PDF hoặc dán trực tiếp vào khung chat
Sau khi có nội dung, tôi có thể tóm tắt theo nhiều cách, ví dụ:
- Tóm tắt ngắn (5-10 gạch đầu dòng): các ý chính của cuộc họp.
- Tóm tắt chi tiết: theo từng chủ đề được thảo luận.
- Quyết định đã thống nhất: những kết luận cuối cùng.
- Danh sách việc cần làm (Action Items): ai làm gì, thời hạn khi nào (nếu có đề cập).
- Các vấn đề còn tồn đọng: những nội dung cần theo dõi hoặc họp tiếp.
Hãy tải lên file hoặc dán nội dung cuộc họp, tôi sẽ bắt đầu tóm tắt.`;

const REAL_REPLY_B = `Biên bản họp tuần

Quyết định chính
- Hoàn tất thiết kế trang chủ website mới và gửi bản demo cho anh Minh vào thứ Năm.
- Điều chỉnh deadline chung của dự án website mới sang thứ Ba tuần sau do phần backend phát sinh lỗi với API bên thứ ba.
- Ngân sách quảng cáo tháng này được duyệt 50 triệu đồng, tăng 10 triệu đồng so với tháng trước.
- Kế hoạch quảng cáo tập trung vào Facebook và TikTok; có thể thử thêm Google Ads nếu còn ngân sách.
- Lan phụ trách phỏng vấn ứng viên vị trí designer; Tuấn tham gia phỏng vấn để đánh giá khả năng phối hợp giữa thiết kế và kỹ thuật.
- Toàn team sắp xếp công việc để tham gia đầy đủ buổi team building tuần sau.

Việc cần làm
| Việc cần làm | Người phụ trách | Hạn chót |
| Gửi bản demo thiết kế trang chủ website mới cho anh Minh | Lan | Thứ Năm |
| Hoàn thành phần backend đăng nhập và cập nhật tiến độ nếu có vấn đề | Tuấn | Thứ Ba tuần sau |
| Gửi kế hoạch chi tiết cho chiến dịch quảng cáo tháng này | Hà | Thứ Sáu |
| Phỏng vấn 2 ứng viên vị trí designer | Lan | Thứ Tư tuần sau (sáng và chiều) |
| Tham gia phỏng vấn designer để đánh giá kỹ năng phối hợp code | Tuấn | Thứ Tư tuần sau |
| Sắp xếp công việc để tham gia team building | Toàn team | Tuần sau |`;

const DECISIONS = [
  "Hoàn tất thiết kế trang chủ website mới và gửi bản demo cho anh Minh vào thứ Năm.",
  "Điều chỉnh deadline chung của dự án website mới sang thứ Ba tuần sau do phần backend phát sinh lỗi với API bên thứ ba.",
  "Ngân sách quảng cáo tháng này được duyệt 50 triệu đồng, tăng 10 triệu đồng so với tháng trước.",
  "Kế hoạch quảng cáo tập trung vào Facebook và TikTok; có thể thử thêm Google Ads nếu còn ngân sách.",
  "Lan phụ trách phỏng vấn ứng viên vị trí designer; Tuấn tham gia phỏng vấn để đánh giá khả năng phối hợp giữa thiết kế và kỹ thuật.",
  "Toàn team sắp xếp công việc để tham gia đầy đủ buổi team building tuần sau.",
];

const ACTION_ITEMS = [
  {
    task: "Gửi bản demo thiết kế trang chủ website mới cho anh Minh",
    owner: "Lan",
    due: "Thứ Năm",
  },
  {
    task: "Hoàn thành phần backend đăng nhập và cập nhật tiến độ nếu có vấn đề",
    owner: "Tuấn",
    due: "Thứ Ba tuần sau",
  },
  {
    task: "Gửi kế hoạch chi tiết cho chiến dịch quảng cáo tháng này",
    owner: "Hà",
    due: "Thứ Sáu",
  },
  {
    task: "Phỏng vấn 2 ứng viên vị trí designer",
    owner: "Lan",
    due: "Thứ Tư tuần sau (sáng và chiều)",
  },
  {
    task: "Tham gia phỏng vấn designer để đánh giá kỹ năng phối hợp code",
    owner: "Tuấn",
    due: "Thứ Tư tuần sau",
  },
  {
    task: "Sắp xếp công việc để tham gia team building",
    owner: "Toàn team",
    due: "Tuần sau",
  },
];

type MeetingType = "weekly" | "client" | "oneOnOne";
type MinutesLength = "short" | "full";

const MEETING_TYPES: { key: MeetingType; label: string; icon: React.ElementType }[] = [
  { key: "weekly", label: "Họp tuần team", icon: Clock },
  { key: "client", label: "Họp với khách hàng", icon: MessageSquare },
  { key: "oneOnOne", label: "Họp 1-1 với sếp", icon: ShieldCheck },
];

const LENGTHS: { key: MinutesLength; label: string }[] = [
  { key: "short", label: "Ngắn gọn" },
  { key: "full", label: "Đầy đủ" },
];

const MINUTES_BANK: Record<MeetingType, Record<MinutesLength, string>> = {
  weekly: {
    short:
      "Quyết định: dời deadline dự án sang thứ Ba tuần sau. Việc cần làm: Lan gửi demo trang chủ thứ Năm, Tuấn hoàn tất đăng nhập, Hà gửi kế hoạch quảng cáo thứ Sáu.",
    full:
      "Biên bản họp tuần: dự án website dời deadline sang thứ Ba tuần sau vì backend cần thêm thời gian. Lan gửi demo trang chủ thứ Năm. Tuấn hoàn tất phần đăng nhập và báo sớm nếu còn lỗi. Hà gửi kế hoạch quảng cáo 50 triệu trước thứ Sáu. Toàn team sắp xếp tham gia team building tuần sau.",
  },
  client: {
    short:
      "Quyết định: gửi lại báo giá sau khi chỉnh phạm vi triển khai. Việc cần làm: sales cập nhật bảng giá, kỹ thuật xác nhận timeline, khách hàng phản hồi trong tuần này.",
    full:
      "Biên bản họp khách hàng: hai bên thống nhất giữ mục tiêu ra mắt trong tháng tới, nhưng cần chỉnh phạm vi giai đoạn 1. Team sales gửi báo giá mới trong 24 giờ. Team kỹ thuật xác nhận timeline chi tiết. Khách hàng phản hồi danh sách tính năng ưu tiên trước thứ Sáu.",
  },
  oneOnOne: {
    short:
      "Quyết định: ưu tiên hoàn thành báo cáo tháng trước khi nhận thêm việc mới. Việc cần làm: nhân sự gửi bản nháp thứ Năm, sếp phản hồi trước cuối ngày thứ Sáu.",
    full:
      "Biên bản họp 1-1: hai bên thống nhất ưu tiên báo cáo tháng và giảm bớt việc ad hoc trong tuần này. Nhân sự gửi bản nháp báo cáo vào thứ Năm. Sếp phản hồi vào thứ Sáu và hỗ trợ gỡ vướng nếu cần dữ liệu từ phòng khác.",
  },
};

const GALLERY_CASES = [
  {
    label: "Họp dự án",
    icon: FileText,
    scenario:
      "Team rà soát tiến độ, chốt deadline mới và chia lại việc cho thiết kế, backend, marketing.",
    output:
      "Quyết định: deadline dự án dời sang thứ Ba tuần sau. Việc cần làm: Lan gửi demo thứ Năm, Tuấn hoàn tất đăng nhập, Hà gửi kế hoạch quảng cáo trước thứ Sáu.",
  },
  {
    label: "Họp bán hàng",
    icon: Tags,
    scenario:
      "Sales và vận hành xem lại chỉ tiêu tháng, các deal lớn và lý do khách chưa chốt.",
    output:
      "Quyết định: ưu tiên 3 khách hàng có khả năng chốt cao. Việc cần làm: sales gửi đề xuất mới, vận hành xác nhận ngày giao, quản lý kiểm tra chiết khấu trước khi gửi.",
  },
  {
    label: "Họp 1-1 đánh giá",
    icon: ShieldCheck,
    scenario:
      "Nhân viên và quản lý trao đổi về kết quả tháng, điểm cần cải thiện và hỗ trợ cần có.",
    output:
      "Quyết định: tập trung cải thiện tốc độ phản hồi khách. Việc cần làm: nhân viên cập nhật checklist mỗi ngày, quản lý xem lại vào thứ Sáu và hỗ trợ xử lý các khách khó.",
  },
  {
    label: "Họp khách hàng",
    icon: MessageSquare,
    scenario:
      "Khách hàng phản hồi bản demo, yêu cầu chỉnh phạm vi và hỏi lại thời gian bàn giao.",
    output:
      "Quyết định: giữ phạm vi giai đoạn 1 ở các tính năng cốt lõi. Việc cần làm: team sản phẩm gửi bản chỉnh sửa, kỹ thuật cập nhật timeline, khách xác nhận trước cuối tuần.",
  },
  {
    label: "Họp khẩn",
    icon: AlertTriangle,
    scenario:
      "Team xử lý lỗi hệ thống vừa phát sinh, cần chia người điều tra, thông báo và theo dõi.",
    output:
      "Quyết định: ưu tiên khôi phục dịch vụ trước, phân tích nguyên nhân sau. Việc cần làm: kỹ thuật xử lý lỗi, CSKH gửi thông báo, quản lý cập nhật trạng thái mỗi 30 phút.",
  },
];

const PROMPT_TEMPLATES = [
  {
    title: "A. Biên bản họp tuần",
    icon: FileText,
    body: "Bạn là trợ lý hành chính. Từ bản ghi cuộc họp tuần dưới đây, viết biên bản gồm 2 phần: quyết định chính và việc cần làm. Với mỗi việc, ghi người phụ trách và hạn chót nếu có. Nếu chưa có hạn chót, ghi Chưa xác định. Giọng ngắn gọn, rõ ràng. Bản ghi: [dán transcript].",
  },
  {
    title: "B. Biên bản họp khách hàng",
    icon: MessageSquare,
    body: "Bạn là thư ký cuộc họp với khách hàng. Tóm tắt bản ghi sau thành: mục tiêu buổi họp, quyết định đã thống nhất, việc cần làm của mỗi bên, điểm còn chờ xác nhận. Không thêm thông tin ngoài bản ghi. Bản ghi: [dán transcript].",
  },
  {
    title: "C. Tóm tắt nhanh 5 dòng",
    icon: Sparkles,
    body: "Tóm tắt cuộc họp sau trong đúng 5 dòng cho người bận. Chỉ giữ quyết định, rủi ro và việc cần làm quan trọng. Không viết lời mở đầu dài. Bản ghi: [dán transcript].",
  },
  {
    title: "D. Việc cần làm kèm người phụ trách",
    icon: CheckCircle2,
    body: "Đọc bản ghi cuộc họp sau và trích riêng danh sách việc cần làm. Mỗi dòng gồm: việc cần làm, người phụ trách, hạn chót, bằng chứng ngắn trong bản ghi. Nếu thiếu người hoặc hạn chót, ghi Chưa xác định. Bản ghi: [dán transcript].",
  },
];

function TextBox({
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

  return (
    <div className={`rounded-lg border p-4 ${toneClass}`}>
      <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${labelClass}`}>
        {label}
      </p>
      <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
        {text}
      </p>
    </div>
  );
}

function MinutesReplyBox() {
  return (
    <div className="rounded-lg border border-emerald-600 bg-emerald-50/70 p-4 dark:border-emerald-600 dark:bg-emerald-900/20">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-emerald-900 dark:text-emerald-200">
        Biên bản đầy đủ, có người phụ trách
      </p>
      <div className="space-y-4 text-sm leading-relaxed text-foreground">
        <div>
          <h4 className="text-base font-semibold text-foreground">
            Biên bản họp tuần
          </h4>
        </div>
        <div>
          <p className="mb-2 font-semibold text-foreground">Quyết định chính</p>
          <ul className="list-disc space-y-1 pl-5">
            {DECISIONS.map((decision) => (
              <li key={decision}>{decision}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 font-semibold text-foreground">Việc cần làm</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pr-3 font-semibold text-foreground">
                    Việc cần làm
                  </th>
                  <th className="py-2 pr-3 font-semibold text-foreground">
                    Người phụ trách
                  </th>
                  <th className="py-2 font-semibold text-foreground">Hạn chót</th>
                </tr>
              </thead>
              <tbody>
                {ACTION_ITEMS.map((item) => (
                  <tr key={`${item.task}-${item.owner}`} className="border-b border-border/70">
                    <td className="py-2 pr-3 text-foreground">{item.task}</td>
                    <td className="py-2 pr-3 text-foreground">{item.owner}</td>
                    <td className="py-2 text-foreground">{item.due}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function MeetingMinutesBuilderDemo() {
  const [meetingType, setMeetingType] = useState<MeetingType>("weekly");
  const [length, setLength] = useState<MinutesLength>("short");

  const output = useMemo(
    () => MINUTES_BANK[meetingType][length],
    [meetingType, length]
  );

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          1. Chọn loại cuộc họp
        </p>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          {MEETING_TYPES.map((item) => {
            const Icon = item.icon;
            const selected = meetingType === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setMeetingType(item.key)}
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
          2. Chọn độ dài biên bản
        </p>
        <div className="grid grid-cols-2 gap-2">
          {LENGTHS.map((item) => {
            const selected = length === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setLength(item.key)}
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
          key={`${meetingType}-${length}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="rounded-xl border border-border bg-surface p-4"
        >
          <div className="mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4 text-accent" />
            <p className="text-sm font-semibold text-foreground">
              Bản nháp để bạn kiểm lại rồi gửi
            </p>
          </div>
          <p className="text-sm leading-relaxed text-foreground">{output}</p>
        </motion.div>
      </div>
    </div>
  );
}

function MeetingUseCaseGalleryDemo() {
  return (
    <TabView
      tabs={GALLERY_CASES.map((item) => {
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
                  Mẫu biên bản ngắn
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

export default function AiForMeetingNotesTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          "Bạn chỉ gõ cho AI: 'Tóm tắt giúp tôi cuộc họp này' nhưng không dán bản ghi. Điều gì còn thiếu?",
        options: [
          "Tên phần mềm họp",
          "Bản ghi thật của cuộc họp, vì AI không tự biết nội dung đã nói",
          "Một câu chào dài hơn",
          "Logo công ty trong prompt",
        ],
        correct: 1,
        explanation:
          "AI cần bản ghi, file âm thanh hoặc ghi chú thật. Không có dữ liệu cuộc họp, nó chỉ có thể hỏi lại hoặc viết rất chung.",
      },
      {
        question: "Bẫy nguy hiểm nhất khi viết biên bản bằng AI là gì?",
        options: [
          "Biên bản có quá ít màu sắc",
          "AI bịa nội dung hoặc đoán điều cuộc họp không hề nói",
          "AI dùng tiêu đề quá ngắn",
          "Biên bản không có emoji",
        ],
        correct: 1,
        explanation:
          "Biên bản là tài liệu giao việc. Nếu AI thêm điều không có trong bản ghi, cả team có thể làm sai hướng.",
      },
      {
        question: "Một biên bản họp thực dụng nên có cấu trúc nào?",
        options: [
          "Lời mở đầu dài, cảm nghĩ cá nhân, lời kết trang trọng",
          "Quyết định chính và việc cần làm kèm người phụ trách, hạn chót",
          "Toàn bộ transcript không cắt bớt",
          "Chỉ một đoạn văn chung chung",
        ],
        correct: 1,
        explanation:
          "Người đọc biên bản cần biết đã chốt gì, ai làm gì và hạn nào, không cần đọc lại toàn bộ cuộc họp.",
      },
      {
        type: "fill-blank",
        question:
          "Trước khi gửi biên bản AI soạn, luôn kiểm lại {blank}, tên người phụ trách và {blank}.",
        blanks: [
          { answer: "số liệu", accept: ["Số liệu", "so lieu", "số tiền", "so tien"] },
          { answer: "hạn chót", accept: ["Hạn chót", "han chot", "deadline", "Deadline"] },
        ],
        explanation:
          "Số liệu, chủ việc và deadline là những phần dễ gây hậu quả nhất nếu AI nghe nhầm hoặc suy đoán.",
      },
      {
        question: "Khi nào KHÔNG nên để AI tự soạn biên bản để gửi ngay?",
        options: [
          "Họp tuần thông thường có bản ghi rõ",
          "Họp có nội dung bảo mật cao, pháp lý hoặc tranh chấp cần ghi chính xác từng lời",
          "Họp chia việc nội bộ ít rủi ro",
          "Họp brainstorming ý tưởng",
        ],
        correct: 1,
        explanation:
          "Các cuộc họp nhạy cảm cần kiểm soát chặt nội dung và cách diễn đạt. AI có thể hỗ trợ nháp, nhưng không nên tự gửi.",
      },
      {
        question:
          "Nếu cuộc họp không nói rõ hạn chót cho một việc, prompt tốt nên yêu cầu AI làm gì?",
        options: [
          "Tự đoán một ngày gần nhất",
          "Bỏ luôn việc đó khỏi biên bản",
          "Ghi Chưa xác định thay vì đoán",
          "Gán hạn cho người nói nhiều nhất",
        ],
        correct: 2,
        explanation:
          "Thiếu hạn chót là một dữ kiện cần được đánh dấu rõ. Đừng để AI biến suy đoán thành cam kết của team.",
      },
      {
        question:
          "Giá trị chính của AI trong biên bản họp là gì?",
        options: [
          "Thay bạn quyết định phần nào đúng sai",
          "Đọc hết bản ghi dài, tách quyết định và việc cần làm để bạn kiểm lại",
          "Tự gửi biên bản cho cả team",
          "Làm cuộc họp không cần người phụ trách",
        ],
        correct: 1,
        explanation:
          "AI mạnh ở việc đọc và sắp xếp. Người chịu trách nhiệm cuối cùng vẫn là bạn, nhất là với tên người, số liệu và deadline.",
      },
    ],
    []
  );

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Thử đoán">
        <PredictionGate
          question="Họp 1 tiếng xong, nếu phải tự viết biên bản từ ghi chú tay, thường mất bao lâu so với để AI đọc bản ghi và soạn sẵn?"
          options={[
            "Tự viết thường mất khoảng 20-30 phút, còn AI giúp bạn còn vài phút đọc lại và sửa",
            "Hai cách luôn mất thời gian như nhau vì biên bản nào cũng phải gõ tay",
            "AI có thể tự gửi ngay, bạn không cần đọc lại",
            "AI chỉ hữu ích nếu cuộc họp có hơn 50 người",
          ]}
          correct={0}
          explanation="Giá trị không phải là AI nhanh hơn bạn gõ. Giá trị là AI đọc hết bản ghi dài mà không bỏ sót, còn bạn chỉ cần kiểm lại quyết định, người phụ trách và hạn chót."
        >
          <p className="mt-4 text-sm text-muted">
            Biên bản tốt không phải bản tóm tắt hay nhất, mà là bản giúp cả
            team biết việc gì đã chốt và ai cần làm gì tiếp.
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
                AI viết biên bản giống một thư ký ngồi nghe cả cuộc họp.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                Thư ký này ghi lại không sót những gì được nói. Nhưng bạn vẫn
                là người quyết định phần nào quan trọng để đưa vào bản gửi cho
                team.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 pt-2 md:grid-cols-3">
            <div className="rounded-lg bg-surface p-3">
              <MessageSquare className="mb-1 h-5 w-5 text-accent" />
              <p className="text-sm font-semibold text-foreground">
                Cuộc họp diễn ra
              </p>
              <p className="text-xs text-muted">
                Mọi người nói quyết định, rủi ro và việc cần làm.
              </p>
            </div>
            <div className="rounded-lg bg-surface p-3">
              <Wand2 className="mb-1 h-5 w-5 text-accent" />
              <p className="text-sm font-semibold text-foreground">
                AI ghi lại có cấu trúc
              </p>
              <p className="text-xs text-muted">
                Tách nội dung thành quyết định và action items.
              </p>
            </div>
            <div className="rounded-lg bg-surface p-3">
              <ShieldCheck className="mb-1 h-5 w-5 text-accent" />
              <p className="text-sm font-semibold text-foreground">
                Bạn duyệt và gửi
              </p>
              <p className="text-xs text-muted">
                Kiểm tên người, số liệu, hạn chót rồi chia sẻ.
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
                Demo 1, cùng một cuộc họp
              </h3>
              <p className="mb-4 text-sm text-muted">
                Không có bản ghi, AI không tự bịa ra được nội dung cuộc họp.
              </p>
              <div className="mb-4">
                <TextBox
                  label="Bản ghi cuộc họp thật"
                  text={MEETING_TRANSCRIPT}
                />
              </div>
              <ToggleCompare
                labelA="AI hỏi lại vì chưa có nội dung"
                labelB="Biên bản đầy đủ, có người phụ trách"
                description="Một bên chỉ có yêu cầu mơ hồ, một bên có transcript thật và prompt rõ."
                childA={
                  <TextBox
                    label="Reply A thật"
                    text={REAL_REPLY_A}
                    tone="warn"
                  />
                }
                childB={<MinutesReplyBox />}
              />
              <span className="sr-only">{REAL_REPLY_B}</span>
            </div>

            <div>
              <h3 className="mb-1 text-base font-semibold text-foreground">
                Demo 2, chọn loại cuộc họp và độ dài biên bản
              </h3>
              <p className="mb-4 text-sm text-muted">
                Đây là công cụ luyện tập. Những câu dưới là mẫu tổng hợp, không
                phải transcript thật.
              </p>
              <MeetingMinutesBuilderDemo />
            </div>

            <div>
              <h3 className="mb-1 text-base font-semibold text-foreground">
                Demo 3, kho tình huống ghi chú họp
              </h3>
              <p className="mb-4 text-sm text-muted">
                Nhấp từng tab để xem một khuôn biên bản ngắn cho các tình huống
                văn phòng thường gặp.
              </p>
              <MeetingUseCaseGalleryDemo />
            </div>

            <Callout variant="tip" title="Ba quan sát khi thử các demo">
              <ol className="list-inside list-decimal space-y-1 text-sm">
                <li>Không có bản ghi thật, AI chỉ có thể hỏi lại hoặc viết chung chung.</li>
                <li>Cùng một bản ghi có thể ra bản ngắn hoặc đầy đủ tùy mục tiêu gửi.</li>
                <li>Biên bản hữu ích nhất khi tách rõ quyết định, việc cần làm, người phụ trách và hạn chót.</li>
              </ol>
            </Callout>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          Giá trị chính không phải AI gõ nhanh hơn bạn, mà AI đọc hết bản ghi
          dài không bỏ sót chi tiết, rồi tách đúng phần nào là quyết định, phần
          nào là việc cần làm. Bạn vẫn là người xác nhận số liệu, tên người và
          hạn chót trước khi gửi cho cả team.
        </AhaMoment>
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <div className="mb-6">
          <TextBox
            label="Reply A thật, khi người dùng hỏi quá mơ hồ"
            text={REAL_REPLY_A}
          />
        </div>

        <InlineChallenge
          question="Một câu mơ hồ như 'Tóm tắt giúp tôi cuộc họp này' nhưng không đính kèm gì đang thiếu gì?"
          options={[
            "Bản ghi thật của cuộc họp, vì AI không tự bịa nội dung",
            "Một câu yêu cầu bằng tiếng Anh",
            "Tên phòng họp",
            "Một lời cảm ơn ở cuối prompt",
          ]}
          correct={0}
          explanation="AI cần transcript, file ghi âm hoặc ghi chú thật. Nếu thiếu nội dung cuộc họp, nó không có dữ kiện để tóm tắt."
        />

        <div className="mt-6">
          <InlineChallenge
            question="Biên bản AI viết ghi sai hạn chót hoặc gán nhầm người phụ trách một việc. Cách xử lý đúng là gì?"
            options={[
              "Gửi luôn vì biên bản nhìn có cấu trúc",
              "Chỉ đổi sang giọng trang trọng hơn",
              "Luôn đối chiếu bản ghi gốc trước khi gửi biên bản cho cả team",
              "Xóa hết hạn chót để tránh phải kiểm",
            ]}
            correct={2}
            explanation="Biên bản sai owner hoặc deadline có thể làm cả team làm nhầm. AI soạn nháp, còn bạn phải kiểm sự thật trước khi gửi."
          />
        </div>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Hiểu sâu hơn">
        <ExplanationSection>
          <div>
            <h3 className="mb-3 text-base font-semibold text-foreground">
              Công cụ tóm tắt họp dân văn phòng có thể dùng
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[
                {
                  name: "ChatGPT bản miễn phí",
                  useFor: "Dán transcript thủ công, yêu cầu tóm tắt và đổi định dạng biên bản.",
                },
                {
                  name: "Tóm tắt tích hợp trong Zoom hoặc Google Meet",
                  useFor: "Ghi âm, ghi chú hoặc tạo bản tóm tắt ngay trong luồng họp.",
                },
                {
                  name: "Notion AI",
                  useFor: "Biến ghi chú họp thành trang biên bản, checklist và phần theo dõi.",
                },
                {
                  name: "Ứng dụng ghi âm chuyển văn bản tiếng Việt",
                  useFor: "Tạo transcript trước, sau đó đưa vào AI để soạn biên bản rõ hơn.",
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
              Vòng lặp 4 bước: họp, có bản ghi, AI soạn, bạn gửi
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              {[
                { label: "1. Họp diễn ra", desc: "Có người nói, chốt việc và nêu rủi ro.", icon: MessageSquare },
                { label: "2. Có bản ghi", desc: "Ghi âm, transcript hoặc ghi chú tay đủ tin cậy.", icon: FileText },
                { label: "3. AI soạn biên bản", desc: "Tách quyết định, việc cần làm và hạn chót.", icon: Wand2 },
                { label: "4. Bạn kiểm và gửi", desc: "Đối chiếu bản ghi rồi chia sẻ cho team.", icon: Send },
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
                  title: "AI bịa nội dung",
                  desc: "Bẫy nguy hiểm nhất: không có bản ghi thật nhưng AI vẫn viết như thể cuộc họp đã nói vậy.",
                  fix: "Luôn đưa transcript, file ghi âm hoặc ghi chú thật trước khi yêu cầu biên bản.",
                },
                {
                  title: "Gán nhầm người phụ trách",
                  desc: "Nếu bản ghi không rõ ai nói, AI có thể gán việc cho người nghe có vẻ liên quan nhất.",
                  fix: "Kiểm lại owner trong bản ghi gốc, nhất là các việc ảnh hưởng deadline.",
                },
                {
                  title: "Biên bản quá dài",
                  desc: "AI giữ hết chi tiết nhỏ khiến người nhận phải đọc lại gần như cả cuộc họp.",
                  fix: "Ghi rõ chỉ giữ quyết định và việc cần làm.",
                },
                {
                  title: "Quên hạn chót",
                  desc: "Cuộc họp không nói rõ deadline, AI có thể viết mơ hồ hoặc tự đoán.",
                  fix: "Yêu cầu ghi Chưa xác định thay vì để AI đoán.",
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
            Khung prompt này nối tiếp{" "}
            <TopicLink slug="ai-for-writing">bài AI hỗ trợ viết</TopicLink>{" "}
            và{" "}
            <TopicLink slug="ai-for-customer-replies">
              bài AI trả lời khách hàng
            </TopicLink>
            : vai trò, nhiệm vụ, bối cảnh, định dạng và giọng văn. Với biên
            bản họp, bối cảnh quan trọng nhất là bản ghi thật của cuộc họp.
          </Callout>

          <Callout variant="warning" title="Khi KHÔNG nên để AI tự soạn biên bản">
            Không nên để AI tự soạn và gửi ngay khi cuộc họp có nội dung bảo
            mật cao như lương, sa thải hoặc pháp lý, khi cuộc họp có tranh chấp
            cần ghi chính xác từng lời, hoặc khi không có bản ghi đầy đủ và đáng
            tin cậy.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ khi dùng AI viết biên bản họp"
          points={[
            "AI cần bản ghi thật của cuộc họp, không thể tự biết nội dung đã nói.",
            "Biên bản tốt nên tách quyết định chính và việc cần làm.",
            "Mỗi việc cần có người phụ trách và hạn chót nếu cuộc họp đã nói rõ.",
            "Nếu thiếu deadline hoặc owner, hãy ghi Chưa xác định thay vì để AI đoán.",
            "Luôn kiểm lại số liệu, tên người và hạn chót trước khi gửi cho team.",
            "Không dùng AI tự soạn gửi ngay cho các cuộc họp bảo mật, pháp lý hoặc tranh chấp.",
          ]}
        />

        <div className="mt-4 space-y-2 rounded-xl border border-border bg-card p-5">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            Khám phá thêm
          </h4>
          <p className="text-sm leading-relaxed text-muted">
            Muốn luyện bản giao việc rộng hơn? Xem{" "}
            <TopicLink slug="ai-for-writing">AI hỗ trợ viết</TopicLink>. Nếu
            làm việc với khách hàng hằng ngày, xem thêm{" "}
            <TopicLink slug="ai-for-customer-replies">
              AI trả lời tin nhắn khách hàng
            </TopicLink>
            .
          </p>
        </div>
      </LessonSection>

      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
