"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "state-space-models",
  title: "State Space Models",
  titleVi: "Mô hình không gian trạng thái — Đối thủ của Transformer",
  description:
    "Kiến trúc mô hình tuần tự hiệu quả dựa trên lý thuyết hệ thống điều khiển, xử lý chuỗi dài nhanh hơn Transformer.",
  category: "emerging",
  tags: ["ssm", "mamba", "sequence", "linear"],
  difficulty: "advanced",
  relatedSlugs: ["long-context", "reasoning-models", "transformer"],
  vizType: "interactive",
};

export default function StateSpaceModelsTopic() {
  const [seqLen, setSeqLen] = useState(1000);

  const transformerCost = (seqLen / 1000) * (seqLen / 1000);
  const ssmCost = seqLen / 1000;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng <strong>Transformer</strong> như một <strong>lớp học nơi mọi
          học sinh phải nói chuyện với tất cả bạn cùng lớp</strong> — 10 học sinh cần 45
          cuộc trò chuyện, 100 học sinh cần 4950 cuộc. Càng đông càng chậm!
        </p>
        <p>
          <strong>SSM</strong> giống <strong>trò &quot;truyền tin nhắn&quot;</strong> — mỗi người chỉ
          cần nhận tin từ người trước, cập nhật ghi chú, rồi truyền cho người sau.
          Dù lớp có 10 hay 10.000 người, mỗi người vẫn chỉ làm cùng một lượng công việc!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted">Độ dài chuỗi: {seqLen.toLocaleString()} token</label>
            <input
              type="range"
              min={100}
              max={10000}
              step={100}
              value={seqLen}
              onChange={(e) => setSeqLen(parseInt(e.target.value))}
              className="w-full accent-accent"
            />
          </div>
          <svg viewBox="0 0 600 200" className="w-full max-w-2xl mx-auto">
            <text x={300} y={20} textAnchor="middle" fill="#e2e8f0" fontSize={12} fontWeight="bold">
              Chi phí tính toán so sánh
            </text>
            {/* Transformer */}
            <text x={20} y={70} fill="#ef4444" fontSize={11}>Transformer (O(n^2))</text>
            <rect x={180} y={55} width={350} height={24} rx={4} fill="#1e293b" />
            <rect x={180} y={55} width={Math.min(350, 350 * transformerCost / 100)} height={24} rx={4} fill="#ef4444" opacity={0.8} />
            <text x={185 + Math.min(350, 350 * transformerCost / 100)} y={72} fill="white" fontSize={10}>
              {transformerCost.toFixed(1)}x
            </text>

            {/* SSM */}
            <text x={20} y={120} fill="#22c55e" fontSize={11}>SSM / Mamba (O(n))</text>
            <rect x={180} y={105} width={350} height={24} rx={4} fill="#1e293b" />
            <rect x={180} y={105} width={Math.min(350, 350 * ssmCost / 100)} height={24} rx={4} fill="#22c55e" opacity={0.8} />
            <text x={185 + Math.min(350, 350 * ssmCost / 100)} y={122} fill="white" fontSize={10}>
              {ssmCost.toFixed(1)}x
            </text>

            <text x={300} y={170} textAnchor="middle" fill="#94a3b8" fontSize={10}>
              Chuỗi càng dài → SSM càng có lợi thế so với Transformer
            </text>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>State Space Models (SSM)</strong> là kiến trúc mô hình tuần tự dựa trên
          lý thuyết hệ thống điều khiển, với chi phí tính toán <strong>tuyến tính O(n)</strong>
          theo độ dài chuỗi, thay vì O(n^2) như Transformer.
        </p>
        <p>Ưu điểm của SSM so với Transformer:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>Tốc độ tuyến tính:</strong> Chi phí chỉ tăng tuyến tính khi chuỗi dài hơn, không bùng nổ bậc hai.</li>
          <li><strong>Bộ nhớ hiệu quả:</strong> Nén thông tin vào trạng thái cố định thay vì lưu KV cache lớn.</li>
          <li><strong>Suy luận nhanh:</strong> Mỗi token mới chỉ cần cập nhật trạng thái, không cần xem lại toàn bộ chuỗi.</li>
        </ol>
        <p>
          <strong>Mamba</strong> (Gu & Dao, 2023) là SSM nổi bật nhất, giới thiệu cơ chế
          chọn lọc (selective) để SSM có thể &quot;chú ý&quot; đến nội dung quan trọng.
          Nhiều mô hình hybrid kết hợp cả Transformer và SSM đang là xu hướng.
        </p>
      </ExplanationSection>
    </>
  );
}
