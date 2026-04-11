"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
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
  slug: "tokenizer-comparison",
  title: "Tokenizer Comparison",
  titleVi: "So sánh Tokenizer",
  description:
    "So sánh BPE, SentencePiece và WordPiece — ưu nhược điểm và ứng dụng của từng phương pháp",
  category: "nlp",
  tags: ["bpe", "sentencepiece", "wordpiece"],
  difficulty: "intermediate",
  relatedSlugs: ["tokenization", "bert", "gpt"],
  vizType: "interactive",
};

/* ── Constants ── */
const TOTAL_STEPS = 8;

type TokenizerType = "bpe" | "wordpiece" | "sentencepiece";

interface TokenResult {
  label: string;
  model: string;
  tokens: { text: string; color: string }[];
  tokenCount: number;
}

const TOKENIZER_RESULTS: Record<string, Record<TokenizerType, TokenResult>> = {
  "Việt Nam là đất nước tôi": {
    bpe: {
      label: "BPE", model: "GPT-4, LLaMA, Claude",
      tokens: [
        { text: "Việt", color: "#3b82f6" }, { text: " Nam", color: "#8b5cf6" },
        { text: " là", color: "#22c55e" }, { text: " đất", color: "#f59e0b" },
        { text: " nước", color: "#ef4444" }, { text: " tôi", color: "#ec4899" },
      ],
      tokenCount: 6,
    },
    wordpiece: {
      label: "WordPiece", model: "BERT, PhoBERT",
      tokens: [
        { text: "Việt", color: "#3b82f6" }, { text: "##Nam", color: "#8b5cf6" },
        { text: "là", color: "#22c55e" }, { text: "đất", color: "#f59e0b" },
        { text: "##nước", color: "#ef4444" }, { text: "tôi", color: "#ec4899" },
      ],
      tokenCount: 6,
    },
    sentencepiece: {
      label: "SentencePiece", model: "T5, mBERT, XLNet",
      tokens: [
        { text: "▁Việt", color: "#3b82f6" }, { text: "Nam", color: "#8b5cf6" },
        { text: "▁là", color: "#22c55e" }, { text: "▁đất", color: "#f59e0b" },
        { text: "▁nước", color: "#ef4444" }, { text: "▁tôi", color: "#ec4899" },
      ],
      tokenCount: 6,
    },
  },
  "Tokenization rất thú vị": {
    bpe: {
      label: "BPE", model: "GPT-4, LLaMA, Claude",
      tokens: [
        { text: "Token", color: "#3b82f6" }, { text: "ization", color: "#8b5cf6" },
        { text: " rất", color: "#22c55e" }, { text: " thú", color: "#f59e0b" },
        { text: " vị", color: "#ef4444" },
      ],
      tokenCount: 5,
    },
    wordpiece: {
      label: "WordPiece", model: "BERT, PhoBERT",
      tokens: [
        { text: "Token", color: "#3b82f6" }, { text: "##ization", color: "#8b5cf6" },
        { text: "rất", color: "#22c55e" }, { text: "thú", color: "#f59e0b" },
        { text: "vị", color: "#ef4444" },
      ],
      tokenCount: 5,
    },
    sentencepiece: {
      label: "SentencePiece", model: "T5, mBERT, XLNet",
      tokens: [
        { text: "▁Token", color: "#3b82f6" }, { text: "ization", color: "#8b5cf6" },
        { text: "▁rất", color: "#22c55e" }, { text: "▁thú", color: "#f59e0b" },
        { text: "▁vị", color: "#ef4444" },
      ],
      tokenCount: 5,
    },
  },
  "Phở bò Hà Nội ngon": {
    bpe: {
      label: "BPE", model: "GPT-4, LLaMA, Claude",
      tokens: [
        { text: "Ph", color: "#3b82f6" }, { text: "ở", color: "#8b5cf6" },
        { text: " bò", color: "#22c55e" }, { text: " Hà", color: "#f59e0b" },
        { text: " Nội", color: "#ef4444" }, { text: " ngon", color: "#ec4899" },
      ],
      tokenCount: 6,
    },
    wordpiece: {
      label: "WordPiece", model: "BERT, PhoBERT",
      tokens: [
        { text: "Phở", color: "#3b82f6" }, { text: "bò", color: "#22c55e" },
        { text: "Hà", color: "#f59e0b" }, { text: "Nội", color: "#ef4444" },
        { text: "ngon", color: "#ec4899" },
      ],
      tokenCount: 5,
    },
    sentencepiece: {
      label: "SentencePiece", model: "T5, mBERT, XLNet",
      tokens: [
        { text: "▁Phở", color: "#3b82f6" }, { text: "▁bò", color: "#22c55e" },
        { text: "▁Hà", color: "#f59e0b" }, { text: "▁Nội", color: "#ef4444" },
        { text: "▁ngon", color: "#ec4899" },
      ],
      tokenCount: 5,
    },
  },
};

const TEXTS = Object.keys(TOKENIZER_RESULTS);

const QUIZ: QuizQuestion[] = [
  {
    question: "BPE đánh dấu khoảng trắng bằng cách nào?",
    options: [
      "Bỏ qua khoảng trắng",
      "Giữ dấu cách ở ĐẦU token (ví dụ: ' Nam')",
      "Dùng ## như WordPiece",
      "Dùng ▁ như SentencePiece",
    ],
    correct: 1,
    explanation:
      "BPE giữ khoảng trắng ở đầu token: 'Việt' + ' Nam'. WordPiece dùng ## cho subword: 'Việt' + '##Nam'. SentencePiece dùng ▁ đánh dấu đầu từ.",
  },
  {
    question: "Tại sao SentencePiece tốt cho đa ngôn ngữ (multilingual)?",
    options: [
      "Vì được thiết kế cho tiếng Nhật",
      "Vì xử lý ở mức BYTE — không cần pre-tokenize, hỗ trợ mọi script Unicode",
      "Vì từ vựng lớn hơn",
      "Vì nhanh hơn BPE",
    ],
    correct: 1,
    explanation:
      "SentencePiece xử lý trực tiếp ở mức byte/character, không cần pre-tokenize (tách từ trước). Hỗ trợ tốt tiếng Việt (dấu thanh), tiếng Nhật (kanji), tiếng Trung (hán tự)...",
  },
  {
    question: "Từ 'Phở' bị tách thành 'Ph' + 'ở' bởi BPE của GPT. Tại sao?",
    options: [
      "Vì BPE lỗi",
      "Vì GPT tokenizer huấn luyện chủ yếu trên tiếng Anh — 'Phở' hiếm nên bị chia nhỏ",
      "Vì 'Phở' quá dài",
      "Vì BPE luôn chia thành 2 phần",
    ],
    correct: 1,
    explanation:
      "GPT tokenizer (BPE) huấn luyện trên dữ liệu tiếng Anh là chủ yếu. Từ tiếng Việt hiếm → không nằm trong từ vựng → bị chia nhỏ. PhoBERT tokenizer giữ 'Phở' nguyên vẹn vì huấn luyện trên tiếng Việt!",
  },
];

/* ── Main Component ── */
export default function TokenizerComparisonTopic() {
  const [selected, setSelected] = useState<TokenizerType>("bpe");
  const [textIdx, setTextIdx] = useState(0);

  const text = TEXTS[textIdx];
  const results = TOKENIZER_RESULTS[text];

  return (
    <>
      {/* ── Step 1: PredictionGate ── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Thử thách">
        <PredictionGate
          question={`Từ "Phở" sẽ bị tokenizer của GPT chia thành "Ph" + "ở" (2 token). Nhưng tokenizer của PhoBERT giữ nguyên "Phở" (1 token). Tại sao?`}
          options={[
            "PhoBERT mạnh hơn GPT",
            "GPT tokenizer huấn luyện trên tiếng Anh nên từ tiếng Việt bị chia nhỏ",
            "Phở quá ngắn nên không chia được",
          ]}
          correct={1}
          explanation={`Tokenizer học từ dữ liệu: GPT tokenizer thấy "Phở" hiếm (dữ liệu tiếng Anh) → chia nhỏ. PhoBERT tokenizer thấy "Phở" rất phổ biến (dữ liệu tiếng Việt) → giữ nguyên. Tokenizer khác nhau tạo kết quả khác nhau!`}
        />
      </LessonSection>

      {/* ── Step 2: Interactive Comparison ── */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Chọn câu tiếng Việt và so sánh cách 3 tokenizer khác nhau chia token. Chú ý cách đánh dấu khoảng trắng khác nhau!
        </p>

        <VisualizationSection>
          <div className="space-y-5">
            {/* Text selector */}
            <div className="flex flex-wrap gap-2">
              {TEXTS.map((t, i) => (
                <button key={i} type="button" onClick={() => setTextIdx(i)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    textIdx === i
                      ? "bg-accent text-white"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}>
                  {t}
                </button>
              ))}
            </div>

            {/* Original text */}
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className="text-xs text-muted mb-1">Văn bản gốc</p>
              <p className="text-base font-bold text-foreground">{text}</p>
            </div>

            {/* Tokenizer selector */}
            <div className="flex gap-2 justify-center">
              {(["bpe", "wordpiece", "sentencepiece"] as TokenizerType[]).map((t) => (
                <button key={t} type="button" onClick={() => setSelected(t)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    selected === t
                      ? "bg-accent text-white"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}>
                  {results[t].label}
                </button>
              ))}
            </div>

            {/* Token display */}
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-accent">{results[selected].label}</p>
                <p className="text-xs text-muted">{results[selected].model}</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {results[selected].tokens.map((token, i) => (
                  <motion.span key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-md px-3 py-1.5 text-sm font-bold text-white"
                    style={{ backgroundColor: token.color }}>
                    {token.text}
                  </motion.span>
                ))}
              </div>
              <p className="text-xs text-muted text-center">
                Số token: <strong className="text-accent">{results[selected].tokenCount}</strong>
              </p>
            </div>

            {/* Comparison table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 text-muted">Đặc điểm</th>
                    <th className="text-center py-2 px-2 text-blue-500 font-bold">BPE</th>
                    <th className="text-center py-2 px-2 text-purple-500 font-bold">WordPiece</th>
                    <th className="text-center py-2 px-2 text-green-500 font-bold">SentencePiece</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Khoảng trắng", bpe: "Đầu token ( Nam)", wp: "## nối (##Nam)", sp: "▁ đánh dấu (▁Nam)" },
                    { label: "OOV", bpe: "Chia sub-token", wp: "Chia ##sub", sp: "Chia ở mức byte" },
                    { label: "Pre-tokenize", bpe: "Cần (tách từ trước)", wp: "Cần", sp: "Không cần!" },
                    { label: "Mô hình", bpe: "GPT, LLaMA, Claude", wp: "BERT, PhoBERT", sp: "T5, mBERT" },
                  ].map((row) => (
                    <tr key={row.label} className="border-b border-border">
                      <td className="py-2 px-2 text-muted font-medium">{row.label}</td>
                      <td className={`py-2 px-2 text-center ${selected === "bpe" ? "bg-blue-500/10 font-bold" : ""}`}>{row.bpe}</td>
                      <td className={`py-2 px-2 text-center ${selected === "wordpiece" ? "bg-purple-500/10 font-bold" : ""}`}>{row.wp}</td>
                      <td className={`py-2 px-2 text-center ${selected === "sentencepiece" ? "bg-green-500/10 font-bold" : ""}`}>{row.sp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ── Step 3: AhaMoment ── */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          <p>
            Ba tokenizer đều là subword — chia từ hiếm thành mảnh nhỏ. Nhưng khác nhau ở cách đánh dấu khoảng trắng: BPE giữ dấu cách, WordPiece dùng ##, SentencePiece dùng ▁.
          </p>
          <p className="text-sm text-muted mt-1">
            Quan trọng nhất: tokenizer phải được huấn luyện trên ngôn ngữ đúng! GPT tokenizer (tiếng Anh) chia {'"Phở"'} thành 2 token, PhoBERT tokenizer (tiếng Việt) giữ nguyên 1 token.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ── Step 4: InlineChallenge ── */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <InlineChallenge
          question={`Token "##Nam" trong WordPiece có ý nghĩa gì?`}
          options={[
            "'Nam' là từ mới chưa gặp bao giờ",
            "'##' nghĩa là đây là PHẦN TIẾP THEO của từ trước (Việt + ##Nam = Việt Nam)",
            "'##' là ký tự đặc biệt trong tiếng Việt",
          ]}
          correct={1}
          explanation="## trong WordPiece đánh dấu: 'đây KHÔNG phải đầu từ mới, mà tiếp nối từ trước'. 'Việt' + '##Nam' = 'Việt Nam'. Giống mảnh ghép puzzle — ## cho biết mảnh này nối vào mảnh trước!"
        />
      </LessonSection>

      {/* ── Step 5: Vietnamese-specific ── */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Tiếng Việt">
        <div className="space-y-4">
          <p className="text-sm text-foreground leading-relaxed">
            Tiếng Việt có thách thức riêng cho tokenizer: dấu thanh, từ ghép, và ranh giới từ phức tạp.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 space-y-2">
              <p className="text-xs font-semibold text-red-500 uppercase">GPT Tokenizer (tiếng Anh)</p>
              <div className="space-y-1 text-sm">
                <p className="text-foreground">{'"Phở"'} → <span className="text-red-500 font-bold">{'"Ph" + "ở"'}</span> (2 token)</p>
                <p className="text-foreground">{'"Nguyễn"'} → <span className="text-red-500 font-bold">{'"Ng" + "uy" + "ễn"'}</span> (3 token)</p>
                <p className="text-foreground">{'"Việt Nam"'} → <span className="text-red-500 font-bold">{'"Vi" + "ệt" + " Nam"'}</span> (3 token)</p>
              </div>
              <p className="text-xs text-red-400">Từ tiếng Việt bị chia nhỏ quá mức → tốn token → đắt tiền!</p>
            </div>
            <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 space-y-2">
              <p className="text-xs font-semibold text-green-500 uppercase">PhoBERT Tokenizer (tiếng Việt)</p>
              <div className="space-y-1 text-sm">
                <p className="text-foreground">{'"Phở"'} → <span className="text-green-500 font-bold">{'"Phở"'}</span> (1 token)</p>
                <p className="text-foreground">{'"Nguyễn"'} → <span className="text-green-500 font-bold">{'"Nguyễn"'}</span> (1 token)</p>
                <p className="text-foreground">{'"Việt Nam"'} → <span className="text-green-500 font-bold">{'"Việt_Nam"'}</span> (1 token)</p>
              </div>
              <p className="text-xs text-green-400">Từ tiếng Việt giữ nguyên → ít token → hiệu quả!</p>
            </div>
          </div>
        </div>
      </LessonSection>

      {/* ── Step 6: Explanation ── */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            Ba phương pháp tokenization subword phổ biến nhất, mỗi cái có cách xử lý khoảng trắng và từ mới khác nhau.
          </p>

          <Callout variant="insight" title="BPE (Byte Pair Encoding)">
            <div className="space-y-2">
              <p>Thuật toán nén dữ liệu áp dụng cho NLP (Sennrich et al., 2016):</p>
              <LaTeX display>{`\\text{Merge}(\\text{vocab}) = \\text{vocab} \\cup \\{\\text{cặp byte phổ biến nhất}\\}`}</LaTeX>
              <p className="text-sm">
                Bắt đầu từ byte đơn, lặp lại ghép cặp phổ biến nhất. GPT-4 dùng ~100K token BPE. {'"Tokenization"'} → {'"Token"'} + {'"ization"'} vì cặp này phổ biến.
              </p>
            </div>
          </Callout>

          <Callout variant="info" title="WordPiece vs SentencePiece">
            <div className="space-y-2">
              <p>
                <strong>WordPiece:</strong>{" "}
                Tương tự BPE nhưng dùng likelihood (ML) thay vì tần suất để chọn cặp ghép. Dùng ## đánh dấu subword. BERT dùng 30K WordPiece tokens.
              </p>
              <p>
                <strong>SentencePiece:</strong>{" "}
                Xử lý ở mức byte, KHÔNG cần pre-tokenize (tách từ trước). Dùng ▁ đánh dấu đầu từ. Tốt cho đa ngôn ngữ vì xử lý mọi Unicode script.
              </p>
            </div>
          </Callout>

          <CodeBlock language="python" title="tokenizer_compare.py">
{`from transformers import AutoTokenizer

text = "Phở Hà Nội rất ngon"

# 1. BPE (GPT-2)
gpt2_tok = AutoTokenizer.from_pretrained("gpt2")
print("BPE:", gpt2_tok.tokenize(text))
# ['Ph', 'ở', ' H', 'à', ' N', 'ội', ' r', 'ất', ' ngon']
# → 9 token! Tiếng Việt bị chia nhỏ

# 2. WordPiece (BERT multilingual)
bert_tok = AutoTokenizer.from_pretrained(
    "bert-base-multilingual-cased")
print("WordPiece:", bert_tok.tokenize(text))
# ['Ph', '##ở', 'Hà', 'Nội', 'rất', 'ngon']
# → 6 token, tốt hơn

# 3. SentencePiece (PhoBERT - tiếng Việt)
phobert_tok = AutoTokenizer.from_pretrained("vinai/phobert-base")
print("SentencePiece:", phobert_tok.tokenize(text))
# ['Phở', 'Hà_Nội', 'rất', 'ngon']
# → 4 token! Tối ưu cho tiếng Việt

# Bài học: tokenizer phù hợp ngôn ngữ = ít token = hiệu quả!`}
          </CodeBlock>

          <Callout variant="tip" title="Chọn tokenizer cho dự án tiếng Việt">
            <p>
              <strong>NLU (hiểu):</strong>{" "}
              PhoBERT tokenizer (SentencePiece + RDRSegmenter).{" "}
              <strong>NLG (sinh):</strong>{" "}
              Nếu dùng GPT/Claude, chấp nhận BPE chia nhỏ. Hoặc dùng mô hình đa ngôn ngữ với SentencePiece (mBERT, XLM-R) cho hiệu quả tốt hơn.
            </p>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ── Step 7: MiniSummary ── */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về Tokenizer Comparison"
          points={[
            "BPE: dấu cách đầu token, dùng tần suất ghép cặp. GPT, LLaMA, Claude.",
            "WordPiece: ## đánh dấu subword, dùng likelihood. BERT, PhoBERT.",
            "SentencePiece: ▁ đánh dấu đầu từ, xử lý mức byte, không cần pre-tokenize. T5, mBERT.",
            "Tiếng Việt: GPT tokenizer chia 'Phở' thành 2 token, PhoBERT giữ nguyên 1 token.",
            "Chọn tokenizer phù hợp ngôn ngữ = ít token = tiết kiệm chi phí + hiệu quả cao.",
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
