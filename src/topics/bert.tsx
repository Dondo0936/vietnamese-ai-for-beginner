"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "bert",
  title: "BERT",
  titleVi: "BERT - Biểu diễn mã hóa hai chiều",
  description:
    "Mô hình ngôn ngữ tiền huấn luyện hai chiều, hiểu ngữ cảnh từ cả trái lẫn phải để biểu diễn ngôn ngữ sâu sắc.",
  category: "nlp",
  tags: ["nlp", "transformer", "pre-training"],
  difficulty: "advanced",
  relatedSlugs: ["transformer", "attention-mechanism", "gpt"],
  vizType: "static",
};

const TOKENS = ["[CLS]", "Tôi", "yêu", "[MASK]", "máy", "[SEP]"];

export default function BertTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn chơi trò <strong>điền vào chỗ trống</strong>:
          &quot;Tôi yêu ___ máy&quot;. Để đoán từ bị che, bạn phải đọc{" "}
          <strong>cả trước lẫn sau</strong> chỗ trống — &quot;Tôi yêu&quot; gợi ý cảm xúc
          tích cực, &quot;máy&quot; gợi ý công nghệ. Câu trả lời: &quot;học&quot;!
        </p>
        <p>
          BERT hoạt động đúng như vậy — nó đọc văn bản <strong>hai chiều</strong>{" "}
          (trái → phải VÀ phải → trái) cùng lúc, giống như mắt người đọc hiểu
          toàn bộ câu chứ không chỉ từ trái sang phải.
        </p>
        <p>
          Trước BERT, các mô hình chỉ đọc một chiều. BERT đã{" "}
          <strong>cách mạng hóa NLP</strong> bằng cách hiểu ngữ cảnh đầy đủ
          từ cả hai phía.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          <svg viewBox="0 0 600 340" className="w-full max-w-2xl mx-auto">
            {/* Title */}
            <text x="300" y="25" textAnchor="middle" fill="#e2e8f0" fontSize="14" fontWeight="bold">
              Kiến trúc BERT
            </text>

            {/* Input tokens */}
            <text x="50" y="60" fill="#64748b" fontSize="10">Đầu vào:</text>
            {TOKENS.map((token, i) => (
              <g key={`in-${i}`}>
                <rect
                  x={70 + i * 88}
                  y="45"
                  width="75"
                  height="28"
                  rx="6"
                  fill={token === "[MASK]" ? "#ef4444" : "#3b82f6"}
                  opacity={0.8}
                />
                <text
                  x={107 + i * 88}
                  y="64"
                  textAnchor="middle"
                  fill="white"
                  fontSize="11"
                  fontWeight="bold"
                >
                  {token}
                </text>
              </g>
            ))}

            {/* Embedding layer */}
            <text x="50" y="105" fill="#64748b" fontSize="10">Embedding:</text>
            {TOKENS.map((_, i) => (
              <g key={`emb-${i}`}>
                <rect
                  x={75 + i * 88}
                  y="90"
                  width="65"
                  height="22"
                  rx="4"
                  fill="#1e293b"
                  stroke="#334155"
                  strokeWidth="1"
                />
                <text x={107 + i * 88} y="105" textAnchor="middle" fill="#94a3b8" fontSize="9">
                  Token+Pos+Seg
                </text>
                <line x1={107 + i * 88} y1="73" x2={107 + i * 88} y2="90" stroke="#475569" strokeWidth="1" />
              </g>
            ))}

            {/* Transformer blocks */}
            {[0, 1, 2].map((layer) => {
              const y = 135 + layer * 55;
              return (
                <g key={`layer-${layer}`}>
                  <rect x="70" y={y} width={TOKENS.length * 88} height="40" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                  <text x="300" y={y + 18} textAnchor="middle" fill="#8b5cf6" fontSize="11" fontWeight="bold">
                    Transformer Block {layer + 1}
                  </text>
                  <text x="300" y={y + 32} textAnchor="middle" fill="#64748b" fontSize="9">
                    Multi-Head Self-Attention + FFN
                  </text>
                  {/* Bidirectional arrows inside */}
                  <line x1="120" y1={y + 5} x2="500" y2={y + 5} stroke="#8b5cf6" strokeWidth="1" opacity={0.3} />
                  <line x1="500" y1={y + 8} x2="120" y2={y + 8} stroke="#8b5cf6" strokeWidth="1" opacity={0.3} />
                </g>
              );
            })}

            {/* Output */}
            <text x="50" y="310" fill="#64748b" fontSize="10">Đầu ra:</text>
            {TOKENS.map((token, i) => {
              const isMask = token === "[MASK]";
              return (
                <g key={`out-${i}`}>
                  <rect
                    x={70 + i * 88}
                    y="295"
                    width="75"
                    height="28"
                    rx="6"
                    fill={isMask ? "#22c55e" : "#1e293b"}
                    stroke={isMask ? "#4ade80" : "#334155"}
                    strokeWidth={isMask ? 2 : 1}
                  />
                  <text
                    x={107 + i * 88}
                    y="314"
                    textAnchor="middle"
                    fill={isMask ? "white" : "#94a3b8"}
                    fontSize="11"
                    fontWeight={isMask ? "bold" : "normal"}
                  >
                    {isMask ? "học" : token}
                  </text>
                  <line x1={107 + i * 88} y1="280" x2={107 + i * 88} y2="295" stroke="#475569" strokeWidth="1" />
                </g>
              );
            })}

            {/* Bidirectional label */}
            <text x="560" y="195" fill="#8b5cf6" fontSize="9" fontWeight="bold" transform="rotate(90,560,195)">
              Hai chiều
            </text>
          </svg>

          <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
            <p className="text-sm text-muted">
              BERT dự đoán từ bị che [MASK] bằng cách đọc ngữ cảnh{" "}
              <strong>cả hai phía</strong>: &quot;Tôi yêu ___ máy&quot; →{" "}
              <strong className="text-accent">học</strong>
            </p>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>BERT</strong> (Bidirectional Encoder Representations from
          Transformers) là mô hình ngôn ngữ tiền huấn luyện của Google, ra mắt
          năm 2018. Nó sử dụng kiến trúc Transformer Encoder để đọc văn bản
          hai chiều.
        </p>
        <p>BERT được tiền huấn luyện bằng hai tác vụ:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Masked Language Model (MLM):</strong> Che ngẫu nhiên 15% số
            token và yêu cầu mô hình dự đoán từ bị che dựa trên ngữ cảnh hai
            phía.
          </li>
          <li>
            <strong>Next Sentence Prediction (NSP):</strong> Dự đoán xem hai
            câu có liền kề nhau trong văn bản gốc hay không, giúp hiểu quan
            hệ giữa các câu.
          </li>
        </ol>
        <p>
          Sau tiền huấn luyện, BERT được <strong>tinh chỉnh</strong> (fine-tune)
          cho các tác vụ cụ thể như phân loại văn bản, trích xuất thực thể,
          hỏi đáp... BERT đạt kết quả vượt trội trên 11 benchmark NLP khi ra
          mắt.
        </p>
      </ExplanationSection>
    </>
  );
}
