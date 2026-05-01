"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  LaTeX,
  TopicLink,
  CollapsibleDetail,
  ProgressSteps,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

// ---------------------------------------------------------------------------
// METADATA — giữ nguyên khai báo gốc để routing / sidebar hoạt động đúng
// ---------------------------------------------------------------------------

export const metadata: TopicMeta = {
  slug: "distillation",
  title: "Knowledge Distillation",
  titleVi: "Chưng cất kiến thức",
  description:
    "Kỹ thuật chuyển giao kiến thức từ mô hình lớn (teacher) sang mô hình nhỏ (student) hiệu quả hơn.",
  category: "training-optimization",
  tags: ["distillation", "compression", "teacher-student", "efficiency"],
  difficulty: "advanced",
  relatedSlugs: ["pruning", "quantization", "fine-tuning"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

// ---------------------------------------------------------------------------
// DỮ LIỆU MÔ PHỎNG — một bài toán phân loại nhỏ 4 lớp để trực quan hoá
// teacher / student. Teacher là mô hình "giáo sư": xác suất sắc nét, hiểu rõ
// mối quan hệ giữa các lớp. Student là mô hình "học trò": ban đầu còn yếu.
// ---------------------------------------------------------------------------

const WORDS = ["mèo", "chó", "thỏ", "cá"] as const;

/** Phân bố "thô" (chưa chia nhiệt) của teacher — rất tự tin ở lớp mèo. */
const TEACHER_PROBS = [0.7, 0.15, 0.1, 0.05] as const;

/** Phân bố của student khi chưa qua distillation — sai lệch đáng kể. */
const STUDENT_BASE_PROBS = [0.48, 0.22, 0.18, 0.12] as const;

/** Phân bố của student sau khi đã distill — gần teacher hơn. */
const STUDENT_DISTILL_PROBS = [0.66, 0.18, 0.11, 0.05] as const;

/** Accuracy giả định trên test set cho 3 cấu hình khác nhau (điểm minh hoạ). */
const ACCURACY_SCENARIOS = [
  { label: "Teacher (110M)", acc: 0.945, color: "#3b82f6", size: "lớn" },
  { label: "Student scratch", acc: 0.772, color: "#ef4444", size: "nhỏ" },
  { label: "Student + KD logit", acc: 0.894, color: "#f59e0b", size: "nhỏ" },
  { label: "Student + KD feat+logit", acc: 0.921, color: "#22c55e", size: "nhỏ" },
] as const;

/** Cấu trúc minh hoạ các tầng ẩn của teacher và student. */
const TEACHER_LAYERS = [
  { name: "Embed", dim: 768 },
  { name: "Block 1", dim: 768 },
  { name: "Block 2", dim: 768 },
  { name: "Block 3", dim: 768 },
  { name: "Block 4", dim: 768 },
  { name: "Block 5", dim: 768 },
  { name: "Block 6", dim: 768 },
  { name: "Head", dim: 768 },
] as const;

const STUDENT_LAYERS = [
  { name: "Embed", dim: 384 },
  { name: "Block 1", dim: 384 },
  { name: "Block 2", dim: 384 },
  { name: "Block 3", dim: 384 },
  { name: "Head", dim: 384 },
] as const;

/**
 * Ánh xạ layer-wise (pattern distillation) — khi bật, student sẽ khớp
 * hidden state ở các tầng tương ứng với teacher, không chỉ ở logit cuối.
 * Đây là chiến lược lõi của TinyBERT / MobileBERT.
 */
const PATTERN_MAP: Array<[number, number]> = [
  [0, 0], // Embed ↔ Embed
  [2, 1], // Block 1 ↔ Teacher Block 2
  [3, 2], // Block 2 ↔ Teacher Block 3
  [5, 3], // Block 3 ↔ Teacher Block 5
  [7, 4], // Head ↔ Head
];

// ---------------------------------------------------------------------------
// QUIZ — 8 câu kiểm tra tổng quát, bám đúng nội dung bài học
// ---------------------------------------------------------------------------

const QUIZ: QuizQuestion[] = [
  {
    question: "Tại sao student học từ soft labels tốt hơn hard labels?",
    options: [
      "Soft labels có nhiều dữ liệu hơn",
      "Soft labels chứa 'dark knowledge' — mối quan hệ giữa các lớp mà hard labels không có",
      "Soft labels nhanh hơn khi huấn luyện",
      "Soft labels không bao giờ sai",
    ],
    correct: 1,
    explanation:
      "Hard label chỉ nói 'đây là mèo'. Soft label nói '70% mèo, 15% chó, 10% thỏ' — student học được rằng mèo và chó có đặc điểm tương tự nhau. Thông tin này (dark knowledge) rất quý giá vì nó tiết lộ cấu trúc của không gian lớp.",
  },
  {
    question: "Temperature T trong distillation có vai trò gì?",
    options: [
      "T cao làm phân bố mềm hơn, tiết lộ nhiều dark knowledge hơn",
      "T cao làm phân bố sắc nét hơn",
      "T không ảnh hưởng đến kết quả",
      "T chỉ ảnh hưởng đến tốc độ huấn luyện",
    ],
    correct: 0,
    explanation:
      "Khi T = 1: phân bố sắc nét (gần hard label). Khi T cao (4-20): phân bố phẳng hơn, tiết lộ nhiều mối quan hệ giữa các lớp. T quá cao thì tín hiệu yếu — thường T = 3-10 là tốt nhất trong thực tế.",
  },
  {
    question:
      "DistilBERT nhỏ hơn BERT bao nhiêu mà vẫn giữ được bao nhiêu hiệu suất?",
    options: [
      "Nhỏ hơn 40%, giữ 97% hiệu suất",
      "Nhỏ hơn 10%, giữ 99% hiệu suất",
      "Nhỏ hơn 80%, giữ 60% hiệu suất",
      "Nhỏ hơn 50%, giữ 50% hiệu suất",
    ],
    correct: 0,
    explanation:
      "DistilBERT có 66M tham số (so với BERT 110M = giảm 40%), chạy nhanh hơn 60%, mà vẫn giữ 97% hiệu suất trên GLUE. Đây là ví dụ kinh điển về sức mạnh của distillation ở quy mô công nghiệp.",
  },
  {
    type: "fill-blank",
    question:
      "Trong knowledge distillation, mô hình lớn đóng vai {blank} sinh ra soft labels để mô hình nhỏ hơn, gọi là {blank}, học theo.",
    blanks: [
      { answer: "teacher", accept: ["giáo viên", "thầy"] },
      { answer: "student", accept: ["học sinh", "trò"] },
    ],
    explanation:
      "Teacher (lớn, chính xác) chạy inference tạo soft labels chứa dark knowledge. Student (nhỏ, nhanh) học từ cả soft labels lẫn hard labels — bắt chước không chỉ đáp án mà cả quá trình suy luận của teacher.",
  },
  {
    question:
      "Nếu tăng T quá cao (ví dụ T = 50) thì hiện tượng gì xảy ra với tín hiệu học?",
    options: [
      "Phân bố gần như đều — student khó phân biệt lớp đúng và lớp sai, tín hiệu gradient rất yếu",
      "Student học nhanh gấp đôi",
      "Gradient bùng nổ do T^2 trong loss",
      "Không có gì thay đổi nếu α = 0.5",
    ],
    correct: 0,
    explanation:
      "Khi T rất lớn, softmax(logits/T) gần như phân bố đồng đều — mọi lớp xấp xỉ 1/K. Student không còn phân biệt được tín hiệu 'dark knowledge' vì tất cả đã bị làm phẳng quá mức. Dù ta nhân T^2 để bù gradient, tỷ lệ thông tin vẫn suy giảm nhanh.",
  },
  {
    question:
      "Pattern distillation (layer-wise matching) khác với logit distillation kinh điển ở điểm nào?",
    options: [
      "Không dùng soft labels, chỉ dùng hard labels",
      "Bắt student khớp hidden state / attention ở các tầng trung gian, không chỉ output cuối",
      "Chỉ áp dụng cho mô hình thị giác máy tính",
      "Yêu cầu teacher phải nhỏ hơn student",
    ],
    correct: 1,
    explanation:
      "Logit distillation chỉ nhìn vào output cuối (soft labels). Pattern distillation (TinyBERT, MobileBERT) thêm các loss phụ buộc student khớp hidden state, attention map ở nhiều tầng — giúp student học cách 'suy luận' chứ không chỉ 'dự đoán'.",
  },
  {
    question: "Ưu điểm lớn nhất của distillation so với pruning là gì?",
    options: [
      "Distillation luôn cho accuracy cao hơn pruning trong mọi trường hợp",
      "Student có kiến trúc tự do — có thể thay đổi depth/width, không bị ràng buộc vào cấu trúc teacher; còn pruning phải giữ nguyên kiến trúc gốc",
      "Distillation không cần dữ liệu huấn luyện",
      "Distillation chỉ chạy trên GPU, pruning chạy mọi nơi",
    ],
    correct: 1,
    explanation:
      "Với distillation bạn có thể thiết kế student hoàn toàn mới — ví dụ CNN lấy kiến thức từ ViT, hoặc student 6 tầng học từ teacher 24 tầng. Pruning bị khoá vào kiến trúc gốc. Điểm đánh đổi: distillation cần huấn luyện lại, còn pruning có thể áp dụng post-hoc.",
  },
  {
    question:
      "Khi nào bạn KHÔNG nên dùng distillation làm giải pháp nén mô hình?",
    options: [
      "Khi có dữ liệu huấn luyện dồi dào và teacher chất lượng cao",
      "Khi mục tiêu là giảm latency 40-60% trong khi giữ >95% accuracy",
      "Khi bạn không có teacher tốt, không có dữ liệu huấn luyện, và chỉ cần giảm kích thước file 2-4 lần — khi đó quantization hiệu quả hơn nhiều",
      "Khi đã có checkpoint SFT sẵn và preference data",
    ],
    correct: 2,
    explanation:
      "Distillation cần teacher chất lượng và dữ liệu để huấn luyện student. Nếu chỉ cần giảm kích thước file (ví dụ FP16 → INT8), quantization cho kết quả tức thì không cần train. Luôn chọn đúng tool: distillation = đổi kiến trúc; quantization = giảm precision; pruning = gỡ trọng số.",
  },
];

// ---------------------------------------------------------------------------
// HELPERS — softmax có nhiệt độ, khoảng cách giữa hai phân bố
// ---------------------------------------------------------------------------

/**
 * Softmax có nhiệt độ trên mảng logits. T cao => phân bố phẳng hơn,
 * T=1 => softmax chuẩn. Ta thao tác trong không gian log để tránh underflow.
 */
function temperedSoftmax(probs: readonly number[], T: number): number[] {
  const logits = probs.map((p) => Math.log(p + 1e-10) / T);
  const maxLogit = Math.max(...logits);
  const exps = logits.map((l) => Math.exp(l - maxLogit));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

/**
 * KL divergence D_KL(p || q) với p, q là hai phân bố rời rạc cùng kích thước.
 * Dùng để đo độ "xa" giữa student và teacher.
 */
function klDivergence(p: number[], q: number[]): number {
  let kl = 0;
  for (let i = 0; i < p.length; i++) {
    if (p[i] > 0) {
      kl += p[i] * Math.log((p[i] + 1e-10) / (q[i] + 1e-10));
    }
  }
  return kl;
}

/** Entropy H(p) — càng cao, phân bố càng "phẳng" / nhiều bất định. */
function entropy(p: number[]): number {
  return -p.reduce((acc, x) => acc + (x > 0 ? x * Math.log(x) : 0), 0);
}

// ---------------------------------------------------------------------------
// COMPONENT CHÍNH
// ---------------------------------------------------------------------------

export default function DistillationTopic() {
  // Nhiệt độ chưng cất T — slider trong VisualizationSection
  const [temperature, setTemperature] = useState<number>(4);
  // Bật/tắt pattern distillation (layer-wise matching)
  const [patternOn, setPatternOn] = useState<boolean>(true);
  // Chọn scenario accuracy để nhấn mạnh
  const [highlightScenario, setHighlightScenario] = useState<number>(3);

  // Soft labels của teacher sau khi làm mềm bởi T
  const teacherSoft = useMemo(
    () => temperedSoftmax(TEACHER_PROBS, temperature),
    [temperature],
  );

  // Soft labels của student "đã distill" — cũng bị làm mềm cùng T
  const studentSoft = useMemo(
    () => temperedSoftmax(STUDENT_DISTILL_PROBS, temperature),
    [temperature],
  );

  // Khoảng cách KL (student || teacher) trong không gian soft
  const klVal = useMemo(
    () => klDivergence(studentSoft, teacherSoft),
    [teacherSoft, studentSoft],
  );

  const teacherEntropy = useMemo(() => entropy(teacherSoft), [teacherSoft]);

  const togglePattern = useCallback(() => setPatternOn((v) => !v), []);

  return (
    <>
      {/* ============================================================
          BƯỚC 1 — HOOK / DỰ ĐOÁN
          ============================================================ */}

      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <ProgressSteps current={1} total={TOTAL_STEPS} />
        <div className="mt-4">
          <PredictionGate
            question="Mô hình GPT-4 rất giỏi nhưng quá lớn để chạy trên điện thoại. Cách nào tốt nhất để tạo phiên bản nhỏ mà vẫn giữ được phần lớn năng lực?"
            options={[
              "Xoá bớt lớp và tham số ngẫu nhiên cho tới khi đủ nhỏ",
              "Dạy mô hình nhỏ bắt chước cách suy nghĩ của mô hình lớn — không chỉ đáp án mà cả quá trình suy luận",
              "Huấn luyện mô hình nhỏ từ đầu trên cùng dữ liệu của mô hình lớn",
              "Chuyển mô hình lớn sang INT4 là đủ, không cần gì khác",
            ]}
            correct={1}
            explanation="Knowledge Distillation: mô hình lớn (teacher) 'dạy' mô hình nhỏ (student) bằng cách chia sẻ quá trình suy luận (soft labels), không chỉ đáp án đúng/sai. Các phương án còn lại đều có vai trò nhưng không thể thay thế KD khi mục tiêu là giữ accuracy cao trong kích thước nhỏ."
          >
            <p className="text-sm text-muted mt-2">
              Bí quyết nằm ở <strong>dark knowledge</strong> — kiến thức ẩn
              trong cách teacher phân phối xác suất giữa các lớp, không hề có
              mặt trong hard label.
            </p>
          </PredictionGate>
        </div>
      </LessonSection>

      {/* ============================================================
          BƯỚC 2 — ẨN DỤ
          ============================================================ */}

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Ẩn dụ">
        <p>
          Hãy tưởng tượng một <strong>giáo sư ngôn ngữ học</strong> đang chỉ
          dẫn một sinh viên mới vào nghề. Có hai cách dạy hoàn toàn khác nhau.
        </p>
        <p>
          <strong>Cách cổ điển (hard label)</strong> — giáo sư chỉ cho sinh
          viên xem đáp án đúng của từng bài tập: "câu 1 đáp án là A, câu 2 đáp
          án là B". Sinh viên thuộc bảng đáp án, nhưng không hiểu vì sao A
          đúng, cũng không biết B và C khác nhau ở đâu. Khi gặp bài tập mới
          một chút, sinh viên bị động.
        </p>
        <p>
          <strong>Cách chưng cất (soft label)</strong> — giáo sư không chỉ
          nói "đáp án là A", mà còn thì thầm thêm: "mà B cũng khá hợp lý đấy,
          chỉ thiếu một chi tiết; còn C thì rõ ràng sai vì vi phạm quy tắc
          này". Sinh viên học được <em>cấu trúc</em> của bài toán, không chỉ
          đáp án. Lần sau gặp biến thể mới, sinh viên biết dùng nguyên tắc
          tương tự để suy ra.
        </p>
        <p>
          Knowledge Distillation chính là cách thứ hai, áp dụng vào mạng
          nơ-ron. Teacher (mô hình lớn đã được huấn luyện tốt) không chỉ cung
          cấp label đúng, mà còn cung cấp toàn bộ phân bố xác suất trên mọi
          lớp — mỗi con số nhỏ trong phân bố là một gợi ý về cách nhìn thế
          giới của teacher. Student hấp thụ các gợi ý đó và đạt tới năng lực
          vượt xa việc học hard label thông thường — dù kích thước chỉ bằng
          một nửa, một phần ba hay thậm chí một phần mười.
        </p>
        <p>
          Cái đẹp của ẩn dụ này là ta có thể đẩy nó đi xa hơn: teacher không
          chỉ "thì thầm đáp án", mà có thể <strong>chỉ cả cách làm</strong> —
          ánh mắt họ nhìn vào đâu, họ chú ý đến chi tiết nào (tương tự như
          attention map), họ đã tinh chỉnh qua những tầng suy nghĩ nào (tương
          tự hidden state trung gian). Khi student khớp cả quá trình đó —
          không chỉ output cuối — ta gọi là <em>pattern distillation</em>,
          một phát triển mạnh mẽ hơn distillation gốc.
        </p>
      </LessonSection>

      {/* ============================================================
          BƯỚC 3 — TRỰC QUAN HÓA TƯƠNG TÁC
          ============================================================ */}

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          {/* ------------ 3A. Cấu trúc teacher / student ------------ */}
          <h3 className="text-base font-semibold text-foreground mb-1">
            Kiến trúc Teacher vs Student
          </h3>
          <p className="text-sm text-muted mb-4">
            Teacher sâu & rộng; Student nông & hẹp. Mũi tên xám chỉ ánh xạ
            pattern distillation giữa các tầng tương ứng.
          </p>

          <svg viewBox="0 0 780 360" className="w-full max-w-3xl mx-auto mb-6">
            {/* Nhãn cho hai cột */}
            <text
              x="120"
              y="22"
              textAnchor="middle"
              fill="#3b82f6"
              fontSize="12"
              fontWeight="bold"
            >
              Teacher (110M tham số · 8 tầng)
            </text>
            <text
              x="620"
              y="22"
              textAnchor="middle"
              fill="#22c55e"
              fontSize="12"
              fontWeight="bold"
            >
              Student (25M tham số · 5 tầng)
            </text>

            {/* Các tầng teacher — cột trái */}
            {TEACHER_LAYERS.map((layer, i) => {
              const y = 40 + i * 36;
              return (
                <g key={`t-${i}`}>
                  <rect
                    x={40}
                    y={y}
                    width={160}
                    height={26}
                    rx={6}
                    fill="#3b82f6"
                    opacity={0.18 + (i / TEACHER_LAYERS.length) * 0.35}
                    stroke="#3b82f6"
                    strokeWidth={1.2}
                  />
                  <text
                    x={120}
                    y={y + 17}
                    textAnchor="middle"
                    fill="#3b82f6"
                    fontSize="11"
                    fontWeight="bold"
                  >
                    {layer.name} ({layer.dim})
                  </text>
                </g>
              );
            })}

            {/* Các tầng student — cột phải */}
            {STUDENT_LAYERS.map((layer, i) => {
              const y = 70 + i * 52;
              return (
                <g key={`s-${i}`}>
                  <rect
                    x={540}
                    y={y}
                    width={160}
                    height={26}
                    rx={6}
                    fill="#22c55e"
                    opacity={0.25 + (i / STUDENT_LAYERS.length) * 0.4}
                    stroke="#22c55e"
                    strokeWidth={1.2}
                  />
                  <text
                    x={620}
                    y={y + 17}
                    textAnchor="middle"
                    fill="#22c55e"
                    fontSize="11"
                    fontWeight="bold"
                  >
                    {layer.name} ({layer.dim})
                  </text>
                </g>
              );
            })}

            {/* Đường pattern distillation (nếu bật) */}
            {patternOn &&
              PATTERN_MAP.map(([studentIdx, teacherIdx], k) => {
                const ty = 40 + teacherIdx * 36 + 13;
                const sy = 70 + studentIdx * 52 + 13;
                return (
                  <line
                    key={`pm-${k}`}
                    x1={200}
                    y1={ty}
                    x2={540}
                    y2={sy}
                    stroke="#94a3b8"
                    strokeWidth={1.2}
                    strokeDasharray="4 3"
                    opacity={0.7}
                  />
                );
              })}

            {/* Logit distillation — luôn có: head → head */}
            <line
              x1={200}
              y1={40 + 7 * 36 + 13}
              x2={540}
              y2={70 + 4 * 52 + 13}
              stroke="#f59e0b"
              strokeWidth={2}
              markerEnd="url(#arr-kd)"
            />
            <text
              x={370}
              y={320}
              textAnchor="middle"
              fill="#f59e0b"
              fontSize="11"
              fontWeight="bold"
            >
              Logit distillation (luôn bật)
            </text>
            <text
              x={370}
              y={340}
              textAnchor="middle"
              fill="var(--text-secondary)"
              fontSize="11"
            >
              {patternOn
                ? "Pattern distillation: ĐANG BẬT — khớp hidden states trung gian"
                : "Pattern distillation: TẮT — chỉ khớp output"}
            </text>

            <defs>
              <marker
                id="arr-kd"
                markerWidth="10"
                markerHeight="7"
                refX="10"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#f59e0b" />
              </marker>
            </defs>
          </svg>

          <div className="flex justify-center mb-6">
            <button
              onClick={togglePattern}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                patternOn
                  ? "bg-green-500 text-white"
                  : "bg-card border border-border text-muted hover:text-foreground"
              }`}
            >
              Pattern distillation: {patternOn ? "ĐANG BẬT" : "TẮT"}
            </button>
          </div>

          <Callout variant="tip" title="Quan sát">
            Khi bật pattern distillation, student không chỉ học từ output cuối
            mà còn phải khớp các biểu diễn trung gian của teacher — điều này
            nâng accuracy thêm 2-4% nhưng tốn thêm ~25% thời gian huấn luyện.
          </Callout>

          {/* ------------ 3B. Soft labels theo nhiệt độ ------------ */}
          <h3 className="text-base font-semibold text-foreground mt-8 mb-1">
            Soft Labels thay đổi theo nhiệt độ
          </h3>
          <p className="text-sm text-muted mb-4">
            Kéo thanh trượt nhiệt độ T và quan sát phân bố xác suất thay đổi
            cho cả teacher lẫn student.
          </p>

          <div className="space-y-1 max-w-lg mx-auto mb-4">
            <label className="text-sm text-muted">
              Nhiệt độ chưng cất T ={" "}
              <strong className="text-foreground">{temperature}</strong>
            </label>
            <input
              type="range"
              min={1}
              max={20}
              step={1}
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none bg-surface accent-accent cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted">
              <span>T=1 (sắc nét)</span>
              <span>T=20 (rất mềm)</span>
            </div>
          </div>

          <motion.svg
            key={temperature}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            viewBox="0 0 760 260"
            className="w-full max-w-3xl mx-auto mb-4"
          >
            {/* Cột Teacher */}
            <text
              x="140"
              y="18"
              textAnchor="middle"
              fill="#3b82f6"
              fontSize="11"
              fontWeight="bold"
            >
              Teacher (soft T={temperature})
            </text>
            {teacherSoft.map((p, i) => {
              const barW = p * 200;
              return (
                <g key={`t-${i}`}>
                  <rect
                    x={30}
                    y={36 + i * 50}
                    width={barW}
                    height={28}
                    rx={4}
                    fill="#3b82f6"
                    opacity={0.78}
                  />
                  <text
                    x={40 + barW}
                    y={55 + i * 50}
                    fill="#3b82f6"
                    fontSize="11"
                    fontWeight="bold"
                  >
                    {WORDS[i]}: {(p * 100).toFixed(1)}%
                  </text>
                </g>
              );
            })}

            {/* Mũi tên chuyển thông tin */}
            <text
              x={380}
              y={120}
              textAnchor="middle"
              fill="var(--text-tertiary)"
              fontSize="11"
            >
              KD
            </text>
            <line
              x1={300}
              y1={130}
              x2={460}
              y2={130}
              stroke="var(--text-tertiary)"
              strokeWidth={2}
              markerEnd="url(#arr-dist)"
            />

            {/* Cột Student */}
            <text
              x={620}
              y={18}
              textAnchor="middle"
              fill="#22c55e"
              fontSize="11"
              fontWeight="bold"
            >
              Student (đã distill, soft T={temperature})
            </text>
            {studentSoft.map((p, i) => {
              const barW = p * 200;
              return (
                <g key={`s-${i}`}>
                  <rect
                    x={520}
                    y={36 + i * 50}
                    width={barW}
                    height={28}
                    rx={4}
                    fill="#22c55e"
                    opacity={0.78}
                  />
                  <text
                    x={530 + barW}
                    y={55 + i * 50}
                    fill="#22c55e"
                    fontSize="11"
                    fontWeight="bold"
                  >
                    {WORDS[i]}: {(p * 100).toFixed(1)}%
                  </text>
                </g>
              );
            })}

            <defs>
              <marker
                id="arr-dist"
                markerWidth="10"
                markerHeight="7"
                refX="10"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="var(--text-tertiary)"
                />
              </marker>
            </defs>
          </motion.svg>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg border border-border bg-background/50 p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted">
                Entropy teacher
              </p>
              <p className="text-lg font-mono text-blue-500 mt-1">
                {teacherEntropy.toFixed(3)}
              </p>
              <p className="text-[10px] text-muted mt-1">
                Càng cao = phân bố càng mềm
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background/50 p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted">
                KL(student || teacher)
              </p>
              <p className="text-lg font-mono text-yellow-500 mt-1">
                {klVal.toFixed(4)}
              </p>
              <p className="text-[10px] text-muted mt-1">
                Loss distillation chính là đại lượng này
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background/50 p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted">
                Nhân bù T²
              </p>
              <p className="text-lg font-mono text-accent mt-1">
                {(temperature * temperature).toFixed(0)}×
              </p>
              <p className="text-[10px] text-muted mt-1">
                Hinton nhân T² để gradient không bị co lại
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
            <p className="text-sm text-muted">
              {temperature <= 3
                ? "Nhiệt độ thấp: Soft labels gần giống hard labels — student học ít dark knowledge."
                : temperature <= 10
                  ? "Nhiệt độ vừa: Phân bố mềm hơn — student học được mối quan hệ giữa các lớp."
                  : "Nhiệt độ cao: Phân bố rất phẳng — nhiều dark knowledge nhưng tín hiệu yếu."}
            </p>
          </div>

          {/* ------------ 3C. Biểu đồ accuracy so sánh ------------ */}
          <h3 className="text-base font-semibold text-foreground mt-8 mb-1">
            Accuracy: có & không có distillation
          </h3>
          <p className="text-sm text-muted mb-4">
            Kết quả minh hoạ trên một test set 10.000 mẫu. Click vào từng cột
            để xem ghi chú chi tiết về cấu hình.
          </p>

          <svg viewBox="0 0 720 280" className="w-full max-w-3xl mx-auto mb-4">
            {/* Trục */}
            <line
              x1={60}
              y1={240}
              x2={700}
              y2={240}
              stroke="var(--text-tertiary)"
              strokeWidth={1}
            />
            <line
              x1={60}
              y1={30}
              x2={60}
              y2={240}
              stroke="var(--text-tertiary)"
              strokeWidth={1}
            />
            {[0.5, 0.6, 0.7, 0.8, 0.9, 1].map((v) => {
              const y = 240 - (v - 0.5) * 420;
              return (
                <g key={v}>
                  <line
                    x1={58}
                    y1={y}
                    x2={62}
                    y2={y}
                    stroke="var(--text-tertiary)"
                  />
                  <text
                    x={50}
                    y={y + 4}
                    textAnchor="end"
                    fill="var(--text-tertiary)"
                    fontSize="11"
                  >
                    {(v * 100).toFixed(0)}%
                  </text>
                </g>
              );
            })}

            {/* Các cột */}
            {ACCURACY_SCENARIOS.map((s, i) => {
              const x = 120 + i * 140;
              const h = (s.acc - 0.5) * 420;
              const y = 240 - h;
              const isHi = i === highlightScenario;
              return (
                <g
                  key={s.label}
                  style={{ cursor: "pointer" }}
                  onClick={() => setHighlightScenario(i)}
                >
                  <rect
                    x={x}
                    y={y}
                    width={80}
                    height={h}
                    rx={6}
                    fill={s.color}
                    opacity={isHi ? 0.95 : 0.55}
                    stroke={s.color}
                    strokeWidth={isHi ? 2 : 1}
                  />
                  <text
                    x={x + 40}
                    y={y - 8}
                    textAnchor="middle"
                    fill={s.color}
                    fontSize="11"
                    fontWeight="bold"
                  >
                    {(s.acc * 100).toFixed(1)}%
                  </text>
                  <text
                    x={x + 40}
                    y={258}
                    textAnchor="middle"
                    fill={s.color}
                    fontSize="11"
                    fontWeight="bold"
                  >
                    {s.label}
                  </text>
                  <text
                    x={x + 40}
                    y={270}
                    textAnchor="middle"
                    fill="var(--text-tertiary)"
                    fontSize="11"
                  >
                    (mô hình {s.size})
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="rounded-lg border border-accent/40 bg-accent/5 p-3">
            <p className="text-sm font-semibold text-accent mb-1">
              {ACCURACY_SCENARIOS[highlightScenario].label}
            </p>
            <p className="text-xs text-muted">
              {highlightScenario === 0 &&
                "Teacher — mô hình lớn, chuẩn. Accuracy gần tối đa nhưng quá nặng để triển khai trên thiết bị cuối."}
              {highlightScenario === 1 &&
                "Student huấn luyện từ đầu — chỉ dùng hard labels, không có signal từ teacher. Accuracy rơi mạnh vì dung lượng nhỏ không đủ để khám phá mọi pattern."}
              {highlightScenario === 2 &&
                "Student + KD logit — thêm soft labels từ teacher vào loss. Accuracy tăng 12 điểm so với train from scratch."}
              {highlightScenario === 3 &&
                "Student + KD logit + feature — thêm pattern distillation ở các tầng trung gian. Chỉ thua teacher 2.4 điểm nhưng nhỏ hơn ~4.4 lần."}
            </p>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ============================================================
          BƯỚC 4 — KHOẢNH KHẮC AHA
          ============================================================ */}

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          Khi teacher nói &quot;70% mèo, 15% chó, 10% thỏ&quot;, student không
          chỉ biết đáp án là mèo — mà còn biết{" "}
          <strong>mèo và chó giống nhau hơn mèo và cá</strong>. Thông tin
          &quot;ẩn&quot; này (<strong>dark knowledge</strong>) chính là lý do
          distillation hiệu quả hơn dạy bằng hard label thông thường. Điều
          đáng kinh ngạc: <em>chính những xác suất nhỏ bị bỏ qua</em> mới là
          phần quý giá nhất của teacher — chúng mô tả cấu trúc hình học của
          không gian lớp. Hard label làm ta mù trước cấu trúc đó.
        </AhaMoment>
      </LessonSection>

      {/* ============================================================
          BƯỚC 5 — INLINE CHALLENGES (2 thách thức)
          ============================================================ */}

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Teacher cho soft label: [0.8, 0.15, 0.04, 0.01]. Hard label là [1, 0, 0, 0]. Thông tin gì bị mất khi dùng hard label?"
          options={[
            "Hard label vẫn giữ đủ thông tin",
            "Mất thông tin về mối quan hệ: lớp 2 gần lớp 1 hơn lớp 3 và lớp 4",
            "Hard label mất thông tin về tốc độ huấn luyện",
            "Hard label chỉ mất 20% thông tin",
          ]}
          correct={1}
          explanation="Hard label [1,0,0,0] nói 'chắc chắn là lớp 1, còn lại đều sai'. Soft label cho biết thêm: lớp 2 (15%) tương tự lớp 1 hơn lớp 3 (4%) hay lớp 4 (1%). Dark knowledge quý giá này giúp student tổng quát hoá tốt hơn trên các mẫu mà nó chưa từng thấy."
        />

        <div className="mt-4">
          <InlineChallenge
            question="Bạn huấn luyện student với α = 0 (chỉ soft loss, không dùng hard label). Sau 10 epoch, student bắt đầu phạm các lỗi 'bịa' mà teacher không hề có. Vấn đề gì?"
            options={[
              "Không có vấn đề gì, student đang hội tụ bình thường",
              "Khi α = 0, student bắt chước hoàn hảo mọi thiên lệch của teacher — bao gồm cả sai lầm. Cần α > 0 để ground truth neo student lại",
              "Temperature quá thấp, cần tăng lên T = 50",
              "Student đang học tốt hơn teacher, đây là Born-Again Network",
            ]}
            correct={1}
            explanation="Teacher không hoàn hảo — nó có bias, có trường hợp nó sai. Nếu α = 0, student sẽ học sạch cả sai lầm đó mà không có hard label neo lại. Công thức cân bằng phổ biến: α = 0.5, đảm bảo cả hai nguồn tín hiệu cùng có mặt."
          />
        </div>
      </LessonSection>

      {/* ============================================================
          BƯỚC 6 — GIẢI THÍCH SÂU
          ============================================================ */}

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Knowledge Distillation</strong> (Hinton, Vinyals &amp;
            Dean, 2015) huấn luyện student trên hỗn hợp hard label và soft
            label từ teacher. Đây là một lựa chọn nén mô hình thay thế cho{" "}
            <TopicLink slug="quantization">quantization</TopicLink> và{" "}
            <TopicLink slug="pruning">pruning</TopicLink>, với ưu điểm đặc
            biệt: <strong>student có thể có kiến trúc hoàn toàn khác</strong>{" "}
            với teacher.
          </p>

          <p>
            Hàm loss tổng quát của distillation:
          </p>
          <LaTeX block>{"\\mathcal{L} = \\alpha \\cdot \\mathcal{L}_{\\text{CE}}(y, \\hat{y}_s) + (1-\\alpha) \\cdot T^2 \\cdot D_{\\text{KL}}(\\sigma(z_t/T) \\| \\sigma(z_s/T))"}</LaTeX>

          <p>
            Trong đó <LaTeX>{"T"}</LaTeX> là temperature,{" "}
            <LaTeX>{"z_t, z_s"}</LaTeX> là logits của teacher và student,{" "}
            <LaTeX>{"\\alpha"}</LaTeX> cân bằng giữa hard và soft loss. Nhân{" "}
            <LaTeX>{"T^2"}</LaTeX> để gradient không bị thu nhỏ khi T tăng —
            đây là chi tiết kỹ thuật Hinton đưa ra ngay trong paper gốc.
          </p>

          <p>Quy trình distillation cơ bản gồm ba bước:</p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>Teacher dự đoán:</strong> Mô hình lớn đã huấn luyện tốt
              chạy inference trên tập dữ liệu, tạo soft labels (logit hoặc
              probability sau softmax).
            </li>
            <li>
              <strong>Làm mềm phân bố:</strong> Chia logits cho T trước
              softmax — T cao = phân bố phẳng hơn, tiết lộ thứ hạng tương đối
              của mọi lớp.
            </li>
            <li>
              <strong>Student học:</strong> Huấn luyện trên cả hard labels
              (ground truth) và soft labels (teacher) với trọng số{" "}
              <LaTeX>{"\\alpha"}</LaTeX>.
            </li>
          </ul>

          <CodeBlock language="python" title="distillation_loss.py">{`import torch.nn.functional as F

def distillation_loss(
    student_logits,
    teacher_logits,
    labels,
    T: float = 4.0,
    alpha: float = 0.5,
):
    """Hàm loss distillation chuẩn Hinton 2015.

    Args:
        student_logits: output thô của student (chưa softmax), shape (B, C)
        teacher_logits: output thô của teacher, shape (B, C)
        labels:         ground truth hard labels, shape (B,)
        T:              temperature — càng cao, phân bố càng mềm
        alpha:          trọng số hard loss vs soft loss

    Trả về scalar loss để backprop.
    """
    # ---- Soft loss: KL divergence trên phân bố đã làm mềm ----
    soft_t = F.softmax(teacher_logits / T, dim=-1)
    log_soft_s = F.log_softmax(student_logits / T, dim=-1)
    soft_loss = F.kl_div(
        log_soft_s,
        soft_t,
        reduction="batchmean",
    ) * (T ** 2)  # nhân T^2 để bù gradient

    # ---- Hard loss: cross-entropy với ground truth ----
    hard_loss = F.cross_entropy(student_logits, labels)

    return alpha * hard_loss + (1 - alpha) * soft_loss


# ---- Vòng lặp huấn luyện ngắn gọn ----
for batch in loader:
    x, y = batch
    with torch.no_grad():
        t_logits = teacher(x)         # teacher đóng băng
    s_logits = student(x)
    loss = distillation_loss(s_logits, t_logits, y, T=4.0, alpha=0.5)

    optimizer.zero_grad()
    loss.backward()
    optimizer.step()`}</CodeBlock>

          <p>
            Với các biến thể pattern distillation (TinyBERT, MobileBERT,
            DistilBERT), ta bổ sung thêm các loss trung gian — ví dụ buộc
            student khớp hidden state và attention map của teacher tại một số
            tầng tương ứng:
          </p>

          <CodeBlock language="python" title="pattern_distill.py">{`import torch
import torch.nn.functional as F

class PatternDistiller(torch.nn.Module):
    """Distill cả output cuối lẫn hidden state trung gian.

    Các tầng của student và teacher được ánh xạ qua student_to_teacher.
    """

    def __init__(self, student, teacher, student_to_teacher: dict[int, int]):
        super().__init__()
        self.student = student
        self.teacher = teacher
        self.teacher.eval()
        for p in self.teacher.parameters():
            p.requires_grad_(False)
        self.pattern_map = student_to_teacher
        # Projection nếu kích thước hidden khác nhau
        self.proj = torch.nn.Linear(
            student.hidden_size,
            teacher.hidden_size,
            bias=False,
        )

    def forward(self, x, labels, T=4.0, alpha=0.5, beta=0.1):
        s_out = self.student(x, output_hidden_states=True)
        with torch.no_grad():
            t_out = self.teacher(x, output_hidden_states=True)

        # 1) Logit loss (Hinton KD)
        logit_loss = (
            F.kl_div(
                F.log_softmax(s_out.logits / T, dim=-1),
                F.softmax(t_out.logits / T, dim=-1),
                reduction="batchmean",
            )
            * (T ** 2)
        )
        ce = F.cross_entropy(s_out.logits, labels)

        # 2) Hidden-state loss — MSE giữa các tầng tương ứng
        hidden_loss = 0.0
        for s_idx, t_idx in self.pattern_map.items():
            s_h = self.proj(s_out.hidden_states[s_idx])
            t_h = t_out.hidden_states[t_idx]
            hidden_loss = hidden_loss + F.mse_loss(s_h, t_h)

        return alpha * ce + (1 - alpha) * logit_loss + beta * hidden_loss`}</CodeBlock>

          <Callout variant="insight" title="Distillation trong thời đại LLM">
            Ngoài logit distillation cổ điển, LLM dùng nhiều kỹ thuật mới:{" "}
            <strong>synthetic data</strong> (teacher sinh dữ liệu cho
            student), <strong>chain-of-thought distillation</strong> (dạy cả
            quá trình suy luận bằng cách cho student bắt chước CoT của
            teacher), và <strong>API distillation</strong> (dùng GPT-4 API để{" "}
            <TopicLink slug="fine-tuning">fine-tune</TopicLink> mô hình nhỏ
            hơn qua hàng triệu cặp prompt/completion). Orca, Phi-1, Phi-2,
            Zephyr và Alpaca đều là các ví dụ nổi tiếng của distillation
            thế hệ mới.
          </Callout>

          <Callout variant="tip" title="Chọn temperature T như thế nào">
            Nguyên tắc thực tế: bắt đầu với <strong>T = 4</strong>, thử cả{" "}
            <strong>T = 2</strong> và <strong>T = 8</strong>, chọn giá trị
            nào khiến validation accuracy cao nhất. Với bài toán nhiều lớp
            (ImageNet 1K), T = 3 tới T = 6 thường tốt. Với NLP và bài toán ít
            lớp, T = 2 tới T = 4 đã đủ. Tránh T &gt; 20 — tín hiệu quá yếu.
          </Callout>

          <Callout variant="warning" title="Cẩn thận với bias của teacher">
            Distillation không chỉ truyền kiến thức — nó còn truyền sai lầm.
            Nếu teacher có bias về giới tính, chủng tộc, hay văn phong, student
            sẽ kế thừa. Cần kiểm tra teacher cẩn thận trước khi dùng làm nguồn
            signal. Đây là lý do chính vì sao <em>constitutional AI</em> và{" "}
            <em>debiasing</em> được thực hiện trước khi distill.
          </Callout>

          <Callout variant="info" title="Born-Again Network — khi student vượt teacher">
            Furlanello et al. (2018) phát hiện một điều lạ: nếu ta distill
            student với kiến trúc y hệt teacher, lặp đi lặp lại nhiều đời, đôi
            khi student sẽ <em>vượt</em> teacher vài điểm accuracy. Hiện tượng
            này gọi là Born-Again Network — có thể xem như một dạng tự-ensemble
            qua nhiều thế hệ. Nó minh chứng rằng distillation không chỉ nén,
            mà còn có vai trò regularization.
          </Callout>

          <CollapsibleDetail title="Chứng minh: vì sao nhân T² trong soft loss">
            <p>
              Gradient của cross-entropy trên soft label scale với{" "}
              <LaTeX>{"1/T"}</LaTeX>. Vì ta tính loss trên hai phân bố đều đã
              chia cho T, gradient tổng scale như <LaTeX>{"1/T^2"}</LaTeX>.
              Khi T tăng, cường độ tín hiệu giảm mạnh. Nhân lại{" "}
              <LaTeX>{"T^2"}</LaTeX> để giữ độ lớn gradient tương đương giữa
              soft loss và hard loss — nếu không, soft loss sẽ gần như vô
              hình trong tổng loss khi T &gt; 3. Đây là một chi tiết kỹ thuật
              nhỏ nhưng cực kỳ quan trọng, Hinton đưa vào đoạn nhỏ ở phụ lục
              paper 2015 và nhiều implementation lơ là đã gặp rắc rối vì bỏ
              sót.
            </p>
            <LaTeX block>{"\\nabla_{z_s} \\mathcal{L}_{\\text{soft}} = \\frac{1}{T}\\big(\\sigma(z_s/T) - \\sigma(z_t/T)\\big) \\implies \\text{nhân } T^2 \\text{ để bù}"}</LaTeX>
          </CollapsibleDetail>

          <CollapsibleDetail title="Các biến thể hiện đại của distillation">
            <p>
              Kể từ paper gốc 2015, hàng chục biến thể đã được đề xuất. Vài
              biến thể quan trọng:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2 mt-2">
              <li>
                <strong>FitNets (Romero 2015):</strong> Student khớp
                feature map ở một tầng trung gian của teacher — mở đường cho
                pattern distillation.
              </li>
              <li>
                <strong>Attention Transfer (Zagoruyko 2017):</strong> Khớp
                "attention map" — tổng bình phương feature theo kênh — giữa
                teacher và student. Dễ triển khai hơn FitNets.
              </li>
              <li>
                <strong>TinyBERT (Jiao 2020):</strong> Distill bốn loại signal
                đồng thời: embedding, attention, hidden state, và prediction
                — đạt 96.8% hiệu suất BERT với 1/7 tham số.
              </li>
              <li>
                <strong>DistilBERT (Sanh 2019):</strong> Distill logit + triple
                loss (MLM + cosine hidden + CE). Kích thước 66M, giữ 97%
                accuracy BERT trên GLUE.
              </li>
              <li>
                <strong>MobileBERT (Sun 2020):</strong> Kiến trúc bottleneck
                đặc biệt + progressive knowledge transfer. Chạy thời gian
                thực trên điện thoại.
              </li>
              <li>
                <strong>Orca / Phi (Microsoft 2023-2024):</strong> Distill CoT
                reasoning từ GPT-4 vào mô hình 1.3B-13B. Lần đầu cho thấy
                student có thể "học lý luận" chứ không chỉ học output.
              </li>
              <li>
                <strong>Minillm (2023):</strong> Dùng reverse KL{" "}
                <LaTeX>{"D_{\\text{KL}}(q_s \\| p_t)"}</LaTeX> thay vì forward
                KL — student học mode quan trọng thay vì cố phủ mọi mode.
              </li>
            </ul>
          </CollapsibleDetail>

          <p>
            <strong>Ứng dụng thực tế</strong> — distillation được dùng ở hầu
            hết quy trình triển khai mô hình lớn ra sản phẩm:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>Serving giá rẻ:</strong> Teacher GPT-4 → distill thành
              mô hình 7B cho các tác vụ cụ thể (dịch, tóm tắt, classify).
              Giảm chi phí 100-1000 lần.
            </li>
            <li>
              <strong>On-device AI:</strong> DistilBERT và MobileBERT chạy
              trên điện thoại, TinyStories nhỏ đến mức chạy CPU. Latency vài
              ms.
            </li>
            <li>
              <strong>Edge computing:</strong> Student 1-3M tham số triển khai
              trên microcontroller cho IoT — teacher có thể là mô hình cloud.
            </li>
            <li>
              <strong>Ensemble compression:</strong> Distill một ensemble 10
              mô hình thành một mô hình đơn — giữ 95% năng lực mà chi phí
              inference chỉ bằng 1/10.
            </li>
            <li>
              <strong>Privacy-preserving training:</strong> Teacher train trên
              dữ liệu nhạy cảm; student chỉ học qua soft labels — tránh rò rỉ
              dữ liệu gốc.
            </li>
          </ul>

          <p>
            <strong>Các pitfall thường gặp</strong> khi triển khai:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>Teacher yếu:</strong> Nếu teacher chỉ đạt 80% accuracy,
              student hiếm khi vượt quá teacher. Chọn teacher đủ mạnh trước
              khi distill.
            </li>
            <li>
              <strong>Capacity gap quá lớn:</strong> Teacher 100B → student
              100M quá xa; soft labels trở nên "quá phức tạp" so với dung
              lượng student. Cách khắc phục: dùng <em>teacher assistant</em>{" "}
              — một mô hình trung gian (ví dụ 10B) làm cầu nối.
            </li>
            <li>
              <strong>Quên đóng băng teacher:</strong> Một lỗi phổ biến —
              teacher không được set <code>requires_grad = False</code>, dẫn
              tới cả hai cùng cập nhật và loss trở nên vô nghĩa.
            </li>
            <li>
              <strong>α sai:</strong> α = 0 khiến student bắt chước mọi sai
              lầm của teacher; α = 1 thì distillation mất tác dụng. Bắt đầu
              với α = 0.5 rồi tinh chỉnh.
            </li>
            <li>
              <strong>T không đổi:</strong> Một số paper cho thấy dùng T
              schedule (cao lúc đầu, thấp lúc cuối) cải thiện kết quả, giống
              curriculum learning.
            </li>
            <li>
              <strong>Dữ liệu distillation kém chất lượng:</strong> Nếu chỉ
              dùng dữ liệu gốc, dark knowledge bị giới hạn. Dùng thêm dữ liệu
              không nhãn (unlabeled) — teacher tạo label cho nó — thường cải
              thiện mạnh.
            </li>
          </ul>

          <Callout variant="info" title="So với pruning và quantization">
            Ba kỹ thuật nén mô hình có mục tiêu khác nhau và bổ sung lẫn
            nhau: <strong>pruning</strong> gỡ trọng số ít quan trọng nhưng
            giữ kiến trúc;{" "}
            <TopicLink slug="quantization">quantization</TopicLink> giảm
            precision nhưng giữ cả kiến trúc lẫn số tham số;{" "}
            <strong>distillation</strong> thay đổi hoàn toàn kiến trúc. Trong
            pipeline production, bạn thường dùng cả ba: distill teacher thành
            student, rồi prune student, rồi quantize. Mỗi bước cắt 2-4 lần
            kích thước.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ============================================================
          BƯỚC 7 — TÓM TẮT
          ============================================================ */}

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ về Knowledge Distillation"
          points={[
            "Distillation dạy student bắt chước teacher qua soft labels — không chỉ đáp án mà cả quá trình suy luận qua phân bố xác suất.",
            "Dark knowledge: thông tin ẩn trong xác suất nhỏ (15% chó, 10% thỏ) giúp student tổng quát hoá tốt hơn hard labels.",
            "Temperature T kiểm soát độ mềm: T thấp (1-3) = sắc nét, T vừa (4-10) = cân bằng tốt nhất, T cao (>10) = tín hiệu yếu.",
            "Loss = α·CE(hard) + (1-α)·T²·KL(soft_t || soft_s). Nhân T² để bù gradient — chi tiết kỹ thuật quan trọng.",
            "Pattern distillation (TinyBERT, MobileBERT) khớp cả hidden state và attention — cải thiện 2-4% so với logit-only.",
            "DistilBERT: nhỏ hơn 40%, nhanh hơn 60%, giữ 97% hiệu suất — minh chứng sức mạnh của distillation ở quy mô công nghiệp.",
          ]}
        />
      </LessonSection>

      {/* ============================================================
          BƯỚC 8 — QUIZ
          ============================================================ */}

      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
