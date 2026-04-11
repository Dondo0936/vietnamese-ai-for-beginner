"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "lora",
  title: "LoRA",
  titleVi: "LoRA - Tinh chỉnh hạng thấp",
  description:
    "Kỹ thuật tinh chỉnh hiệu quả, chỉ huấn luyện ma trận nhỏ thay vì toàn bộ mô hình.",
  category: "training-optimization",
  tags: ["lora", "peft", "fine-tuning", "efficiency"],
  difficulty: "intermediate",
  relatedSlugs: ["fine-tuning", "qlora", "quantization"],
  vizType: "interactive",
};

export default function LoRATopic() {
  const [rank, setRank] = useState(4);
  const [frozen, setFrozen] = useState(true);

  const originalSize = 1000 * 1000;
  const loraSize = 1000 * rank + rank * 1000;
  const ratio = ((loraSize / originalSize) * 100).toFixed(2);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn có một <strong>bức tranh sơn dầu tuyệt đẹp</strong>{" "}
          (mô hình gốc) và muốn thêm vài chi tiết mới. Bạn có hai cách:
        </p>
        <p>
          <strong>Cách 1 (Full fine-tuning):</strong> Vẽ lại toàn bộ bức tranh trên
          canvas mới. Tốn nhiều sơn, thời gian, và có thể phá hỏng phần đẹp.
        </p>
        <p>
          <strong>Cách 2 (LoRA):</strong> Đặt một <strong>lớp kính trong suốt</strong>{" "}
          lên bức tranh gốc và chỉ vẽ thêm chi tiết mới trên lớp kính. Bức tranh gốc
          hoàn toàn nguyên vẹn, lớp kính rất mỏng và nhẹ!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          {/* Rank slider */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted">
              Hạng (Rank) r = {rank}
            </label>
            <input type="range" min="1" max="64" step="1" value={rank}
              onChange={(e) => setRank(parseInt(e.target.value))}
              className="w-full accent-accent" />
            <div className="flex justify-between text-xs text-muted">
              <span>1 (Rất ít tham số)</span>
              <span>64 (Nhiều tham số hơn)</span>
            </div>
          </div>

          {/* Toggle frozen */}
          <button
            onClick={() => setFrozen(!frozen)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              frozen
                ? "bg-blue-600 text-white"
                : "bg-yellow-600 text-white"
            }`}
          >
            {frozen ? "Trọng số gốc: Đóng băng (LoRA)" : "Trọng số gốc: Mở khóa (Full FT)"}
          </button>

          {/* Matrix visualization */}
          <svg viewBox="0 0 700 280" className="w-full max-w-3xl mx-auto">
            <text x="350" y="20" textAnchor="middle" fill="#e2e8f0" fontSize="12" fontWeight="bold">
              Phân tích ma trận: W = W&#x2080; + &Delta;W = W&#x2080; + A &times; B
            </text>

            {/* Original weight matrix */}
            <rect x="30" y="50" width="160" height="160" rx="8"
              fill={frozen ? "#1e3a5f" : "#3b2a1a"}
              stroke={frozen ? "#3b82f6" : "#f59e0b"} strokeWidth="2" />
            <text x="110" y="115" textAnchor="middle" fill={frozen ? "#60a5fa" : "#fbbf24"} fontSize="14" fontWeight="bold">
              W&#x2080;
            </text>
            <text x="110" y="135" textAnchor="middle" fill="#94a3b8" fontSize="9">
              1000 &times; 1000
            </text>
            <text x="110" y="150" textAnchor="middle" fill={frozen ? "#60a5fa" : "#fbbf24"} fontSize="8">
              {frozen ? "Đóng băng" : "Mở khóa"}
            </text>
            {frozen && (
              <text x="110" y="195" textAnchor="middle" fill="#64748b" fontSize="8">
                (Không huấn luyện)
              </text>
            )}

            {/* Plus sign */}
            <text x="210" y="135" textAnchor="middle" fill="#e2e8f0" fontSize="24" fontWeight="bold">
              +
            </text>

            {/* LoRA matrices */}
            {/* Matrix A */}
            <rect x="240" y="50" width="40" height="160" rx="6"
              fill="#14532d" stroke="#22c55e" strokeWidth="2" />
            <text x="260" y="125" textAnchor="middle" fill="#22c55e" fontSize="10" fontWeight="bold">
              A
            </text>
            <text x="260" y="140" textAnchor="middle" fill="#86efac" fontSize="7">
              1000&times;{rank}
            </text>

            {/* Multiplication */}
            <text x="295" y="135" textAnchor="middle" fill="#e2e8f0" fontSize="16">&times;</text>

            {/* Matrix B */}
            <rect x="310" y={130 - rank * 1.2} width="160" height={Math.max(rank * 2.4, 20)} rx="6"
              fill="#14532d" stroke="#22c55e" strokeWidth="2" />
            <text x="390" y={130 - rank * 1.2 + Math.max(rank * 1.2, 10) + 5}
              textAnchor="middle" fill="#22c55e" fontSize="10" fontWeight="bold">
              B
            </text>
            <text x="390" y={130 - rank * 1.2 + Math.max(rank * 1.2, 10) + 18}
              textAnchor="middle" fill="#86efac" fontSize="7">
              {rank}&times;1000
            </text>

            {/* Equals */}
            <text x="495" y="135" textAnchor="middle" fill="#e2e8f0" fontSize="24">=</text>

            {/* Delta W */}
            <rect x="520" y="50" width="160" height="160" rx="8"
              fill="#14532d" stroke="#22c55e" strokeWidth="2" />
            <text x="600" y="120" textAnchor="middle" fill="#22c55e" fontSize="14" fontWeight="bold">
              &Delta;W
            </text>
            <text x="600" y="140" textAnchor="middle" fill="#86efac" fontSize="9">
              1000 &times; 1000
            </text>
            <text x="600" y="160" textAnchor="middle" fill="#86efac" fontSize="8">
              (Từ A &times; B)
            </text>
          </svg>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className="text-lg font-bold text-blue-400">{(originalSize / 1e6).toFixed(1)}M</p>
              <p className="text-xs text-muted">Tham số gốc W&#x2080;</p>
            </div>
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className="text-lg font-bold text-green-400">{(loraSize / 1e3).toFixed(0)}K</p>
              <p className="text-xs text-muted">Tham số LoRA (A + B)</p>
            </div>
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className="text-lg font-bold text-yellow-400">{ratio}%</p>
              <p className="text-xs text-muted">Tỷ lệ tham số huấn luyện</p>
            </div>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>LoRA (Low-Rank Adaptation)</strong> là kỹ thuật fine-tuning hiệu quả, thay
          vì cập nhật toàn bộ ma trận trọng số W (triệu-tỷ tham số), LoRA chỉ huấn luyện
          hai ma trận nhỏ A và B sao cho &Delta;W = A &times; B.
        </p>
        <p>Nguyên lý hoạt động:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Đóng băng trọng số gốc:</strong> Ma trận W&#x2080; từ mô hình pre-train
            được giữ nguyên, không cập nhật.
          </li>
          <li>
            <strong>Thêm ma trận hạng thấp:</strong> Hai ma trận A (d &times; r) và B
            (r &times; d) được khởi tạo, với r rất nhỏ so với d.
          </li>
          <li>
            <strong>Kết hợp:</strong> Khi suy luận, kết quả cuối = W&#x2080;x + &Delta;Wx =
            W&#x2080;x + ABx. Có thể gộp lại mà không tăng latency.
          </li>
        </ol>
        <p>
          LoRA giảm đến <strong>99.9%</strong> số tham số cần huấn luyện, cho phép
          fine-tune mô hình 7B trên GPU 24GB. Đây là kỹ thuật PEFT phổ biến nhất
          hiện nay.
        </p>
      </ExplanationSection>
    </>
  );
}
