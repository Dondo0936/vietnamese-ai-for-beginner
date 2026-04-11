"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "ai-governance",
  title: "AI Governance",
  titleVi: "Quản trị AI — Luật chơi cho trí tuệ nhân tạo",
  description:
    "Khung pháp lý, chính sách và quy trình quản lý việc phát triển, triển khai và sử dụng hệ thống AI một cách có trách nhiệm.",
  category: "ai-safety",
  tags: ["governance", "regulation", "policy", "ethics"],
  difficulty: "intermediate",
  relatedSlugs: ["alignment", "bias-fairness", "explainability"],
  vizType: "static",
};

export default function AIGovernanceTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng <strong>giao thông đường bộ</strong>. Xe hơi rất tiện lợi nhưng
          cũng nguy hiểm — nên xã hội tạo ra <strong>luật giao thông</strong>,
          <strong> bằng lái</strong>, <strong>đăng kiểm</strong>, và <strong>bảo hiểm</strong>.
        </p>
        <p>
          AI cũng vậy — rất hữu ích nhưng cần có <strong>khung quản trị</strong>:
          ai được phát triển AI? phải đáp ứng tiêu chuẩn gì? ai chịu trách nhiệm khi AI sai?
          Quản trị AI giống như luật giao thông cho trí tuệ nhân tạo.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <svg viewBox="0 0 600 300" className="w-full max-w-2xl mx-auto">
            {/* Three pillars */}
            {[
              { label: "Pháp lý", items: ["EU AI Act", "Luật AI quốc gia", "Quy định ngành"], color: "#3b82f6", x: 100 },
              { label: "Chính sách", items: ["Đánh giá rủi ro", "Kiểm toán AI", "Báo cáo minh bạch"], color: "#22c55e", x: 300 },
              { label: "Đạo đức", items: ["Quyền con người", "Công bằng", "Trách nhiệm giải trình"], color: "#f59e0b", x: 500 },
            ].map((pillar, i) => (
              <g key={i}>
                <rect x={pillar.x - 80} y={20} width={160} height={40} rx={8} fill={pillar.color} />
                <text x={pillar.x} y={45} textAnchor="middle" fill="white" fontSize={12} fontWeight="bold">
                  {pillar.label}
                </text>
                {pillar.items.map((item, j) => (
                  <g key={j}>
                    <line x1={pillar.x} y1={60 + j * 50} x2={pillar.x} y2={85 + j * 50} stroke="#475569" strokeWidth={1.5} />
                    <rect x={pillar.x - 70} y={85 + j * 50} width={140} height={30} rx={6} fill="#1e293b" stroke={pillar.color} strokeWidth={1} />
                    <text x={pillar.x} y={105 + j * 50} textAnchor="middle" fill="#e2e8f0" fontSize={9}>
                      {item}
                    </text>
                  </g>
                ))}
              </g>
            ))}

            {/* Foundation bar */}
            <rect x={20} y={260} width={560} height={30} rx={8} fill="#1e293b" stroke="#8b5cf6" strokeWidth={2} />
            <text x={300} y={280} textAnchor="middle" fill="#8b5cf6" fontSize={11} fontWeight="bold">
              Nền tảng: Quyền con người & Phát triển bền vững
            </text>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Quản trị AI (AI Governance)</strong> bao gồm các khung pháp lý, chính sách
          và quy trình giúp đảm bảo hệ thống AI được phát triển và triển khai một cách
          có trách nhiệm, công bằng và an toàn.
        </p>
        <p>Ba trụ cột chính của quản trị AI:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Pháp lý:</strong> Các luật và quy định bắt buộc — EU AI Act phân loại
            AI theo mức độ rủi ro, GDPR bảo vệ dữ liệu cá nhân.
          </li>
          <li>
            <strong>Chính sách tổ chức:</strong> Quy trình nội bộ — đánh giá tác động AI,
            kiểm toán định kỳ, quản lý rủi ro.
          </li>
          <li>
            <strong>Đạo đức:</strong> Nguyên tắc hướng dẫn — tôn trọng quyền con người,
            đảm bảo công bằng, minh bạch và trách nhiệm giải trình.
          </li>
        </ol>
        <p>
          Quản trị AI không nhằm <strong>kìm hãm đổi mới</strong> mà giúp xây dựng
          <strong> niềm tin</strong> vào AI, tạo nền tảng cho sự phát triển bền vững
          có lợi cho toàn xã hội.
        </p>
      </ExplanationSection>
    </>
  );
}
