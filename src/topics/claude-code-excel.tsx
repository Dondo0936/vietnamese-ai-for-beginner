"use client";

import { type ReactNode } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Coffee,
  FileCheck2,
  FileSpreadsheet,
  ListChecks,
  MousePointerClick,
  Search,
  ShieldCheck,
  Terminal,
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
  slug: "claude-code-excel",
  title: "Claude Code + Excel",
  titleVi: "Dọn sổ bán hàng lộn xộn và làm báo cáo bằng Claude Code",
  description:
    "Claude Code đọc file Excel xuất từ máy POS, tự phát hiện dữ liệu bẩn (ngày 3 định dạng, tiền gõ chữ, dòng trùng), dọn sạch và xuất báo cáo doanh thu kèm biểu đồ ngay trong Excel 2019 thường, không cần Copilot.",
  category: "applied-ai",
  tags: ["claude-code", "excel", "openpyxl", "automation", "data-cleaning"],
  difficulty: "intermediate",
  relatedSlugs: ["claude-code-apps-script", "ai-for-data-analysis", "ai-coding-assistants"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

const GIAO_VIEC = `Trong thư mục sales có file ban-hang-thang-6-2026.xlsx xuất từ máy POS của quán.

1. Việc cần làm: đọc file này, dọn sạch dữ liệu và tạo báo cáo bao-cao-thang-6-2026.xlsx gồm: doanh thu theo từng ngày kèm biểu đồ cột, doanh thu theo món xếp từ cao xuống thấp, và một trang Kiểm tra liệt kê những vấn đề tìm thấy trong file gốc.

2. Dữ liệu đầu vào: cột Ngày có 3 kiểu định dạng khác nhau, một số ô tiền gõ dạng chữ như 25.000, có ô ngày bị gộp, có dòng Tổng tuần gõ tay chen giữa dữ liệu, ô SL bỏ trống nghĩa là 1 ly.

3. Nghi ngờ: máy POS có thể xuất trùng nguyên một ngày. Nếu gặp thì bỏ bản sao và ghi rõ vào trang Kiểm tra.

4. Ràng buộc: chỉ đọc file gốc, không được sửa nó. Dùng Python với openpyxl trong .venv có sẵn của thư mục này.

5. Nghiệm thu: in ra tổng doanh thu tháng và số dòng đã bỏ vì trùng, để tôi đối chiếu tay với vài ngày bất kỳ.`;

const PERMISSION_TRANSCRIPT = `Bash command

  ls sales && .venv/bin/python -c "import openpyxl"
  Kiểm tra file đầu vào và thư viện openpyxl

This command requires approval

Do you want to proceed?
❯ 1. Yes
  2. Yes, and don't ask again
  3. No

Sau khi được duyệt, Claude Code đọc thử dữ liệu. Helper đầu tiên tên inspect.py trùng tên module chuẩn của Python, nên nó dừng lại, đổi tên thành raw_dump.py rồi mới chạy tiếp:

  Rename shadowing script and dump raw POS file contents`;

const READ_BACK_TRANSCRIPT = `Đọc ngược file báo cáo vừa ghi để nghiệm thu, đối chiếu tổng ngày, tổng tuần và xác nhận file gốc không thay đổi.

Số nghiệm thu:
- Tổng doanh thu tháng 6/2026: 16.105.000 VND (592 ly, 348 giao dịch)
- Số dòng đã bỏ vì trùng: 15 - ngày 15/06/2026 bị POS xuất đôi, dòng 178-192 lặp lại y hệt dòng 163-177 (chỉ khác định dạng ô), trị giá bản sao 733.000 VND
- Ngoài ra loại 4 dòng "Tổng tuần" gõ tay (dòng 80, 162, 267, 345)

Vài ngày để anh/chị đối chiếu tay: 01/06 = 580.000 (12 dòng đầu, dòng 3-14), 15/06 = 733.000 (sau khi bỏ bản trùng), 22/06 = 835.000, 30/06 = 411.000. Bảng đủ 30 ngày nằm ở output phía trên và trong trang "Doanh thu theo ngày".`;

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
        <FileSpreadsheet className="h-4 w-4 text-accent" />
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

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "Vì sao phép SUM trực tiếp trên cột Thành tiền cho kết quả thấp hơn doanh thu thật?",
    options: [
      "Vì Excel 2019 không cộng được tiền Việt Nam",
      "Vì 63 ô tiền được gõ dạng chữ nên phép cộng bỏ qua chúng",
      "Vì báo cáo chỉ tính 28 ngày",
      "Vì mọi ô SL trống đều bị xóa",
    ],
    correct: 1,
    explanation: "Các ô như 25.000 đang là chữ. Cần bỏ dấu chấm phân cách và chuyển chúng thành số trước khi tính.",
  },
  {
    question: "Claude Code xử lý ô SL bỏ trống như thế nào?",
    options: [
      "Xóa cả giao dịch",
      "Đổi thành 0 ly",
      "Hiểu là 1 ly sau khi kiểm tra Thành tiền bằng Đơn giá",
      "Tự đoán theo món bán chạy nhất",
    ],
    correct: 2,
    explanation: "Đề bài nói rõ ô SL trống nghĩa là 1 ly, và dữ liệu tiền xác nhận quy tắc đó.",
  },
  {
    question: "Bằng chứng mạnh nhất rằng nửa sau của ngày 15 là bản sao là gì?",
    options: [
      "Hai nhóm có màu ô giống nhau",
      "Tên file có chữ trùng",
      "Bỏ 15 dòng lặp khiến tổng tuần gõ tay và tổng tính lại khớp tuyệt đối",
      "Ngày 15 có nhiều đơn hơn ngày 14",
    ],
    correct: 2,
    explanation: "Đối chiếu với sổ Tổng tuần độc lập biến nghi ngờ thành một kiểm tra có thể chứng minh.",
  },
  {
    question: "Vì sao tổng của bốn tuần chưa phải tổng cả tháng?",
    options: [
      "Vì tuần 3 bị thiếu dữ liệu",
      "Vì bốn tuần chỉ bao phủ ngày 01 đến 28, còn ngày 29 và 30",
      "Vì tháng 6 có 31 ngày",
      "Vì Excel bỏ qua cuối tuần",
    ],
    correct: 1,
    explanation: "Bốn nhóm bảy ngày chỉ bao phủ 28 ngày. Hai ngày cuối tháng phải được cộng riêng.",
  },
  {
    question: "Ràng buộc nào bảo vệ bảng bán hàng gốc?",
    options: [
      "Chỉ đọc file gốc, không được sửa nó",
      "Không được tạo file mới",
      "Không được dùng Python",
      "Chỉ chạy một lệnh duy nhất",
    ],
    correct: 0,
    explanation: "Claude Code viết báo cáo ra file mới, đặt helper ngoài repo và kiểm tra lại file gốc sau khi hoàn tất.",
  },
  {
    question: "Vì sao Claude Code đổi inspect.py thành raw_dump.py?",
    options: [
      "Để làm tên file ngắn hơn",
      "Vì inspect.py che khuất module inspect chuẩn của Python",
      "Vì Excel không mở được file tên inspect.py",
      "Vì người dùng từ chối quyền đọc",
    ],
    correct: 1,
    explanation: "Tên helper trùng module chuẩn có thể làm import sai. Đổi tên loại bỏ xung đột trước khi chạy.",
  },
  {
    question: "Nghiệm thu tốt trong bài này gồm thao tác nào?",
    options: [
      "Chỉ nhìn biểu đồ thấy hợp lý",
      "Tin thông báo tạo file thành công",
      "Đọc ngược file vừa ghi, đối chiếu tổng tuần và kiểm tra vài ngày bằng tay",
      "Đổi toàn bộ ô sang cùng một màu",
    ],
    correct: 2,
    explanation: "Một file mở được chưa đủ. Đọc ngược và đối chiếu bằng các mốc độc lập mới kiểm tra được kết quả.",
  },
  {
    question: "Vai trò của phần Nghi ngờ trong khuôn giao việc là gì?",
    options: [
      "Bảo AI bỏ qua dữ liệu lạ",
      "Nêu trước loại lỗi có thể xảy ra để AI chủ động tìm và chứng minh cách xử lý",
      "Thay thế hoàn toàn bước nghiệm thu",
      "Cho phép AI sửa file gốc",
    ],
    correct: 1,
    explanation: "Nghi ngờ hướng việc kiểm tra vào rủi ro thật, còn Nghiệm thu buộc kết quả phải đưa ra con số có thể đối chiếu.",
  },
];

export default function ClaudeCodeExcelTopic() {
  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Thử đoán">
        <PredictionGate
          question="Excel cộng ra gần 14 triệu từ file bán hàng tháng 6. Con số thật có thể là bao nhiêu?"
          options={[
            "Thấp hơn, vì mọi dòng trống đều phải xóa",
            "Đúng gần 14 triệu, vì SUM luôn đọc được mọi ô tiền",
            "Cao hơn, khoảng 16 triệu, vì có dữ liệu bị bỏ sót và trùng lặp",
            "Gấp đôi, vì mỗi giao dịch đều xuất hiện hai lần",
          ]}
          correct={2}
          explanation="Phép SUM bỏ qua tiền đang lưu dạng chữ, trong khi bản POS còn lẫn một ngày xuất đôi. Phải chuẩn hóa, loại bản sao có bằng chứng rồi mới cộng lại."
        >
          <DataTable
            label="Hai con số mở đầu"
            columns={["Cách tính", "Kết quả", "Vấn đề"]}
            rows={[
              ["SUM trên ô số", "14.090.000 đ", "Bỏ sót 63 ô tiền dạng chữ và vẫn tính ngày xuất đôi"],
              ["Báo cáo đã dọn", "16.105.000 đ", "Khớp sổ gốc sau chuẩn hóa và bỏ đúng bản sao"],
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
              <h2 className="text-base font-semibold text-foreground">Một tháng bán hàng của Don Coffee</h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                Chủ quán có Excel 2019 thường và một file xuất từ máy bán hàng (POS). Anh không biết Python, chỉ cần biết doanh thu thật và muốn nhận lại một báo cáo có thể mở ngay trên chiếc máy đang dùng.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {[
              ["File đầu vào", "Ngày viết ba kiểu, tiền có ô là chữ, ngày bị gộp và Tổng tuần chen giữa."],
              ["Điều chủ quán cần", "Doanh thu theo ngày có biểu đồ, doanh thu theo món và một trang Kiểm tra."],
              ["Điều chủ quán giữ", "Quyền duyệt từng lệnh, file gốc chỉ đọc và các con số đối chiếu bằng tay."],
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
        <VisualizationSection topicSlug="claude-code-excel">
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-foreground">Vì sao cộng thẳng lại sai?</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                Ba lỗi kéo con số theo hai hướng khác nhau: ô tiền dạng chữ bị phép cộng bỏ qua, ngày 15 xuất đôi làm tổng tăng, còn các dòng Tổng tuần là mốc kiểm tra chứ không phải giao dịch.
              </p>
            </div>

            <DataTable
              label="Ba lỗi làm phép cộng mù"
              columns={["Dấu hiệu", "Số lượng", "Cách xử lý"]}
              rows={[
                ["Thành tiền gõ dạng chữ", "63 ô", "Bỏ dấu chấm phân cách rồi chuyển thành số"],
                ["Ngày 15 xuất đôi", "15 dòng, 733.000 đ", "Bỏ nửa sau sau khi đối chiếu Tổng tuần"],
                ["Tổng tuần gõ tay", "4 dòng", "Loại khỏi giao dịch, giữ làm bằng chứng nghiệm thu"],
              ]}
              note={
                <span>
                  Kết quả đối chiếu: phép cộng mù là <strong>14.090.000 đ</strong>, báo cáo đúng là <strong>16.105.000 đ</strong>.
                </span>
              }
            />

            <Callout variant="insight" title="Dữ liệu bẩn không chỉ làm tổng thấp đi">
              Tiền dạng chữ làm thiếu doanh thu, nhưng ngày xuất đôi lại làm thừa. Vì vậy không thể sửa một loại lỗi rồi tin ngay vào tổng mới.
            </Callout>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <div className="space-y-5">
          <TerminalBlock label="Đề bài thật gửi cho Claude Code" content={GIAO_VIEC} />

          <AhaMoment>
            Hai phần biến một yêu cầu chung chung thành công việc có thể kiểm chứng là <strong>Nghi ngờ</strong> và <strong>Nghiệm thu</strong>. Nghi ngờ chỉ thẳng vào kiểu lỗi cần tìm. Nghiệm thu buộc AI trả ra số dòng đã bỏ và các mốc để chủ quán tự cộng lại.
          </AhaMoment>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-accent" />
                <p className="text-sm font-semibold text-foreground">Phần 3, Nghi ngờ</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-foreground">Nêu trước khả năng POS xuất trùng nguyên ngày để AI không chỉ chuẩn hóa định dạng rồi dừng.</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-accent" />
                <p className="text-sm font-semibold text-foreground">Phần 5, Nghiệm thu</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-foreground">Yêu cầu tổng tháng, số dòng trùng và vài ngày bất kỳ để người giao việc có thể kiểm tra độc lập.</p>
            </div>
          </div>
        </div>
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Một dòng bán Cà phê sữa có ô SL trống, nhưng Thành tiền đúng bằng Đơn giá. Claude Code nên làm gì?"
          options={[
            "Xóa dòng vì thiếu dữ liệu",
            "Hiểu SL là 1 ly theo quy tắc của chủ quán và giữ giao dịch",
            "Đặt SL thành 0",
            "Sao chép SL từ dòng phía trên",
          ]}
          correct={1}
          explanation="Trang Kiểm tra ghi nhận 15 ô SL trống. Tất cả đều có Thành tiền bằng một lần Đơn giá, nên chúng được hiểu là 1 ly."
        />

        <div className="mt-6">
          <InlineChallenge
            question="Hai đơn cùng giờ, cùng món và cùng SL trong một ngày có nên tự động xóa một đơn không?"
            options={[
              "Có, mọi dòng giống nhau đều là bản sao",
              "Không. Giữ nguyên nếu chưa có bằng chứng đó là lỗi xuất trùng",
              "Có, nhưng chỉ với Cà phê sữa",
              "Đổi cả hai đơn thành một đơn có SL gấp đôi",
            ]}
            correct={1}
            explanation="Hai cặp đơn như vậy được giữ nguyên vì có thể là các giao dịch riêng. Ngày 15 chỉ bị loại sau khi cả khối 15 dòng lặp lại và Tổng tuần chứng minh bản sao."
          />
        </div>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Hiểu sâu hơn">
        <ExplanationSection topicSlug="claude-code-excel">
          <div>
            <h3 className="mb-3 text-base font-semibold text-foreground">1. Xin phép trước từng lệnh</h3>
            <TerminalBlock label="Claude Code ở chế độ duyệt thủ công" content={PERMISSION_TRANSCRIPT} />
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-600 bg-amber-500/10 p-4 text-sm leading-relaxed text-foreground dark:bg-amber-500/15">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-800 dark:text-amber-200" />
              <p>AI không đụng máy khi chưa được gật đầu. Lần vấp tên file cũng được phát hiện và sửa trước khi helper chạy.</p>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="mb-3 text-base font-semibold text-foreground">2. Đọc, dọn và ghi ra file mới</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {[
                { icon: Search, title: "Đọc cấu trúc thật", body: "Xem giá trị thô, vùng ô gộp và kiểu dữ liệu trước khi viết quy tắc dọn." },
                { icon: ListChecks, title: "Dọn có nhật ký", body: "Chuẩn hóa ngày, tiền, SL và chỉ bỏ bản sao khi có bằng chứng đối chiếu." },
                { icon: FileCheck2, title: "Ghi báo cáo mới", body: "Tạo ba trang báo cáo, không ghi đè lên bảng bán hàng ban đầu." },
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
            <h3 className="text-base font-semibold text-foreground">3. Trang Kiểm tra kể lại toàn bộ việc đã làm</h3>
            <DataTable
              label="Khối tổng quan của trang Kiểm tra"
              columns={["Chỉ số", "Giá trị"]}
              rows={[
                ["Số dòng dữ liệu đọc được (dòng 3-369)", "367"],
                ["Dòng \"Tổng tuần\" gõ tay bị loại", "4"],
                ["Dòng bị bỏ vì POS xuất trùng nguyên ngày", "15"],
                ["Dòng giao dịch giữ lại", "348"],
                ["Tổng doanh thu tháng 6/2026 (VND)", "16.105.000"],
              ]}
            />

            <DataTable
              label="Tám vấn đề được ghi rõ"
              columns={["#", "Phát hiện", "Bằng chứng", "Xử lý"]}
              rows={[
                ["1", "Cột Ngày có 3 kiểu định dạng, đều là chữ", "'dd/mm/yyyy': 115 ô (từ dòng 3); 'd-m-yyyy': 49 ô (từ dòng 119); 'dd.mm.yyyy': 102 ô (từ dòng 259)", "Nhận diện cả 3 kiểu, chuẩn hóa về kiểu ngày chuẩn của Excel"],
                ["2", "Ô tiền gõ dạng chữ (vd '25.000')", "Đơn giá: 158 ô; Thành tiền: 63 ô", "Bỏ dấu chấm phân cách, chuyển thành số"],
                ["3", "Ô Ngày bị gộp, các dòng dưới bị trống", "7 vùng gộp: A163:A192, A193:A206, A207:A220, A221:A234, A235:A246, A247:A258, A259:A266 → 97 dòng trống cột Ngày", "Điền ngày của ô đầu vùng gộp xuống các dòng bên dưới"],
                ["4", "Dòng \"Tổng tuần\" gõ tay chen giữa dữ liệu", "'Tổng tuần 1' (dòng 80) = 3.348.000 VND; 'Tổng tuần 2' (dòng 162) = 3.629.000 VND; 'Tổng tuần 3' (dòng 267) = 4.336.000 VND; 'Tổng tuần 4' (dòng 345) = 3.681.000 VND", "Loại khỏi dữ liệu giao dịch; đối chiếu ở bảng bên dưới"],
                ["5", "Ô SL bỏ trống", "15 dòng: 33, 55, 61, 76, 81, 94, 101, 154, 164, 202, 248, 260, 273, 335, 358", "Hiểu là 1 ly (Thành tiền các dòng này đều bằng 1 x Đơn giá)"],
                ["6", "POS xuất trùng nguyên một ngày", "15/06/2026: 15 dòng (dòng 178-192) lặp lại y hệt 15 dòng đầu của ngày, trị giá 733.000 VND", "Bỏ bản sao (nửa sau), giữ bản ghi đầu tiên"],
                ["7", "Thành tiền ≠ SL x Đơn giá", "Không phát hiện", "Chỉ kiểm tra; không dòng nào phải sửa"],
                ["8", "Đơn hàng trùng giờ + món + SL trong cùng ngày (không phải lỗi)", "Dòng 29 & 30 (03/06, 15:30, Cà phê sữa); dòng 136 & 137 (12/06, 20:10, Cà phê sữa)", "Giữ nguyên, coi là các đơn riêng lẻ, không phải dữ liệu trùng"],
              ]}
              note="Ba kiểu ngày có 266 ô chứa ngày. Cộng 97 dòng trống do ô gộp và 4 dòng Tổng tuần thành đủ 367 dòng đã đọc."
            />
          </div>

          <div className="mt-8 space-y-4">
            <h3 className="text-base font-semibold text-foreground">4. Tổng tuần trở thành bằng chứng</h3>
            <DataTable
              label="Gõ tay so với tính lại"
              columns={["Khoảng ngày", "Gõ tay", "Tính lại", "Chênh lệch"]}
              rows={[
                ["Tuần 1 (01-07/6)", "3.348.000", "3.348.000", "0"],
                ["Tuần 2 (08-14/6)", "3.629.000", "3.629.000", "0"],
                ["Tuần 3 (15-21/6)", "4.336.000", "4.336.000", "0"],
                ["Tuần 4 (22-28/6)", "3.681.000", "3.681.000", "0"],
              ]}
              note={
                <span>
                  Bốn tuần chỉ phủ 28 ngày, không phải cả tháng. Tổng bốn tuần là <strong>14.994.000</strong>; ngày 29/06 là <strong>700.000</strong> và ngày 30/06 là <strong>411.000</strong>; cộng lại thành <strong>16.105.000</strong>.
                </span>
              }
            />

            <Callout variant="insight" title="Vì sao đây là bằng chứng tốt">
              Nếu giữ cả bản sao ngày 15, tuần 3 sẽ lệch. Chỉ sau khi bỏ đúng nửa sau của khối lặp, cả bốn mốc do chủ quán gõ tay mới đồng thời khớp về không.
            </Callout>
          </div>

          <div className="mt-8 space-y-4">
            <h3 className="text-base font-semibold text-foreground">5. Tự đọc ngược file vừa tạo</h3>
            <TerminalBlock label="Nghiệm thu thật" content={READ_BACK_TRANSCRIPT} />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {[
                ["Doanh thu theo ngày", "Bảng đủ 30 ngày và biểu đồ cột."],
                ["Doanh thu theo món", "Các món được xếp từ doanh thu cao xuống thấp."],
                ["Kiểm tra", "Khối tổng quan, tám vấn đề và bảng đối chiếu bốn tuần."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-xl border border-border bg-card p-4">
                  <BarChart3 className="mb-2 h-4 w-4 text-accent" />
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="mt-2 text-xs leading-relaxed text-foreground">{body}</p>
                </div>
              ))}
            </div>

            <DataTable
              label="Bốn ngày chủ quán đối chiếu tay"
              columns={["Ngày", "Doanh thu", "Ghi chú"]}
              rows={[
                ["01/06", "580.000", "12 dòng đầu, dòng 3-14"],
                ["15/06", "733.000", "Sau khi bỏ bản trùng"],
                ["22/06", "835.000", "Khớp sổ gốc"],
                ["30/06", "411.000", "Khớp sổ gốc"],
              ]}
            />

            <div className="flex items-start gap-2 rounded-xl border border-emerald-600 bg-emerald-500/10 p-4 text-sm leading-relaxed text-foreground dark:bg-emerald-500/15">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-200" />
              <p>File gốc không bị sửa. Claude Code đặt script ở vùng làm việc tạm và kiểm tra lại thời gian sửa cùng kích thước file sau khi hoàn tất.</p>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="mb-3 text-base font-semibold text-foreground">6. Hai bẫy cần nhớ</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[
                ["Thấy giống nhau rồi xóa ngay", "Cùng giờ và cùng món chưa đủ chứng minh trùng. Cần nhìn cả khối lặp và một mốc đối chiếu độc lập."],
                ["Không nói rõ chỉ đọc", "Nếu thiếu ràng buộc này, AI có thể sửa ngay bảng gốc và làm mất dấu dữ liệu ban đầu."],
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
            Muốn hiểu cách AI phân tích bảng dữ liệu, xem <TopicLink slug="ai-for-data-analysis">phân tích dữ liệu bằng AI</TopicLink>. Muốn nắm cách giao việc nhiều bước và giữ quyền duyệt, xem <TopicLink slug="ai-coding-assistants">trợ lý lập trình AI</TopicLink>.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Vòng lặp làm báo cáo mà vẫn kiểm soát được"
          points={[
            "Giao việc rõ đầu ra, dữ liệu bẩn đã biết, nghi ngờ, ràng buộc và cách nghiệm thu.",
            "Đọc từng lệnh rồi mới cho Claude Code chạy trên máy.",
            "Dùng mốc Tổng tuần để chứng minh bản sao thay vì xóa theo cảm giác.",
            "Yêu cầu AI đọc ngược file vừa tạo và in ra các số có thể đối chiếu tay.",
            "Giữ file gốc ở chế độ chỉ đọc và xuất kết quả sang file mới.",
          ]}
        />

        <div className="mt-4 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <MousePointerClick className="h-4 w-4 text-accent" />
            <h4 className="text-sm font-semibold text-foreground">Thử với file bán hàng thật của bạn</h4>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground">
            Chép khuôn năm phần: Việc cần làm, Dữ liệu đầu vào, Nghi ngờ, Ràng buộc và Nghiệm thu. Thay tên file, mô tả các lỗi bạn đã thấy và chọn vài ngày bạn có thể tự cộng lại.
          </p>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl border border-blue-600 bg-blue-500/10 p-4 text-sm leading-relaxed text-foreground dark:border-blue-500 dark:bg-blue-500/15">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-700 dark:text-blue-200" />
          <p>Bạn không cần Excel 365 hay Copilot cho vòng lặp này. Báo cáo cuối vẫn mở trong Excel 2019 thường.</p>
        </div>
      </LessonSection>

      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ_QUESTIONS} />
      </LessonSection>
    </>
  );
}
