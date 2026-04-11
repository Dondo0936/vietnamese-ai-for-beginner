"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "gru",
  title: "Gated Recurrent Unit",
  titleVi: "Đơn vị hồi quy có cổng",
  description: "Phiên bản đơn giản hóa của LSTM với 2 cổng thay vì 3, hiệu quả tương đương",
  category: "dl-architectures",
  tags: ["sequence", "nlp", "rnn"],
  difficulty: "advanced",
  relatedSlugs: ["lstm", "rnn", "transformer"],
  vizType: "interactive",
};

export default function GruTopic() {
  const [activeGate, setActiveGate] = useState<"reset" | "update" | null>(null);

  return (
    <>
      <AnalogyCard>
        <p>
          Nếu LSTM giống chiếc <strong>điện thoại thông minh</strong> với nhiều nút bấm,
          thì GRU giống chiếc <strong>điện thoại đơn giản</strong> &mdash; ít nút hơn nhưng
          vẫn gọi điện tốt.
        </p>
        <p>
          GRU gộp cổng quên và cổng nhập của LSTM thành một <strong>cổng cập nhật</strong>
          duy nhất, và thêm <strong>cổng đặt lại</strong> để kiểm soát bao nhiêu quá khứ
          được sử dụng. Ít tham số hơn, huấn luyện nhanh hơn, hiệu suất thường ngang LSTM.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <p className="mb-3 text-sm text-muted">
          Nhấp vào cổng để xem chức năng. So sánh: LSTM có 3 cổng, GRU chỉ có 2.
        </p>
        <svg
          viewBox="0 0 500 280"
          className="w-full rounded-lg border border-border bg-background"
        >
          {/* Hidden state line */}
          <line x1={30} y1={80} x2={470} y2={80} stroke="#8b5cf6" strokeWidth={3} />
          <polygon points="470,80 463,75 463,85" fill="#8b5cf6" />
          <text x={250} y={30} fontSize={12} fill="#8b5cf6" textAnchor="middle" fontWeight={600}>
            Hidden State hₜ (GRU gộp cell state vào đây)
          </text>

          {/* Reset Gate */}
          <g
            className="cursor-pointer"
            onClick={() => setActiveGate(activeGate === "reset" ? null : "reset")}
          >
            <rect x={80} y={110} width={130} height={65} rx={12}
              fill="#ef4444" opacity={activeGate === "reset" ? 0.3 : 0.1}
              stroke="#ef4444" strokeWidth={activeGate === "reset" ? 3 : 1.5} />
            <text x={145} y={135} fontSize={13} fill="#ef4444" textAnchor="middle" fontWeight={700}>
              Cổng đặt lại
            </text>
            <text x={145} y={152} fontSize={10} fill="#ef4444" textAnchor="middle">
              Reset Gate (rₜ)
            </text>
            <text x={145} y={168} fontSize={9} fill="#ef4444" textAnchor="middle">
              &sigma;(Wᵣ&middot;[hₜ₋₁, xₜ])
            </text>
            <line x1={145} y1={110} x2={145} y2={85} stroke="#ef4444" strokeWidth={1.5}
              strokeDasharray={activeGate === "reset" ? "0" : "4 3"} />
          </g>

          {/* Update Gate */}
          <g
            className="cursor-pointer"
            onClick={() => setActiveGate(activeGate === "update" ? null : "update")}
          >
            <rect x={280} y={110} width={130} height={65} rx={12}
              fill="#22c55e" opacity={activeGate === "update" ? 0.3 : 0.1}
              stroke="#22c55e" strokeWidth={activeGate === "update" ? 3 : 1.5} />
            <text x={345} y={135} fontSize={13} fill="#22c55e" textAnchor="middle" fontWeight={700}>
              Cổng cập nhật
            </text>
            <text x={345} y={152} fontSize={10} fill="#22c55e" textAnchor="middle">
              Update Gate (zₜ)
            </text>
            <text x={345} y={168} fontSize={9} fill="#22c55e" textAnchor="middle">
              &sigma;(Wᵤ&middot;[hₜ₋₁, xₜ])
            </text>
            <line x1={345} y1={110} x2={345} y2={85} stroke="#22c55e" strokeWidth={1.5}
              strokeDasharray={activeGate === "update" ? "0" : "4 3"} />
          </g>

          {/* Symbols on hidden state line */}
          <circle cx={145} cy={80} r={10} fill="white" stroke="#ef4444" strokeWidth={1.5} />
          <text x={145} y={85} fontSize={14} fill="#ef4444" textAnchor="middle" fontWeight={700}>&times;</text>

          <circle cx={345} cy={80} r={10} fill="white" stroke="#22c55e" strokeWidth={1.5} />
          <text x={345} y={85} fontSize={14} fill="#22c55e" textAnchor="middle" fontWeight={700}>+</text>

          {/* Input */}
          <line x1={250} y1={240} x2={250} y2={200} stroke="#888" strokeWidth={1} />
          <text x={250} y={255} fontSize={11} fill="currentColor" className="text-muted" textAnchor="middle">
            xₜ (Input)
          </text>

          {/* Comparison with LSTM */}
          <rect x={10} y={195} width={220} height={75} rx={8} fill="#f97316" opacity={0.06} stroke="#f97316" strokeWidth={1} />
          <text x={120} y={213} fontSize={10} fill="#f97316" textAnchor="middle" fontWeight={600}>So sánh LSTM vs GRU</text>
          <text x={120} y={228} fontSize={9} fill="currentColor" className="text-muted" textAnchor="middle">
            LSTM: 3 cổng + cell state riêng
          </text>
          <text x={120} y={243} fontSize={9} fill="currentColor" className="text-muted" textAnchor="middle">
            GRU: 2 cổng, gộp cell &amp; hidden
          </text>
          <text x={120} y={258} fontSize={9} fill="currentColor" className="text-muted" textAnchor="middle">
            GRU ít tham số hơn ~33%
          </text>

          {/* Info box */}
          {activeGate && (
            <g>
              <rect x={240} y={195} width={250} height={35} rx={6}
                fill={activeGate === "reset" ? "#ef4444" : "#22c55e"} opacity={0.1}
                stroke={activeGate === "reset" ? "#ef4444" : "#22c55e"} strokeWidth={1} />
              <text x={365} y={216} fontSize={10}
                fill={activeGate === "reset" ? "#ef4444" : "#22c55e"}
                textAnchor="middle" fontWeight={600}>
                {activeGate === "reset"
                  ? "Kiểm soát bao nhiêu hₜ₋₁ dùng để tính trạng thái ứng viên"
                  : "Trộn giữa hₜ₋₁ cũ và trạng thái ứng viên mới"}
              </text>
            </g>
          )}
        </svg>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>GRU (Gated Recurrent Unit)</strong> đơn giản hóa LSTM bằng cách gộp
          cell state vào hidden state và chỉ dùng <strong>2 cổng</strong> thay vì 3.
        </p>
        <p>
          <strong>Cổng đặt lại (reset)</strong> quyết định bao nhiêu trạng thái cũ được
          dùng khi tính trạng thái ứng viên mới. <strong>Cổng cập nhật (update)</strong>
          quyết định tỷ lệ trộn giữa trạng thái cũ và mới &mdash; kiêm cả vai trò cổng
          quên và cổng nhập của LSTM.
        </p>
        <p>
          GRU thường được chọn khi dữ liệu nhỏ (ít tham số hơn, ít overfitting) hoặc khi
          cần tốc độ (huấn luyện nhanh hơn LSTM). Hiệu suất thường <strong>ngang ngửa</strong>
          LSTM trên hầu hết bài toán.
        </p>
      </ExplanationSection>
    </>
  );
}
