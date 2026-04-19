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
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────────────────────────────────────

export const metadata: TopicMeta = {
  slug: "ai-watermarking",
  title: "AI Watermarking",
  titleVi: "Đánh dấu nội dung AI",
  description:
    "Kỹ thuật nhúng dấu hiệu thống kê ẩn vào nội dung do AI tạo ra để xác minh nguồn gốc và phát hiện văn bản tổng hợp.",
  category: "ai-safety",
  tags: ["watermark", "detection", "provenance", "statistics", "z-score"],
  difficulty: "advanced",
  relatedSlugs: ["guardrails", "ai-governance", "text-to-image", "deepfake-detection"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

// ─────────────────────────────────────────────────────────────────────────────
// Constants — nội dung trình diễn watermark thống kê
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Câu văn mẫu do LLM sinh ra, gán sẵn nhãn green/red dựa trên hash(prev_token).
 * Trong triển khai thực tế, green list được sinh bí mật từ seed của token trước,
 * ở đây chúng ta hard-code để người học có thể hover và quan sát phân bố.
 */
interface WatermarkedToken {
  word: string;
  list: "green" | "red";
  /** Log-prob khi KHÔNG có watermark (mô phỏng) */
  logProbBase: number;
  /** Delta bias cộng vào nếu token thuộc green list */
  biasApplied: number;
  /** Chú thích giải thích lý do chọn từ này */
  note: string;
}

const SENTENCE_A: WatermarkedToken[] = [
  { word: "Vịnh", list: "red", logProbBase: -2.1, biasApplied: 0, note: "Token mở đầu, chưa có context cho hash." },
  { word: "Hạ", list: "green", logProbBase: -1.8, biasApplied: 2.0, note: "Hash(Vịnh) → green list chứa 'Hạ'." },
  { word: "Long", list: "green", logProbBase: -0.5, biasApplied: 2.0, note: "Hash(Hạ) → green list chứa 'Long'." },
  { word: "là", list: "green", logProbBase: -1.2, biasApplied: 2.0, note: "Từ nối phổ biến, nằm trong green list." },
  { word: "một", list: "red", logProbBase: -1.4, biasApplied: 0, note: "Token red, được chọn vì logProb cao hơn dù không có bias." },
  { word: "kỳ", list: "green", logProbBase: -2.3, biasApplied: 2.0, note: "Hash(một) → green list chứa 'kỳ'." },
  { word: "quan", list: "green", logProbBase: -0.8, biasApplied: 2.0, note: "Kỳ → quan, ghép từ tự nhiên + bonus bias." },
  { word: "thiên", list: "green", logProbBase: -2.0, biasApplied: 2.0, note: "Green token tiếp tục chuỗi." },
  { word: "nhiên", list: "green", logProbBase: -0.3, biasApplied: 2.0, note: "Collocate chặt với 'thiên'." },
  { word: "tuyệt", list: "green", logProbBase: -1.6, biasApplied: 2.0, note: "Green, adverb cường độ." },
  { word: "đẹp", list: "green", logProbBase: -0.7, biasApplied: 2.0, note: "Kết thúc mệnh đề với tính từ green." },
];

const SENTENCE_B: WatermarkedToken[] = [
  { word: "Con", list: "red", logProbBase: -1.5, biasApplied: 0, note: "Đại từ, không có seed ổn định." },
  { word: "người", list: "green", logProbBase: -0.4, biasApplied: 2.0, note: "Ghép cụm cực chặt, tự nhiên thành green." },
  { word: "luôn", list: "green", logProbBase: -1.7, biasApplied: 2.0, note: "Bias đẩy 'luôn' lên trên các từ red." },
  { word: "tìm", list: "red", logProbBase: -1.3, biasApplied: 0, note: "Red nhưng mạnh về ngữ nghĩa nên vẫn lọt top-k." },
  { word: "kiếm", list: "green", logProbBase: -0.9, biasApplied: 2.0, note: "Ghép với 'tìm', được bias." },
  { word: "ý", list: "green", logProbBase: -2.0, biasApplied: 2.0, note: "Chuyển sang chủ đề trừu tượng." },
  { word: "nghĩa", list: "green", logProbBase: -0.5, biasApplied: 2.0, note: "Ghép 'ý nghĩa' cực tự nhiên." },
  { word: "trong", list: "red", logProbBase: -1.1, biasApplied: 0, note: "Giới từ phổ biến, red nhưng không tránh được." },
  { word: "cuộc", list: "green", logProbBase: -1.8, biasApplied: 2.0, note: "Bias giúp 'cuộc' vượt 'thế'." },
  { word: "sống", list: "green", logProbBase: -0.6, biasApplied: 2.0, note: "Ghép 'cuộc sống'." },
  { word: "thường", list: "green", logProbBase: -2.2, biasApplied: 2.0, note: "Adverb frequency." },
  { word: "nhật", list: "green", logProbBase: -0.8, biasApplied: 2.0, note: "Ghép 'thường nhật'." },
];

const SENTENCE_HUMAN: WatermarkedToken[] = [
  { word: "Chị", list: "red", logProbBase: -1.2, biasApplied: 0, note: "Người viết, không tuân theo green list." },
  { word: "vừa", list: "red", logProbBase: -1.3, biasApplied: 0, note: "Red, nhưng người thật không care." },
  { word: "ghé", list: "red", logProbBase: -2.1, biasApplied: 0, note: "Red." },
  { word: "qua", list: "green", logProbBase: -0.9, biasApplied: 0, note: "Green tình cờ, ~50% xác suất." },
  { word: "chợ", list: "red", logProbBase: -1.4, biasApplied: 0, note: "Red." },
  { word: "Bến", list: "green", logProbBase: -2.3, biasApplied: 0, note: "Green tình cờ." },
  { word: "Thành", list: "red", logProbBase: -0.8, biasApplied: 0, note: "Red." },
  { word: "mua", list: "red", logProbBase: -1.1, biasApplied: 0, note: "Red." },
  { word: "bó", list: "green", logProbBase: -2.0, biasApplied: 0, note: "Green tình cờ." },
  { word: "rau", list: "red", logProbBase: -1.5, biasApplied: 0, note: "Red." },
  { word: "muống", list: "green", logProbBase: -0.6, biasApplied: 0, note: "Green tình cờ." },
];

interface SentenceCase {
  id: string;
  title: string;
  source: "ai" | "ai" | "human";
  tokens: WatermarkedToken[];
  description: string;
}

const SENTENCE_CASES: SentenceCase[] = [
  {
    id: "ai-vinh-ha-long",
    title: "Câu AI #1 — Vịnh Hạ Long",
    source: "ai",
    tokens: SENTENCE_A,
    description:
      "Văn bản do một LLM có watermark (gamma=0.5, delta=2.0) tạo ra. Tỷ lệ green tokens sẽ cao bất thường.",
  },
  {
    id: "ai-cuoc-song",
    title: "Câu AI #2 — Ý nghĩa cuộc sống",
    source: "ai",
    tokens: SENTENCE_B,
    description:
      "Cùng mô hình watermark, câu dài hơn. Quan sát pattern: phần lớn token đều được cộng bias.",
  },
  {
    id: "human-cho-ben-thanh",
    title: "Câu người thật — Ghé chợ Bến Thành",
    source: "human",
    tokens: SENTENCE_HUMAN,
    description:
      "Văn bản do người viết, không có watermark. Tỷ lệ green/red gần 50-50 (phân bố ngẫu nhiên).",
  },
];

/** Tham số mô phỏng có thể điều chỉnh bằng slider */
interface DetectionParams {
  /** Tỷ lệ green list trong vocab (0..1) */
  gamma: number;
  /** Cường độ bias cộng vào logits của green tokens */
  delta: number;
  /** Ngưỡng z-score để tuyên bố "phát hiện watermark" */
  zThreshold: number;
}

const DEFAULT_PARAMS: DetectionParams = {
  gamma: 0.5,
  delta: 2.0,
  zThreshold: 4.0,
};

/** Hàm tính z-score */
function computeZScore(greenCount: number, total: number, gamma: number): number {
  if (total <= 0) return 0;
  const expected = total * gamma;
  const variance = total * gamma * (1 - gamma);
  if (variance <= 0) return 0;
  return (greenCount - expected) / Math.sqrt(variance);
}

/** Ước lượng p-value xấp xỉ từ z-score (1-tail, z >= 0) */
function zToPValue(z: number): number {
  if (z <= 0) return 0.5;
  // Abramowitz-Stegun approximation of Q(z)
  const t = 1 / (1 + 0.2316419 * z);
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return Math.max(p, 1e-12);
}

/** Chuẩn hoá p-value về dạng hiển thị ngắn gọn */
function formatPValue(p: number): string {
  if (p < 1e-6) return p.toExponential(1).replace("e", " × 10^");
  if (p < 0.001) return p.toExponential(2).replace("e", " × 10^");
  return p.toFixed(4);
}

// ─────────────────────────────────────────────────────────────────────────────
// Quiz — 8 câu hỏi
// ─────────────────────────────────────────────────────────────────────────────

const QUIZ: QuizQuestion[] = [
  {
    question: "Watermark cho văn bản AI (Kirchenbauer et al., 2023) hoạt động cốt lõi bằng cách nào?",
    options: [
      "Chèn ký tự Unicode vô hình (zero-width) vào giữa các từ",
      "Chia từ vựng thành green/red list dựa trên hash của token trước, cộng bias vào logits của green — tỷ lệ green cao bất thường chính là dấu hiệu",
      "Gắn metadata EXIF vào file .txt chứa văn bản",
      "Thay đổi kiểu font chữ thành một font bí mật",
    ],
    correct: 1,
    explanation:
      "Đây là phương pháp watermark thống kê dựa trên logits. Green/red list được sinh từ hash(token[i-1]) — deterministic nhưng trông ngẫu nhiên. Bias delta cộng vào logits green trước softmax làm LLM ưu tiên chọn từ green. Phát hiện sau đó là bài toán thống kê thuần: nếu tỷ lệ green lệch khỏi gamma (thường 0.5) thì có watermark.",
  },
  {
    question: "Kẻ xấu paraphrase (viết lại) 30% câu trong văn bản AI để xoá watermark. Điều gì xảy ra?",
    options: [
      "Watermark biến mất hoàn toàn — paraphrase là phương pháp xoá tuyệt đối",
      "Phần 70% chưa bị viết lại vẫn mang watermark; nếu đoạn văn đủ dài, z-score vẫn vượt ngưỡng nhưng confidence giảm",
      "Watermark tự khôi phục sau vài giây",
      "Phụ thuộc vào ngôn ngữ đích",
    ],
    correct: 1,
    explanation:
      "Paraphrase phá huỷ watermark ở câu bị viết lại vì chuỗi token mới không còn tuân theo hash cũ. Tuy nhiên, 70% token gốc vẫn mang dấu hiệu. Với đoạn văn 500+ tokens, z-score vẫn có thể vượt 4. Đây là trade-off quan trọng: tăng delta giúp chống paraphrase tốt hơn nhưng làm giảm chất lượng văn bản (perplexity tăng).",
  },
  {
    question: "Tiếng Việt có thách thức đặc biệt gì khi watermark văn bản LLM?",
    options: [
      "Tiếng Việt hoàn toàn không thể watermark do có dấu",
      "BPE tokenizer thường chia 1 từ Việt thành 2-3 sub-tokens, làm effective vocabulary nhỏ hơn và cần đoạn văn dài hơn để đạt confidence cao",
      "Watermark tiếng Việt mạnh hơn tiếng Anh vì có thanh điệu",
      "Không có khác biệt gì giữa các ngôn ngữ",
    ],
    correct: 1,
    explanation:
      "Tokenizer BPE của GPT/LLaMA ưu tiên tiếng Anh, nên tiếng Việt bị fragment nhiều. Mỗi 'từ' người đọc thấy có thể là 2-3 token, làm phân bố green/red bị nhiễu. Thực nghiệm cho thấy để đạt z-score >= 4 trên tiếng Việt, cần trung bình 200-300 tokens thay vì 100-150 tokens như tiếng Anh.",
  },
  {
    question:
      "Watermark cryptographic (ví dụ SynthID-Text của Google DeepMind) khác gì so với watermark thống kê đơn giản?",
    options: [
      "Không khác gì, chỉ đổi tên thương mại",
      "Cryptographic dùng khoá bí mật và hàm giả-ngẫu nhiên được chứng minh an toàn; kẻ tấn công không thể đoán green list mà không có khoá, giúp chống removal tốt hơn",
      "Cryptographic nhúng hash MD5 vào từng từ",
      "Cryptographic chỉ hoạt động trên ảnh, không hoạt động trên văn bản",
    ],
    correct: 1,
    explanation:
      "Watermark cryptographic dùng PRF (pseudorandom function) với khoá bí mật để sinh green list. Không có khoá, kẻ tấn công không biết token nào là green. Điều này cho phép 'distortion-free' watermark: phân bố đầu ra gần giống LLM không watermark, nhưng vẫn phát hiện được nếu có khoá. SynthID-Text là triển khai thương mại của ý tưởng này.",
  },
  {
    question: "Z-score phát hiện watermark được tính như thế nào?",
    options: [
      "z = (số green - số red) / tổng số token",
      "z = (số green - T × gamma) / sqrt(T × gamma × (1 − gamma)), trong đó T là tổng token và gamma là tỷ lệ green list trong vocab",
      "z = log(số green) / log(số red)",
      "z = BLEU score giữa văn bản và reference",
    ],
    correct: 1,
    explanation:
      "Đây là z-score của kiểm định nhị thức (one-proportion z-test). Dưới giả thuyết H0 'văn bản không có watermark', số green tokens ~ Binomial(T, gamma) → mean = T·gamma, variance = T·gamma·(1−gamma). Z-score đo 'số green lệch khỏi kỳ vọng bao nhiêu độ lệch chuẩn'. z > 4 tương ứng p-value < 3 × 10^-5.",
  },
  {
    question:
      "Tại sao watermark có thể làm GIẢM chất lượng văn bản AI? Hiện tượng gọi là gì?",
    options: [
      "Không, watermark không ảnh hưởng chất lượng",
      "Bias delta ép LLM chọn từ green ngay cả khi từ red phù hợp hơn về ngữ nghĩa → tăng perplexity và đôi khi sinh câu 'kỳ lạ'; hiện tượng này gọi là watermark-induced quality degradation",
      "Watermark xoá metadata dẫn đến lỗi parsing",
      "Văn bản watermark luôn trùng lặp từ",
    ],
    correct: 1,
    explanation:
      "Tăng delta = watermark mạnh hơn = dễ phát hiện hơn, nhưng ép LLM sai lệch khỏi phân bố tự nhiên. Với delta = 2.0, perplexity tăng ~5-10% trên WikiText; với delta = 5.0, văn bản bắt đầu có câu lệch nghĩa. Đây là lý do Google đầu tư vào SynthID 'distortion-free' để giữ chất lượng.",
  },
  {
    question:
      "Điều gì KHÔNG PHẢI là một giả định của phương pháp watermark thống kê Kirchenbauer?",
    options: [
      "Kẻ tấn công không có quyền truy cập seed/khoá sinh green list",
      "Phân bố token trong văn bản không có watermark xấp xỉ đều trên vocab — điều này THƯỜNG KHÔNG đúng với ngôn ngữ tự nhiên có entropy thấp",
      "Mô hình có ít nhất ~100 token đầu ra để đạt confidence thống kê",
      "Người kiểm tra có quyền truy cập tokenizer của mô hình gốc",
    ],
    correct: 1,
    explanation:
      "Một critique phổ biến: green/red test giả định phân bố token 'đủ đa dạng' để bias tạo lệch có thể đo. Với code, công thức, hoặc văn bản entropy thấp (ví dụ HTML), tỷ lệ token 'bắt buộc' (như '<', '>', ';') quá lớn — bias không đẩy được chúng đi đâu. Giả định 'entropy đủ lớn' không phải lúc nào cũng thoả.",
  },
  {
    type: "fill-blank",
    question:
      "Watermark nhúng tín hiệu {blank} vào văn bản/ảnh AI sinh ra, rồi dùng phân tích {blank} để xác minh nguồn gốc mà không cần truy cập mô hình gốc.",
    blanks: [
      { answer: "ẩn", accept: ["an", "hidden", "vô hình", "vo hinh", "bí mật", "bi mat"] },
      { answer: "thống kê", accept: ["statistical", "thong ke", "z-score", "xác suất", "xac suat"] },
    ],
    explanation:
      "Watermark AI dựa trên nguyên tắc: (1) nhúng tín hiệu ẩn không ảnh hưởng cảm nhận người dùng, (2) tín hiệu có thể phát hiện bằng phân tích thống kê (z-score, p-value) mà không cần biết mô hình gốc. Đây là tuyến phòng thủ quan trọng để xác minh nội dung AI trong bối cảnh EU AI Act và các quy định nội dung số tại Việt Nam.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component chính
// ─────────────────────────────────────────────────────────────────────────────

export default function AIWatermarkingTopic() {
  // ── State ──
  const [showWatermark, setShowWatermark] = useState(false);
  const [activeCaseIdx, setActiveCaseIdx] = useState(0);
  const [hoveredTokenIdx, setHoveredTokenIdx] = useState<number | null>(null);
  const [params, setParams] = useState<DetectionParams>(DEFAULT_PARAMS);
  const [showCryptoCompare, setShowCryptoCompare] = useState(false);

  const activeCase = SENTENCE_CASES[activeCaseIdx];

  // ── Derived metrics ──
  const totalTokens = activeCase.tokens.length;
  const greenCount = useMemo(
    () => activeCase.tokens.filter((t) => t.list === "green").length,
    [activeCase],
  );
  const greenRatio = totalTokens > 0 ? greenCount / totalTokens : 0;
  const zScore = useMemo(
    () => computeZScore(greenCount, totalTokens, params.gamma),
    [greenCount, totalTokens, params.gamma],
  );
  const pValue = useMemo(() => zToPValue(zScore), [zScore]);
  const watermarkDetected = zScore > params.zThreshold;

  // ── Handlers ──
  const toggleWatermark = useCallback(() => {
    setShowWatermark((prev) => !prev);
  }, []);

  const handleCaseChange = useCallback((idx: number) => {
    setActiveCaseIdx(idx);
    setHoveredTokenIdx(null);
  }, []);

  const handleTokenHover = useCallback((idx: number | null) => {
    setHoveredTokenIdx(idx);
  }, []);

  const handleGammaChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const gamma = parseFloat(e.target.value);
      setParams((prev) => ({ ...prev, gamma }));
    },
    [],
  );

  const handleDeltaChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const delta = parseFloat(e.target.value);
      setParams((prev) => ({ ...prev, delta }));
    },
    [],
  );

  const handleThresholdChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const zThreshold = parseFloat(e.target.value);
      setParams((prev) => ({ ...prev, zThreshold }));
    },
    [],
  );

  const handleResetParams = useCallback(() => {
    setParams(DEFAULT_PARAMS);
  }, []);

  const toggleCryptoCompare = useCallback(() => {
    setShowCryptoCompare((prev) => !prev);
  }, []);

  // ── Render ──
  return (
    <>
      {/* ─────────────────────────────────────────────────────────────── */}
      {/* STEP 1 — Dự đoán                                                 */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <div className="mb-3">
          <ProgressSteps
            current={1}
            total={TOTAL_STEPS}
            labels={[
              "Dự đoán",
              "Khám phá",
              "A-ha",
              "Thử thách",
              "Lý thuyết",
              "Ứng dụng",
              "Tóm tắt",
              "Kiểm tra",
            ]}
          />
        </div>
        <PredictionGate
          question="Một sinh viên nộp bài luận dài 500 chữ. Làm sao giáo viên biết bài do AI viết mà KHÔNG cần đọc nội dung, không cần so sánh với corpus, chỉ dùng phân tích toán học?"
          options={[
            "Không thể biết nếu không đọc — đây là điều bất khả thi",
            "Phân tích thống kê: AI watermark nhúng pattern ẩn vào phân phối từ; phát hiện bằng toán học, không cần đọc nội dung",
            "Kiểm tra metadata file docx/pdf để xem trường 'Author'",
            "Đếm số từ tiếng Anh chen vào văn bản tiếng Việt",
          ]}
          correct={1}
          explanation="AI Watermarking nhúng dấu hiệu thống kê ẩn vào văn bản: LLM ưu tiên chọn từ từ 'danh sách xanh' bí mật sinh ra từ hash(token trước). Văn bản đọc bình thường, nhưng khi phân tích tỷ lệ từ xanh cao BẤT THƯỜNG so với mức kỳ vọng 50% ngẫu nhiên → chứng tỏ do AI viết. Giống chữ ký ẩn trong bức tranh mà chỉ kính lúp mới thấy!"
        />
      </LessonSection>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* STEP 2 — Khám phá: visualizer watermark thống kê                  */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Dưới đây là ba đoạn văn: hai đoạn do LLM có watermark sinh ra, một đoạn
          do người thật viết. <strong>Hover</strong> vào từng từ để xem trạng
          thái <span className="text-green-700 font-semibold">green</span> /{" "}
          <span className="text-red-700 font-semibold">red</span>, log-prob nền
          và bias delta được cộng. Nhấn nút để <strong>hiện/ẩn lớp watermark</strong>.
          Điều chỉnh <em>gamma</em>, <em>delta</em>, và <em>ngưỡng z</em> để xem
          độ nhạy thay đổi.
        </p>

        <VisualizationSection>
          <div className="space-y-5">
            {/* Case selector */}
            <div className="flex flex-wrap gap-2 justify-center">
              {SENTENCE_CASES.map((c, idx) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleCaseChange(idx)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    idx === activeCaseIdx
                      ? "bg-accent text-white"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                  aria-pressed={idx === activeCaseIdx}
                >
                  {c.title}
                </button>
              ))}
            </div>

            {/* Description + toggle */}
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <p className="text-xs text-muted flex-1 min-w-[200px]">
                {activeCase.description}
              </p>
              <button
                type="button"
                onClick={toggleWatermark}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  showWatermark
                    ? "bg-accent text-white"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
                aria-pressed={showWatermark}
              >
                {showWatermark ? "Ẩn watermark" : "Hiện watermark ẩn"}
              </button>
            </div>

            {/* Main SVG viz */}
            <svg viewBox="0 0 620 340" className="w-full max-w-2xl mx-auto">
              <text
                x={310}
                y={20}
                textAnchor="middle"
                fontSize={12}
                fill="#94a3b8"
                fontWeight="bold"
              >
                {activeCase.source === "ai"
                  ? "Văn bản do AI (có watermark) tạo ra:"
                  : "Văn bản do người thật viết (không có watermark):"}
              </text>

              {/* Token grid */}
              {activeCase.tokens.map((tok, i) => {
                const colsPerRow = 6;
                const cellW = 92;
                const cellH = 34;
                const gapX = 4;
                const gapY = 6;
                const x = 20 + (i % colsPerRow) * (cellW + gapX);
                const y = 30 + Math.floor(i / colsPerRow) * (cellH + gapY);

                const isHover = hoveredTokenIdx === i;
                const fillColor = showWatermark
                  ? tok.list === "green"
                    ? "#dcfce7"
                    : "#fee2e2"
                  : "#f1f5f9";
                const strokeColor = showWatermark
                  ? tok.list === "green"
                    ? "#22c55e"
                    : "#ef4444"
                  : isHover
                    ? "#3b82f6"
                    : "#e2e8f0";
                const strokeWidth = showWatermark ? 2 : isHover ? 2 : 1;

                return (
                  <g
                    key={i}
                    onMouseEnter={() => handleTokenHover(i)}
                    onMouseLeave={() => handleTokenHover(null)}
                    className="cursor-pointer"
                  >
                    <rect
                      x={x}
                      y={y}
                      width={cellW}
                      height={cellH}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      rx={6}
                    />
                    <text
                      x={x + cellW / 2}
                      y={y + cellH / 2 + 4}
                      textAnchor="middle"
                      fontSize={12}
                      fill="#0f172a"
                      fontWeight="bold"
                    >
                      {tok.word}
                    </text>
                  </g>
                );
              })}

              {/* Legend when watermark shown */}
              {showWatermark && (
                <g transform="translate(20, 160)">
                  <rect
                    x={0}
                    y={0}
                    width={15}
                    height={15}
                    fill="#dcfce7"
                    stroke="#22c55e"
                    rx={2}
                  />
                  <text x={20} y={12} fontSize={10} fill="#166534">
                    Green list ({greenCount}/{totalTokens})
                  </text>
                  <rect
                    x={180}
                    y={0}
                    width={15}
                    height={15}
                    fill="#fee2e2"
                    stroke="#ef4444"
                    rx={2}
                  />
                  <text x={200} y={12} fontSize={10} fill="#991b1b">
                    Red list ({totalTokens - greenCount}/{totalTokens})
                  </text>
                  <text
                    x={360}
                    y={12}
                    fontSize={10}
                    fill="#64748b"
                    fontStyle="italic"
                  >
                    Hash(prev) → phân chia ngẫu nhiên
                  </text>
                </g>
              )}

              {/* Stats panel */}
              <g transform="translate(20, 190)">
                <rect
                  x={0}
                  y={0}
                  width={580}
                  height={130}
                  fill="#f8fafc"
                  rx={8}
                  stroke="#e2e8f0"
                />
                <text
                  x={290}
                  y={18}
                  textAnchor="middle"
                  fontSize={12}
                  fill="#64748b"
                  fontWeight="bold"
                >
                  Phân tích thống kê — gamma={params.gamma.toFixed(2)}, delta=
                  {params.delta.toFixed(1)}, ngưỡng z={params.zThreshold.toFixed(1)}
                </text>

                {/* Green ratio bar */}
                <rect x={15} y={30} width={550} height={18} fill="#fee2e2" rx={4} />
                <rect
                  x={15}
                  y={30}
                  width={550 * greenRatio}
                  height={18}
                  fill="#22c55e"
                  rx={4}
                />
                <text
                  x={290}
                  y={44}
                  textAnchor="middle"
                  fontSize={10}
                  fill="white"
                  fontWeight="bold"
                >
                  Tỷ lệ green: {Math.round(greenRatio * 100)}% (kỳ vọng H0:{" "}
                  {Math.round(params.gamma * 100)}%)
                </text>

                {/* Z-score display */}
                <text
                  x={290}
                  y={70}
                  textAnchor="middle"
                  fontSize={11}
                  fill="#0f172a"
                  fontWeight="bold"
                >
                  z-score = {zScore.toFixed(2)} &nbsp;|&nbsp; p-value ≈{" "}
                  {formatPValue(pValue)}
                </text>

                {/* Verdict */}
                <text
                  x={290}
                  y={95}
                  textAnchor="middle"
                  fontSize={12}
                  fill={watermarkDetected ? "#166534" : "#991b1b"}
                  fontWeight="bold"
                >
                  {watermarkDetected
                    ? "✓ PHÁT HIỆN WATERMARK → gần như chắc chắn do AI viết"
                    : "✗ Không đủ bằng chứng → có thể là người viết hoặc đoạn quá ngắn"}
                </text>

                <text
                  x={290}
                  y={115}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#64748b"
                  fontStyle="italic"
                >
                  T = {totalTokens} tokens · kỳ vọng green = {(totalTokens * params.gamma).toFixed(1)} · SD ={" "}
                  {Math.sqrt(totalTokens * params.gamma * (1 - params.gamma)).toFixed(2)}
                </text>
              </g>
            </svg>

            {/* Hover detail panel */}
            {hoveredTokenIdx !== null && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className="rounded-lg bg-background/60 border border-border p-3"
              >
                <p className="text-xs font-semibold text-foreground mb-1">
                  Token #{hoveredTokenIdx + 1}: "
                  <span className="text-accent">
                    {activeCase.tokens[hoveredTokenIdx].word}
                  </span>
                  "
                </p>
                <ul className="text-xs text-muted space-y-0.5 leading-relaxed">
                  <li>
                    <strong>List:</strong>{" "}
                    <span
                      className={
                        activeCase.tokens[hoveredTokenIdx].list === "green"
                          ? "text-green-700"
                          : "text-red-700"
                      }
                    >
                      {activeCase.tokens[hoveredTokenIdx].list}
                    </span>
                  </li>
                  <li>
                    <strong>Log-prob nền:</strong>{" "}
                    {activeCase.tokens[hoveredTokenIdx].logProbBase.toFixed(2)}
                  </li>
                  <li>
                    <strong>Bias cộng vào:</strong> +
                    {activeCase.tokens[hoveredTokenIdx].biasApplied.toFixed(1)}
                  </li>
                  <li>
                    <strong>Log-prob hiệu dụng:</strong>{" "}
                    {(
                      activeCase.tokens[hoveredTokenIdx].logProbBase +
                      activeCase.tokens[hoveredTokenIdx].biasApplied
                    ).toFixed(2)}
                  </li>
                  <li className="italic">
                    {activeCase.tokens[hoveredTokenIdx].note}
                  </li>
                </ul>
              </motion.div>
            )}

            {/* Slider controls */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-card p-3">
                <label
                  htmlFor="slider-gamma"
                  className="block text-[11px] font-semibold text-muted mb-1"
                >
                  Gamma (tỷ lệ green list) — {params.gamma.toFixed(2)}
                </label>
                <input
                  id="slider-gamma"
                  type="range"
                  min={0.1}
                  max={0.9}
                  step={0.05}
                  value={params.gamma}
                  onChange={handleGammaChange}
                  className="w-full accent-accent"
                />
                <p className="text-[10px] text-muted mt-1">
                  Gamma nhỏ = green hiếm, khó phát hiện. Gamma = 0.5 là mặc định.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-3">
                <label
                  htmlFor="slider-delta"
                  className="block text-[11px] font-semibold text-muted mb-1"
                >
                  Delta (cường độ bias) — {params.delta.toFixed(1)}
                </label>
                <input
                  id="slider-delta"
                  type="range"
                  min={0}
                  max={5}
                  step={0.1}
                  value={params.delta}
                  onChange={handleDeltaChange}
                  className="w-full accent-accent"
                />
                <p className="text-[10px] text-muted mt-1">
                  Delta cao = watermark mạnh nhưng giảm chất lượng văn bản.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-3">
                <label
                  htmlFor="slider-threshold"
                  className="block text-[11px] font-semibold text-muted mb-1"
                >
                  Ngưỡng z — {params.zThreshold.toFixed(1)}
                </label>
                <input
                  id="slider-threshold"
                  type="range"
                  min={1}
                  max={8}
                  step={0.1}
                  value={params.zThreshold}
                  onChange={handleThresholdChange}
                  className="w-full accent-accent"
                />
                <p className="text-[10px] text-muted mt-1">
                  z &gt; 4 ⇔ p &lt; 3×10⁻⁵. Cao hơn = an toàn hơn với false positives.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              <button
                type="button"
                onClick={handleResetParams}
                className="text-[11px] text-muted hover:text-foreground underline"
              >
                Reset tham số
              </button>
              <span className="text-[11px] text-muted">·</span>
              <button
                type="button"
                onClick={toggleCryptoCompare}
                className="text-[11px] text-muted hover:text-foreground underline"
              >
                {showCryptoCompare
                  ? "Ẩn so sánh cryptographic vs statistical"
                  : "So sánh với watermark cryptographic"}
              </button>
            </div>

            {/* Crypto vs statistical comparison */}
            {showCryptoCompare && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="rounded-lg border border-border bg-background/50 p-4 mt-2">
                  <p className="text-sm font-semibold text-foreground mb-2">
                    So sánh 2 họ watermark văn bản
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2 text-xs">
                    <div className="rounded-md bg-card border border-border p-3">
                      <p className="font-semibold text-accent mb-1">
                        Statistical (Kirchenbauer 2023)
                      </p>
                      <ul className="space-y-1 text-muted list-disc pl-4">
                        <li>Hash(token trước) → green list</li>
                        <li>Cộng delta vào logits green</li>
                        <li>Phát hiện bằng z-score</li>
                        <li>Dễ triển khai, open-source</li>
                        <li>Có thể phát hiện không cần khoá (nếu biết gamma)</li>
                        <li>Dễ bị paraphrase tấn công</li>
                      </ul>
                    </div>
                    <div className="rounded-md bg-card border border-border p-3">
                      <p className="font-semibold text-accent mb-1">
                        Cryptographic (SynthID, Aaronson 2023)
                      </p>
                      <ul className="space-y-1 text-muted list-disc pl-4">
                        <li>PRF với khoá bí mật → danh sách ẩn</li>
                        <li>Distortion-free: phân bố gần LLM gốc</li>
                        <li>Phát hiện cần khoá (hoặc nhà phát hành)</li>
                        <li>Khó paraphrase xoá do PRF mạnh</li>
                        <li>Cần infrastructure quản lý khoá</li>
                        <li>Google SynthID-Text triển khai thương mại</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* STEP 3 — A-ha moment                                             */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          Watermark AI giống{" "}
          <strong>tiền giả với dải bảo mật nhúng UV</strong> — mắt thường đọc
          văn bản bình thường, nhưng <strong>phân tích thống kê dưới 'đèn UV'</strong>{" "}
          phát hiện pattern ẩn. Với {totalTokens} tokens và tỷ lệ green{" "}
          {Math.round(greenRatio * 100)}% thay vì 50% ngẫu nhiên, xác suất xảy
          ra tự nhiên là <strong>{formatPValue(pValue)}</strong>. Nếu z-score
          vượt ngưỡng {params.zThreshold.toFixed(1)}, ta gần như{" "}
          <strong>chắc chắn văn bản do AI sinh ra</strong> — và không cần đọc một
          chữ nào!
        </AhaMoment>
      </LessonSection>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* STEP 4 — Inline challenges                                       */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <div className="space-y-4">
          <InlineChallenge
            question="Một sinh viên dùng ChatGPT viết bài 500 từ, rồi paraphrase (viết lại bằng từ đồng nghĩa) 30% số câu. Watermark còn phát hiện được không?"
            options={[
              "Không — paraphrase xoá sạch watermark, văn bản coi như do người viết",
              "Phát hiện được phần 70% chưa bị viết lại; nếu đoạn đủ dài, z-score vẫn có thể vượt ngưỡng nhưng độ tin cậy giảm",
              "Phát hiện 100% vì watermark bất biến với mọi biến đổi",
              "Chỉ phát hiện nếu sinh viên dùng đúng mô hình ChatGPT phiên bản gốc",
            ]}
            correct={1}
            explanation="Paraphrase phá huỷ watermark trong câu bị viết lại (chuỗi token mới không còn tuân hash cũ), nhưng 70% còn lại vẫn mang dấu hiệu. Với đoạn văn >200 tokens và delta = 2.0, z-score thường vẫn vượt 3 — đủ báo động. Đây là điểm yếu rõ của watermark statistical: khắc phục bằng semantic watermark (nhúng vào nghĩa, không token)."
          />

          <InlineChallenge
            question="Văn bản chỉ có 20 tokens, tỷ lệ green là 15/20 = 75%. Có thể kết luận chắc chắn là AI viết không?"
            options={[
              "Có — 75% cao hơn 50% nhiều nên chắc chắn là AI",
              "Không — 20 tokens quá ít để đạt z-score đủ lớn; dễ false positive do biến động ngẫu nhiên",
              "Phụ thuộc vào nội dung văn bản",
              "Chỉ cần tỷ lệ >60% là đủ kết luận",
            ]}
            correct={1}
            explanation="Với T=20, gamma=0.5, kỳ vọng green = 10, SD = sqrt(5) ≈ 2.24. Z = (15-10)/2.24 ≈ 2.24 → p ≈ 0.013. Đáng chú ý nhưng CHƯA đủ an toàn để tuyên bố watermark (thường yêu cầu p < 3×10⁻⁵, tức z > 4). Người viết bình thường có thể tình cờ đạt 75% trong một đoạn ngắn. Luôn cần đoạn ≥ 100-200 tokens để đạt confidence đáng tin."
          />
        </div>
      </LessonSection>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* STEP 5 — Lý thuyết                                               */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection topicSlug={metadata.slug}>
          <p>
            <strong>AI Watermarking</strong> là kỹ thuật nhúng dấu hiệu ẩn vào
            nội dung AI, cho phép phát hiện nguồn gốc mà không ảnh hưởng đáng kể
            đến chất lượng. Đây là tuyến phòng thủ quan trọng bổ trợ cho{" "}
            <TopicLink slug="deepfake-detection">phát hiện deepfake</TopicLink>,
            và đối phó với{" "}
            <TopicLink slug="adversarial-robustness">tấn công đối kháng</TopicLink>{" "}
            nhằm xoá dấu nguồn gốc. Trong bối cảnh EU AI Act và{" "}
            <TopicLink slug="ai-governance">quản trị AI</TopicLink> tại Việt Nam,
            watermark đang trở thành yêu cầu bắt buộc đối với nội dung tổng hợp.
          </p>

          <Callout variant="insight" title="Cách hoạt động (Kirchenbauer et al., ICML 2023)">
            <div className="space-y-2">
              <p>
                <strong>1. Chia từ vựng:</strong> Dùng hash(token[i-1]) để chia
                toàn bộ từ vựng thành <em>green list</em> (tỷ lệ gamma, thường
                0.5) và <em>red list</em>. Chia ngẫu nhiên nhưng deterministic —
                cùng prev token luôn cho cùng chia.
              </p>
              <p>
                <strong>2. Thiên vị khi sinh:</strong> Cộng bias delta (thường
                2.0) vào logits của green tokens trước khi softmax. LLM sẽ ưu
                tiên chọn từ green, nhưng không ép buộc — nếu red token quá mạnh
                về ngữ nghĩa thì vẫn có thể được chọn.
              </p>
              <p>
                <strong>3. Phát hiện:</strong> Với văn bản cần kiểm tra, tái
                tạo green list từ hash(token trước) rồi đếm số green. Tính
                z-score (one-proportion z-test). Nếu z &gt; threshold (4.0), tuyên
                bố có watermark.
              </p>
              <p>
                <strong>4. False positive rate:</strong> Với z &gt; 4, xác suất
                false positive là p &lt; 3×10⁻⁵ — tức là chưa đến 1 trên 30.000
                văn bản con người viết bị gắn nhầm nhãn "AI".
              </p>
            </div>
          </Callout>

          <p>Công thức z-score phát hiện watermark:</p>
          <LaTeX block>
            {"z = \\frac{|g| - \\gamma T}{\\sqrt{\\gamma (1-\\gamma) T}} \\quad \\text{(} |g| \\text{ = số green tokens, } T \\text{ = tổng tokens, } \\gamma \\text{ = tỷ lệ green list)}"}
          </LaTeX>
          <p className="text-sm text-muted">
            Dưới giả thuyết H0 (văn bản không có watermark), số green tokens tuân
            theo phân phối nhị thức Binomial(T, gamma). Với T đủ lớn, z-score xấp
            xỉ phân phối chuẩn N(0, 1). Nếu{" "}
            <LaTeX>{"z > 4"}</LaTeX>, p-value &lt; 3×10⁻⁵ → bác bỏ H0.
          </p>

          <Callout variant="warning" title="Thách thức watermark cho tiếng Việt">
            <div className="space-y-1">
              <p>
                <strong>Tokenization:</strong> BPE của GPT/LLaMA chia tiếng Việt
                thành 2-3 tokens/từ (nhiều hơn tiếng Anh ~1.5-2x) → effective
                vocabulary nhỏ hơn, green/red partition kém đa dạng, watermark
                yếu hơn tương đối.
              </p>
              <p>
                <strong>Paraphrase:</strong> Tiếng Việt có tính linh hoạt cao
                trong diễn đạt (đồng nghĩa dày đặc, từ Hán Việt vs thuần Việt) →
                dễ paraphrase xoá watermark mà không mất nghĩa.
              </p>
              <p>
                <strong>Ảnh AI:</strong> Watermark cho ảnh (Stable Diffusion,
                DALL-E, Midjourney) nhúng vào miền tần số không gian DFT/DCT —
                bền hơn với chỉnh sửa, crop, resize. Phương pháp khác hẳn văn
                bản.
              </p>
              <p>
                <strong>Tin giả:</strong> Mạng xã hội Việt Nam bùng nổ
                deepfake chính trị; watermark chỉ phát hiện nội dung do mô hình
                có watermark sinh ra — mô hình open-source không watermark vẫn
                là lỗ hổng.
              </p>
            </div>
          </Callout>

          <CollapsibleDetail
            title="Chi tiết kỹ thuật: seed, hash, và PRF"
            defaultOpen={false}
          >
            <div className="text-sm text-muted leading-relaxed space-y-2">
              <p>
                Trong paper gốc của Kirchenbauer, seed của RNG được sinh từ
                hash(last_token_id). Điều này có nghĩa: hai văn bản khác nhau
                cùng chứa token "the" ở vị trí i sẽ có green list giống nhau ở
                vị trí i+1 (với giả định cùng tokenizer và cùng khoá).
              </p>
              <p>
                Đây là trade-off: dùng context dài hơn (hash của k token trước)
                giúp watermark khó đoán hơn nhưng làm tăng "biến thiên" trong
                green list giữa các đoạn văn, nhiều khi giảm độ tin cậy phát
                hiện.
              </p>
              <p>
                Phiên bản cryptographic thay hash đơn giản bằng PRF (pseudorandom
                function) hoặc HMAC với khoá bí mật. Không có khoá, kẻ tấn công
                không thể:
              </p>
              <ul className="list-disc pl-5 space-y-0.5">
                <li>Biết token nào là green (để thay bằng từ đồng nghĩa)</li>
                <li>Huấn luyện mô hình remove watermark</li>
                <li>Giả mạo văn bản "mang watermark" mà mình không sở hữu</li>
              </ul>
              <p>
                Ví dụ: SynthID-Text của Google DeepMind dùng "tournament
                sampling" — mỗi token được chọn qua một cây đấu loại nhiều vòng,
                mỗi vòng đánh giá bằng PRF. Phân bố đầu ra gần LLM gốc
                (distortion-free), nhưng tín hiệu watermark đủ mạnh để phát
                hiện.
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail
            title="Các tấn công xoá watermark (removal attacks)"
            defaultOpen={false}
          >
            <div className="text-sm text-muted leading-relaxed space-y-2">
              <p>
                <strong>1. Paraphrase attack:</strong> Viết lại từng câu bằng
                mô hình paraphrase (ví dụ PEGASUS hoặc GPT-4) → phá cấu trúc
                token. Hiệu quả 80-95% với delta nhỏ; giảm khi delta tăng.
              </p>
              <p>
                <strong>2. Token substitution:</strong> Thay ngẫu nhiên một tỷ
                lệ p tokens bằng từ đồng nghĩa. Cần p &gt; 25-30% mới phá được
                watermark mạnh.
              </p>
              <p>
                <strong>3. Back-translation:</strong> Dịch sang ngôn ngữ khác
                rồi dịch ngược. Phá watermark rất hiệu quả nhưng giảm chất
                lượng.
              </p>
              <p>
                <strong>4. Adversarial perturbation:</strong> Tìm các token
                perturbation nhỏ nhất giữ nguyên nghĩa nhưng lật nhiều token từ
                green sang red. Yêu cầu truy cập chi tiết đến watermark
                algorithm.
              </p>
              <p>
                <strong>5. Editing attack:</strong> Chỉnh sửa thủ công, thêm
                câu, xoá câu. Nếu đủ nhiều, z-score giảm đáng kể.
              </p>
              <p>
                Đây là cuộc chạy đua giữa watermark và paraphrase — mỗi bước
                tiến của bên này kéo theo bước tiến của bên kia. Giải pháp lâu
                dài là <em>semantic watermark</em> (nhúng vào embedding
                space) và content provenance (C2PA chuẩn).
              </p>
            </div>
          </CollapsibleDetail>

          <CodeBlock language="python" title="watermark_detect.py">
{`"""
Phát hiện watermark Kirchenbauer bằng z-score.
Yêu cầu: tokenizer của mô hình gốc, gamma đã biết.
"""
import hashlib
import numpy as np
from typing import List, Dict

def _green_list_for_context(
    prev_token_id: int,
    vocab_size: int,
    gamma: float = 0.5,
    secret_key: bytes = b"vi-edu-demo-key",
) -> set[int]:
    """Sinh green list từ hash(khoá + prev_token).
    Trả về tập các token id thuộc green list.
    """
    payload = secret_key + prev_token_id.to_bytes(8, "little")
    seed_bytes = hashlib.sha256(payload).digest()[:8]
    seed = int.from_bytes(seed_bytes, "little")
    rng = np.random.default_rng(seed)

    green_size = int(vocab_size * gamma)
    green_ids = rng.choice(vocab_size, size=green_size, replace=False)
    return set(int(x) for x in green_ids)


def detect_watermark(
    token_ids: List[int],
    vocab_size: int,
    gamma: float = 0.5,
    secret_key: bytes = b"vi-edu-demo-key",
    z_threshold: float = 4.0,
) -> Dict[str, float | bool | str]:
    """Phát hiện watermark trong một chuỗi token."""
    if len(token_ids) < 2:
        raise ValueError("Cần ít nhất 2 token để phát hiện watermark.")

    green_count = 0
    total = len(token_ids) - 1  # Bỏ token đầu (không có prev)

    for i in range(1, len(token_ids)):
        prev = token_ids[i - 1]
        green_list = _green_list_for_context(
            prev, vocab_size, gamma, secret_key,
        )
        if token_ids[i] in green_list:
            green_count += 1

    # z-score test
    expected = total * gamma
    variance = total * gamma * (1 - gamma)
    z = (green_count - expected) / np.sqrt(variance)

    # p-value xấp xỉ (1-tail)
    from scipy.stats import norm
    p_value = 1.0 - norm.cdf(z)

    confidence = (
        "cao" if z > 6.0
        else "vừa" if z > z_threshold
        else "thấp"
    )

    return {
        "z_score": float(z),
        "p_value": float(p_value),
        "green_ratio": green_count / total,
        "is_ai": bool(z > z_threshold),
        "confidence": confidence,
        "total_tokens": total,
    }


# ─────────────────────────────────────────────────────────
# Ví dụ sử dụng với tokenizer thực tế
# ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    from transformers import AutoTokenizer

    tok = AutoTokenizer.from_pretrained("vinai/PhoGPT-7B5")
    text = open("suspicious_essay.txt", encoding="utf-8").read()
    ids = tok.encode(text)

    result = detect_watermark(
        token_ids=ids,
        vocab_size=tok.vocab_size,
        gamma=0.5,
    )

    print(f"Tổng tokens:     {result['total_tokens']}")
    print(f"Tỷ lệ green:     {result['green_ratio']:.3f}")
    print(f"z-score:         {result['z_score']:.2f}")
    print(f"p-value:         {result['p_value']:.2e}")
    print(f"Phán đoán:       {'AI' if result['is_ai'] else 'Người/mơ hồ'}")
    print(f"Độ tin cậy:      {result['confidence']}")`}
          </CodeBlock>

          <CodeBlock language="python" title="watermark_generate.py">
{`"""
Sinh văn bản có watermark bằng logit processor.
Tương thích với Hugging Face Transformers.
"""
import torch
from transformers import LogitsProcessor


class WatermarkLogitsProcessor(LogitsProcessor):
    """Cộng delta vào logits của green tokens trước softmax.

    Triển khai theo Kirchenbauer et al., 2023.
    """

    def __init__(
        self,
        vocab_size: int,
        gamma: float = 0.5,
        delta: float = 2.0,
        secret_key: bytes = b"vi-edu-demo-key",
    ):
        self.vocab_size = vocab_size
        self.gamma = gamma
        self.delta = delta
        self.secret_key = secret_key
        self._cache: dict[int, torch.Tensor] = {}

    def _green_mask(self, prev_token: int, device: torch.device) -> torch.Tensor:
        """Trả về mask nhị phân (vocab_size,) — 1 cho green, 0 cho red."""
        if prev_token in self._cache:
            return self._cache[prev_token].to(device)

        import hashlib, numpy as np
        payload = self.secret_key + int(prev_token).to_bytes(8, "little")
        seed = int.from_bytes(
            hashlib.sha256(payload).digest()[:8], "little",
        )
        rng = np.random.default_rng(seed)
        size = int(self.vocab_size * self.gamma)
        green = rng.choice(self.vocab_size, size=size, replace=False)

        mask = torch.zeros(self.vocab_size)
        mask[green] = 1.0
        self._cache[prev_token] = mask
        return mask.to(device)

    def __call__(
        self,
        input_ids: torch.LongTensor,
        scores: torch.FloatTensor,
    ) -> torch.FloatTensor:
        # input_ids: (batch, seq_len) — seq_len có thể khác nhau giữa batch
        # scores: (batch, vocab_size) — logits cho token tiếp theo
        for i in range(input_ids.shape[0]):
            prev = int(input_ids[i, -1].item())
            mask = self._green_mask(prev, scores.device)
            scores[i] = scores[i] + self.delta * mask
        return scores


# ─────────────────────────────────────────────────────────
# Ví dụ: watermark hoá PhoGPT tiếng Việt
# ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    from transformers import AutoModelForCausalLM, AutoTokenizer

    name = "vinai/PhoGPT-7B5-Instruct"
    tok = AutoTokenizer.from_pretrained(name)
    model = AutoModelForCausalLM.from_pretrained(name, torch_dtype=torch.float16)

    processor = WatermarkLogitsProcessor(
        vocab_size=tok.vocab_size, gamma=0.5, delta=2.0,
    )

    inputs = tok("Giới thiệu về vịnh Hạ Long:", return_tensors="pt")
    out = model.generate(
        **inputs,
        max_new_tokens=200,
        logits_processor=[processor],
        do_sample=True,
        top_p=0.9,
    )
    print(tok.decode(out[0], skip_special_tokens=True))`}
          </CodeBlock>

          <Callout variant="tip" title="Lưu ý triển khai thực tế">
            <div className="space-y-1">
              <p>
                <strong>Khoá bí mật:</strong> Bảo vệ <code>secret_key</code> như
                API key. Rò rỉ khoá = kẻ tấn công có thể giả mạo watermark hoặc
                xoá chính xác.
              </p>
              <p>
                <strong>Phiên bản tokenizer:</strong> Phát hiện cần đúng
                tokenizer của mô hình phát hành. Fine-tune đổi tokenizer → phá
                watermark.
              </p>
              <p>
                <strong>Multi-language:</strong> Với văn bản song ngữ (Việt +
                Anh trộn lẫn), cần green list chung hoặc phát hiện theo từng
                đoạn ngôn ngữ.
              </p>
            </div>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* STEP 6 — Ứng dụng                                                */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Ứng dụng">
        <Callout variant="tip" title="Watermark trong thực tế tại Việt Nam">
          <div className="space-y-2">
            <p>
              <strong>Giáo dục đại học:</strong> Phát hiện bài luận do
              AI viết. Đại học quốc gia TP.HCM đã thử nghiệm hệ thống tương tự
              Turnitin Originality, nhưng hiệu quả với tiếng Việt còn hạn chế
              do tokenizer và corpus training.
            </p>
            <p>
              <strong>Báo chí & tin tức:</strong> Ghi nhãn bài viết do AI tạo
              trên các tờ báo điện tử để chống tin giả. Các nền tảng như VNExpress,
              Zing cần pipeline kiểm duyệt nội dung tự động trước khi
              xuất bản.
            </p>
            <p>
              <strong>Pháp luật & chính sách:</strong> EU AI Act (điều 50) yêu
              cầu ghi nhãn "nội dung sinh bởi AI". Nghị định 53/2022/NĐ-CP về
              an ninh mạng của Việt Nam đang được cập nhật để bao gồm nội dung
              tổng hợp — watermark là giải pháp kỹ thuật khả thi.
            </p>
            <p>
              <strong>Mạng xã hội:</strong> Facebook, TikTok đang thí điểm gắn
              nhãn "AI-generated". Google SynthID cung cấp watermark cho ảnh,
              văn bản, audio do Google AI (Gemini, Imagen) tạo ra.
            </p>
            <p>
              <strong>Pháp y số (digital forensics):</strong> Cơ quan điều tra
              có thể dùng watermark làm bằng chứng truy nguyên nguồn gốc nội
              dung giả mạo, lừa đảo.
            </p>
          </div>
        </Callout>
      </LessonSection>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* STEP 7 — Tóm tắt                                                 */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về AI Watermarking"
          points={[
            "Watermark văn bản chia từ vựng thành green/red list sinh từ hash(token trước), cộng bias delta vào logits green khi sinh. Văn bản có watermark có tỷ lệ green cao bất thường.",
            "Phát hiện bằng z-score one-proportion test: z = (|g| - γT) / √(γ(1-γ)T). z > 4 ⇔ p < 3×10⁻⁵ — gần như chắc chắn có watermark.",
            "Paraphrase là tấn công hiệu quả nhất: viết lại 30-40% câu có thể giảm z-score đáng kể. Giải pháp lâu dài là semantic watermark và content provenance (C2PA).",
            "Tiếng Việt bị BPE fragment → effective vocab nhỏ → cần đoạn dài hơn (200-300 tokens) và chịu watermark yếu hơn tương đối so với tiếng Anh.",
            "Watermark cryptographic (SynthID-Text, Aaronson) dùng PRF với khoá bí mật, cho phép distortion-free và chống tấn công mạnh hơn, nhưng cần quản lý khoá.",
            "Ứng dụng: phát hiện bài AI trong giáo dục, ghi nhãn tin tức chống tin giả, tuân thủ EU AI Act và khung pháp lý nội dung số của Việt Nam.",
          ]}
        />
      </LessonSection>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* STEP 8 — Quiz                                                    */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
