"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "word2vec",
  title: "Word2Vec",
  titleVi: "Word2Vec - Từ thành vector",
  description:
    "Mô hình học biểu diễn từ bằng cách dự đoán từ dựa trên ngữ cảnh xung quanh, sử dụng cửa sổ trượt.",
  category: "nlp",
  tags: ["nlp", "representation-learning", "embedding"],
  difficulty: "intermediate",
  relatedSlugs: ["word-embeddings", "glove", "tokenization"],
  vizType: "interactive",
};

const SENTENCE = ["Tôi", "yêu", "học", "trí", "tuệ", "nhân", "tạo", "rất", "nhiều"];

export default function Word2VecTopic() {
  const [centerIdx, setCenterIdx] = useState(4);
  const [windowSize, setWindowSize] = useState(2);

  const contextStart = Math.max(0, centerIdx - windowSize);
  const contextEnd = Math.min(SENTENCE.length - 1, centerIdx + windowSize);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang đọc một cuốn sách và gặp một từ lạ. Bạn
          không biết từ đó nghĩa gì, nhưng bạn nhìn{" "}
          <strong>các từ xung quanh</strong> để đoán nghĩa.
        </p>
        <p>
          Word2Vec hoạt động tương tự: nó học nghĩa của từ bằng cách nhìn
          &quot;hàng xóm&quot; của từ đó. Giống như câu nói{" "}
          <strong>&quot;Hãy cho tôi biết bạn chơi với ai, tôi sẽ nói bạn là ai&quot;</strong>{" "}
          — từ ngữ cũng được hiểu qua bạn đồng hành của chúng!
        </p>
        <p>
          Cửa sổ trượt (window) quyết định bạn nhìn bao xa sang hai bên — cửa
          sổ nhỏ nắm bắt cú pháp, cửa sổ lớn nắm bắt ngữ nghĩa.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted">
              Kích thước cửa sổ: {windowSize}
            </label>
            <input
              type="range"
              min="1"
              max="4"
              step="1"
              value={windowSize}
              onChange={(e) => setWindowSize(parseInt(e.target.value))}
              className="w-full accent-accent"
            />
          </div>

          <svg viewBox="0 0 600 180" className="w-full max-w-2xl mx-auto">
            {/* Window highlight */}
            {(() => {
              const startX = contextStart * 65 + 10;
              const endX = (contextEnd + 1) * 65 + 5;
              return (
                <rect
                  x={startX}
                  y="20"
                  width={endX - startX}
                  height="50"
                  rx="8"
                  fill="#3b82f6"
                  opacity={0.1}
                  stroke="#3b82f6"
                  strokeWidth="1.5"
                  strokeDasharray="4,3"
                />
              );
            })()}

            {/* Words */}
            {SENTENCE.map((word, i) => {
              const isCenter = i === centerIdx;
              const isContext = i >= contextStart && i <= contextEnd && !isCenter;
              const x = i * 65 + 35;
              return (
                <g
                  key={i}
                  onClick={() => setCenterIdx(i)}
                  style={{ cursor: "pointer" }}
                >
                  <rect
                    x={x - 28}
                    y="30"
                    width="56"
                    height="30"
                    rx="6"
                    fill={isCenter ? "#ef4444" : isContext ? "#3b82f6" : "#1e293b"}
                    stroke={isCenter ? "#ef4444" : isContext ? "#3b82f6" : "#475569"}
                    strokeWidth="1.5"
                  />
                  <text
                    x={x}
                    y="50"
                    textAnchor="middle"
                    fill="white"
                    fontSize="11"
                    fontWeight={isCenter || isContext ? "bold" : "normal"}
                  >
                    {word}
                  </text>
                  {isCenter && (
                    <text x={x} y="78" textAnchor="middle" fill="#ef4444" fontSize="9">
                      Từ trung tâm
                    </text>
                  )}
                  {isContext && (
                    <text x={x} y="78" textAnchor="middle" fill="#3b82f6" fontSize="9">
                      Ngữ cảnh
                    </text>
                  )}
                </g>
              );
            })}

            {/* Architecture diagram below */}
            <rect x="180" y="110" width="100" height="30" rx="6" fill="#ef4444" opacity={0.8} />
            <text x="230" y="130" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
              Từ trung tâm
            </text>
            <line x1="230" y1="140" x2="230" y2="155" stroke="#475569" strokeWidth="1.5" />
            <text x="230" y="170" textAnchor="middle" fill="#94a3b8" fontSize="10">
              Dự đoán ngữ cảnh (Skip-gram)
            </text>

            <rect x="350" y="110" width="100" height="30" rx="6" fill="#3b82f6" opacity={0.8} />
            <text x="400" y="130" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
              Ngữ cảnh
            </text>
            <line x1="400" y1="140" x2="400" y2="155" stroke="#475569" strokeWidth="1.5" />
            <text x="400" y="170" textAnchor="middle" fill="#94a3b8" fontSize="10">
              Dự đoán từ trung tâm (CBOW)
            </text>
          </svg>

          <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
            <p className="text-sm text-muted">
              Nhấn vào từ bất kỳ để chọn làm từ trung tâm. Cửa sổ hiện tại:{" "}
              <strong className="text-accent">{windowSize}</strong> từ mỗi bên.
            </p>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Word2Vec</strong> là mô hình do Google phát triển năm 2013, học
          biểu diễn vector cho từ ngữ dựa trên nguyên tắc &quot;từ ngữ được hiểu qua
          ngữ cảnh xung quanh&quot;.
        </p>
        <p>Word2Vec có hai kiến trúc:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Skip-gram:</strong> Cho từ trung tâm, dự đoán các từ ngữ
            cảnh xung quanh. Hoạt động tốt với từ hiếm, tập dữ liệu nhỏ.
          </li>
          <li>
            <strong>CBOW (Continuous Bag of Words):</strong> Cho các từ ngữ
            cảnh, dự đoán từ trung tâm. Nhanh hơn, tốt với từ phổ biến.
          </li>
        </ol>
        <p>
          Cửa sổ trượt (window) quyết định phạm vi ngữ cảnh. Cửa sổ nhỏ
          (2-3) nắm bắt quan hệ cú pháp (danh từ-tính từ), cửa sổ lớn (5-10)
          nắm bắt quan hệ ngữ nghĩa (đồng nghĩa).
        </p>
      </ExplanationSection>
    </>
  );
}
