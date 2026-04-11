"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "re-ranking",
  title: "Re-ranking",
  titleVi: "Re-ranking - Xếp hạng lại kết quả",
  description:
    "Giai đoạn thứ hai trong pipeline tìm kiếm, sử dụng mô hình mạnh hơn để xếp hạng lại kết quả ban đầu.",
  category: "search-retrieval",
  tags: ["re-ranking", "cross-encoder", "retrieval", "pipeline"],
  difficulty: "intermediate",
  relatedSlugs: ["semantic-search", "hybrid-search", "rag"],
  vizType: "static",
};

export default function ReRankingTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn tổ chức <strong>cuộc thi tài năng</strong> với 1.000 thí sinh.
          Không thể để giám khảo chính xem tất cả, nên bạn chia làm 2 vòng:
        </p>
        <p>
          <strong>Vòng sơ loại</strong> (Stage 1 &mdash; Retrieval): Trợ lý nhanh chóng
          lọc xuống còn 50 thí sinh tiềm năng. Nhanh nhưng có thể chưa chính xác lắm.
        </p>
        <p>
          <strong>Vòng chung kết</strong> (Stage 2 &mdash; Re-ranking): Giám khảo chính
          đánh giá kỹ từng người trong 50 thí sinh, xếp hạng lại từ cao đến thấp. Chậm
          hơn nhưng <strong>chính xác hơn nhiều</strong>!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          <svg viewBox="0 0 700 350" className="w-full max-w-3xl mx-auto">
            {/* Stage 1 */}
            <rect x="20" y="30" width="200" height="290" rx="12" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.5" />
            <text x="120" y="55" textAnchor="middle" fill="#3b82f6" fontSize="13" fontWeight="bold">
              Giai đoạn 1: Truy xuất
            </text>
            <text x="120" y="72" textAnchor="middle" fill="#64748b" fontSize="9">
              (Bi-Encoder / BM25)
            </text>

            {/* Stage 1 docs */}
            {["Tài liệu A (0.85)", "Tài liệu B (0.78)", "Tài liệu C (0.72)", "Tài liệu D (0.65)", "Tài liệu E (0.60)"].map((d, i) => (
              <g key={i}>
                <rect x="35" y={85 + i * 42} width="170" height="32" rx="6"
                  fill="#334155" stroke="#475569" strokeWidth="1" />
                <text x="120" y={105 + i * 42} textAnchor="middle" fill="#94a3b8" fontSize="10">
                  {d}
                </text>
              </g>
            ))}

            {/* Arrow */}
            <line x1="220" y1="175" x2="280" y2="175" stroke="#475569" strokeWidth="2" markerEnd="url(#arrow-rr)" />
            <text x="250" y="165" textAnchor="middle" fill="#f59e0b" fontSize="9" fontWeight="bold">
              Top-K
            </text>

            {/* Stage 2 */}
            <rect x="280" y="60" width="200" height="230" rx="12" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
            <text x="380" y="85" textAnchor="middle" fill="#f59e0b" fontSize="13" fontWeight="bold">
              Giai đoạn 2: Re-ranking
            </text>
            <text x="380" y="102" textAnchor="middle" fill="#64748b" fontSize="9">
              (Cross-Encoder)
            </text>

            {/* Cross-encoder pairs */}
            {["Q + Doc A &rarr; 0.92", "Q + Doc B &rarr; 0.45", "Q + Doc C &rarr; 0.88", "Q + Doc D &rarr; 0.31", "Q + Doc E &rarr; 0.76"].map((d, i) => (
              <g key={i}>
                <rect x="295" y={115 + i * 32} width="170" height="24" rx="5"
                  fill="#334155" />
                <text x="380" y={131 + i * 32} textAnchor="middle" fill="#94a3b8" fontSize="9">
                  {d.replace("&rarr;", "\u2192")}
                </text>
              </g>
            ))}

            {/* Arrow */}
            <line x1="480" y1="175" x2="520" y2="175" stroke="#475569" strokeWidth="2" markerEnd="url(#arrow-rr)" />

            {/* Final results */}
            <rect x="520" y="80" width="160" height="200" rx="12" fill="#1e293b" stroke="#22c55e" strokeWidth="1.5" />
            <text x="600" y="105" textAnchor="middle" fill="#22c55e" fontSize="13" fontWeight="bold">
              Kết quả cuối
            </text>

            {[
              { d: "1. Tài liệu A (0.92)", color: "#22c55e" },
              { d: "2. Tài liệu C (0.88)", color: "#22c55e" },
              { d: "3. Tài liệu E (0.76)", color: "#94a3b8" },
              { d: "4. Tài liệu B (0.45)", color: "#64748b" },
              { d: "5. Tài liệu D (0.31)", color: "#64748b" },
            ].map((item, i) => (
              <text key={i} x="600" y={130 + i * 30} textAnchor="middle" fill={item.color} fontSize="10">
                {item.d}
              </text>
            ))}

            <defs>
              <marker id="arrow-rr" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#475569" />
              </marker>
            </defs>
          </svg>

          {/* Comparison box */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-background/50 border border-blue-500/30 p-3">
              <p className="text-sm font-semibold text-blue-400">Bi-Encoder (Giai đoạn 1)</p>
              <p className="text-xs text-muted">
                Mã hóa truy vấn và tài liệu riêng biệt, rồi so sánh vector. Nhanh nhưng
                bỏ lỡ sự tương tác chi tiết giữa truy vấn và tài liệu.
              </p>
            </div>
            <div className="rounded-lg bg-background/50 border border-yellow-500/30 p-3">
              <p className="text-sm font-semibold text-yellow-400">Cross-Encoder (Giai đoạn 2)</p>
              <p className="text-xs text-muted">
                Xử lý cặp (truy vấn, tài liệu) cùng lúc qua Transformer. Chính xác hơn
                nhiều nhưng chậm hơn đáng kể.
              </p>
            </div>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Re-ranking</strong> là kỹ thuật sắp xếp lại kết quả tìm kiếm từ giai đoạn
          đầu (retrieval) bằng một mô hình mạnh hơn, nhằm đưa kết quả liên quan nhất lên
          đầu danh sách.
        </p>
        <p>Pipeline hai giai đoạn hoạt động như sau:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Giai đoạn 1 &mdash; Truy xuất:</strong> Sử dụng Bi-Encoder hoặc BM25
            để nhanh chóng lọc ra top-K tài liệu tiềm năng từ hàng triệu kết quả.
          </li>
          <li>
            <strong>Giai đoạn 2 &mdash; Re-ranking:</strong> Cross-Encoder xem xét từng
            cặp (truy vấn, tài liệu) và cho điểm chính xác hơn, sau đó xếp hạng lại.
          </li>
        </ol>
        <p>
          Cross-Encoder chính xác hơn vì nó xem xét sự tương tác giữa từng token trong
          truy vấn và tài liệu. Các mô hình re-ranking phổ biến bao gồm{" "}
          <strong>Cohere Rerank</strong>, <strong>bge-reranker</strong> và{" "}
          <strong>ms-marco-MiniLM</strong>.
        </p>
      </ExplanationSection>
    </>
  );
}
