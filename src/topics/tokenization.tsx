"use client";

import { useState, useMemo, useCallback } from "react";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, CollapsibleDetail, LaTeX, TabView, TopicLink,
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
const TOTAL_STEPS = 9;

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
  {
    type: "fill-blank",
    question:
      "Thuật toán tokenization phổ biến nhất hiện nay là {blank} (ghép cặp xuất hiện nhiều nhất). Nó thuộc họ {blank} (chia thành mảnh nhỏ hơn cả từ), giúp xử lý từ chưa có trong {blank}.",
    blanks: [
      { answer: "BPE", accept: ["bpe", "Byte Pair Encoding", "byte pair encoding"] },
      { answer: "subword", accept: ["từ phụ", "Subword"] },
      { answer: "vocabulary", accept: ["từ vựng", "vocab"] },
    ],
    explanation:
      "BPE (Byte Pair Encoding) là thuật toán subword tokenization — chia từ lạ thành các mảnh đã có trong vocabulary, giải quyết vấn đề OOV.",
  },
  {
    question: "Bạn gọi OpenAI API với prompt 2.000 ký tự tiếng Việt. Hoá đơn tính theo TOKEN, không phải ký tự. Điều gì có thể xảy ra?",
    options: [
      "2.000 ký tự = 2.000 token, hoá đơn cố định",
      "Tiếng Việt thường tốn NHIỀU token hơn tiếng Anh vì BPE của GPT được train chủ yếu trên tiếng Anh — một từ tiếng Việt có thể tách thành 2-4 token",
      "Tiếng Việt tốn ÍT token hơn vì ngắn",
      "API không hoạt động với tiếng Việt",
    ],
    correct: 1,
    explanation:
      "BPE của GPT-4 được train trên corpus tiếng Anh là chính. Các dấu tiếng Việt (ê, ô, ư...) thường không nằm trong vocabulary, nên 'Tôi' có thể bị tách thành 'T' + 'ôi'. Kết quả: prompt tiếng Việt tốn gấp 1.5-3× token so với tiếng Anh cùng nghĩa → hoá đơn cao hơn và phí token input/output tăng theo.",
  },
  {
    question: "Tokenizer của BERT (WordPiece) dùng ký hiệu đặc biệt nào để đánh dấu các sub-token tiếp theo?",
    options: [
      "Dấu gạch dưới _",
      "Hai dấu thăng ##",
      "Dấu slash /",
      "Không có ký hiệu đặc biệt",
    ],
    correct: 1,
    explanation:
      "WordPiece dùng tiền tố '##' để đánh dấu sub-token không mở đầu từ. Ví dụ: 'tokenization' → ['token', '##ization']. GPT BPE thì dùng ký tự 'Ġ' (space) để đánh dấu token mở đầu từ mới thay vì dùng ##.",
  },
  {
    question: "Câu 'I love cats' tách theo BPE (GPT-2) cho 3 token. Câu 'Tôi yêu mèo' tách cho 5 token. Điều này đúng với tính chất nào của tokenizer?",
    options: [
      "Tokenizer luôn cho cùng số token cho câu cùng nghĩa",
      "Tokenizer thiên vị ngôn ngữ huấn luyện — tiếng Anh nén tốt hơn, ngôn ngữ khác cần nhiều token hơn để biểu diễn cùng một ý",
      "Tiếng Việt luôn dùng ít token hơn tiếng Anh",
      "BPE không áp dụng được cho tiếng Việt",
    ],
    correct: 1,
    explanation:
      "Đây là 'tokenizer bias' — mô hình GPT-2 được train chủ yếu trên tiếng Anh, nên BPE học được rằng 'love' = 1 token, 'cats' = 1 token. Nhưng các dấu phụ tiếng Việt xuất hiện ít, nên 'yêu' và 'mèo' bị tách thành nhiều mảnh nhỏ.",
  },
  {
    type: "fill-blank",
    question:
      "BERT dùng hai token đặc biệt ở vị trí đầu và giữa/cuối câu: {blank} (đầu câu, dùng cho phân loại) và {blank} (phân tách hai câu trong cặp câu).",
    blanks: [
      { answer: "[CLS]", accept: ["CLS", "cls", "[cls]"] },
      { answer: "[SEP]", accept: ["SEP", "sep", "[sep]"] },
    ],
    explanation:
      "[CLS] (classification) nằm ở vị trí 0 — vector output tại [CLS] thường được dùng làm representation của cả câu, truyền vào classifier. [SEP] (separator) dùng để phân tách cặp câu trong task như NLI, QA. Các token này cần được thêm vào vào chuỗi đầu vào trước khi đưa vào BERT.",
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

        <div className="mt-6 space-y-3 text-sm leading-relaxed">
          <p>
            <strong>Liên tưởng 1 — Cắt bánh chưng mời khách:</strong>{" "}
            Bạn có thể cắt một chiếc bánh chưng thành miếng to (4 miếng cho cả
            nhà), miếng nhỏ (16 miếng cho khách đến chúc Tết), hoặc xắt vụn để
            chấm muối vừng. Mỗi cách cắt phục vụ mục đích khác nhau.
            Tokenization cũng vậy: word-level (miếng to), subword (miếng vừa),
            character-level (xắt vụn) — không có cách &quot;đúng&quot; tuyệt
            đối, chỉ có lựa chọn phù hợp với ứng dụng.
          </p>
          <p>
            <strong>Liên tưởng 2 — Người đọc báo đọc nhanh:</strong>{" "}
            Khi đọc báo tiếng Việt, bạn không đánh vần từng chữ cái. Não bạn
            tự động nhóm các ký tự thành từ (&quot;phở&quot;, &quot;bún
            chả&quot;). LLM cũng cần bước nhóm này — nếu nhìn từng ký tự,
            chuỗi quá dài và &quot;ngữ nghĩa&quot; bị loãng. Tokenization là
            bước &quot;nhóm mắt&quot; của máy tính.
          </p>
          <p>
            <strong>Liên tưởng 3 — Tiếng Việt ghép từ
            (&quot;Việt Nam&quot;, &quot;máy tính&quot;):</strong>{" "}
            Trong tiếng Việt, một &quot;từ&quot; thực sự có thể gồm nhiều
            &quot;tiếng&quot; (từ ghép). Máy tính không biết &quot;Hà Nội&quot;
            là 1 khái niệm hay 2 — bài toán tách từ tiếng Việt riêng đã có hẳn
            công cụ như VnCoreNLP, RDRSegmenter. Điều này khiến tokenization
            tiếng Việt khó hơn tiếng Anh đáng kể.
          </p>
          <p>
            <strong>Liên tưởng 4 — Chi phí API tính theo token:</strong>{" "}
            Khi bạn trả tiền OpenAI cho mỗi request, bill tính bằng token —
            không phải ký tự, không phải từ. Một tin nhắn 500 ký tự tiếng
            Việt có thể là 300-700 token tuỳ tokenizer. Hiểu tokenization là
            hiểu cách tối ưu chi phí LLM của bạn.
          </p>
        </div>
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

        <div className="mt-6">
          <InlineChallenge
            question={`Khi bạn gọi LLM qua API với max_tokens=500, giới hạn 500 áp dụng cho gì?`}
            options={[
              "Số ký tự của phản hồi",
              "Số TOKEN của phản hồi — với tiếng Việt (tokenizer tiếng Anh), 500 token ≈ 200-300 từ, KHÔNG phải 500 từ",
              "Số từ tiếng Anh",
              "Số byte trong UTF-8",
            ]}
            correct={1}
            explanation="Giới hạn luôn tính bằng token — đơn vị mà mô hình xử lý nội bộ. Với tokenizer thiên về tiếng Anh, 500 token = ~375 từ tiếng Anh hoặc ~200-300 từ tiếng Việt. Nếu bạn đặt max_tokens=500 rồi ngạc nhiên vì phản hồi ngắn — hãy ước lượng theo token, không phải từ."
          />
        </div>

        <div className="mt-6">
          <InlineChallenge
            question="Team của bạn fine-tune một Transformer trên corpus tiếng Việt 100GB. Sau đó nhảy thẳng sang dùng tokenizer của LLaMA (train trên tiếng Anh). Điều gì có khả năng xảy ra?"
            options={[
              "Model hoạt động tốt — tokenizer không quan trọng",
              "Model hỏng — embedding của token không khớp, tiếng Việt bị chẻ vụn tăng ~2-3× số token, context window bị tiêu phí",
              "Model nhanh hơn",
              "Tokenizer tự động train lại",
            ]}
            correct={1}
            explanation="Tokenizer là một phần KHÔNG tách rời của model. Token ID 1234 trong tokenizer A không cùng nghĩa với token ID 1234 trong tokenizer B. Đổi tokenizer = đổi mô hình. Với tiếng Việt, lựa chọn tối ưu: (1) tokenizer PhoBERT/ViT5 có sẵn, hoặc (2) train BPE riêng trên corpus tiếng Việt của bạn."
          />
        </div>
      </LessonSection>

      {/* ── Step 5: Explanation with LaTeX ── */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Tokenization</strong>{" "}
            là bước đầu tiên và quan trọng nhất trong xử lý ngôn ngữ tự nhiên (NLP). Nó chuyển văn bản thô thành chuỗi các đơn vị rời rạc mà mô hình có thể hiểu được. Các mô hình hiện đại như{" "}
            <TopicLink slug="gpt">GPT</TopicLink>
            {" "}(dùng BPE) và{" "}
            <TopicLink slug="bert">BERT</TopicLink>
            {" "}(dùng WordPiece) phụ thuộc hoàn toàn vào bước này. Xem thêm{" "}
            <TopicLink slug="tokenizer-comparison">so sánh tokenizer</TopicLink>
            {" "}để hiểu sự khác biệt giữa các thuật toán.
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
              <LaTeX block>{`V^{(0)} = \\{\\text{tất cả ký tự}\\}`}</LaTeX>
              <LaTeX block>{`V^{(t+1)} = V^{(t)} \\cup \\{\\text{cặp xuất hiện nhiều nhất}\\}`}</LaTeX>
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

          <CodeBlock language="python" title="So sánh tokenizer: GPT-4 BPE vs BERT WordPiece">
{`from transformers import AutoTokenizer

text = "Tokenization là nền tảng của NLP hiện đại."

# GPT-2 / GPT-4 — dùng BPE
gpt = AutoTokenizer.from_pretrained("gpt2")
print("GPT BPE:", gpt.tokenize(text))
# ['Token', 'ization', 'Ġl', 'à', 'Ġn', 'á»\\x81n', 'Ġt', 'á»\\x91ng', ...]
# Ký tự Ġ = space mở đầu token

# BERT multilingual — dùng WordPiece
bert = AutoTokenizer.from_pretrained("bert-base-multilingual-cased")
print("BERT WP:", bert.tokenize(text))
# ['Token', '##ization', 'là', 'nền', 'tảng', 'của', ...]
# Ký hiệu ## = sub-token tiếp theo

# PhoBERT — BPE tinh chỉnh cho tiếng Việt
from pyvi import ViTokenizer
segmented = ViTokenizer.tokenize(text)  # Nối từ ghép trước
pho = AutoTokenizer.from_pretrained("vinai/phobert-base", use_fast=False)
print("PhoBERT:", pho.tokenize(segmented))
# Ít token hơn đáng kể vì tokenizer train riêng cho tiếng Việt

# Đếm token — thường dùng để ước lượng chi phí API
print(f"GPT tokens:    {len(gpt.tokenize(text))}")
print(f"BERT tokens:   {len(bert.tokenize(text))}")
print(f"PhoBERT tokens:{len(pho.tokenize(segmented))}")`}
          </CodeBlock>

          <CollapsibleDetail title="Thuật toán BPE — huấn luyện từng bước (nâng cao)">
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                BPE (Sennrich et al., 2016) là thuật toán tham lam (greedy):
              </p>
              <ol className="list-decimal list-inside space-y-1 pl-2">
                <li>
                  Khởi tạo vocabulary = tất cả ký tự trong corpus.
                </li>
                <li>
                  Đếm tất cả cặp token liền kề xuất hiện trong corpus.
                </li>
                <li>
                  Tìm cặp xuất hiện NHIỀU NHẤT. Ghép lại thành 1 token mới,
                  thêm vào vocabulary.
                </li>
                <li>
                  Lặp bước 2-3 cho đến khi đạt kích thước vocabulary mong
                  muốn (thường 32.000 - 100.000).
                </li>
              </ol>
              <p>
                <strong>Ví dụ:</strong> corpus có &quot;lower lower lowest
                lowest lowest&quot;. Cặp (&quot;l&quot;, &quot;o&quot;) xuất hiện 5 lần → ghép
                thành &quot;lo&quot;. Cặp (&quot;lo&quot;, &quot;w&quot;) xuất hiện 5 lần → ghép thành
                &quot;low&quot;. Cặp (&quot;est&quot;) tần suất cao → tạo &quot;est&quot;. Kết quả:
                &quot;lowest&quot; được tách thành [&quot;low&quot;, &quot;est&quot;].
              </p>
              <p>
                <strong>WordPiece</strong> (dùng trong BERT) khác ở cách
                chọn cặp: thay vì tần suất thô, tối đa hoá likelihood của
                ngôn ngữ. Công thức chọn cặp:
              </p>
              <LaTeX block>{`\\text{score}(x, y) = \\frac{f(xy)}{f(x) \\cdot f(y)}`}</LaTeX>
              <p>
                Điều này tránh ghép các token phổ biến riêng lẻ (như &quot;the&quot;)
                với các token khác chỉ vì chúng xuất hiện cùng nhau nhiều.
              </p>
              <p>
                <strong>SentencePiece</strong> (dùng trong T5, LLaMA) khác
                ở chỗ không cần pre-tokenization — coi cả văn bản là chuỗi
                Unicode, kể cả dấu cách. Phù hợp cho ngôn ngữ không dùng
                khoảng trắng (tiếng Nhật, tiếng Trung).
              </p>
            </div>
          </CollapsibleDetail>

          <Callout variant="warning" title="Cạm bẫy: tokenizer khác mô hình">
            Mỗi mô hình có tokenizer RIÊNG. Nếu bạn dùng GPT-2 tokenizer
            với PhoBERT model (hoặc ngược lại), các token IDs sẽ không
            khớp và mô hình sẽ sinh ra rác. Luôn dùng{" "}
            <code>AutoTokenizer.from_pretrained(MODEL_NAME)</code> cùng
            checkpoint với model để đảm bảo đồng bộ. Khi fine-tune, nhớ
            lưu cả tokenizer cùng model.
          </Callout>

          <CollapsibleDetail title="So sánh BPE vs WordPiece vs SentencePiece vs Unigram (nâng cao)">
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                Bốn thuật toán subword tokenization phổ biến, sắp xếp theo cách
                xây dựng vocabulary:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>
                  <strong>BPE (Byte Pair Encoding)</strong> — bottom-up greedy.
                  Bắt đầu từ ký tự, ghép cặp tần suất cao nhất. Đơn giản, được
                  GPT-2/3/4, RoBERTa dùng.
                </li>
                <li>
                  <strong>WordPiece</strong> — giống BPE nhưng chọn cặp theo
                  likelihood thay vì tần suất. BERT, DistilBERT, ELECTRA dùng.
                </li>
                <li>
                  <strong>Unigram LM</strong> — top-down. Bắt đầu với vocabulary
                  lớn, loại dần các token có likelihood thấp. ALBERT và T5 dùng.
                </li>
                <li>
                  <strong>SentencePiece</strong> — KHÔNG phải thuật toán riêng;
                  là framework bao ngoài (BPE hoặc Unigram) xử lý Unicode
                  raw. Ưu điểm: không cần pre-tokenize, dấu cách cũng là token
                  bình thường (mã hoá bằng ▁). Phù hợp ngôn ngữ không có
                  khoảng trắng (tiếng Nhật, Trung). LLaMA, T5, mBART dùng.
                </li>
              </ul>
              <p>
                <strong>Khi nào dùng gì?</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Training từ đầu với corpus nhỏ — BPE đơn giản là đủ.</li>
                <li>Cần chính xác về mặt thống kê — Unigram.</li>
                <li>Đa ngôn ngữ, đặc biệt ngôn ngữ không có space — SentencePiece.</li>
                <li>Thân thiện với BERT ecosystem — WordPiece.</li>
              </ul>
              <p className="text-muted">
                Trong thực tế, hầu hết team dùng tokenizer của model tiền
                huấn luyện (pre-trained) — không train lại.
              </p>
            </div>
          </CollapsibleDetail>

          <p>
            <strong>Đo chi phí token — bài toán thực tế với LLM tiếng Việt:</strong>{" "}
            Một chatbot CSKH tiếng Việt gọi GPT-4 với context 2.500 ký tự mỗi
            lượt (system prompt + lịch sử + câu hỏi). Với tokenizer GPT-4, dự
            kiến: ~2.000 token input + ~400 token output = ~2.400 token/lượt.
            Giá $0.03/1K input + $0.06/1K output ≈ $0.084/lượt ≈ 2.100
            VNĐ/lượt. Nếu team chuyển sang PhoBERT-based tokenizer thông qua
            một model tiếng Việt riêng, chi phí có thể giảm 40-60%.
          </p>

          <Callout variant="insight" title="Thiết kế tokenizer tiếng Việt từ đầu">
            Khi xây model tiếng Việt chuyên dụng (chatbot công ty, LLM nội
            bộ), team thường train BPE/SentencePiece riêng trên 10-100GB
            corpus. Hiệu quả: (1) giảm 40-60% số token cho văn bản tiếng
            Việt; (2) giảm chi phí inference (token càng ít, decode càng
            nhanh); (3) tăng context hữu dụng — 4K context của tokenizer
            tiếng Anh chỉ bằng ~2K tokenizer tiếng Việt. Đây là một trong
            những cú &quot;hack hiệu quả&quot; đơn giản nhất.
          </Callout>

          <p>
            <strong>Token đặc biệt (special tokens):</strong>{" "}
            Mỗi tokenizer thường kèm theo các token đặc biệt không có trong
            văn bản thường:
          </p>

          <ul className="list-disc list-inside space-y-1 pl-2 text-sm leading-relaxed">
            <li>
              <code>[CLS]</code> / <code>[SEP]</code> (BERT) — mở đầu chuỗi
              và phân tách câu.
            </li>
            <li>
              <code>[MASK]</code> (BERT) — vị trí cần dự đoán trong masked
              language modeling.
            </li>
            <li>
              <code>[PAD]</code> — padding để đủ chiều dài batch (batch cần
              đồng đều chiều dài).
            </li>
            <li>
              <code>&lt;|endoftext|&gt;</code> (GPT-2) — đánh dấu kết thúc
              document. GPT-4 dùng <code>&lt;|im_start|&gt;</code>,{" "}
              <code>&lt;|im_end|&gt;</code> cho chat template.
            </li>
            <li>
              <code>&lt;s&gt;</code> / <code>&lt;/s&gt;</code> (LLaMA, T5) —
              tương ứng BOS (beginning of sequence) và EOS (end of sequence).
            </li>
          </ul>

          <Callout variant="warning" title="Prompt injection qua special tokens">
            Nếu bạn để user input chứa chuỗi ký tự giống special token (ví dụ
            &quot;&lt;|im_end|&gt;&quot; trong chat GPT-4), kẻ tấn công có
            thể làm &quot;đóng&quot; prompt hệ thống và chèn chỉ thị riêng.
            Luôn sanitize input người dùng trước khi ghép vào prompt — đặc
            biệt với các ứng dụng công cộng (chatbot, Q&amp;A trên trang chủ).
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ── Step 5.5: Deep tokenizer comparison for Vietnamese ── */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tokenizer tiếng Việt">
        <div className="space-y-4 text-sm leading-relaxed">
          <p>
            Tiếng Việt có các đặc thù khiến tokenization &quot;chuẩn mặc
            định&quot; cho tiếng Anh hoạt động kém:
          </p>

          <ol className="list-decimal list-inside space-y-2 pl-2">
            <li>
              <strong>Dấu phụ (diacritics):</strong>{" "}
              Tiếng Việt có 11 nguyên âm có dấu (á à ả ã ạ â ă &hellip;). Nếu
              tokenizer không học đủ, mỗi dấu phụ có thể tách thành 2-3 byte.
              Ví dụ &quot;ế&quot; = 3 byte UTF-8, BPE mô hình tiếng Anh có
              thể tách thành 2-3 token riêng.
            </li>
            <li>
              <strong>Từ ghép (compound words):</strong>{" "}
              &quot;Hà Nội&quot;, &quot;máy tính&quot;, &quot;đại học&quot;
              là 1 khái niệm nhưng tách theo space sẽ thành 2 từ. Công cụ
              VnCoreNLP/RDRSegmenter nối thành &quot;Hà_Nội&quot; trước khi
              tokenize.
            </li>
            <li>
              <strong>Tiếng Việt không dùng chữ hoa nghiêm ngặt:</strong>{" "}
              Khác tiếng Anh, chữ cái đầu tên người/địa danh không luôn viết
              hoa. Tokenizer case-sensitive dễ tách thừa.
            </li>
            <li>
              <strong>Nhiều từ Hán-Việt:</strong>{" "}
              &quot;phân phối&quot;, &quot;xác suất&quot;, &quot;tích phân&quot;
              là các từ gốc Hán — nếu BPE không có corpus tiếng Việt đủ lớn,
              chúng bị chẻ vụn.
            </li>
          </ol>

          <div className="rounded-xl border border-border bg-surface p-4 space-y-3 mt-4">
            <p className="font-semibold text-foreground">
              Thí nghiệm đếm token cho câu &quot;Tôi đang học xác suất thống
              kê tại Đại học Bách Khoa Hà Nội&quot;:
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2">Tokenizer</th>
                  <th className="text-right py-2">Số token</th>
                  <th className="text-left py-2 pl-4">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="text-muted">
                <tr className="border-b border-border/50">
                  <td className="py-2">GPT-2 BPE</td>
                  <td className="text-right py-2">~38</td>
                  <td className="pl-4 py-2">Chẻ dấu tiếng Việt thành byte</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2">GPT-4 cl100k_base</td>
                  <td className="text-right py-2">~22</td>
                  <td className="pl-4 py-2">Cải thiện đáng kể, vẫn thua PhoBERT</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2">mBERT WordPiece</td>
                  <td className="text-right py-2">~18</td>
                  <td className="pl-4 py-2">Multilingual — khá hợp lý</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2">PhoBERT BPE</td>
                  <td className="text-right py-2">~13</td>
                  <td className="pl-4 py-2">Train riêng cho tiếng Việt, giữ từ ghép</td>
                </tr>
                <tr>
                  <td className="py-2">ViT5 SentencePiece</td>
                  <td className="text-right py-2">~14</td>
                  <td className="pl-4 py-2">SentencePiece cho sinh text tiếng Việt</td>
                </tr>
              </tbody>
            </table>
            <p className="text-xs text-muted italic">
              (Số liệu xấp xỉ — chạy thực tế sẽ dao động ±2 token tuỳ phiên bản.)
            </p>
          </div>

          <Callout variant="tip" title="Rút gọn bill API LLM cho startup Việt">
            Với chatbot CSKH có 10K lượt/ngày, mỗi lượt 2K token input: dùng
            model tiếng Anh tốn ~$120/ngày. Chuyển sang model tiếng Việt với
            tokenizer tối ưu có thể giảm 30-50%. Trên quy mô năm, đây là
            khoản tiết kiệm đáng kể cho mọi SME.
          </Callout>
        </div>
      </LessonSection>

      {/* ── Step 6: Deeper comparison ── */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="So sánh chi tiết">
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
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về Tokenization"
          points={[
            "Tokenization là bước ĐẦU TIÊN trong NLP — chia văn bản thành token để máy tính xử lý.",
            "Word-level: đơn giản nhưng từ vựng lớn, không xử lý được từ mới (OOV).",
            "Character-level: từ vựng nhỏ, không OOV, nhưng chuỗi quá dài và mất ngữ nghĩa.",
            "Subword (BPE/WordPiece): chuẩn hiện đại — GPT dùng BPE, BERT dùng WordPiece.",
            "Tiếng Việt cần tách từ đặc biệt vì ranh giới từ phức tạp (VD: 'Việt Nam' = 1 từ, 2 token).",
            "Mỗi mô hình có tokenizer riêng; chi phí API tính theo token nên tiếng Việt thường đắt hơn tiếng Anh 1.5-3×.",
          ]}
        />
      </LessonSection>

      {/* ── Step 8: Quiz ── */}
      <LessonSection step={9} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
