"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "explainability",
  title: "Explainability",
  titleVi: "Giải thích được — AI trong suốt",
  description:
    "Các kỹ thuật giúp con người hiểu tại sao mô hình AI đưa ra một quyết định cụ thể.",
  category: "ai-safety",
  tags: ["explainability", "interpretability", "xai", "transparency"],
  difficulty: "intermediate",
  relatedSlugs: ["bias-fairness", "alignment", "guardrails"],
  vizType: "interactive",
};

const FEATURES = [
  { name: "Thu nhập", importance: 0.35, color: "#3b82f6" },
  { name: "Lịch sử tín dụng", importance: 0.28, color: "#22c55e" },
  { name: "Tuổi", importance: 0.15, color: "#f59e0b" },
  { name: "Nghề nghiệp", importance: 0.12, color: "#8b5cf6" },
  { name: "Địa chỉ", importance: 0.10, color: "#ef4444" },
];

export default function ExplainabilityTopic() {
  const [showImportance, setShowImportance] = useState(false);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đến ngân hàng xin vay tiền. Nhân viên nói: &quot;Đơn bị từ chối.&quot;
          Bạn hỏi: &quot;Tại sao?&quot; — và họ trả lời: &quot;Máy tính nói thế.&quot;
        </p>
        <p>
          Điều đó rất <strong>bất công</strong>! Bạn xứng đáng biết lý do: thu nhập chưa đủ?
          lịch sử tín dụng xấu? Giải thích được (Explainability) giúp AI trở nên
          <strong> minh bạch</strong> — cho người dùng biết <em>tại sao</em> nó đưa ra
          quyết định đó, giống như nhân viên giải thích rõ ràng.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <button
            onClick={() => setShowImportance(!showImportance)}
            className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white"
          >
            {showImportance ? "Ẩn giải thích" : "Xem tại sao AI từ chối"}
          </button>
          <svg viewBox="0 0 600 250" className="w-full max-w-2xl mx-auto">
            {/* Decision */}
            <rect x={200} y={10} width={200} height={40} rx={10} fill="#ef4444" />
            <text x={300} y={35} textAnchor="middle" fill="white" fontSize={12} fontWeight="bold">
              Từ chối cho vay
            </text>

            {showImportance && (
              <>
                <text x={300} y={75} textAnchor="middle" fill="#e2e8f0" fontSize={11} fontWeight="bold">
                  Mức ảnh hưởng của từng yếu tố:
                </text>
                {FEATURES.map((f, i) => {
                  const y = 90 + i * 30;
                  return (
                    <g key={i}>
                      <text x={20} y={y + 18} fill="#94a3b8" fontSize={11}>{f.name}</text>
                      <rect x={170} y={y + 3} width={350} height={20} rx={3} fill="#1e293b" />
                      <rect
                        x={170}
                        y={y + 3}
                        width={350 * f.importance}
                        height={20}
                        rx={3}
                        fill={f.color}
                      />
                      <text x={175 + 350 * f.importance + 5} y={y + 18} fill="white" fontSize={10}>
                        {(f.importance * 100).toFixed(0)}%
                      </text>
                    </g>
                  );
                })}
              </>
            )}
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Giải thích được (Explainability/XAI)</strong> là khả năng của hệ thống AI
          trình bày <em>lý do</em> đằng sau quyết định của mình một cách con người có thể hiểu được.
        </p>
        <p>Các kỹ thuật giải thích phổ biến:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>SHAP (SHapley Additive exPlanations):</strong> Đo lường mức đóng góp
            của từng đặc trưng vào dự đoán, dựa trên lý thuyết trò chơi.
          </li>
          <li>
            <strong>LIME (Local Interpretable Model-agnostic Explanations):</strong>
            Xấp xỉ mô hình phức tạp bằng mô hình đơn giản tại vùng lân cận dự đoán.
          </li>
          <li>
            <strong>Attention Visualization:</strong> Hiển thị phần nào của đầu vào
            mà mô hình &quot;chú ý&quot; nhiều nhất khi đưa ra quyết định.
          </li>
        </ol>
        <p>
          Giải thích được đặc biệt quan trọng trong các ngành có quy định nghiêm ngặt
          như <strong>tài chính</strong>, <strong>y tế</strong> và <strong>tư pháp</strong>,
          nơi quyết định AI ảnh hưởng trực tiếp đến cuộc sống con người.
        </p>
      </ExplanationSection>
    </>
  );
}
