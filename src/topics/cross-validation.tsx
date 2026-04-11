"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "cross-validation",
  title: "Cross-Validation",
  titleVi: "Kiểm chứng chéo",
  description: "Kỹ thuật đánh giá mô hình bằng cách chia dữ liệu thành nhiều fold để huấn luyện và kiểm tra",
  category: "classic-ml",
  tags: ["evaluation", "model-selection", "theory"],
  difficulty: "beginner",
  relatedSlugs: ["bias-variance", "confusion-matrix", "polynomial-regression"],
  vizType: "interactive",
};

const K = 5;
const foldColors = ["#3b82f6", "#f97316", "#22c55e", "#8b5cf6", "#ef4444"];
const scores = [0.85, 0.88, 0.82, 0.90, 0.86];

export default function CrossValidationTopic() {
  const [activeFold, setActiveFold] = useState(0);

  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang ôn thi bằng cách làm đề mẫu. Nếu bạn chỉ kiểm tra
          bằng một đề duy nhất, bạn không biết mình giỏi thực sự hay chỉ tình cờ đúng đề
          đó. Nhưng nếu bạn làm <strong>5 đề khác nhau</strong> và tính điểm trung bình,
          bạn sẽ biết năng lực thực sự hơn.
        </p>
        <p>
          <strong>Kiểm chứng chéo</strong> chia dữ liệu thành K phần, luân phiên dùng mỗi
          phần làm bộ kiểm tra, còn lại làm bộ huấn luyện. Kết quả trung bình từ K lần cho
          ước lượng đáng tin cậy hơn.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <p className="mb-3 text-sm text-muted">
          Nhấp vào từng fold (lượt) để xem phần nào dùng huấn luyện (xám), phần nào dùng
          kiểm tra (màu).
        </p>
        <svg
          viewBox="0 0 500 280"
          className="w-full rounded-lg border border-border bg-background"
        >
          <text x={250} y={20} fontSize={13} fill="currentColor" className="text-foreground" textAnchor="middle" fontWeight={600}>
            {K}-Fold Cross Validation
          </text>

          {/* Fold rows */}
          {Array.from({ length: K }, (_, fold) => {
            const y = 40 + fold * 40;
            const isActive = fold === activeFold;

            return (
              <g
                key={fold}
                className="cursor-pointer"
                onClick={() => setActiveFold(fold)}
                opacity={isActive ? 1 : 0.5}
              >
                {/* Fold label */}
                <text x={15} y={y + 18} fontSize={11} fill="currentColor" className="text-muted" fontWeight={isActive ? 700 : 400}>
                  Lượt {fold + 1}
                </text>

                {/* Data blocks */}
                {Array.from({ length: K }, (_, block) => {
                  const bx = 70 + block * 72;
                  const isTest = block === fold;
                  return (
                    <rect
                      key={block}
                      x={bx} y={y}
                      width={65} height={28}
                      rx={6}
                      fill={isTest ? foldColors[fold] : "#666"}
                      opacity={isTest ? 0.8 : 0.15}
                      stroke={isTest ? foldColors[fold] : "#666"}
                      strokeWidth={isTest ? 2 : 1}
                    />
                  );
                })}

                {/* Block labels */}
                {Array.from({ length: K }, (_, block) => {
                  const bx = 70 + block * 72 + 32;
                  const isTest = block === fold;
                  return (
                    <text
                      key={`label-${block}`}
                      x={bx} y={y + 18}
                      fontSize={10}
                      fill={isTest ? "#fff" : "#888"}
                      textAnchor="middle"
                      fontWeight={isTest ? 600 : 400}
                    >
                      {isTest ? "Test" : "Train"}
                    </text>
                  );
                })}

                {/* Score */}
                <text x={440} y={y + 18} fontSize={12} fill={foldColors[fold]} fontWeight={600}>
                  {(scores[fold] * 100).toFixed(0)}%
                </text>
              </g>
            );
          })}

          {/* Divider */}
          <line x1={70} y1={245} x2={430} y2={245} stroke="currentColor" className="text-border" strokeWidth={1} />

          {/* Average score */}
          <text x={250} y={270} fontSize={14} fill="#22c55e" textAnchor="middle" fontWeight={700}>
            Trung bình: {(avgScore * 100).toFixed(1)}%
          </text>
        </svg>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Kiểm chứng chéo K-Fold (K-Fold Cross-Validation)</strong> chia dữ liệu
          thành K phần bằng nhau. Trong mỗi lượt, một phần làm <strong>tập kiểm tra</strong>,
          K-1 phần còn lại làm <strong>tập huấn luyện</strong>. Lặp K lần và tính điểm
          trung bình.
        </p>
        <p>
          Ưu điểm: mọi mẫu đều được dùng để kiểm tra đúng một lần, cho ước lượng
          <strong> ổn định hơn</strong> so với chia train/test đơn giản. K phổ biến là 5
          hoặc 10. Trường hợp đặc biệt: <strong>Leave-One-Out</strong> (K = n).
        </p>
        <p>
          Cross-validation giúp <strong>so sánh mô hình</strong> và <strong>chọn siêu tham
          số</strong> (kết hợp với grid search). Lưu ý: với dữ liệu chuỗi thời gian, cần
          dùng <strong>time-series CV</strong> để tránh data leakage.
        </p>
      </ExplanationSection>
    </>
  );
}
