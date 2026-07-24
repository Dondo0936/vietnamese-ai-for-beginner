"use client";

import { type ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Coffee,
  Copy,
  FileCheck2,
  FileText,
  ListChecks,
  MousePointerClick,
  Search,
  ShieldCheck,
  Table2,
  Terminal,
  Users,
} from "lucide-react";
import {
  AhaMoment,
  Callout,
  InlineChallenge,
  LessonSection,
  MiniSummary,
  PredictionGate,
  TopicLink,
} from "@/components/interactive";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import VisualizationSection from "@/components/topic/VisualizationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "claude-code-word",
  title: "Claude Code + Word",
  titleVi: "Điền hàng loạt báo giá Word bằng Claude Code",
  description:
    "Claude Code dùng Python điền một mẫu báo giá Word từ danh sách 20 khách và xuất mỗi khách một file riêng. Lần chạy đầu vấp hai lỗi ẩn của Word (chỗ đánh dấu bị cắt mảnh, chữ trong bảng nằm ở nhánh riêng), rồi chẩn đúng bệnh, sửa và nghiệm thu ngay trong Word 2019 thường.",
  category: "applied-ai",
  tags: ["claude-code", "word", "python-docx", "automation", "mail-merge"],
  difficulty: "intermediate",
  relatedSlugs: ["claude-code-excel", "claude-code-apps-script", "ai-for-writing"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

const GIAO_VIEC = `Trong thư mục bao-gia có mẫu mau-bao-gia.docx và danh sách khach-hang.csv gồm 20 khách hàng.

1. Việc cần làm: với mỗi khách trong danh sách, điền dữ liệu vào mẫu báo giá rồi xuất ra một file .docx riêng trong thư mục xuat.

2. Dữ liệu đầu vào: mẫu Word có sẵn các chỗ đánh dấu như {TEN_KHACH}, {CHUC_VU}, {CONG_TY}, và một bảng hàng hóa chứa {SAN_PHAM}, {SO_LUONG}, {DON_GIA}, {THANH_TIEN}. Danh sách khách là bảng CSV, mỗi dòng một khách với đủ các cột tương ứng.

3. Ràng buộc: chỉ đọc file mẫu và danh sách, không sửa chúng. Dùng Python trong .venv có sẵn của thư mục này.

4. Nghiệm thu: mở ngẫu nhiên 2 trong 20 file xuất ra bằng Word 2019, kiểm tên khách đã đúng chưa và lấy Số lượng nhân Đơn giá xem có bằng Thành tiền không. In ra tổng giá trị của cả 20 báo giá.`;

const PERMISSION_TRANSCRIPT = `Bash command

  ls bao-gia && .venv/bin/python -c "import docx, csv"
  Kiểm tra thư mục và thư viện đọc/ghi file Word

This command requires approval

Do you want to proceed?
❯ 1. Yes
  2. Yes, and don't ask again
  3. No

Sau khi được duyệt, Claude Code không viết code ngay mà đọc thử cấu trúc mẫu: có bao nhiêu đoạn văn, chỗ đánh dấu nào nằm trong bảng, chỗ nào nằm ở phần thân trang.`;

const LOI_OUTPUT = `bao-gia-01 (lần chạy đầu, chưa đúng):

  Kính gửi: Bà {TEN_KHACH}          ← chưa được thay
  Chức vụ: Trưởng phòng Hành chính   ← đã thay đúng
  Địa chỉ: 45 Nguyễn Đình Chiểu...   ← đã thay đúng

  Bảng hàng hóa:
  {SAN_PHAM} | {SO_LUONG} | {DON_VI} | {DON_GIA} | {THANH_TIEN}   ← cả bảng còn trơ`;

const NGHIEM_THU_TRANSCRIPT = `Đã xuất 20 file vào thư mục xuat. Tổng giá trị 20 báo giá: 67.455.000 đ.

Mở ngẫu nhiên 2 file bằng Word 2019 để nghiệm thu:
- bao-gia-01 (Bà Nguyễn Thị Thu Hà, Sao La): 12 túi x 320.000 = 3.840.000 đ. Khớp.
- bao-gia-11 (Ông Ngô Văn Tài, Kim Chỉ Vàng): 25 túi x 240.000 = 6.000.000 đ. Khớp.

File mẫu mau-bao-gia.docx và danh sách khach-hang.csv không bị thay đổi.`;

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "Vì sao tên khách {TEN_KHACH} không được thay, trong khi Chức vụ và Địa chỉ ngay bên dưới lại thay đúng?",
    options: [
      "Vì Word 2019 không đọc được tiếng Việt có dấu",
      "Vì Word âm thầm cắt {TEN_KHACH} thành nhiều mảnh chữ rời, nên cách thay theo từng mảnh không khớp cả cụm",
      "Vì tên khách quá dài",
      "Vì dòng Kính gửi được in đậm",
    ],
    correct: 1,
    explanation:
      "Bên trong, Word có thể lưu một chỗ đánh dấu thành nhiều mảnh (run). Chức vụ và Địa chỉ nằm gọn trong một mảnh nên thay được; {TEN_KHACH} bị cắt đôi nên cách thay từng mảnh bỏ sót.",
  },
  {
    question: "Vì sao cả bảng hàng hóa bị bỏ trống ở lần chạy đầu?",
    options: [
      "Vì bảng không có dữ liệu trong file CSV",
      "Vì đoạn chương trình chỉ duyệt phần thân trang, mà chữ trong bảng nằm ở một nhánh riêng",
      "Vì Word khóa các ô trong bảng",
      "Vì thiếu quyền ghi file",
    ],
    correct: 1,
    explanation:
      "Chữ trong bảng của Word không được lưu chung với phần thân trang. Nếu chỉ duyệt phần thân, chương trình không nhìn thấy các ô trong bảng.",
  },
  {
    question: "Cách sửa đúng cho lỗi chỗ đánh dấu bị cắt thành nhiều mảnh là gì?",
    options: [
      "Xóa mẫu và gõ lại từ đầu",
      "Gộp toàn bộ chữ của cả đoạn văn rồi mới thay, thay vì dò từng mảnh",
      "Đổi phông chữ của mẫu",
      "Lưu mẫu sang định dạng cũ hơn",
    ],
    correct: 1,
    explanation:
      "Thay ở cấp cả đoạn văn: gộp text của các mảnh lại rồi thay một lần. Dù Word cắt bao nhiêu mảnh, cả cụm vẫn khớp.",
  },
  {
    question: "Một khách trong danh sách bị bỏ trống ô chức vụ. Claude Code xử lý thế nào?",
    options: [
      "Bịa ra một chức vụ cho hợp lý",
      "Để nguyên chữ {CHUC_VU} trong file gửi khách",
      "Điền một dấu gạch thay chỗ cho gọn, không bịa",
      "Bỏ qua cả khách đó",
    ],
    correct: 2,
    explanation:
      "Không đoán bừa và cũng không để lộ chỗ trống trơ trẽn. Điền một dấu gạch là cách một người làm giấy tờ có kinh nghiệm sẽ làm.",
  },
  {
    question: "Vì sao nên mở thử một file bị lỗi trước khi sửa, thay vì sửa mò?",
    options: [
      "Để tiết kiệm thời gian chạy lại",
      "Để chẩn đúng hai nguyên nhân ẩn của Word rồi mới sửa đúng chỗ",
      "Vì Word yêu cầu mở file trước khi sửa code",
      "Để in file ra giấy",
    ],
    correct: 1,
    explanation:
      "Mở đúng file lỗi cho thấy tên khách còn trơ chỗ đánh dấu và cả bảng còn trống. Từ đó chẩn ra hai đặc điểm ẩn của Word và sửa theo đúng hai hướng.",
  },
  {
    question: "Bước nghiệm thu đúng trong bài này gồm thao tác nào?",
    options: [
      "Chỉ nhìn thấy đủ 20 file là tin ngay",
      "Mở ngẫu nhiên vài file bằng Word 2019 thật, kiểm tên khách và nhân Số lượng với Đơn giá bằng tay",
      "Đếm số file trong thư mục",
      "Đổi tất cả file sang PDF",
    ],
    correct: 1,
    explanation:
      "Có đủ file chưa chắc đã đúng. Mở vài file bất kỳ và tự nhân lại một con số là cách kiểm tra rẻ mà chắc.",
  },
  {
    question: "\"Trộn thư mà không cần biết trộn thư\" nghĩa là gì trong bài này?",
    options: [
      "Phải học kỹ tính năng trộn thư của Word trước",
      "Mỗi khách được một file riêng đặt tên theo công ty, mà người chủ không phải học trộn thư",
      "Chỉ in được chung một file dài nhiều trang",
      "Chỉ làm được khi có Word 365",
    ],
    correct: 1,
    explanation:
      "Kết quả giống trộn thư nhưng mỗi khách là một file riêng, sẵn sàng gửi đi, và linh hoạt hơn khi cần đổi mẫu hay cách đặt tên file.",
  },
  {
    question: "Ràng buộc nào bảo vệ file mẫu và danh sách gốc?",
    options: [
      "Chỉ đọc file mẫu và danh sách, không được sửa chúng",
      "Không được tạo file mới",
      "Không được dùng Python",
      "Chỉ được xuất tối đa 5 file",
    ],
    correct: 0,
    explanation:
      "Claude Code chỉ đọc mẫu và danh sách, ghi kết quả sang các file mới trong thư mục xuat, rồi kiểm lại rằng hai file gốc không đổi.",
  },
];

export default function ClaudeCodeWordTopic() {
  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Thử đoán">
        <PredictionGate
          question="Bạn đưa AI một mẫu báo giá Word và danh sách 20 khách, bảo điền tự động. Lần chạy đầu tiên, điều gì xảy ra?"
          options={[
            "Xong ngay, cả 20 file đều đúng",
            "AI từ chối vì không mở được file Word",
            "Tên khách và cả bảng hàng hóa bị bỏ trống, vì hai đặc điểm ẩn của Word",
            "Chỉ có file đầu tiên được điền đúng",
          ]}
          correct={2}
          explanation="Word âm thầm cắt một chỗ đánh dấu thành nhiều mảnh nên tên khách không thay được, và chữ trong bảng nằm ở một nhánh riêng nên cả bảng trơ. Sửa đúng hai chỗ đó mới ra 20 file sạch."
        >
          <DataTable
            label="Hai lần chạy"
            columns={["Lần chạy", "Kết quả", "Vì sao"]}
            rows={[
              ["Ngây thơ (thay từng mảnh, chỉ duyệt phần thân)", "Tên khách trơ, bảng trống", "Bỏ sót chỗ đánh dấu bị cắt mảnh và các ô trong bảng"],
              ["Sau khi sửa (thay cả đoạn, duyệt cả bảng)", "20 file sạch, tổng 67.455.000 đ", "Gộp cả đoạn văn rồi thay, và duyệt thêm từng ô trong bảng"],
            ]}
          />
        </PredictionGate>
      </LessonSection>

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Góc nhìn">
        <div className="space-y-5 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-light">
              <Coffee className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Hai mươi báo giá của Don Coffee</h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                Quán cần gửi báo giá cà phê văn phòng cho 20 khách hàng, mỗi bản một tên, một công ty, một đơn hàng riêng. Làm tay là chép mẫu ra, sửa khoảng 12 chỗ, rồi lặp lại 20 lần. Chủ quán không biết Python, chỉ muốn 20 file sẵn sàng gửi đi, mở được ngay trên Word đang dùng.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {[
              ["Đầu vào", "Một mẫu báo giá Word có sẵn các chỗ đánh dấu, và một danh sách 20 khách trong bảng CSV."],
              ["Điều chủ quán cần", "Mỗi khách một file .docx riêng, đặt tên theo công ty, sẵn sàng gửi đi."],
              ["Điều chủ quán giữ", "Quyền duyệt từng lệnh, file mẫu chỉ đọc, và mở bằng Word 2019 thật để nghiệm thu."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-xl border border-border bg-surface p-4">
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="mt-2 text-xs leading-relaxed text-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection topicSlug="claude-code-word">
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-foreground">Vì sao lần chạy đầu lại sai?</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                Điền chỗ đánh dấu trong Word nghe rất đơn giản, nhưng có hai đặc điểm ẩn khiến cách làm ngây thơ vấp ngã. Cả hai đều không nhìn thấy được bằng mắt khi mở file.
              </p>
            </div>

            <DataTable
              label="Hai lỗi ẩn của Word"
              columns={["Lỗi", "Nguyên nhân ẩn", "Cách sửa"]}
              rows={[
                ["Tên khách {TEN_KHACH} không được thay", "Word cắt một chỗ đánh dấu thành nhiều mảnh chữ rời bên trong", "Gộp text cả đoạn văn rồi mới thay, không dò từng mảnh"],
                ["Cả bảng hàng hóa bị bỏ trống", "Chữ trong bảng nằm ở một nhánh riêng, không thuộc phần thân trang", "Duyệt thêm từng hàng, từng ô bên trong bảng"],
              ]}
              note={
                <span>
                  Điểm chung: cả hai đều <strong>vô hình khi mở file</strong>. Phải mở đúng một file lỗi và đọc kỹ mới chẩn ra.
                </span>
              }
            />

            <Callout variant="insight" title="Cùng một mẫu, có chỗ thay được có chỗ không">
              Ở file lỗi, Chức vụ và Địa chỉ được thay đúng vì chúng nằm gọn trong một mảnh. Chỉ {"{TEN_KHACH}"} bị cắt đôi và cả bảng bị bỏ qua. Chính sự khác biệt đó là manh mối chẩn bệnh.
            </Callout>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <div className="space-y-5">
          <TerminalBlock label="Đề bài thật gửi cho Claude Code" content={GIAO_VIEC} />

          <AhaMoment>
            Điều biến một lần chạy hỏng thành bài học là <strong>chẩn bệnh trước khi sửa</strong>. Claude Code không sửa mò mà mở đúng một file lỗi ra đọc, chỉ thẳng ra hai đặc điểm ẩn của Word, rồi mới sửa theo đúng hai hướng.
          </AhaMoment>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                <Copy className="h-4 w-4 text-accent" />
                <p className="text-sm font-semibold text-foreground">Chỗ đánh dấu bị cắt mảnh</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-foreground">Word có thể lưu {"{TEN_KHACH}"} thành nhiều mảnh chữ rời. Dò từng mảnh sẽ không khớp cả cụm, nên phải thay ở cấp đoạn văn.</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                <Table2 className="h-4 w-4 text-accent" />
                <p className="text-sm font-semibold text-foreground">Chữ trong bảng ở nhánh riêng</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-foreground">Các ô trong bảng không nằm chung với phần thân trang. Phải duyệt riêng từng ô thì mới điền được bảng hàng hóa.</p>
            </div>
          </div>
        </div>
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Trong file lỗi, Chức vụ và Địa chỉ thay đúng nhưng tên khách {TEN_KHACH} vẫn trơ. Nguyên nhân hợp lý nhất là gì?"
          options={[
            "Tên khách trong CSV bị bỏ trống",
            "Word đã cắt {TEN_KHACH} thành nhiều mảnh, nên cách thay từng mảnh không khớp cả cụm",
            "Dòng Kính gửi bị khóa chỉnh sửa",
            "Phông chữ của tên khách khác phần còn lại",
          ]}
          correct={1}
          explanation="Chức vụ và Địa chỉ nằm gọn trong một mảnh nên thay được. {TEN_KHACH} bị Word cắt đôi bên trong, nên phải gộp cả đoạn văn rồi mới thay."
        />

        <div className="mt-6">
          <InlineChallenge
            question="Bảng hàng hóa vẫn còn nguyên các chỗ đánh dấu như {SAN_PHAM}, {THANH_TIEN}. Cách sửa đúng là gì?"
            options={[
              "Xóa bảng và gõ tay từng dòng",
              "Chuyển bảng thành hình ảnh",
              "Duyệt thêm từng hàng, từng ô trong bảng chứ không chỉ phần thân trang",
              "Đổi tên các chỗ đánh dấu trong bảng",
            ]}
            correct={2}
            explanation="Chữ trong bảng nằm ở một nhánh riêng. Chỉ khi duyệt cả các ô trong bảng thì các chỗ đánh dấu ở đó mới được thay."
          />
        </div>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Hiểu sâu hơn">
        <ExplanationSection topicSlug="claude-code-word">
          <div>
            <h3 className="mb-3 text-base font-semibold text-foreground">1. Xin phép trước, đọc mẫu trước</h3>
            <TerminalBlock label="Claude Code ở chế độ duyệt thủ công" content={PERMISSION_TRANSCRIPT} />
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-600 bg-amber-500/10 p-4 text-sm leading-relaxed text-foreground dark:bg-amber-500/15">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-800 dark:text-amber-200" />
              <p>AI không viết code ngay. Nó đọc thử cấu trúc mẫu trước, vì viết quy tắc thay chỗ đánh dấu mà chưa nhìn cách Word lưu chúng rất dễ bỏ sót.</p>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <h3 className="text-base font-semibold text-foreground">2. Lần chạy đầu bị sai, và nhìn ra sai ở đâu</h3>
            <TerminalBlock label="Một file lỗi được mở ra để đọc" content={LOI_OUTPUT} />
            <p className="text-sm leading-relaxed text-foreground">
              Sai đúng hai chỗ, đúng như hai đặc điểm ẩn ở trên: dòng kính gửi còn trơ chỗ đánh dấu, và cả bảng hàng hóa chưa có số nào. Các dòng nằm gọn trong một mảnh như Chức vụ, Địa chỉ thì đã thay đúng.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <h3 className="text-base font-semibold text-foreground">3. Sửa theo đúng hai hướng</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[
                { icon: Copy, title: "Thay ở cấp đoạn văn", body: "Gộp toàn bộ chữ của một đoạn lại rồi mới thay. Dù Word cắt chỗ đánh dấu thành mấy mảnh, cả cụm vẫn khớp." },
                { icon: Table2, title: "Duyệt cả bảng", body: "Đi qua từng hàng, từng ô trong bảng để các chỗ đánh dấu trong bảng hàng hóa cũng được thay." },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-xl border border-border bg-card p-4">
                    <Icon className="mb-2 h-4 w-4 text-accent" />
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="mt-2 text-xs leading-relaxed text-foreground">{item.body}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <h3 className="text-base font-semibold text-foreground">4. Hai mươi file sạch, kể cả trường hợp lắt léo</h3>
            <DataTable
              label="Vài báo giá trong số 20 (mỗi khách một file)"
              columns={["File", "Khách", "Đơn hàng", "Thành tiền"]}
              rows={[
                ["bao-gia-01", "Bà Nguyễn Thị Thu Hà — Sao La", "12 túi Arabica Cầu Đất x 320.000", "3.840.000 đ"],
                ["bao-gia-11", "Ông Ngô Văn Tài — Kim Chỉ Vàng", "25 túi Robusta x 240.000", "6.000.000 đ"],
                ["bao-gia-14", "Bà Mai Thị Thanh Tâm — Yoga An Nhiên", "12 hộp phin giấy x 135.000", "1.620.000 đ"],
                ["...", "18 khách còn lại", "mỗi khách một file riêng", "..."],
              ]}
              note={
                <span>
                  Tổng giá trị của cả 20 báo giá là <strong>67.455.000 đ</strong>.
                </span>
              }
            />
            <div className="flex items-start gap-2 rounded-xl border border-border bg-surface p-4 text-sm leading-relaxed text-foreground">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <p>Khách ở dòng 14 bị bỏ trống ô chức vụ. Claude Code không bịa một chức vụ, cũng không để lộ chỗ trống trơ trẽn, mà điền một dấu gạch cho gọn.</p>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <h3 className="text-base font-semibold text-foreground">5. Nghiệm thu bằng Word 2019 thật</h3>
            <TerminalBlock label="Kiểm lại chứ không tin ngay" content={NGHIEM_THU_TRANSCRIPT} />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <DataTable
                label="Hai file mở ngẫu nhiên để nghiệm thu"
                columns={["File", "Kiểm tra tay", "Kết quả"]}
                rows={[
                  ["bao-gia-01", "12 x 320.000", "3.840.000 đ, khớp"],
                  ["bao-gia-11", "25 x 240.000", "6.000.000 đ, khớp"],
                ]}
              />
              <div className="flex items-start gap-2 rounded-xl border border-emerald-600 bg-emerald-500/10 p-4 text-sm leading-relaxed text-foreground dark:bg-emerald-500/15">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-200" />
                <p>Mở đúng vài file bất kỳ và tự nhân lại một con số là cách kiểm rẻ mà chắc. File mẫu và danh sách gốc vẫn nguyên, không bị sửa.</p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="mb-3 text-base font-semibold text-foreground">6. Hai bẫy cần nhớ</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[
                ["Tin vào cách thay từng mảnh", "Chỗ đánh dấu có thể bị Word cắt thành nhiều mảnh mà mắt thường không thấy. Hãy thay ở cấp cả đoạn văn."],
                ["Quên rằng bảng nằm ở nhánh riêng", "Nếu báo giá, hợp đồng hay phiếu của bạn có bảng, phải dặn máy duyệt cả bảng chứ không chỉ phần thân trang."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-xl border border-amber-600 bg-amber-500/10 p-4 dark:bg-amber-500/15">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-800 dark:text-amber-200" />
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-foreground">{body}</p>
                </div>
              ))}
            </div>
          </div>

          <Callout variant="tip" title="Nền tảng để đi tiếp">
            Muốn xem AI dọn dữ liệu và làm báo cáo trong bảng tính, đọc{" "}
            <TopicLink slug="claude-code-excel">Claude Code với Excel</TopicLink>. Muốn dùng AI để soạn thảo nội dung, xem{" "}
            <TopicLink slug="ai-for-writing">viết bằng AI</TopicLink>.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Trộn thư mà không cần biết trộn thư"
          points={[
            "Giao việc gọn: một mẫu Word có chỗ đánh dấu, một danh sách khách, xuất mỗi người một file.",
            "Đọc từng lệnh rồi mới cho Claude Code chạy trên máy.",
            "Lần chạy đầu bị sai thì mở file lỗi để chẩn đúng bệnh, đừng sửa mò.",
            "Hai đặc điểm ẩn của Word: chỗ đánh dấu bị cắt mảnh, và chữ trong bảng nằm ở nhánh riêng.",
            "Nghiệm thu bằng cách mở vài file thật và tự nhân lại một con số.",
          ]}
        />

        <div className="mt-4 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <MousePointerClick className="h-4 w-4 text-accent" />
            <h4 className="text-sm font-semibold text-foreground">Thử với mẫu giấy tờ của bạn</h4>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground">
            Lấy một mẫu báo giá, hợp đồng hay phiếu giao hàng bạn hay dùng, đánh dấu các chỗ cần điền, chuẩn bị một danh sách khách trong bảng, rồi giao đúng khuôn: việc cần làm, đầu vào, ràng buộc chỉ đọc, và cách nghiệm thu.
          </p>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl border border-blue-600 bg-blue-500/10 p-4 text-sm leading-relaxed text-foreground dark:border-blue-500 dark:bg-blue-500/15">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-700 dark:text-blue-200" />
          <p>Bạn không cần Word 365 hay bản quyền đặc biệt cho vòng lặp này. Kết quả vẫn mở trong Word 2019 thường.</p>
        </div>
      </LessonSection>

      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ_QUESTIONS} />
      </LessonSection>
    </>
  );
}

function TerminalBlock({ label, content }: { label: string; content: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-700 bg-slate-900 px-4 py-2">
        <Terminal className="h-4 w-4 text-teal-200" />
        <span className="text-xs font-semibold text-slate-100">{label}</span>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-slate-100 whitespace-pre-wrap">
        {content}
      </pre>
    </div>
  );
}

function DataTable({
  label,
  columns,
  rows,
  note,
}: {
  label: string;
  columns: readonly string[];
  rows: readonly (readonly string[])[];
  note?: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border bg-surface px-4 py-3">
        <FileText className="h-4 w-4 text-accent" />
        <p className="text-sm font-semibold text-foreground">{label}</p>
      </div>
      <p className="border-b border-border px-4 py-2 text-xs text-foreground md:hidden">
        Vuốt ngang để xem đủ các cột.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-xs">
          <thead className="bg-surface">
            <tr>
              {columns.map((column) => (
                <th key={column} scope="col" className="border-b border-border px-4 py-3 font-semibold text-foreground">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[0]} className="border-b border-border last:border-b-0">
                {row.map((cell, cellIndex) => (
                  <td key={columns[cellIndex]} className="px-4 py-3 align-top leading-relaxed text-foreground">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note && <div className="border-t border-border px-4 py-3 text-xs leading-relaxed text-foreground">{note}</div>}
    </div>
  );
}
