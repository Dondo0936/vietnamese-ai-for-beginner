"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "glove",
  title: "GloVe",
  titleVi: "GloVe - Biểu diễn vector toàn cục",
  description:
    "Phương pháp học biểu diễn từ dựa trên ma trận đồng xuất hiện toàn cục, kết hợp ưu điểm của phương pháp toàn cục và cục bộ.",
  category: "nlp",
  tags: ["nlp", "representation-learning", "embedding"],
  difficulty: "intermediate",
  relatedSlugs: ["word2vec", "word-embeddings", "bag-of-words"],
  vizType: "static",
};

const WORDS_ROW = ["tôi", "yêu", "học", "máy", "trí", "tuệ"];
const MATRIX = [
  [0, 5, 3, 1, 2, 2],
  [5, 0, 4, 2, 3, 3],
  [3, 4, 0, 6, 5, 4],
  [1, 2, 6, 0, 4, 3],
  [2, 3, 5, 4, 0, 8],
  [2, 3, 4, 3, 8, 0],
];

export default function GloveTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn là <strong>thám tử</strong> điều tra mối quan hệ
          giữa các người trong thành phố. Bạn không theo dõi từng cuộc gặp mặt
          (như Word2Vec), mà lập một <strong>bảng thống kê tổng hợp</strong>:
          ai gặp ai bao nhiêu lần trong cả năm.
        </p>
        <p>
          Từ bảng này, bạn suy ra: nếu A gặp B rất nhiều lần và cũng gặp C
          nhiều lần, thì có thể B và C cũng liên quan đến nhau. GloVe hoạt
          động tương tự — nó xây dựng{" "}
          <strong>ma trận đồng xuất hiện toàn cục</strong> rồi phân tích để tìm
          vector biểu diễn cho mỗi từ.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          <p className="text-sm text-muted text-center">
            Ma trận đồng xuất hiện: số lần hai từ xuất hiện gần nhau
          </p>

          <svg viewBox="0 0 600 380" className="w-full max-w-2xl mx-auto">
            {/* Column headers */}
            {WORDS_ROW.map((word, i) => (
              <text
                key={`col-${word}`}
                x={160 + i * 70}
                y="40"
                textAnchor="middle"
                fill="#3b82f6"
                fontSize="12"
                fontWeight="bold"
              >
                {word}
              </text>
            ))}

            {/* Row headers and matrix cells */}
            {WORDS_ROW.map((word, row) => (
              <g key={`row-${word}`}>
                <text
                  x="90"
                  y={80 + row * 50}
                  textAnchor="end"
                  fill="#3b82f6"
                  fontSize="12"
                  fontWeight="bold"
                >
                  {word}
                </text>
                {MATRIX[row].map((val, col) => {
                  const intensity = val / 8;
                  return (
                    <g key={`${row}-${col}`}>
                      <rect
                        x={130 + col * 70}
                        y={60 + row * 50}
                        width="60"
                        height="30"
                        rx="4"
                        fill={
                          row === col
                            ? "#1e293b"
                            : `rgba(59, 130, 246, ${0.15 + intensity * 0.7})`
                        }
                        stroke="#334155"
                        strokeWidth="1"
                      />
                      <text
                        x={160 + col * 70}
                        y={80 + row * 50}
                        textAnchor="middle"
                        fill={row === col ? "#475569" : "#e2e8f0"}
                        fontSize="12"
                        fontWeight={val >= 5 ? "bold" : "normal"}
                      >
                        {row === col ? "-" : val}
                      </text>
                    </g>
                  );
                })}
              </g>
            ))}

            {/* Arrow and label */}
            <line x1="300" y1="370" x2="300" y2="370" stroke="#475569" strokeWidth="0" />
            <text x="300" y="370" textAnchor="middle" fill="#64748b" fontSize="11">
              Giá trị cao = hai từ thường xuất hiện cùng nhau (ví dụ: &quot;trí&quot; &amp; &quot;tuệ&quot; = 8)
            </text>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>GloVe</strong> (Global Vectors for Word Representation) là
          phương pháp học word embeddings do Stanford phát triển năm 2014. Khác
          với Word2Vec dùng cửa sổ cục bộ, GloVe tận dụng{" "}
          <strong>thống kê đồng xuất hiện toàn cục</strong> của toàn bộ corpus.
        </p>
        <p>Quy trình GloVe gồm 3 bước:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Xây dựng ma trận đồng xuất hiện:</strong> Đếm số lần mỗi
            cặp từ xuất hiện gần nhau trong toàn bộ tập dữ liệu.
          </li>
          <li>
            <strong>Phân tích ma trận:</strong> Tìm các vector sao cho tích vô
            hướng của hai vector xấp xỉ logarithm của số lần đồng xuất hiện.
          </li>
          <li>
            <strong>Tối ưu hóa:</strong> Sử dụng hàm mất mát có trọng số, ưu
            tiên các cặp từ đồng xuất hiện nhiều hơn.
          </li>
        </ol>
        <p>
          GloVe kết hợp ưu điểm của hai trường phái: phân tích ma trận toàn cục
          (như LSA) và học cửa sổ cục bộ (như Word2Vec), tạo ra embeddings chất
          lượng cao và ổn định.
        </p>
      </ExplanationSection>
    </>
  );
}
