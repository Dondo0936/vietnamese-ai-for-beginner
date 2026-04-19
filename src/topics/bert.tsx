"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  CodeBlock,
  Callout,
  CollapsibleDetail,
  LessonSection,
  TopicLink,
  LaTeX,
  ProgressSteps,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "bert",
  title: "BERT",
  titleVi: "BERT - Biểu diễn mã hoá hai chiều",
  description:
    "Mô hình ngôn ngữ tiền huấn luyện hai chiều, hiểu ngữ cảnh từ cả trái lẫn phải để biểu diễn ngôn ngữ sâu sắc.",
  category: "nlp",
  tags: ["nlp", "transformer", "pre-training"],
  difficulty: "advanced",
  relatedSlugs: ["transformer", "attention-mechanism", "gpt"],
  vizType: "interactive",
};

/* ── MLM dataset ── */
interface MlmSentence {
  before: string;
  after: string;
  answer: string;
  options: string[];
  bertTop3: { word: string; score: number }[];
}

const MLM_DATA: MlmSentence[] = [
  {
    before: "Hà Nội là thủ đô của",
    after: "",
    answer: "Việt Nam",
    options: ["Việt Nam", "Trung Quốc", "Thái Lan", "Nhật Bản"],
    bertTop3: [
      { word: "Việt Nam", score: 0.92 },
      { word: "nước ta", score: 0.05 },
      { word: "Đông Dương", score: 0.02 },
    ],
  },
  {
    before: "Con mèo đang",
    after: "trên ghế",
    answer: "nằm",
    options: ["nằm", "bay", "hát", "lái"],
    bertTop3: [
      { word: "nằm", score: 0.78 },
      { word: "ngồi", score: 0.14 },
      { word: "ngủ", score: 0.06 },
    ],
  },
  {
    before: "Tôi uống",
    after: "mỗi sáng",
    answer: "cà phê",
    options: ["cà phê", "xăng", "mực", "sơn"],
    bertTop3: [
      { word: "cà phê", score: 0.85 },
      { word: "nước", score: 0.08 },
      { word: "trà", score: 0.05 },
    ],
  },
  {
    before: "Sông",
    after: "chảy qua Huế",
    answer: "Hương",
    options: ["Hương", "Hồng", "Mê Kông", "Đà"],
    bertTop3: [
      { word: "Hương", score: 0.91 },
      { word: "Bồ", score: 0.04 },
      { word: "Hồng", score: 0.03 },
    ],
  },
  {
    before: "Phở là món ăn nổi tiếng của",
    after: "",
    answer: "Việt Nam",
    options: ["Việt Nam", "Hàn Quốc", "Ý", "Ấn Độ"],
    bertTop3: [
      { word: "Việt Nam", score: 0.95 },
      { word: "Hà Nội", score: 0.03 },
      { word: "người Việt", score: 0.01 },
    ],
  },
];

/* ── Quiz data ── */
const QUIZ: QuizQuestion[] = [
  {
    question:
      "BERT được tiền huấn luyện bằng hai tác vụ. Tác vụ nào giúp BERT hiểu nghĩa từ trong ngữ cảnh?",
    options: [
      "Next Sentence Prediction (NSP)",
      "Masked Language Modeling (MLM)",
      "Causal Language Modeling",
      "Text Classification",
    ],
    correct: 1,
    explanation:
      "MLM che 15% từ trong câu rồi yêu cầu BERT đoán lại từ bị che dựa trên ngữ cảnh hai chiều. Đây chính là cơ chế buộc BERT phải học cách hiểu nghĩa từ trong mọi tình huống.",
  },
  {
    question: "Điểm khác biệt cốt lõi giữa BERT và GPT là gì?",
    options: [
      "BERT có nhiều tham số hơn GPT",
      "BERT đọc hai chiều, GPT đọc một chiều (trái sang phải)",
      "GPT không dùng Transformer",
      "BERT dùng CNN, GPT dùng Transformer",
    ],
    correct: 1,
    explanation:
      "BERT dùng Transformer Encoder đọc hai chiều (bidirectional). GPT dùng Transformer Decoder đọc một chiều (autoregressive). Vì vậy BERT giỏi hiểu (classification, QA), GPT giỏi sinh văn bản (generation).",
  },
  {
    question:
      "Sau khi tiền huấn luyện, BERT được sử dụng cho tác vụ cụ thể (ví dụ phân loại cảm xúc) bằng cách nào?",
    options: [
      "Huấn luyện lại BERT từ đầu trên dữ liệu mới",
      "Tinh chỉnh (fine-tune) trên dữ liệu tác vụ cụ thể",
      "Không cần thay đổi gì, BERT tự hiểu",
      "Thêm thật nhiều lớp Transformer mới phía trên",
    ],
    correct: 1,
    explanation:
      "BERT được fine-tune: giữ nguyên trọng số đã học trong pre-training, chỉ thêm một lớp đầu ra đơn giản (vd: softmax 2 lớp cho sentiment), rồi huấn luyện nhẹ trên dữ liệu cụ thể trong vài epoch là đủ.",
  },
  {
    question: "[CLS] token trong BERT có vai trò gì?",
    options: [
      "Đánh dấu cuối câu",
      "Tạo biểu diễn đại diện cho toàn bộ câu, dùng cho phân loại",
      "Báo hiệu token bị che (masked)",
      "Dùng để ngắt câu trong NSP",
    ],
    correct: 1,
    explanation:
      "[CLS] đứng đầu mỗi chuỗi đầu vào. Sau khi qua các lớp Transformer, vector của [CLS] tổng hợp thông tin toàn câu và thường được dùng làm đầu vào cho lớp classifier trong các tác vụ phân loại.",
  },
  {
    question:
      "BERT-base có 12 lớp Transformer, BERT-large có 24 lớp. Nếu fine-tune trên dữ liệu nhỏ (vd 500 mẫu), lựa chọn nào hợp lý hơn?",
    options: [
      "Luôn chọn BERT-large vì mạnh hơn",
      "Chọn BERT-base để tránh overfitting, tiết kiệm tài nguyên",
      "Huấn luyện cả hai song song rồi lấy trung bình",
      "Không fine-tune mà chỉ dùng embedding thô",
    ],
    correct: 1,
    explanation:
      "Với dữ liệu nhỏ, BERT-large dễ overfit vì có hàng trăm triệu tham số. BERT-base (110M) thường đủ, ít tốn GPU, và huấn luyện ổn định hơn khi dữ liệu ít.",
  },
  {
    type: "fill-blank",
    question:
      "BERT là kiến trúc {blank}-only và được tiền huấn luyện bằng hai tác vụ: {blank} (che từ rồi đoán lại) và {blank} (dự đoán câu tiếp theo có liên quan hay không).",
    blanks: [
      { answer: "encoder", accept: ["Encoder"] },
      { answer: "MLM", accept: ["mlm", "masked language modeling", "Masked Language Modeling"] },
      { answer: "NSP", accept: ["nsp", "next sentence prediction", "Next Sentence Prediction"] },
    ],
    explanation:
      "BERT là encoder-only Transformer. MLM che 15% token để học ngữ nghĩa từ ngữ cảnh hai chiều, còn NSP giúp mô hình học quan hệ giữa các câu (ngày nay NSP thường bị bỏ vì lợi ích không đáng kể).",
  },
  {
    type: "fill-blank",
    question:
      "Trong BERT, token đặc biệt {blank} được thêm vào đầu câu để tổng hợp biểu diễn toàn câu, còn token {blank} dùng để ngăn cách hai câu trong cặp đầu vào.",
    blanks: [
      { answer: "[CLS]", accept: ["CLS", "cls", "[cls]"] },
      { answer: "[SEP]", accept: ["SEP", "sep", "[sep]"] },
    ],
    explanation:
      "[CLS] (classification) đứng đầu, vector cuối cùng của nó đại diện cho toàn câu. [SEP] (separator) tách câu A và câu B trong tác vụ NSP hoặc khi xử lý cặp câu (vd QA, NLI).",
  },
  {
    question:
      "Mệnh đề nào SAI về BERT so với các mô hình lớn hơn như RoBERTa hay DeBERTa?",
    options: [
      "RoBERTa huấn luyện lâu hơn, dùng nhiều dữ liệu hơn BERT",
      "RoBERTa bỏ NSP vì thấy không cần thiết",
      "BERT đã là kiến trúc tốt nhất mọi mặt, không có biến thể nào vượt qua",
      "DeBERTa dùng disentangled attention để cải thiện hiệu năng",
    ],
    correct: 2,
    explanation:
      "Sai: sau BERT (2018) đã có nhiều biến thể mạnh hơn: RoBERTa (2019) bỏ NSP + tăng dữ liệu, ALBERT giảm tham số, DeBERTa thay đổi attention. Nhưng tinh thần chung (encoder bidirectional + MLM) đều bắt nguồn từ BERT.",
  },
  {
    question:
      "Khi xử lý một đoạn văn dài 900 token bằng BERT-base (giới hạn 512), chiến lược nào hợp lý nhất cho bài toán phân loại chủ đề?",
    options: [
      "Cắt cứng 512 token đầu tiên, bỏ phần còn lại",
      "Chia đoạn thành nhiều cửa sổ chồng lấp (sliding window) rồi tổng hợp dự đoán",
      "Huấn luyện lại BERT với max_length = 900 trong vài epoch",
      "Nén đoạn bằng cách bỏ dấu tiếng Việt để giảm token",
    ],
    correct: 1,
    explanation:
      "Sliding window (cửa sổ trượt) chia đoạn dài thành các đoạn 512 token chồng lấp 128 token, cho qua BERT rồi gộp logits (mean/max) để ra dự đoán cuối. Chiến lược này giữ được thông tin toàn văn mà không cần đổi kiến trúc. Longformer/BigBird mới là lựa chọn chuyên biệt cho văn bản siêu dài.",
  },
  {
    type: "fill-blank",
    question:
      "Trong bước tiền huấn luyện MLM, BERT che ngẫu nhiên khoảng {blank}% token trong câu. Trong các token bị chọn: 80% được thay bằng [MASK], 10% được thay bằng token ngẫu nhiên, 10% giữ nguyên — mục đích là để mô hình không bị lệ thuộc vào sự xuất hiện của {blank} khi suy luận.",
    blanks: [
      { answer: "15", accept: ["15%", "mười lăm"] },
      { answer: "[MASK]", accept: ["MASK", "mask", "[mask]"] },
    ],
    explanation:
      "Tỷ lệ 15% là đánh đổi giữa tín hiệu huấn luyện (che nhiều thì học nhiều) và ngữ cảnh còn lại (che ít thì dễ đoán). Phân phối 80/10/10 giúp biểu diễn BERT vẫn hữu ích khi fine-tune trên câu không có [MASK] — nếu lúc huấn luyện luôn thấy [MASK], mô hình sẽ quên cách xử lý token thật.",
  },
];

/* ── SVG helpers for architecture diagrams ── */
const TOKENS_FOR_DIAGRAM = ["[CLS]", "Tôi", "uống", "[MASK]", "mỗi", "sáng", "[SEP]"];
const TOKEN_COLORS = [
  "#94a3b8",
  "#3b82f6",
  "#8b5cf6",
  "#ef4444",
  "#22c55e",
  "#f97316",
  "#94a3b8",
];

/* ── Direction arrows (bidirectional vs unidirectional) ── */
function DirectionArrows({ bidirectional }: { bidirectional: boolean }) {
  const T = ["Tôi", "uống", "[MASK]", "mỗi", "sáng"];
  const COL = ["#3b82f6", "#8b5cf6", "#ef4444", "#22c55e", "#f97316"];
  const X = [60, 150, 240, 330, 420];
  const arrows = [0, 1, 2, 3];
  return (
    <svg viewBox="0 0 500 200" className="w-full max-w-2xl mx-auto">
      <text
        x="250"
        y="24"
        textAnchor="middle"
        fontSize="13"
        fontWeight="700"
        fill="currentColor"
        className="text-foreground"
      >
        {bidirectional ? "BERT: đọc hai chiều" : "GPT: chỉ đọc trái sang phải"}
      </text>
      {T.map((t, i) => (
        <g key={i}>
          <rect
            x={X[i] - 32}
            y={110}
            width={64}
            height={34}
            rx={9}
            fill={t === "[MASK]" ? "#ef444420" : `${COL[i]}22`}
            stroke={COL[i]}
            strokeWidth={2}
          />
          <text x={X[i]} y={132} textAnchor="middle" fontSize={12} fontWeight={700} fill={COL[i]}>
            {t}
          </text>
        </g>
      ))}
      {bidirectional ? (
        <>
          {arrows.map((i) => (
            <g key={`lr-${i}`}>
              <line
                x1={X[i] + 32}
                y1={95}
                x2={X[i + 1] - 32}
                y2={95}
                stroke="#3b82f6"
                strokeWidth={2}
              />
              <polygon
                points={`${X[i + 1] - 34},90 ${X[i + 1] - 26},95 ${X[i + 1] - 34},100`}
                fill="#3b82f6"
              />
            </g>
          ))}
          {arrows.map((i) => (
            <g key={`rl-${i}`}>
              <line
                x1={X[i + 1] - 32}
                y1={160}
                x2={X[i] + 32}
                y2={160}
                stroke="#f97316"
                strokeWidth={2}
              />
              <polygon
                points={`${X[i] + 34},155 ${X[i] + 26},160 ${X[i] + 34},165`}
                fill="#f97316"
              />
            </g>
          ))}
          <text x="250" y="80" textAnchor="middle" fontSize="11" fill="#3b82f6" fontWeight="600">
            Trái → Phải
          </text>
          <text x="250" y="180" textAnchor="middle" fontSize="11" fill="#f97316" fontWeight="600">
            Phải → Trái
          </text>
          <rect
            x={X[2] - 36}
            y={106}
            width={72}
            height={42}
            rx={10}
            fill="none"
            stroke="#22c55e"
            strokeWidth={2}
            strokeDasharray="4,3"
          />
          <text x={X[2]} y={54} textAnchor="middle" fontSize="11" fill="#22c55e" fontWeight="700">
            Thấy cả hai phía!
          </text>
          <line
            x1={X[2]}
            y1={58}
            x2={X[2]}
            y2={104}
            stroke="#22c55e"
            strokeWidth={1}
            strokeDasharray="3,3"
          />
        </>
      ) : (
        <>
          {arrows.map((i) => (
            <g key={`lr-${i}`}>
              <line
                x1={X[i] + 32}
                y1={127}
                x2={X[i + 1] - 32}
                y2={127}
                stroke="#3b82f6"
                strokeWidth={2}
              />
              <polygon
                points={`${X[i + 1] - 34},122 ${X[i + 1] - 26},127 ${X[i + 1] - 34},132`}
                fill="#3b82f6"
              />
            </g>
          ))}
          <text x="250" y="86" textAnchor="middle" fontSize="11" fill="#3b82f6" fontWeight="600">
            Chỉ Trái → Phải
          </text>
          <rect
            x={X[2] + 42}
            y={106}
            width={X[4] - X[2] - 10}
            height={42}
            rx={9}
            fill="#ef444415"
            stroke="#ef4444"
            strokeWidth={1.5}
            strokeDasharray="4,3"
          />
          <text x={X[3] + 20} y="58" textAnchor="middle" fontSize="11" fill="#ef4444" fontWeight="700">
            Không thấy phía phải!
          </text>
          <line
            x1={X[3] + 20}
            y1={62}
            x2={X[3] + 20}
            y2={104}
            stroke="#ef4444"
            strokeWidth={1}
            strokeDasharray="3,3"
          />
        </>
      )}
    </svg>
  );
}

/* ── Main component ── */
export default function BertTopic() {
  const [idx, setIdx] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [bidirectional, setBidirectional] = useState(true);
  const [selectedLayer, setSelectedLayer] = useState(6);
  const [fineTuneTask, setFineTuneTask] = useState<"sentiment" | "qa" | "ner">("sentiment");

  const current = MLM_DATA[idx];

  const handlePick = useCallback(
    (i: number) => {
      if (revealed) return;
      setPick(i);
      setRevealed(true);
    },
    [revealed],
  );

  const handleNext = useCallback(() => {
    setIdx((i) => (i + 1) % MLM_DATA.length);
    setPick(null);
    setRevealed(false);
  }, []);

  const correctIndex = useMemo(
    () => current.options.indexOf(current.answer),
    [current],
  );

  const layerDescription = useMemo(() => {
    if (selectedLayer <= 3) {
      return "Tầng thấp: bắt các đặc trưng bề mặt như hình thái từ, thứ tự token, cú pháp cục bộ.";
    }
    if (selectedLayer <= 8) {
      return "Tầng giữa: tổng hợp quan hệ ngữ pháp, cấu trúc cụm danh từ, cụm động từ, phụ thuộc gần.";
    }
    return "Tầng cao: mã hoá ngữ nghĩa trừu tượng, quan hệ xa, thông tin phù hợp cho downstream task.";
  }, [selectedLayer]);

  const fineTuneConfig = useMemo(() => {
    if (fineTuneTask === "sentiment") {
      return {
        title: "Phân loại cảm xúc (Sentiment)",
        headLayer: "Linear(768, 2) + Softmax",
        input: "BERT([CLS] Bộ phim này tuyệt vời [SEP])",
        output: "→ [positive 0.94, negative 0.06]",
        notes:
          "Dùng vector của [CLS] (kích thước 768 ở BERT-base) làm đầu vào. Một lớp tuyến tính + softmax đủ cho tác vụ 2 nhãn.",
      };
    }
    if (fineTuneTask === "qa") {
      return {
        title: "Hỏi đáp trích xuất (SQuAD-style)",
        headLayer: "Linear(768, 2) cho start/end",
        input: "BERT([CLS] câu hỏi [SEP] đoạn văn [SEP])",
        output: "→ start_logits, end_logits theo từng token",
        notes:
          "Mô hình học dự đoán vị trí bắt đầu và kết thúc của đáp án trong đoạn văn. Mỗi token cho 2 giá trị logits.",
      };
    }
    return {
      title: "Nhận dạng thực thể (NER)",
      headLayer: "Linear(768, số nhãn) mỗi token",
      input: "BERT([CLS] Nguyễn Du sống ở Hà Tĩnh [SEP])",
      output: "→ B-PER I-PER O O B-LOC I-LOC",
      notes:
        "Mỗi token đầu ra của BERT đi qua lớp phân loại để gán nhãn BIO. Đây là token-level classification.",
    };
  }, [fineTuneTask]);

  return (
    <>
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Bạn đọc câu: 'Mẹ tôi vừa ra chợ mua [che] để nấu canh chua'. Làm sao con người (hoặc máy) đoán từ bị che?"
          options={[
            "Chỉ cần nhìn từ bên trái của vị trí bị che",
            "Chỉ cần nhìn từ bên phải của vị trí bị che",
            "Phải nhìn cả hai phía: 'mẹ', 'chợ', 'mua' (trái) và 'nấu canh chua' (phải)",
            "Không thể đoán được, phải đoán ngẫu nhiên",
          ]}
          correct={2}
          explanation="Câu trả lời tự nhiên là 'cá' hoặc 'me'. Để đoán đúng, bộ não bạn tổng hợp ngữ cảnh HAI CHIỀU: 'chợ / mua' (trái) gợi ý một nguyên liệu, 'canh chua' (phải) ràng buộc đó phải là cá hoặc me. BERT làm đúng điều này."
        />
      </LessonSection>

          <LessonSection step={2} totalSteps={8} label="Ngữ cảnh đời thường">
            <div className="space-y-3 text-sm text-foreground/90 leading-relaxed">
              <p>
                Hãy hình dung bạn đang đọc một tờ báo và một vết mực che mất một từ: "Hôm qua tôi đi
                [●●●] để xem phim mới chiếu." Bạn không cần đoán mò, bộ não tự động kết hợp thông
                tin trước (&quot;đi&quot;) và sau (&quot;xem phim&quot;) để suy ra &quot;rạp&quot;.
                Đó chính là cách BERT học ngôn ngữ: <strong>đọc hai chiều cùng lúc</strong>.
              </p>
              <p>
                So sánh với <TopicLink slug="gpt">GPT</TopicLink> giống như đọc truyện đang diễn ra
                &mdash; bạn chỉ biết quá khứ và hiện tại, phải đoán câu kế tiếp. BERT thì giống
                nghe một đoạn ghi âm đã hoàn chỉnh rồi bị che vài chữ &mdash; bạn có quyền tua tới
                tua lui để hiểu.
              </p>
              <p>
                Vì sao điều này quan trọng? Trong tiếng Việt, nghĩa của một từ thường phụ thuộc
                vào từ đứng sau. &quot;Sông Hương&quot; chỉ rõ là tên sông khi thấy &quot;Huế&quot;
                phía sau. BERT tận dụng chính xác tín hiệu này để tạo{" "}
                <TopicLink slug="word-embeddings">embeddings</TopicLink> phụ thuộc ngữ cảnh &mdash;
                mỗi từ có một vector khác nhau tuỳ câu.
              </p>
              <p>
                Thực tế ở Việt Nam: các trợ lý như chatbot ngân hàng, công cụ tóm tắt báo chí,
                hệ thống tìm kiếm nội dung (vd VnExpress, Tiki) đều tận dụng biến thể của BERT
                (PhoBERT, viBERT) để hiểu truy vấn tiếng Việt. Hiểu BERT đồng nghĩa hiểu nền móng
                của NLP hiện đại.
              </p>
            </div>
          </LessonSection>

          <LessonSection step={3} totalSteps={8} label="Trò chơi MLM">
            <VisualizationSection topicSlug="bert">
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted">
                    Đây là tác vụ Masked Language Modeling: BERT được huấn luyện bằng cách che ngẫu
                    nhiên 15% từ rồi đoán lại. Hãy chơi thử với mô hình.
                  </p>
                  <ProgressSteps
                    current={idx + 1}
                    total={MLM_DATA.length}
                    labels={MLM_DATA.map((_, i) => `Câu ${i + 1}/${MLM_DATA.length}`)}
                  />
                </div>

                <div className="rounded-xl border border-border bg-surface p-5 text-center">
                  <p className="font-mono text-base text-foreground leading-relaxed">
                    {current.before}{" "}
                    <motion.span
                      key={idx}
                      initial={{ backgroundColor: "#ef4444" }}
                      animate={{ backgroundColor: revealed ? "#22c55e" : "#ef4444" }}
                      transition={{ duration: 0.5 }}
                      className="rounded px-2 py-0.5 text-white font-bold"
                    >
                      {revealed ? current.answer : "[MASK]"}
                    </motion.span>{" "}
                    {current.after}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
                  {current.options.map((opt, i) => {
                    const isCorrect = i === correctIndex;
                    let cls =
                      "rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring";
                    if (!revealed) {
                      cls +=
                        " border-border bg-card text-foreground hover:border-accent hover:bg-accent-light";
                    } else if (isCorrect) {
                      cls +=
                        " border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200";
                    } else if (i === pick) {
                      cls +=
                        " border-red-500 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200";
                    } else {
                      cls += " border-border bg-card opacity-50 text-muted";
                    }
                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={revealed}
                        onClick={() => handlePick(i)}
                        className={cls}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {revealed ? (
                  <div className="space-y-3">
                    <p className="text-center text-xs text-muted">
                      Dự đoán của BERT (top-3 xác suất)
                    </p>
                    <svg viewBox="0 0 500 150" className="w-full max-w-xl mx-auto">
                      {current.bertTop3.map((p, i) => {
                        const w = p.score * 380;
                        const y = 20 + i * 40;
                        return (
                          <g key={p.word}>
                            <text
                              x="10"
                              y={y + 18}
                              fontSize="12"
                              fontWeight="600"
                              className="fill-foreground"
                            >
                              {p.word}
                            </text>
                            <rect
                              x="100"
                              y={y + 6}
                              width="380"
                              height="18"
                              rx="5"
                              fill="#e2e8f0"
                              className="dark:fill-slate-700"
                            />
                            <motion.rect
                              x="100"
                              y={y + 6}
                              height="18"
                              rx="5"
                              fill={i === 0 ? "#22c55e" : i === 1 ? "#3b82f6" : "#94a3b8"}
                              initial={{ width: 0 }}
                              animate={{ width: w }}
                              transition={{ duration: 0.6, delay: i * 0.1 }}
                            />
                            <text
                              x={100 + w + 6}
                              y={y + 20}
                              fontSize="11"
                              fontWeight="600"
                              fill={i === 0 ? "#22c55e" : "#64748b"}
                            >
                              {(p.score * 100).toFixed(0)}%
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={handleNext}
                        className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        Câu tiếp theo →
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-xs text-muted">
                    Hãy chọn từ bạn nghĩ là đúng để xem BERT dự đoán thế nào.
                  </p>
                )}
              </div>
            </VisualizationSection>
          </LessonSection>

          <LessonSection step={4} totalSteps={8} label="Hai chiều vs Một chiều">
            <VisualizationSection topicSlug="bert">
              <div className="space-y-5">
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setBidirectional(true)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      bidirectional
                        ? "bg-accent text-white"
                        : "bg-surface text-foreground hover:bg-surface-hover"
                    }`}
                  >
                    BERT (hai chiều)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBidirectional(false)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      !bidirectional
                        ? "bg-accent text-white"
                        : "bg-surface text-foreground hover:bg-surface-hover"
                    }`}
                  >
                    GPT (một chiều)
                  </button>
                </div>
                <DirectionArrows bidirectional={bidirectional} />
                <Callout
                  variant={bidirectional ? "insight" : "warning"}
                  title={bidirectional ? "BERT thấy cả hai phía" : "GPT chỉ thấy quá khứ"}
                >
                  {bidirectional
                    ? "Khi đoán [MASK], BERT tổng hợp thông tin từ cả 'Tôi uống' (trái) lẫn 'mỗi sáng' (phải). Nhờ vậy mô hình học được ngữ nghĩa hai chiều ngay trong mỗi lớp Transformer."
                    : "GPT là mô hình sinh: tại mỗi vị trí, nó chỉ được phép nhìn các token đứng trước. Cơ chế causal mask che nửa ma trận attention để tránh 'nhìn tương lai'."}
                </Callout>
              </div>
            </VisualizationSection>
          </LessonSection>

          <LessonSection step={5} totalSteps={8} label="Khoảnh khắc Aha">
            <AhaMoment>
              <p>
                BERT là một <strong>đứa trẻ đọc hai chiều</strong>: khi mất một chữ trong câu, nó
                biết nhìn cả trước và sau để đoán. Sau khi luyện đọc kiểu này trên hàng tỉ câu,
                nó mang lại một &quot;bộ não ngôn ngữ&quot; mà mọi tác vụ hiểu văn bản &mdash; từ{" "}
                <TopicLink slug="text-classification">phân loại</TopicLink> đến{" "}
                <TopicLink slug="ner">nhận dạng thực thể</TopicLink> &mdash;
                đều có thể mượn dùng, chỉ cần gắn thêm một lớp đầu ra nhỏ và tinh chỉnh vài giờ.
              </p>
            </AhaMoment>
          </LessonSection>

          <LessonSection step={5} totalSteps={8} label="Thử thách nhanh">
            <div className="space-y-4">
              <InlineChallenge
                question="Nếu đưa cho BERT câu 'Tôi [MASK] phở sáng nay', BERT sẽ dự đoán từ nào có xác suất cao nhất?"
                options={[
                  "bay",
                  "ăn",
                  "lập trình",
                  "đập",
                ]}
                correct={1}
                explanation="BERT đã học hàng tỉ câu, biết 'phở' thường đi với 'ăn' / 'nấu' / 'thích'. 'ăn' sẽ là top-1 với xác suất rất cao, các từ khác gần như không có cơ hội."
              />
              <InlineChallenge
                question="Vì sao BERT-base thường đủ tốt cho đa số tác vụ tiếng Việt khi dữ liệu hạn chế?"
                options={[
                  "BERT-base chính xác hơn BERT-large trong mọi tình huống",
                  "BERT-base có ít tham số hơn (110M), ít overfit khi dữ liệu ít",
                  "BERT-base hỗ trợ tiếng Việt bản địa sẵn",
                  "BERT-base có cơ chế attention khác hoàn toàn",
                ]}
                correct={1}
                explanation="Dữ liệu nhỏ + mô hình lớn = overfit. BERT-base (12 lớp, 110M) cân bằng tốt giữa sức mạnh và dữ liệu. Biến thể tiếng Việt như PhoBERT-base đặc biệt phù hợp."
              />
              <InlineChallenge
                question="Trong pipeline fine-tune BERT cho phân loại cảm xúc, phần nào mới được huấn luyện từ đầu?"
                options={[
                  "Toàn bộ BERT",
                  "Lớp classifier (thường chỉ là Linear + Softmax) phía trên [CLS]",
                  "Các lớp attention thấp nhất",
                  "Tokenizer",
                ]}
                correct={1}
                explanation="BERT đã được pre-train, chỉ thêm lớp classifier mới phía trên (thường 1 Linear) được khởi tạo ngẫu nhiên. Toàn bộ mô hình được tinh chỉnh với learning rate nhỏ."
              />
            </div>
          </LessonSection>

          <LessonSection step={6} totalSteps={8} label="Kiến trúc & tầng biểu diễn">
            <VisualizationSection topicSlug="bert">
              <div className="space-y-5">
                <p className="text-sm text-foreground/90 leading-relaxed text-center">
                  Mỗi câu đi qua <strong>12 lớp Transformer</strong> (BERT-base). Hãy chọn một lớp
                  để xem tầng đó học được gì.
                </p>
                <svg viewBox="0 0 640 320" className="w-full max-w-3xl mx-auto">
                  <text x="320" y="20" textAnchor="middle" fontSize="13" fontWeight="700" className="fill-foreground">
                    BERT-base: 12 lớp Encoder xếp chồng
                  </text>
                  {TOKENS_FOR_DIAGRAM.map((tok, i) => (
                    <g key={`in-${i}`}>
                      <rect
                        x={40 + i * 80}
                        y={280}
                        width={60}
                        height={28}
                        rx={6}
                        fill={`${TOKEN_COLORS[i]}20`}
                        stroke={TOKEN_COLORS[i]}
                        strokeWidth={1.5}
                      />
                      <text
                        x={70 + i * 80}
                        y={298}
                        textAnchor="middle"
                        fontSize={11}
                        fontWeight={600}
                        fill={TOKEN_COLORS[i]}
                      >
                        {tok}
                      </text>
                    </g>
                  ))}
                  {[...Array(12)].map((_, i) => {
                    const y = 250 - i * 18;
                    const isActive = selectedLayer === i + 1;
                    return (
                      <g key={`layer-${i}`}>
                        <rect
                          x={40}
                          y={y - 8}
                          width={560}
                          height={14}
                          rx={4}
                          fill={isActive ? "#3b82f6" : "#64748b20"}
                          stroke={isActive ? "#1d4ed8" : "#94a3b8"}
                          strokeWidth={isActive ? 2 : 1}
                          className="cursor-pointer"
                          onClick={() => setSelectedLayer(i + 1)}
                        />
                        <text
                          x={30}
                          y={y + 2}
                          textAnchor="end"
                          fontSize={11}
                          fill={isActive ? "#1d4ed8" : "#64748b"}
                          fontWeight={isActive ? 700 : 500}
                          className="cursor-pointer"
                          onClick={() => setSelectedLayer(i + 1)}
                        >
                          L{i + 1}
                        </text>
                      </g>
                    );
                  })}
                  <text
                    x="320"
                    y={250 - (selectedLayer - 1) * 18 + 2}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight="700"
                    fill="#ffffff"
                    style={{ pointerEvents: "none" }}
                  >
                    Layer {selectedLayer}
                  </text>
                </svg>
                <Callout variant="info" title={`Tầng ${selectedLayer}`}>
                  {layerDescription}
                </Callout>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-border bg-card p-3 text-center">
                    <p className="text-xs text-muted">Tham số</p>
                    <p className="font-mono text-lg font-semibold text-accent">110M</p>
                    <p className="text-[10px] text-tertiary">BERT-base</p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3 text-center">
                    <p className="text-xs text-muted">Hidden size</p>
                    <p className="font-mono text-lg font-semibold text-accent">768</p>
                    <p className="text-[10px] text-tertiary">vector mỗi token</p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3 text-center">
                    <p className="text-xs text-muted">Attention heads</p>
                    <p className="font-mono text-lg font-semibold text-accent">12</p>
                    <p className="text-[10px] text-tertiary">mỗi lớp</p>
                  </div>
                </div>
              </div>
            </VisualizationSection>
          </LessonSection>

          <LessonSection step={7} totalSteps={8} label="Fine-tune & Giải thích sâu">
            <VisualizationSection topicSlug="bert">
              <div className="space-y-5">
                <p className="text-center text-sm text-foreground/80">
                  Cùng một BERT pre-trained, chọn tác vụ để xem cách thêm lớp đầu ra.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {(["sentiment", "qa", "ner"] as const).map((t) => {
                    const label =
                      t === "sentiment"
                        ? "Phân loại cảm xúc"
                        : t === "qa"
                          ? "Hỏi đáp"
                          : "Nhận dạng thực thể";
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFineTuneTask(t)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                          fineTuneTask === t
                            ? "bg-accent text-white"
                            : "bg-surface text-foreground hover:bg-surface-hover"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
                  <h4 className="font-semibold text-foreground">{fineTuneConfig.title}</h4>
                  <p className="text-sm text-foreground/90">
                    <span className="font-mono text-xs text-muted">Đầu vào:</span>{" "}
                    <code className="text-xs">{fineTuneConfig.input}</code>
                  </p>
                  <p className="text-sm text-foreground/90">
                    <span className="font-mono text-xs text-muted">Lớp head:</span>{" "}
                    <code className="text-xs">{fineTuneConfig.headLayer}</code>
                  </p>
                  <p className="text-sm text-foreground/90">
                    <span className="font-mono text-xs text-muted">Đầu ra:</span>{" "}
                    <code className="text-xs">{fineTuneConfig.output}</code>
                  </p>
                  <p className="text-xs text-muted leading-relaxed">{fineTuneConfig.notes}</p>
                </div>
              </div>
            </VisualizationSection>

            <ExplanationSection topicSlug="bert">
              <p>
                <strong>BERT</strong> (Bidirectional Encoder Representations from Transformers) là
                mô hình ngôn ngữ tiền huấn luyện do Google công bố năm 2018 (Devlin và cộng sự).
                Điểm đột phá: dùng Transformer Encoder đọc hai chiều cùng lúc, kết hợp tác vụ
                Masked Language Modeling để học biểu diễn ngữ nghĩa sâu mà không cần nhãn.
              </p>

              <p>
                <strong>Công thức cốt lõi</strong> &mdash; self-attention trong một lớp encoder:
              </p>
              <LaTeX block>
                {"\\text{Attention}(Q,K,V) = \\text{softmax}\\!\\left(\\frac{Q K^{\\top}}{\\sqrt{d_k}}\\right) V"}
              </LaTeX>
              <p className="text-sm text-muted">
                <LaTeX>{"Q, K, V"}</LaTeX> là các ma trận query/key/value, <LaTeX>{"d_k"}</LaTeX>{" "}
                là chiều của key. BERT áp dụng attention <em>đầy đủ</em> (không có causal mask),
                nên mỗi token thấy được mọi token khác trong câu.
              </p>

              <p>
                <strong>Hàm mất mát MLM</strong>: dự đoán các token bị che <LaTeX>{"x_{\\mathcal{M}}"}</LaTeX>{" "}
                dựa trên phần còn lại <LaTeX>{"x_{\\setminus \\mathcal{M}}"}</LaTeX>:
              </p>
              <LaTeX block>
                {"\\mathcal{L}_{\\text{MLM}} = - \\mathbb{E}_{x \\sim \\mathcal{D}} \\sum_{i \\in \\mathcal{M}} \\log p_{\\theta}\\!\\left(x_i \\mid x_{\\setminus \\mathcal{M}}\\right)"}
              </LaTeX>

              <p>
                <strong>Các bước của quá trình tiền huấn luyện</strong>:
              </p>
              <div className="pl-2">
                <ProgressSteps
                  current={3}
                  total={5}
                  labels={[
                    "1. Tokenize + thêm [CLS], [SEP]",
                    "2. Chọn 15% token để che",
                    "3. Thay 80% bằng [MASK], 10% từ ngẫu nhiên, 10% giữ nguyên",
                    "4. Tính MLM loss + NSP loss",
                    "5. Cập nhật tham số bằng Adam",
                  ]}
                />
              </div>
              <p className="text-sm text-muted">
                Bước hiện đang được minh hoạ: <em>thay token theo tỉ lệ 80/10/10</em>. Tỉ lệ này
                giúp mô hình không &quot;lười&quot; chỉ xử lý [MASK]; nó phải luôn sẵn sàng cập
                nhật biểu diễn cho mọi token.
              </p>

              <CodeBlock language="python" title="Tải và dùng BERT với Hugging Face">
{`# Cài: pip install transformers torch
from transformers import AutoTokenizer, AutoModelForMaskedLM
import torch

# Tải mô hình tiếng Việt tiền huấn luyện
name = "vinai/phobert-base"
tokenizer = AutoTokenizer.from_pretrained(name)
model = AutoModelForMaskedLM.from_pretrained(name)

# Che một từ trong câu để BERT đoán lại
text = "Hà Nội là thủ đô của <mask>"
inputs = tokenizer(text, return_tensors="pt")

# Tìm vị trí của token [MASK]
mask_idx = (inputs.input_ids == tokenizer.mask_token_id).nonzero(as_tuple=True)[1]

# Chạy forward pass (không tính gradient)
with torch.no_grad():
    logits = model(**inputs).logits

# Lấy top-5 token dự đoán ở vị trí mask
top5 = logits[0, mask_idx].topk(5, dim=-1).indices[0]
for tid in top5:
    print(tokenizer.decode([tid]).strip())
# Kỳ vọng: Việt_Nam, Đông_Dương, Đông_Á, ...
`}
              </CodeBlock>

              <CodeBlock language="python" title="Fine-tune BERT cho phân loại cảm xúc (PyTorch)">
{`from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    Trainer,
    TrainingArguments,
)
from datasets import load_dataset

# Dữ liệu review phim tiếng Việt (vd uit-vsfc, vlsp)
ds = load_dataset("uit-nlp/vietnamese_students_feedback")

# Khởi tạo tokenizer và mô hình, num_labels=3 (neg/neu/pos)
tok = AutoTokenizer.from_pretrained("vinai/phobert-base")
model = AutoModelForSequenceClassification.from_pretrained(
    "vinai/phobert-base", num_labels=3
)

# Hàm tiền xử lý: tokenize + padding
def preprocess(batch):
    return tok(batch["sentence"], truncation=True, padding="max_length", max_length=128)

ds = ds.map(preprocess, batched=True)
ds = ds.rename_column("sentiment", "labels")

# Cấu hình huấn luyện (lr nhỏ, ít epoch — đặc trưng fine-tune)
args = TrainingArguments(
    output_dir="./out",
    num_train_epochs=3,
    per_device_train_batch_size=16,
    learning_rate=2e-5,
    weight_decay=0.01,
    evaluation_strategy="epoch",
)

trainer = Trainer(model=model, args=args, train_dataset=ds["train"], eval_dataset=ds["validation"])
trainer.train()
# Sau 3 epoch thường đạt ~88% accuracy trên test set
`}
              </CodeBlock>

              <CodeBlock language="python" title="Trích xuất embeddings từ BERT để tìm kiếm">
{`from transformers import AutoTokenizer, AutoModel
import torch

# Tải mô hình PhoBERT
tok = AutoTokenizer.from_pretrained("vinai/phobert-base")
model = AutoModel.from_pretrained("vinai/phobert-base")
model.eval()

def embed(sentences):
    """Trả về vector 768 chiều cho mỗi câu (mean-pooled)."""
    enc = tok(sentences, padding=True, truncation=True, return_tensors="pt", max_length=128)
    with torch.no_grad():
        out = model(**enc).last_hidden_state  # (B, T, 768)
    # Mean pooling, bỏ qua padding
    mask = enc.attention_mask.unsqueeze(-1)  # (B, T, 1)
    pooled = (out * mask).sum(1) / mask.sum(1)
    return torch.nn.functional.normalize(pooled, dim=-1)

queries = ["sông nào chảy qua Huế?", "thủ đô của Việt Nam"]
docs = ["Sông Hương chảy qua thành phố Huế",
        "Hà Nội là thủ đô của Việt Nam",
        "Sài Gòn là thành phố lớn nhất"]

qv = embed(queries)
dv = embed(docs)
scores = qv @ dv.T  # cosine similarity
print(scores.argmax(dim=1))  # tensor([0, 1]) — khớp đúng!
`}
              </CodeBlock>

              <Callout variant="insight" title="Vì sao MLM mạnh hơn cách huấn luyện truyền thống?">
                Trước BERT, word2vec/GloVe chỉ cho <em>một</em> vector cho mỗi từ &mdash; &quot;bank&quot;
                tại &quot;river bank&quot; và &quot;bank account&quot; là giống nhau. BERT tạo ra
                embedding <strong>phụ thuộc ngữ cảnh</strong>: mỗi lần xuất hiện của cùng một từ có
                vector khác nhau, phản ánh nghĩa đúng trong câu đó.
              </Callout>

              <Callout variant="tip" title="Mẹo fine-tune ổn định">
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Learning rate nhỏ: 1e-5 đến 5e-5.</li>
                  <li>Warmup linear 10% tổng số bước, rồi giảm tuyến tính.</li>
                  <li>Weight decay 0.01 cho các tham số không phải bias/LayerNorm.</li>
                  <li>Chỉ 2–4 epoch là đủ cho dataset cỡ vài chục nghìn mẫu.</li>
                </ul>
              </Callout>

              <Callout variant="warning" title="Sai lầm thường gặp">
                Fine-tune với learning rate quá lớn (vd 1e-3) sẽ làm &quot;catastrophic
                forgetting&quot; &mdash; BERT quên tri thức pre-train chỉ sau vài bước. Nếu loss
                dao động mạnh, giảm lr xuống ngay.
              </Callout>

              <Callout variant="info" title="Sequence length giới hạn">
                BERT chuẩn chỉ xử lý được tối đa 512 token. Với tài liệu dài, thường cắt cửa sổ
                trượt hoặc dùng mô hình dạng Longformer/BigBird.
              </Callout>

              <CollapsibleDetail title="Lịch sử: từ word2vec đến BERT">
                <div className="space-y-2 text-sm text-foreground/90">
                  <p>
                    <strong>2013 word2vec</strong>: Mikolov giới thiệu embedding một vector tĩnh
                    cho mỗi từ, huấn luyện bằng skip-gram/CBOW.
                  </p>
                  <p>
                    <strong>2014 GloVe</strong>: Stanford đưa ra phương pháp ma trận đồng xuất hiện.
                    Vẫn là embedding tĩnh.
                  </p>
                  <p>
                    <strong>2017 Transformer</strong>: Vaswani và cộng sự giới thiệu kiến trúc
                    Transformer. Cơ chế self-attention thay thế RNN/LSTM.
                  </p>
                  <p>
                    <strong>2018 ELMo</strong>: AllenNLP giới thiệu embedding động dựa trên BiLSTM
                    &mdash; bước đầu hướng đến contextual embeddings.
                  </p>
                  <p>
                    <strong>2018 GPT</strong>: OpenAI công bố mô hình Transformer Decoder tiền
                    huấn luyện &mdash; mở đường cho pre-training.
                  </p>
                  <p>
                    <strong>2018 BERT</strong>: Google công bố kiến trúc Encoder đôi chiều + MLM,
                    thống trị 11 benchmark NLP một cách thuyết phục.
                  </p>
                </div>
              </CollapsibleDetail>

              <CollapsibleDetail title="Các biến thể sau BERT">
                <div className="space-y-2 text-sm text-foreground/90">
                  <p>
                    <strong>RoBERTa (2019, Meta)</strong>: bỏ NSP, tăng dữ liệu 10 lần, huấn luyện
                    lâu hơn, dynamic masking. Cải thiện đáng kể.
                  </p>
                  <p>
                    <strong>ALBERT (2020, Google)</strong>: chia sẻ tham số giữa các lớp + phân rã
                    ma trận embedding. Giảm mạnh kích thước mô hình.
                  </p>
                  <p>
                    <strong>DistilBERT (2019)</strong>: dùng knowledge distillation để giảm 40%
                    kích thước, giữ 97% hiệu năng.
                  </p>
                  <p>
                    <strong>DeBERTa (2021, Microsoft)</strong>: tách disentangled attention giữa
                    nội dung và vị trí, SOTA cho nhiều benchmark.
                  </p>
                  <p>
                    <strong>PhoBERT (2020, VinAI)</strong>: pre-train trên 20GB văn bản tiếng Việt,
                    vượt xa BERT đa ngôn ngữ (mBERT) cho hầu hết tác vụ tiếng Việt.
                  </p>
                </div>
              </CollapsibleDetail>

              <div className="rounded-lg bg-surface/50 border border-border p-4 space-y-2">
                <h4 className="font-semibold text-foreground text-sm">Ứng dụng thực tế</h4>
                <ul className="list-disc list-inside text-sm text-foreground/90 space-y-1">
                  <li>Google Search dùng BERT để hiểu truy vấn tự nhiên từ 2019.</li>
                  <li>Chatbot chăm sóc khách hàng: phân loại ý định, trích xuất thực thể.</li>
                  <li>Tóm tắt bài báo: BERTSUM, PreSumm.</li>
                  <li>Phát hiện tin giả, phân loại bình luận độc hại.</li>
                  <li>Y tế: BioBERT, ClinicalBERT xử lý văn bản y khoa.</li>
                  <li>Tài chính: FinBERT phân tích tin tức chứng khoán.</li>
                </ul>
              </div>

              <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 space-y-2">
                <h4 className="font-semibold text-foreground text-sm">Bẫy thường gặp</h4>
                <ul className="list-disc list-inside text-sm text-foreground/90 space-y-1">
                  <li>Dùng embedding của [CLS] mà không fine-tune sẽ cho kết quả kém.</li>
                  <li>Quên truncate: câu quá 512 token bị mất thông tin.</li>
                  <li>Huấn luyện tokenizer riêng thay vì dùng tokenizer đi kèm mô hình.</li>
                  <li>Không chuẩn hoá văn bản (Unicode NFC, lowercase) trước khi đưa vào.</li>
                  <li>Fine-tune trên dữ liệu domain khác xa pre-training → dùng domain-specific BERT.</li>
                </ul>
              </div>

              <div className="rounded-lg border border-border bg-card p-4 space-y-2">
                <h4 className="font-semibold text-foreground text-sm">So sánh với lựa chọn khác</h4>
                <ul className="list-disc list-inside text-sm text-foreground/90 space-y-1">
                  <li>
                    <strong>vs GPT</strong>: BERT giỏi hiểu (classification, extraction), GPT giỏi
                    sinh (generation). Dùng BERT khi cần phân loại/trích xuất, GPT khi cần viết.
                  </li>
                  <li>
                    <strong>vs T5</strong>: T5 là encoder-decoder, linh hoạt hơn cho mọi tác vụ
                    (text-to-text) nhưng nặng hơn.
                  </li>
                  <li>
                    <strong>vs Sentence-BERT</strong>: SBERT tinh chỉnh BERT cho embedding câu,
                    cho cosine similarity tốt hơn. Nên dùng SBERT khi cần semantic search.
                  </li>
                  <li>
                    <strong>vs LLM hiện đại</strong>: LLM (Llama, Qwen) có zero-shot mạnh hơn nhưng
                    chi phí cao. BERT fine-tuned vẫn cạnh tranh về tốc độ/chi phí cho task cụ thể.
                  </li>
                </ul>
              </div>

              <Callout variant="info" title="Vì sao BERT vẫn còn chỗ đứng trong kỷ nguyên LLM?">
                <p className="text-sm leading-relaxed">
                  Năm 2026, khi các LLM hàng trăm tỷ tham số đã trở nên phổ biến, BERT tưởng như
                  đã lỗi thời. Nhưng trên thực tế, BERT và các biến thể encoder-only vẫn được
                  triển khai rộng rãi trong các hệ thống sản phẩm. Lý do then chốt: BERT-base chỉ
                  cần khoảng 400MB bộ nhớ, có thể chạy inference dưới 10ms trên CPU, và khi được
                  fine-tune cho tác vụ cụ thể (phân loại ý định chatbot, phát hiện spam, kiểm
                  duyệt nội dung) nó thường đạt độ chính xác tương đương hoặc cao hơn LLM với
                  chi phí chỉ bằng 1/100. Trong bài toán retrieval (RAG), các encoder nhỏ như
                  BGE, E5, GTE — đều là hậu duệ kiến trúc BERT — là xương sống của pipeline tìm
                  kiếm ngữ nghĩa.
                </p>
              </Callout>

              <CollapsibleDetail title="Đi sâu: Vì sao BERT không thể sinh văn bản như GPT?">
                <div className="space-y-3 text-sm text-foreground/90">
                  <p>
                    Câu trả lời nằm ở <strong>attention mask</strong>. Trong BERT, mỗi token
                    nhìn được toàn bộ các token khác (bidirectional attention, mask toàn 1).
                    Trong GPT, mỗi token chỉ nhìn được các token phía trước (causal mask, ma
                    trận tam giác dưới). Chính cấu trúc mask này quyết định mô hình có thể sinh
                    tự hồi quy (autoregressive) hay không — chứ không phải số lớp hay số tham số.
                  </p>
                  <p>
                    Nếu bạn ép BERT sinh văn bản bằng cách gán [MASK] vào vị trí cần sinh rồi
                    lặp lại, kết quả sẽ vừa chậm (mỗi bước chạy lại toàn bộ mạng) vừa kém chất
                    lượng (BERT không học phân phối tiếp theo có điều kiện như GPT). Một số
                    nghiên cứu như BERT-Gen, MASS cố khắc phục bằng cách thêm decoder nhưng
                    không đạt được chất lượng của mô hình decoder thuần.
                  </p>
                  <p>
                    Bài học: kiến trúc mã hoá (encoder) tối ưu cho <strong>hiểu</strong>, kiến
                    trúc giải mã (decoder) tối ưu cho <strong>sinh</strong>. Muốn cả hai, dùng
                    encoder-decoder (T5, BART) hoặc LLM decoder-only hiện đại đã đủ mạnh để làm
                    cả hai việc (GPT-4, Claude).
                  </p>
                </div>
              </CollapsibleDetail>

              <CollapsibleDetail title="Đi sâu: Phân tích embedding đầu vào của BERT">
                <div className="space-y-3 text-sm text-foreground/90">
                  <p>
                    Một điểm ít được nhắc đến: embedding đầu vào của BERT là tổng của{" "}
                    <strong>ba</strong> loại embedding riêng biệt, không phải một.
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      <strong>Token embedding</strong>: tra từ điển WordPiece (30k token cho
                      BERT tiếng Anh), cho vector 768 chiều (base) hoặc 1024 chiều (large).
                    </li>
                    <li>
                      <strong>Position embedding</strong>: học được, dài 512 vị trí. Đây là lý
                      do BERT bị giới hạn 512 token — không thể ngoại suy cho vị trí chưa thấy.
                    </li>
                    <li>
                      <strong>Segment embedding</strong>: chỉ có 2 giá trị (câu A = 0, câu B =
                      1), dùng cho các tác vụ cặp câu như NSP, NLI, QA.
                    </li>
                  </ul>
                  <p>
                    Ba embedding này được cộng lại, đi qua LayerNorm + Dropout rồi mới vào
                    Transformer layer đầu tiên. Biến thể RoPE (Rotary Position Embedding) trong
                    LLM hiện đại đã thay position embedding học được bằng cách mã hoá vị trí
                    trực tiếp vào attention — linh hoạt hơn và ngoại suy tốt cho câu dài.
                  </p>
                </div>
              </CollapsibleDetail>

              <Callout variant="warning" title="Lưu ý khi fine-tune trên dữ liệu tiếng Việt">
                <p className="text-sm leading-relaxed">
                  Nếu bạn dùng mBERT (multilingual BERT) cho tiếng Việt, hãy cẩn thận: mBERT học
                  từ 104 ngôn ngữ nên vốn từ vựng tiếng Việt bị chia nhỏ thành nhiều subword, dễ
                  làm mất thông tin hình vị. PhoBERT dùng RDRSegmenter để tách từ trước khi
                  tokenize, giữ được ngữ nghĩa cấp độ từ tiếng Việt (vốn là ngôn ngữ đơn tiết
                  phân tách bằng dấu cách). Hầu hết benchmark tiếng Việt (VLSP, UIT-VSFC) đều
                  cho thấy PhoBERT vượt mBERT 3–7 điểm F1.
                </p>
              </Callout>
            </ExplanationSection>
          </LessonSection>

          <LessonSection step={8} totalSteps={8} label="Tổng kết & Kiểm tra">
            <MiniSummary
              points={[
                "BERT là Transformer Encoder đọc hai chiều, tiền huấn luyện bằng MLM + NSP trên hàng tỉ câu.",
                "[CLS] tổng hợp biểu diễn câu cho tác vụ phân loại; [SEP] ngăn cách câu A và câu B.",
                "Fine-tune = giữ trọng số pre-train, thêm lớp đầu ra nhỏ, huấn luyện vài epoch với lr ~2e-5.",
                "BERT-base (110M, 12 lớp) đủ cho đa số tác vụ; BERT-large mạnh hơn nhưng cần nhiều dữ liệu.",
                "Với tiếng Việt, PhoBERT/viBERT hiệu quả hơn mBERT đa ngôn ngữ.",
                "Điểm yếu: giới hạn 512 token, không giỏi sinh văn bản, cần fine-tune thay vì prompt.",
              ]}
            />
            <QuizSection questions={QUIZ} />
          </LessonSection>
    </>
  );
}
