"use client";

import { useState, type ElementType, type ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  CloudUpload,
  Code2,
  FileCode2,
  KeyRound,
  Link2,
  ListChecks,
  LogIn,
  MousePointerClick,
  Rocket,
  Sheet,
  ShieldCheck,
  Terminal,
  UserCheck,
} from "lucide-react";
import {
  AhaMoment,
  Callout,
  InlineChallenge,
  LessonSection,
  MiniSummary,
  PredictionGate,
  ToggleCompare,
  TopicLink,
} from "@/components/interactive";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import VisualizationSection from "@/components/topic/VisualizationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "claude-code-apps-script",
  title: "Claude Code + Google Apps Script",
  titleVi: "Dựng web app đặt món bằng Claude Code và 3 lệnh clasp",
  description:
    "Claude Code viết code Google Apps Script rồi tạo, đẩy và publish web app đặt món bằng clasp ngay trong terminal. Đơn hàng rơi thẳng vào Google Sheet, sửa code xong link vẫn giữ nguyên.",
  category: "applied-ai",
  tags: ["claude-code", "apps-script", "clasp", "automation", "cli"],
  difficulty: "intermediate",
  relatedSlugs: ["ai-coding-assistants", "agentic-workflows", "ai-for-market-research"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

const REAL_TASK = `Tạo web app đặt món cho quán cà phê bằng Google Apps Script, dùng clasp. Form gồm tên khách, món, số lượng, ghi đơn vào Google Sheet.`;

const C1_TRANSCRIPT = `$ clasp create-script --title "Don Coffee - Đặt món" --type sheets
Created new document: https://drive.google.com/open?id=1h-SXBqv...CLhE
Created new script: https://script.google.com/d/1HLx-Hu9...ixpM/edit
└─ appsscript.json
Cloned one file..`;

const C2_TRANSCRIPT = `$ ls -1
appsscript.json
Code.js
Form.html
$ clasp push -f
Pushed 3 files at 9:48:18 AM.
└─ appsscript.json
└─ Code.js
└─ Form.html`;

const C3_TRANSCRIPT = `$ clasp create-deployment -d "ban dau"
Deployed AKfycbzi...RZWA @1`;

const WEB_APP_URL = `script.google.com/macros/s/AKfycbzi...RZWA/exec`;

const PERMISSION_PROMPT = `Bash command

  clasp create --type sheets --title "Đơn Coffee" 2>&1
  Create Sheet-bound Apps Script project via clasp

This command requires approval

Do you want to proceed?
❯ 1. Yes
  2. Yes, and don't ask again for: clasp create *
  3. No

Esc to cancel · Tab to amend · ctrl+e to explain`;

const CREATE_ALIAS = `create`;
const CREATE_SCRIPT_COMMAND = `create-script`;
const CLASP_LOGIN_COMMAND = `clasp login`;
const CLASP_PUSH_COMMAND = `clasp push`;
const CLASP_CREATE_DEPLOYMENT_COMMAND = `clasp create-deployment`;
const CLASP_UPDATE_DEPLOYMENT_COMMAND = `clasp update-deployment`;
const CLASP_MCP_COMMAND = `start-mcp-server`;
const DELETE_SCRIPT_COMMAND = `delete-script`;

const V1_CODE = `sheet.appendRow([new Date(), don.tenKhach, don.mon, don.soLuong]);
return "Đã nhận đơn của " + don.tenKhach + "!";`;

const V2_CODE = `const tongTien = monChon.gia * don.soLuong;
sheet.appendRow([new Date(), don.tenKhach, don.mon, don.soLuong, tongTien]);
return "Đã nhận đơn: " + don.soLuong + " " + don.mon + ", tổng " +
  dinhDangTien(tongTien);

function dinhDangTien(so) {
  return so.toLocaleString("vi-VN") + "đ";
}`;

const V1_CONFIRMATION = `Đã nhận đơn của Chị Lan!`;
const V2_CONFIRMATION = `Đã nhận đơn: 2 Bạc xỉu, tổng 58.000đ`;

const C4_TRANSCRIPT = `$ clasp push
Pushed 3 files at 10:16:14 AM.
└─ appsscript.json
└─ Code.js
└─ Form.html
$ clasp update-deployment AKfycbzi...RZWA -d "them tong tien"
Redeployed AKfycbzi...RZWA @2`;

const MENU_OPTIONS = `Phin sữa đá (25k)
Bạc xỉu (29k)
Cold brew cam (35k)
Trà đào cam sả (32k)`;

const SHEET_HEADERS = `Thời gian, Tên khách, Món, Số lượng, Tổng tiền`;

const DEMO_STEPS = [
  {
    label: "Tạo project và Sheet",
    transcript: C1_TRANSCRIPT,
    explanation: "Một lệnh tạo cả Google Sheet lẫn project Apps Script gắn với Sheet đó.",
  },
  {
    label: "Đẩy ba file lên",
    transcript: C2_TRANSCRIPT,
    explanation: "Lệnh push đưa ba file appsscript.json, Code.js và Form.html lên project.",
  },
  {
    label: "Publish và lấy link",
    transcript: C3_TRANSCRIPT,
    explanation: "Deployment trả về link web app công khai để khách mở form đặt món.",
  },
] as const;

const MANUAL_BROWSER_STEPS = [
  "Mở script.google.com.",
  "Tạo project mới.",
  "Gõ code trong editor web.",
  "Gắn project với Google Sheet.",
  "Mở menu deploy và chọn web app.",
  "Copy link để gửi cho khách.",
];

const PROMPT_TEMPLATES = [
  {
    title: "A. Dựng web app form",
    icon: FileCode2,
    body: "Tạo web app [mục đích] bằng Google Apps Script, dùng clasp. Form gồm [các trường], ghi dữ liệu vào Google Sheet [tên Sheet].",
  },
  {
    title: "B. Thêm tính năng",
    icon: Code2,
    body: "Trong script đang có, thêm [tính năng]. Giữ nguyên [phần không được đổi]. Sau khi sửa, đẩy code và cập nhật deployment hiện tại để link không đổi.",
  },
  {
    title: "C. Giải thích lệnh trước khi chạy",
    icon: ShieldCheck,
    body: "Trước khi chạy [lệnh], giải thích lệnh sẽ đọc, tạo, sửa hoặc xóa gì. Chờ tôi đồng ý rồi mới chạy.",
  },
  {
    title: "D. Tự động hóa một Sheet khác",
    icon: Sheet,
    body: "Tự động hóa Google Sheet [điểm danh lớp học hoặc chấm công]. Dữ liệu đầu vào gồm [các cột]. Tạo giao diện [mô tả] và quy tắc [điều kiện].",
  },
] as const;

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

function CodeCard({
  label,
  code,
  confirmation,
}: {
  label: string;
  code: string;
  confirmation: string;
}) {
  return (
    <div className="space-y-3">
      <TerminalBlock label={label} content={code} />
      <div className="rounded-xl border border-emerald-600 bg-emerald-500/10 p-3 dark:bg-emerald-500/15">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-700 dark:text-emerald-200" />
          <span className="text-xs font-semibold text-foreground">
            Xác nhận thật trong trình duyệt
          </span>
        </div>
        <code className="mt-2 block font-mono text-xs text-foreground">{confirmation}</code>
      </div>
    </div>
  );
}

function RoleCard({
  icon: Icon,
  title,
  children,
}: {
  icon: ElementType;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <Icon className="mb-2 h-5 w-5 text-accent" />
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-foreground">{children}</p>
    </div>
  );
}

function CommandStepper() {
  const [activeStep, setActiveStep] = useState(0);
  const current = DEMO_STEPS[activeStep];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        {DEMO_STEPS.map((step, index) => {
          const selected = index === activeStep;
          return (
            <button
              key={step.label}
              type="button"
              onClick={() => setActiveStep(index)}
              className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
                selected
                  ? "border-accent bg-accent-light text-foreground dark:bg-accent/15 dark:text-foreground"
                  : "border-border bg-card text-foreground hover:border-accent/60 hover:bg-surface"
              }`}
            >
              <span className="mr-2 font-mono text-xs">{index + 1}.</span>
              {step.label}
            </button>
          );
        })}
      </div>

      <TerminalBlock label="Lệnh và kết quả thật" content={current.transcript} />

      <div className="flex items-start gap-2 rounded-xl border border-blue-600 bg-blue-500/10 p-3 text-sm text-foreground dark:border-blue-500 dark:bg-blue-500/15">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-700 dark:text-blue-200" />
        <p>{current.explanation}</p>
      </div>

      {activeStep === 2 && (
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-xs font-semibold text-foreground">Link web app</p>
          <code className="mt-1 block break-all font-mono text-xs text-foreground">
            {WEB_APP_URL}
          </code>
        </div>
      )}
    </div>
  );
}

function BrowserVsClaudeCompare() {
  return (
    <ToggleCompare
      labelA="Tự làm trên trình duyệt"
      labelB="Ra lệnh cho Claude Code"
      description="Hai cách tạo cùng một web app đặt món trên Google Apps Script."
      childA={
        <ol className="space-y-2">
          {MANUAL_BROWSER_STEPS.map((step, index) => (
            <li
              key={step}
              className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3 text-sm text-foreground"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-card font-mono text-xs font-bold text-foreground">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      }
      childB={
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="mb-2 text-xs font-semibold text-foreground">Đề bài thật gửi cho Claude Code</p>
            <p className="font-mono text-sm leading-relaxed text-foreground">{REAL_TASK}</p>
          </div>
          <TerminalBlock label="Claude Code xin phép trước khi chạy lệnh" content={PERMISSION_PROMPT} />
          <div className="flex items-start gap-2 rounded-xl border border-amber-600 bg-amber-500/10 p-3 text-sm text-foreground dark:bg-amber-500/15">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-800 dark:text-amber-200" />
            <p>
              Claude Code luôn dừng lại xin phép trước khi chạy lệnh. Bạn đọc lệnh rồi mới bấm đồng ý.
            </p>
          </div>
          <p className="text-sm leading-relaxed text-foreground">
            Một số lệnh có tên gọi tắt. <code className="font-mono text-foreground">{CREATE_ALIAS}</code> là tên tắt của{" "}
            <code className="font-mono text-foreground">{CREATE_SCRIPT_COMMAND}</code>.
          </p>
        </div>
      }
    />
  );
}

function SameLinkUpdateDemo() {
  return (
    <div className="space-y-4">
      <ToggleCompare
        labelA="Bản đầu"
        labelB="Thêm tổng tiền"
        description="Cùng hàm guiDon, bản sau thêm cột tổng tiền và giữ nguyên link web app."
        childA={<CodeCard label="Code.js, bản đầu" code={V1_CODE} confirmation={V1_CONFIRMATION} />}
        childB={<CodeCard label="Code.js, bản sau" code={V2_CODE} confirmation={V2_CONFIRMATION} />}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-2 text-xs font-semibold text-foreground">Menu thật</p>
          <pre className="font-mono text-xs leading-relaxed text-foreground whitespace-pre-wrap">{MENU_OPTIONS}</pre>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-2 text-xs font-semibold text-foreground">Header Sheet Đơn hàng</p>
          <code className="font-mono text-xs leading-relaxed text-foreground">{SHEET_HEADERS}</code>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-foreground">
        Trong laySheetDonHang, bản sau thêm header Tổng tiền và tự điền lại ô E1 cho những Sheet đã được tạo từ bản đầu.
      </p>

      <TerminalBlock label="Đẩy code rồi cập nhật deployment" content={C4_TRANSCRIPT} />

      <div className="flex items-start gap-2 rounded-xl border border-blue-600 bg-blue-500/10 p-4 text-sm leading-relaxed text-foreground dark:border-blue-500 dark:bg-blue-500/15">
        <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-700 dark:text-blue-200" />
        <p>
          <code className="font-mono text-foreground">{CLASP_PUSH_COMMAND}</code> chỉ đưa code lên editor. Bản publish đứng yên ở phiên bản cũ cho đến khi{" "}
          <code className="font-mono text-foreground">{CLASP_UPDATE_DEPLOYMENT_COMMAND}</code> chạy. Dòng{" "}
          <code className="font-mono text-foreground">{`Redeployed AKfycbzi...RZWA @2`}</code> cho thấy cùng deployment ID đã lên phiên bản mới, nên link không đổi.
        </p>
      </div>
    </div>
  );
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "clasp là gì và do ai cung cấp?",
    options: [
      "Một editor JavaScript của Anthropic",
      "CLI chính thức của Google cho Apps Script",
      "Một gói giao diện của Google Sheet",
      "Một dịch vụ lưu đơn hàng trả phí",
    ],
    correct: 1,
    explanation: "clasp là công cụ dòng lệnh chính thức của Google để làm việc với project Apps Script.",
  },
  {
    question: "Thứ tự nào đi từ chưa có project đến link web app?",
    options: [
      "push, create-deployment, create-script",
      "create-deployment, create-script, push",
      "create-script, push, create-deployment",
      "login, update-deployment, delete-script",
    ],
    correct: 2,
    explanation: "Tạo project trước, đẩy code lên sau, rồi tạo deployment để lấy link.",
  },
  {
    question: "Bạn đã push code mới nhưng link vẫn hiện bản cũ. Cần làm gì?",
    options: [
      "Tạo tài khoản Google mới",
      "Chạy update-deployment cho deployment hiện tại",
      "Đổi tên Code.js",
      "Xóa Google Sheet rồi tạo lại",
    ],
    correct: 1,
    explanation: "push cập nhật code trong editor. update-deployment mới đưa bản publish sang phiên bản mới.",
  },
  {
    question: "Ai giữ quyền đăng nhập tài khoản Google khi Claude Code dùng clasp?",
    options: [
      "Claude Code tự đăng nhập bằng tài khoản Anthropic",
      "clasp tạo tài khoản tạm",
      "Bạn tự đăng nhập và cấp quyền cho clasp",
      "Khách mở form sẽ đăng nhập thay bạn",
    ],
    correct: 2,
    explanation: "Tài khoản và bước đăng nhập Google luôn thuộc về bạn. AI không tự lấy quyền đó.",
  },
  {
    question: "Permission prompt của Claude Code dùng để làm gì?",
    options: [
      "Cho bạn đọc lệnh và quyết định có cho chạy hay không",
      "Tự động cho mọi lệnh chạy vĩnh viễn",
      "Thay bạn cấp quyền Google",
      "Publish form ra công khai ngay lập tức",
    ],
    correct: 0,
    explanation: "Claude Code dừng trước lệnh cần quyền để bạn xem và chủ động đồng ý hoặc từ chối.",
  },
  {
    question: "Vì sao create-script với loại sheets tạo được cả Sheet và project Apps Script?",
    options: [
      "Vì loại sheets tạo một project gắn trực tiếp với Google Sheet mới",
      "Vì Claude Code giả lập một Sheet trên máy",
      "Vì Form.html tự biến thành Sheet",
      "Vì deployment luôn chứa một bảng tính",
    ],
    correct: 0,
    explanation: "Loại sheets yêu cầu một project Apps Script gắn với tài liệu Google Sheet, nên lệnh tạo cả hai.",
  },
  {
    question: "Link deploy xong báo lỗi 403 trong lần chạy đầu có thể nghĩa là gì?",
    options: [
      "Code chắc chắn đã hỏng",
      "Script chưa được tài khoản cấp quyền chạy lần đầu",
      "Google Sheet đã đầy",
      "Link chỉ dùng được trong terminal",
    ],
    correct: 1,
    explanation: "Mở editor, chạy một lần và hoàn tất màn hình cấp quyền. Đây là rào cản quyền, không tự động chứng minh code hỏng.",
  },
  {
    question: "Rủi ro chính khi form công khai ghi thẳng vào Sheet là gì?",
    options: [
      "Khách không thể mở link",
      "Form có thể nhận đơn rác hoặc thu dữ liệu nhạy cảm không phù hợp",
      "clasp tự xóa dữ liệu cũ",
      "Sheet không lưu được chữ tiếng Việt",
    ],
    correct: 1,
    explanation: "Quyền công khai giúp ai cũng gửi được, nên phải cân nhắc đơn rác, phạm vi người dùng và loại dữ liệu được thu.",
  },
];

export default function ClaudeCodeAppsScriptTopic() {
  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Thử đoán">
        <PredictionGate
          question="Muốn tạo và publish một web app Google Apps Script, như form đặt món ghi vào Google Sheet, bạn bắt buộc phải làm gì?"
          options={[
            "Phải vào script.google.com và code trong editor web",
            "Phải thành thạo JavaScript trước khi bắt đầu",
            "Không bắt buộc mở trình duyệt để code: từ tạo project đến publish đều làm được bằng lệnh trong terminal",
            "Phải trả phí Google Workspace",
          ]}
          correct={2}
          explanation="clasp là CLI chính thức của Google cho Apps Script. Claude Code gõ lệnh và viết code thay bạn, còn bạn duyệt từng bước."
        >
          <p className="mt-4 text-sm leading-relaxed text-foreground">
            Đặt món là ví dụ xuyên suốt: khách mở link, chọn món, rồi đơn rơi thẳng vào Google Sheet của Don Coffee.
          </p>
        </PredictionGate>
      </LessonSection>

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Góc nhìn">
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-light">
              <UserCheck className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Phân vai ba bên</h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                Bạn giữ đề bài và quyền duyệt. Claude Code viết code và đề xuất lệnh. clasp chuyển code lên Google và trả link web app về terminal.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <RoleCard icon={ClipboardCheck} title="Bạn ra đề và duyệt">
              Nói form cần những trường nào, đọc từng lệnh và quyết định khi nào publish.
            </RoleCard>
            <RoleCard icon={Code2} title="Claude Code viết và gõ lệnh">
              Tạo Code.js, Form.html, sửa code và dừng lại xin phép trước lệnh cần quyền.
            </RoleCard>
            <RoleCard icon={CloudUpload} title="clasp đưa code lên Google">
              Tạo project, push file và quản lý deployment từ terminal.
            </RoleCard>
          </div>
        </div>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection topicSlug="claude-code-apps-script">
          <div className="space-y-8">
            <div>
              <h3 className="mb-1 text-base font-semibold text-foreground">Demo 1, 3 lệnh từ 0 đến link công khai</h3>
              <p className="mb-4 text-sm leading-relaxed text-foreground">
                Chọn từng bước để xem đúng lệnh và kết quả đã chạy trên máy của Dat.
              </p>
              <CommandStepper />
            </div>

            <div>
              <h3 className="mb-1 text-base font-semibold text-foreground">Demo 2, trình duyệt hay Claude Code</h3>
              <p className="mb-4 text-sm leading-relaxed text-foreground">
                Cách thứ hai vẫn giữ quyền duyệt ở bạn, nhưng phần code và thao tác lặp lại diễn ra trong terminal.
              </p>
              <BrowserVsClaudeCompare />
            </div>

            <div>
              <h3 className="mb-1 text-base font-semibold text-foreground">Demo 3, sửa xong, link giữ nguyên</h3>
              <p className="mb-4 text-sm leading-relaxed text-foreground">
                Bản sau tính tổng tiền cho đơn hàng, thêm cột vào Sheet và cập nhật đúng deployment đang có.
              </p>
              <SameLinkUpdateDemo />
            </div>

            <Callout variant="tip" title="Ba quan sát từ lần chạy thật">
              <ul className="list-disc space-y-1 pl-5 text-sm">
                <li>Publish một lần để lấy link, sửa nhiều lần thì link vẫn giữ nguyên.</li>
                <li>Claude Code xin phép trước mọi lệnh cần quyền.</li>
                <li>Google Sheet đủ làm kho đơn hàng miễn phí cho một form nhỏ.</li>
              </ul>
            </Callout>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          AI viết code và gõ lệnh nhanh hơn bạn, nhưng ba thứ vẫn nằm nguyên trong tay bạn: tài khoản Google với <code className="font-mono text-foreground">{CLASP_LOGIN_COMMAND}</code> là bạn tự đăng nhập, nút đồng ý trước mỗi lệnh và quyết định publish. <strong>Điều khiển bằng AI không có nghĩa là buông tay khỏi tài khoản của mình.</strong>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Claude Code đề xuất chạy clasp create-script nhưng bạn chưa từng clasp login. Điều gì xảy ra?"
          options={[
            "Claude Code tự mở tài khoản Google của Anthropic để chạy thay bạn",
            "Lệnh báo lỗi vì chưa có quyền. AI không tự đăng nhập vào Google của bạn được, đăng nhập luôn là bước của bạn",
            "Project được tạo công khai mà không cần tài khoản",
            "clasp bỏ qua đăng nhập nếu project dùng Google Sheet",
          ]}
          correct={1}
          explanation="clasp cần phiên đăng nhập Google của chính bạn. Claude Code có thể đề xuất lệnh, nhưng không thể tự nhận quyền tài khoản thay bạn."
        />

        <div className="mt-6">
          <InlineChallenge
            question="Bạn sửa Code.js, chạy clasp push thành công, nhưng khách mở link vẫn thấy bản cũ. Thiếu bước nào?"
            options={[
              "Chạy lại create-script để lấy project mới",
              "Chạy clasp update-deployment cho deployment hiện tại",
              "Đăng xuất khỏi Google rồi đăng nhập lại",
              "Đổi tên Form.html trước khi push",
            ]}
            correct={1}
            explanation="push đưa code lên editor. Bản publish giữ nguyên phiên bản cũ cho đến khi update-deployment cập nhật deployment hiện tại."
          />
        </div>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Hiểu sâu hơn">
        <ExplanationSection topicSlug="claude-code-apps-script">
          <div>
            <h3 className="mb-3 text-base font-semibold text-foreground">Ba công cụ trong lần chạy</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {[
                {
                  name: "Claude Code",
                  icon: Terminal,
                  note: "Agent của Anthropic chạy trong terminal, viết file và đề xuất lệnh theo đề bài của bạn.",
                },
                {
                  name: "clasp",
                  icon: CloudUpload,
                  note: "CLI chính thức của Google cho Apps Script, cài qua npm và dùng để tạo, đẩy, publish project.",
                },
                {
                  name: "Google Sheet",
                  icon: Sheet,
                  note: "Kho dữ liệu nhận từng đơn với thời gian, tên khách, món, số lượng và tổng tiền.",
                },
              ].map((tool) => {
                const Icon = tool.icon;
                return (
                  <div key={tool.name} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-accent" />
                      <p className="text-sm font-semibold text-foreground">{tool.name}</p>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-foreground">{tool.note}</p>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-foreground">
              Đi xa hơn, clasp 3 còn có lệnh <code className="font-mono text-foreground">{CLASP_MCP_COMMAND}</code> để AI agent nói chuyện trực tiếp với Apps Script.
            </p>
          </div>

          <div className="mt-6">
            <h3 className="mb-3 text-base font-semibold text-foreground">Vòng lặp bốn bước</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              {[
                {
                  title: "Ra đề bài rõ",
                  icon: ListChecks,
                  body: "Nói form gồm gì và dữ liệu phải ghi vào đâu.",
                },
                {
                  title: "Viết và duyệt",
                  icon: MousePointerClick,
                  body: "Claude Code viết code, đề xuất lệnh, bạn đọc rồi duyệt từng lệnh.",
                },
                {
                  title: "Tạo và publish",
                  icon: Rocket,
                  body: "create-script, push và create-deployment tạo project rồi trả link.",
                },
                {
                  title: "Sửa và cập nhật",
                  icon: Link2,
                  body: "push code mới rồi update-deployment để giữ nguyên link.",
                },
              ].map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="rounded-xl border border-border bg-card p-4">
                    <Icon className="mb-2 h-4 w-4 text-accent" />
                    <p className="text-sm font-semibold text-foreground">{step.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-foreground">{step.body}</p>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-foreground">
              Xương sống của vòng lặp là <code className="font-mono text-foreground">{CREATE_SCRIPT_COMMAND}</code>,{" "}
              <code className="font-mono text-foreground">{CLASP_PUSH_COMMAND}</code>,{" "}
              <code className="font-mono text-foreground">{CLASP_CREATE_DEPLOYMENT_COMMAND}</code> và khi sửa là{" "}
              <code className="font-mono text-foreground">{CLASP_UPDATE_DEPLOYMENT_COMMAND}</code>.
            </p>
          </div>

          <div className="mt-6">
            <h3 className="mb-3 text-base font-semibold text-foreground">Bốn cái bẫy cần đọc trước khi chạy</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[
                {
                  title: "Link 403 dù deploy thành công",
                  body: "Điều này đã xảy ra trong lần chạy thật. Publish hoàn toàn bằng lệnh nghĩa là tài khoản chưa từng cấp quyền cho script chạy. Mở editor, bấm Run một lần, đọc màn hình quyền và cho phép thì link chạy ngay. Nếu push bị chặn từ đầu, kiểm tra thêm công tắc Apps Script API trong settings.",
                },
                {
                  title: "Chỉ push rồi tưởng code hỏng",
                  body: "push cập nhật editor nhưng bản publish vẫn đứng ở phiên bản cũ. Chạy update-deployment cho đúng deployment đang dùng.",
                },
                {
                  title: "Mở form cho tất cả mọi người",
                  body: "Quyền ai cũng gửi được giúp khách đặt món, nhưng form công khai có thể nhận đơn rác. Form nội bộ nên giới hạn người truy cập.",
                },
                {
                  title: "Đồng ý khi chưa đọc lệnh",
                  body: "Đọc mục tiêu và phạm vi trước khi bấm đồng ý, nhất là lệnh xóa như ",
                  command: DELETE_SCRIPT_COMMAND,
                },
              ].map((pitfall) => (
                <div
                  key={pitfall.title}
                  className="rounded-xl border border-amber-600 bg-amber-500/10 p-4 dark:bg-amber-500/15"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-800 dark:text-amber-200" />
                    <p className="text-sm font-semibold text-foreground">{pitfall.title}</p>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-foreground">
                    {pitfall.body}
                    {"command" in pitfall && (
                      <code className="font-mono text-foreground">{pitfall.command}</code>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="mb-3 text-base font-semibold text-foreground">Bốn khuôn prompt copy được ngay</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {PROMPT_TEMPLATES.map((template) => {
                const Icon = template.icon;
                return (
                  <div key={template.title} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-accent" />
                      <p className="text-sm font-semibold text-foreground">{template.title}</p>
                    </div>
                    <p className="mt-2 rounded-lg bg-surface p-3 font-mono text-xs leading-relaxed text-foreground">
                      {template.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <Callout variant="insight">
            <strong>Học nền tảng trước khi giao việc dài.</strong> Muốn hiểu Claude Code dành cho người không code, xem{" "}
            <TopicLink slug="ai-coding-assistants">trợ lý lập trình AI</TopicLink>. Muốn biết cách giao một đầu việc nhiều bước cho AI, xem{" "}
            <TopicLink slug="agentic-workflows">quy trình agent</TopicLink>.
          </Callout>

          <Callout variant="warning">
            <strong>Khi không nên làm theo bài này.</strong> Không đổ dữ liệu nhạy cảm như lương hoặc số điện thoại khách vào Sheet qua form công khai. Form nội bộ thì không deploy quyền cho tất cả mọi người. Không để AI chạy lệnh xóa khi bạn chưa đọc kỹ.
          </Callout>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <LogIn className="h-4 w-4 text-accent" />
              <p className="text-sm font-semibold text-foreground">Đăng nhập luôn là bước của bạn</p>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-foreground">
              Khi cần quyền Google, bạn chạy <code className="font-mono text-foreground">{CLASP_LOGIN_COMMAND}</code> và tự hoàn tất màn hình đăng nhập. Claude Code không thay bạn sở hữu phiên đăng nhập đó.
            </p>
          </div>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ khi Claude Code điều khiển Apps Script"
          points={[
            "create-script, push và create-deployment là xương sống từ project trống đến link web app.",
            "Sửa code cần push và update-deployment. Thiếu bước sau thì link vẫn chạy bản cũ.",
            "Đăng nhập Google và nút đồng ý trước lệnh luôn thuộc quyền của bạn.",
            "Google Sheet đủ làm kho đơn hàng cho một form nhỏ.",
            "Bẫy lớn nhất là quên update-deployment rồi tưởng code hỏng.",
            "Form công khai cần giới hạn dữ liệu thu và chuẩn bị cho đơn rác.",
          ]}
        />

        <div className="mt-4 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            <h4 className="text-sm font-semibold text-foreground">Khám phá thêm</h4>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground">
            Đọc <TopicLink slug="ai-coding-assistants">Claude Code dành cho người không code</TopicLink> hoặc quay lại tình huống Don Coffee trong{" "}
            <TopicLink slug="ai-for-market-research">bài khảo sát đối thủ bằng AI</TopicLink>.
          </p>
        </div>
      </LessonSection>

      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ_QUESTIONS} />
      </LessonSection>
    </>
  );
}
