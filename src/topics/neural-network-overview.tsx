"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "neural-network-overview",
  title: "Neural Network Overview",
  titleVi: "Tổng quan mạng nơ-ron — Bộ não nhân tạo",
  description:
    "Cái nhìn toàn cảnh về mạng nơ-ron nhân tạo: từ cấu trúc, cách học, đến các kiến trúc phổ biến nhất.",
  category: "foundations",
  tags: ["neural-network", "overview", "deep-learning", "architecture"],
  difficulty: "beginner",
  relatedSlugs: ["perceptron", "mlp", "backpropagation", "activation-functions"],
  vizType: "interactive",
};

const ARCHITECTURES = [
  { id: "ffn", label: "Feedforward", desc: "Dữ liệu chảy một chiều — phân loại, hồi quy", era: "1980s" },
  { id: "cnn", label: "CNN", desc: "Nhận dạng hình ảnh, thị giác máy tính", era: "1998" },
  { id: "rnn", label: "RNN/LSTM", desc: "Chuỗi thời gian, ngôn ngữ (cũ)", era: "1997" },
  { id: "transformer", label: "Transformer", desc: "NLP, LLM, mọi thứ hiện đại!", era: "2017" },
];

export default function NeuralNetworkOverviewTopic() {
  const [selectedArch, setSelectedArch] = useState("transformer");
  const arch = ARCHITECTURES.find((a) => a.id === selectedArch)!;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng <strong>bộ não con người</strong>: hàng tỷ nơ-ron kết nối với nhau,
          mỗi nơ-ron nhận tín hiệu, xử lý và truyền cho nơ-ron khác. Mạng nơ-ron nhân tạo
          mô phỏng nguyên lý này — nhưng trên máy tính.
        </p>
        <p>
          Giống như bộ não có nhiều <strong>vùng chuyên biệt</strong> (vùng thị giác,
          vùng ngôn ngữ, vùng vận động), mạng nơ-ron cũng có nhiều <strong>kiến trúc</strong>
          khác nhau cho từng loại bài toán: CNN cho hình ảnh, RNN cho chuỗi,
          Transformer cho... gần như mọi thứ!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {ARCHITECTURES.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedArch(a.id)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  selectedArch === a.id ? "bg-accent text-white" : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
          <svg viewBox="0 0 600 200" className="w-full max-w-2xl mx-auto">
            {/* Simple neural network diagram */}
            {[
              { label: "Đầu vào", x: 80, nodes: 3, color: "#3b82f6" },
              { label: "Ẩn 1", x: 230, nodes: 4, color: "#8b5cf6" },
              { label: "Ẩn 2", x: 380, nodes: 4, color: "#8b5cf6" },
              { label: "Đầu ra", x: 530, nodes: 2, color: "#22c55e" },
            ].map((layer, li) => (
              <g key={li}>
                <text x={layer.x} y={15} textAnchor="middle" fill="#94a3b8" fontSize={9}>{layer.label}</text>
                {Array.from({ length: layer.nodes }).map((_, ni) => {
                  const cy = 40 + ni * (140 / (layer.nodes - 1 || 1));
                  return (
                    <circle key={ni} cx={layer.x} cy={cy} r={12} fill={layer.color} opacity={0.7} />
                  );
                })}
              </g>
            ))}

            {/* Connections (simplified) */}
            {[0, 1, 2].map((li) => {
              const layers = [
                { x: 80, nodes: 3 },
                { x: 230, nodes: 4 },
                { x: 380, nodes: 4 },
                { x: 530, nodes: 2 },
              ];
              const from = layers[li];
              const to = layers[li + 1];
              return Array.from({ length: from.nodes }).map((_, fi) =>
                Array.from({ length: to.nodes }).map((_, ti) => (
                  <line
                    key={`${li}-${fi}-${ti}`}
                    x1={from.x + 12}
                    y1={40 + fi * (140 / (from.nodes - 1 || 1))}
                    x2={to.x - 12}
                    y2={40 + ti * (140 / (to.nodes - 1 || 1))}
                    stroke="#475569"
                    strokeWidth={0.5}
                    opacity={0.3}
                  />
                ))
              );
            })}
          </svg>
          <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
            <p className="text-sm text-muted">
              <strong>{arch.label}</strong> ({arch.era}): {arch.desc}
            </p>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Mạng nơ-ron nhân tạo</strong> là nền tảng của deep learning, bao gồm
          nhiều lớp (layers) chứa các nơ-ron (neurons) kết nối với nhau qua trọng số (weights).
        </p>
        <p>Bốn kiến trúc chính trong lịch sử:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>Feedforward (MLP):</strong> Kiến trúc đơn giản nhất — dữ liệu chảy một chiều từ đầu vào đến đầu ra. Dùng cho phân loại, hồi quy.</li>
          <li><strong>CNN (Convolutional):</strong> Sử dụng bộ lọc tích chập để trích xuất đặc trưng không gian. Thống trị thị giác máy tính.</li>
          <li><strong>RNN/LSTM:</strong> Xử lý dữ liệu tuần tự bằng cách duy trì trạng thái ẩn. Đã bị Transformer thay thế phần lớn.</li>
          <li><strong>Transformer:</strong> Sử dụng cơ chế attention để xử lý song song. Là nền tảng cho LLM và hầu hết AI hiện đại.</li>
        </ol>
        <p>
          Mạng nơ-ron học bằng cách <strong>lan truyền ngược</strong> (backpropagation) —
          tính lỗi, truyền ngược qua các lớp, và cập nhật trọng số để giảm lỗi dần dần.
        </p>
      </ExplanationSection>
    </>
  );
}
