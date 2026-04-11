"use client";

import { useState, useMemo } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "attention-mechanism",
  title: "Attention Mechanism",
  titleVi: "Attention - Cơ chế chú ý",
  description:
    "Cơ chế cho phép mô hình tập trung vào các phần quan trọng nhất của đầu vào khi tạo ra mỗi phần đầu ra.",
  category: "nlp",
  tags: ["nlp", "attention", "architecture"],
  difficulty: "intermediate",
  relatedSlugs: ["seq2seq", "self-attention", "transformer"],
  vizType: "interactive",
};

const SOURCE = ["Tôi", "yêu", "Việt", "Nam"];
const TARGET = ["I", "love", "Vietnam"];

const SCORES: number[][] = [
  [0.85, 0.05, 0.05, 0.05],
  [0.05, 0.80, 0.10, 0.05],
  [0.02, 0.03, 0.50, 0.45],
];

export default function AttentionMechanismTopic() {
  const [targetIdx, setTargetIdx] = useState(0);

  const scores = useMemo(() => SCORES[targetIdx], [targetIdx]);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang ở <strong>tiệc buffet</strong> với hàng
          trăm món ăn. Bạn không thể ăn tất cả, nên bạn{" "}
          <strong>tập trung vào những món hấp dẫn nhất</strong> — đó là Attention!
        </p>
        <p>
          Khi dịch từ &quot;Vietnam&quot;, phiên dịch viên không cần nhớ cả câu tiếng
          Việt mà chỉ cần <strong>chú ý đặc biệt</strong> vào &quot;Việt&quot; và &quot;Nam&quot;.
          Mỗi từ đầu ra có một &quot;bản đồ chú ý&quot; riêng, cho biết nó đang nhìn
          vào đâu trong câu đầu vào.
        </p>
        <p>
          Cơ chế Attention giải quyết vấn đề &quot;quên&quot; của Seq2Seq bằng cách
          cho phép decoder <strong>nhìn trực tiếp</strong> vào mọi vị trí trong
          câu nguồn.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          <div className="flex gap-2 justify-center">
            {TARGET.map((word, i) => (
              <button
                key={word}
                onClick={() => setTargetIdx(i)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  targetIdx === i
                    ? "bg-accent text-white"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                {word}
              </button>
            ))}
          </div>

          <svg viewBox="0 0 600 280" className="w-full max-w-2xl mx-auto">
            {/* Source tokens (top) */}
            <text x="300" y="20" textAnchor="middle" fill="#94a3b8" fontSize="11">
              Câu nguồn (Tiếng Việt)
            </text>
            {SOURCE.map((word, i) => (
              <g key={`src-${word}`}>
                <rect
                  x={100 + i * 110}
                  y="30"
                  width="80"
                  height="35"
                  rx="6"
                  fill="#3b82f6"
                  opacity={0.3 + scores[i] * 0.7}
                />
                <text
                  x={140 + i * 110}
                  y="52"
                  textAnchor="middle"
                  fill="white"
                  fontSize="13"
                  fontWeight="bold"
                >
                  {word}
                </text>
              </g>
            ))}

            {/* Attention lines */}
            {SOURCE.map((_, i) => (
              <line
                key={`line-${i}`}
                x1={140 + i * 110}
                y1="65"
                x2={140 + targetIdx * 110}
                y2="180"
                stroke="#f59e0b"
                strokeWidth={scores[i] * 6 + 0.5}
                opacity={scores[i] * 0.9 + 0.1}
              />
            ))}

            {/* Attention scores */}
            {SOURCE.map((_, i) => (
              <g key={`score-${i}`}>
                <rect
                  x={110 + i * 110}
                  y="100"
                  width="60"
                  height="24"
                  rx="4"
                  fill="#1e293b"
                  stroke="#334155"
                  strokeWidth="1"
                />
                <text
                  x={140 + i * 110}
                  y="116"
                  textAnchor="middle"
                  fill={scores[i] > 0.3 ? "#f59e0b" : "#64748b"}
                  fontSize="11"
                  fontWeight="bold"
                >
                  {scores[i].toFixed(2)}
                </text>
              </g>
            ))}

            {/* Target token (bottom) */}
            <text x="300" y="175" textAnchor="middle" fill="#94a3b8" fontSize="11">
              Từ đang giải mã
            </text>
            <rect
              x={100 + targetIdx * 110}
              y="180"
              width="80"
              height="35"
              rx="6"
              fill="#22c55e"
            />
            <text
              x={140 + targetIdx * 110}
              y="202"
              textAnchor="middle"
              fill="white"
              fontSize="13"
              fontWeight="bold"
            >
              {TARGET[targetIdx]}
            </text>

            <text x="300" y="260" textAnchor="middle" fill="#64748b" fontSize="10">
              Độ dày đường = mức độ chú ý (attention weight)
            </text>
          </svg>

          <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
            <p className="text-sm text-muted">
              Khi giải mã &quot;<strong className="text-accent">{TARGET[targetIdx]}</strong>&quot;,
              mô hình chú ý nhiều nhất vào:{" "}
              <strong className="text-accent">
                {SOURCE[scores.indexOf(Math.max(...scores))]}
              </strong>{" "}
              (trọng số {Math.max(...scores).toFixed(2)})
            </p>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Cơ chế Attention</strong> được giới thiệu bởi Bahdanau và
          cộng sự năm 2014, cho phép mô hình &quot;nhìn lại&quot; toàn bộ chuỗi đầu
          vào khi tạo mỗi token đầu ra, thay vì chỉ dựa vào vector ngữ cảnh
          cố định.
        </p>
        <p>Cơ chế hoạt động qua 3 bước:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Tính điểm alignment:</strong> So sánh trạng thái decoder
            hiện tại với mỗi trạng thái encoder để tính mức độ liên quan.
          </li>
          <li>
            <strong>Chuẩn hóa bằng softmax:</strong> Chuyển điểm thành phân
            phối xác suất (tổng bằng 1), gọi là attention weights.
          </li>
          <li>
            <strong>Tổng có trọng số:</strong> Kết hợp các trạng thái encoder
            theo trọng số attention để tạo context vector mới cho mỗi bước
            giải mã.
          </li>
        </ol>
        <p>
          Attention là nền tảng cho kiến trúc <strong>Transformer</strong>,
          loại bỏ hoàn toàn RNN và đạt hiệu suất vượt trội trong mọi tác vụ NLP.
        </p>
      </ExplanationSection>
    </>
  );
}
