"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "guardrails",
  title: "Guardrails",
  titleVi: "Rào chắn an toàn cho AI",
  description:
    "Cơ chế kiểm soát đầu vào và đầu ra của mô hình AI để ngăn chặn nội dung độc hại hoặc hành vi ngoài phạm vi.",
  category: "ai-safety",
  tags: ["guardrails", "safety", "filtering", "moderation"],
  difficulty: "intermediate",
  relatedSlugs: ["alignment", "red-teaming", "constitutional-ai"],
  vizType: "interactive",
};

const EXAMPLES = [
  { input: "Cho tôi công thức bánh flan", safe: true, reason: "Yêu cầu hợp lệ — nấu ăn" },
  { input: "Cách hack tài khoản ngân hàng", safe: false, reason: "Vi phạm: hướng dẫn hoạt động bất hợp pháp" },
  { input: "Giải thích nguyên lý hoá học", safe: true, reason: "Yêu cầu hợp lệ — giáo dục" },
  { input: "Viết email lừa đảo mạo danh", safe: false, reason: "Vi phạm: hỗ trợ lừa đảo" },
];

export default function GuardrailsTopic() {
  const [selectedEx, setSelectedEx] = useState(0);
  const ex = EXAMPLES[selectedEx];

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng <strong>lan can trên cầu</strong>. Lan can không ngăn bạn đi qua cầu
          — nó chỉ <strong>ngăn bạn rơi xuống vực</strong>. Bạn vẫn tự do di chuyển trên cầu,
          nhưng khi lệch quá gần rìa, lan can sẽ giữ bạn an toàn.
        </p>
        <p>
          <strong>Guardrails</strong> cho AI hoạt động tương tự — không hạn chế mọi câu trả lời
          mà chỉ <strong>ngăn chặn nội dung nguy hiểm</strong>: bạo lực, lừa đảo, thông tin sai...
          AI vẫn tự do trả lời hàng triệu câu hỏi hữu ích khác.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((e, i) => (
              <button
                key={i}
                onClick={() => setSelectedEx(i)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  selectedEx === i
                    ? "bg-accent text-white"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                Ví dụ {i + 1}
              </button>
            ))}
          </div>
          <svg viewBox="0 0 600 180" className="w-full max-w-2xl mx-auto">
            {/* Input */}
            <rect x={20} y={60} width={150} height={50} rx={8} fill="#3b82f6" />
            <text x={95} y={82} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold">Đầu vào</text>
            <text x={95} y={98} textAnchor="middle" fill="#bfdbfe" fontSize={7}>
              {ex.input.length > 25 ? ex.input.slice(0, 25) + "..." : ex.input}
            </text>

            {/* Guardrail */}
            <line x1={170} y1={85} x2={220} y2={85} stroke="#475569" strokeWidth={2} />
            <rect x={220} y={50} width={160} height={70} rx={12} fill="#1e293b" stroke={ex.safe ? "#22c55e" : "#ef4444"} strokeWidth={3} />
            <text x={300} y={75} textAnchor="middle" fill="white" fontSize={11} fontWeight="bold">Rào chắn</text>
            <text x={300} y={95} textAnchor="middle" fill={ex.safe ? "#22c55e" : "#ef4444"} fontSize={10} fontWeight="bold">
              {ex.safe ? "✓ CHO PHÉP" : "✗ CHẶN"}
            </text>

            {/* Output */}
            <line x1={380} y1={85} x2={430} y2={85} stroke={ex.safe ? "#22c55e" : "#ef4444"} strokeWidth={2} />
            <rect x={430} y={60} width={150} height={50} rx={8} fill={ex.safe ? "#22c55e" : "#ef4444"} opacity={0.8} />
            <text x={505} y={82} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">
              {ex.safe ? "Trả lời" : "Từ chối"}
            </text>
          </svg>
          <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
            <p className="text-sm text-muted">{ex.reason}</p>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Guardrails</strong> (Rào chắn an toàn) là các cơ chế kiểm soát được đặt
          trước và sau mô hình AI để đảm bảo đầu ra an toàn, chính xác và phù hợp.
        </p>
        <p>Hai loại rào chắn chính:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Rào chắn đầu vào (Input Guards):</strong> Lọc và kiểm tra câu hỏi
            trước khi gửi cho mô hình — phát hiện prompt injection, nội dung độc hại.
          </li>
          <li>
            <strong>Rào chắn đầu ra (Output Guards):</strong> Kiểm tra phản hồi của mô hình
            trước khi gửi cho người dùng — loại bỏ thông tin sai, nội dung nhạy cảm.
          </li>
        </ol>
        <p>
          Các framework phổ biến: <strong>NeMo Guardrails</strong> (NVIDIA),
          <strong> Guardrails AI</strong>, và các bộ lọc tích hợp của OpenAI, Anthropic.
          Guardrails là tuyến phòng thủ quan trọng trong hệ thống AI sản phẩm.
        </p>
      </ExplanationSection>
    </>
  );
}
