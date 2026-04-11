"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "rnn",
  title: "Recurrent Neural Network",
  titleVi: "Mạng nơ-ron hồi quy",
  description: "Kiến trúc xử lý dữ liệu tuần tự bằng cách truyền trạng thái ẩn qua các bước thời gian",
  category: "dl-architectures",
  tags: ["sequence", "nlp", "time-series"],
  difficulty: "intermediate",
  relatedSlugs: ["lstm", "gru", "transformer"],
  vizType: "interactive",
};

const words = ["Tôi", "thích", "học", "AI", "rất", "nhiều"];

export default function RnnTopic() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang đọc một câu chuyện. Khi đọc từ thứ 5, bạn vẫn nhớ
          nội dung từ đầu câu &mdash; bộ nhớ này giúp bạn hiểu ngữ cảnh. Nếu mỗi từ được
          xử lý riêng lẻ (không có bộ nhớ), bạn sẽ không hiểu được câu.
        </p>
        <p>
          <strong>RNN</strong> mô phỏng khả năng &quot;nhớ&quot; này: tại mỗi bước thời
          gian, nó nhận từ hiện tại VÀ <strong>trạng thái ẩn</strong> từ bước trước &mdash;
          như bạn nhớ những gì đã đọc.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <p className="mb-3 text-sm text-muted">
          Nhấp nút để truyền dữ liệu qua từng bước thời gian. Trạng thái ẩn (h) được
          truyền từ bước này sang bước tiếp theo.
        </p>
        <svg
          viewBox="0 0 500 220"
          className="w-full rounded-lg border border-border bg-background"
        >
          {words.map((word, i) => {
            const x = 25 + i * 78;
            const isActive = i <= activeStep;
            const isCurrent = i === activeStep;

            return (
              <g key={i} opacity={isActive ? 1 : 0.25}>
                {/* Input word */}
                <rect x={x} y={150} width={65} height={28} rx={6} fill="#3b82f6" opacity={0.15}
                  stroke="#3b82f6" strokeWidth={isCurrent ? 2 : 1} />
                <text x={x + 32} y={168} fontSize={12} fill="#3b82f6" textAnchor="middle" fontWeight={600}>
                  {word}
                </text>

                {/* Arrow up */}
                <line x1={x + 32} y1={148} x2={x + 32} y2={120} stroke={isActive ? "#888" : "#444"} strokeWidth={1.5} />
                <polygon points={`${x + 32},117 ${x + 28},123 ${x + 36},123`} fill={isActive ? "#888" : "#444"} />

                {/* RNN cell */}
                <rect x={x} y={75} width={65} height={40} rx={8}
                  fill={isCurrent ? "#f97316" : "#f97316"}
                  opacity={isCurrent ? 0.3 : 0.1}
                  stroke="#f97316" strokeWidth={isCurrent ? 2.5 : 1} />
                <text x={x + 32} y={99} fontSize={11} fill="#f97316" textAnchor="middle" fontWeight={600}>
                  RNN
                </text>

                {/* Hidden state arrow to right */}
                {i < words.length - 1 && (
                  <>
                    <line x1={x + 65} y1={95} x2={x + 78} y2={95}
                      stroke={isActive && i < activeStep ? "#22c55e" : "#444"}
                      strokeWidth={isActive && i < activeStep ? 2 : 1} />
                    <polygon
                      points={`${x + 80},95 ${x + 75},91 ${x + 75},99`}
                      fill={isActive && i < activeStep ? "#22c55e" : "#444"}
                    />
                  </>
                )}

                {/* h label */}
                <text x={x + 32} y={68} fontSize={10} fill="#22c55e" textAnchor="middle" fontWeight={600}>
                  h{i}
                </text>

                {/* Output arrow up */}
                <line x1={x + 32} y1={75} x2={x + 32} y2={48} stroke={isActive ? "#888" : "#444"} strokeWidth={1} />

                {/* Output */}
                <rect x={x + 8} y={22} width={50} height={24} rx={6}
                  fill="#8b5cf6" opacity={isCurrent ? 0.2 : 0.08}
                  stroke="#8b5cf6" strokeWidth={isCurrent ? 1.5 : 0.5} />
                <text x={x + 32} y={38} fontSize={10} fill="#8b5cf6" textAnchor="middle">
                  y{i}
                </text>
              </g>
            );
          })}

          {/* Label */}
          <text x={10} y={210} fontSize={10} fill="currentColor" className="text-muted">
            Bước: {activeStep + 1}/{words.length} | Trạng thái ẩn h{activeStep} mang thông tin từ tất cả các bước trước
          </text>
        </svg>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => setActiveStep(Math.min(words.length - 1, activeStep + 1))}
            disabled={activeStep >= words.length - 1}
            className="rounded-lg border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-white disabled:opacity-30"
          >
            Bước tiếp
          </button>
          <button
            onClick={() => setActiveStep(0)}
            className="rounded-lg border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-white"
          >
            Đặt lại
          </button>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>RNN (Recurrent Neural Network)</strong> xử lý dữ liệu tuần tự bằng cách
          duy trì <strong>trạng thái ẩn (hidden state)</strong> qua các bước thời gian.
          Công thức: <em>hₜ = f(Wₓxₜ + Wₕhₜ₋₁ + b)</em>.
        </p>
        <p>
          Trạng thái ẩn hₜ tóm tắt tất cả thông tin từ đầu chuỗi đến bước hiện tại. Tuy
          nhiên, RNN cơ bản gặp vấn đề <strong>gradient biến mất/bùng nổ</strong> &mdash;
          khó nhớ thông tin xa trong chuỗi dài.
        </p>
        <p>
          Giải pháp: dùng <strong>LSTM</strong> hoặc <strong>GRU</strong> với cơ chế cổng
          để kiểm soát luồng thông tin. Ngày nay, <strong>Transformer</strong> với
          self-attention đã thay thế RNN trong hầu hết bài toán NLP.
        </p>
      </ExplanationSection>
    </>
  );
}
