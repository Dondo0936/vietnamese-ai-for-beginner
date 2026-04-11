"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "chunking",
  title: "Chunking",
  titleVi: "Chunking - Chia nhỏ tài liệu",
  description:
    "Kỹ thuật chia văn bản dài thành các đoạn nhỏ phù hợp để nhúng và truy xuất hiệu quả.",
  category: "search-retrieval",
  tags: ["chunking", "rag", "preprocessing", "text-splitting"],
  difficulty: "beginner",
  relatedSlugs: ["rag", "vector-databases", "semantic-search"],
  vizType: "interactive",
};

const SAMPLE_TEXT =
  "Trí tuệ nhân tạo (AI) là lĩnh vực nghiên cứu và phát triển các hệ thống máy tính có khả năng thực hiện các nhiệm vụ đòi hỏi trí thông minh con người. | Học máy (Machine Learning) là nhánh con của AI, tập trung vào việc xây dựng hệ thống học từ dữ liệu. | Học sâu (Deep Learning) sử dụng mạng nơ-ron nhiều lớp để xử lý dữ liệu phức tạp. | Xử lý ngôn ngữ tự nhiên (NLP) giúp máy tính hiểu và tạo ra ngôn ngữ con người. | Thị giác máy tính (Computer Vision) cho phép máy tính phân tích hình ảnh và video.";

const SENTENCES = SAMPLE_TEXT.split(" | ");

type ChunkMethod = "fixed" | "sentence" | "overlap";

const COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#a855f7"];

export default function ChunkingTopic() {
  const [method, setMethod] = useState<ChunkMethod>("fixed");

  const getChunks = (): string[][] => {
    switch (method) {
      case "fixed":
        return [
          [SENTENCES[0], SENTENCES[1]],
          [SENTENCES[2], SENTENCES[3]],
          [SENTENCES[4]],
        ];
      case "sentence":
        return SENTENCES.map((s) => [s]);
      case "overlap":
        return [
          [SENTENCES[0], SENTENCES[1]],
          [SENTENCES[1], SENTENCES[2]],
          [SENTENCES[2], SENTENCES[3]],
          [SENTENCES[3], SENTENCES[4]],
        ];
    }
  };

  const chunks = getChunks();

  const methods: { key: ChunkMethod; label: string; desc: string }[] = [
    { key: "fixed", label: "Kích thước cố định", desc: "Chia đều thành các đoạn bằng nhau" },
    { key: "sentence", label: "Theo câu", desc: "Mỗi câu là một đoạn riêng" },
    { key: "overlap", label: "Chồng lấp", desc: "Các đoạn chia sẻ nội dung chung" },
  ];

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn có một <strong>cuốn sách dày 500 trang</strong> và cần tìm
          thông tin nhanh. Bạn không thể nhét cả cuốn vào đầu cùng lúc!
        </p>
        <p>
          Bạn có thể <strong>xé thành từng chương</strong> (chia theo kích thước cố định),{" "}
          <strong>tách từng đoạn ý</strong> (chia theo câu), hoặc{" "}
          <strong>đánh dấu với phần chồng lấp</strong> (để không mất ngữ cảnh giữa các đoạn).
        </p>
        <p>
          Chunking trong AI cũng vậy: chia tài liệu thành các mảnh nhỏ vừa đủ để mô hình
          embedding xử lý hiệu quả!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          {/* Method selector */}
          <div className="flex flex-wrap gap-2">
            {methods.map((m) => (
              <button
                key={m.key}
                onClick={() => setMethod(m.key)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  method === m.key
                    ? "bg-accent text-white"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <p className="text-xs text-muted italic">
            {methods.find((m) => m.key === method)?.desc}
          </p>

          {/* Visual chunks */}
          <svg viewBox="0 0 650 320" className="w-full max-w-3xl mx-auto">
            <text x="325" y="20" textAnchor="middle" fill="#e2e8f0" fontSize="12" fontWeight="bold">
              Kết quả chia đoạn ({chunks.length} đoạn)
            </text>

            {chunks.map((chunk, ci) => {
              const y = 40 + ci * 65;
              const color = COLORS[ci % COLORS.length];
              return (
                <g key={ci}>
                  {/* Chunk label */}
                  <rect x="10" y={y} width="80" height="50" rx="8" fill={color} opacity={0.15}
                    stroke={color} strokeWidth="1.5" />
                  <text x="50" y={y + 22} textAnchor="middle" fill={color} fontSize="10" fontWeight="bold">
                    Đoạn {ci + 1}
                  </text>
                  <text x="50" y={y + 38} textAnchor="middle" fill="#64748b" fontSize="8">
                    {chunk.join(" ").length} ký tự
                  </text>

                  {/* Chunk content */}
                  <rect x="100" y={y} width="540" height="50" rx="8" fill="#1e293b"
                    stroke={color} strokeWidth="1" opacity={0.8} />
                  {chunk.map((sentence, si) => (
                    <text key={si} x="110" y={y + 18 + si * 16} fill="#94a3b8" fontSize="8">
                      {sentence.length > 75 ? sentence.slice(0, 75) + "..." : sentence}
                    </text>
                  ))}
                </g>
              );
            })}
          </svg>

          {/* Overlap indicator */}
          {method === "overlap" && (
            <div className="rounded-lg bg-background/50 border border-yellow-500/30 p-3">
              <p className="text-sm text-yellow-400 font-medium">Vùng chồng lấp</p>
              <p className="text-xs text-muted">
                Mỗi đoạn chia sẻ 1 câu với đoạn kế tiếp, đảm bảo không mất ngữ cảnh
                tại ranh giới giữa các đoạn.
              </p>
            </div>
          )}
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Chunking</strong> là bước tiền xử lý quan trọng trong pipeline RAG,
          chia văn bản dài thành các đoạn nhỏ phù hợp với giới hạn của mô hình embedding
          và cửa sổ ngữ cảnh.
        </p>
        <p>Ba phương pháp chunking phổ biến:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Kích thước cố định:</strong> Chia văn bản thành các đoạn có số ký tự
            hoặc token bằng nhau. Đơn giản nhưng có thể cắt giữa câu.
          </li>
          <li>
            <strong>Theo câu/đoạn:</strong> Chia theo ranh giới ngữ pháp tự nhiên, giữ
            nguyên ý nghĩa hoàn chỉnh của mỗi đoạn.
          </li>
          <li>
            <strong>Chồng lấp (Overlap):</strong> Các đoạn kề nhau chia sẻ một phần nội
            dung, đảm bảo thông tin tại ranh giới không bị mất.
          </li>
        </ol>
        <p>
          Kích thước đoạn lý tưởng thường từ <strong>256-1024 token</strong>, tùy thuộc
          vào mô hình embedding và bài toán cụ thể. Chunking tốt là nền tảng cho một
          hệ thống RAG hiệu quả.
        </p>
      </ExplanationSection>
    </>
  );
}
