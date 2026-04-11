"use client";

import { useState, useMemo, useCallback } from "react";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, LaTeX, TabView,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "tokenization",
  title: "Tokenization",
  titleVi: "Tokenization - Tách từ",
  description:
    "Quá trình chia văn bản thành các đơn vị nhỏ hơn (token) để máy tính có thể xử lý ngôn ngữ tự nhiên.",
  category: "nlp",
  tags: ["nlp", "preprocessing", "text"],
  difficulty: "beginner",
  relatedSlugs: ["bag-of-words", "word-embeddings", "bert"],
  vizType: "interactive",
};

/* ── Constants ── */
const TOTAL_STEPS = 8;

const COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#6366f1",
];

const SUBWORD_DEMO: Record<string, { tokens: string[]; method: string }> = {
  "Tôi yêu Việt Nam": {
    tokens: ["T", "ôi", " yêu", " Việt", " Nam"],
    method: "BPE (GPT)",
  },
  "Tokenization rất thú vị": {
    tokens: ["Token", "ization", " rất", " thú", " vị"],
    method: "BPE (GPT)",
  },
  "Xin chào Việt Nam": {
    tokens: ["Xin", " chào", " Việt", " Nam"],
    method: "BPE (GPT)",
  },
};

const QUIZ: QuizQuestion[] = [
  {
    question: "Tại sao tokenization theo từ phụ (subword) lại phổ biến hơn tách theo từ nguyên vẹn?",
    options: [
      "Vì subword nhanh hơn",
      "Vì subword xử lý được từ mới (OOV) bằng cách chia thành mảnh nhỏ hơn",
      "Vì subword dùng ít bộ nhớ hơn",
      "Vì subword chỉ dùng cho tiếng Anh",
    ],
    correct: 1,
    explanation:
      "Subword tokenization (BPE, WordPiece) chia từ chưa gặp thành các mảnh nhỏ đã biết, giải quyết vấn đề OOV mà tách theo từ nguyên vẹn không làm được.",
  },
  {
    question: "Câu 'Tôi yêu Việt Nam' khi tách theo từ (word-level) có bao nhiêu token?",
    options: ["3", "4", "5", "6"],
    correct: 1,
    explanation:
      "Tách theo khoảng trắng: 'Tôi', 'yêu', 'Việt', 'Nam' = 4 token. Lưu ý 'Việt Nam' là 2 từ khi tách theo khoảng trắng.",
  },
  {
    question: "Mô hình nào sử dụng WordPiece tokenizer?",
    options: ["GPT", "BERT", "LLaMA", "T5"],
    correct: 1,
    explanation:
      "BERT dùng WordPiece (đánh dấu sub-token bằng ##). GPT và LLaMA dùng BPE. T5 dùng SentencePiece.",
  },
];

/* ── Main Component ── */
export default function TokenizationTopic() {
  const [text, setText] = useState("Tôi yêu Việt Nam");
  const [mode, setMode] = useState<"word" | "char" | "subword">("word");

  const tokens = useMemo(() => {
    if (mode === "word") {
      return text.split(/\s+/).filter((t) => t.length > 0);
    }
    if (mode === "char") {
      return text.split("").filter((t) => t !== " ");
    }
    // subword demo
    const entry = SUBWORD_DEMO[text];
    if (entry) return entry.tokens;
    // fallback: simulate BPE-like splitting
    const words = text.split(/\s+/).filter((t) => t.length > 0);
    const result: string[] = [];
    words.forEach((w, i) => {
      if (w.length > 4) {
        result.push((i === 0 ? "" : " ") + w.slice(0, 3));
        result.push(w.slice(3));
      } else {
        result.push((i === 0 ? "" : " ") + w);
      }
    });
    return result;
  }, [text, mode]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  }, []);

  return (
    <>
      {/* ── Step 1: PredictionGate ── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Thử thách">
        <PredictionGate
          question="Câu 'Tôi yêu Việt Nam' có bao nhiêu 'mảnh' khi máy tính cắt theo khoảng trắng?"
          options={["3 mảnh", "4 mảnh", "5 mảnh"]}
          correct={1}
          explanation={`Đúng rồi! Máy tính cắt theo khoảng trắng: "Tôi" | "yêu" | "Việt" | "Nam" = 4 mảnh. Mỗi mảnh gọi là một TOKEN. Nhưng "Việt Nam" là một khái niệm mà bị tách thành 2 token — đây chính là thách thức của tokenization!`}
        />
      </LessonSection>

      {/* ── Step 2: Bridge + Interactive Viz ── */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Bạn vừa thấy cách cắt đơn giản nhất. Nhưng có nhiều cách cắt khác nhau — mỗi cách cho kết quả khác nhau đáng ngạc nhiên. Hãy thử cả ba cách bên dưới!
        </p>

        <VisualizationSection>
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted">
                Nhập câu tiếng Việt để tách token
              </label>
              <input
                type="text"
                value={text}
                onChange={handleTextChange}
                className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
                placeholder="Ví dụ: Tôi yêu Việt Nam"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              {([
                { key: "word" as const, label: "Theo từ" },
                { key: "char" as const, label: "Theo ký tự" },
                { key: "subword" as const, label: "Theo từ phụ (BPE)" },
              ]).map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMode(m.key)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    mode === m.key
                      ? "bg-accent text-white"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Token display */}
            <div className="flex flex-wrap gap-2 min-h-[48px]">
              {tokens.map((token, i) => (
                <span
                  key={`${token}-${i}`}
                  className="rounded-md px-3 py-1.5 text-sm font-semibold text-white"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                >
                  {token.replace(/ /g, "\u2423")}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div className="flex gap-4 justify-center">
              <div className="rounded-lg bg-background/50 border border-border px-4 py-2 text-center">
                <p className="text-xs text-muted">Số token</p>
                <p className="text-lg font-bold text-accent">{tokens.length}</p>
              </div>
              <div className="rounded-lg bg-background/50 border border-border px-4 py-2 text-center">
                <p className="text-xs text-muted">Phương pháp</p>
                <p className="text-lg font-bold text-foreground">
                  {mode === "word" ? "Word" : mode === "char" ? "Character" : "Subword"}
                </p>
              </div>
            </div>

            {/* Visual comparison */}
            <div className="rounded-lg bg-background/50 border border-border p-4">
              <p className="text-sm text-muted text-center">
                {mode === "word" && "Tách theo khoảng trắng. Đơn giản nhưng không xử lý được từ mới (OOV)."}
                {mode === "char" && "Mỗi ký tự = 1 token. Không bao giờ gặp OOV, nhưng chuỗi quá dài và mất ngữ nghĩa."}
                {mode === "subword" && "BPE giữ từ phổ biến nguyên vẹn, chia từ hiếm thành mảnh nhỏ. Cách mà GPT và BERT dùng!"}
              </p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ── Step 3: AhaMoment ── */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          <p>
            <strong>Tokenization</strong>{" "}
            là bước chia văn bản thành các mảnh nhỏ (token) để máy tính xử lý được. Không có cách tách nào hoàn hảo — mỗi cách là một sự đánh đổi giữa kích thước từ vựng và độ dài chuỗi!
          </p>
          <p className="text-sm text-muted mt-1">
            Giống như cắt phở: cắt sợi to thì nhanh nhưng khó ăn, cắt sợi nhỏ thì nhiều mảnh hơn nhưng vừa miệng hơn.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ── Step 4: InlineChallenge ── */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <InlineChallenge
          question="Từ 'Tokenization' chưa có trong từ vựng. Phương pháp nào xử lý được mà KHÔNG cần thêm từ mới?"
          options={[
            "Tách theo từ (word-level)",
            "Tách theo từ phụ (subword) — chia thành 'Token' + 'ization'",
            "Bỏ qua từ đó",
          ]}
          correct={1}
          explanation="Subword tokenization chia từ chưa gặp thành các mảnh đã biết: 'Token' + 'ization'. Đây là lý do GPT, BERT đều dùng subword!"
        />
      </LessonSection>

      {/* ── Step 5: Explanation with LaTeX ── */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Tokenization</strong>{" "}
            là bước đầu tiên và quan trọng nhất trong xử lý ngôn ngữ tự nhiên (NLP). Nó chuyển văn bản thô thành chuỗi các đơn vị rời rạc mà mô hình có thể hiểu được.
          </p>

          <Callout variant="insight" title="Ba phương pháp tokenization">
            <div className="space-y-3">
              <p>
                <strong>1. Word-level (theo từ):</strong>{" "}
                Chia theo khoảng trắng/dấu câu. Từ vựng lớn, gặp vấn đề OOV (out-of-vocabulary) với từ mới.
              </p>
              <p>
                <strong>2. Character-level (theo ký tự):</strong>{" "}
                Mỗi ký tự là 1 token. Từ vựng nhỏ (~100), nhưng chuỗi rất dài, mô hình khó học ngữ nghĩa.
              </p>
              <p>
                <strong>3. Subword (theo từ phụ):</strong>{" "}
                Kết hợp ưu điểm cả hai. Từ vựng vừa phải (~30K-50K), xử lý được OOV. Đây là chuẩn hiện đại.
              </p>
            </div>
          </Callout>

          <Callout variant="info" title="Thuật toán BPE (Byte Pair Encoding)">
            <p>
              BPE bắt đầu từ các ký tự đơn, rồi lặp lại ghép cặp xuất hiện nhiều nhất. Ví dụ: nếu {'"e"'} và {'"s"'} thường đi cùng nhau, BPE sẽ tạo token {'"es"'}.
            </p>
            <div className="mt-2">
              <LaTeX display>{`V^{(0)} = \\{\\text{tất cả ký tự}\\}`}</LaTeX>
              <LaTeX display>{`V^{(t+1)} = V^{(t)} \\cup \\{\\text{cặp xuất hiện nhiều nhất}\\}`}</LaTeX>
            </div>
            <p className="mt-2 text-sm">
              Lặp cho đến khi đạt kích thước từ vựng mong muốn (GPT-4 dùng ~100K token).
            </p>
          </Callout>

          <CodeBlock language="python" title="tokenization_demo.py">
{`from transformers import AutoTokenizer

# Thử tokenize tiếng Việt với GPT-2 tokenizer (BPE)
tokenizer = AutoTokenizer.from_pretrained("gpt2")
text = "Tôi yêu Việt Nam"
tokens = tokenizer.tokenize(text)
print(f"Tokens: {tokens}")
# Tokens: ['T', 'ôi', ' yêu', ' Việt', ' Nam']

ids = tokenizer.encode(text)
print(f"Token IDs: {ids}")
# Token IDs: [51, 12762, 331, 49, 7402]

# Mỗi token được gán một số ID duy nhất
# Mô hình chỉ nhìn thấy chuỗi số, không phải chữ!`}
          </CodeBlock>

          <Callout variant="tip" title="Tokenization cho tiếng Việt">
            <p>
              Tiếng Việt là ngôn ngữ đơn lập (isolating language) — ranh giới từ phức tạp hơn tiếng Anh. Ví dụ {'"Việt Nam"'} là 1 từ nhưng 2 token khi tách theo khoảng trắng. Các công cụ như{" "}
              <strong>VnCoreNLP</strong>{" "}
              và <strong>RDRSegmenter</strong>{" "}
              giúp tách từ tiếng Việt chính xác hơn.
            </p>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ── Step 6: Deeper comparison ── */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="So sánh chi tiết">
        <TabView tabs={[
          {
            label: "Word-level",
            content: (
              <div className="space-y-3 p-3">
                <p className="text-sm text-foreground">
                  <strong>Ưu điểm:</strong>{" "}
                  Đơn giản, trực quan, giữ nguyên nghĩa từng từ.
                </p>
                <p className="text-sm text-foreground">
                  <strong>Nhược điểm:</strong>{" "}
                  Từ vựng rất lớn (hàng trăm nghìn), không xử lý được từ mới, lỗi chính tả.
                </p>
                <p className="text-sm text-muted">
                  Ví dụ: {'"Tôi" "yêu" "Việt" "Nam"'} = 4 token. Nếu gặp {'"Tokenization"'} lần đầu → không biết xử lý!
                </p>
              </div>
            ),
          },
          {
            label: "Char-level",
            content: (
              <div className="space-y-3 p-3">
                <p className="text-sm text-foreground">
                  <strong>Ưu điểm:</strong>{" "}
                  Từ vựng rất nhỏ (~100 ký tự), không bao giờ gặp OOV.
                </p>
                <p className="text-sm text-foreground">
                  <strong>Nhược điểm:</strong>{" "}
                  Chuỗi quá dài (1 từ = nhiều token), mô hình khó học mối quan hệ giữa các từ.
                </p>
                <p className="text-sm text-muted">
                  Ví dụ: {'"T" "ô" "i" "y" "ê" "u" ...'} = 14 token cho cùng câu. Gấp 3.5 lần!
                </p>
              </div>
            ),
          },
          {
            label: "Subword (BPE)",
            content: (
              <div className="space-y-3 p-3">
                <p className="text-sm text-foreground">
                  <strong>Ưu điểm:</strong>{" "}
                  Từ vựng vừa phải, xử lý OOV bằng cách chia nhỏ, giữ từ phổ biến nguyên vẹn.
                </p>
                <p className="text-sm text-foreground">
                  <strong>Nhược điểm:</strong>{" "}
                  Cần huấn luyện tokenizer trên dữ liệu lớn, ranh giới token không phải lúc nào cũng trực quan.
                </p>
                <p className="text-sm text-muted">
                  Ví dụ: {'"T" "ôi" " yêu" " Việt" " Nam"'} = 5 token. Từ phổ biến được giữ, từ hiếm bị chia nhỏ.
                </p>
              </div>
            ),
          },
        ]} />
      </LessonSection>

      {/* ── Step 7: MiniSummary ── */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về Tokenization"
          points={[
            "Tokenization là bước ĐẦU TIÊN trong NLP — chia văn bản thành token để máy tính xử lý.",
            "Word-level: đơn giản nhưng từ vựng lớn, không xử lý được từ mới (OOV).",
            "Character-level: từ vựng nhỏ, không OOV, nhưng chuỗi quá dài và mất ngữ nghĩa.",
            "Subword (BPE/WordPiece): chuẩn hiện đại — GPT dùng BPE, BERT dùng WordPiece.",
            "Tiếng Việt cần tách từ đặc biệt vì ranh giới từ phức tạp (VD: 'Việt Nam' = 1 từ, 2 token).",
          ]}
        />
      </LessonSection>

      {/* ── Step 8: Quiz ── */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
