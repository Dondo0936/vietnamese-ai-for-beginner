"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "fine-tuning",
  title: "Fine-tuning",
  titleVi: "Fine-tuning - Tinh chỉnh mô hình",
  description:
    "Quá trình huấn luyện thêm mô hình đã pre-train trên dữ liệu chuyên biệt để thực hiện tác vụ cụ thể.",
  category: "training-optimization",
  tags: ["fine-tuning", "transfer-learning", "training", "specialization"],
  difficulty: "intermediate",
  relatedSlugs: ["lora", "qlora", "fine-tuning-vs-prompting"],
  vizType: "static",
};

export default function FineTuningTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn là một <strong>bác sĩ đa khoa</strong> vừa tốt nghiệp.
          Bạn đã học kiến thức y khoa tổng quát trong 6 năm (<strong>Pre-training</strong>).
        </p>
        <p>
          Giờ bạn muốn trở thành <strong>bác sĩ tim mạch</strong>. Bạn không cần học
          lại từ đầu! Bạn chỉ cần học thêm 2 năm chuyên khoa tim mạch (
          <strong>Fine-tuning</strong>), xây dựng trên nền tảng kiến thức đã có.
        </p>
        <p>
          Fine-tuning mô hình AI cũng vậy: lấy mô hình đã được huấn luyện trên dữ liệu
          khổng lồ, rồi <strong>dạy thêm kiến thức chuyên biệt</strong> cho nó.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          <svg viewBox="0 0 700 380" className="w-full max-w-3xl mx-auto">
            <text x="350" y="25" textAnchor="middle" fill="#e2e8f0" fontSize="14" fontWeight="bold">
              Pre-training vs Fine-tuning
            </text>

            {/* Pre-training phase */}
            <rect x="20" y="50" width="310" height="300" rx="12" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.5" />
            <text x="175" y="77" textAnchor="middle" fill="#3b82f6" fontSize="13" fontWeight="bold">
              Giai đoạn 1: Pre-training
            </text>

            {/* Data sources */}
            <text x="175" y="100" textAnchor="middle" fill="#94a3b8" fontSize="10">
              Dữ liệu huấn luyện:
            </text>
            {["Wikipedia (60TB)", "Sách (11TB)", "Mã nguồn (1TB)", "Web crawl (300TB)"].map((d, i) => (
              <g key={i}>
                <rect x="40" y={110 + i * 30} width="270" height="22" rx="4" fill="#334155" />
                <text x="175" y={125 + i * 30} textAnchor="middle" fill="#94a3b8" fontSize="9">
                  {d}
                </text>
              </g>
            ))}

            <text x="175" y="250" textAnchor="middle" fill="#3b82f6" fontSize="10" fontWeight="bold">
              Mục tiêu: Dự đoán từ tiếp theo
            </text>

            {/* Cost info */}
            <rect x="40" y="265" width="270" height="65" rx="8" fill="#334155" />
            <text x="175" y="285" textAnchor="middle" fill="#ef4444" fontSize="9">
              Chi phí: $2-100 triệu USD
            </text>
            <text x="175" y="300" textAnchor="middle" fill="#ef4444" fontSize="9">
              Thời gian: Vài tuần - vài tháng
            </text>
            <text x="175" y="315" textAnchor="middle" fill="#ef4444" fontSize="9">
              Phần cứng: Hàng nghìn GPU
            </text>

            {/* Arrow */}
            <line x1="330" y1="200" x2="370" y2="200" stroke="#475569" strokeWidth="2.5" markerEnd="url(#arrow-ft)" />

            {/* Fine-tuning phase */}
            <rect x="370" y="50" width="310" height="300" rx="12" fill="#1e293b" stroke="#22c55e" strokeWidth="1.5" />
            <text x="525" y="77" textAnchor="middle" fill="#22c55e" fontSize="13" fontWeight="bold">
              Giai đoạn 2: Fine-tuning
            </text>

            <text x="525" y="100" textAnchor="middle" fill="#94a3b8" fontSize="10">
              Dữ liệu chuyên biệt:
            </text>
            {["Hỏi đáp y khoa (5K mẫu)", "Chẩn đoán (3K mẫu)", "Thuật ngữ chuyên ngành (2K mẫu)"].map((d, i) => (
              <g key={i}>
                <rect x="390" y={110 + i * 30} width="270" height="22" rx="4" fill="#334155" />
                <text x="525" y={125 + i * 30} textAnchor="middle" fill="#94a3b8" fontSize="9">
                  {d}
                </text>
              </g>
            ))}

            <text x="525" y="220" textAnchor="middle" fill="#22c55e" fontSize="10" fontWeight="bold">
              Mục tiêu: Chuyên gia y khoa
            </text>

            {/* Results */}
            <rect x="390" y="240" width="270" height="90" rx="8" fill="#334155" />
            <text x="525" y="260" textAnchor="middle" fill="#22c55e" fontSize="9">
              Chi phí: $10 - $1.000
            </text>
            <text x="525" y="278" textAnchor="middle" fill="#22c55e" fontSize="9">
              Thời gian: Vài giờ
            </text>
            <text x="525" y="296" textAnchor="middle" fill="#22c55e" fontSize="9">
              Phần cứng: 1-8 GPU
            </text>
            <text x="525" y="316" textAnchor="middle" fill="#86efac" fontSize="9" fontWeight="bold">
              Kết quả: Mô hình chuyên biệt!
            </text>

            <defs>
              <marker id="arrow-ft" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#475569" />
              </marker>
            </defs>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Fine-tuning</strong> là quá trình huấn luyện thêm một mô hình đã được
          pre-train trên tập dữ liệu chuyên biệt nhỏ hơn, nhằm thích ứng mô hình cho
          tác vụ hoặc lĩnh vực cụ thể.
        </p>
        <p>Các loại fine-tuning phổ biến:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Full Fine-tuning:</strong> Cập nhật tất cả trọng số của mô hình. Hiệu
            quả nhất nhưng tốn nhiều bộ nhớ GPU và dễ overfitting trên tập nhỏ.
          </li>
          <li>
            <strong>SFT (Supervised Fine-Tuning):</strong> Huấn luyện mô hình trên các
            cặp (instruction, response) để học cách tuân theo chỉ dẫn.
          </li>
          <li>
            <strong>PEFT (Parameter-Efficient):</strong> Chỉ cập nhật một phần nhỏ trọng
            số (LoRA, Adapter, Prefix-tuning), tiết kiệm bộ nhớ đáng kể.
          </li>
        </ol>
        <p>
          Fine-tuning là cầu nối giữa mô hình đa năng và mô hình chuyên gia. Nhờ
          transfer learning, chỉ cần vài nghìn mẫu dữ liệu chất lượng là có thể
          tạo ra mô hình chuyên biệt hiệu quả.
        </p>
      </ExplanationSection>
    </>
  );
}
