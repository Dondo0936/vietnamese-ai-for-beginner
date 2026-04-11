"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "bm25",
  title: "BM25",
  titleVi: "BM25 - Xếp hạng từ khóa kinh điển",
  description:
    "Thuật toán xếp hạng văn bản dựa trên tần suất từ khóa, là nền tảng của các công cụ tìm kiếm truyền thống.",
  category: "search-retrieval",
  tags: ["bm25", "ranking", "information-retrieval", "tf-idf"],
  difficulty: "intermediate",
  relatedSlugs: ["semantic-search", "hybrid-search", "re-ranking"],
  vizType: "static",
};

export default function BM25Topic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang <strong>chấm bài thi tự luận</strong>. Bạn cần tìm
          bài viết nào liên quan nhất đến chủ đề &quot;trí tuệ nhân tạo&quot;.
        </p>
        <p>
          Bạn đếm xem mỗi bài nhắc đến &quot;trí tuệ nhân tạo&quot; bao nhiêu lần (
          <strong>tần suất từ</strong>). Nhưng nếu một từ xuất hiện ở hầu hết mọi bài
          (như &quot;và&quot;, &quot;là&quot;), nó không có giá trị phân biệt nên bạn{" "}
          <strong>giảm điểm</strong> cho nó. Bài dài hơn tự nhiên chứa nhiều từ hơn
          nên bạn cũng <strong>điều chỉnh theo độ dài</strong>.
        </p>
        <p>
          BM25 làm chính xác ba điều đó: đếm tần suất, cân nhắc độ hiếm của từ,
          và chuẩn hóa theo độ dài văn bản!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          {/* Formula SVG */}
          <svg viewBox="0 0 700 280" className="w-full max-w-3xl mx-auto">
            {/* Title */}
            <text x="350" y="30" textAnchor="middle" fill="#e2e8f0" fontSize="16" fontWeight="bold">
              Công thức BM25
            </text>

            {/* Main formula */}
            <text x="350" y="70" textAnchor="middle" fill="#94a3b8" fontSize="13">
              score(D, Q) = &Sigma; IDF(qi) &middot; TF(qi, D)
            </text>

            {/* IDF Component */}
            <rect x="40" y="100" width="200" height="80" rx="10" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.5" />
            <text x="140" y="125" textAnchor="middle" fill="#3b82f6" fontSize="12" fontWeight="bold">
              IDF - Độ hiếm của từ
            </text>
            <text x="140" y="145" textAnchor="middle" fill="#94a3b8" fontSize="10">
              log((N - n(qi) + 0.5) /
            </text>
            <text x="140" y="160" textAnchor="middle" fill="#94a3b8" fontSize="10">
              (n(qi) + 0.5) + 1)
            </text>
            <text x="140" y="175" textAnchor="middle" fill="#64748b" fontSize="8">
              Từ càng hiếm &rarr; điểm càng cao
            </text>

            {/* TF Component */}
            <rect x="260" y="100" width="200" height="80" rx="10" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
            <text x="360" y="125" textAnchor="middle" fill="#f59e0b" fontSize="12" fontWeight="bold">
              TF - Tần suất từ
            </text>
            <text x="360" y="145" textAnchor="middle" fill="#94a3b8" fontSize="10">
              f(qi, D) &middot; (k1 + 1)
            </text>
            <text x="360" y="160" textAnchor="middle" fill="#94a3b8" fontSize="10">
              / (f(qi, D) + k1 &middot; ...)
            </text>
            <text x="360" y="175" textAnchor="middle" fill="#64748b" fontSize="8">
              Xuất hiện nhiều &rarr; nhưng có giới hạn
            </text>

            {/* Length norm */}
            <rect x="480" y="100" width="200" height="80" rx="10" fill="#1e293b" stroke="#22c55e" strokeWidth="1.5" />
            <text x="580" y="125" textAnchor="middle" fill="#22c55e" fontSize="12" fontWeight="bold">
              Chuẩn hóa độ dài
            </text>
            <text x="580" y="145" textAnchor="middle" fill="#94a3b8" fontSize="10">
              (1 - b + b &middot; |D| / avgdl)
            </text>
            <text x="580" y="165" textAnchor="middle" fill="#64748b" fontSize="8">
              Tài liệu dài bị phạt điểm
            </text>
            <text x="580" y="178" textAnchor="middle" fill="#64748b" fontSize="8">
              để công bằng
            </text>

            {/* Example */}
            <rect x="80" y="200" width="540" height="65" rx="10" fill="#1e293b" stroke="#475569" strokeWidth="1" />
            <text x="350" y="222" textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="bold">
              Ví dụ: Truy vấn &quot;mèo đáng yêu&quot;
            </text>
            <text x="350" y="240" textAnchor="middle" fill="#94a3b8" fontSize="10">
              Tài liệu 1: &quot;Con mèo rất đáng yêu&quot; &rarr; BM25 = 2.8 (cả 2 từ xuất hiện)
            </text>
            <text x="350" y="255" textAnchor="middle" fill="#94a3b8" fontSize="10">
              Tài liệu 2: &quot;Chó rất đáng yêu&quot; &rarr; BM25 = 1.2 (chỉ 1 từ khớp)
            </text>
          </svg>

          {/* Parameter boxes */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-background/50 border border-border p-3">
              <p className="text-sm font-semibold text-blue-400">k1 = 1.2 (mặc định)</p>
              <p className="text-xs text-muted">
                Kiểm soát mức bão hòa tần suất. k1 cao = từ lặp nhiều được cộng thêm điểm.
              </p>
            </div>
            <div className="rounded-lg bg-background/50 border border-border p-3">
              <p className="text-sm font-semibold text-green-400">b = 0.75 (mặc định)</p>
              <p className="text-xs text-muted">
                Kiểm soát mức phạt theo độ dài. b = 1 phạt nặng tài liệu dài, b = 0 bỏ qua.
              </p>
            </div>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>BM25</strong> (Best Matching 25) là thuật toán xếp hạng kinh điển trong
          lĩnh vực truy xuất thông tin (Information Retrieval), được sử dụng rộng rãi
          trong các công cụ tìm kiếm như Elasticsearch, Solr và Lucene.
        </p>
        <p>BM25 cải tiến so với TF-IDF nhờ ba yếu tố:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Bão hòa tần suất:</strong> Trong TF-IDF, tần suất tăng tuyến tính. BM25
            giới hạn lại &mdash; từ xuất hiện 10 lần không gấp đôi điểm so với 5 lần.
          </li>
          <li>
            <strong>IDF cải tiến:</strong> Sử dụng công thức logarit mượt hơn để đánh giá
            độ hiếm của từ trong toàn bộ tập tài liệu.
          </li>
          <li>
            <strong>Chuẩn hóa độ dài:</strong> Điều chỉnh điểm dựa trên tỷ lệ độ dài
            tài liệu so với trung bình, tránh thiên vị tài liệu dài.
          </li>
        </ol>
        <p>
          Dù đã cũ, BM25 vẫn là <strong>baseline mạnh mẽ</strong> và thường được kết hợp
          với tìm kiếm ngữ nghĩa trong hệ thống hybrid search hiện đại.
        </p>
      </ExplanationSection>
    </>
  );
}
