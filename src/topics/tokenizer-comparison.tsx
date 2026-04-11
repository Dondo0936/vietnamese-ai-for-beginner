"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
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

type TokenizerType = "bpe" | "wordpiece" | "sentencepiece";

const EXAMPLES: Record<TokenizerType, { label: string; tokens: string[]; colors: string[] }> = {
  bpe: {
    label: "BPE (GPT, LLaMA)",
    tokens: ["Việt", " Nam", " là", " đất", " nước", " tôi"],
    colors: ["#3b82f6", "#8b5cf6", "#22c55e", "#f59e0b", "#ef4444", "#ec4899"],
  },
  wordpiece: {
    label: "WordPiece (BERT)",
    tokens: ["Việt", "##Nam", "là", "đất", "##nước", "tôi"],
    colors: ["#3b82f6", "#8b5cf6", "#22c55e", "#f59e0b", "#ef4444", "#ec4899"],
  },
  sentencepiece: {
    label: "SentencePiece (T5, mBERT)",
    tokens: ["▁Việt", "Nam", "▁là", "▁đất", "▁nước", "▁tôi"],
    colors: ["#3b82f6", "#8b5cf6", "#22c55e", "#f59e0b", "#ef4444", "#ec4899"],
  },
};

export default function TokenizerComparisonTopic() {
  const [selected, setSelected] = useState<TokenizerType>("bpe");
  const example = EXAMPLES[selected];

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn cần gửi một tin nhắn bằng <strong>tín hiệu cờ</strong>.
          Mỗi cờ đại diện cho một &quot;mảnh&quot; của thông điệp. Bạn có thể chọn:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li><strong>Cờ theo từ:</strong> Mỗi cờ = một từ → cần rất nhiều cờ khác nhau</li>
          <li><strong>Cờ theo chữ cái:</strong> Chỉ 26 cờ → nhưng tin nhắn rất dài</li>
          <li><strong>Cờ thông minh:</strong> Nhóm các chữ cái thường đi cùng nhau (BPE/WordPiece) → cân bằng giữa kích thước từ vựng và độ dài chuỗi</li>
        </ul>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <div className="flex flex-wrap justify-center gap-2">
            {(Object.keys(EXAMPLES) as TokenizerType[]).map((key) => (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  selected === key
                    ? "bg-accent text-white"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                {EXAMPLES[key].label}
              </button>
            ))}
          </div>

          <svg viewBox="0 0 600 280" className="w-full max-w-2xl mx-auto">
            {/* Original text */}
            <text x={300} y={25} textAnchor="middle" fontSize={13} fill="#64748b">
              Văn bản gốc: &quot;Việt Nam là đất nước tôi&quot;
            </text>
            <rect x={120} y={32} width={360} height={30} fill="#f1f5f9" rx={6} stroke="#e2e8f0" />
            <text x={300} y={53} textAnchor="middle" fontSize={14} fill="#0f172a" fontWeight="bold">
              Việt Nam là đất nước tôi
            </text>

            {/* Arrow */}
            <line x1={300} y1={68} x2={300} y2={88} stroke="#94a3b8" strokeWidth={2} />
            <polygon points="295,85 305,85 300,93" fill="#94a3b8" />
            <text x={320} y={85} fontSize={10} fill="#14b8a6" fontWeight="bold">{example.label}</text>

            {/* Tokenized result */}
            <text x={300} y={115} textAnchor="middle" fontSize={12} fill="#64748b">Kết quả token hoá:</text>
            {example.tokens.map((token, i) => {
              const tokenWidth = Math.max(token.length * 12, 50);
              const totalWidth = example.tokens.reduce((acc, t) => acc + Math.max(t.length * 12, 50) + 8, -8);
              let x = (600 - totalWidth) / 2;
              for (let j = 0; j < i; j++) {
                x += Math.max(example.tokens[j].length * 12, 50) + 8;
              }
              return (
                <g key={i}>
                  <rect x={x} y={125} width={tokenWidth} height={32} fill={example.colors[i]} rx={5} opacity={0.8} />
                  <text x={x + tokenWidth / 2} y={146} textAnchor="middle" fontSize={11} fill="white" fontWeight="bold">
                    {token}
                  </text>
                </g>
              );
            })}

            {/* Comparison table */}
            <g transform="translate(30, 180)">
              {[
                { label: "Xử lý khoảng trắng", bpe: "Giữ dấu cách đầu", wp: "Dùng ## nối", sp: "Dùng ▁ đánh dấu" },
                { label: "Từ chưa thấy (OOV)", bpe: "Chia thành sub-token", wp: "Chia thành ##sub", sp: "Chia ở mức byte" },
                { label: "Dùng bởi", bpe: "GPT, LLaMA, Claude", wp: "BERT, DistilBERT", sp: "T5, mBERT, XLNet" },
              ].map((row, ri) => (
                <g key={ri} transform={`translate(0, ${ri * 30})`}>
                  <text x={0} y={15} fontSize={10} fill="#64748b" fontWeight="bold">{row.label}:</text>
                  <rect x={150} y={2} width={140} height={20} fill={selected === "bpe" ? "#dbeafe" : "#f8fafc"} rx={3} />
                  <text x={220} y={16} textAnchor="middle" fontSize={9} fill="#1e40af">{row.bpe}</text>
                  <rect x={295} y={2} width={120} height={20} fill={selected === "wordpiece" ? "#dbeafe" : "#f8fafc"} rx={3} />
                  <text x={355} y={16} textAnchor="middle" fontSize={9} fill="#1e40af">{row.wp}</text>
                  <rect x={420} y={2} width={130} height={20} fill={selected === "sentencepiece" ? "#dbeafe" : "#f8fafc"} rx={3} />
                  <text x={485} y={16} textAnchor="middle" fontSize={9} fill="#1e40af">{row.sp}</text>
                </g>
              ))}
            </g>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          Tokenizer là bước đầu tiên và quan trọng trong mọi mô hình NLP — chuyển văn bản thô thành
          chuỗi số mà mô hình xử lý được. Ba phương pháp phổ biến nhất:
        </p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>BPE (Byte Pair Encoding):</strong> Bắt đầu từ ký tự đơn, lặp lại ghép cặp
            ký tự/sub-word xuất hiện nhiều nhất. Dùng trong GPT, LLaMA, Claude. Xử lý khoảng trắng
            bằng cách giữ dấu cách ở đầu token.
          </li>
          <li>
            <strong>WordPiece:</strong> Tương tự BPE nhưng dùng likelihood thay vì tần suất để chọn
            cặp ghép. Đánh dấu sub-word bằng tiền tố &quot;##&quot;. Dùng trong BERT và các biến thể.
          </li>
          <li>
            <strong>SentencePiece:</strong> Xử lý văn bản ở mức byte, không cần pre-tokenize.
            Đánh dấu đầu từ bằng &quot;▁&quot;. Hỗ trợ tốt cho đa ngôn ngữ (kể cả tiếng Việt).
            Dùng trong T5, mBERT, XLNet.
          </li>
        </ol>
        <p>
          <strong>Lưu ý cho tiếng Việt:</strong> Do tiếng Việt có dấu thanh và nhiều ký tự Unicode,
          SentencePiece thường cho kết quả tốt hơn vì xử lý trực tiếp ở mức byte mà không cần
          bước tiền xử lý đặc biệt.
        </p>
      </ExplanationSection>
    </>
  );
}
