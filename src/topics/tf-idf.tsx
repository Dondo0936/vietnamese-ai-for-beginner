"use client";

import { useState, useMemo } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "tf-idf",
  title: "TF-IDF",
  titleVi: "TF-IDF - Tần suất từ nghịch đảo tần suất tài liệu",
  description:
    "Phương pháp đánh giá mức độ quan trọng của một từ trong tài liệu so với toàn bộ tập dữ liệu.",
  category: "nlp",
  tags: ["nlp", "text-representation", "information-retrieval"],
  difficulty: "beginner",
  relatedSlugs: ["bag-of-words", "tokenization", "text-classification"],
  vizType: "interactive",
};

export default function TfIdfTopic() {
  const [tf, setTf] = useState(5);
  const [totalDocs, setTotalDocs] = useState(100);
  const [df, setDf] = useState(10);

  const idf = useMemo(() => Math.log(totalDocs / (df + 1)), [totalDocs, df]);
  const tfidf = useMemo(() => tf * idf, [tf, idf]);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang tìm <strong>đầu bếp giỏi nhất</strong> trong
          một cuộc thi nấu ăn. Nếu một đầu bếp dùng từ &quot;muối&quot; rất nhiều lần
          (TF cao), điều đó có nghĩa gì?
        </p>
        <p>
          Nếu <strong>tất cả đầu bếp</strong> đều nói về muối (DF cao), thì từ
          &quot;muối&quot; không đặc biệt gì. Nhưng nếu chỉ một đầu bếp nói nhiều về
          &quot;nghệ tây&quot; — một nguyên liệu hiếm — thì từ đó rất{" "}
          <strong>đặc trưng</strong> cho đầu bếp đó!
        </p>
        <p>
          TF-IDF kết hợp hai yếu tố: từ xuất hiện nhiều trong tài liệu (TF cao)
          nhưng hiếm trong toàn bộ tập dữ liệu (IDF cao) sẽ có{" "}
          <strong>điểm TF-IDF cao nhất</strong>.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted">
                TF (Tần suất từ): {tf}
              </label>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={tf}
                onChange={(e) => setTf(parseInt(e.target.value))}
                className="w-full accent-accent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted">
                Tổng tài liệu (N): {totalDocs}
              </label>
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={totalDocs}
                onChange={(e) => setTotalDocs(parseInt(e.target.value))}
                className="w-full accent-accent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted">
                DF (Số tài liệu chứa từ): {df}
              </label>
              <input
                type="range"
                min="1"
                max={totalDocs}
                step="1"
                value={Math.min(df, totalDocs)}
                onChange={(e) => setDf(parseInt(e.target.value))}
                className="w-full accent-accent"
              />
            </div>
          </div>

          <svg viewBox="0 0 600 200" className="w-full max-w-2xl mx-auto">
            {/* TF box */}
            <rect x="40" y="60" width="120" height="60" rx="8" fill="#3b82f6" opacity={0.8} />
            <text x="100" y="85" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">
              TF = {tf}
            </text>
            <text x="100" y="105" textAnchor="middle" fill="white" fontSize="10">
              Tần suất từ
            </text>

            {/* Multiply */}
            <text x="200" y="95" textAnchor="middle" fill="#94a3b8" fontSize="24" fontWeight="bold">
              &times;
            </text>

            {/* IDF box */}
            <rect x="240" y="60" width="120" height="60" rx="8" fill="#8b5cf6" opacity={0.8} />
            <text x="300" y="85" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">
              IDF = {idf.toFixed(2)}
            </text>
            <text x="300" y="105" textAnchor="middle" fill="white" fontSize="10">
              log(N/DF)
            </text>

            {/* Equals */}
            <text x="400" y="95" textAnchor="middle" fill="#94a3b8" fontSize="24" fontWeight="bold">
              =
            </text>

            {/* Result box */}
            <rect
              x="430"
              y="60"
              width="140"
              height="60"
              rx="8"
              fill={tfidf > 10 ? "#22c55e" : tfidf > 5 ? "#f59e0b" : "#ef4444"}
              opacity={0.9}
            />
            <text x="500" y="85" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
              TF-IDF = {tfidf.toFixed(2)}
            </text>
            <text x="500" y="105" textAnchor="middle" fill="white" fontSize="10">
              {tfidf > 10 ? "Rất quan trọng" : tfidf > 5 ? "Quan trọng vừa" : "Ít quan trọng"}
            </text>

            {/* Formula */}
            <text x="300" y="170" textAnchor="middle" fill="#64748b" fontSize="11">
              TF-IDF = TF &times; log(N / DF) = {tf} &times; log({totalDocs} / {df}) = {tfidf.toFixed(2)}
            </text>
          </svg>

          <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
            <p className="text-sm text-muted">
              Khi DF tăng (từ phổ biến hơn), IDF giảm → TF-IDF giảm. Từ hiếm
              có giá trị phân biệt cao hơn!
            </p>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>TF-IDF</strong> (Term Frequency - Inverse Document Frequency)
          là phương pháp đánh giá mức độ quan trọng của một từ trong tài liệu
          so với toàn bộ tập dữ liệu (corpus).
        </p>
        <p>Công thức gồm hai phần:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>TF (Term Frequency):</strong> Số lần từ xuất hiện trong tài
            liệu. Từ xuất hiện nhiều hơn có TF cao hơn.
          </li>
          <li>
            <strong>IDF (Inverse Document Frequency):</strong> log(N / DF),
            trong đó N là tổng số tài liệu, DF là số tài liệu chứa từ đó. Từ
            xuất hiện ở ít tài liệu có IDF cao hơn.
          </li>
        </ol>
        <p>
          TF-IDF được sử dụng rộng rãi trong <strong>tìm kiếm thông tin</strong>,{" "}
          <strong>phân loại văn bản</strong> và <strong>trích xuất từ khóa</strong>.
          Nó giải quyết nhược điểm của Bag of Words bằng cách giảm trọng số của
          các từ phổ biến như &quot;và&quot;, &quot;là&quot;, &quot;của&quot;.
        </p>
      </ExplanationSection>
    </>
  );
}
