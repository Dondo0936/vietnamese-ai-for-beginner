"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "text-classification",
  title: "Text Classification",
  titleVi: "Phân loại văn bản",
  description:
    "Tác vụ gán nhãn danh mục cho văn bản, ứng dụng trong lọc thư rác, phân loại tin tức và phân tích ý kiến.",
  category: "nlp",
  tags: ["nlp", "classification", "supervised-learning"],
  difficulty: "beginner",
  relatedSlugs: ["sentiment-analysis", "bag-of-words", "bert"],
  vizType: "static",
};

const PIPELINE_STEPS = [
  { label: "Văn bản thô", desc: "\"Sản phẩm tuyệt vời!\"", color: "#3b82f6" },
  { label: "Tiền xử lý", desc: "Tách từ, loại stopword", color: "#8b5cf6" },
  { label: "Trích đặc trưng", desc: "BoW / TF-IDF / BERT", color: "#ec4899" },
  { label: "Mô hình", desc: "SVM / LSTM / Transformer", color: "#f59e0b" },
  { label: "Nhãn", desc: "Tích cực (0.94)", color: "#22c55e" },
];

const CATEGORIES = [
  { name: "Thể thao", examples: "bóng đá, giải đấu, huấn luyện viên", color: "#3b82f6" },
  { name: "Kinh tế", examples: "chứng khoán, lạm phát, GDP", color: "#22c55e" },
  { name: "Công nghệ", examples: "AI, smartphone, phần mềm", color: "#8b5cf6" },
  { name: "Giải trí", examples: "phim, ca sĩ, concert", color: "#f59e0b" },
];

export default function TextClassificationTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn là <strong>nhân viên bưu điện</strong> phân loại
          thư. Mỗi lá thư cần được bỏ vào đúng ngăn: hóa đơn, quảng cáo, thư
          cá nhân, công văn... Bạn đọc lướt nội dung rồi quyết định.
        </p>
        <p>
          Phân loại văn bản tự động hóa quá trình này — máy tính{" "}
          <strong>đọc và gán nhãn</strong> cho hàng triệu văn bản mỗi ngày.
          Email rác, tin tức thể thao, đánh giá sản phẩm — tất cả được sắp xếp
          gọn gàng vào đúng danh mục!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          <svg viewBox="0 0 600 280" className="w-full max-w-2xl mx-auto">
            {/* Pipeline */}
            <text x="300" y="20" textAnchor="middle" fill="#e2e8f0" fontSize="13" fontWeight="bold">
              Pipeline phân loại văn bản
            </text>

            {PIPELINE_STEPS.map((step, i) => {
              const x = 20 + i * 115;
              return (
                <g key={step.label}>
                  <rect
                    x={x}
                    y="35"
                    width="100"
                    height="55"
                    rx="8"
                    fill={step.color}
                    opacity={0.2}
                    stroke={step.color}
                    strokeWidth="1.5"
                  />
                  <text
                    x={x + 50}
                    y="55"
                    textAnchor="middle"
                    fill={step.color}
                    fontSize="10"
                    fontWeight="bold"
                  >
                    {step.label}
                  </text>
                  <text
                    x={x + 50}
                    y="75"
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="8"
                  >
                    {step.desc}
                  </text>
                  {i < PIPELINE_STEPS.length - 1 && (
                    <text
                      x={x + 110}
                      y="62"
                      fill="#475569"
                      fontSize="16"
                    >
                      &rarr;
                    </text>
                  )}
                </g>
              );
            })}

            {/* Categories */}
            <text x="300" y="130" textAnchor="middle" fill="#e2e8f0" fontSize="13" fontWeight="bold">
              Ví dụ: Phân loại tin tức
            </text>

            {CATEGORIES.map((cat, i) => {
              const x = 30 + i * 142;
              return (
                <g key={cat.name}>
                  <rect
                    x={x}
                    y="145"
                    width="130"
                    height="70"
                    rx="8"
                    fill="#1e293b"
                    stroke={cat.color}
                    strokeWidth="1.5"
                  />
                  <rect
                    x={x}
                    y="145"
                    width="130"
                    height="24"
                    rx="8"
                    fill={cat.color}
                    opacity={0.8}
                  />
                  <rect
                    x={x}
                    y="160"
                    width="130"
                    height="10"
                    fill={cat.color}
                    opacity={0.8}
                  />
                  <text
                    x={x + 65}
                    y="162"
                    textAnchor="middle"
                    fill="white"
                    fontSize="11"
                    fontWeight="bold"
                  >
                    {cat.name}
                  </text>
                  <text
                    x={x + 65}
                    y="195"
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="9"
                  >
                    {cat.examples}
                  </text>
                </g>
              );
            })}

            {/* Note */}
            <text x="300" y="260" textAnchor="middle" fill="#64748b" fontSize="10">
              Mỗi bài viết được gán vào một (hoặc nhiều) danh mục
            </text>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Text Classification</strong> (Phân loại văn bản) là tác vụ
          cơ bản và quan trọng nhất trong NLP — gán một hoặc nhiều nhãn danh
          mục cho văn bản đầu vào.
        </p>
        <p>Ứng dụng thực tế:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Lọc thư rác:</strong> Phân loại email là spam hoặc không
            spam (phân loại nhị phân).
          </li>
          <li>
            <strong>Phân loại tin tức:</strong> Gán chuyên mục cho bài báo —
            thể thao, kinh tế, công nghệ (đa lớp).
          </li>
          <li>
            <strong>Phân tích ý định:</strong> Xác định mục đích của người dùng
            trong chatbot — đặt hàng, hỏi thông tin, khiếu nại.
          </li>
          <li>
            <strong>Phát hiện ngôn ngữ độc hại:</strong> Tự động phát hiện nội
            dung vi phạm quy tắc cộng đồng.
          </li>
        </ol>
        <p>
          Pipeline điển hình: tiền xử lý văn bản → trích xuất đặc trưng (BoW,
          TF-IDF, hoặc embeddings) → mô hình phân loại (SVM, LSTM, BERT).
          Hiện nay, fine-tuning các mô hình tiền huấn luyện như BERT cho kết
          quả tốt nhất.
        </p>
      </ExplanationSection>
    </>
  );
}
