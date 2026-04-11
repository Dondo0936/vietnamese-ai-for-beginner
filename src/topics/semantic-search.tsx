"use client";

import { useState, useMemo } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "semantic-search",
  title: "Semantic Search",
  titleVi: "Tìm kiếm ngữ nghĩa",
  description:
    "Tìm kiếm dựa trên ý nghĩa nội dung thay vì khớp từ khóa, sử dụng vector nhúng.",
  category: "search-retrieval",
  tags: ["semantic", "search", "embedding", "nlp"],
  difficulty: "intermediate",
  relatedSlugs: ["bm25", "hybrid-search", "embedding-model"],
  vizType: "interactive",
};

interface Doc {
  text: string;
  keywords: string[];
  semantic: string[];
}

const DOCUMENTS: Doc[] = [
  {
    text: "Chó là bạn thân của con người",
    keywords: ["chó", "bạn", "con người"],
    semantic: ["thú cưng", "động vật", "tình bạn"],
  },
  {
    text: "Mèo thích ngủ trên ghế sofa",
    keywords: ["mèo", "ngủ", "ghế sofa"],
    semantic: ["thú cưng", "động vật", "thư giãn"],
  },
  {
    text: "Xe điện tiết kiệm nhiên liệu",
    keywords: ["xe điện", "tiết kiệm", "nhiên liệu"],
    semantic: ["phương tiện", "công nghệ", "môi trường"],
  },
  {
    text: "Trái đất cần được bảo vệ",
    keywords: ["trái đất", "bảo vệ"],
    semantic: ["môi trường", "hành tinh", "tự nhiên"],
  },
];

const QUERIES: Record<string, { lexical: number[]; semantic: number[] }> = {
  "thú cưng đáng yêu": { lexical: [], semantic: [0, 1] },
  "bảo vệ môi trường": { lexical: [3], semantic: [2, 3] },
  "động vật nuôi trong nhà": { lexical: [], semantic: [0, 1] },
  "phương tiện xanh": { lexical: [], semantic: [2] },
};

export default function SemanticSearchTopic() {
  const [selectedQuery, setSelectedQuery] = useState("thú cưng đáng yêu");
  const [mode, setMode] = useState<"lexical" | "semantic">("lexical");

  const results = useMemo(() => {
    const q = QUERIES[selectedQuery];
    return mode === "lexical" ? q.lexical : q.semantic;
  }, [selectedQuery, mode]);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn nhờ hai người tìm sách trong thư viện:
        </p>
        <p>
          <strong>Người thứ nhất</strong> (tìm kiếm từ khóa) chỉ đọc tựa sách. Nếu bạn
          nói &quot;thú cưng đáng yêu&quot;, họ chỉ tìm sách có đúng chữ
          &quot;thú cưng&quot; hoặc &quot;đáng yêu&quot; trên bìa.
        </p>
        <p>
          <strong>Người thứ hai</strong> (tìm kiếm ngữ nghĩa) hiểu nội dung. Khi nghe
          &quot;thú cưng đáng yêu&quot;, họ mang đến cả sách về chó, mèo, thỏ &mdash;
          dù bìa không có chữ &quot;thú cưng&quot;. Vì họ <strong>hiểu ý nghĩa</strong>!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          {/* Mode toggle */}
          <div className="flex gap-2">
            {(["lexical", "semantic"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  mode === m
                    ? "text-white"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
                style={mode === m ? { backgroundColor: m === "lexical" ? "#ef4444" : "#3b82f6" } : {}}
              >
                {m === "lexical" ? "Tìm kiếm từ khóa" : "Tìm kiếm ngữ nghĩa"}
              </button>
            ))}
          </div>

          {/* Query selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted">Chọn câu truy vấn:</label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(QUERIES).map((q) => (
                <button
                  key={q}
                  onClick={() => setSelectedQuery(q)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    selectedQuery === q
                      ? "bg-accent text-white"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                >
                  &quot;{q}&quot;
                </button>
              ))}
            </div>
          </div>

          {/* Results comparison */}
          <svg viewBox="0 0 600 260" className="w-full max-w-2xl mx-auto">
            <text x="300" y="25" textAnchor="middle" fill="#e2e8f0" fontSize="13" fontWeight="bold">
              Truy vấn: &quot;{selectedQuery}&quot;
            </text>

            {DOCUMENTS.map((doc, i) => {
              const isMatch = results.includes(i);
              const y = 50 + i * 50;
              return (
                <g key={i}>
                  <rect x="30" y={y} width="540" height="38" rx="8"
                    fill={isMatch ? (mode === "lexical" ? "#7f1d1d" : "#1e3a5f") : "#1e293b"}
                    stroke={isMatch ? (mode === "lexical" ? "#ef4444" : "#3b82f6") : "#334155"}
                    strokeWidth={isMatch ? 2 : 1} />
                  <text x="50" y={y + 23} fill={isMatch ? "#e2e8f0" : "#64748b"} fontSize="11">
                    {doc.text}
                  </text>
                  {isMatch && (
                    <text x="545" y={y + 24} textAnchor="end" fill="#22c55e" fontSize="10" fontWeight="bold">
                      Khớp
                    </text>
                  )}
                </g>
              );
            })}

            {results.length === 0 && (
              <text x="300" y="160" textAnchor="middle" fill="#ef4444" fontSize="12">
                Không tìm thấy kết quả nào!
              </text>
            )}
          </svg>

          <div className="rounded-lg bg-background/50 border border-border p-4">
            <p className="text-sm text-muted">
              {mode === "lexical"
                ? results.length === 0
                  ? "Tìm kiếm từ khóa không tìm thấy kết quả vì không có tài liệu nào chứa đúng từ trong truy vấn."
                  : `Tìm kiếm từ khóa tìm được ${results.length} kết quả dựa trên việc khớp chính xác từ ngữ.`
                : `Tìm kiếm ngữ nghĩa tìm được ${results.length} kết quả dựa trên ý nghĩa nội dung, kể cả khi không có từ nào giống nhau.`}
            </p>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Tìm kiếm ngữ nghĩa</strong> (Semantic Search) là phương pháp tìm kiếm
          dựa trên ý nghĩa nội dung thay vì khớp từ khóa đơn thuần. Nó sử dụng mô hình
          nhúng (embedding) để chuyển cả truy vấn và tài liệu thành vector, rồi so sánh
          khoảng cách giữa chúng.
        </p>
        <p>So sánh hai phương pháp:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Tìm kiếm từ khóa (Lexical):</strong> Khớp chính xác chuỗi ký tự.
            Nhanh, đơn giản nhưng bỏ lỡ nhiều kết quả liên quan nếu dùng từ khác nhau.
          </li>
          <li>
            <strong>Tìm kiếm ngữ nghĩa (Semantic):</strong> Hiểu ý nghĩa sâu xa. Tìm
            được tài liệu liên quan dù dùng từ ngữ hoàn toàn khác.
          </li>
        </ol>
        <p>
          Semantic search sử dụng các mô hình nhúng như <strong>sentence-transformers</strong>,{" "}
          <strong>OpenAI Embedding</strong> hoặc <strong>Cohere Embed</strong> để chuyển
          văn bản thành vector trong không gian nhiều chiều, nơi văn bản có ý nghĩa tương
          tự nằm gần nhau.
        </p>
      </ExplanationSection>
    </>
  );
}
