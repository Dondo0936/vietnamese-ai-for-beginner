"use client";

import { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  LaTeX,
  LessonSection,
  TopicLink,
  CollapsibleDetail,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// METADATA
// ─────────────────────────────────────────────────────────────────────────────
export const metadata: TopicMeta = {
  slug: "in-context-learning",
  title: "In-Context Learning",
  titleVi: "Học trong ngữ cảnh",
  description:
    "Khả năng LLM học và thực hiện tác vụ mới chỉ từ vài ví dụ trong prompt, không cần huấn luyện lại.",
  category: "llm-concepts",
  tags: ["icl", "few-shot", "zero-shot", "prompt"],
  difficulty: "beginner",
  relatedSlugs: ["prompt-engineering", "chain-of-thought", "fine-tuning-vs-prompting"],
  vizType: "interactive",
};

// ─────────────────────────────────────────────────────────────────────────────
// DỮ LIỆU DEMO — phân loại cảm xúc review tiếng Việt
// ─────────────────────────────────────────────────────────────────────────────
// Mỗi ví dụ có input (câu review) và output (nhãn cảm xúc mong muốn).
// Thứ tự các ví dụ đã được sắp xếp cố ý để "bao phủ" dần các class:
//   - Ví dụ 1: một class tích cực
//   - Ví dụ 2: thêm class tiêu cực
//   - Ví dụ 3: thêm class trung lập
//   - Các ví dụ tiếp theo: đa dạng hoá ngữ cảnh, edge-case
// Nhờ đó khi người học kéo thanh shot từ 0 → 8, họ thấy rõ cấu trúc prompt
// dần trở nên "đầy đủ thông tin" hơn.
const TASK_EXAMPLES: Array<{ input: string; output: string; note: string }> = [
  {
    input: "Tôi yêu Hà Nội!",
    output: "Tích cực",
    note: "Câu khen ngắn, cảm xúc rõ ràng — đây là 'neo' đầu tiên cho model.",
  },
  {
    input: "Dịch vụ quá tệ",
    output: "Tiêu cực",
    note: "Giới thiệu class tiêu cực — model hiểu bài toán có ít nhất 2 nhãn.",
  },
  {
    input: "Bình thường, không có gì đặc biệt",
    output: "Trung lập",
    note: "Class thứ ba xuất hiện — model biết đầu ra không chỉ nhị phân.",
  },
  {
    input: "Phở ở đây ngon nhất Sài Gòn!",
    output: "Tích cực",
    note: "Củng cố class tích cực với ngữ cảnh khác (ẩm thực).",
  },
  {
    input: "Chờ 45 phút mới có bàn, phục vụ chậm",
    output: "Tiêu cực",
    note: "Tiêu cực về dịch vụ, không phải về đồ ăn — giúp model tổng quát hoá.",
  },
  {
    input: "Giá hợp lý, không gian ổn, đồ ăn được",
    output: "Trung lập",
    note: "Nhiều tính từ 'vừa đủ' → trung lập — một mẫu tinh tế cho model.",
  },
  {
    input: "Món nào cũng dở, hối hận khi gọi nhiều",
    output: "Tiêu cực",
    note: "Từ 'hối hận' là tín hiệu mạnh — củng cố nhận diện sắc thái tiêu cực.",
  },
  {
    input: "Trải nghiệm tuyệt vời, sẽ quay lại!",
    output: "Tích cực",
    note: "Mẫu kết thúc bằng ý định quay lại — một tín hiệu tích cực điển hình.",
  },
];

// Input thử nghiệm — chứa cả tín hiệu tích cực (nhân viên) lẫn tiêu cực (đồ ăn).
// Đây là mẫu "khó" để thấy sự khác biệt rõ ràng giữa các mức shot.
const TEST_INPUT = "Nhân viên thân thiện nhưng đồ ăn hơi lạt";

// Bảng output mô phỏng cho mỗi mức shot (0, 1, 3, 8).
// Con số độ chính xác là con số minh hoạ giáo dục — phản ánh xu hướng đã được
// ghi nhận trong các nghiên cứu về ICL: tăng nhanh từ 0 → 3 shot rồi chậm lại.
type ShotOutput = {
  answer: string;
  confidence: number;
  reasoning: string;
  tokens: number;
  cost: number; // cent/request ước lượng
  latency: number; // ms
};

const AI_OUTPUTS: Record<number, ShotOutput> = {
  0: {
    answer:
      "Đây là một nhận xét về trải nghiệm ăn uống tại nhà hàng, có cả mặt tích cực và tiêu cực.",
    confidence: 22,
    reasoning:
      "Không có ví dụ → AI không biết bạn muốn output dạng gì (nhãn? câu trả lời dài? JSON?).",
    tokens: 35,
    cost: 0.2,
    latency: 420,
  },
  1: {
    answer: "Tích cực",
    confidence: 54,
    reasoning:
      "1 ví dụ chỉ cho model thấy duy nhất class 'Tích cực' → nó thiên lệch và đoán theo class đã gặp.",
    tokens: 70,
    cost: 0.35,
    latency: 480,
  },
  3: {
    answer: "Trung lập",
    confidence: 87,
    reasoning:
      "3 ví dụ phủ đủ 3 class → model phân biệt được sắc thái và hiểu format đầu ra là một nhãn duy nhất.",
    tokens: 140,
    cost: 0.62,
    latency: 560,
  },
  8: {
    answer: "Trung lập",
    confidence: 93,
    reasoning:
      "8 ví dụ đa dạng → model tổng quát hoá tốt hơn nhưng cải thiện so với 3-shot là nhỏ (diminishing returns).",
    tokens: 260,
    cost: 1.15,
    latency: 740,
  },
};

const SHOT_LEVELS = [0, 1, 3, 8] as const;
type ShotLevel = (typeof SHOT_LEVELS)[number];

// Tra cứu ví dụ tương ứng với mỗi mức shot.
// 0 shot → không ví dụ
// 1 shot → chỉ ví dụ 1
// 3 shot → 3 ví dụ đầu (đủ 3 class)
// 8 shot → toàn bộ 8 ví dụ
function examplesForShot(shot: ShotLevel) {
  return TASK_EXAMPLES.slice(0, shot);
}

// ─────────────────────────────────────────────────────────────────────────────
// BẢNG SO SÁNH ICL vs FINE-TUNE
// ─────────────────────────────────────────────────────────────────────────────
// Dùng làm "toggle compare" dạng bảng thủ công — không cần component ngoài.
type CompareRow = {
  aspect: string;
  icl: string;
  fineTune: string;
  winner: "icl" | "finetune" | "tie";
};

// Mỗi hàng là một "khía cạnh" so sánh. Người đọc thường ngầm cho rằng
// fine-tune luôn tốt hơn ICL, nhưng bảng này cho thấy sự thật phức tạp hơn
// nhiều: tuỳ vào pha của dự án (MVP vs production vs scale-out), công cụ
// khác nhau sẽ chiếm ưu thế.
const COMPARE_ROWS: CompareRow[] = [
  {
    aspect: "Thời gian triển khai",
    icl: "Vài phút — chỉ viết prompt",
    fineTune: "Vài giờ đến vài ngày — cần training job",
    winner: "icl",
  },
  {
    aspect: "Dữ liệu cần thiết",
    icl: "3–8 ví dụ mẫu",
    fineTune: "Hàng trăm đến hàng nghìn cặp input/output",
    winner: "icl",
  },
  {
    aspect: "Chi phí ban đầu",
    icl: "Gần như $0 (chỉ chi phí API inference)",
    fineTune: "Phí training + hạ tầng GPU",
    winner: "icl",
  },
  {
    aspect: "Chi phí mỗi request",
    icl: "Cao hơn — prompt dài hơn vì chứa ví dụ",
    fineTune: "Thấp hơn — prompt ngắn, kiến thức đã nằm trong trọng số",
    winner: "finetune",
  },
  {
    aspect: "Độ ổn định",
    icl: "Có thể lệch theo cách viết prompt (sensitive)",
    fineTune: "Ổn định hơn, ít phụ thuộc format prompt",
    winner: "finetune",
  },
  {
    aspect: "Khả năng cập nhật",
    icl: "Sửa ví dụ là xong, không cần retrain",
    fineTune: "Phải mở lại training pipeline",
    winner: "icl",
  },
  {
    aspect: "Giới hạn context",
    icl: "Bị chặn bởi context window (8k, 32k, 200k token)",
    fineTune: "Không phụ thuộc context — kiến thức 'in' vào trọng số",
    winner: "finetune",
  },
  {
    aspect: "Bảo mật dữ liệu",
    icl: "Dữ liệu đi cùng request mỗi lần",
    fineTune: "Dữ liệu huấn luyện nằm trong model custom",
    winner: "tie",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// QUIZ — 8 CÂU HỎI
// ─────────────────────────────────────────────────────────────────────────────
const quizQuestions: QuizQuestion[] = [
  {
    question: "In-Context Learning khác gì với fine-tuning?",
    options: [
      "ICL thay đổi trọng số model, fine-tuning thì không",
      "ICL KHÔNG thay đổi trọng số — chỉ cho ví dụ trong prompt. Fine-tuning thay đổi trọng số vĩnh viễn",
      "ICL cần nhiều dữ liệu hơn fine-tuning",
      "Không khác gì, hai tên cho cùng một thứ",
    ],
    correct: 1,
    explanation:
      "ICL là 'dạy tạm' qua prompt — model không thay đổi, hiểu biết mất khi prompt kết thúc. Fine-tuning thay đổi trọng số vĩnh viễn.",
  },
  {
    question: "Thêm quá nhiều ví dụ (20–30 ví dụ) vào prompt có tốt không?",
    options: [
      "Càng nhiều càng tốt",
      "Không — tốn context window, tốn tiền, và hiệu quả giảm dần sau 5–10 ví dụ",
      "Không — AI chỉ đọc ví dụ đầu tiên",
      "Tốt nếu ví dụ ngắn",
    ],
    correct: 1,
    explanation:
      "Hiệu quả ICL tăng nhanh ở 1–5 ví dụ, sau đó diminishing returns. 20–30 ví dụ tốn context window (tiền!) mà cải thiện rất ít. 3–5 ví dụ là sweet spot.",
  },
  {
    question: "AI hoạt động theo cơ chế nào khi thực hiện in-context learning?",
    options: [
      "Pattern matching — nhận ra format từ ví dụ và áp dụng cho input mới",
      "Học thuộc lòng — ghi nhớ mọi ví dụ vào trọng số",
      "Search engine — tìm đáp án trên Internet",
      "Random — đoán ngẫu nhiên",
    ],
    correct: 0,
    explanation:
      "ICL là pattern matching cấp cao: AI nhận ra CẤU TRÚC (input → output) từ ví dụ, rồi áp dụng cấu trúc đó cho input mới. Không ghi nhớ, không tìm kiếm.",
  },
  {
    type: "fill-blank",
    question:
      "Khi prompt chỉ mô tả task mà không có ví dụ nào, ta gọi là {blank}. Khi thêm vài ví dụ mẫu input-output thì gọi là few-shot và có thể cho nhiều {blank} hơn.",
    blanks: [
      { answer: "zero-shot", accept: ["zero shot", "không ví dụ", "0-shot"] },
      { answer: "ví dụ", accept: ["examples", "mẫu", "example"] },
    ],
    explanation:
      "Zero-shot = 0 ví dụ (chỉ mô tả task). Few-shot = 3–5 ví dụ trong prompt. Many-shot = 10+ ví dụ. Số lượng ví dụ tăng thì chất lượng thường tăng, nhưng hiệu quả giảm dần sau 5–10 ví dụ.",
  },
  {
    question: "Điều gì XẢY RA với trọng số của LLM khi bạn dùng few-shot prompting?",
    options: [
      "Trọng số được cập nhật nhẹ sau mỗi request",
      "Trọng số không thay đổi — ICL chỉ tác động lên hidden states trong một lần forward pass",
      "Chỉ lớp cuối cùng được cập nhật",
      "Trọng số bị khóa tạm thời rồi mở lại sau khi trả lời",
    ],
    correct: 1,
    explanation:
      "ICL diễn ra hoàn toàn trong inference. Toàn bộ thông tin ví dụ chỉ tồn tại dưới dạng hidden states và attention patterns tạm thời — không có gradient, không có update.",
  },
  {
    question:
      "Bạn có 3 ví dụ: 2 tích cực và 1 tiêu cực (không có trung lập). Mẫu thử là 'Tạm ổn, không quá ấn tượng'. Rủi ro lớn nhất là gì?",
    options: [
      "Model trả lời 'Tích cực' hoặc 'Tiêu cực' vì không thấy ví dụ trung lập nào → thiếu class",
      "Model refuse do prompt quá ngắn",
      "Model tự động chèn thêm class mới dù chưa từng thấy",
      "Không có rủi ro đáng kể",
    ],
    correct: 0,
    explanation:
      "ICL rất 'nhìn mẫu mà đoán format'. Nếu ví dụ không cover class bạn muốn, model sẽ ép đáp án về các class đã thấy. Luôn đảm bảo tập ví dụ phủ đủ các nhãn và cả edge-case.",
  },
  {
    question: "Khi nào NÊN dùng fine-tuning thay vì ICL?",
    options: [
      "Khi chỉ có 5 ví dụ",
      "Khi cần thay đổi nhanh bộ ví dụ mỗi ngày",
      "Khi task lặp lại cực nhiều request và chi phí per-request là ưu tiên, hoặc cần format cực ổn định",
      "Không bao giờ — ICL luôn tốt hơn",
    ],
    correct: 2,
    explanation:
      "Fine-tuning 'in' kiến thức vào trọng số → prompt ngắn hơn, rẻ hơn mỗi request, ổn định hơn. Đánh đổi: chi phí đào tạo ban đầu + khó cập nhật.",
  },
  {
    question: "Mẹo nào giúp few-shot prompt hoạt động tốt hơn?",
    options: [
      "Đặt ví dụ ngẫu nhiên, không cần thứ tự",
      "Đảm bảo format input/output giống hệt nhau cho tất cả ví dụ, và đặt ví dụ khó/cần nhớ ở cuối",
      "Viết ví dụ càng dài càng tốt để model 'ngấm'",
      "Chỉ cần 1 ví dụ cực chi tiết là đủ",
    ],
    correct: 1,
    explanation:
      "Format đồng nhất giúp model 'khoá' pattern. Nghiên cứu cho thấy model bị ảnh hưởng bởi recency — ví dụ cuối cùng thường được copy format mạnh nhất.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT CHÍNH
// ─────────────────────────────────────────────────────────────────────────────
export default function InContextLearningTopic() {
  // Mức shot hiện tại (0, 1, 3, 8)
  const [shotIdx, setShotIdx] = useState(0);
  const shot = SHOT_LEVELS[shotIdx];

  // Bật/tắt hiển thị prompt đầy đủ
  const [showPrompt, setShowPrompt] = useState(false);

  // Lấy output mô phỏng theo shot
  const output = AI_OUTPUTS[shot];
  const examples = useMemo(() => examplesForShot(shot), [shot]);

  // Tăng/giảm mức shot — dùng cho các nút +/-
  const bumpShot = useCallback((delta: number) => {
    setShotIdx((idx) => {
      const next = idx + delta;
      if (next < 0) return 0;
      if (next > SHOT_LEVELS.length - 1) return SHOT_LEVELS.length - 1;
      return next;
    });
  }, []);

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 1 — HOOK / DỰ ĐOÁN
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={1} totalSteps={5} label="Thử đoán">
        <PredictionGate
          question="Bạn muốn AI phân loại cảm xúc review tiếng Việt. Cách nào hiệu quả nhất MÀ KHÔNG CẦN huấn luyện lại model?"
          options={[
            "Viết chương trình if-else kiểm tra từ khóa (buồn/vui/chán…)",
            "Cho AI xem vài ví dụ (review → cảm xúc) ngay trong prompt",
            "Chờ phiên bản AI mới biết tiếng Việt tốt hơn",
          ]}
          correct={1}
          explanation="Chỉ cần cho AI 3–5 ví dụ mẫu ngay trong prompt → nó 'hiểu' task và làm theo! Đây gọi là In-Context Learning — AI 'học' từ ví dụ trong prompt mà không cần thay đổi trọng số."
        >
          <p className="text-sm text-muted mt-4">
            Dưới đây bạn sẽ thử kéo thanh số lượng ví dụ <strong>0 → 1 → 3 → 8</strong> và quan sát
            cách AI trả lời cùng một câu hỏi thay đổi ra sao.
          </p>
        </PredictionGate>

        <div className="mt-6 rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-2">
            Phép so sánh nhanh — giống như dạy một đứa trẻ
          </h3>
          <p className="text-sm text-muted leading-relaxed">
            Hãy tưởng tượng bạn thuê một nhân viên mới cực kỳ thông minh nhưng chưa biết đặc thù
            công việc của bạn. Có 2 cách để đào tạo:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-foreground">
            <li>
              <strong className="text-accent">Cách 1 — ICL:</strong>{" "}
              Cho họ xem 3 lá thư mẫu mà bạn đã viết trước đây, rồi yêu cầu viết lá thư mới theo
              cùng phong cách. Họ sẽ bắt chước ngay trong ngày đầu tiên.
            </li>
            <li>
              <strong className="text-accent">Cách 2 — Fine-tuning:</strong>{" "}
              Gửi họ đi học một khoá đào tạo 3 tháng chuyên về phong cách viết của công ty. Kiến
              thức sẽ "ngấm" vào họ vĩnh viễn, nhưng bạn phải trả học phí và chờ lâu.
            </li>
          </ul>
          <p className="mt-3 text-sm text-muted leading-relaxed">
            LLM cũng vậy. Khi việc của bạn chỉ cần vài ví dụ để "gợi nhớ" khung mẫu, ICL là con
            đường siêu nhanh. Khi khối lượng công việc lớn và bạn cần format cực ổn định, fine-tune
            mới thực sự rẻ về lâu dài.
          </p>
        </div>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 2 — KHÁM PHÁ (VISUALIZATION)
          Slider chọn 0/1/3/8-shot + hiển thị prompt + output + độ tin cậy
          + bảng so sánh ICL vs Fine-tune
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={2} totalSteps={5} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <h3 className="text-base font-semibold text-foreground mb-1">
            Few-shot explorer — kéo số ví dụ để thấy AI học nhanh như thế nào
          </h3>
          <p className="text-sm text-muted mb-5">
            Dưới đây là một bài toán thực tế: phân loại cảm xúc review nhà hàng tiếng Việt. Cùng
            một câu hỏi thử, cùng một model — chỉ khác số lượng ví dụ trong prompt.
          </p>

          {/* ── Thanh chọn shot ────────────────────────────────────────── */}
          <div className="rounded-lg border border-border bg-surface/40 p-4 mb-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground">Số lượng ví dụ (shot)</span>
              <span className="text-xs text-tertiary">
                {shot === 0 ? "Zero-shot" : `${shot}-shot`}
              </span>
            </div>

            {/* Các nút chọn nhanh */}
            <div className="flex items-center gap-2 mb-3">
              {SHOT_LEVELS.map((level, idx) => {
                const active = idx === shotIdx;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setShotIdx(idx)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                      active
                        ? "border-accent bg-accent text-white"
                        : "border-border bg-card text-muted hover:text-foreground hover:border-accent/40"
                    }`}
                  >
                    {level === 0 ? "0 (zero)" : `${level}`}
                  </button>
                );
              })}
            </div>

            {/* Nút mịn */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => bumpShot(-1)}
                disabled={shotIdx === 0}
                className="rounded-lg border border-border px-3 py-1 text-xs text-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Ít hơn
              </button>
              <span className="text-xs text-muted">
                {shot === 0
                  ? "Không ví dụ — model tự suy"
                  : shot === 1
                  ? "Một ví dụ — hiểu sơ format"
                  : shot === 3
                  ? "Ba ví dụ — phủ đủ 3 class (sweet spot)"
                  : "Tám ví dụ — đa dạng nhưng tốn token"}
              </span>
              <button
                type="button"
                onClick={() => bumpShot(+1)}
                disabled={shotIdx === SHOT_LEVELS.length - 1}
                className="rounded-lg border border-border px-3 py-1 text-xs text-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Nhiều hơn →
              </button>
            </div>
          </div>

          {/* ── Prompt đang xây ─────────────────────────────────────────── */}
          <div className="rounded-lg border border-border bg-card overflow-hidden mb-5">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface/40">
              <span className="text-xs font-semibold text-foreground">
                Prompt gửi đến LLM ({examples.length} ví dụ + 1 câu hỏi)
              </span>
              <button
                type="button"
                onClick={() => setShowPrompt((v) => !v)}
                className="text-xs text-accent hover:underline"
              >
                {showPrompt ? "Ẩn ghi chú" : "Hiện ghi chú"}
              </button>
            </div>

            <AnimatePresence initial={false}>
              {examples.map((ex, i) => (
                <motion.div
                  key={`${shot}-${i}`}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                  className="border-b border-border px-4 py-2.5 bg-surface/20"
                >
                  <div>
                    <span className="text-xs text-tertiary">Ví dụ {i + 1}: </span>
                    <span className="text-xs text-foreground">&quot;{ex.input}&quot;</span>
                    <span className="text-xs text-accent font-medium"> → {ex.output}</span>
                  </div>
                  {showPrompt && (
                    <p className="mt-1 text-[11px] text-muted italic">{ex.note}</p>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Câu hỏi thử */}
            <div className="px-4 py-3 border-b border-border">
              <span className="text-xs text-tertiary">Câu hỏi: </span>
              <span className="text-sm text-foreground font-medium">
                &quot;{TEST_INPUT}&quot;
              </span>
            </div>

            {/* Output từ AI */}
            <AnimatePresence mode="wait">
              <motion.div
                key={shot}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="px-4 py-3 bg-accent-light"
              >
                <span className="text-xs text-accent font-semibold block mb-1">
                  AI trả lời:
                </span>
                <p className="text-sm text-foreground leading-relaxed">{output.answer}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── Ba chỉ số: độ tin cậy, token, độ trễ ─────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted">Độ chính xác</span>
                <span className="text-xs font-bold text-accent">{output.confidence}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-surface overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${output.confidence}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted">Token dùng</span>
                <span className="text-xs font-bold text-foreground">~{output.tokens}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-surface overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-amber-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (output.tokens / 300) * 100)}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted">Độ trễ (ms)</span>
                <span className="text-xs font-bold text-foreground">{output.latency}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-surface overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-blue-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (output.latency / 1000) * 100)}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>
          </div>

          <p className="text-xs text-muted italic mb-5 leading-relaxed">
            Giải thích vì sao: {output.reasoning}
          </p>

          {/* ── Bảng so sánh ICL vs Fine-tune ─────────────────────────── */}
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-surface/40">
              <h4 className="text-sm font-semibold text-foreground">
                ICL vs Fine-tune — nên dùng khi nào?
              </h4>
              <p className="text-xs text-muted mt-1">
                Bảng tổng hợp dưới đây giúp bạn chọn đúng công cụ cho từng hoàn cảnh.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-surface/40 text-tertiary">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Khía cạnh</th>
                    <th className="text-left px-4 py-2 font-medium">In-Context Learning</th>
                    <th className="text-left px-4 py-2 font-medium">Fine-tuning</th>
                    <th className="text-left px-4 py-2 font-medium">Thắng</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_ROWS.map((row, i) => (
                    <tr
                      key={row.aspect}
                      className={i % 2 === 0 ? "bg-card" : "bg-surface/20"}
                    >
                      <td className="px-4 py-2 font-medium text-foreground">{row.aspect}</td>
                      <td className="px-4 py-2 text-muted">{row.icl}</td>
                      <td className="px-4 py-2 text-muted">{row.fineTune}</td>
                      <td className="px-4 py-2">
                        {row.winner === "icl" && (
                          <span className="rounded bg-accent/10 text-accent px-1.5 py-0.5 text-[10px] font-semibold">
                            ICL
                          </span>
                        )}
                        {row.winner === "finetune" && (
                          <span className="rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 text-[10px] font-semibold">
                            Fine-tune
                          </span>
                        )}
                        {row.winner === "tie" && (
                          <span className="rounded bg-surface text-muted px-1.5 py-0.5 text-[10px] font-semibold">
                            Hoà
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-t border-border bg-surface/40">
              <p className="text-xs text-muted leading-relaxed">
                Quy tắc ngón tay cái: nếu tổng chi phí inference hằng tháng <em>không</em> quá
                $500, hầu như luôn chọn ICL. Khi chi phí vượt ngưỡng đó <em>và</em>{" "}
                bạn đã có {">"}500 cặp input/output, fine-tune mới bắt đầu có lãi.
              </p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 3 — AHA MOMENT
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={3} totalSteps={5} label="Khoảnh khắc Aha">
        <AhaMoment>
          Bạn vừa thấy AI &quot;học&quot; một task hoàn toàn mới chỉ từ vài ví dụ —{" "}
          <strong>không cần huấn luyện lại, không cần code, không cần data lớn.</strong> Đây là{" "}
          <strong>In-Context Learning</strong> — một trong những tính chất kỳ lạ và mạnh mẽ nhất
          của các mô hình ngôn ngữ lớn: pattern-matching ngay trong một lần forward pass, không có
          gradient, không có cập nhật trọng số. Chính điều này đã mở ra kỷ nguyên{" "}
          <em>prompting như lập trình</em> — nơi bạn &quot;dạy&quot; AI bằng vài ví dụ trong chat.
        </AhaMoment>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 4 — THỬ THÁCH (2 InlineChallenge)
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={4} totalSteps={5} label="Thử thách">
        <InlineChallenge
          question="Nếu bạn cho AI 4 ví dụ phân loại cảm xúc, xong hỏi nó dịch tiếng Anh — nó sẽ dịch hay phân loại?"
          options={[
            "Phân loại — vì nó đã 'học' phân loại từ 4 ví dụ",
            "Dịch — vì câu hỏi cuối rõ ràng yêu cầu dịch, ví dụ trước chỉ là gợi ý",
            "Bị lỗi — không hiểu bạn muốn gì",
          ]}
          correct={1}
          explanation="LLM nhìn toàn bộ context — nếu câu hỏi cuối rõ ràng yêu cầu dịch, nó sẽ dịch. Ví dụ mẫu là 'gợi ý' format, không phải 'lệnh cứng'. Đó là lý do prompt engineering quan trọng!"
        />

        <p className="text-sm text-muted mt-3 mb-6">
          Muốn viết prompt tốt hơn? Xem thêm về{" "}
          <TopicLink slug="prompt-engineering">prompt engineering</TopicLink> và cách{" "}
          <TopicLink slug="chain-of-thought">chain-of-thought</TopicLink> kết hợp với few-shot.
        </p>

        <InlineChallenge
          question="Bạn có 500 cặp input/output và chi phí inference mỗi tháng $2,000. Team muốn giảm latency và chi phí per-request. Nên làm gì?"
          options={[
            "Thêm nhiều ví dụ vào prompt (10–20 shot) để đạt độ chính xác cao hơn",
            "Dừng dùng LLM, viết rule-based",
            "Fine-tune model với 500 cặp — prompt sẽ ngắn hơn, latency và chi phí per-request giảm rõ rệt",
          ]}
          correct={2}
          explanation="Đây là vùng 'vượt ngưỡng' cho fine-tuning: đã có đủ data, đã có traffic đủ lớn để amortize chi phí đào tạo, và rõ ràng cần prompt ngắn hơn. ICL vẫn là điểm khởi đầu đúng, nhưng khi pipeline trưởng thành, fine-tune tiết kiệm token và ổn định format hơn."
        />
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 5 — GIẢI THÍCH + TÓM TẮT + QUIZ
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={5} totalSteps={5} label="Giải thích">
        <ExplanationSection topicSlug={metadata.slug}>
          <p>
            <strong>In-Context Learning (ICL)</strong> là khả năng LLM thực hiện tác vụ mới chỉ
            từ vài ví dụ trong prompt, mà <em>không thay đổi trọng số model</em> — khác hẳn với{" "}
            <TopicLink slug="fine-tuning-vs-prompting">fine-tuning</TopicLink>. Kết hợp ICL với{" "}
            <TopicLink slug="chain-of-thought">chain-of-thought</TopicLink> (few-shot CoT) giúp
            model vừa học format vừa học cách suy luận.
          </p>

          <p>
            Một cách chính xác hơn, khi bạn gửi prompt{" "}
            <code className="text-accent">{`x₁→y₁, x₂→y₂, …, xₖ→yₖ, x_test →`}</code>, model sinh
            phân phối xác suất có điều kiện trên câu trả lời. Toàn bộ quá trình này là một{" "}
            <em>forward pass duy nhất</em> — không có backprop, không có gradient, không có
            checkpoint mới. Mọi &quot;hiểu biết&quot; đến từ các hidden states và attention
            patterns do ví dụ kích hoạt.
          </p>

          <p>
            Về mặt toán học, ta có thể xem ICL như một bài toán ước lượng hậu nghiệm tiềm ẩn:
          </p>

          <LaTeX block>
            {"p(y \\mid x_{\\text{test}}, \\mathcal{D}_{\\text{demo}}) = \\sum_{\\theta} p(y \\mid x_{\\text{test}}, \\theta) \\, p(\\theta \\mid \\mathcal{D}_{\\text{demo}})"}
          </LaTeX>

          <p>
            Các ví dụ trong prompt đóng vai trò như một &quot;signal&quot; giúp model thu hẹp phân
            phối trên các task tiềm ẩn <em>θ</em>. Càng nhiều ví dụ càng giúp model xác định đúng
            task, nhưng lợi ích giảm dần theo định lý lấy mẫu quen thuộc trong xác suất thống kê.
          </p>

          <Callout variant="insight" title="Tại sao AI 'học' được mà không cần training?">
            LLM không thực sự &quot;học&quot; theo nghĩa truyền thống. Trong quá trình
            pre-training, nó đã thấy hàng triệu pattern dạng &quot;ví dụ → áp dụng&quot;. Khi bạn
            cho ví dụ trong prompt, nó <em>nhận ra pattern</em> và áp dụng cho input mới. Giống
            như thợ may giỏi — bạn chỉ cần cho xem một mẫu áo, họ hiểu ngay style bạn muốn.
          </Callout>

          <p>
            <strong>Ba chế độ ICL thường gặp:</strong>
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2 text-sm">
            <li>
              <strong>Zero-shot:</strong> Không ví dụ. Chỉ mô tả task. AI dựa hoàn toàn vào
              pre-training knowledge. Phù hợp cho các task rất quen thuộc (tóm tắt, viết email).
            </li>
            <li>
              <strong>Few-shot:</strong> 3–5 ví dụ mẫu. Sweet spot cho hầu hết task nghiệp vụ —
              đủ để cố định format, chưa tốn quá nhiều token.
            </li>
            <li>
              <strong>Many-shot:</strong> 10–50+ ví dụ. Hiệu quả tăng ít, tốn context window
              nhiều. Chỉ nên dùng khi task cực đặc thù (domain hiếm) hoặc model có context rất
              dài.
            </li>
          </ul>

          <Callout variant="tip" title="Mẹo: chất lượng ví dụ quan trọng hơn số lượng">
            3 ví dụ đa dạng (cover các edge-case) tốt hơn 10 ví dụ giống nhau. Ví dụ nên cover mọi
            class/format bạn muốn AI output. Thứ tự ví dụ cũng ảnh hưởng — đặt ví dụ khó ở cuối
            cùng (recency bias giúp model bắt chước ví dụ gần nhất).
          </Callout>

          <Callout variant="warning" title="Cảnh báo: ICL không phải 'magic wand'">
            Không phải task nào cũng phù hợp với ICL. Các task yêu cầu kiến thức domain sâu (chẩn
            đoán y khoa, luật chuyên ngành), hoặc định dạng đầu ra cực phức tạp (JSON lồng nhiều
            tầng với ràng buộc), thường cần fine-tuning hoặc RAG. ICL mạnh ở{" "}
            <em>pattern quen thuộc với cấu trúc đơn giản</em>.
          </Callout>

          <Callout variant="info" title="ICL có thể thất bại ở đâu?">
            Có các task mà ICL kém hẳn so với fine-tune: (1) phân loại nhiều nhãn với phân phối
            lệch (long-tail classification) — model thường bỏ qua class hiếm; (2) bài toán số
            học chính xác nhiều chữ số — model vẫn tính sai dù có ví dụ; (3) bài toán cần nhớ
            sự kiện mới (update kiến thức). Với những trường hợp này, hoặc chuyển sang fine-tune
            + RAG, hoặc chia nhỏ bài toán thành các bước mà LLM mạnh.
          </Callout>

          <Callout variant="info" title="Liên hệ với Chain-of-Thought">
            Khi bạn thêm bước suy luận vào mỗi ví dụ (<em>&quot;Hãy nghĩ từng bước…&quot;</em>),
            bạn đang làm <strong>few-shot CoT</strong>. Đây là một trong những kỹ thuật hiệu quả
            nhất cho bài toán lý luận — ICL học format, CoT học cách suy nghĩ.
          </Callout>

          <p>
            <strong>Ví dụ code — gọi API với few-shot prompt (OpenAI SDK):</strong>
          </p>

          <CodeBlock language="python" title="few_shot_openai.py">{`# Cài đặt: pip install openai
from openai import OpenAI

client = OpenAI()

# Few-shot: 3 ví dụ phủ 3 class + 1 câu hỏi thử
SYSTEM = "Bạn là bộ phân loại cảm xúc cho review tiếng Việt. Output chỉ một nhãn."

EXAMPLES = [
    {"role": "user", "content": "Tôi yêu Hà Nội!"},
    {"role": "assistant", "content": "Tích cực"},
    {"role": "user", "content": "Dịch vụ quá tệ"},
    {"role": "assistant", "content": "Tiêu cực"},
    {"role": "user", "content": "Bình thường, không có gì đặc biệt"},
    {"role": "assistant", "content": "Trung lập"},
]

def classify(review: str) -> str:
    messages = [{"role": "system", "content": SYSTEM}, *EXAMPLES,
                {"role": "user", "content": review}]
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        temperature=0,          # deterministic — tránh lệch format
        max_tokens=5,           # nhãn chỉ cần 1–2 token
    )
    return resp.choices[0].message.content.strip()

print(classify("Nhân viên thân thiện nhưng đồ ăn hơi lạt"))
# → "Trung lập"`}</CodeBlock>

          <p>
            <strong>Ví dụ code — đánh giá chất lượng few-shot trên tập test:</strong>
          </p>

          <CodeBlock language="python" title="evaluate_few_shot.py">{`import json
from collections import Counter
from openai import OpenAI

client = OpenAI()

# Tập test: 100 review đã dán nhãn sẵn
with open("test_reviews.jsonl") as f:
    test = [json.loads(line) for line in f]

def run_shot(k: int, examples_pool):
    """Đo accuracy ở mức k-shot (k ví dụ đầu tiên trong pool)."""
    demo = examples_pool[:k]
    sys_msg = "Phân loại cảm xúc review: Tích cực / Tiêu cực / Trung lập."
    correct = 0
    for item in test:
        msgs = [{"role": "system", "content": sys_msg}]
        for ex in demo:
            msgs.append({"role": "user", "content": ex["text"]})
            msgs.append({"role": "assistant", "content": ex["label"]})
        msgs.append({"role": "user", "content": item["text"]})
        out = client.chat.completions.create(
            model="gpt-4o-mini", messages=msgs,
            temperature=0, max_tokens=5,
        ).choices[0].message.content.strip()
        if out == item["label"]:
            correct += 1
    return correct / len(test)

# So sánh các mức shot
for k in [0, 1, 3, 5, 8]:
    acc = run_shot(k, examples_pool)
    print(f"{k}-shot accuracy: {acc:.2%}")

# Output điển hình:
#   0-shot accuracy: 62%
#   1-shot accuracy: 71%
#   3-shot accuracy: 84%   ← sweet spot
#   5-shot accuracy: 86%
#   8-shot accuracy: 87%   ← diminishing returns`}</CodeBlock>

          <CollapsibleDetail title="Chi tiết nâng cao — vì sao ICL hoạt động?">
            <div className="space-y-3 text-sm text-foreground">
              <p>
                Có nhiều giả thuyết về cơ chế ICL, và đây là một lĩnh vực nghiên cứu cực kỳ sôi
                động:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                <li>
                  <strong>Meta-learning qua pre-training:</strong> Trong quá trình pre-training,
                  model thấy rất nhiều mẫu văn bản có cấu trúc &quot;ví dụ → kết luận&quot; (bài
                  tập sách giáo khoa, FAQ, code docstring). Nó học được &quot;kỹ năng bắt chước
                  pattern&quot; như một khả năng phổ quát.
                </li>
                <li>
                  <strong>Implicit gradient descent:</strong> Một số nghiên cứu (Akyürek et al.
                  2022, von Oswald et al. 2022) chứng minh rằng các attention layer của
                  Transformer có thể <em>mô phỏng</em> các bước gradient descent trên dữ liệu
                  trong context. Tức là ICL thực sự đang làm &quot;học&quot; trong hidden space —
                  chỉ khác là không cập nhật tham số gốc.
                </li>
                <li>
                  <strong>Task vectors:</strong> Hendel et al. (2023) cho thấy có thể trích xuất
                  một &quot;task vector&quot; trung gian từ lớp ẩn khi model xử lý prompt few-shot,
                  rồi tái sử dụng vector đó cho các input mới mà không cần lặp lại ví dụ.
                </li>
                <li>
                  <strong>Induction heads:</strong> Nghiên cứu của Anthropic (2022) tìm ra một loại
                  attention head đặc biệt chuyên &quot;tìm pattern&quot; giống nhau trong context
                  và &quot;copy&quot; kết quả. Đây có thể là cơ sở vi mô cho ICL.
                </li>
              </ul>
              <p>
                Thực tế, không cần nắm 100% cơ chế để dùng ICL hiệu quả. Nhưng biết rằng ICL là
                một <em>khả năng emergent</em> (xuất hiện khi model đủ lớn) giúp bạn hiểu tại sao
                GPT-2 không làm tốt còn GPT-3 thì làm được.
              </p>
            </div>
          </CollapsibleDetail>

          <p>
            <strong>Một góc nhìn toán học khác — ICL như Bayesian inference:</strong>
          </p>

          <p>
            Xiè et al. (2022) đề xuất khung lý thuyết coi ICL như suy luận Bayes ngầm. Tưởng
            tượng pre-training data được sinh từ một hỗn hợp các &quot;chủ đề&quot; (topic)
            tiềm ẩn. Mỗi demo trong prompt giúp model thu hẹp phân phối trên các chủ đề đó:
          </p>

          <LaTeX block>
            {"p(\\text{topic} \\mid \\text{prompt}) \\propto p(\\text{prompt} \\mid \\text{topic}) \\, p(\\text{topic})"}
          </LaTeX>

          <p>
            Càng nhiều ví dụ đồng dạng trong prompt, model càng tin chắc về chủ đề → output
            càng ổn định. Đây là lý do thứ tự, format và chất lượng demo có ảnh hưởng lớn —
            chúng là &quot;bằng chứng&quot; mà model dùng để quyết định topic.
          </p>

          <Callout variant="info" title="Semantic few-shot: chọn ví dụ theo input">
            Thay vì dùng cố định 3 ví dụ cho mọi input, ta có thể <strong>retrieve</strong> các
            ví dụ gần input nhất về mặt ngữ nghĩa (dùng embedding). Kỹ thuật này gọi là{" "}
            <em>KATE</em> (Liu et al. 2022) hoặc <em>dynamic few-shot</em>, và thường đem lại
            5–15% tăng accuracy so với ví dụ cố định. Trade-off là cần một vector store (FAISS,
            Pinecone, Qdrant) và thêm một bước retrieval trước mỗi request.
          </Callout>

          <CollapsibleDetail title="Các mẫu prompt few-shot hay gặp">
            <div className="space-y-3 text-sm text-foreground">
              <p>
                <strong>1. Classification (như demo trên):</strong> input → nhãn. Đơn giản, hiệu
                quả cho phần lớn nhiệm vụ gắn nhãn.
              </p>
              <p>
                <strong>2. Extraction:</strong> input (văn bản tự do) → output (JSON trích
                trường). Ví dụ:
              </p>
              <pre className="rounded bg-surface/40 p-2 text-xs overflow-x-auto">{`"Nguyễn Văn A, 28 tuổi, sinh Hà Nội" → {"name":"Nguyễn Văn A","age":28,"city":"Hà Nội"}
"Trần Thị B, 35 tuổi, TP.HCM" → {"name":"Trần Thị B","age":35,"city":"TP.HCM"}`}</pre>
              <p>
                <strong>3. Transformation:</strong> input → output cùng format nhưng khác nội
                dung. Ví dụ sửa văn, dịch, paraphrase.
              </p>
              <p>
                <strong>4. Reasoning (few-shot CoT):</strong> input → &quot;Suy nghĩ: … → Đáp án:
                …&quot;. Bắt buộc cho các task nhiều bước.
              </p>
              <p>
                <strong>5. Instruction + few-shot hỗn hợp:</strong> Mô tả task rõ ràng trước, rồi
                2–3 ví dụ minh hoạ. Cách này thường robust hơn pure few-shot.
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="Nâng cao — 'prompt tuning' và các biến thể lai">
            <div className="space-y-3 text-sm text-foreground">
              <p>
                Giữa hai thái cực &quot;ICL thuần&quot; và &quot;fine-tuning đầy đủ&quot; tồn
                tại một quang phổ các kỹ thuật trung gian:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                <li>
                  <strong>Prompt tuning / soft prompt:</strong> học một vector embedding nhỏ
                  (vài nghìn tham số) đóng vai trò như &quot;prefix&quot; cho mọi prompt. Không
                  dễ đọc nhưng hiệu quả — dùng được cho task lặp rất nhiều.
                </li>
                <li>
                  <strong>Prefix tuning:</strong> tương tự soft prompt nhưng chèn vector vào
                  tất cả layer, không chỉ input — thường mạnh hơn.
                </li>
                <li>
                  <strong>LoRA / QLoRA:</strong> fine-tune chỉ các ma trận rank-thấp trong
                  attention/MLP. Chi phí training nhỏ, kết quả gần full fine-tune. Đây là lựa
                  chọn phổ biến nhất hiện nay khi cần &quot;nặng hơn ICL, nhẹ hơn full
                  fine-tune&quot;.
                </li>
                <li>
                  <strong>RAG (Retrieval-Augmented Generation):</strong> thay vì nhét ví dụ cố
                  định, hệ thống truy xuất các tài liệu liên quan tại thời điểm query và đưa
                  vào prompt. Bản chất vẫn là ICL, nhưng được mở rộng ra kho kiến thức lớn.
                </li>
              </ul>
              <p>
                Quy luật chọn công cụ: bắt đầu từ ICL → nếu cần prompt ngắn hơn và traffic
                lớn, chuyển sang LoRA → nếu bài toán cực đặc thù và có đủ data, dùng full
                fine-tune. Đừng bỏ qua giai đoạn ICL — đó là cách nhanh nhất để kiểm chứng ý
                tưởng.
              </p>
            </div>
          </CollapsibleDetail>

          <p>
            <strong>Ứng dụng thực tế:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-sm">
            <li>
              <strong>Phân loại nội dung trên nền tảng UGC:</strong> few-shot giúp đội moderation
              triển khai phân loại mới trong vài phút thay vì vài tuần.
            </li>
            <li>
              <strong>Trích xuất thông tin từ hoá đơn, CV, hợp đồng:</strong> viết 3–5 mẫu
              input/JSON và bắt đầu chạy — không cần training.
            </li>
            <li>
              <strong>Chuyển đổi giọng điệu email/ghi chú nội bộ:</strong> 2 ví dụ
              &quot;before/after&quot; đủ để model bắt chước phong cách công ty.
            </li>
            <li>
              <strong>Code transformation:</strong> di chuyển codebase từ framework cũ sang mới,
              chỉ cần cung cấp 3–4 cặp &quot;file cũ → file mới&quot;.
            </li>
            <li>
              <strong>Data labeling bán tự động:</strong> dùng LLM với few-shot để gợi ý nhãn cho
              human-in-the-loop, tăng throughput của annotator 5–10 lần.
            </li>
          </ul>

          <p>
            <strong>Các lỗi phổ biến cần tránh:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-sm">
            <li>
              Ví dụ thiếu class → model ép đáp án về class đã thấy. Luôn đảm bảo phủ đủ các nhãn
              bạn mong muốn.
            </li>
            <li>
              Format không nhất quán giữa các ví dụ → model bối rối. Luôn dùng chung một khung
              (cùng dấu phân tách, cùng capitalization, cùng độ dài).
            </li>
            <li>
              Thứ tự ví dụ tuỳ tiện → nghiên cứu (Lu et al. 2022) cho thấy accuracy có thể biến
              thiên 5–20% chỉ vì thứ tự. Cân nhắc chọn thứ tự tốt trên tập validation nhỏ.
            </li>
            <li>
              Dùng <em>cùng</em> ví dụ cho mọi input → kém tổng quát. Khi có thể, retrieve các ví
              dụ gần input (semantic few-shot).
            </li>
            <li>
              Không đặt <code>temperature=0</code> khi cần output format cố định → kết quả flaky.
            </li>
            <li>
              Kéo shot lên quá cao để &quot;chắc ăn&quot; → tốn context + tốn tiền mà hầu như
              không cải thiện. Luôn đo hiệu quả biên.
            </li>
            <li>
              Ví dụ có label sai (data bẩn) → model học pattern sai và tự tin áp dụng. ICL
              không có cơ chế &quot;correction&quot; ngoài chính các ví dụ bạn đưa vào.
            </li>
            <li>
              Trộn nhiều task khác nhau trong cùng prompt → model bối rối giữa các &quot;chủ
              đề&quot; tiềm ẩn. Giữ prompt single-purpose.
            </li>
            <li>
              Dùng ngôn ngữ hỗn hợp trong ví dụ (Việt + Anh xen kẽ) → model không rõ output
              nên bằng ngôn ngữ nào. Cố gắng nhất quán.
            </li>
            <li>
              Quên đặt tên cho các trường JSON trong ví dụ → model có thể đổi tên field, gây
              lỗi downstream. Luôn cố định schema.
            </li>
          </ul>

          <p>
            <strong>Bảng tham chiếu nhanh — khi nào dùng cái gì?</strong>
          </p>

          <div className="rounded-lg border border-border bg-surface/30 p-4 text-sm">
            <ul className="space-y-2">
              <li>
                <span className="inline-block w-28 font-semibold text-accent">Prototype:</span>{" "}
                ICL (zero → few-shot). Chuyển sang cái khác chỉ khi có bằng chứng rõ cần.
              </li>
              <li>
                <span className="inline-block w-28 font-semibold text-accent">Production nhẹ:</span>{" "}
                few-shot + retrieval (semantic few-shot) nếu cần scale chất lượng.
              </li>
              <li>
                <span className="inline-block w-28 font-semibold text-accent">Scale trung:</span>{" "}
                LoRA/QLoRA fine-tune trên 500–5000 mẫu.
              </li>
              <li>
                <span className="inline-block w-28 font-semibold text-accent">Scale lớn:</span>{" "}
                full fine-tune hoặc train model chuyên biệt nếu bài toán đủ quan trọng và data
                đủ lớn ({">"}100k mẫu).
              </li>
              <li>
                <span className="inline-block w-28 font-semibold text-accent">Kiến thức mới:</span>{" "}
                RAG hoặc kết hợp RAG + fine-tune — ICL không giải quyết được data thay đổi liên
                tục.
              </li>
            </ul>
          </div>

          <p>
            <strong>Checklist khi viết prompt few-shot:</strong>
          </p>

          <ol className="list-decimal list-inside space-y-1.5 pl-2 text-sm">
            <li>
              Viết 1–2 câu mô tả task rõ ràng (persona + input + output mong muốn).
            </li>
            <li>
              Chọn 3 ví dụ đại diện phủ đủ class/format. Không cần ví dụ nào là &quot;đẹp
              nhất&quot; — chỉ cần <em>đa dạng</em>.
            </li>
            <li>
              Đặt dấu phân tách nhất quán: thường dùng <code>\n</code> giữa các ví dụ,{" "}
              <code>→</code> hoặc <code>Output:</code> trước đáp án.
            </li>
            <li>
              Thêm câu hỏi thử ở cuối, mở dấu để model điền đúng vị trí đáp án.
            </li>
            <li>
              Chạy thử 10–20 mẫu, đếm accuracy, so với zero-shot. Nếu chưa đạt → thêm ví dụ
              hoặc viết rõ hơn mô tả task.
            </li>
            <li>
              Nếu đạt ngưỡng mong muốn → set <code>temperature=0</code> và triển khai.
            </li>
          </ol>

          <Callout variant="tip" title="Mẹo cuối: bắt đầu từ zero-shot rồi tăng dần">
            Luôn thử zero-shot trước. Nếu model đã làm tốt ở zero-shot, bạn tiết kiệm được
            rất nhiều token. Chỉ thêm ví dụ khi thực sự có lỗi. Câu thần chú:{" "}
            <em>&quot;Ít nhất mà đủ&quot;</em>.
          </Callout>

          <p>
            <strong>Các câu hỏi thường gặp:</strong>
          </p>

          <div className="space-y-3 text-sm">
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="font-semibold text-foreground mb-1">
                Q1: ICL có &quot;ghi nhớ&quot; ví dụ giữa các request không?
              </p>
              <p className="text-muted">
                Không. Mỗi lần bạn gọi API, model bắt đầu lại từ đầu. Nếu muốn duy trì ngữ
                cảnh, bạn phải tự gửi lại ví dụ (hoặc lịch sử chat) trong mỗi request.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="font-semibold text-foreground mb-1">
                Q2: Có cách nào giảm chi phí khi dùng nhiều ví dụ không?
              </p>
              <p className="text-muted">
                Có — các provider như Anthropic, OpenAI hỗ trợ <em>prompt caching</em>: phần
                prompt lặp lại (system + few-shot examples) được cache server-side, lần gọi
                sau chỉ trả tiền cho phần mới. Có thể giảm 50–90% chi phí cho prompt dài lặp
                lại.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="font-semibold text-foreground mb-1">
                Q3: Có nên đưa cả &quot;negative example&quot; (ví dụ sai để tránh) không?
              </p>
              <p className="text-muted">
                Có thể — nhưng cần đánh nhãn rõ &quot;ĐÚNG&quot; / &quot;SAI&quot;. Nếu không,
                model có thể bị confuse và copy luôn output sai. An toàn hơn: chỉ đưa ví dụ
                đúng, và dùng instruction để mô tả trường hợp KHÔNG nên làm.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="font-semibold text-foreground mb-1">
                Q4: Với model nhỏ (Llama 7B, Mistral 7B), ICL có còn hoạt động không?
              </p>
              <p className="text-muted">
                Có, nhưng yếu hơn đáng kể. ICL là khả năng emergent — xuất hiện rõ rệt từ cỡ
                ~10B tham số. Ở model 7B, bạn thường cần nhiều ví dụ hơn và format cứng hơn.
                Nếu ngân sách cho phép, fine-tune nhẹ (LoRA) thường vượt qua ICL trên model
                nhỏ.
              </p>
            </div>
          </div>
        </ExplanationSection>

        <MiniSummary
          points={[
            "In-Context Learning = AI 'học' task mới từ vài ví dụ trong prompt, KHÔNG thay đổi trọng số.",
            "Zero-shot (0 ví dụ) → Few-shot (3–5) → Many-shot (10+): hiệu quả tăng nhanh rồi chậm dần.",
            "AI không 'học' thật — nó nhận ra pattern từ pre-training và áp dụng cho context hiện tại.",
            "Chất lượng ví dụ quan trọng hơn số lượng — 3 ví dụ đa dạng tốt hơn 10 ví dụ giống nhau.",
            "ICL vs Fine-tune: ICL nhanh/rẻ triển khai, fine-tune ổn định/rẻ per-request khi traffic lớn.",
            "Luôn đo hiệu quả biên khi tăng shot — dừng khi chi phí thêm không còn tương xứng.",
          ]}
        />

        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
