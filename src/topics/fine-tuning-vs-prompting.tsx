"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  Callout,
  CollapsibleDetail,
  MiniSummary,
  CodeBlock,
  LessonSection,
  LaTeX,
  TopicLink,
  ProgressSteps,
  TabView,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

// ──────────────────────────────────────────────────────────────────────────────
// METADATA
// ──────────────────────────────────────────────────────────────────────────────

export const metadata: TopicMeta = {
  slug: "fine-tuning-vs-prompting",
  title: "Fine-tuning vs Prompting",
  titleVi: "Fine-tuning hay Prompting?",
  description:
    "Khi nào nên tinh chỉnh model, khi nào chỉ cần kỹ thuật prompt — hướng dẫn chọn chiến lược phù hợp cho dự án AI của bạn.",
  category: "llm-concepts",
  tags: ["fine-tuning", "prompting", "comparison", "strategy"],
  difficulty: "advanced",
  relatedSlugs: [
    "prompt-engineering",
    "fine-tuning",
    "lora",
    "in-context-learning",
    "rag",
  ],
  vizType: "interactive",
};

// ──────────────────────────────────────────────────────────────────────────────
// DECISION TREE DATA — 5 câu hỏi dẫn đến 4 chiến lược
// ──────────────────────────────────────────────────────────────────────────────

type Strategy = "few-shot" | "rag" | "lora" | "full-ft";

interface StrategyInfo {
  key: Strategy;
  name: string;
  shortName: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  whenToUse: string;
  cost: string;
  quality: string;
  time: string;
  dataNeeded: string;
  latency: string;
  example: string;
  pros: string[];
  cons: string[];
}

const STRATEGIES: Record<Strategy, StrategyInfo> = {
  "few-shot": {
    key: "few-shot",
    name: "Few-shot Prompting",
    shortName: "Few-shot",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-900/15",
    borderColor: "border-blue-300 dark:border-blue-700",
    description:
      "Đưa 2–10 ví dụ mẫu ngay trong prompt — model bắt chước pattern mà không cần huấn luyện.",
    whenToUse:
      "Dưới 20 ví dụ, task phổ biến (phân loại, trích xuất, viết lại), không cần domain quá chuyên sâu.",
    cost: "Gần như miễn phí — chỉ tốn token input",
    quality: "Tốt cho task phổ biến, trung bình cho domain hẹp",
    time: "Setup trong vài phút",
    dataNeeded: "2–10 cặp (input, output)",
    latency: "Chậm hơn bình thường ~10–30% do prompt dài",
    example: "Phân loại sentiment tiếng Việt từ 5 ví dụ mẫu.",
    pros: [
      "Không cần GPU, không huấn luyện",
      "Đổi model mới chỉ cần copy prompt",
      "Dễ debug và lặp nhanh",
    ],
    cons: [
      "Prompt dài → tốn token → chi phí inference tăng",
      "Giới hạn context window khi cần nhiều ví dụ",
      "Khó kiểm soát format đầu ra chặt chẽ",
    ],
  },
  rag: {
    key: "rag",
    name: "RAG (Retrieval-Augmented Generation)",
    shortName: "RAG",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/15",
    borderColor: "border-emerald-300 dark:border-emerald-700",
    description:
      "Tìm kiếm tài liệu liên quan bằng vector database, đưa kết quả vào prompt trước khi LLM trả lời.",
    whenToUse:
      "Kho tài liệu lớn (100+ trang) cập nhật thường xuyên, câu hỏi dựa trên kiến thức có tài liệu.",
    cost: "$50–$500/tháng cho vector DB + embedding API",
    quality: "Rất tốt cho Q&A, trích dẫn, tài liệu nội bộ",
    time: "Vài ngày setup + ingestion pipeline",
    dataNeeded: "Kho tài liệu — không cần label",
    latency: "Thêm 100–500ms cho retrieval step",
    example:
      "Chatbot nội bộ trả lời từ 10.000 trang policy công ty — cập nhật policy không cần re-train.",
    pros: [
      "Cập nhật kiến thức không cần huấn luyện lại",
      "Dễ kiểm toán: biết model dựa vào tài liệu nào",
      "Giảm hallucination nhờ grounding vào nguồn thật",
    ],
    cons: [
      "Chất lượng phụ thuộc retrieval — retrieval tệ thì câu trả lời tệ",
      "Cần xây pipeline: chunking, embedding, indexing, re-ranking",
      "Phức tạp hơn prompting thuần",
    ],
  },
  lora: {
    key: "lora",
    name: "LoRA / PEFT Fine-tuning",
    shortName: "LoRA",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-900/15",
    borderColor: "border-purple-300 dark:border-purple-700",
    description:
      "Huấn luyện thêm một lớp nhỏ (low-rank adapter) thay vì toàn bộ model — chỉ tinh chỉnh ~1% tham số.",
    whenToUse:
      "500–10.000 ví dụ chuẩn hóa, task chuyên sâu hơn mà prompting không đủ, budget GPU vừa phải.",
    cost: "$50–$2.000 cho một lần train trên cloud GPU",
    quality: "Gần bằng full fine-tune với ~1% chi phí",
    time: "Vài giờ đến 1 ngày train",
    dataNeeded: "500–10.000 cặp chuẩn hóa",
    latency: "Như base model — adapter rất nhỏ",
    example:
      "Adapter riêng cho mỗi khách hàng enterprise — mỗi adapter chỉ vài MB, dễ quản lý.",
    pros: [
      "Tiết kiệm 90%+ GPU so với full fine-tune",
      "Nhiều adapter cho cùng base model — phục vụ nhiều khách hàng",
      "Dễ rollback: bỏ adapter là quay lại model gốc",
    ],
    cons: [
      "Vẫn cần dataset chất lượng",
      "Không thay đổi được kiến thức cơ bản của base model",
      "Hiệu quả kém hơn full FT cho thay đổi hành vi sâu",
    ],
  },
  "full-ft": {
    key: "full-ft",
    name: "Full Fine-tuning",
    shortName: "Full FT",
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-50 dark:bg-rose-900/15",
    borderColor: "border-rose-300 dark:border-rose-700",
    description:
      "Huấn luyện lại toàn bộ trọng số của model trên dataset riêng — model học sâu hành vi mới.",
    whenToUse:
      "Trên 10.000 ví dụ chất lượng cao, domain cực kỳ chuyên biệt (y tế, luật, tài chính), budget lớn.",
    cost: "$1.000–$100.000+ mỗi lần train",
    quality: "Cao nhất cho domain chuyên sâu",
    time: "Vài ngày đến vài tuần",
    dataNeeded: "10.000+ cặp chất lượng cao, đa dạng",
    latency: "Như base model",
    example:
      "Model y tế chuyên phân loại bệnh lý từ hình ảnh + văn bản — 50.000 case đã được bác sĩ gán nhãn.",
    pros: [
      "Chất lượng tốt nhất cho domain chuyên sâu",
      "Không cần prompt dài khi inference",
      "Có thể thay đổi hành vi cốt lõi của model",
    ],
    cons: [
      "Chi phí cao: GPU, thời gian, kỹ sư ML",
      "Phải fine-tune lại khi có model mới (GPT-5, Claude 5…)",
      "Dễ overfit, catastrophic forgetting",
      "Khó triển khai và bảo trì nhiều version",
    ],
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// 5 QUESTIONS cho decision tree
// ──────────────────────────────────────────────────────────────────────────────

interface DecisionQuestion {
  id: string;
  question: string;
  hint: string;
  options: {
    label: string;
    value: string;
    weight: Record<Strategy, number>;
  }[];
}

const QUESTIONS: DecisionQuestion[] = [
  {
    id: "dataset",
    question: "Bạn có bao nhiêu ví dụ (input, output) chất lượng?",
    hint: "Đây là tín hiệu quan trọng nhất — ít dữ liệu thì không thể fine-tune hiệu quả.",
    options: [
      {
        label: "Dưới 10 ví dụ",
        value: "tiny",
        weight: { "few-shot": 3, rag: 1, lora: -2, "full-ft": -3 },
      },
      {
        label: "10–500 ví dụ",
        value: "small",
        weight: { "few-shot": 2, rag: 2, lora: 1, "full-ft": -2 },
      },
      {
        label: "500–10.000 ví dụ",
        value: "medium",
        weight: { "few-shot": 0, rag: 1, lora: 3, "full-ft": 1 },
      },
      {
        label: "Trên 10.000 ví dụ",
        value: "large",
        weight: { "few-shot": -1, rag: 0, lora: 2, "full-ft": 3 },
      },
    ],
  },
  {
    id: "domain",
    question: "Domain của task chuyên biệt đến mức nào?",
    hint: "Thuật ngữ, phong cách, kiến thức chuyên ngành càng nhiều thì càng cần fine-tune.",
    options: [
      {
        label: "Phổ biến — tóm tắt, dịch, viết email",
        value: "common",
        weight: { "few-shot": 3, rag: 0, lora: -1, "full-ft": -2 },
      },
      {
        label: "Trung bình — domain doanh nghiệp thông thường",
        value: "mid",
        weight: { "few-shot": 1, rag: 2, lora: 1, "full-ft": 0 },
      },
      {
        label: "Chuyên sâu — y tế, luật, tài chính, khoa học",
        value: "specialized",
        weight: { "few-shot": -2, rag: 1, lora: 2, "full-ft": 3 },
      },
      {
        label: "Kiến thức thay đổi liên tục (news, policy)",
        value: "dynamic",
        weight: { "few-shot": -1, rag: 3, lora: -1, "full-ft": -2 },
      },
    ],
  },
  {
    id: "budget",
    question: "Ngân sách dành cho training/hạ tầng ML?",
    hint: "Prompting gần như miễn phí. Full fine-tune có thể tốn hàng chục ngàn USD.",
    options: [
      {
        label: "Gần như 0 — chỉ trả API call",
        value: "free",
        weight: { "few-shot": 3, rag: 1, lora: -2, "full-ft": -3 },
      },
      {
        label: "Dưới $500/tháng",
        value: "low",
        weight: { "few-shot": 2, rag: 2, lora: 1, "full-ft": -1 },
      },
      {
        label: "$500 – $5.000/tháng",
        value: "mid",
        weight: { "few-shot": 0, rag: 2, lora: 3, "full-ft": 1 },
      },
      {
        label: "Trên $5.000/tháng — team ML đầy đủ",
        value: "high",
        weight: { "few-shot": -1, rag: 1, lora: 2, "full-ft": 3 },
      },
    ],
  },
  {
    id: "latency",
    question: "Yêu cầu về độ trễ (latency) của inference?",
    hint: "Prompt dài + retrieval step có thể làm chậm response đáng kể.",
    options: [
      {
        label: "Rất nhanh — chatbot realtime, autocomplete",
        value: "realtime",
        weight: { "few-shot": -2, rag: -1, lora: 2, "full-ft": 3 },
      },
      {
        label: "Bình thường — chat thông thường",
        value: "normal",
        weight: { "few-shot": 1, rag: 1, lora: 2, "full-ft": 1 },
      },
      {
        label: "Có thể chờ — batch processing, báo cáo",
        value: "batch",
        weight: { "few-shot": 3, rag: 3, lora: 0, "full-ft": 0 },
      },
    ],
  },
  {
    id: "format",
    question: "Độ kiểm soát format đầu ra bạn cần?",
    hint: "Output strict (JSON, XML) thì prompting khó; output linh hoạt thì prompting đủ.",
    options: [
      {
        label: "Linh hoạt — văn bản tự nhiên",
        value: "loose",
        weight: { "few-shot": 3, rag: 2, lora: 1, "full-ft": 1 },
      },
      {
        label: "Cấu trúc — JSON schema đơn giản",
        value: "medium",
        weight: { "few-shot": 2, rag: 2, lora: 2, "full-ft": 1 },
      },
      {
        label: "Rất nghiêm ngặt — format công ty, schema phức tạp",
        value: "strict",
        weight: { "few-shot": -1, rag: 0, lora: 3, "full-ft": 3 },
      },
    ],
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// QUIZ — 8 câu hỏi
// ──────────────────────────────────────────────────────────────────────────────

const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Bạn có 100 ví dụ (input, output) cho một task phổ biến. Bước đầu tiên nên làm gì?",
    options: [
      "Bắt đầu fine-tuning ngay — 100 ví dụ đủ cho SFT cơ bản",
      "Thử few-shot prompting 5–10 ví dụ trước — nếu đã đạt yêu cầu thì khỏi fine-tune",
      "Phải thu thêm 1.000 ví dụ rồi mới bắt đầu",
      "Dùng RAG ngay — luôn tốt hơn mọi chiến lược",
    ],
    correct: 1,
    explanation:
      "Nguyên tắc vàng: bắt đầu từ giải pháp rẻ nhất và dễ nhất. Few-shot prompting thường giải quyết 70% use case mà không cần fine-tune. Chỉ khi prompting không đủ chất lượng thì mới leo thang lên RAG → LoRA → Full FT.",
  },
  {
    question: "Nhược điểm nghiêm trọng nhất của fine-tuning so với prompting là gì?",
    options: [
      "Kết quả luôn kém hơn prompting",
      "Chi phí cao + khi có model mới (GPT-5, Claude 5) phải fine-tune lại từ đầu",
      "Không thể dùng cho tiếng Việt",
      "Model fine-tuned chạy chậm hơn base model",
    ],
    correct: 1,
    explanation:
      "Fine-tuning gắn chặt với một phiên bản model cụ thể. Khi provider ra model mới mạnh hơn, bạn phải thu lại dataset, train lại, eval lại. Prompting thì chỉ cần đổi model name trong API call — bạn được hưởng lợi từ model mới ngay lập tức.",
  },
  {
    question: "RAG (Retrieval-Augmented Generation) thuộc nhóm chiến lược nào?",
    options: [
      "Fine-tuning — vì nó thay đổi trọng số model",
      "Prompting — vì nó đưa tài liệu vào context window, không thay đổi model",
      "Không thuộc nhóm nào — là kỹ thuật riêng",
      "Cả hai — vừa thay đổi model vừa chỉnh prompt",
    ],
    correct: 1,
    explanation:
      "RAG hoạt động bằng cách tìm tài liệu liên quan (retrieval) rồi nhét vào prompt trước khi model trả lời. Trọng số model KHÔNG thay đổi. Vì vậy RAG được xem như prompting nâng cao — có thể cập nhật knowledge base bất cứ lúc nào mà không cần train lại.",
  },
  {
    question:
      "Công ty bạn có 50.000 case y tế đã được bác sĩ gán nhãn, cần model chuyên sâu về bệnh tim mạch. Chiến lược phù hợp nhất?",
    options: [
      "Few-shot prompting — chỉ cần 10 ví dụ trong prompt",
      "RAG từ 50.000 case",
      "Full fine-tuning — đủ dữ liệu, domain cực chuyên sâu, công ty lớn",
      "Không làm gì — dùng ChatGPT trực tiếp là được",
    ],
    correct: 2,
    explanation:
      "Đây là tình huống điển hình cho full fine-tuning: dataset lớn (50k), chất lượng cao (bác sĩ gán nhãn), domain chuyên sâu (tim mạch), và công ty có budget. LoRA cũng là lựa chọn tốt — rẻ hơn mà chất lượng gần tương đương.",
  },
  {
    question: "LoRA khác full fine-tuning ở điểm nào?",
    options: [
      "LoRA chỉ train ~1% số tham số (low-rank adapter), tiết kiệm GPU đáng kể",
      "LoRA train toàn bộ model nhưng chỉ 1 epoch",
      "LoRA không thay đổi gì, chỉ là một loại prompt",
      "LoRA chỉ hoạt động cho tiếng Anh",
    ],
    correct: 0,
    explanation:
      "LoRA = Low-Rank Adaptation. Thay vì cập nhật toàn bộ W (hàng tỷ tham số), LoRA học hai ma trận nhỏ A, B sao cho W_new = W + A·B. Tiết kiệm 90%+ bộ nhớ GPU, cho phép nhiều adapter trên cùng base model (mỗi khách hàng một adapter).",
  },
  {
    question:
      "Team bạn cần chatbot nội bộ trả lời dựa trên 10.000 trang tài liệu HR — tài liệu được cập nhật hàng tuần. Chiến lược?",
    options: [
      "Full fine-tune hàng tuần trên tài liệu mới",
      "Few-shot prompting với 10 ví dụ",
      "RAG — tài liệu nhiều + cập nhật thường xuyên = use case kinh điển của RAG",
      "Hard-code câu trả lời vào code",
    ],
    correct: 2,
    explanation:
      "RAG sáng lên ở đây: (1) 10k trang quá lớn cho prompt, (2) fine-tune hàng tuần không khả thi, (3) RAG cho phép cập nhật index khi tài liệu mới — model không cần train lại. Đây là lý do RAG phổ biến cho chatbot nội bộ doanh nghiệp.",
  },
  {
    question:
      "Prompt của bạn hiện dài 8.000 tokens (rất nhiều few-shot examples). Chi phí mỗi request tăng cao. Giải pháp?",
    options: [
      "Thêm nhiều ví dụ nữa cho chắc ăn",
      "Fine-tune (LoRA hoặc full) — model học xong pattern, prompt ngắn lại, tiết kiệm dài hạn",
      "Dùng model nhỏ hơn để tiết kiệm",
      "Không có cách nào",
    ],
    correct: 1,
    explanation:
      "Khi prompt quá dài, mỗi inference đều tốn token. Fine-tuning một lần tốn tiền, nhưng sau đó prompt rất ngắn — tiết kiệm về dài hạn nếu bạn có nhiều request. Đây là một lý do business quan trọng để chuyển từ prompting sang fine-tuning.",
  },
  {
    question: "Điểm chung giữa cả 4 chiến lược (few-shot, RAG, LoRA, full-FT)?",
    options: [
      "Tất cả đều cần GPU",
      "Tất cả đều thay đổi trọng số base model",
      "Tất cả đều cần đánh giá (eval) trên test set chất lượng trước khi đưa vào production",
      "Tất cả đều miễn phí",
    ],
    correct: 2,
    explanation:
      "Bất kể chiến lược nào, bạn LUÔN cần test set gold-standard để đo lường. Không có eval thì không biết đang tiến bộ hay thụt lùi. Đây là phần thường bị bỏ qua — nhiều team fine-tune nhưng không có eval, dẫn đến ảo tưởng chất lượng.",
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// VISUALIZATION COMPONENT — Decision Tree
// ──────────────────────────────────────────────────────────────────────────────

function DecisionTreeExplorer() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);

  const totalSteps = QUESTIONS.length;
  const question = QUESTIONS[currentStep];

  const handleAnswer = useCallback(
    (value: string) => {
      setAnswers((prev) => ({ ...prev, [question.id]: value }));
      if (currentStep < totalSteps - 1) {
        setCurrentStep((s) => s + 1);
      } else {
        setShowResult(true);
      }
    },
    [currentStep, question.id, totalSteps]
  );

  const reset = useCallback(() => {
    setAnswers({});
    setCurrentStep(0);
    setShowResult(false);
  }, []);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  // Tính điểm cho từng chiến lược dựa trên câu trả lời
  const scores = useMemo(() => {
    const result: Record<Strategy, number> = {
      "few-shot": 0,
      rag: 0,
      lora: 0,
      "full-ft": 0,
    };

    for (const q of QUESTIONS) {
      const chosenValue = answers[q.id];
      if (!chosenValue) continue;
      const chosenOption = q.options.find((o) => o.value === chosenValue);
      if (!chosenOption) continue;
      for (const [strat, w] of Object.entries(chosenOption.weight)) {
        result[strat as Strategy] += w;
      }
    }

    return result;
  }, [answers]);

  const rankedStrategies = useMemo(() => {
    return (Object.entries(scores) as [Strategy, number][])
      .sort((a, b) => b[1] - a[1]);
  }, [scores]);

  const topStrategy = rankedStrategies[0]?.[0] ?? "few-shot";
  const topInfo = STRATEGIES[topStrategy];

  const maxScore = Math.max(...Object.values(scores));
  const minScore = Math.min(...Object.values(scores));
  const scoreRange = Math.max(1, maxScore - minScore);

  // ─── Giao diện ───

  if (showResult) {
    return (
      <div className="space-y-5">
        <div
          className={`rounded-xl border-2 ${topInfo.borderColor} ${topInfo.bgColor} p-5`}
        >
          <div className="mb-2 text-xs uppercase tracking-wide text-muted">
            Chiến lược đề xuất
          </div>
          <h3 className={`text-xl font-bold ${topInfo.color} mb-2`}>
            {topInfo.name}
          </h3>
          <p className="text-sm text-foreground/85 leading-relaxed">
            {topInfo.description}
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-card/60 p-3">
              <div className="text-xs font-medium text-muted mb-0.5">
                Chi phí
              </div>
              <div className="text-sm text-foreground">{topInfo.cost}</div>
            </div>
            <div className="rounded-lg bg-card/60 p-3">
              <div className="text-xs font-medium text-muted mb-0.5">
                Chất lượng
              </div>
              <div className="text-sm text-foreground">{topInfo.quality}</div>
            </div>
            <div className="rounded-lg bg-card/60 p-3">
              <div className="text-xs font-medium text-muted mb-0.5">
                Thời gian setup
              </div>
              <div className="text-sm text-foreground">{topInfo.time}</div>
            </div>
            <div className="rounded-lg bg-card/60 p-3">
              <div className="text-xs font-medium text-muted mb-0.5">
                Dữ liệu cần
              </div>
              <div className="text-sm text-foreground">
                {topInfo.dataNeeded}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-card/40 p-3">
            <div className="text-xs font-medium text-muted mb-1">Ví dụ</div>
            <p className="text-sm text-foreground/85 italic">
              {topInfo.example}
            </p>
          </div>
        </div>

        {/* So sánh điểm các chiến lược */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm font-semibold text-foreground mb-3">
            Điểm phù hợp của từng chiến lược
          </div>
          <div className="space-y-2">
            {rankedStrategies.map(([key, score], idx) => {
              const info = STRATEGIES[key];
              const pct =
                maxScore === minScore
                  ? 50
                  : Math.round(((score - minScore) / scoreRange) * 100);
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs text-muted w-6">#{idx + 1}</span>
                  <span
                    className={`text-sm font-medium w-24 shrink-0 ${info.color}`}
                  >
                    {info.shortName}
                  </span>
                  <div className="flex-1 h-3 rounded-full bg-surface overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: idx * 0.1 }}
                      className={`h-full ${info.bgColor.replace("bg-", "bg-").replace("/15", "/60")}`}
                      style={{
                        background: info.color.includes("blue")
                          ? "#3b82f6"
                          : info.color.includes("emerald")
                            ? "#10b981"
                            : info.color.includes("purple")
                              ? "#a855f7"
                              : "#f43f5e",
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted w-10 text-right">
                    {score > 0 ? "+" : ""}
                    {score}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ưu / nhược */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-300/50 bg-emerald-50/50 p-4 dark:border-emerald-700/50 dark:bg-emerald-900/10">
            <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-2">
              Ưu điểm
            </div>
            <ul className="text-sm text-foreground/85 space-y-1 list-disc list-inside">
              {topInfo.pros.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-rose-300/50 bg-rose-50/50 p-4 dark:border-rose-700/50 dark:bg-rose-900/10">
            <div className="text-sm font-semibold text-rose-700 dark:text-rose-400 mb-2">
              Nhược điểm
            </div>
            <ul className="text-sm text-foreground/85 space-y-1 list-disc list-inside">
              {topInfo.cons.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted hover:text-foreground hover:bg-surface transition-colors"
          >
            Làm lại từ đầu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ProgressSteps current={currentStep + 1} total={totalSteps} />

      {/* Flowchart visualization của các bước đã trả lời */}
      <div className="overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max pb-2">
          {QUESTIONS.map((q, idx) => {
            const answered = !!answers[q.id];
            const isCurrent = idx === currentStep;
            return (
              <div key={q.id} className="flex items-center gap-2">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.05 : 1,
                  }}
                  className={`rounded-lg border px-3 py-2 text-xs min-w-[95px] text-center ${
                    isCurrent
                      ? "border-accent bg-accent/10 text-accent font-semibold"
                      : answered
                        ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : "border-border bg-card text-muted"
                  }`}
                >
                  <div className="text-[10px] uppercase tracking-wide opacity-70">
                    Bước {idx + 1}
                  </div>
                  <div className="text-xs">{q.id}</div>
                </motion.div>
                {idx < QUESTIONS.length - 1 && (
                  <div
                    className={`h-0.5 w-4 ${
                      answered ? "bg-emerald-500/60" : "bg-border"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <motion.div
        key={question.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-xl border border-border bg-surface p-4"
      >
        <div className="text-xs uppercase tracking-wide text-muted mb-1">
          Câu {currentStep + 1} / {totalSteps}
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">
          {question.question}
        </h3>
        <p className="text-xs text-muted mb-4">{question.hint}</p>

        <div className="space-y-2">
          {question.options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleAnswer(opt.value)}
              className="w-full text-left rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground hover:border-accent hover:bg-accent/5 transition-colors"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </motion.div>

      {currentStep > 0 && (
        <div className="flex justify-start">
          <button
            type="button"
            onClick={goBack}
            className="text-xs text-muted hover:text-foreground transition-colors"
          >
            ← Quay lại câu trước
          </button>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// COMPARISON TABLE
// ──────────────────────────────────────────────────────────────────────────────

function ComparisonTable() {
  const rows: {
    criterion: string;
    values: Record<Strategy, string>;
  }[] = [
    {
      criterion: "Chi phí setup",
      values: {
        "few-shot": "$0 – $10",
        rag: "$50 – $500/tháng",
        lora: "$50 – $2.000",
        "full-ft": "$1.000 – $100.000+",
      },
    },
    {
      criterion: "Thời gian",
      values: {
        "few-shot": "Vài phút",
        rag: "Vài ngày",
        lora: "Vài giờ – 1 ngày",
        "full-ft": "Vài ngày – vài tuần",
      },
    },
    {
      criterion: "Dữ liệu cần",
      values: {
        "few-shot": "2–10 ví dụ",
        rag: "Kho tài liệu",
        lora: "500–10.000 ví dụ",
        "full-ft": "10.000+ ví dụ",
      },
    },
    {
      criterion: "Thay đổi model?",
      values: {
        "few-shot": "Không",
        rag: "Không",
        lora: "Có (adapter nhỏ)",
        "full-ft": "Có (toàn bộ)",
      },
    },
    {
      criterion: "Đổi model mới?",
      values: {
        "few-shot": "Copy prompt",
        rag: "Copy pipeline",
        lora: "Train lại LoRA",
        "full-ft": "Train lại toàn bộ",
      },
    },
    {
      criterion: "Độ trễ inference",
      values: {
        "few-shot": "+10–30% (prompt dài)",
        rag: "+100–500ms",
        lora: "Như base",
        "full-ft": "Như base",
      },
    },
    {
      criterion: "Chất lượng domain hẹp",
      values: {
        "few-shot": "Trung bình",
        rag: "Tốt nếu có tài liệu",
        lora: "Rất tốt",
        "full-ft": "Tốt nhất",
      },
    },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 pr-3 text-muted font-medium">
              Tiêu chí
            </th>
            {(Object.keys(STRATEGIES) as Strategy[]).map((s) => (
              <th
                key={s}
                className={`text-left py-2 pr-3 font-medium ${STRATEGIES[s].color}`}
              >
                {STRATEGIES[s].shortName}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-foreground/85">
          {rows.map((r) => (
            <tr key={r.criterion} className="border-b border-border">
              <td className="py-2 pr-3 font-medium text-foreground">
                {r.criterion}
              </td>
              {(Object.keys(STRATEGIES) as Strategy[]).map((s) => (
                <td key={s} className="py-2 pr-3">
                  {r.values[s]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// MAIN TOPIC COMPONENT
// ──────────────────────────────────────────────────────────────────────────────

export default function FineTuningVsPromptingTopic() {
  const TOTAL_STEPS = 8;

  return (
    <>
      {/* ━━━ BƯỚC 1 — DỰ ĐOÁN ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Công ty bạn muốn AI viết email khách hàng theo đúng giọng văn thương hiệu. Bạn có 20 email mẫu. Bước đầu tiên nên làm gì?"
          options={[
            "Fine-tune luôn — 20 email là đủ, và fine-tune luôn tốt hơn",
            "Thử few-shot prompting với 5 ví dụ trong prompt — nếu đủ tốt thì khỏi fine-tune, nếu chưa thì mới leo thang",
            "Bỏ cuộc — 20 email quá ít cho bất cứ gì",
            "Thuê người viết email, không dùng AI",
          ]}
          correct={1}
          explanation="Quy tắc vàng: luôn bắt đầu từ giải pháp rẻ và nhanh nhất. Few-shot prompting xử lý được 70% use case mà không tốn GPU, không cần thu dữ liệu, không phải lo lúc model mới ra. Chỉ khi prompting không đủ chất lượng (eval thực sự), bạn mới leo thang lên RAG, LoRA, full fine-tune."
        >
          <p className="text-sm text-muted mt-4">
            Bài học hôm nay: 4 chiến lược tùy chỉnh LLM, cách chọn đúng chiến
            lược cho dự án của bạn qua decision tree 5 câu hỏi.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ BƯỚC 2 — ẨN DỤ THỰC TẾ ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Ẩn dụ">
        <p>
          Hãy tưởng tượng bạn là chủ một chuỗi quán phở mới và cần một đầu bếp.
          Bạn có vài lựa chọn:
        </p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>
            <strong>Few-shot prompting</strong> = thuê đầu bếp giỏi sẵn rồi đưa
            công thức phở của bạn trước mỗi ca làm — rẻ, linh hoạt, nhưng công
            thức phải đủ ngắn và rõ.
          </li>
          <li>
            <strong>RAG</strong> = đầu bếp có cuốn sổ công thức, khi khách gọi
            món lạ thì giở sổ tra — cập nhật sổ dễ, nhưng cần thời gian tra cứu.
          </li>
          <li>
            <strong>LoRA</strong> = cho đầu bếp đi học thêm khóa ngắn về phở
            Hà Nội — học đủ sâu mà không cần đào tạo lại từ đầu.
          </li>
          <li>
            <strong>Full fine-tuning</strong> = tuyển một đầu bếp mới, dạy phở
            từ con số 0 trong 3 năm — tốn kém, nhưng giỏi phở nhất.
          </li>
        </ul>
        <p>
          Trong AI, 4 cấp độ này khác nhau về chi phí, thời gian, dữ liệu cần,
          và độ chính xác. Chọn sai cấp độ sẽ làm lãng phí hàng chục triệu đồng
          và vài tháng của team — không khác gì tuyển nhầm đầu bếp.
        </p>
        <p>
          Nguyên tắc: luôn thử cấp thấp trước. Thử prompting, đánh giá, nếu chưa
          đạt thì leo thang RAG, rồi LoRA, cuối cùng mới full fine-tune. Đừng
          bao giờ nhảy thẳng vào fine-tuning mà chưa thử prompting.
        </p>

        <Callout variant="tip" title="Quy tắc leo thang (Escalation ladder)">
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Zero-shot prompting (không có ví dụ) — đủ chưa?</li>
            <li>Few-shot prompting (2–10 ví dụ) — đủ chưa?</li>
            <li>RAG (nếu có tài liệu tham khảo) — đủ chưa?</li>
            <li>LoRA / PEFT fine-tuning — đủ chưa?</li>
            <li>Full fine-tuning (bước cuối cùng)</li>
          </ol>
        </Callout>
      </LessonSection>

      {/* ━━━ BƯỚC 3 — TRỰC QUAN HÓA DECISION TREE ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <h3 className="text-base font-semibold text-foreground mb-1">
            Decision Tree: Chọn chiến lược phù hợp
          </h3>
          <p className="text-sm text-muted mb-4">
            Trả lời 5 câu hỏi để tìm chiến lược tối ưu cho dự án của bạn.
            Hệ thống tính điểm dựa trên dataset, domain, budget, latency, và
            yêu cầu format.
          </p>

          <DecisionTreeExplorer />

          <div className="mt-6 rounded-xl border border-border bg-card p-4">
            <h4 className="text-sm font-semibold text-foreground mb-3">
              Bảng so sánh 4 chiến lược
            </h4>
            <ComparisonTable />
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 4 — AHA MOMENT ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          <p>
            <strong>Prompting</strong> = &quot;dạy AI bằng hướng dẫn&quot;
            (nhanh, rẻ, linh hoạt).{" "}
            <strong>Fine-tuning</strong> = &quot;đào tạo AI chuyên gia&quot;
            (tốn kém, mạnh cho domain specific). Luôn leo thang từ rẻ đến đắt —
            đừng bao giờ nhảy thẳng vào fine-tuning mà chưa thử prompting.
          </p>
          <p className="text-sm text-muted mt-2">
            Insight quan trọng: chi phí ẩn lớn nhất của fine-tuning là khi model
            mới ra (GPT-5, Claude 5). Prompting thì đổi model trong 1 dòng
            code; fine-tuning thì phải train lại từ đầu — có thể tốn hàng chục
            triệu và vài tuần.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ━━━ CALLOUT 1 ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Chi tiết">
        <Callout variant="insight" title="Vì sao bắt đầu từ prompting?">
          <p>
            Prompting có 3 ưu điểm lớn: (1) cực rẻ, (2) debug dễ — chỉ chỉnh
            prompt, không train lại, (3) tự động hưởng lợi khi model base mạnh
            lên. 70% dự án thực tế dừng lại ở prompting, không cần leo thang.
          </p>
        </Callout>

        <Callout variant="warning" title="Cạm bẫy thường gặp khi fine-tune">
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>
              <strong>Dataset quá nhỏ hoặc kém chất lượng</strong> → model
              overfit, mất khả năng generalization.
            </li>
            <li>
              <strong>Không có eval set</strong> → không biết fine-tune có cải
              thiện hay không.
            </li>
            <li>
              <strong>Catastrophic forgetting</strong> → model quên kỹ năng cơ
              bản (toán, code, đa ngôn ngữ) sau khi fine-tune domain hẹp.
            </li>
            <li>
              <strong>Quên so sánh với baseline prompting</strong> — nhiều team
              fine-tune xong mới phát hiện prompting cũng đạt 95% chất lượng.
            </li>
          </ul>
        </Callout>
      </LessonSection>

      {/* ━━━ BƯỚC 5 — THỬ THÁCH 1 ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách 1">
        <InlineChallenge
          question="GPT-5 vừa ra mắt, mạnh hơn GPT-4 rõ rệt. Bạn đã fine-tune GPT-4 cho task phân loại hồ sơ khách hàng. Muốn hưởng lợi từ GPT-5, bạn cần làm gì?"
          options={[
            "Chỉ cần đổi model name trong API — fine-tuning tự động chuyển sang GPT-5",
            "Phải fine-tune LẠI trên GPT-5 từ đầu — mất thêm thời gian, tiền, và phải eval lại",
            "GPT-5 tự động giỏi hơn trong mọi task, không cần làm gì",
            "Không thể dùng GPT-5 nếu đã fine-tune GPT-4 — phải chờ fine-tune phiên bản riêng",
          ]}
          correct={1}
          explanation="Fine-tuning gắn chặt với một model cụ thể. Khi có model mới, bạn phải: (1) chuẩn bị lại dataset, (2) train lại, (3) eval lại, (4) deploy lại. Đây là chi phí ẩn khổng lồ. Ngược lại, prompting chỉ cần đổi 1 dòng code là hưởng lợi ngay từ model mới."
        />
      </LessonSection>

      {/* ━━━ BƯỚC 6 — GIẢI THÍCH SÂU ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích">
        <ExplanationSection>
          <p>
            <TopicLink slug="prompt-engineering">Prompting</TopicLink> và{" "}
            <TopicLink slug="fine-tuning">fine-tuning</TopicLink> là hai triết
            lý khác nhau khi tùy chỉnh LLM cho task cụ thể. Trong thực tế,
            chúng ta không chọn &quot;một hay hai&quot; — chúng ta leo thang qua
            4 cấp độ: zero-shot → few-shot → RAG → LoRA → full fine-tune, dừng
            lại ngay khi đạt chất lượng yêu cầu.
          </p>

          <h4 className="text-base font-semibold text-foreground mt-4">
            1. Prompting — điều khiển model qua input
          </h4>
          <p>
            <strong>Zero-shot prompting</strong>: chỉ đưa hướng dẫn, không có ví
            dụ. Ví dụ: &quot;Phân loại sentiment của câu sau: ...&quot;. LLM
            hiện đại (Claude, GPT-4) thường xử lý tốt task phổ biến mà không
            cần ví dụ.
          </p>
          <p>
            <strong>Few-shot prompting</strong>: đưa 2–10 cặp (input, output)
            làm mẫu. Model nhìn vào pattern để suy ra cách trả lời câu mới.
            Đây gọi là{" "}
            <TopicLink slug="in-context-learning">in-context learning</TopicLink>
            . Ưu: rất mạnh cho task có pattern rõ. Nhược: prompt dài tốn token;
            giới hạn context window.
          </p>

          <h4 className="text-base font-semibold text-foreground mt-4">
            2. RAG — prompting tăng cường bằng retrieval
          </h4>
          <p>
            RAG tách kiến thức khỏi model: lưu tài liệu trong vector database,
            khi có câu hỏi thì tìm tài liệu liên quan, nhét vào prompt, rồi gọi
            LLM. Ưu: cập nhật kiến thức không cần train lại, dễ trích dẫn nguồn,
            giảm hallucination. Nhược: cần xây pipeline (chunking, embedding,
            re-ranking).
          </p>
          <p>
            RAG đặc biệt hiệu quả cho: chatbot nội bộ, customer support,
            technical documentation, hệ thống yêu cầu trích dẫn (legal, medical,
            research).
          </p>

          <h4 className="text-base font-semibold text-foreground mt-4">
            3. LoRA / PEFT — fine-tuning hiệu quả
          </h4>
          <p>
            <strong>LoRA (Low-Rank Adaptation)</strong> chỉ huấn luyện hai ma
            trận nhỏ A và B sao cho:
          </p>
          <LaTeX block>{String.raw`W_{\text{new}} = W_{\text{pretrained}} + \alpha \cdot A \cdot B`}</LaTeX>
          <p>
            trong đó A có shape <LaTeX>{String.raw`d \times r`}</LaTeX>, B có
            shape <LaTeX>{String.raw`r \times d`}</LaTeX>, và{" "}
            <LaTeX>{String.raw`r \ll d`}</LaTeX> (thường r = 4, 8, 16). Số tham
            số train giảm ~100–1000×, bộ nhớ GPU giảm tương ứng.
          </p>

          <Callout variant="info" title="Khi nào dùng LoRA thay full fine-tune?">
            <p>
              Hầu như luôn luôn — trừ khi bạn có tài nguyên gần không giới hạn.
              LoRA đạt 90–98% chất lượng của full FT với 1–5% chi phí. Ngoài
              ra, bạn có thể duy trì nhiều adapter cho cùng một base model
              (mỗi khách hàng enterprise một adapter), tiết kiệm đáng kể chi
              phí deploy.
            </p>
          </Callout>

          <h4 className="text-base font-semibold text-foreground mt-4">
            4. Full fine-tuning — cập nhật toàn bộ trọng số
          </h4>
          <p>
            Huấn luyện lại toàn bộ model trên dataset riêng. Chi phí cao (GPU,
            thời gian, kỹ sư ML), nhưng có thể thay đổi hành vi cốt lõi. Chỉ
            dùng khi: dataset rất lớn và chất lượng (10.000+ ví dụ), domain
            cực chuyên biệt, có team MLOps để maintain.
          </p>

          <CollapsibleDetail title="Toán học: vì sao LoRA hoạt động?">
            <p>
              Giả thuyết quan trọng: khi fine-tune một model pretrained trên
              task mới, sự thay đổi trọng số{" "}
              <LaTeX>{String.raw`\Delta W = W_{\text{new}} - W_{\text{pretrained}}`}</LaTeX>{" "}
              có rank thấp về mặt thực tế — tức là chỉ cần ít &quot;chiều&quot;
              để biểu diễn. Vì vậy ta có thể phân tích:
            </p>
            <LaTeX block>{String.raw`\Delta W \approx A \cdot B, \quad A \in \mathbb{R}^{d \times r}, \; B \in \mathbb{R}^{r \times d}`}</LaTeX>
            <p>
              với <LaTeX>{String.raw`r \ll d`}</LaTeX>. Thay vì train
              <LaTeX>{String.raw` d^2 `}</LaTeX> tham số, chỉ cần train{" "}
              <LaTeX>{String.raw`2dr`}</LaTeX>. Với d = 4096 và r = 8: tiết
              kiệm 256× số tham số. Trong inference, ta cộng <em>A · B</em> vào
              <em> W_pretrained</em> — không có overhead so với model gốc.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Pipeline đề xuất cho dự án thực tế">
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>
                Xây <strong>eval set</strong> chuẩn — 50–500 ví dụ
                gold-standard, được con người đánh giá. Đây là &quot;ground
                truth&quot; để so sánh mọi chiến lược.
              </li>
              <li>
                Thử <strong>zero-shot prompting</strong> với prompt rõ ràng —
                đo chất lượng trên eval set.
              </li>
              <li>
                Nếu chưa đạt, thử <strong>few-shot</strong> với 3, 5, 10 ví dụ
                — so sánh trade-off giữa token cost và chất lượng.
              </li>
              <li>
                Nếu task cần kiến thức external, thêm <strong>RAG</strong>.
                Bắt đầu với pipeline đơn giản (cosine similarity trên
                embeddings) rồi mới thêm re-ranking.
              </li>
              <li>
                Nếu vẫn chưa đạt, thu thập 500–2.000 ví dụ chất lượng, thử{" "}
                <strong>LoRA</strong>. Luôn có baseline prompting để so sánh.
              </li>
              <li>
                Chỉ full fine-tune khi LoRA không đủ VÀ bạn có 10.000+ ví dụ
                chất lượng cao.
              </li>
              <li>
                Luôn ghi log A/B test, eval trên cùng test set, version
                dataset và model.
              </li>
            </ol>
          </CollapsibleDetail>

          <h4 className="text-base font-semibold text-foreground mt-4">
            Chi phí tổng thể: tính toán thực tế
          </h4>
          <p>
            Một câu hỏi hay bị bỏ qua: <em>đâu là chiến lược rẻ nhất về tổng
            thể (TCO)?</em> Câu trả lời phụ thuộc khối lượng request.
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>
              Prompting: chi phí mỗi request cao hơn (prompt dài), nhưng setup
              gần bằng 0. Rẻ nếu volume thấp.
            </li>
            <li>
              Fine-tuning: setup đắt (hàng ngàn đến hàng chục ngàn USD), nhưng
              chi phí mỗi request thấp. Rẻ hơn khi volume cao (hàng triệu
              request).
            </li>
          </ul>
          <p>
            Điểm hòa vốn thường rơi vào khoảng 100.000 – 10 triệu request. Dưới
            mức này, prompting luôn rẻ hơn dù tính cả token cost.
          </p>

          <CodeBlock language="python" title="decision_workflow.py">
{`# Pipeline đề xuất: leo thang từ rẻ đến đắt
# Mỗi bước đều đo trên cùng 1 eval set để so sánh công bằng

from anthropic import Anthropic
from my_eval import evaluate_on_eval_set

client = Anthropic()

# ─── Bước 1: Zero-shot ───
def zero_shot(sample):
    return client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=500,
        messages=[{
            "role": "user",
            "content": f"Phân loại sentiment: {sample['input']}"
        }]
    )

score_zero = evaluate_on_eval_set(zero_shot)
print(f"Zero-shot: {score_zero:.1%}")

# ─── Bước 2: Few-shot (nếu zero-shot chưa đủ) ───
FEW_SHOT_EXAMPLES = [
    {"input": "Giao hàng chậm quá!", "label": "negative"},
    {"input": "Phở ngon tuyệt!", "label": "positive"},
    {"input": "Giá tầm trung, chất lượng ổn.", "label": "neutral"},
]

def few_shot(sample):
    examples = "\\n".join(
        f"Input: {e['input']}\\nOutput: {e['label']}"
        for e in FEW_SHOT_EXAMPLES
    )
    prompt = f"{examples}\\n\\nInput: {sample['input']}\\nOutput:"
    return client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=50,
        messages=[{"role": "user", "content": prompt}]
    )

score_few = evaluate_on_eval_set(few_shot)
print(f"Few-shot: {score_few:.1%}")

# ─── Bước 3: RAG (nếu cần kiến thức external) ───
# ... (pipeline chunking + embedding + retrieval)

# ─── Bước 4: LoRA (nếu vẫn chưa đủ) ───
from peft import LoraConfig, get_peft_model
from transformers import AutoModelForCausalLM, Trainer

base_model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-3.1-8B")
peft_config = LoraConfig(
    r=16,             # rank thấp
    lora_alpha=32,    # scaling
    target_modules=["q_proj", "v_proj"],
    lora_dropout=0.05,
)
model = get_peft_model(base_model, peft_config)
# Chỉ ~0.3% tham số được train!

# trainer.train() với dataset 500-2000 ví dụ
# Sau đó lưu adapter (chỉ vài MB)

# ─── Bước 5: Full fine-tune (cuối cùng) ───
# Chỉ khi các bước trên KHÔNG đạt yêu cầu VÀ có 10k+ ví dụ chất lượng`}
          </CodeBlock>

          <CodeBlock language="python" title="cost_calculator.py">
{`# Tính toán TCO (Total Cost of Ownership) để chọn chiến lược
# Input: volume dự kiến, chi phí setup, chi phí mỗi request

def total_cost(strategy, monthly_requests, months=12):
    if strategy == "prompting":
        setup = 0
        per_request = 0.01  # USD, prompt dài
    elif strategy == "rag":
        setup = 500  # vector DB setup
        per_request = 0.012  # embedding + LLM
    elif strategy == "lora":
        setup = 500  # train LoRA
        per_request = 0.006  # prompt ngắn hơn
    elif strategy == "full-ft":
        setup = 10000  # full training
        per_request = 0.006
    else:
        raise ValueError(f"Unknown: {strategy}")

    return setup + per_request * monthly_requests * months

# Ví dụ:
for volume in [1_000, 100_000, 10_000_000]:
    print(f"\\nVolume: {volume:,}/month")
    for s in ["prompting", "rag", "lora", "full-ft"]:
        cost = total_cost(s, volume)
        print(f"  {s:12} = \${cost:>12,.0f}")

# Output tiêu biểu:
# Volume: 1,000/month — prompting rẻ nhất ($120)
# Volume: 100,000/month — LoRA bắt đầu cạnh tranh
# Volume: 10,000,000/month — Full FT rẻ nhất về tổng thể`}
          </CodeBlock>

          <Callout variant="tip" title="Khi nào thực sự nên full fine-tune?">
            <p>
              Chỉ khi cả 4 điều kiện đều đúng: (1) dataset 10.000+ ví dụ chất
              lượng cao, (2) domain cực chuyên biệt, (3) volume request rất
              lớn (10M+/tháng) — đủ để hòa vốn chi phí setup, (4) có team
              MLOps để maintain. Thiếu 1 trong 4 điều kiện → nên dùng LoRA
              thay.
            </p>
          </Callout>

          <h4 className="text-base font-semibold text-foreground mt-4">
            Kết hợp nhiều chiến lược
          </h4>
          <p>
            Trong thực tế, các chiến lược thường được <strong>kết hợp</strong>,
            không loại trừ lẫn nhau:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>
              <strong>RAG + few-shot</strong>: nhét tài liệu retrieval VÀ vài
              ví dụ mẫu vào prompt.
            </li>
            <li>
              <strong>LoRA + RAG</strong>: LoRA cho style công ty, RAG cho kiến
              thức cập nhật.
            </li>
            <li>
              <strong>Full FT + prompting</strong>: full FT làm nền, thêm
              prompting để điều chỉnh giọng văn mỗi request.
            </li>
          </ul>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ THỬ THÁCH 2 ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Thử thách 2">
        <InlineChallenge
          question="Dự án: chatbot hỏi đáp về 10.000 trang tài liệu nội bộ công ty, được cập nhật hàng tuần. Chiến lược?"
          options={[
            "Full fine-tune hàng tuần trên tài liệu mới — luôn up-to-date",
            "Few-shot prompting với 10 ví dụ — đủ cho hầu hết câu hỏi",
            "RAG — tài liệu nhiều + cập nhật thường xuyên là use case kinh điển của RAG",
            "LoRA — cân bằng giữa chất lượng và chi phí",
          ]}
          correct={2}
          explanation="RAG là lựa chọn tối ưu: (1) 10k trang vượt context window dù model mạnh nhất, (2) cập nhật tài liệu = cập nhật index, không cần train lại, (3) dễ trích dẫn nguồn (quan trọng cho compliance), (4) giảm hallucination. Fine-tune hàng tuần là không khả thi về chi phí và vận hành."
        />
      </LessonSection>

      {/* ━━━ CALLOUT 3 & 4 ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Ghi chú">
        <Callout variant="warning" title="Không có eval set = đang đoán mò">
          <p>
            Sai lầm tai hại nhất: fine-tune (hoặc chỉnh prompt) mà không có
            eval set chuẩn. Bạn không có cách nào biết thay đổi có tốt hơn hay
            không — tất cả chỉ là cảm giác. Trước mọi quyết định tùy chỉnh
            model, hãy xây 50–500 ví dụ eval gold-standard, được con người
            kiểm tra, và đo chất lượng trên eval set này cho mọi chiến lược.
          </p>
        </Callout>

        <Callout variant="insight" title="Prompting không chỉ là viết tiếng Anh">
          <p>
            Prompt engineering có những kỹ thuật đo lường được: chain-of-thought
            (&quot;suy luận từng bước&quot;), role assignment (&quot;Bạn là
            chuyên gia...&quot;), structured output (JSON schema), constraint
            injection (&quot;tối đa 50 từ&quot;), few-shot ordering (ví dụ khó
            trước). Một prompt tốt có thể hơn một LoRA tệ — đừng xem nhẹ prompt
            engineering.
          </p>
        </Callout>
      </LessonSection>

      {/* ━━━ TABVIEW — So sánh code của 4 chiến lược ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Code ví dụ">
        <h4 className="text-base font-semibold text-foreground mb-2">
          Code minh họa 4 chiến lược
        </h4>
        <TabView
          tabs={[
            {
              label: "Few-shot",
              content: (
                <CodeBlock language="python" title="few_shot.py">
{`# Few-shot prompting — không train gì
# Chỉ cần prompt tốt + vài ví dụ mẫu

prompt = """Phân loại sentiment của bình luận tiếng Việt.
Chỉ trả lời: positive, negative, hoặc neutral.

Ví dụ:
- "Phở ngon lắm!" → positive
- "Giao hàng chậm quá" → negative
- "Giá tầm trung" → neutral

Bình luận: "Shop bán hàng chất lượng!"
Kết quả:"""

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=50,
    messages=[{"role": "user", "content": prompt}]
)
print(response.content[0].text)  # "positive"`}
                </CodeBlock>
              ),
            },
            {
              label: "RAG",
              content: (
                <CodeBlock language="python" title="rag.py">
{`# RAG — truy xuất tài liệu trước khi gọi LLM
from sentence_transformers import SentenceTransformer
import chromadb

# 1. Index tài liệu một lần
encoder = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
client_db = chromadb.Client()
collection = client_db.create_collection("docs")

for doc in company_documents:
    emb = encoder.encode(doc.text).tolist()
    collection.add(embeddings=[emb], documents=[doc.text], ids=[doc.id])

# 2. Khi có câu hỏi: retrieve + gọi LLM
def rag_answer(question):
    q_emb = encoder.encode(question).tolist()
    results = collection.query(query_embeddings=[q_emb], n_results=5)
    context = "\\n".join(results["documents"][0])

    prompt = f"""Dựa trên tài liệu:
{context}

Câu hỏi: {question}
Trả lời:"""

    return client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=500,
        messages=[{"role": "user", "content": prompt}]
    ).content[0].text

answer = rag_answer("Chính sách nghỉ phép của công ty?")`}
                </CodeBlock>
              ),
            },
            {
              label: "LoRA",
              content: (
                <CodeBlock language="python" title="lora.py">
{`# LoRA — fine-tune hiệu quả, chỉ ~0.3% tham số
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import LoraConfig, get_peft_model, TaskType
from trl import SFTTrainer

model_name = "meta-llama/Llama-3.1-8B-Instruct"
base = AutoModelForCausalLM.from_pretrained(model_name)
tokenizer = AutoTokenizer.from_pretrained(model_name)

# Config LoRA
lora_config = LoraConfig(
    task_type=TaskType.CAUSAL_LM,
    r=16,                    # rank (lower = fewer params, higher = more capacity)
    lora_alpha=32,           # scaling factor
    lora_dropout=0.05,
    target_modules=["q_proj", "v_proj", "k_proj", "o_proj"],
)
model = get_peft_model(base, lora_config)
model.print_trainable_parameters()
# trainable params: 20,971,520 || all params: 8,051,232,768 || ratio: 0.26%

# Train trên dataset 1000 ví dụ
trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=my_dataset,
    max_seq_length=2048,
    args=TrainingArguments(
        output_dir="./lora-ckpt",
        num_train_epochs=3,
        per_device_train_batch_size=4,
        learning_rate=2e-4,
    ),
)
trainer.train()

# Lưu adapter (chỉ vài MB)
model.save_pretrained("./my-lora-adapter")`}
                </CodeBlock>
              ),
            },
            {
              label: "Full FT",
              content: (
                <CodeBlock language="python" title="full_ft.py">
{`# Full fine-tuning — tốn kém, chỉ khi thật cần
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    Trainer,
    TrainingArguments,
    DataCollatorForLanguageModeling,
)

model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-3.1-8B")
tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-3.1-8B")

# TẤT CẢ tham số đều được train
for param in model.parameters():
    param.requires_grad = True

# Cần GPU rất mạnh (A100 80GB hoặc H100)
training_args = TrainingArguments(
    output_dir="./full-ft-ckpt",
    num_train_epochs=3,
    per_device_train_batch_size=1,  # Batch nhỏ vì model lớn
    gradient_accumulation_steps=16,  # Tích lũy để có effective batch = 16
    learning_rate=1e-5,               # Thấp để tránh catastrophic forgetting
    warmup_steps=200,
    logging_steps=10,
    save_strategy="epoch",
    fp16=True,                        # Hoặc bf16 trên H100
    gradient_checkpointing=True,       # Tiết kiệm bộ nhớ, chậm hơn một chút
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=my_big_dataset,     # 10k+ ví dụ chất lượng cao
    eval_dataset=my_eval_set,          # Eval set chuẩn
    data_collator=DataCollatorForLanguageModeling(tokenizer, mlm=False),
)
trainer.train()
# Checkpoint ~16GB cho Llama-8B, ~140GB cho Llama-70B
# Chi phí: có thể tới hàng chục nghìn USD trên cloud GPU`}
                </CodeBlock>
              ),
            },
          ]}
        />
      </LessonSection>

      {/* ━━━ BƯỚC 7 — TÓM TẮT ━━━ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về Fine-tuning vs Prompting"
          points={[
            "4 chiến lược: few-shot prompting → RAG → LoRA → full fine-tuning. Leo thang từ rẻ đến đắt.",
            "Prompting: nhanh, rẻ, dễ đổi model mới. Fine-tuning: chất lượng cao hơn cho domain chuyên sâu, nhưng gắn chặt với model cụ thể.",
            "RAG phù hợp khi có kho tài liệu cần cập nhật — không cần train lại khi tài liệu thay đổi.",
            "LoRA đạt 90–98% chất lượng full fine-tune với 1–5% chi phí — lựa chọn mặc định khi cần fine-tune.",
            "Luôn xây eval set gold-standard TRƯỚC. Không có eval thì mọi quyết định tùy chỉnh chỉ là đoán mò.",
            "Chi phí ẩn lớn nhất của fine-tuning: khi model mới ra (GPT-5, Claude 5) phải train lại từ đầu. Prompting không có chi phí này.",
          ]}
        />
      </LessonSection>

      {/* ━━━ BƯỚC 8 — QUIZ ━━━ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
