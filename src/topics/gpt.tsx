"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "gpt",
  title: "GPT",
  titleVi: "GPT - Mô hình ngôn ngữ tự hồi quy",
  description:
    "Mô hình ngôn ngữ sinh văn bản bằng cách dự đoán từ tiếp theo dựa trên các từ trước đó, nền tảng của ChatGPT.",
  category: "nlp",
  tags: ["nlp", "transformer", "language-model"],
  difficulty: "advanced",
  relatedSlugs: ["transformer", "attention-mechanism", "bert"],
  vizType: "interactive",
};

const SEQUENCE = ["Trí", "tuệ", "nhân", "tạo", "đang", "thay", "đổi", "thế", "giới"];

export default function GptTopic() {
  const [genIdx, setGenIdx] = useState(3);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang chơi trò <strong>nối từ</strong>: một người
          nói &quot;Trí tuệ nhân...&quot; và bạn phải đoán từ tiếp theo. Dựa vào những
          từ đã nói, bạn đoán &quot;tạo&quot;!
        </p>
        <p>
          GPT hoạt động đúng như vậy — nó luôn nhìn{" "}
          <strong>từ trái sang phải</strong>, dự đoán từ tiếp theo dựa trên tất
          cả các từ trước đó. Giống như người kể chuyện{" "}
          <strong>không bao giờ nhìn trước</strong>, chỉ dựa vào những gì đã
          nói để tiếp tục câu chuyện.
        </p>
        <p>
          Cách tiếp cận đơn giản này — chỉ dự đoán từ tiếp theo — lại tạo ra
          những mô hình <strong>mạnh mẽ đáng kinh ngạc</strong> khi được huấn
          luyện trên đủ dữ liệu!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted">
              Số từ đã sinh: {genIdx + 1} / {SEQUENCE.length}
            </label>
            <input
              type="range"
              min="0"
              max={SEQUENCE.length - 1}
              step="1"
              value={genIdx}
              onChange={(e) => setGenIdx(parseInt(e.target.value))}
              className="w-full accent-accent"
            />
          </div>

          <svg viewBox="0 0 600 220" className="w-full max-w-2xl mx-auto">
            {/* Generated tokens */}
            {SEQUENCE.map((word, i) => {
              const isGenerated = i <= genIdx;
              const isCurrent = i === genIdx;
              const isNext = i === genIdx + 1;
              const x = 30 + i * 62;
              return (
                <g key={i}>
                  <rect
                    x={x}
                    y="30"
                    width="55"
                    height="30"
                    rx="6"
                    fill={isGenerated ? "#22c55e" : isNext ? "#f59e0b" : "#1e293b"}
                    stroke={isCurrent ? "#4ade80" : isNext ? "#f59e0b" : "#334155"}
                    strokeWidth={isCurrent || isNext ? 2 : 1}
                    opacity={isGenerated ? 1 : isNext ? 0.6 : 0.3}
                  />
                  <text
                    x={x + 27}
                    y="50"
                    textAnchor="middle"
                    fill={isGenerated ? "white" : isNext ? "#f59e0b" : "#475569"}
                    fontSize="11"
                    fontWeight={isGenerated ? "bold" : "normal"}
                  >
                    {isGenerated ? word : isNext ? "?" : "..."}
                  </text>
                  {isNext && (
                    <text x={x + 27} y="75" textAnchor="middle" fill="#f59e0b" fontSize="9">
                      Dự đoán
                    </text>
                  )}
                </g>
              );
            })}

            {/* Causal mask visualization */}
            <text x="300" y="110" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="bold">
              Mặt nạ nhân quả (Causal Mask)
            </text>

            {/* Mini attention grid */}
            {[0, 1, 2, 3, 4].map((row) =>
              [0, 1, 2, 3, 4].map((col) => {
                const visible = col <= row;
                const size = 22;
                const gx = 190 + col * (size + 4);
                const gy = 120 + row * (size + 4);
                return (
                  <rect
                    key={`mask-${row}-${col}`}
                    x={gx}
                    y={gy}
                    width={size}
                    height={size}
                    rx="3"
                    fill={visible ? "#22c55e" : "#1e293b"}
                    opacity={visible ? 0.6 : 0.2}
                    stroke="#334155"
                    strokeWidth="0.5"
                  />
                );
              })
            )}

            <text x="390" y="145" fill="#64748b" fontSize="9">
              Xanh = có thể nhìn thấy
            </text>
            <text x="390" y="160" fill="#64748b" fontSize="9">
              Tối = bị che (tương lai)
            </text>
          </svg>

          <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
            <p className="text-sm text-muted">
              GPT sinh văn bản <strong>từ trái sang phải</strong>, mỗi lần một
              token. Mặt nạ nhân quả đảm bảo mô hình{" "}
              <strong className="text-accent">không nhìn vào tương lai</strong>.
            </p>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>GPT</strong> (Generative Pre-trained Transformer) là mô hình
          ngôn ngữ tự hồi quy của OpenAI, sử dụng Transformer Decoder. Khác
          với BERT (hai chiều), GPT chỉ đọc từ trái sang phải.
        </p>
        <p>Các đặc điểm chính:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Tự hồi quy (Autoregressive):</strong> Dự đoán từ tiếp theo
            dựa trên tất cả các từ trước đó. P(từ_t | từ_1, từ_2, ..., từ_t-1).
          </li>
          <li>
            <strong>Mặt nạ nhân quả (Causal Mask):</strong> Mỗi token chỉ được
            nhìn các token trước nó, ngăn chặn &quot;rò rỉ thông tin từ tương lai&quot;.
          </li>
          <li>
            <strong>Mở rộng quy mô (Scaling):</strong> GPT-2 (1.5B), GPT-3
            (175B), GPT-4 — càng nhiều tham số và dữ liệu, mô hình càng mạnh.
          </li>
        </ol>
        <p>
          GPT chứng minh rằng một mục tiêu huấn luyện đơn giản — dự đoán từ
          tiếp theo — khi kết hợp với <strong>quy mô lớn</strong>, có thể tạo
          ra mô hình có khả năng suy luận, viết văn và giải quyết nhiều tác vụ
          khác nhau.
        </p>
      </ExplanationSection>
    </>
  );
}
