"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Table2,
  Sparkles,
  Check,
  AlertTriangle,
  Eraser,
  CaseSensitive,
  CalendarDays,
  Phone,
  CopyX,
  ListChecks,
  PenLine,
} from "lucide-react";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  Callout,
  MiniSummary,
  LessonSection,
  TopicLink,
  TabView,
  ToggleCompare,
  CodeBlock,
} from "@/components/interactive";
import { MetricReadout } from "@/components/interactive/MetricReadout";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

// ============================================================================
// METADATA
// ============================================================================

export const metadata: TopicMeta = {
  slug: "ai-for-excel-cleaning",
  title: "AI for Excel Cleaning",
  titleVi: "AI làm sạch dữ liệu Excel",
  description:
    "Dán vài dòng mẫu cho AI để nhận công thức TRIM, PROPER, TEXT và các bước sửa lỗi, rồi áp dụng trên bản sao và kiểm tra lại.",
  category: "applied-ai",
  tags: ["excel", "data-cleaning", "spreadsheet", "practical", "office"],
  difficulty: "beginner",
  relatedSlugs: [
    "ai-for-data-analysis",
    "ai-for-paperwork",
    "prompt-engineering",
  ],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

// ============================================================================
// DEMO 1, Bảng dữ liệu bẩn + 5 phép sửa của AI
// ============================================================================

type FixKey = "trim" | "proper" | "date" | "phone" | "dedupe";

const FIXES: {
  key: FixKey;
  icon: typeof Eraser;
  label: string;
  formula: string;
  note: string;
}[] = [
  {
    key: "trim",
    icon: Eraser,
    label: "Khoảng trắng thừa",
    formula: "=TRIM(B2)",
    note: "TRIM bỏ khoảng trắng ở đầu, cuối và các khoảng trắng lặp giữa chữ. Dữ liệu dán từ web đôi khi chứa khoảng trắng cứng, thêm =TRIM(SUBSTITUTE(B2,CHAR(160),\" \")) nếu TRIM thường chưa ăn.",
  },
  {
    key: "proper",
    icon: CaseSensitive,
    label: "HOA thường lộn xộn",
    formula: "=PROPER(B2)",
    note: "PROPER viết hoa chữ cái đầu mỗi từ, hoạt động tốt với tiếng Việt có dấu: TRẦN THỊ BÍCH HẠNH thành Trần Thị Bích Hạnh.",
  },
  {
    key: "date",
    icon: CalendarDays,
    label: "Ngày lẫn định dạng",
    formula: "Data → Text to Columns → Date: DMY",
    note: "Chọn cả cột ngày rồi chạy Text to Columns, bước 3 chọn Date: DMY. Ô viết kiểu 1990-07-22 có năm đứng trước nên Excel vẫn hiểu đúng; chạy xong cứ lọc kiểm tra lại vài ô cho chắc.",
  },
  {
    key: "phone",
    icon: Phone,
    label: "SĐT mất số 0 đầu",
    formula: '=TEXT(D2,"0000000000")',
    note: "Excel coi cột SĐT là số nên tự vứt số 0 đầu. TEXT với mười chữ số 0 ép giá trị về chuỗi đủ 10 ký tự, trả lại số 0 bị mất.",
  },
  {
    key: "dedupe",
    icon: CopyX,
    label: "Dòng trùng lặp",
    formula: "Data → Remove Duplicates",
    note: "Excel chỉ coi là trùng khi các ô giống hệt nhau từng ký tự (không phân biệt hoa thường, nhưng phân biệt khoảng trắng). Vì vậy hãy TRIM trước rồi mới xóa trùng.",
  },
];

type Row = { id: number; name: string; dob: string; phone: string };

const DIRTY_ROWS: Row[] = [
  { id: 1, name: "  nguyễn văn an ", dob: "15/03/1990", phone: "912345678" },
  { id: 2, name: "TRẦN THỊ BÍCH HẠNH", dob: "1990-07-22", phone: "0987654321" },
  { id: 3, name: "lê  hoàng nam", dob: "05/11/1988", phone: "913222111" },
  { id: 4, name: "Phạm Thu Hà", dob: "12/12/1992", phone: "0908111222" },
  // Dòng 5 trùng dòng 2, chỉ khác một khoảng trắng cuối tên. Excel sẽ KHÔNG
  // coi là trùng cho tới khi tên được TRIM, đúng như đời thật.
  { id: 5, name: "TRẦN THỊ BÍCH HẠNH ", dob: "1990-07-22", phone: "0987654321" },
];

const collapseSpaces = (s: string) => s.trim().replace(/\s+/g, " ");

const properVi = (s: string) =>
  s
    .toLowerCase()
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");

const normalizeDob = (s: string) => {
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return iso ? `${iso[3]}/${iso[2]}/${iso[1]}` : s;
};

const padPhone = (s: string) => s.padStart(10, "0");

function ExcelCleaningDemo() {
  const [applied, setApplied] = useState<Set<FixKey>>(new Set());

  const toggleFix = (key: FixKey) =>
    setApplied((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const reset = () => setApplied(new Set());

  const view = useMemo(() => {
    const has = (k: FixKey) => applied.has(k);
    let rows = DIRTY_ROWS.map((r) => ({ ...r }));
    if (has("trim")) rows = rows.map((r) => ({ ...r, name: collapseSpaces(r.name) }));
    // properVi giữ nguyên khoảng trắng như PROPER thật của Excel, nên hai phép
    // sửa độc lập với nhau và bấm theo thứ tự nào cũng đúng.
    if (has("proper")) rows = rows.map((r) => ({ ...r, name: properVi(r.name) }));
    if (has("date")) rows = rows.map((r) => ({ ...r, dob: normalizeDob(r.dob) }));
    if (has("phone")) rows = rows.map((r) => ({ ...r, phone: padPhone(r.phone) }));

    // Remove Duplicates: dòng 5 chỉ biến mất khi nó giống HỆT dòng 2
    // (không phân biệt hoa thường, có phân biệt khoảng trắng).
    let dedupeStuck = false;
    if (has("dedupe")) {
      const seen = new Set<string>();
      rows = rows.filter((r) => {
        const sig = `${r.name.toLowerCase()}|${r.dob}|${r.phone}`;
        if (seen.has(sig)) return false;
        seen.add(sig);
        return true;
      });
      dedupeStuck = rows.some((r) => r.id === 5);
    }

    // Đếm lỗi còn lại trên bảng đang hiển thị.
    let errors = 0;
    const nameBad = (r: Row) => r.name !== properVi(r.name);
    const spaceBad = (r: Row) => r.name !== collapseSpaces(r.name);
    const dobBad = (r: Row) => /^\d{4}-/.test(r.dob);
    const phoneBad = (r: Row) => r.phone.length !== 10;
    for (const r of rows) {
      if (spaceBad(r)) errors += 1;
      if (nameBad(r)) errors += 1;
      if (dobBad(r)) errors += 1;
      if (phoneBad(r)) errors += 1;
    }
    if (rows.some((r) => r.id === 5)) errors += 1; // dòng trùng chưa xóa

    return { rows, errors, dedupeStuck, nameBad, spaceBad, dobBad, phoneBad };
  }, [applied]);

  return (
    <div className="space-y-4">
      {/* Nút sửa lỗi */}
      <div className="flex flex-wrap gap-2">
        {FIXES.map((f) => {
          const Icon = f.icon;
          const active = applied.has(f.key);
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => toggleFix(f.key)}
              aria-pressed={active}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                active
                  ? "border-accent bg-accent text-white"
                  : "border-border bg-card text-foreground hover:bg-surface"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {f.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted hover:bg-surface transition-colors"
        >
          Đặt lại
        </button>
      </div>

      <div className="rounded-lg border border-border bg-surface px-3 py-2">
        <MetricReadout
          label="Lỗi còn lại trên bảng"
          value={view.errors}
          unit="lỗi"
          valueClassName={`font-mono text-sm font-bold ${
            view.errors === 0 ? "text-emerald-700 dark:text-emerald-400" : "text-accent"
          }`}
        />
        {view.errors === 0 && (
          <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <Check className="h-3.5 w-3.5" /> Bảng đã sạch
          </span>
        )}
      </div>

      {/* Bảng dữ liệu */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="bg-surface text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-3 py-2 font-semibold">#</th>
              <th className="px-3 py-2 font-semibold">Họ tên</th>
              <th className="px-3 py-2 font-semibold">Ngày sinh</th>
              <th className="px-3 py-2 font-semibold">Số điện thoại</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {view.rows.map((r) => {
                const nameErr = view.spaceBad(r) || view.nameBad(r);
                const dobErr = view.dobBad(r);
                const phoneErr = view.phoneBad(r);
                const dupErr = r.id === 5;
                return (
                  <motion.tr
                    key={r.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.25 }}
                    className={`border-t border-border ${
                      dupErr ? "bg-red-50/60 dark:bg-red-900/10" : "bg-card"
                    }`}
                  >
                    <td className="px-3 py-2 text-muted">{r.id}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center gap-1.5 whitespace-pre font-mono text-[13px] ${
                          nameErr ? "rounded bg-red-100 dark:bg-red-900/25 px-1.5 py-0.5" : ""
                        } text-foreground`}
                      >
                        {nameErr && (
                          <AlertTriangle className="h-3 w-3 shrink-0 text-red-700 dark:text-red-400" />
                        )}
                        {r.name}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center gap-1.5 font-mono text-[13px] ${
                          dobErr ? "rounded bg-red-100 dark:bg-red-900/25 px-1.5 py-0.5" : ""
                        } text-foreground`}
                      >
                        {dobErr && (
                          <AlertTriangle className="h-3 w-3 shrink-0 text-red-700 dark:text-red-400" />
                        )}
                        {r.dob}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center gap-1.5 font-mono text-[13px] ${
                          phoneErr ? "rounded bg-red-100 dark:bg-red-900/25 px-1.5 py-0.5" : ""
                        } text-foreground`}
                      >
                        {phoneErr && (
                          <AlertTriangle className="h-3 w-3 shrink-0 text-red-700 dark:text-red-400" />
                        )}
                        {r.phone}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {view.dedupeStuck && (
        <p className="flex items-start gap-2 rounded-lg bg-amber-100 dark:bg-amber-900/20 p-3 text-sm text-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" />
          Xóa trùng chưa ăn: dòng 5 chỉ khác dòng 2 một khoảng trắng cuối tên,
          nên Excel chưa coi là trùng. Bật thêm &ldquo;Khoảng trắng thừa&rdquo;
          (TRIM) rồi nhìn lại.
        </p>
      )}

      {/* Công thức AI đưa cho bạn */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent">
          <Sparkles className="h-4 w-4" /> Công thức AI đưa cho bạn
        </p>
        {applied.size === 0 ? (
          <p className="text-sm italic text-muted">
            Bấm một nút sửa lỗi ở trên để xem AI trả về công thức gì cho lỗi đó.
          </p>
        ) : (
          <div className="space-y-2">
            {FIXES.filter((f) => applied.has(f.key)).map((f) => (
              <div key={f.key} className="rounded-lg bg-surface p-3">
                <p className="font-mono text-[13px] font-semibold text-accent">
                  {f.formula}
                </p>
                <p className="mt-1 text-xs text-muted">{f.note}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// DEMO 2, Prompt mơ hồ và prompt kèm mẫu dữ liệu
// ============================================================================

function PromptCompareDemo() {
  return (
    <ToggleCompare
      labelA="Câu hỏi mơ hồ"
      labelB="Câu hỏi kèm mẫu dữ liệu"
      description="Cùng một vấn đề, hai cách hỏi AI. Bật qua lại để so sánh câu trả lời."
      childA={
        <div className="rounded-lg border border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10 p-4 space-y-3">
          <div className="rounded-lg bg-surface p-3">
            <p className="mb-1 text-xs font-semibold text-muted">Bạn hỏi</p>
            <p className="text-sm italic text-foreground">
              &ldquo;File Excel của tôi bị lỗi, sửa giúp mình với.&rdquo;
            </p>
          </div>
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-700 dark:text-red-400" />
            <p className="text-sm text-foreground">
              AI không nhìn thấy file của bạn nên chỉ trả lời chung chung: kiểm
              tra định dạng, thử TRIM, thử tìm kiếm... Bạn đọc xong vẫn không
              biết bấm gì.
            </p>
          </div>
        </div>
      }
      childB={
        <div className="rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10 p-4 space-y-3">
          <div className="rounded-lg bg-surface p-3">
            <p className="mb-1 text-xs font-semibold text-muted">Bạn hỏi</p>
            <p className="text-sm italic text-foreground">
              &ldquo;Cột B là họ tên, cột C ngày sinh, cột D số điện thoại. Đây
              là 5 dòng mẫu: [dán 5 dòng]. Lỗi tôi thấy: tên lúc hoa lúc
              thường, ngày lẫn 2 định dạng, SĐT mất số 0 đầu. Cho tôi công thức
              sửa từng lỗi, kèm giải thích ngắn.&rdquo;
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
            <p className="text-sm text-foreground">
              AI thấy đúng hình dạng dữ liệu nên trả về đúng 3 công thức dùng
              được ngay: =PROPER(TRIM(B2)), các bước Text to Columns cho cột C,
              =TEXT(D2,&quot;0000000000&quot;) cho cột D.
            </p>
          </div>
        </div>
      }
    />
  );
}

// ============================================================================
// QUIZ
// ============================================================================

const quizQuestions: QuizQuestion[] = [
  {
    question: "Hàm TRIM trong Excel làm gì?",
    options: [
      "Xóa toàn bộ khoảng trắng trong ô, kể cả giữa các từ",
      "Bỏ khoảng trắng đầu, cuối ô và các khoảng trắng lặp giữa các từ",
      "Viết hoa chữ cái đầu mỗi từ",
      "Xóa các dòng trùng lặp",
    ],
    correct: 1,
    explanation:
      "TRIM giữ đúng một khoảng trắng giữa các từ và bỏ phần thừa. Nó không đổi hoa thường (việc của PROPER) và không đụng đến dòng trùng (việc của Remove Duplicates).",
  },
  {
    question:
      "Vì sao nên dán 5-10 dòng mẫu cho AI thay vì upload cả file 2.000 dòng khách hàng?",
    options: [
      "Vì AI chỉ đọc được tối đa 10 dòng",
      "Vì mẫu nhỏ đủ cho AI thấy hình dạng lỗi để viết công thức, còn dữ liệu thật ở lại trong máy bạn",
      "Vì file lớn làm AI trả lời sai chính tả",
      "Vì Excel không cho copy quá 10 dòng",
    ],
    correct: 1,
    explanation:
      "Thứ AI cần là hình dạng của lỗi, không phải toàn bộ con số thật. Mẫu nhỏ (đã thay tên, số thật nếu nhạy cảm) cho ra cùng một công thức mà không đem dữ liệu khách hàng ra ngoài công ty.",
  },
  {
    question:
      "Cột số điện thoại hiển thị 912345678 thay vì 0912345678. Nguyên nhân và cách sửa đúng?",
    options: [
      "File bị hỏng, phải gõ lại tay từng dòng",
      "Excel coi cột là số nên bỏ số 0 đầu, sửa bằng =TEXT(D2,\"0000000000\")",
      "Do font chữ, đổi font là hiện lại số 0",
      "Do máy thiếu RAM khi mở file",
    ],
    correct: 1,
    explanation:
      "Với kiểu Số, 0912345678 và 912345678 là một giá trị nên Excel bỏ số 0 đầu. TEXT với chuỗi mười số 0 ép giá trị thành chuỗi 10 ký tự, trả lại số 0. Nhập mới thì để định dạng cột là Text từ đầu.",
  },
  {
    question: "Vì sao luôn làm sạch dữ liệu trên một bản sao của file?",
    options: [
      "Vì Excel bắt buộc phải có 2 file mới chạy công thức",
      "Vì công thức hoặc bước sửa có thể sai, bản gốc còn nguyên thì làm lại được",
      "Vì bản sao chạy nhanh hơn bản gốc",
      "Vì AI chỉ đọc được file copy",
    ],
    correct: 1,
    explanation:
      "Một công thức áp nhầm cột hoặc một lần Remove Duplicates quá tay có thể phá dữ liệu không hoàn tác được sau khi lưu. Bản gốc nguyên vẹn là lưới an toàn rẻ nhất bạn có.",
  },
];

// ============================================================================
// TOPIC
// ============================================================================

export default function AiForExcelCleaningTopic() {
  return (
    <>
      {/* ========================================================= */}
      {/* BƯỚC 1, DỰ ĐOÁN                                           */}
      {/* ========================================================= */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Sếp gửi file khách hàng 2.000 dòng: tên lúc HOA lúc thường, ngày sinh lẫn 2 định dạng, số điện thoại mất số 0 đầu. Cách dùng AI nhanh và an toàn nhất là gì?"
          options={[
            "Upload cả file 2.000 dòng lên chatbot để AI tự sửa và trả về file sạch",
            "Dán khoảng 10 dòng mẫu, xin công thức Excel cho từng lỗi, rồi tự áp dụng cho cả cột",
            "AI không sửa được dữ liệu Excel, đành sửa tay từng ô",
          ]}
          correct={1}
          explanation="Cách khôn nhất là để AI làm thợ viết công thức: nó nhìn vài dòng mẫu và trả về TRIM, PROPER, TEXT áp dụng được cho cả cột. Dữ liệu thật ở lại trong máy bạn, và từng bước sửa đều kiểm tra lại được."
        >
          <p className="mt-2 text-sm text-muted">
            Dọn dữ liệu là việc ngốn thời gian bậc nhất với người làm văn
            phòng. Bài này biến nó thành một cuộc hội thoại 5 phút với AI.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ========================================================= */}
      {/* BƯỚC 2, VÌ SAO ĐÁNG HỌC                                   */}
      {/* ========================================================= */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Bối cảnh">
        <p>
          Dữ liệu bẩn không phải do ai đó cẩu thả. File xuất từ phần mềm bán
          hàng, danh sách nhiều người cùng gõ tay, bảng dán từ web hay email:
          mỗi nguồn mang theo một kiểu lỗi riêng. Gặp nhiều nhất là{" "}
          <strong>5 lỗi kinh điển</strong>: khoảng trắng thừa, HOA thường lộn
          xộn, ngày tháng lẫn định dạng, số điện thoại mất số 0 đầu, và dòng
          trùng lặp.
        </p>
        <p>
          Sửa tay 2.000 dòng thì mất buổi sáng và vẫn sót. Trong khi đó Excel
          đã có sẵn công cụ cho từng lỗi, vấn đề chỉ là bạn không nhớ tên hàm
          và cú pháp. Đó chính xác là chỗ AI hữu ích nhất:{" "}
          <strong>bạn mô tả lỗi, AI trả về đúng công thức và các bước bấm</strong>.
        </p>
        <Callout variant="insight" title="AI là thợ viết công thức">
          Đừng coi AI như người sửa file hộ. Hãy coi nó như đồng nghiệp thuộc
          lòng mọi hàm Excel: đưa mẫu lỗi, nhận công cụ, còn tay cầm chuột vẫn
          là bạn.
        </Callout>
      </LessonSection>

      {/* ========================================================= */}
      {/* BƯỚC 3, MINH HỌA TƯƠNG TÁC                                */}
      {/* ========================================================= */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-8">
            <div>
              <h3 className="mb-1 flex items-center gap-2 text-base font-semibold text-foreground">
                <Table2 className="h-4 w-4 text-accent" />
                Thí nghiệm: dọn bảng khách hàng bằng 5 phép sửa
              </h3>
              <p className="mb-3 text-sm text-muted">
                Bảng dưới chứa đủ 5 lỗi kinh điển. Bấm từng nút để áp phép sửa
                AI gợi ý và xem bảng đổi theo. Thử bấm &ldquo;Dòng trùng
                lặp&rdquo; trước khi TRIM để thấy một cái bẫy có thật.
              </p>
              <ExcelCleaningDemo />
            </div>

            <div>
              <h3 className="mb-1 flex items-center gap-2 text-base font-semibold text-foreground">
                <Sparkles className="h-4 w-4 text-accent" />
                Cách hỏi quyết định câu trả lời
              </h3>
              <p className="mb-3 text-sm text-muted">
                AI không mở được file trên máy bạn. Nó chỉ biết những gì bạn
                dán vào cuộc trò chuyện.
              </p>
              <PromptCompareDemo />
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ========================================================= */}
      {/* BƯỚC 4, CỐT LÕI                                           */}
      {/* ========================================================= */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Cốt lõi">
        <AhaMoment>
          Đừng nhờ AI <strong>sửa cả file</strong>. Hãy nhờ AI{" "}
          <strong>viết công cụ sửa</strong>: đưa 5-10 dòng mẫu, nhận về công
          thức hoặc các bước bấm menu, rồi chính bạn áp dụng trên một bản sao.
          Dữ liệu không rời khỏi máy, và mọi thay đổi đều kiểm tra lại được.
        </AhaMoment>
      </LessonSection>

      {/* ========================================================= */}
      {/* BƯỚC 5, THỬ NHANH                                         */}
      {/* ========================================================= */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Cột số điện thoại bị mất số 0 đầu (912345678 thay vì 0912345678) vì Excel coi đó là số. Công thức nào sửa đúng?"
          options={[
            "=D2+0, cộng thêm 0 để Excel tính lại",
            '=TEXT(D2,"0000000000"), ép về chuỗi đủ 10 chữ số',
            "Đổi font chữ của cột sang font khác",
            "=TRIM(D2), bỏ khoảng trắng là số 0 hiện lại",
          ]}
          correct={1}
          explanation="Vấn đề nằm ở kiểu dữ liệu: với kiểu Số thì 0912345678 và 912345678 là một. =D2+0 vẫn cho ra số, TRIM chỉ xử lý khoảng trắng. TEXT với định dạng mười chữ số 0 ép giá trị thành chuỗi 10 ký tự nên số 0 đầu quay lại."
        />
      </LessonSection>

      {/* ========================================================= */}
      {/* BƯỚC 6, GIẢI THÍCH SÂU                                    */}
      {/* ========================================================= */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích">
        <ExplanationSection>
          <p>
            Quy trình an toàn gồm <strong>5 bước</strong>, dùng được cho mọi
            file:
          </p>
          <ol className="list-decimal list-inside space-y-2 pl-2">
            <li>
              <strong>Sao lưu:</strong> nhân bản file, làm việc trên bản sao.
              Mọi bước sau đều có đường lùi.
            </li>
            <li>
              <strong>Đưa mẫu cho AI:</strong> dán 5-10 dòng, mô tả từng cột
              (cột B là gì, cột C là gì) và liệt kê lỗi bạn nhìn thấy. Dữ liệu
              nhạy cảm thì thay bằng dữ liệu giả cùng định dạng lỗi.
            </li>
            <li>
              <strong>Xin công thức kèm giải thích:</strong> yêu cầu AI giải
              thích từng hàm một câu. Bạn sửa được file hôm nay và tự sửa được
              lần sau.
            </li>
            <li>
              <strong>Thử trên 5 dòng:</strong> áp công thức vào một cột phụ,
              so tay kết quả của 5 dòng đầu trước khi kéo cho cả cột.
            </li>
            <li>
              <strong>Áp dụng và cố định:</strong> kéo công thức hết cột, rồi
              Copy → Paste Values đè lên cột cũ để giá trị sạch thay công thức.
              Lưu bản sạch với tên mới.
            </li>
          </ol>

          <CodeBlock language="text" title="Prompt mẫu hoàn chỉnh (thay phần trong ngoặc vuông)">
            {`Tôi có bảng khách hàng trong Excel. Cột B: họ tên, cột C: ngày sinh,
cột D: số điện thoại. Đây là 10 dòng mẫu:
[dán 10 dòng]

Các lỗi tôi thấy: tên lúc viết hoa lúc thường và thừa khoảng trắng,
ngày sinh lẫn kiểu 15/03/1990 với 1990-03-15, số điện thoại mất số 0
đầu, có dòng bị trùng.

Cho tôi công thức Excel sửa từng lỗi, kèm giải thích ngắn từng hàm.
Việc nào làm bằng menu nhanh hơn thì chỉ các bước bấm. Tôi dùng Excel
trên Windows. Nên làm các bước theo thứ tự nào thì nói rõ.`}
          </CodeBlock>

          <div className="mt-4">
            <Callout
              variant="warning"
              title="Dữ liệu khách hàng là dữ liệu cá nhân"
            >
              Tên thật kèm số điện thoại, ngày sinh, địa chỉ là thông tin cá
              nhân của khách. Đừng dán nguyên cột lên chatbot công cộng. Thứ AI
              cần là <strong>hình dạng của lỗi</strong>, không phải con số
              thật: lấy vài dòng và thay bằng tên giả, số giả giữ nguyên kiểu
              lỗi (vd 912345678 thành 913000111). Công thức nhận về dùng cho
              dữ liệu thật y hệt.
            </Callout>
          </div>

          <div className="mt-4">
            <Callout variant="tip" title="File lớn hoặc việc lặp lại hằng tuần">
              Báo cáo tuần nào cũng phải dọn lại từ đầu? Hỏi AI các bước làm
              trong Power Query (Get &amp; Transform, có sẵn trong Excel).
              Thiết lập một lần, tuần sau chỉ bấm Refresh là dữ liệu mới được
              dọn theo đúng các bước cũ.
            </Callout>
          </div>

          <div className="mt-6">
            <h3 className="mb-3 text-base font-semibold text-foreground">
              3 tình huống văn phòng điển hình
            </h3>
            <TabView
              tabs={[
                {
                  label: "Danh bạ khách hàng",
                  content: (
                    <div className="space-y-3 text-sm">
                      <p className="text-foreground">
                        <strong>Tình huống:</strong> 3 nhân viên cùng nhập
                        khách, mỗi người một kiểu viết tên và SĐT.
                      </p>
                      <div className="rounded-lg bg-surface p-3">
                        <p className="mb-1 text-xs font-semibold text-muted">
                          Prompt
                        </p>
                        <p className="text-xs italic text-foreground">
                          &ldquo;Cột A tên, cột B SĐT. Mẫu: [5 dòng]. Chuẩn hóa
                          tên về dạng viết hoa chữ đầu, SĐT về 10 số bắt đầu
                          bằng 0. Cho công thức từng cột và thứ tự làm.&rdquo;
                        </p>
                      </div>
                    </div>
                  ),
                },
                {
                  label: "Gộp báo cáo chi nhánh",
                  content: (
                    <div className="space-y-3 text-sm">
                      <p className="text-foreground">
                        <strong>Tình huống:</strong> 4 chi nhánh gửi file, mỗi
                        nơi một định dạng ngày.
                      </p>
                      <div className="rounded-lg bg-surface p-3">
                        <p className="mb-1 text-xs font-semibold text-muted">
                          Prompt
                        </p>
                        <p className="text-xs italic text-foreground">
                          &ldquo;Cột ngày có các kiểu: 15/03/2026, 2026-03-15,
                          15.3.26. Mẫu: [8 dòng]. Đưa các bước Text to Columns
                          hoặc công thức để tất cả về dd/mm/yyyy, kèm cách kiểm
                          tra ô nào chưa chuyển được.&rdquo;
                        </p>
                      </div>
                    </div>
                  ),
                },
                {
                  label: "File chấm công",
                  content: (
                    <div className="space-y-3 text-sm">
                      <p className="text-foreground">
                        <strong>Tình huống:</strong> máy chấm công xuất giờ
                        dạng chữ (8h05, 08:5, 8.05) nên không tính được tổng
                        giờ.
                      </p>
                      <div className="rounded-lg bg-surface p-3">
                        <p className="mb-1 text-xs font-semibold text-muted">
                          Prompt
                        </p>
                        <p className="text-xs italic text-foreground">
                          &ldquo;Cột giờ vào dạng text: [10 dòng mẫu]. Cho công
                          thức đưa hết về kiểu giờ hh:mm để trừ được giờ ra trừ
                          giờ vào, và cách phát hiện ô lỗi còn sót.&rdquo;
                        </p>
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          </div>

          <Callout variant="insight" title="Quy tắc S-M-T-A">
            <strong>S</strong>ao lưu → <strong>M</strong>ẫu cho AI →{" "}
            <strong>T</strong>hử 5 dòng → <strong>A</strong>p dụng cả cột. Lỗi
            nặng nhất trong dọn dữ liệu không phải công thức sai, mà là công
            thức sai được áp thẳng lên bản gốc.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ========================================================= */}
      {/* BƯỚC 7, TÓM TẮT                                           */}
      {/* ========================================================= */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ khi nhờ AI dọn dữ liệu Excel"
          points={[
            "AI là thợ viết công thức: đưa 5-10 dòng mẫu và mô tả lỗi, nhận về TRIM, PROPER, TEXT và các bước menu.",
            "5 lỗi kinh điển: khoảng trắng thừa, HOA thường lộn xộn, ngày lẫn định dạng, SĐT mất số 0 đầu, dòng trùng lặp.",
            "Thứ tự có ý nghĩa: TRIM trước rồi mới Remove Duplicates, vì Excel phân biệt khoảng trắng khi so trùng.",
            "SĐT mất số 0 là lỗi kiểu dữ liệu: =TEXT(D2,\"0000000000\") ép về chuỗi 10 ký tự.",
            "Luôn làm trên bản sao, thử 5 dòng trước khi áp cả cột, và không dán dữ liệu khách thật lên chatbot công cộng.",
          ]}
        />

        <div className="mt-4 rounded-xl border border-border bg-card p-5 space-y-2">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ListChecks className="h-4 w-4 text-accent" />
            Khám phá thêm
          </h4>
          <p className="text-sm leading-relaxed text-muted">
            Dữ liệu sạch rồi thì phân tích thôi:{" "}
            <TopicLink slug="ai-for-data-analysis">
              AI phân tích bảng tính và biểu đồ
            </TopicLink>
            . Hay phải điền biểu mẫu, công văn? Xem{" "}
            <TopicLink slug="ai-for-paperwork">
              AI điền form và giấy tờ
            </TopicLink>
            . Muốn hỏi AI khéo hơn nữa? Qua{" "}
            <TopicLink slug="prompt-engineering">
              kỹ thuật viết prompt
            </TopicLink>
            .
          </p>
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-border bg-surface/50 p-5 space-y-2">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <PenLine className="h-4 w-4 text-accent" />
            Bài tập về nhà (tùy chọn)
          </h4>
          <p className="text-sm leading-relaxed text-muted">
            Mở một file dữ liệu thật bạn từng phải dọn tay. Nhân bản file, chọn
            ra 10 dòng lỗi (thay số nhạy cảm bằng số giả), chạy quy trình
            S-M-T-A với chatbot bạn có. Ghi lại: mấy phút xong việc, và công
            thức nào bạn sẽ nhớ để lần sau không cần hỏi lại.
          </p>
        </div>
      </LessonSection>

      {/* ========================================================= */}
      {/* BƯỚC 8, KIỂM TRA                                          */}
      {/* ========================================================= */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
