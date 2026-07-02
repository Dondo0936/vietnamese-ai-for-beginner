"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  MessageSquare,
  Sparkles,
  Check,
  AlertTriangle,
  ShieldAlert,
  ListChecks,
  Eye,
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
  slug: "ai-for-paperwork",
  title: "AI for Paperwork",
  titleVi: "AI điền form và giấy tờ",
  description:
    "Đưa mẫu đơn và dữ kiện cho AI để có bản nháp đúng khuôn, chặn thói quen tự bịa và che thông tin nhạy cảm trước khi gửi.",
  category: "applied-ai",
  tags: ["paperwork", "forms", "practical", "office", "privacy"],
  difficulty: "beginner",
  relatedSlugs: [
    "getting-started-with-ai",
    "ai-for-excel-cleaning",
    "ai-for-writing",
  ],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

// ============================================================================
// DEMO 1, Xây prompt điền đơn từ 4 nguyên liệu
// ============================================================================

type Ingredient = "mau" | "thongTin" | "giong" | "luat";

const INGREDIENTS: {
  key: Ingredient;
  label: string;
  detail: string;
}[] = [
  {
    key: "mau",
    label: "Mẫu đơn gốc",
    detail: "Dán nguyên văn mẫu đơn của công ty vào cuộc trò chuyện",
  },
  {
    key: "thongTin",
    label: "Dữ kiện của bạn",
    detail: "Họ tên, phòng ban, ngày nghỉ, lý do, người bàn giao",
  },
  {
    key: "giong",
    label: "Yêu cầu giọng điệu",
    detail: "Trang trọng, xưng Tôi, đúng kiểu văn bản hành chính",
  },
  {
    key: "luat",
    label: "Luật chống bịa",
    detail: "Chỗ nào thiếu thông tin thì ghi [CẦN BỔ SUNG], không tự đoán",
  },
];

function PromptBuilderDemo() {
  const [on, setOn] = useState<Record<Ingredient, boolean>>({
    mau: true,
    thongTin: false,
    giong: false,
    luat: false,
  });

  const count = useMemo(
    () => Object.values(on).filter(Boolean).length,
    [on]
  );

  function toggle(key: Ingredient) {
    setOn((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // Ba trạng thái của từng dòng trong bản nháp AI trả về:
  //  - thongTin bật  -> AI dùng dữ kiện thật bạn đưa (xanh, đáng tin)
  //  - thongTin tắt + luat bật  -> AI chừa chỗ trống [CẦN BỔ SUNG] (vàng, an toàn)
  //  - thongTin tắt + luat tắt  -> AI tự đoán một giá trị nghe hợp lý (đỏ, nguy hiểm)
  type FieldState = "real" | "gap" | "invented";
  const fieldState: FieldState = on.thongTin
    ? "real"
    : on.luat
      ? "gap"
      : "invented";

  const fields: { label: string; real: string; invented: string }[] = [
    { label: "Họ và tên", real: "Nguyễn Văn An", invented: "Nguyễn Văn A" },
    { label: "Phòng ban", real: "Phòng Kinh doanh", invented: "Phòng Hành chính" },
    { label: "Nghỉ từ ngày", real: "14/07 đến 16/07", invented: "01/07 đến 03/07" },
    { label: "Lý do", real: "Giải quyết việc gia đình", invented: "Nghỉ ốm" },
  ];

  const promptLines = [
    on.mau && "Đây là mẫu đơn xin nghỉ phép của công ty tôi: [dán mẫu đơn]",
    on.thongTin &&
      "Thông tin của tôi: Nguyễn Văn An, phòng Kinh doanh, nghỉ 14/07 đến 16/07, lý do việc gia đình.",
    on.giong && "Viết giọng trang trọng, xưng Tôi, đúng văn bản hành chính.",
    on.luat &&
      "Chỗ nào mẫu đơn cần mà tôi chưa cung cấp thì ghi [CẦN BỔ SUNG] và liệt kê ở cuối, tuyệt đối không tự đoán.",
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-4">
      {/* 4 nguyên liệu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {INGREDIENTS.map((ing) => {
          const active = on[ing.key];
          return (
            <button
              key={ing.key}
              type="button"
              onClick={() => toggle(ing.key)}
              aria-pressed={active}
              className={`rounded-xl border p-3 text-left transition-colors ${
                active
                  ? "border-accent bg-accent-light/60"
                  : "border-border bg-card hover:bg-surface"
              }`}
            >
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                    active
                      ? "border-accent bg-accent text-white"
                      : "border-border bg-surface text-muted"
                  }`}
                >
                  {active ? <Check className="h-3.5 w-3.5" /> : null}
                </span>
                {ing.label}
              </p>
              <p className="mt-1 text-xs text-muted">{ing.detail}</p>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2">
        <MetricReadout label="Nguyên liệu đã đưa cho AI" value={count} unit="/ 4" />
        <button
          type="button"
          onClick={() =>
            setOn({ mau: true, thongTin: false, giong: false, luat: false })
          }
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted hover:bg-surface transition-colors"
        >
          Đặt lại
        </button>
      </div>

      {/* Prompt ghép được */}
      <div className="rounded-xl border border-accent/40 bg-accent-light/40 p-4">
        <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent">
          <MessageSquare className="h-4 w-4" /> Prompt (câu lệnh) bạn gửi đi
        </p>
        {promptLines.length ? (
          <ul className="space-y-1.5">
            {promptLines.map((line) => (
              <li key={line} className="text-sm text-foreground">
                {line}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm italic text-muted">
            Chưa có nguyên liệu nào. AI sẽ phải tự chế mọi thứ.
          </p>
        )}
      </div>

      {/* Bản nháp AI trả về */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent">
          <Sparkles className="h-4 w-4" /> Bản nháp AI trả về
        </p>

        {!on.mau && (
          <p className="flex items-start gap-2 rounded-lg bg-amber-100 dark:bg-amber-900/20 p-3 text-sm text-foreground">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" />
            Không có mẫu gốc nên AI tự chế bố cục. Đơn trông ổn nhưng lệch hẳn
            biểu mẫu công ty bạn, kiểu gì cũng phải làm lại.
          </p>
        )}

        <p className="text-sm text-muted">
          {on.giong
            ? "Kính gửi Ban Giám đốc và Trưởng phòng Nhân sự,"
            : "Chào anh chị,"}
        </p>

        <div className="space-y-1.5">
          <AnimatePresence initial={false} mode="popLayout">
            {fields.map((f) => (
              <motion.div
                key={`${f.label}-${fieldState}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${
                  fieldState === "real"
                    ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10"
                    : fieldState === "gap"
                      ? "border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10"
                      : "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/10"
                }`}
              >
                <span className="text-xs font-medium text-muted">{f.label}</span>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  {fieldState === "real" && (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
                      {f.real}
                    </>
                  )}
                  {fieldState === "gap" && (
                    <>
                      <PenLine className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
                      [CẦN BỔ SUNG]
                    </>
                  )}
                  {fieldState === "invented" && (
                    <>
                      <AlertTriangle className="h-3.5 w-3.5 text-red-700 dark:text-red-400" />
                      {f.invented}
                    </>
                  )}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {fieldState === "invented" && (
          <p className="flex items-start gap-2 text-xs text-foreground">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-700 dark:text-red-400" />
            <span>
              <strong>Toàn bộ giá trị trên là AI tự đoán.</strong> Không có dữ
              kiện, mô hình vẫn sinh chữ trôi chảy, gọi là bịa thông tin
              (hallucination). Tên sai, phòng sai, ngày sai, mà đọc lướt thì
              không nhận ra.
            </span>
          </p>
        )}
        {fieldState === "gap" && (
          <p className="flex items-start gap-2 text-xs text-foreground">
            <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-700 dark:text-emerald-400" />
            <span>
              Luật chống bịa biến chỗ AI định đoán thành chỗ trống nhìn thấy
              được. Bạn chỉ việc điền nốt, không phải dò xem nó bịa ở đâu.
            </span>
          </p>
        )}
        {fieldState === "real" && (
          <p className="flex items-start gap-2 text-xs text-foreground">
            <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-700 dark:text-emerald-400" />
            <span>
              Đủ dữ kiện nên bản nháp dùng đúng thông tin của bạn. Vẫn đọc soát
              lại lần cuối trước khi gửi.
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// DEMO 2, Che thông tin nhạy cảm trước khi gửi
// ============================================================================

function MaskingDemo() {
  const rows: { label: string; real: string; masked: string; sensitive: boolean }[] = [
    { label: "Họ và tên", real: "Trần Thị Bích Hạnh", masked: "[HỌ TÊN]", sensitive: false },
    { label: "Số CCCD", real: "079123456789", masked: "[SỐ CCCD]", sensitive: true },
    { label: "Số điện thoại", real: "0912345678", masked: "[SĐT]", sensitive: true },
    { label: "Số tài khoản", real: "19036512345678", masked: "[SỐ TÀI KHOẢN]", sensitive: true },
    { label: "Nội dung cần khai", real: "Đăng ký nhận lương qua tài khoản", masked: "Đăng ký nhận lương qua tài khoản", sensitive: false },
  ];

  const card = (masked: boolean) => (
    <div
      className={`rounded-lg border p-4 space-y-2 ${
        masked
          ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10"
          : "border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10"
      }`}
    >
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground">
        {masked ? (
          <Check className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
        ) : (
          <ShieldAlert className="h-4 w-4 text-red-700 dark:text-red-400" />
        )}
        {masked ? "Bản gửi cho AI" : "Tờ khai gốc"}
      </p>
      <dl className="space-y-1.5">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center justify-between gap-3 rounded bg-surface px-3 py-1.5"
          >
            <dt className="text-xs text-muted">{r.label}</dt>
            <dd
              className={`text-sm font-mono ${
                masked && r.real !== r.masked
                  ? "font-semibold text-emerald-800 dark:text-emerald-300"
                  : "text-foreground"
              }`}
            >
              {masked ? r.masked : r.real}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-[11px] text-muted">
        {masked
          ? "AI vẫn điền được vì nó chỉ cần cấu trúc, không cần con số thật. Nhận bản nháp xong, bạn tự thay số thật trên máy mình."
          : "Dán nguyên bản này vào chatbot công cộng là trao số CCCD, SĐT và tài khoản cho một dịch vụ bên ngoài công ty."}
      </p>
    </div>
  );

  return (
    <ToggleCompare
      labelA="Tờ khai gốc (đừng gửi)"
      labelB="Bản đã che (an toàn)"
      description="Cùng một tờ khai, hai cách đưa cho AI. Bật qua lại để so sánh."
      childA={card(false)}
      childB={card(true)}
    />
  );
}

// ============================================================================
// QUIZ
// ============================================================================

const quizQuestions: QuizQuestion[] = [
  {
    question: "Vì sao AI hay bịa thông tin khi điền form?",
    options: [
      "Vì AI cố tình đánh lừa người dùng",
      "Vì mô hình sinh chữ theo khuôn mẫu quen thuộc, không tra cứu được sự thật về bạn",
      "Vì form tiếng Việt quá khó với AI",
      "Vì AI chỉ đọc được tiếng Anh",
    ],
    correct: 1,
    explanation:
      "Mô hình ngôn ngữ dự đoán chữ tiếp theo cho trôi chảy. Thiếu dữ kiện thì nó điền một giá trị nghe hợp lý thay vì dừng lại, trừ khi bạn ra luật bắt nó chừa trống.",
  },
  {
    question: "Thứ tự đúng của quy trình điền giấy tờ bằng AI là gì?",
    options: [
      "Đưa dữ kiện, soát lại, đưa mẫu, ra luật",
      "Đưa mẫu đơn, đưa dữ kiện, ra luật chống bịa, tự soát từng dòng",
      "Ra luật, soát lại, đưa mẫu, đưa dữ kiện",
      "Đưa mẫu đơn rồi gửi luôn, AI tự lo phần còn lại",
    ],
    correct: 1,
    explanation:
      "Mẫu cho AI đúng khuôn, dữ kiện cho AI đúng nội dung, luật chống bịa chặn chỗ thiếu, và bước soát tay cuối cùng là thứ không bao giờ được bỏ.",
  },
  {
    question:
      "Thông tin nào KHÔNG nên dán thẳng vào chatbot công cộng khi nhờ điền tờ khai?",
    options: [
      "Tên phòng ban của bạn",
      "Cấu trúc các mục trong tờ khai",
      "Số CCCD và số tài khoản thật",
      "Lý do xin nghỉ phép",
    ],
    correct: 2,
    explanation:
      "Số định danh và tài khoản là dữ liệu nhạy cảm. Thay bằng [SỐ CCCD], [SỐ TÀI KHOẢN] khi gửi, nhận bản nháp về rồi tự điền số thật trên máy mình.",
  },
  {
    question:
      "Bạn nhờ AI soạn hợp đồng thuê dịch vụ có giá trị pháp lý. Cách dùng đúng là gì?",
    options: [
      "Dùng bản AI soạn luôn vì ngôn ngữ đã rất chuẩn",
      "Coi bản AI là nháp tham khảo, người có chuyên môn pháp lý duyệt trước khi ký",
      "Nhờ một AI khác kiểm tra chéo là đủ",
      "Chỉ cần đọc lướt phần chữ ký",
    ],
    correct: 1,
    explanation:
      "Giấy tờ có hệ quả pháp lý luôn cần người có chuyên môn chịu trách nhiệm cuối. AI tăng tốc bản nháp, không thay được người duyệt.",
  },
];

// ============================================================================
// TOPIC
// ============================================================================

export default function AiForPaperworkTopic() {
  return (
    <>
      {/* ========================================================= */}
      {/* BƯỚC 1, DỰ ĐOÁN                                           */}
      {/* ========================================================= */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn đưa cho AI một mẫu đơn xin nghỉ phép và nhờ nó điền giúp. Chuyện gì sẽ xảy ra?"
          options={[
            "AI từ chối vì không được phép động vào giấy tờ cá nhân",
            "AI điền bản nháp rất nhanh, nhưng chỗ nào thiếu thông tin nó có thể tự bịa ra",
            "AI điền chính xác 100% vì đã thấy hàng triệu mẫu đơn tương tự",
          ]}
          correct={1}
          explanation="AI viết phần khuôn mẫu rất tốt, nhưng nó không biết gì về bạn. Thiếu dữ kiện thì mô hình có xu hướng đoán một giá trị nghe hợp lý. Bài này dạy cách đưa đủ nguyên liệu và ra luật chặn thói quen đoán đó."
        >
          <p className="mt-2 text-sm text-muted">
            Điền đơn từ, tờ khai, công văn là việc lặp đi lặp lại nhiều nhất ở
            văn phòng. Học cách giao đúng phần việc cho AI, bạn giữ lại phần
            quyết định.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ========================================================= */}
      {/* BƯỚC 2, VÌ SAO ĐÁNG HỌC                                   */}
      {/* ========================================================= */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Bối cảnh">
        <p>
          Đơn xin nghỉ phép, tờ trình, công văn trả lời đối tác, biểu mẫu nội
          bộ: tất cả đều có phần <strong>khuôn</strong> giống nhau và phần{" "}
          <strong>ruột</strong> là thông tin của riêng bạn. Ngôn ngữ giấy tờ
          nặng về khuôn, và khuôn là thứ mô hình ngôn ngữ viết giỏi nhất, vì nó
          đã đọc rất nhiều văn bản cùng dạng.
        </p>
        <p>
          Nhưng AI thiếu đúng hai thứ quan trọng nhất của một tờ giấy tờ:{" "}
          <strong>sự thật về bạn</strong> (tên, ngày, số liệu) và{" "}
          <strong>trách nhiệm</strong> khi tờ giấy được nộp đi. Hai thứ đó vẫn
          thuộc về bạn. Toàn bộ kỹ thuật của bài này xoay quanh việc bù hai chỗ
          thiếu đó một cách có hệ thống.
        </p>
        <Callout variant="insight" title="Phân công đúng việc">
          AI lo phần khuôn: bố cục, câu chữ trang trọng, đúng thể thức. Bạn lo
          phần ruột: dữ kiện đúng và quyết định cuối cùng. Đảo ngược phân công
          này là nguồn gốc của mọi rắc rối.
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
                <FileText className="h-4 w-4 text-accent" />
                Thí nghiệm: bật tắt 4 nguyên liệu của một prompt điền đơn
              </h3>
              <p className="mb-3 text-sm text-muted">
                Xem bản nháp AI trả về thay đổi thế nào theo thứ bạn cung cấp.
                Chú ý điều xảy ra khi thiếu dữ kiện: có luật chống bịa và không
                có luật chống bịa.
              </p>
              <PromptBuilderDemo />
            </div>

            <div>
              <h3 className="mb-1 flex items-center gap-2 text-base font-semibold text-foreground">
                <Eye className="h-4 w-4 text-accent" />
                Che thông tin nhạy cảm trước khi gửi
              </h3>
              <p className="mb-3 text-sm text-muted">
                AI không cần số thật để điền đúng khuôn. Nó chỉ cần biết ô đó
                tồn tại.
              </p>
              <MaskingDemo />
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ========================================================= */}
      {/* BƯỚC 4, CỐT LÕI                                           */}
      {/* ========================================================= */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Cốt lõi">
        <AhaMoment>
          AI điền form giỏi vì ngôn ngữ giấy tờ có khuôn mẫu, nhưng nó{" "}
          <strong>không hề biết sự thật về bạn</strong>. Chất lượng bản điền
          phụ thuộc vào nguyên liệu bạn đưa: mẫu đơn gốc, dữ kiện đúng, và một
          câu luật buộc AI <strong>chừa trống thay vì tự đoán</strong> chỗ nó
          không biết.
        </AhaMoment>
      </LessonSection>

      {/* ========================================================= */}
      {/* BƯỚC 5, THỬ NHANH                                         */}
      {/* ========================================================= */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Bạn nhờ AI điền tờ khai gửi phòng nhân sự nhưng chưa nhớ mã số nhân viên của mình. Cách xử lý đúng nhất?"
          options={[
            "Cứ để AI điền, mã số nhân viên thường theo định dạng chung nên nó đoán được",
            "Yêu cầu AI ghi [CẦN BỔ SUNG] ở ô mã số, rồi tự tra và điền tay sau",
            "Bịa tạm một mã số cho đủ ô, in ra rồi sửa bút sau",
            "Xóa luôn ô mã số khỏi tờ khai cho nhanh",
          ]}
          correct={1}
          explanation="Mã số nhân viên là dữ kiện chỉ bạn (hoặc phòng nhân sự) có. AI đoán kiểu gì cũng sai, và sai kiểu khó nhìn ra. Chỗ trống nhìn thấy được luôn an toàn hơn một con số bịa trông có vẻ đúng."
        />
      </LessonSection>

      {/* ========================================================= */}
      {/* BƯỚC 6, GIẢI THÍCH SÂU                                    */}
      {/* ========================================================= */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích">
        <ExplanationSection>
          <p>
            Quy trình chuẩn gồm <strong>4 bước theo đúng thứ tự</strong>. Mỗi
            bước bù một chỗ thiếu của AI:
          </p>
          <ol className="list-decimal list-inside space-y-2 pl-2">
            <li>
              <strong>Đưa mẫu:</strong> dán nguyên văn mẫu đơn, hoặc đính kèm
              ảnh chụp, file PDF của biểu mẫu. Các chatbot phổ biến (ChatGPT,
              Claude, Gemini, Copilot) đều đọc được ảnh và PDF. Không có mẫu,
              AI tự chế bố cục và bạn phải làm lại.
            </li>
            <li>
              <strong>Đưa dữ kiện:</strong> liệt kê gạch đầu dòng mọi thông tin
              cần điền: họ tên, phòng ban, ngày, số liệu, người liên quan. AI
              chỉ dùng được thứ bạn cung cấp trong cuộc trò chuyện.
            </li>
            <li>
              <strong>Ra luật chống bịa:</strong> thêm câu &ldquo;chỗ nào thiếu
              thông tin thì ghi [CẦN BỔ SUNG] và liệt kê ở cuối, không tự
              đoán&rdquo;. Câu này biến lỗi khó thấy (thông tin bịa) thành việc
              dễ làm (điền nốt chỗ trống).
            </li>
            <li>
              <strong>Soát từng dòng:</strong> đọc bản nháp như đang soát bài
              của một thực tập sinh mới: nhanh, chăm, nhưng chưa hiểu công ty.
              Số liệu, ngày tháng và tên riêng là ba chỗ sai nhiều nhất.
            </li>
          </ol>

          <CodeBlock language="text" title="Prompt mẫu hoàn chỉnh (thay phần trong ngoặc vuông)">
            {`Đây là mẫu đơn xin nghỉ phép của công ty tôi:
[dán nguyên văn mẫu đơn]

Thông tin của tôi:
- Họ tên: Nguyễn Văn An, phòng Kinh doanh
- Nghỉ từ 14/07 đến 16/07, lý do: giải quyết việc gia đình
- Người nhận bàn giao: Trần Thị Bình

Hãy điền hoàn chỉnh theo giọng trang trọng, xưng Tôi.
Chỗ nào mẫu đơn yêu cầu mà tôi chưa cung cấp thì ghi [CẦN BỔ SUNG]
và liệt kê các chỗ đó ở cuối, tuyệt đối không tự đoán.`}
          </CodeBlock>

          <div className="mt-4">
            <Callout
              variant="warning"
              title="Dữ liệu nhạy cảm, ĐỌC TRƯỚC KHI DÁN"
            >
              <div className="space-y-2">
                <p>
                  <strong>Không dán vào chatbot công cộng:</strong> số CCCD, số
                  tài khoản, mã số thuế cá nhân, lương, thông tin sức khỏe.
                  Nhiều chatbot miễn phí có thể dùng nội dung hội thoại để huấn
                  luyện, tùy cài đặt tài khoản. Cứ coi mọi thứ đã dán là có thể
                  được lưu lại.
                </p>
                <p>
                  <strong>Cách làm an toàn:</strong> thay số thật bằng
                  [SỐ CCCD], [SỐ TÀI KHOẢN] như demo ở trên, nhận bản nháp rồi
                  tự thay số thật trên máy mình. Công ty có bản doanh nghiệp
                  (ChatGPT Business, Claude for Work, Microsoft 365 Copilot) thì
                  ưu tiên dùng, vì có cam kết không dùng dữ liệu để huấn luyện.
                </p>
              </div>
            </Callout>
          </div>

          <div className="mt-4">
            <Callout variant="info" title="Giấy tờ có tính pháp lý">
              Hợp đồng, hồ sơ thuế, giấy tờ bảo hiểm: AI chỉ nên là bản nháp
              tham khảo. Người có chuyên môn (kế toán, pháp chế, nhân sự) duyệt
              và chịu trách nhiệm bản cuối. Đây không phải giới hạn kỹ thuật mà
              là nguyên tắc trách nhiệm.
            </Callout>
          </div>

          <div className="mt-6">
            <h3 className="mb-3 text-base font-semibold text-foreground">
              3 tình huống văn phòng điển hình
            </h3>
            <TabView
              tabs={[
                {
                  label: "Đơn xin nghỉ",
                  content: (
                    <div className="space-y-3 text-sm">
                      <p className="text-foreground">
                        <strong>Tình huống:</strong> nghỉ 3 ngày, cần đơn đúng
                        mẫu công ty trước 17h.
                      </p>
                      <div className="rounded-lg bg-surface p-3">
                        <p className="mb-1 text-xs font-semibold text-muted">
                          Prompt
                        </p>
                        <p className="text-xs italic text-foreground">
                          &ldquo;Đây là mẫu đơn của công ty tôi: [dán mẫu].
                          Điền giúp tôi: [dữ kiện]. Giọng trang trọng. Thiếu gì
                          ghi [CẦN BỔ SUNG], không tự đoán.&rdquo;
                        </p>
                      </div>
                    </div>
                  ),
                },
                {
                  label: "Công văn trả lời",
                  content: (
                    <div className="space-y-3 text-sm">
                      <p className="text-foreground">
                        <strong>Tình huống:</strong> đối tác gửi công văn hỏi
                        tiến độ, cần thư trả lời đúng thể thức.
                      </p>
                      <div className="rounded-lg bg-surface p-3">
                        <p className="mb-1 text-xs font-semibold text-muted">
                          Prompt
                        </p>
                        <p className="text-xs italic text-foreground">
                          &ldquo;Đây là công văn tôi nhận được: [dán]. Soạn thư
                          trả lời theo thể thức công văn, ý chính: [3 gạch đầu
                          dòng]. Chỗ nào cần số liệu tôi chưa đưa thì ghi [CẦN
                          BỔ SUNG].&rdquo;
                        </p>
                      </div>
                    </div>
                  ),
                },
                {
                  label: "Tờ trình",
                  content: (
                    <div className="space-y-3 text-sm">
                      <p className="text-foreground">
                        <strong>Tình huống:</strong> xin mua 2 màn hình cho
                        team, cần tờ trình có lý do và dự toán.
                      </p>
                      <div className="rounded-lg bg-surface p-3">
                        <p className="mb-1 text-xs font-semibold text-muted">
                          Prompt
                        </p>
                        <p className="text-xs italic text-foreground">
                          &ldquo;Soạn tờ trình theo mẫu: [dán mẫu]. Đề xuất mua
                          2 màn hình Dell 24 inch, đơn giá 3,2 triệu, lý do:
                          [gạch đầu dòng]. Phần phê duyệt để trống.&rdquo;
                        </p>
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          </div>

          <Callout variant="insight" title="Quy tắc M-D-L-S">
            <strong>M</strong>ẫu (đưa mẫu gốc) → <strong>D</strong>ữ kiện (liệt
            kê đủ) → <strong>L</strong>uật (cấm tự đoán) → <strong>S</strong>oát
            (đọc từng dòng). Bỏ bước nào, rủi ro nằm đúng ở bước đó.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ========================================================= */}
      {/* BƯỚC 7, TÓM TẮT                                           */}
      {/* ========================================================= */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ khi nhờ AI điền giấy tờ"
          points={[
            "AI giỏi phần khuôn (bố cục, câu chữ trang trọng), bạn giữ phần ruột (dữ kiện thật và quyết định cuối).",
            "Thiếu dữ kiện thì AI đoán, gọi là bịa thông tin (hallucination). Luật [CẦN BỔ SUNG] biến chỗ đoán thành chỗ trống nhìn thấy được.",
            "Quy trình M-D-L-S: đưa Mẫu, đưa Dữ kiện, ra Luật chống bịa, Soát từng dòng.",
            "Che số CCCD, tài khoản, mã số thuế bằng [PLACEHOLDER] trước khi dán vào chatbot công cộng, tự thay số thật sau.",
            "Giấy tờ pháp lý: AI là nháp, người có chuyên môn duyệt bản cuối.",
          ]}
        />

        <div className="mt-4 rounded-xl border border-border bg-card p-5 space-y-2">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ListChecks className="h-4 w-4 text-accent" />
            Khám phá thêm
          </h4>
          <p className="text-sm leading-relaxed text-muted">
            Dữ liệu trong file Excel bừa bộn? Bài tiếp theo:{" "}
            <TopicLink slug="ai-for-excel-cleaning">
              AI làm sạch dữ liệu Excel
            </TopicLink>
            . Muốn viết câu lệnh chuẩn hơn? Xem{" "}
            <TopicLink slug="prompt-engineering">kỹ thuật viết prompt</TopicLink>
            . Mới bắt đầu với AI? Quay về{" "}
            <TopicLink slug="getting-started-with-ai">
              hướng dẫn bắt đầu
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
            Lấy một biểu mẫu thật bạn hay phải điền (đơn nghỉ phép, tờ trình,
            giấy đề nghị thanh toán). Che thông tin nhạy cảm, chạy đủ 4 bước
            M-D-L-S với chatbot bạn có. Đếm xem bản nháp đầu tiên có bao nhiêu
            chỗ [CẦN BỔ SUNG] và bao nhiêu chỗ bạn phải sửa: đó là thước đo
            prompt của bạn đã đủ nguyên liệu chưa.
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
