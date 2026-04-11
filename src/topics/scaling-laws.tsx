"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "scaling-laws",
  title: "Scaling Laws",
  titleVi: "Định luật tỷ lệ",
  description:
    "Quy luật dự đoán hiệu suất mô hình dựa trên kích thước tham số, dữ liệu và compute",
  category: "llm-concepts",
  tags: ["scaling", "compute", "chinchilla"],
  difficulty: "intermediate",
  relatedSlugs: ["llm-overview", "training-optimization", "cost-optimization"],
  vizType: "static",
};

export default function ScalingLawsTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang xây một ngôi nhà. Scaling laws giống như biết được:
          nếu bạn <strong>gấp đôi số gạch</strong> (tham số), <strong>gấp đôi đất</strong> (dữ liệu),
          và <strong>gấp đôi công nhân</strong> (compute) — ngôi nhà sẽ tốt hơn bao nhiêu?
        </p>
        <p>
          Điều kỳ diệu là: hiệu suất AI cải thiện theo <strong>quy luật luỹ thừa</strong> (power law)
          rất đều đặn khi tăng quy mô — cho phép chúng ta <strong>dự đoán</strong> mô hình lớn hơn
          sẽ hoạt động tốt đến mức nào, trước khi thực sự huấn luyện nó!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <svg viewBox="0 0 600 350" className="w-full max-w-2xl mx-auto">
          {/* Title */}
          <text x={300} y={20} textAnchor="middle" fontSize={14} fill="#0f172a" fontWeight="bold">
            Ba trục của Scaling Laws
          </text>

          {/* Three axes diagram */}
          {/* Parameters axis */}
          <g transform="translate(100, 60)">
            <rect x={0} y={0} width={120} height={100} fill="#dbeafe" rx={8} />
            <text x={60} y={25} textAnchor="middle" fontSize={12} fill="#1e40af" fontWeight="bold">Tham số (N)</text>
            <text x={60} y={45} textAnchor="middle" fontSize={10} fill="#3b82f6">1M → 1B → 1T</text>
            <rect x={15} y={55} width={20} height={15} fill="#3b82f6" opacity={0.3} rx={2} />
            <rect x={40} y={45} width={20} height={25} fill="#3b82f6" opacity={0.5} rx={2} />
            <rect x={65} y={30} width={20} height={40} fill="#3b82f6" opacity={0.7} rx={2} />
            <rect x={90} y={20} width={20} height={50} fill="#3b82f6" opacity={0.9} rx={2} />
          </g>

          {/* Data axis */}
          <g transform="translate(240, 60)">
            <rect x={0} y={0} width={120} height={100} fill="#dcfce7" rx={8} />
            <text x={60} y={25} textAnchor="middle" fontSize={12} fill="#166534" fontWeight="bold">Dữ liệu (D)</text>
            <text x={60} y={45} textAnchor="middle" fontSize={10} fill="#22c55e">1GB → 1TB → 10TB</text>
            <rect x={15} y={55} width={20} height={15} fill="#22c55e" opacity={0.3} rx={2} />
            <rect x={40} y={45} width={20} height={25} fill="#22c55e" opacity={0.5} rx={2} />
            <rect x={65} y={30} width={20} height={40} fill="#22c55e" opacity={0.7} rx={2} />
            <rect x={90} y={20} width={20} height={50} fill="#22c55e" opacity={0.9} rx={2} />
          </g>

          {/* Compute axis */}
          <g transform="translate(380, 60)">
            <rect x={0} y={0} width={120} height={100} fill="#fef3c7" rx={8} />
            <text x={60} y={25} textAnchor="middle" fontSize={12} fill="#92400e" fontWeight="bold">Compute (C)</text>
            <text x={60} y={45} textAnchor="middle" fontSize={10} fill="#f59e0b">FLOPs tăng dần</text>
            <rect x={15} y={55} width={20} height={15} fill="#f59e0b" opacity={0.3} rx={2} />
            <rect x={40} y={45} width={20} height={25} fill="#f59e0b" opacity={0.5} rx={2} />
            <rect x={65} y={30} width={20} height={40} fill="#f59e0b" opacity={0.7} rx={2} />
            <rect x={90} y={20} width={20} height={50} fill="#f59e0b" opacity={0.9} rx={2} />
          </g>

          {/* Loss curve */}
          <text x={300} y={195} textAnchor="middle" fontSize={12} fill="#64748b">Loss giảm theo power law khi tăng quy mô</text>
          <g transform="translate(50, 210)">
            <line x1={40} y1={0} x2={40} y2={110} stroke="#94a3b8" strokeWidth={1} />
            <line x1={40} y1={110} x2={500} y2={110} stroke="#94a3b8" strokeWidth={1} />
            <text x={20} y={60} textAnchor="middle" fontSize={10} fill="#64748b" transform="rotate(-90, 20, 60)">Loss</text>
            <text x={270} y={128} textAnchor="middle" fontSize={10} fill="#64748b">Compute (log scale)</text>

            {/* Power law curve */}
            <path
              d="M 50 10 Q 100 25, 150 45 Q 200 60, 250 68 Q 300 74, 350 78 Q 400 81, 450 83 L 490 84"
              fill="none" stroke="#8b5cf6" strokeWidth={3}
            />

            {/* Model points */}
            {[
              { x: 80, y: 22, label: "GPT-2", size: 4 },
              { x: 180, y: 52, label: "GPT-3", size: 6 },
              { x: 300, y: 72, label: "GPT-4", size: 8 },
              { x: 420, y: 82, label: "GPT-5?", size: 10 },
            ].map((m, i) => (
              <g key={i}>
                <circle cx={m.x} cy={m.y} r={m.size} fill="#8b5cf6" opacity={i === 3 ? 0.4 : 0.8} />
                <text x={m.x} y={m.y - m.size - 4} textAnchor="middle" fontSize={9} fill="#0f172a" fontWeight="bold">
                  {m.label}
                </text>
              </g>
            ))}

            {/* Chinchilla optimal line */}
            <path d="M 120 15 L 400 75" fill="none" stroke="#22c55e" strokeWidth={1.5} strokeDasharray="4 3" />
            <text x={350} y={62} fontSize={9} fill="#22c55e">Chinchilla optimal</text>
          </g>
        </svg>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Scaling Laws</strong> là các quy luật toán học mô tả mối quan hệ giữa
          hiệu suất mô hình và ba yếu tố: kích thước mô hình (N), lượng dữ liệu (D), và
          tổng compute (C).
        </p>
        <p>Hai phát hiện quan trọng:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Kaplan et al. (2020):</strong> Loss giảm theo power law: L(N) ∝ N^(-α).
            Ưu tiên tăng kích thước mô hình, ngay cả khi dữ liệu hạn chế.
          </li>
          <li>
            <strong>Chinchilla (2022):</strong> Với ngân sách compute cố định, nên cân bằng
            giữa kích thước mô hình và lượng dữ liệu. Quy tắc: số token ≈ 20× số tham số.
            Ví dụ: mô hình 70B cần ~1.4T token.
          </li>
        </ol>
        <p>Ý nghĩa thực tiễn:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li><strong>Dự đoán:</strong> Huấn luyện mô hình nhỏ, ngoại suy hiệu suất mô hình lớn → tiết kiệm chi phí thử nghiệm.</li>
          <li><strong>Phân bổ ngân sách:</strong> Biết chính xác nên đầu tư vào mô hình lớn hơn hay dữ liệu nhiều hơn.</li>
          <li><strong>Xu hướng 2025:</strong> Dữ liệu chất lượng cao (curated data) có thể thay đổi hệ số scaling, cho phép mô hình nhỏ hơn đạt hiệu suất tương đương.</li>
        </ul>
      </ExplanationSection>
    </>
  );
}
