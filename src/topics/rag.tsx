"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "rag",
  title: "RAG",
  titleVi: "RAG - Sinh nội dung có truy xuất",
  description:
    "Retrieval-Augmented Generation kết hợp truy xuất tài liệu với mô hình ngôn ngữ để tạo câu trả lời chính xác hơn.",
  category: "search-retrieval",
  tags: ["retrieval", "generation", "llm", "search"],
  difficulty: "intermediate",
  relatedSlugs: ["vector-databases", "semantic-search", "chunking"],
  vizType: "interactive",
};

export default function RAGTopic() {
  const [step, setStep] = useState(0);
  const [query, setQuery] = useState("Vitamin C có trong trái cây nào?");

  const documents = [
    "Cam chứa nhiều vitamin C, khoảng 53mg mỗi quả.",
    "Dâu tây giàu vitamin C và chất chống oxy hóa.",
    "Chuối là nguồn kali tốt cho cơ thể.",
  ];

  const relevantDocs = query.toLowerCase().includes("vitamin c")
    ? [documents[0], documents[1]]
    : [documents[2]];

  const generatedAnswer = query.toLowerCase().includes("vitamin c")
    ? "Cam và dâu tây là hai loại trái cây giàu vitamin C. Cam chứa khoảng 53mg vitamin C mỗi quả, còn dâu tây cũng rất giàu vitamin C cùng chất chống oxy hóa."
    : "Dựa trên tài liệu, chuối là nguồn kali tốt cho cơ thể.";

  const steps = [
    { label: "Câu hỏi", color: "#3b82f6" },
    { label: "Truy xuất", color: "#f59e0b" },
    { label: "Sinh câu trả lời", color: "#22c55e" },
  ];

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn là một <strong>sinh viên đang thi vấn đáp</strong>.
          Thay vì chỉ dựa vào trí nhớ (có thể sai), bạn được phép{" "}
          <strong>mở sách tra cứu</strong> trước khi trả lời.
        </p>
        <p>
          Đầu tiên, bạn nghe câu hỏi của giám khảo (<strong>Query</strong>). Sau đó, bạn
          lật nhanh sách tìm các trang liên quan (<strong>Retrieve</strong>). Cuối cùng,
          bạn tổng hợp thông tin từ sách và kiến thức của mình để{" "}
          <strong>trả lời mạch lạc</strong> (<strong>Generate</strong>).
        </p>
        <p>
          RAG hoạt động giống hệt vậy: LLM không chỉ dựa vào &quot;trí nhớ&quot; mà còn
          tra cứu tài liệu thật để trả lời chính xác hơn!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          {/* Query input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted">Nhập câu hỏi</label>
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setStep(0); }}
              className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground"
              placeholder="Nhập câu hỏi của bạn..."
            />
          </div>

          {/* Step buttons */}
          <div className="flex gap-2">
            {steps.map((s, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  step === i
                    ? "text-white"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
                style={step === i ? { backgroundColor: s.color } : {}}
              >
                {i + 1}. {s.label}
              </button>
            ))}
          </div>

          {/* SVG Flow */}
          <svg viewBox="0 0 700 220" className="w-full max-w-3xl mx-auto">
            {/* Query box */}
            <rect x="10" y="80" width="140" height="60" rx="10" fill="#3b82f6" opacity={step >= 0 ? 1 : 0.3} />
            <text x="80" y="105" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">Câu hỏi</text>
            <text x="80" y="125" textAnchor="middle" fill="white" fontSize="9" opacity={0.8}>Query</text>

            {/* Arrow 1 */}
            <line x1="150" y1="110" x2="210" y2="110" stroke="#475569" strokeWidth="2" markerEnd="url(#arrowhead)" />

            {/* Knowledge Base */}
            <rect x="210" y="30" width="160" height="160" rx="10" fill="#1e293b" stroke={step >= 1 ? "#f59e0b" : "#475569"} strokeWidth={step >= 1 ? 2.5 : 1.5} />
            <text x="290" y="55" textAnchor="middle" fill="#f59e0b" fontSize="11" fontWeight="bold">Kho tài liệu</text>
            {documents.map((doc, i) => {
              const isRelevant = step >= 1 && relevantDocs.includes(doc);
              return (
                <g key={i}>
                  <rect x="220" y={70 + i * 40} width="140" height="30" rx="5"
                    fill={isRelevant ? "#f59e0b" : "#334155"} opacity={isRelevant ? 0.9 : 0.5} />
                  <text x="290" y={89 + i * 40} textAnchor="middle" fill="white" fontSize="8">
                    {doc.slice(0, 28)}...
                  </text>
                </g>
              );
            })}

            {/* Arrow 2 */}
            <line x1="370" y1="110" x2="430" y2="110" stroke="#475569" strokeWidth="2" markerEnd="url(#arrowhead)" />

            {/* LLM box */}
            <rect x="430" y="60" width="120" height="100" rx="12" fill="#1e293b" stroke={step >= 2 ? "#22c55e" : "#475569"} strokeWidth={step >= 2 ? 2.5 : 1.5} />
            <text x="490" y="100" textAnchor="middle" fill="#22c55e" fontSize="12" fontWeight="bold">LLM</text>
            <text x="490" y="118" textAnchor="middle" fill="#94a3b8" fontSize="9">Sinh câu trả lời</text>
            <text x="490" y="132" textAnchor="middle" fill="#94a3b8" fontSize="9">Generate</text>

            {/* Arrow 3 */}
            <line x1="550" y1="110" x2="610" y2="110" stroke="#475569" strokeWidth="2" markerEnd="url(#arrowhead)" />

            {/* Output */}
            <rect x="610" y="80" width="80" height="60" rx="10" fill={step >= 2 ? "#22c55e" : "#334155"} opacity={step >= 2 ? 1 : 0.4} />
            <text x="650" y="105" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">Kết quả</text>
            <text x="650" y="122" textAnchor="middle" fill="white" fontSize="8" opacity={0.8}>Answer</text>

            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#475569" />
              </marker>
            </defs>
          </svg>

          {/* Result panel */}
          {step >= 2 && (
            <div className="rounded-lg bg-background/50 border border-border p-4">
              <p className="text-sm font-medium text-green-500 mb-2">Câu trả lời được sinh ra:</p>
              <p className="text-sm text-muted">{generatedAnswer}</p>
            </div>
          )}
          {step === 1 && (
            <div className="rounded-lg bg-background/50 border border-border p-4">
              <p className="text-sm font-medium text-yellow-500 mb-2">Tài liệu liên quan được truy xuất:</p>
              {relevantDocs.map((doc, i) => (
                <p key={i} className="text-sm text-muted">- {doc}</p>
              ))}
            </div>
          )}
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>RAG (Retrieval-Augmented Generation)</strong> là kỹ thuật kết hợp hai
          giai đoạn: truy xuất thông tin từ kho tài liệu và sinh câu trả lời bằng mô hình
          ngôn ngữ lớn (LLM).
        </p>
        <p>RAG hoạt động theo 3 bước chính:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Nhận câu hỏi (Query):</strong> Người dùng đặt câu hỏi bằng ngôn ngữ
            tự nhiên.
          </li>
          <li>
            <strong>Truy xuất (Retrieve):</strong> Hệ thống tìm kiếm các đoạn tài liệu
            liên quan nhất từ cơ sở dữ liệu vector, sử dụng kỹ thuật tìm kiếm ngữ nghĩa.
          </li>
          <li>
            <strong>Sinh câu trả lời (Generate):</strong> LLM nhận câu hỏi cùng các tài liệu
            đã truy xuất, sau đó tổng hợp thành câu trả lời mạch lạc và chính xác.
          </li>
        </ol>
        <p>
          RAG giúp giảm đáng kể hiện tượng <strong>ảo giác</strong> (hallucination) của LLM
          vì câu trả lời được neo vào dữ liệu thực tế. Đây là kiến trúc phổ biến trong
          các ứng dụng AI doanh nghiệp hiện đại.
        </p>
      </ExplanationSection>
    </>
  );
}
