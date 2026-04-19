"use client";

import { useState, useCallback, useMemo } from "react";
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
  SliderGroup,
  ToggleCompare,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

// ---------------------------------------------------------------------------
// METADATA — giữ nguyên như phiên bản trước để không phá liên kết nội bộ
// ---------------------------------------------------------------------------

export const metadata: TopicMeta = {
  slug: "rnn",
  title: "Recurrent Neural Network",
  titleVi: "Mạng nơ-ron hồi quy",
  description:
    "Kiến trúc xử lý dữ liệu tuần tự bằng cách truyền trạng thái ẩn qua các bước thời gian",
  category: "dl-architectures",
  tags: ["sequence", "nlp", "time-series"],
  difficulty: "intermediate",
  relatedSlugs: ["lstm", "gru", "transformer"],
  vizType: "interactive",
};

// ---------------------------------------------------------------------------
// DỮ LIỆU CHO VISUALIZATION
// ---------------------------------------------------------------------------
// Câu mẫu đơn giản 3 từ để unroll RNN theo thời gian. Giữ 3 từ giúp sơ đồ
// rộng rãi, dễ quan sát hidden state truyền qua các bước.

const SENTENCE: string[] = ["Tôi", "yêu", "mèo"];

// Một bộ embedding 4 chiều giả định cho từng từ — đủ để minh họa phép nhân
// ma trận mà không cần công thức quá nặng. Các con số được chọn để kết quả
// forward pass nằm trong khoảng tanh dễ nhìn.
const TOKEN_EMBEDDINGS: Record<string, number[]> = {
  "Tôi": [0.9, -0.2, 0.4, 0.1],
  "yêu": [0.1, 0.8, -0.3, 0.5],
  "mèo": [-0.4, 0.3, 0.7, -0.6],
};

// Ma trận giả định cho W_xh (hidden_dim = 3, input_dim = 4) và W_hh (3x3),
// cùng bias nhỏ. Ở đây dùng 3-D hidden để vẽ ra 3 neuron một cách gọn gàng.
const W_XH: number[][] = [
  [0.4, -0.1, 0.2, 0.05],
  [-0.2, 0.3, -0.15, 0.25],
  [0.1, 0.2, -0.3, -0.1],
];

const W_HH: number[][] = [
  [0.25, -0.1, 0.05],
  [-0.05, 0.3, -0.2],
  [0.1, -0.15, 0.2],
];

const B_H: number[] = [0.02, -0.01, 0.03];

// Mô tả "bộ nhớ" mà RNN tích lũy tại mỗi bước — giúp người học cảm nhận
// ý nghĩa của hidden state thay vì chỉ thấy các con số.
const HIDDEN_DESC: string[] = [
  "h₀: chưa có ký ức — khởi tạo bằng vector 0.",
  "h₁: đã 'nghe' từ 'Tôi' — biết có một chủ thể đang nói về mình.",
  "h₂: đã 'nghe' 'Tôi yêu' — biết đang nói về cảm xúc yêu thương.",
  "h₃: đã 'nghe' 'Tôi yêu mèo' — hiểu trọn vẹn câu và chủ đề là mèo.",
];

// Bảng so sánh RNN vs LSTM vs GRU cho phần ExplanationSection.
const CELL_COMPARISON: Array<{
  name: string;
  gates: string;
  memory: string;
  params: string;
  strength: string;
  weakness: string;
}> = [
  {
    name: "RNN (vanilla)",
    gates: "Không có cổng",
    memory: "Một trạng thái ẩn h",
    params: "W_xh, W_hh, b (ít nhất)",
    strength: "Đơn giản, dễ huấn luyện trên chuỗi ngắn",
    weakness: "Gradient biến mất/bùng nổ, khó nhớ xa",
  },
  {
    name: "LSTM",
    gates: "3 cổng: forget, input, output",
    memory: "Cell state c + hidden state h",
    params: "4 bộ (W_f, W_i, W_o, W_c) — nhiều hơn ~4×",
    strength: "Nhớ được ngữ cảnh dài 100–300 bước",
    weakness: "Chậm hơn RNN, nhiều tham số hơn",
  },
  {
    name: "GRU",
    gates: "2 cổng: reset, update",
    memory: "Chỉ có hidden state h (gộp cell + hidden)",
    params: "3 bộ — gọn hơn LSTM ~25%",
    strength: "Cân bằng giữa LSTM và RNN, ít tham số",
    weakness: "Hơi kém LSTM với chuỗi siêu dài",
  },
];

// Các biến thể kiến trúc để minh họa phần "Nhiều kiểu RNN".
const VARIANTS: Array<{
  name: string;
  shape: string;
  example: string;
}> = [
  { name: "Many-to-One", shape: "N đầu vào → 1 đầu ra", example: "Phân loại cảm xúc review phim" },
  { name: "One-to-Many", shape: "1 đầu vào → N đầu ra", example: "Sinh caption cho ảnh" },
  { name: "Many-to-Many (đồng bộ)", shape: "N đầu vào → N đầu ra", example: "Gắn nhãn từ loại (POS tagging)" },
  { name: "Many-to-Many (encoder-decoder)", shape: "N → M", example: "Dịch máy (seq2seq)" },
  { name: "Bidirectional RNN", shape: "Đọc 2 chiều, nối trạng thái", example: "Nhận dạng thực thể (NER)" },
  { name: "Deep (stacked) RNN", shape: "Xếp nhiều tầng RNN lên nhau", example: "Mô hình ngôn ngữ cũ trên PTB" },
];

// ---------------------------------------------------------------------------
// HÀM HỖ TRỢ — forward pass thủ công
// ---------------------------------------------------------------------------
// Không dùng thư viện toán học nào — chỉ cần JS thuần để minh họa đúng công
// thức. Mọi thứ đều deterministic, không random, để học viên có thể so sánh
// kết quả giữa các bước.

function matVec(mat: number[][], vec: number[]): number[] {
  return mat.map((row) => row.reduce((acc, v, i) => acc + v * vec[i], 0));
}

function addVec(a: number[], b: number[]): number[] {
  return a.map((v, i) => v + b[i]);
}

function tanhVec(v: number[]): number[] {
  return v.map((x) => Math.tanh(x));
}

// Tính tất cả hidden state h_0, h_1, ..., h_T cùng một lúc để visualization
// có thể tham chiếu trực tiếp. h_0 = vector 0.
function rollForward(sentence: string[]): number[][] {
  const hiddenStates: number[][] = [];
  let h = [0, 0, 0];
  hiddenStates.push(h);
  for (const token of sentence) {
    const x = TOKEN_EMBEDDINGS[token] ?? [0, 0, 0, 0];
    const wx = matVec(W_XH, x);
    const wh = matVec(W_HH, h);
    const pre = addVec(addVec(wx, wh), B_H);
    h = tanhVec(pre);
    hiddenStates.push(h);
  }
  return hiddenStates;
}

// ---------------------------------------------------------------------------
// QUIZ CUỐI BÀI — 8 câu đúng theo yêu cầu
// ---------------------------------------------------------------------------

const quizQuestions: QuizQuestion[] = [
  {
    question:
      "RNN xử lý câu 100 từ. Tại bước thứ 100, trạng thái ẩn h₁₀₀ chứa thông tin gì?",
    options: [
      "Chỉ chứa thông tin của từ thứ 100.",
      "Về lý thuyết tóm tắt cả 100 từ, nhưng thực tế các từ đầu bị 'phai nhạt'.",
      "Chứa đầy đủ, rõ ràng thông tin của cả 100 từ như lưu một mảng.",
      "Chỉ chứa thông tin của 10 từ gần nhất theo thiết kế.",
    ],
    correct: 1,
    explanation:
      "Về lý thuyết hₜ tóm tắt toàn bộ lịch sử trước đó. Nhưng khi gradient lan truyền ngược qua rất nhiều bước, các tín hiệu xa bị nhân với nhiều số < 1 và teo về 0 — hiện tượng vanishing gradient. Đây chính là động lực cho LSTM và GRU.",
  },
  {
    question: "Tại sao RNN được gọi là 'recurrent' (hồi quy)?",
    options: [
      "Vì nó dùng hồi quy tuyến tính bên trong.",
      "Vì trạng thái ẩn ở bước trước được đưa quay lại làm đầu vào cho bước sau.",
      "Vì nó lặp lại nhiều lần trong quá trình huấn luyện giống SGD.",
      "Vì có cấu trúc vòng lặp for trong code.",
    ],
    correct: 1,
    explanation:
      "'Recurrent' nghĩa là quay lại. Trạng thái ẩn hₜ₋₁ được truyền ngược vào ô tính hₜ, tạo vòng tuần hoàn theo thời gian. Cùng một bộ trọng số được tái sử dụng ở mọi bước (weight sharing theo thời gian).",
  },
  {
    question:
      "Transformer đã thay thế RNN trong hầu hết bài toán NLP. RNN còn mạnh ở đâu?",
    options: [
      "Không còn chỗ dùng nào, chỉ còn giá trị lịch sử.",
      "Chỉ dùng trong lớp học, không dùng trong sản phẩm.",
      "Streaming real-time, thiết bị edge, và các biến thể mới như SSM/Mamba.",
      "Chỉ còn phù hợp với tiếng Anh.",
    ],
    correct: 2,
    explanation:
      "RNN xử lý từng token một → tự nhiên cho stream audio/sensor; bộ nhớ và tính toán hằng số theo độ dài chuỗi. Với thiết bị edge RAM thấp, RNN tiết kiệm hơn Transformer. State Space Models (Mamba) là biến thể hiện đại, kế thừa nhiều ý tưởng từ RNN.",
  },
  {
    question:
      "Trong công thức hₜ = tanh(W_xh · xₜ + W_hh · hₜ₋₁ + b), vai trò của hàm tanh là gì?",
    options: [
      "Để cộng hai vector xₜ và hₜ₋₁ lại với nhau.",
      "Là hàm phi tuyến giúp nén đầu ra về khoảng (−1, 1) và cho phép xếp chồng tầng.",
      "Để tăng tốc huấn luyện bằng cách loại bỏ gradient.",
      "Để chuyển đổi từ số thực sang vector one-hot.",
    ],
    correct: 1,
    explanation:
      "Nếu bỏ tanh, phép biến đổi trở thành tuyến tính thuần và N tầng RNN chỉ tương đương 1 tầng. Tanh đưa giá trị về (−1,1), đối xứng quanh 0 — điều này giúp gradient ổn định hơn sigmoid ở giữa mạng.",
  },
  {
    question:
      "Vanishing gradient xảy ra chủ yếu do đâu trong RNN thuần?",
    options: [
      "Do dữ liệu đầu vào quá ít.",
      "Do gradient khi lan truyền ngược qua T bước bị nhân lặp với đạo hàm W_hh · tanh'(.) thường < 1.",
      "Do dùng hàm loss sai (MSE thay vì cross entropy).",
      "Do learning rate luôn quá lớn.",
    ],
    correct: 1,
    explanation:
      "Backprop qua thời gian (BPTT) tạo ra tích của T ma trận Jacobi. Nếu spectral radius của W_hh · diag(tanh') < 1, tích này co lại theo cấp số nhân khi T lớn, tín hiệu xa bị xóa sổ. Ngược lại > 1 gây exploding gradient — thường chặn bằng gradient clipping.",
  },
  {
    question:
      "LSTM giải quyết vanishing gradient theo cách nào?",
    options: [
      "Dùng hàm ReLU thay cho tanh.",
      "Thêm cell state c chạy qua các bước với phép cộng (kênh truyền gradient ổn định) và các cổng để kiểm soát luồng.",
      "Xếp nhiều tầng RNN lên nhau để gradient mạnh hơn.",
      "Giảm chiều hidden state xuống 1 để gradient không biến mất.",
    ],
    correct: 1,
    explanation:
      "LSTM duy trì một 'cell state' cₜ được cập nhật bằng phép cộng có điều khiển (forget·c + input·g). Nhờ đó gradient có đường đi gần như tuyến tính (constant error carousel), không bị nhân dồn liên tục qua tanh như RNN thuần.",
  },
  {
    question:
      "GRU khác LSTM ở điểm nào quan trọng nhất?",
    options: [
      "GRU không có phi tuyến.",
      "GRU gộp cell state và hidden state, chỉ còn 2 cổng (reset, update) — ít tham số hơn LSTM.",
      "GRU chỉ dùng cho ảnh, không dùng cho văn bản.",
      "GRU chạy song song như Transformer.",
    ],
    correct: 1,
    explanation:
      "GRU bỏ cell state riêng, gộp vào h. Chỉ còn 2 cổng thay vì 3. Ít tham số hơn ~25% nên huấn luyện nhanh hơn, tốn ít bộ nhớ hơn, và thường cho kết quả tương đương LSTM trên chuỗi vừa phải.",
  },
  {
    type: "fill-blank",
    question:
      "RNN duy trì một {blank} truyền qua mỗi bước thời gian; khi backprop qua nhiều bước, gradient bị nhân lặp và thu nhỏ dần — hiện tượng {blank}. LSTM khắc phục nhờ một đường {blank} đi qua các bước với phép cộng có điều khiển.",
    blanks: [
      { answer: "hidden state", accept: ["trạng thái ẩn", "h", "trạng thái ẩn hₜ"] },
      {
        answer: "vanishing gradient",
        accept: ["gradient biến mất", "gradient vanishing", "biến mất gradient"],
      },
      { answer: "cell state", accept: ["cₜ", "cell", "trạng thái ô", "trạng thái ô cₜ"] },
    ],
    explanation:
      "Hidden state hₜ tích lũy ngữ cảnh. Khi BPTT, gradient nhân lặp với các ma trận có norm < 1 → tín hiệu xa biến mất. LSTM thêm cell state cₜ đi qua các bước bằng phép cộng có cổng — tạo 'đường cao tốc' gradient.",
  },
];

// ---------------------------------------------------------------------------
// COMPONENT CHÍNH
// ---------------------------------------------------------------------------

export default function RnnTopic() {
  // activeStep: hidden state nào đang được highlight trong sơ đồ unrolled.
  // 0 = h₀ (khởi tạo), tối đa = SENTENCE.length (h_T cuối cùng).
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Tính trước toàn bộ hidden states để tránh recompute mỗi lần render.
  const hiddenStates = useMemo(() => rollForward(SENTENCE), []);

  const TOTAL_STEPS = 8;

  const stepForward = useCallback(() => {
    setActiveStep((prev) => Math.min(SENTENCE.length, prev + 1));
  }, []);

  const stepBack = useCallback(() => {
    setActiveStep((prev) => Math.max(0, prev - 1));
  }, []);

  const reset = useCallback(() => {
    setActiveStep(0);
    setIsPlaying(false);
  }, []);

  const autoPlay = useCallback(() => {
    setIsPlaying(true);
    setActiveStep(0);
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      if (step > SENTENCE.length) {
        clearInterval(interval);
        setIsPlaying(false);
        return;
      }
      setActiveStep(step);
    }, 900);
  }, []);

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 1 — DỰ ĐOÁN (PredictionGate)
          Mục tiêu: kích hoạt tò mò. Người học phải commit một câu trả lời
          trước khi vào nội dung chính. Câu hỏi gợi ý nhu cầu "bộ nhớ" cho
          chuỗi — chính là bài toán mà RNN ra đời để giải.
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question={`Bạn đọc câu "Tôi yêu ___". Từ tiếp theo dễ đoán là "mèo", "phở", "em"... Não bạn đã dùng gì để đoán?`}
          options={[
            "Chỉ nhìn từ cuối 'yêu' là đủ để đoán.",
            "Phải nhớ cả hai từ 'Tôi yêu' để có ngữ cảnh.",
            "Không cần nhớ gì — đoán ngẫu nhiên theo xác suất nền.",
            "Phải biết cả bài văn trước đó mới đoán được.",
          ]}
          correct={1}
          explanation={`Bạn cần MỘT BỘ NHỎ NHỚ ngữ cảnh vừa đọc. Chỉ có "yêu" thì chưa đủ; nhớ thêm "Tôi" giúp bạn ưu tiên các danh từ phù hợp với chủ thể "Tôi". Mạng nơ-ron hồi quy (RNN) mô phỏng đúng cơ chế "ghi nhớ khi đọc tuần tự" này bằng một vector ẩn hₜ.`}
        >
          <p className="text-sm text-muted mt-3">
            Trong bài này, chúng ta sẽ mở cuộn (unroll) một RNN theo thời
            gian, xem trạng thái ẩn hₜ di chuyển từ trái sang phải, và hiểu
            tại sao gradient lại "phai nhạt" khi chuỗi dài.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 2 — ẨN DỤ + VISUALIZATION
          Ẩn dụ: đọc truyện kể. Bạn có một "cuốn sổ nhỏ" — mỗi khi đọc thêm
          1 từ, bạn cập nhật sổ; chính cuốn sổ đó là hidden state.
          Visualization: unrolled RNN với câu "Tôi yêu mèo". Mỗi bước hiển
          thị công thức W_h · h_{t-1} + W_x · x_t + b → tanh → h_t.
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá — Unroll RNN theo thời gian">
        <p className="text-sm text-foreground leading-relaxed mb-2">
          Hãy tưởng tượng bạn đọc một truyện ngắn, tay cầm cuốn{" "}
          <strong>sổ nhỏ</strong>. Sau mỗi từ, bạn không viết lại cả câu vào
          sổ — chỉ cập nhật <em>vài dòng ngắn</em> ghi lại "ý chính đến lúc
          này". Cuốn sổ ấy chính là <strong>trạng thái ẩn hₜ</strong> của
          RNN. Cùng một bàn tay (cùng bộ trọng số) cập nhật cuốn sổ ở mọi
          bước; chỉ có nội dung cuốn sổ là thay đổi.
        </p>
        <p className="text-sm text-muted leading-relaxed mb-4">
          Khi mở cuộn (unroll) mạng theo thời gian, một ô RNN "lặp lại" trở
          thành nhiều bản sao nối tiếp nhau — tất cả cùng dùng chung W_xh,
          W_hh và b. Hình bên dưới cho bạn thấy điều đó diễn ra với câu{" "}
          <strong>"Tôi yêu mèo"</strong>. Hãy bấm <em>Bước tiếp</em> hoặc{" "}
          <em>Tự động chạy</em> để quan sát hₜ truyền từ trái sang phải.
        </p>

        <VisualizationSection topicSlug={metadata.slug}>
          <div className="space-y-4">
            {/* === Sơ đồ unrolled === */}
            <svg viewBox="0 0 560 300" className="w-full rounded-lg border border-border bg-background">
              {/* Tiêu đề trục thời gian */}
              <text x={280} y={16} textAnchor="middle" fontSize={11} className="fill-muted">
                Trục thời gian t → (unrolled RNN)
              </text>

              {/* Mũi tên thời gian */}
              <line x1={30} y1={24} x2={540} y2={24} stroke="currentColor" className="text-muted/40" strokeWidth={1} />
              <polygon points="540,24 534,20 534,28" className="fill-muted/60" />

              {/* Vẽ 4 cột: h₀ + 3 bước xử lý */}
              {[0, 1, 2, 3].map((t) => {
                const x = 40 + t * 150;
                const isActive = t <= activeStep;
                const isCurrent = t === activeStep;
                const isInitial = t === 0;

                // Màu sắc cho mỗi token
                const tokenColor = isInitial ? "#64748b" : ["#3b82f6", "#8b5cf6", "#f97316"][t - 1];

                return (
                  <g key={t} opacity={isActive ? 1 : 0.2}>
                    {/* Input xₜ (không vẽ cho t = 0) */}
                    {!isInitial && (
                      <>
                        <motion.rect
                          x={x - 35}
                          y={240}
                          width={70}
                          height={34}
                          rx={8}
                          fill={tokenColor}
                          opacity={isCurrent ? 0.3 : 0.12}
                          stroke={tokenColor}
                          strokeWidth={isCurrent ? 2.5 : 1}
                          animate={isCurrent ? { scale: [1, 1.05, 1] } : {}}
                          transition={{ duration: 0.4 }}
                        />
                        <text
                          x={x}
                          y={261}
                          textAnchor="middle"
                          fontSize={13}
                          fontWeight={700}
                          fill={tokenColor}
                        >
                          {SENTENCE[t - 1]}
                        </text>
                        <text x={x} y={286} textAnchor="middle" fontSize={11} className="fill-muted">
                          x{t}
                        </text>
                        {/* Mũi tên xₜ lên ô RNN */}
                        <line
                          x1={x}
                          y1={238}
                          x2={x}
                          y2={188}
                          stroke={tokenColor}
                          strokeWidth={1.5}
                          strokeDasharray={isCurrent ? "0" : "2 3"}
                        />
                        <polygon
                          points={`${x},185 ${x - 4},191 ${x + 4},191`}
                          fill={tokenColor}
                        />
                      </>
                    )}

                    {/* Ô RNN (hoặc nhãn h₀ nếu t = 0) */}
                    <rect
                      x={x - 45}
                      y={130}
                      width={90}
                      height={58}
                      rx={12}
                      fill={isInitial ? "#475569" : "#f97316"}
                      opacity={isCurrent ? 0.35 : isInitial ? 0.2 : 0.08}
                      stroke={isInitial ? "#475569" : "#f97316"}
                      strokeWidth={isCurrent ? 2.5 : 1}
                    />
                    <text
                      x={x}
                      y={154}
                      textAnchor="middle"
                      fontSize={12}
                      fontWeight={700}
                      fill={isInitial ? "#475569" : "#f97316"}
                    >
                      {isInitial ? "h₀ = 0" : "RNN cell"}
                    </text>
                    {!isInitial && (
                      <text
                        x={x}
                        y={174}
                        textAnchor="middle"
                        fontSize={11}
                        className="fill-muted"
                      >
                        tanh(W_h·h + W_x·x + b)
                      </text>
                    )}

                    {/* Nhãn hₜ phía trên */}
                    <text x={x} y={118} textAnchor="middle" fontSize={11} fontWeight={600} fill="#22c55e">
                      h{t}
                    </text>
                    {/* Giá trị gần đúng của hₜ */}
                    <text x={x} y={106} textAnchor="middle" fontSize={11} className="fill-muted">
                      [{hiddenStates[t].map((v) => v.toFixed(2)).join(", ")}]
                    </text>

                    {/* Mũi tên hₜ sang bước kế tiếp */}
                    {t < 3 && (
                      <>
                        <line
                          x1={x + 45}
                          y1={159}
                          x2={x + 105}
                          y2={159}
                          stroke={isActive && t < activeStep ? "#22c55e" : "#64748b"}
                          strokeWidth={isActive && t < activeStep ? 3 : 1}
                        />
                        <polygon
                          points={`${x + 107},159 ${x + 101},155 ${x + 101},163`}
                          fill={isActive && t < activeStep ? "#22c55e" : "#64748b"}
                        />
                        {/* Nhãn W_hh trên mũi tên */}
                        <text
                          x={x + 75}
                          y={152}
                          textAnchor="middle"
                          fontSize={11}
                          className="fill-muted"
                        >
                          W_hh
                        </text>
                      </>
                    )}

                    {/* Output yₜ phía trên (không vẽ cho t = 0) */}
                    {!isInitial && (
                      <>
                        <line
                          x1={x}
                          y1={128}
                          x2={x}
                          y2={78}
                          stroke="#8b5cf6"
                          strokeWidth={1}
                          opacity={isActive ? 0.7 : 0.2}
                        />
                        <rect
                          x={x - 28}
                          y={50}
                          width={56}
                          height={26}
                          rx={8}
                          fill="#8b5cf6"
                          opacity={isCurrent ? 0.3 : 0.08}
                          stroke="#8b5cf6"
                          strokeWidth={isCurrent ? 1.5 : 0.5}
                        />
                        <text
                          x={x}
                          y={67}
                          textAnchor="middle"
                          fontSize={11}
                          fontWeight={600}
                          fill="#8b5cf6"
                        >
                          y{t} = W_hy·h{t}
                        </text>
                      </>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* === Hộp mô tả hidden state hiện tại === */}
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-lg border border-green-500/30 bg-green-500/5 p-3"
            >
              <p className="text-sm font-semibold text-green-500">
                {HIDDEN_DESC[activeStep]}
              </p>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Trạng thái ẩn hₜ là "tóm tắt" của mọi thứ RNN đã thấy từ đầu
                đến bước t. Nó là một vector cố định chiều, không phải danh
                sách các token.
              </p>
            </motion.div>

            {/* === Điều khiển === */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={stepBack}
                disabled={activeStep === 0 || isPlaying}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface disabled:opacity-30"
              >
                Bước lùi
              </button>
              <button
                type="button"
                onClick={stepForward}
                disabled={activeStep >= SENTENCE.length || isPlaying}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-white disabled:opacity-30"
              >
                Bước tiếp
              </button>
              <button
                type="button"
                onClick={autoPlay}
                disabled={isPlaying}
                className="rounded-lg border border-accent bg-accent/10 px-3 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-white disabled:opacity-30"
              >
                Tự động chạy
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface"
              >
                Đặt lại
              </button>
              <span className="ml-auto text-xs text-muted">
                Bước hiện tại: <strong>{activeStep}/{SENTENCE.length}</strong>
              </span>
            </div>

            {/* === Visualization gradient flow === */}
            <div className="mt-4 rounded-lg border border-border bg-background/50 p-3">
              <p className="text-xs font-semibold text-foreground mb-2">
                Gradient chảy ngược (màu nhạt dần = tín hiệu học yếu dần)
              </p>
              <svg viewBox="0 0 560 70" className="w-full">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((t) => {
                  const x = 30 + (t - 1) * 55;
                  // Gradient cường độ giảm theo 0.6^(T − t). Với T = 10 bước.
                  const strength = Math.pow(0.6, 10 - t);
                  return (
                    <g key={t}>
                      <rect
                        x={x}
                        y={18}
                        width={46}
                        height={30}
                        rx={6}
                        fill="#ef4444"
                        opacity={strength * 0.45 + 0.06}
                        stroke="#ef4444"
                        strokeWidth={1}
                      />
                      <text
                        x={x + 23}
                        y={38}
                        textAnchor="middle"
                        fontSize={11}
                        fontWeight={600}
                        fill="#ef4444"
                      >
                        t={t}
                      </text>
                      <text
                        x={x + 23}
                        y={62}
                        textAnchor="middle"
                        fontSize={11}
                        className="fill-muted"
                      >
                        {(strength * 100).toFixed(0)}%
                      </text>
                    </g>
                  );
                })}
                <text x={280} y={12} textAnchor="middle" fontSize={11} className="fill-muted">
                  Gradient lan ngược từ bước 10 về bước 1 — càng xa càng mờ
                </text>
              </svg>
            </div>

            <Callout variant="tip" title="Thử nghiệm nhỏ">
              Bấm <em>Tự động chạy</em> rồi quan sát các số trong
              [h₁, h₂, h₃]: chúng KHÔNG chỉ là bản sao của embedding từ
              đó, mà là hỗn hợp của từ hiện tại và ngữ cảnh trước đó.
              Đây chính là "bộ nhớ" đang hình thành.
            </Callout>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 3 — AHA MOMENT
          Chốt insight: RNN = cùng một bàn tay xử lý mỗi từ, chỉ có "cuốn
          sổ nhớ" thay đổi. Weight sharing theo thời gian.
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Một <strong>RNN đã huấn luyện xong</strong> không nhớ câu "Tôi
            yêu mèo" như một cái máy ghi âm. Nó có <em>một cuốn sổ nhỏ</em>{" "}
            cố định chiều (hₜ) và một <em>cây bút cố định</em> (W_xh, W_hh,
            b). Cây bút đó viết lại cuốn sổ sau mỗi từ; chính cuốn sổ mới là
            "ký ức" — không phải danh sách từng từ.
          </p>
          <p className="text-sm text-muted mt-2">
            Đó là lý do RNN có thể xử lý chuỗi <strong>bất kỳ độ dài</strong>:
            10 từ hay 10.000 từ đều dùng chung một bộ trọng số, chỉ có cuốn
            sổ chạy theo thời gian.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 4 — INLINE CHALLENGE #1
          Kiểm tra cảm giác: tại sao Transformer lại nhanh hơn trên GPU.
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách #1 — Tại sao RNN chậm?">
        <InlineChallenge
          question="RNN xử lý câu 6 từ cần 6 bước tuần tự. Transformer xử lý cùng câu đó cần tối đa mấy bước?"
          options={[
            "6 bước tuần tự — giống RNN.",
            "1 bước — self-attention nhìn tất cả từ cùng lúc, tính song song được.",
            "12 bước — gấp đôi vì phức tạp hơn.",
            "Không xác định được vì phụ thuộc vào độ dài từ.",
          ]}
          correct={1}
          explanation={`Transformer dùng self-attention để mọi token nhìn mọi token khác trong cùng một phép nhân ma trận — song song hóa được trên GPU. RNN bắt buộc tuần tự: phải có h₁ rồi mới tính h₂, có h₂ rồi mới tính h₃... Đó là một trong các lý do chính Transformer thay thế RNN trong hầu hết bài toán NLP hiện đại.`}
        />
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 5 — INLINE CHALLENGE #2
          Củng cố hiểu biết về vanishing gradient.
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách #2 — Vanishing gradient">
        <InlineChallenge
          question="Bạn huấn luyện RNN thuần trên câu dài 100 từ, loss giảm rất chậm và gradient ở các tầng đầu gần bằng 0. Nguyên nhân phù hợp nhất là gì?"
          options={[
            "Learning rate quá nhỏ — tăng lên sẽ hết.",
            "Mạng quá nhỏ — tăng chiều hidden lên gấp đôi là đủ.",
            "Gradient bị nhân qua rất nhiều bước với ma trận có norm < 1 → co về 0 (vanishing gradient). Cần LSTM/GRU hoặc cơ chế khác.",
            "Dữ liệu bị hỏng — phải thu thập lại.",
          ]}
          correct={2}
          explanation={`Khi backprop qua 100 bước, gradient bị nhân với 100 ma trận Jacobi liên tiếp. Nếu phần lớn có norm < 1, kết quả co về 0 theo cấp số nhân — tín hiệu học ở các bước đầu biến mất. LSTM/GRU giải quyết bằng cách tạo một "đường cao tốc" gradient qua cell state; Transformer giải quyết triệt để bằng attention trực tiếp giữa mọi cặp vị trí.`}
        />
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 6 — GIẢI THÍCH CHI TIẾT
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích chi tiết">
        <ExplanationSection>
          {/* -------- Định nghĩa chính thức -------- */}
          <p>
            <strong>Mạng nơ-ron hồi quy (Recurrent Neural Network — RNN)</strong>{" "}
            là một họ kiến trúc xử lý chuỗi bằng cách duy trì một vector{" "}
            <em>trạng thái ẩn</em> hₜ và cập nhật nó tuần tự qua các bước
            thời gian. Tại mỗi bước, đầu vào xₜ và trạng thái ẩn cũ hₜ₋₁
            được đưa vào cùng một ô (cell) — ô này có chung bộ trọng số ở
            mọi bước (weight sharing theo thời gian).
          </p>

          {/* -------- Công thức cốt lõi -------- */}
          <p>Công thức hồi quy cốt lõi của RNN thuần (Elman RNN):</p>
          <LaTeX block>
            {String.raw`h_t = \tanh\big(W_{xh} \, x_t + W_{hh} \, h_{t-1} + b_h\big)`}
          </LaTeX>
          <LaTeX block>{String.raw`y_t = W_{hy} \, h_t + b_y`}</LaTeX>

          <p className="text-sm text-muted">
            Trong đó <LaTeX>{"x_t \\in \\mathbb{R}^{d_x}"}</LaTeX> là đầu
            vào (thường là embedding của token t),{" "}
            <LaTeX>{"h_t \\in \\mathbb{R}^{d_h}"}</LaTeX> là trạng thái ẩn,
            và <LaTeX>{"y_t"}</LaTeX> là đầu ra (có thể bỏ qua nếu chỉ cần
            hₜ cuối). Ba ma trận <LaTeX>{"W_{xh}, W_{hh}, W_{hy}"}</LaTeX>{" "}
            cùng bias được chia sẻ ở mọi bước.
          </p>

          {/* -------- Cấu trúc 3 thành phần -------- */}
          <p>Ba thành phần cần nắm vững:</p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>Đầu vào xₜ:</strong> vector biểu diễn cho token/điểm
              dữ liệu tại thời điểm t. Với văn bản thường là embedding
              (dim 100–1024); với chuỗi số (giá cổ phiếu, sensor) có thể
              chỉ vài chiều.
            </li>
            <li>
              <strong>Trạng thái ẩn hₜ:</strong> "cuốn sổ" cố định chiều,
              chứa tóm tắt tất cả những gì đã thấy. Khi bắt đầu, h₀ thường
              được khởi tạo bằng vector 0 (hoặc học được như một tham số).
            </li>
            <li>
              <strong>Cổng phi tuyến tanh:</strong> nén tổ hợp tuyến tính
              về khoảng (−1, 1). Nếu bỏ tanh, RNN sụp đổ thành một phép
              biến đổi tuyến tính thuần và mất khả năng học quan hệ phi
              tuyến theo thời gian.
            </li>
          </ul>

          {/* -------- Callout #1: weight sharing -------- */}
          <Callout variant="insight" title="Weight sharing theo thời gian">
            Giống{" "}
            <TopicLink slug="cnn">CNN</TopicLink>{" "}
            chia sẻ kernel ở mọi vị trí không gian (translational
            equivariance), RNN chia sẻ ma trận trọng số ở mọi bước thời
            gian (temporal equivariance). Nhờ đó RNN xử lý được chuỗi có
            độ dài bất kỳ — điều mà MLP truyền thống không làm được.
          </Callout>

          {/* -------- Code #1: PyTorch RNN -------- */}
          <p>
            Hiện thực RNN bằng PyTorch có thể rất ngắn gọn. Dưới đây là
            phiên bản "từ gốc" để bạn thấy đúng công thức trên:
          </p>

          <CodeBlock language="python" title="rnn_pytorch.py — RNN cell từ gốc">
{`import torch
import torch.nn as nn

class SimpleRNNCell(nn.Module):
    """
    Một ô RNN thuần tuân đúng công thức Elman:
        h_t = tanh(W_xh * x_t + W_hh * h_{t-1} + b_h)
    Dùng nn.Parameter để PyTorch tự tính gradient qua BPTT.
    """
    def __init__(self, input_dim: int, hidden_dim: int):
        super().__init__()
        # Khởi tạo theo Xavier để tránh vanishing/exploding gradient
        # ngay từ bước đầu. nn.Linear chỉ là tiện nghi cho W·x + b.
        self.W_xh = nn.Linear(input_dim, hidden_dim, bias=True)
        self.W_hh = nn.Linear(hidden_dim, hidden_dim, bias=False)

    def forward(self, x_t: torch.Tensor, h_prev: torch.Tensor) -> torch.Tensor:
        # x_t: (batch, input_dim); h_prev: (batch, hidden_dim)
        return torch.tanh(self.W_xh(x_t) + self.W_hh(h_prev))


class SimpleRNN(nn.Module):
    """
    Quấn nhiều bước thời gian lại: nhận chuỗi (batch, T, input_dim),
    trả về toàn bộ hidden states (batch, T, hidden_dim) và h_T.
    """
    def __init__(self, input_dim: int, hidden_dim: int):
        super().__init__()
        self.hidden_dim = hidden_dim
        self.cell = SimpleRNNCell(input_dim, hidden_dim)

    def forward(self, x: torch.Tensor, h0: torch.Tensor | None = None):
        batch, T, _ = x.shape
        if h0 is None:
            h0 = x.new_zeros(batch, self.hidden_dim)

        h = h0
        hs = []
        # Vòng lặp tuần tự theo thời gian — đây chính là lý do RNN
        # KHÔNG song song hóa được giữa các bước (t và t+1).
        for t in range(T):
            h = self.cell(x[:, t, :], h)
            hs.append(h)

        # hs: danh sách T tensor kích thước (batch, hidden_dim)
        return torch.stack(hs, dim=1), h


# Thực tế: dùng nn.RNN của PyTorch sẽ nhanh hơn (CuDNN tối ưu).
# Ví dụ sử dụng:
if __name__ == "__main__":
    rnn = SimpleRNN(input_dim=50, hidden_dim=128)
    # Batch 4, chuỗi 20 bước, mỗi bước embedding 50 chiều
    dummy = torch.randn(4, 20, 50)
    out, h_final = rnn(dummy)
    print(out.shape, h_final.shape)  # (4, 20, 128) (4, 128)
`}
          </CodeBlock>

          {/* -------- Code #2: BPTT + gradient clipping -------- */}
          <p>
            Huấn luyện RNN cần{" "}
            <strong>Backpropagation Through Time (BPTT)</strong> — PyTorch
            làm tự động nhưng bạn cần thêm{" "}
            <em>gradient clipping</em> để tránh exploding gradient:
          </p>

          <CodeBlock
            language="python"
            title="train_rnn.py — vòng lặp huấn luyện với gradient clipping"
          >
{`import torch
import torch.nn as nn

# Giả sử bạn có sẵn mô hình và data loader
model = nn.RNN(input_size=50, hidden_size=128, batch_first=True)
head = nn.Linear(128, vocab_size)  # vocab_size tùy bài toán
opt = torch.optim.Adam(list(model.parameters()) + list(head.parameters()), lr=1e-3)
loss_fn = nn.CrossEntropyLoss()

for epoch in range(num_epochs):
    for batch_x, batch_y in train_loader:
        # batch_x: (B, T, 50); batch_y: (B, T) — chỉ số token đích
        out, _ = model(batch_x)          # (B, T, 128)
        logits = head(out)               # (B, T, V)
        loss = loss_fn(logits.reshape(-1, vocab_size), batch_y.reshape(-1))

        opt.zero_grad()
        loss.backward()

        # QUAN TRỌNG: cắt gradient để tránh exploding gradient
        # Với RNN thuần, norm gradient rất dễ nổ > 10^3 khi chuỗi dài.
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=5.0)

        opt.step()
`}
          </CodeBlock>

          {/* -------- Callout #2: vanishing/exploding -------- */}
          <Callout variant="warning" title="Vanishing & exploding gradient">
            <p>
              Gradient của loss theo W_hh chứa tích của T ma trận Jacobi
              liên tiếp. Nếu spectral radius của ma trận đó &lt; 1, gradient
              biến mất; nếu &gt; 1, gradient bùng nổ. Hai lối thoát:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 mt-2">
              <li>
                <strong>Gradient clipping</strong> — cắt norm gradient về
                ngưỡng (thường 1–5). Chặn được exploding nhưng không hồi
                phục được vanishing.
              </li>
              <li>
                <strong>Kiến trúc mới</strong> — LSTM, GRU, Transformer:
                thiết kế để gradient không bị nhân dồn qua tanh.
              </li>
            </ul>
          </Callout>

          {/* -------- Callout #3: streaming -------- */}
          <Callout variant="info" title="Khi nào nên chọn RNN thay vì Transformer?">
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>
                <strong>Streaming</strong>: audio real-time, sensor IoT —
                RNN chỉ cần hₜ₋₁ để tính hₜ, không cần toàn bộ chuỗi
                trong RAM.
              </li>
              <li>
                <strong>Thiết bị biên (edge)</strong>: RAM và compute hạn
                chế; RNN nhỏ 1–10MB dễ chạy hơn Transformer 100MB+.
              </li>
              <li>
                <strong>Chuỗi rất dài</strong>: attention O(T²) quá đắt;
                RNN hoặc biến thể SSM (Mamba) có O(T).
              </li>
            </ul>
          </Callout>

          {/* -------- Callout #4: BPTT cắt đoạn -------- */}
          <Callout variant="tip" title="Truncated BPTT — kỹ thuật thực chiến">
            <p>
              Khi chuỗi quá dài (vd 10.000 bước), backprop qua toàn bộ sẽ
              tốn bộ nhớ khổng lồ. Giải pháp:{" "}
              <strong>truncated BPTT</strong> — cứ mỗi k bước (vd k=35) thì
              detach hₜ khỏi đồ thị tính toán trước đó. Gradient chỉ lan
              ngược trong cửa sổ k bước gần nhất. Mô hình vẫn nhớ dài hạn
              thông qua hₜ (forward), chỉ gradient mới bị cắt.
            </p>
          </Callout>

          {/* -------- CollapsibleDetail #1: BPTT toán -------- */}
          <CollapsibleDetail title="Chi tiết toán học: BPTT và điều kiện vanishing (nâng cao)">
            <p className="text-sm">
              Gọi <LaTeX>{"L = \\sum_t L_t"}</LaTeX> là loss tổng cộng.
              Đạo hàm của L theo W_hh là tổng của nhiều đường:
            </p>
            <LaTeX block>
              {String.raw`\frac{\partial L}{\partial W_{hh}} = \sum_{t=1}^{T} \sum_{k=1}^{t} \frac{\partial L_t}{\partial h_t} \left( \prod_{j=k+1}^{t} \frac{\partial h_j}{\partial h_{j-1}} \right) \frac{\partial h_k}{\partial W_{hh}}`}
            </LaTeX>
            <p className="text-sm mt-2">
              Mỗi Jacobi{" "}
              <LaTeX>{"\\partial h_j / \\partial h_{j-1} = \\mathrm{diag}(\\tanh'(z_j)) \\, W_{hh}"}</LaTeX>
              . Khi T lớn, tích này có chuẩn{" "}
              <LaTeX>{"\\le (\\sigma_{\\max}(W_{hh}))^{T-k}"}</LaTeX>. Nếu{" "}
              <LaTeX>{"\\sigma_{\\max}(W_{hh}) < 1"}</LaTeX>, tích co về 0
              theo cấp số nhân (vanishing). Nếu &gt; 1, bùng nổ. Đây là
              định lý Pascanu–Mikolov–Bengio (2013) — cơ sở lý thuyết cho
              mọi biến thể RNN hiện đại.
            </p>
          </CollapsibleDetail>

          {/* -------- CollapsibleDetail #2: các biến thể -------- */}
          <CollapsibleDetail title="Các biến thể kiến trúc RNN theo hình dạng chuỗi">
            <p className="text-sm">
              Tùy bài toán, bạn chọn một trong các "hình dạng" sau:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-sm mt-2">
              {VARIANTS.map((v) => (
                <li key={v.name}>
                  <strong>{v.name}</strong> ({v.shape}) — {v.example}.
                </li>
              ))}
            </ul>
            <p className="text-sm mt-2">
              Trong đó <strong>Bidirectional RNN</strong> chạy hai RNN một
              chiều ngược nhau rồi nối trạng thái — hữu ích khi bạn có
              toàn bộ chuỗi (không streaming). <strong>Stacked RNN</strong>{" "}
              xếp nhiều tầng: đầu ra của tầng dưới làm đầu vào cho tầng
              trên, giúp học biểu diễn phân cấp.
            </p>
          </CollapsibleDetail>

          {/* -------- So sánh RNN vs LSTM vs GRU -------- */}
          <p>
            <strong>So sánh RNN thuần, LSTM, và GRU:</strong>
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead className="bg-surface">
                <tr>
                  <th className="px-3 py-2 text-left">Kiến trúc</th>
                  <th className="px-3 py-2 text-left">Cổng</th>
                  <th className="px-3 py-2 text-left">Bộ nhớ</th>
                  <th className="px-3 py-2 text-left">Tham số</th>
                  <th className="px-3 py-2 text-left">Mạnh</th>
                  <th className="px-3 py-2 text-left">Yếu</th>
                </tr>
              </thead>
              <tbody>
                {CELL_COMPARISON.map((row) => (
                  <tr key={row.name} className="border-t border-border">
                    <td className="px-3 py-2 font-semibold text-foreground">
                      {row.name}
                    </td>
                    <td className="px-3 py-2 text-muted">{row.gates}</td>
                    <td className="px-3 py-2 text-muted">{row.memory}</td>
                    <td className="px-3 py-2 text-muted">{row.params}</td>
                    <td className="px-3 py-2 text-muted">{row.strength}</td>
                    <td className="px-3 py-2 text-muted">{row.weakness}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* -------- Pitfalls -------- */}
          <p>
            <strong>Những sai lầm thường gặp khi huấn luyện RNN:</strong>
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>Quên gradient clipping</strong> → loss đột ngột nổ
              thành NaN sau vài epoch. Luôn đặt{" "}
              <code>clip_grad_norm_(..., max_norm=5.0)</code>.
            </li>
            <li>
              <strong>Khởi tạo W_hh kém</strong> → orthogonal hoặc
              identity-ish là lựa chọn tốt; random Gaussian thường có
              norm quá lớn gây bùng nổ ngay từ đầu.
            </li>
            <li>
              <strong>Dùng RNN thuần cho chuỗi &gt; 100 bước</strong> →
              gần như chắc chắn vanishing. Chuyển sang LSTM/GRU hoặc
              truncated BPTT với attention bổ sung.
            </li>
            <li>
              <strong>Batch không đồng đều độ dài</strong> → phải pad và
              dùng <code>pack_padded_sequence</code> để RNN bỏ qua pad,
              tránh học sai.
            </li>
            <li>
              <strong>Quên reset hₜ giữa các câu độc lập</strong> → mô
              hình "rò rỉ" ngữ cảnh từ mẫu này sang mẫu khác, gây bias.
            </li>
          </ul>

          {/* -------- Ứng dụng -------- */}
          <p>
            <strong>Ứng dụng thực tế của RNN (và biến thể):</strong>
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>Nhận dạng tiếng nói</strong> — Deep Speech (Baidu,
              2014) dùng LSTM hai chiều; ngày nay Conformer (CNN+attention)
              đã thay thế nhưng LSTM vẫn mạnh trên thiết bị biên.
            </li>
            <li>
              <strong>Dự báo chuỗi thời gian</strong> — giá cổ phiếu, nhu
              cầu điện, tải mạng. RNN/LSTM phổ biến vì cần streaming.
            </li>
            <li>
              <strong>Machine translation</strong> — kiến trúc
              encoder-decoder LSTM từng là state-of-the-art (2014–2017)
              trước khi{" "}
              <TopicLink slug="transformer">Transformer</TopicLink>{" "}
              thay thế.
            </li>
            <li>
              <strong>Gõ phím gợi ý trên điện thoại</strong> — RNN/GRU nhỏ
              chạy on-device vì latency và quyền riêng tư.
            </li>
            <li>
              <strong>Phát hiện bất thường trong log hệ thống</strong> —
              RNN học pattern "bình thường" rồi đánh dấu bước có loss cao
              là bất thường.
            </li>
          </ul>

          {/* -------- Chuyển tiếp đến LSTM / GRU / Transformer -------- */}
          <p className="text-sm text-muted">
            Hiểu RNN là nền tảng để bạn đọc được{" "}
            <TopicLink slug="lstm">LSTM</TopicLink> (thêm cell state và 3
            cổng), <TopicLink slug="gru">GRU</TopicLink> (rút gọn LSTM
            còn 2 cổng), và tại sao{" "}
            <TopicLink slug="transformer">Transformer</TopicLink> lại
            vượt qua cả ba. Bạn cũng nên xem lại{" "}
            <TopicLink slug="backpropagation">backpropagation</TopicLink>{" "}
            để nắm BPTT.
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 7 — MINI SUMMARY (6 điểm)
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="6 điều cần nhớ về RNN"
          points={[
            "RNN truyền trạng thái ẩn hₜ qua mỗi bước thời gian — hₜ là 'cuốn sổ' tóm tắt mọi thứ đã thấy.",
            "Công thức cốt lõi: hₜ = tanh(W_xh·xₜ + W_hh·hₜ₋₁ + b). Weight sharing theo thời gian, tương đương CNN chia sẻ kernel theo không gian.",
            "Vanishing gradient là vấn đề kinh điển: gradient nhân qua T Jacobi co về 0. Triệu chứng: lớp đầu không học.",
            "Gradient clipping (max_norm 1–5) là bắt buộc để tránh exploding gradient khi chuỗi dài.",
            "LSTM và GRU khắc phục vanishing bằng cell state + cổng; Transformer giải quyết triệt để bằng attention nhưng mất lợi thế streaming.",
            "RNN vẫn hữu ích cho streaming, thiết bị biên, và là nền tảng lý thuyết cho State Space Models (Mamba) hiện đại.",
          ]}
        />
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════════════
          BƯỚC 8 — QUIZ (8 câu)
          ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra cuối bài">
        <QuizSection questions={quizQuestions} />
      </LessonSection>

      {/* ===================================================================
          Ngoài khung 8 bước — nhánh phụ "Sandbox" cho ai muốn thử nghiệm
          thêm. Ẩn mặc định, bấm ToggleCompare để hiện.
          =================================================================== */}
      <details className="mt-10 rounded-xl border border-border bg-card/30 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-foreground">
          Sandbox bổ sung — thử nghiệm chiều hidden state (nâng cao)
        </summary>
        <div className="mt-4 space-y-3">
          <p className="text-sm text-muted">
            Kéo thanh trượt dưới đây để mô phỏng việc tăng chiều hₜ —
            quan sát số phép nhân ma trận tăng theo O(d²). Đây là lý do
            RNN chiều lớn rất đắt.
          </p>
          <SliderGroup
            sliders={[
              {
                key: "hidden_dim",
                label: "Chiều hidden (d_h)",
                min: 8,
                max: 1024,
                step: 8,
                defaultValue: 128,
                unit: "chiều",
              },
              {
                key: "seq_len",
                label: "Độ dài chuỗi (T)",
                min: 1,
                max: 500,
                step: 1,
                defaultValue: 50,
                unit: "bước",
              },
            ]}
            visualization={(values) => {
              const d = values.hidden_dim;
              const T = values.seq_len;
              // Ước lượng FLOPs: mỗi bước 2 phép nhân d·d + d·d_x ≈ 3d²
              const flopsPerStep = 3 * d * d;
              const totalFlops = flopsPerStep * T;
              return (
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-surface p-3">
                    <div className="text-lg font-bold text-foreground">
                      {d}
                    </div>
                    <div className="text-[10px] text-muted">Chiều hₜ</div>
                  </div>
                  <div className="rounded-lg bg-surface p-3">
                    <div className="text-lg font-bold text-accent">
                      {(flopsPerStep / 1e3).toFixed(1)}K
                    </div>
                    <div className="text-[10px] text-muted">
                      FLOPs / bước
                    </div>
                  </div>
                  <div className="rounded-lg bg-surface p-3">
                    <div className="text-lg font-bold text-foreground">
                      {(totalFlops / 1e6).toFixed(2)}M
                    </div>
                    <div className="text-[10px] text-muted">
                      Tổng FLOPs (T bước)
                    </div>
                  </div>
                </div>
              );
            }}
          />
          <ToggleCompare
            labelA="RNN thuần"
            labelB="LSTM (ước lượng)"
            childA={
              <div className="space-y-1 text-xs">
                <p>
                  <strong>Tham số:</strong> d_h · (d_x + d_h + 1)
                </p>
                <p>
                  <strong>Bộ nhớ khi forward:</strong> O(T · d_h)
                </p>
                <p>
                  <strong>Rủi ro:</strong> vanishing/exploding cao
                </p>
              </div>
            }
            childB={
              <div className="space-y-1 text-xs">
                <p>
                  <strong>Tham số:</strong> ~4× RNN thuần (4 cổng)
                </p>
                <p>
                  <strong>Bộ nhớ khi forward:</strong> O(T · d_h) (2× state
                  vì có cₜ và hₜ)
                </p>
                <p>
                  <strong>Rủi ro:</strong> gradient ổn định hơn nhiều nhờ
                  cell state
                </p>
              </div>
            }
          />
        </div>
      </details>
    </>
  );
}
