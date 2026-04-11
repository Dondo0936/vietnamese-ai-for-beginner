"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "lstm",
  title: "Long Short-Term Memory",
  titleVi: "Bộ nhớ dài-ngắn hạn",
  description: "Biến thể RNN với cơ chế cổng giúp nhớ thông tin dài hạn hiệu quả",
  category: "dl-architectures",
  tags: ["sequence", "nlp", "rnn"],
  difficulty: "advanced",
  relatedSlugs: ["rnn", "gru", "transformer"],
  vizType: "interactive",
};

const gates = [
  { id: "forget", name: "Cổng quên", nameEn: "Forget Gate", color: "#ef4444",
    desc: "Quyết định thông tin nào trong bộ nhớ cũ cần XÓA" },
  { id: "input", name: "Cổng nhập", nameEn: "Input Gate", color: "#22c55e",
    desc: "Quyết định thông tin MỚI nào cần GHI vào bộ nhớ" },
  { id: "output", name: "Cổng xuất", nameEn: "Output Gate", color: "#3b82f6",
    desc: "Quyết định phần nào của bộ nhớ được XUẤT ra làm output" },
];

export default function LstmTopic() {
  const [activeGate, setActiveGate] = useState<string | null>(null);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang ghi chép trong lớp học. Bạn có một <strong>cuốn vở</strong>
          (cell state &mdash; bộ nhớ dài hạn). Tại mỗi thời điểm, bạn phải quyết định 3
          việc:
        </p>
        <p>
          (1) <strong>Tẩy</strong> (cổng quên): xóa thông tin cũ không còn cần.
          (2) <strong>Viết</strong> (cổng nhập): ghi thông tin mới quan trọng.
          (3) <strong>Đọc</strong> (cổng xuất): chọn phần nào trong vở để trả lời câu hỏi.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <p className="mb-3 text-sm text-muted">
          Nhấp vào từng cổng để xem chức năng của nó trong ô LSTM.
        </p>
        <svg
          viewBox="0 0 500 280"
          className="w-full rounded-lg border border-border bg-background"
        >
          {/* Cell state (horizontal line) */}
          <line x1={30} y1={50} x2={470} y2={50} stroke="#f59e0b" strokeWidth={3} />
          <text x={250} y={35} fontSize={11} fill="#f59e0b" textAnchor="middle" fontWeight={600}>
            Cell State (Bộ nhớ dài hạn) C
          </text>

          {/* Arrow heads on cell state */}
          <polygon points="470,50 463,45 463,55" fill="#f59e0b" />

          {/* Hidden state (bottom line) */}
          <line x1={30} y1={220} x2={470} y2={220} stroke="#8b5cf6" strokeWidth={2} />
          <text x={250} y={250} fontSize={11} fill="#8b5cf6" textAnchor="middle" fontWeight={600}>
            Hidden State (Trạng thái ẩn) h
          </text>
          <polygon points="470,220 463,215 463,225" fill="#8b5cf6" />

          {/* Gates */}
          {gates.map((gate, i) => {
            const x = 90 + i * 130;
            const isActive = activeGate === gate.id;

            return (
              <g
                key={gate.id}
                className="cursor-pointer"
                onClick={() => setActiveGate(isActive ? null : gate.id)}
              >
                {/* Gate box */}
                <rect
                  x={x - 40} y={90} width={80} height={70} rx={10}
                  fill={gate.color} opacity={isActive ? 0.3 : 0.1}
                  stroke={gate.color} strokeWidth={isActive ? 3 : 1.5}
                />
                <text x={x} y={115} fontSize={11} fill={gate.color} textAnchor="middle" fontWeight={700}>
                  {gate.name}
                </text>
                <text x={x} y={132} fontSize={9} fill={gate.color} textAnchor="middle">
                  {gate.nameEn}
                </text>
                <text x={x} y={150} fontSize={16} fill={gate.color} textAnchor="middle">
                  &sigma;
                </text>

                {/* Connection to cell state */}
                <line x1={x} y1={90} x2={x} y2={55} stroke={gate.color} strokeWidth={1.5}
                  strokeDasharray={isActive ? "0" : "4 3"} opacity={isActive ? 1 : 0.4} />

                {/* Connection from hidden state */}
                <line x1={x} y1={160} x2={x} y2={215} stroke={gate.color} strokeWidth={1.5}
                  strokeDasharray={isActive ? "0" : "4 3"} opacity={isActive ? 1 : 0.4} />

                {/* Multiplication/Addition symbols on cell state */}
                <circle cx={x} cy={50} r={10} fill="white" stroke={gate.color} strokeWidth={1.5} />
                <text x={x} y={55} fontSize={14} fill={gate.color} textAnchor="middle" fontWeight={700}>
                  {i === 0 ? "&times;" : i === 1 ? "+" : "&times;"}
                </text>
              </g>
            );
          })}

          {/* Input */}
          <text x={50} y={275} fontSize={11} fill="currentColor" className="text-muted" textAnchor="middle">
            xₜ (Input)
          </text>
          <line x1={50} y1={262} x2={50} y2={225} stroke="#888" strokeWidth={1} />

          {/* Info box */}
          {activeGate && (
            <g>
              <rect x={50} y={170} width={400} height={28} rx={6} fill="currentColor" className="text-card" opacity={0.9}
                stroke={gates.find((g) => g.id === activeGate)!.color} strokeWidth={1} />
              <text x={250} y={188} fontSize={11}
                fill={gates.find((g) => g.id === activeGate)!.color}
                textAnchor="middle" fontWeight={600}>
                {gates.find((g) => g.id === activeGate)!.desc}
              </text>
            </g>
          )}
        </svg>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>LSTM (Long Short-Term Memory)</strong> giải quyết vấn đề gradient biến
          mất của RNN bằng cơ chế <strong>3 cổng</strong> và <strong>cell state</strong>
          riêng biệt.
        </p>
        <p>
          <strong>Cell state</strong> là &quot;băng chuyền&quot; thông tin chạy xuyên suốt
          chuỗi, chỉ bị thay đổi bởi các phép nhân/cộng có kiểm soát. Ba cổng (forget,
          input, output) đều dùng hàm sigmoid (0-1) để quyết định tỷ lệ thông tin được
          phép đi qua.
        </p>
        <p>
          LSTM xuất sắc trong: <strong>dịch máy</strong>, <strong>nhận diện giọng nói</strong>,
          <strong> phân tích chuỗi thời gian</strong>, <strong>sinh nhạc</strong>. Nhược
          điểm: chậm hơn do xử lý tuần tự, và đã phần lớn bị thay thế bởi Transformer
          trong NLP hiện đại.
        </p>
      </ExplanationSection>
    </>
  );
}
