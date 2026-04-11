"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "context-window",
  title: "Context Window",
  titleVi: "Cửa sổ ngữ cảnh",
  description:
    "Giới hạn số lượng token mà mô hình có thể xử lý cùng lúc, ảnh hưởng đến khả năng hiểu ngữ cảnh.",
  category: "llm-concepts",
  tags: ["context-window", "tokens", "attention", "llm"],
  difficulty: "beginner",
  relatedSlugs: ["self-attention", "multi-head-attention", "llm-overview"],
  vizType: "interactive",
};

const TOKENS = [
  "Hôm", "nay", "trời", "đẹp", ",", "tôi", "đi", "dạo",
  "trong", "công", "viên", "và", "ngắm", "hoa", "anh", "đào",
  "nở", "rất", "đẹp", ".", "Sau", "đó", ",", "tôi",
  "uống", "cà", "phê", ".", "Cuối", "cùng", ",", "tôi",
];

export default function ContextWindowTopic() {
  const [windowSize, setWindowSize] = useState(8);
  const [focusIdx, setFocusIdx] = useState(12);

  const windowStart = Math.max(0, focusIdx - Math.floor(windowSize / 2));
  const windowEnd = Math.min(TOKENS.length, windowStart + windowSize);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang đọc một cuốn sách dài qua{" "}
          <strong>một ô cửa sổ nhỏ</strong>. Bạn chỉ có thể nhìn thấy một vài dòng
          cùng lúc &mdash; phần trước đó đã trượt qua và không còn nhìn thấy nữa.
        </p>
        <p>
          Nếu ô cửa sổ <strong>nhỏ</strong>, bạn dễ quên nội dung phía trước. Nếu
          ô cửa sổ <strong>lớn</strong>, bạn nhớ nhiều ngữ cảnh hơn nhưng cần nhiều
          sức lực hơn để xử lý.
        </p>
        <p>
          Context window của LLM cũng tương tự: nó giới hạn bao nhiêu thông tin mô
          hình có thể &quot;nhìn thấy&quot; cùng lúc khi sinh văn bản.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          {/* Controls */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted">
                Kích thước cửa sổ: {windowSize} token
              </label>
              <input
                type="range" min="3" max="16" step="1" value={windowSize}
                onChange={(e) => setWindowSize(parseInt(e.target.value))}
                className="w-full accent-accent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted">
                Vị trí focus: token {focusIdx + 1}
              </label>
              <input
                type="range" min="0" max={TOKENS.length - 1} step="1" value={focusIdx}
                onChange={(e) => setFocusIdx(parseInt(e.target.value))}
                className="w-full accent-accent"
              />
            </div>
          </div>

          {/* Attention heatmap */}
          <svg viewBox="0 0 700 200" className="w-full max-w-3xl mx-auto">
            <text x="350" y="18" textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="bold">
              Cửa sổ ngữ cảnh &mdash; Token đang xem: &quot;{TOKENS[focusIdx]}&quot;
            </text>

            {TOKENS.map((token, i) => {
              const inWindow = i >= windowStart && i < windowEnd;
              const isFocus = i === focusIdx;
              const distance = Math.abs(i - focusIdx);
              const attention = inWindow ? Math.max(0.15, 1 - distance * 0.15) : 0;
              const x = 10 + (i % 16) * 42;
              const y = 35 + Math.floor(i / 16) * 80;

              return (
                <g key={i} onClick={() => setFocusIdx(i)} className="cursor-pointer">
                  <rect
                    x={x} y={y} width="38" height="28" rx="4"
                    fill={isFocus ? "#3b82f6" : inWindow ? `rgba(59,130,246,${attention})` : "#1e293b"}
                    stroke={isFocus ? "#60a5fa" : inWindow ? "#3b82f6" : "#334155"}
                    strokeWidth={isFocus ? 2 : 1}
                  />
                  <text
                    x={x + 19} y={y + 18}
                    textAnchor="middle"
                    fill={inWindow ? "#e2e8f0" : "#475569"}
                    fontSize="8"
                  >
                    {token}
                  </text>
                  {/* Attention intensity */}
                  {inWindow && !isFocus && (
                    <rect
                      x={x} y={y + 30} width={38 * attention} height="3" rx="1.5"
                      fill="#3b82f6" opacity={0.7}
                    />
                  )}
                </g>
              );
            })}

            {/* Window bracket */}
            <rect
              x={10 + (windowStart % 16) * 42 - 2}
              y={33 + Math.floor(windowStart / 16) * 80}
              width={Math.min(windowSize, 16 - (windowStart % 16)) * 42 + 4}
              height="38"
              rx="6"
              fill="none"
              stroke="#22c55e"
              strokeWidth="2"
              strokeDasharray="4,3"
            />
          </svg>

          {/* Info */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className="text-lg font-bold text-blue-400">{windowSize}</p>
              <p className="text-xs text-muted">Token trong cửa sổ</p>
            </div>
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className="text-lg font-bold text-green-400">{TOKENS[focusIdx]}</p>
              <p className="text-xs text-muted">Token đang focus</p>
            </div>
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className="text-lg font-bold text-yellow-400">{TOKENS.length - windowSize}</p>
              <p className="text-xs text-muted">Token ngoài tầm nhìn</p>
            </div>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Cửa sổ ngữ cảnh</strong> (Context Window) là số lượng token tối đa mà
          mô hình có thể xử lý trong một lần suy luận, bao gồm cả đầu vào (prompt) và
          đầu ra (phản hồi).
        </p>
        <p>Ý nghĩa thực tế:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Giới hạn bộ nhớ:</strong> Thông tin ngoài cửa sổ hoàn toàn &quot;vô
            hình&quot; với mô hình &mdash; nó không thể truy cập hay nhớ.
          </li>
          <li>
            <strong>Chi phí tính toán:</strong> Attention có độ phức tạp O(n&sup2;) theo
            kích thước cửa sổ, nên cửa sổ lớn đòi hỏi nhiều bộ nhớ và thời gian.
          </li>
          <li>
            <strong>Xu hướng phát triển:</strong> Các mô hình hiện đại liên tục mở rộng
            context window: GPT-4 Turbo (128K), Claude (200K), Gemini (1M+).
          </li>
        </ol>
        <p>
          Các kỹ thuật mở rộng context window bao gồm <strong>RoPE</strong>,{" "}
          <strong>ALiBi</strong>, <strong>Ring Attention</strong> và{" "}
          <strong>Sliding Window Attention</strong>.
        </p>
      </ExplanationSection>
    </>
  );
}
