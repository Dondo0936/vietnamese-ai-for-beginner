"use client";

import { useState, useMemo } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "bag-of-words",
  title: "Bag of Words",
  titleVi: "Bag of Words - Túi từ",
  description:
    "Phương pháp biểu diễn văn bản đơn giản bằng cách đếm tần suất xuất hiện của mỗi từ, bỏ qua thứ tự.",
  category: "nlp",
  tags: ["nlp", "text-representation", "feature-extraction"],
  difficulty: "beginner",
  relatedSlugs: ["tokenization", "tf-idf", "word-embeddings"],
  vizType: "interactive",
};

export default function BagOfWordsTopic() {
  const [text, setText] = useState("tôi yêu học máy tôi yêu trí tuệ nhân tạo");

  const wordCounts = useMemo(() => {
    const words = text.toLowerCase().split(/\s+/).filter((w) => w.length > 0);
    const counts: Record<string, number> = {};
    for (const w of words) {
      counts[w] = (counts[w] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [text]);

  const maxCount = Math.max(...wordCounts.map(([, c]) => c), 1);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn có một <strong>túi kẹo nhiều màu</strong>. Bạn đổ
          hết ra bàn và <strong>đếm số lượng mỗi màu</strong>: 5 kẹo đỏ, 3 kẹo
          xanh, 2 kẹo vàng...
        </p>
        <p>
          Bag of Words làm tương tự với văn bản: đổ tất cả các từ vào một
          &quot;cái túi&quot;, <strong>đếm mỗi từ xuất hiện bao nhiêu lần</strong>,
          và hoàn toàn <strong>bỏ qua thứ tự</strong> của chúng.
        </p>
        <p>
          &quot;Tôi yêu mèo&quot; và &quot;Mèo yêu tôi&quot; cho ra kết quả giống nhau — giống
          như việc xáo trộn kẹo trong túi không thay đổi số lượng mỗi màu!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted">
              Nhập văn bản để đếm tần suất từ
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
              placeholder="Nhập câu bất kỳ..."
            />
          </div>

          <svg
            viewBox={`0 0 600 ${Math.max(wordCounts.length * 36 + 20, 80)}`}
            className="w-full max-w-2xl mx-auto"
          >
            {wordCounts.map(([word, count], i) => {
              const barWidth = (count / maxCount) * 380;
              const y = i * 36 + 10;
              return (
                <g key={word}>
                  <text
                    x="100"
                    y={y + 18}
                    textAnchor="end"
                    fill="#e2e8f0"
                    fontSize="13"
                    fontWeight="600"
                  >
                    {word}
                  </text>
                  <rect
                    x="110"
                    y={y + 4}
                    width={barWidth}
                    height="22"
                    rx="4"
                    fill="#3b82f6"
                    opacity={0.8}
                  />
                  <text
                    x={120 + barWidth}
                    y={y + 19}
                    fill="#94a3b8"
                    fontSize="12"
                    fontWeight="bold"
                  >
                    {count}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
            <p className="text-sm text-muted">
              Tổng số từ:{" "}
              <strong className="text-accent">
                {wordCounts.reduce((s, [, c]) => s + c, 0)}
              </strong>{" "}
              | Từ vựng:{" "}
              <strong className="text-accent">{wordCounts.length}</strong>
            </p>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Bag of Words (BoW)</strong> là một trong những phương pháp biểu
          diễn văn bản đơn giản nhất trong NLP. Ý tưởng chính là biến mỗi văn
          bản thành một vector đếm tần suất từ.
        </p>
        <p>Quy trình BoW gồm 3 bước:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Xây dựng từ vựng:</strong> Tập hợp tất cả các từ duy nhất
            xuất hiện trong toàn bộ tập dữ liệu.
          </li>
          <li>
            <strong>Đếm tần suất:</strong> Với mỗi văn bản, đếm số lần mỗi từ
            trong từ vựng xuất hiện.
          </li>
          <li>
            <strong>Tạo vector:</strong> Mỗi văn bản được biểu diễn bằng một
            vector có chiều bằng kích thước từ vựng.
          </li>
        </ol>
        <p>
          <strong>Ưu điểm:</strong> Đơn giản, dễ hiểu, hiệu quả cho phân loại
          văn bản cơ bản.{" "}
          <strong>Nhược điểm:</strong> Mất thông tin thứ tự từ, không nắm bắt
          được ngữ nghĩa, vector thưa (sparse) khi từ vựng lớn.
        </p>
      </ExplanationSection>
    </>
  );
}
