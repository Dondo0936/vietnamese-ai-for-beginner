"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "naive-bayes",
  title: "Naive Bayes",
  titleVi: "Bayes ngây thơ",
  description: "Thuật toán phân loại dựa trên định lý Bayes với giả định các đặc trưng độc lập",
  category: "classic-ml",
  tags: ["classification", "probability", "supervised-learning"],
  difficulty: "beginner",
  relatedSlugs: ["logistic-regression", "decision-trees", "confusion-matrix"],
  vizType: "static",
};

export default function NaiveBayesTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn nhận được một email và muốn biết nó là <strong>spam</strong>
          hay không. Bạn nhìn từng từ riêng lẻ: &quot;khuyến mãi&quot; &mdash; spam hay
          không? &quot;miễn phí&quot; &mdash; spam hay không? &quot;họp&quot; &mdash; spam hay
          không?
        </p>
        <p>
          Bạn kết hợp xác suất của từng từ (giả sử chúng <strong>độc lập</strong> nhau)
          để đưa ra quyết định cuối cùng. Đây chính là <strong>Bayes ngây thơ</strong> &mdash;
          &quot;ngây thơ&quot; vì giả định các đặc trưng không liên quan đến nhau.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <svg
          viewBox="0 0 500 320"
          className="w-full rounded-lg border border-border bg-background"
        >
          {/* Title */}
          <text x={250} y={25} fontSize={13} fill="currentColor" className="text-foreground" textAnchor="middle" fontWeight={600}>
            Luồng xác suất Naive Bayes
          </text>

          {/* Input email */}
          <rect x={180} y={40} width={140} height={30} rx={8} fill="#3b82f6" opacity={0.15} stroke="#3b82f6" strokeWidth={1.5} />
          <text x={250} y={60} fontSize={12} fill="#3b82f6" textAnchor="middle" fontWeight={600}>
            Email mới
          </text>

          {/* Arrow down */}
          <line x1={250} y1={70} x2={250} y2={90} stroke="#888" strokeWidth={1.5} />
          <polygon points="250,95 245,88 255,88" fill="#888" />

          {/* Features */}
          {[
            { word: '"khuyến mãi"', pSpam: "0.8", pHam: "0.1", x: 80 },
            { word: '"miễn phí"', pSpam: "0.7", pHam: "0.05", x: 250 },
            { word: '"báo cáo"', pSpam: "0.1", pHam: "0.6", x: 420 },
          ].map((f, i) => (
            <g key={i}>
              <rect x={f.x - 65} y={100} width={130} height={55} rx={8} fill="#f97316" opacity={0.1} stroke="#f97316" strokeWidth={1} />
              <text x={f.x} y={118} fontSize={12} fill="#f97316" textAnchor="middle" fontWeight={600}>
                {f.word}
              </text>
              <text x={f.x} y={135} fontSize={10} fill="#ef4444" textAnchor="middle">
                P(word|Spam) = {f.pSpam}
              </text>
              <text x={f.x} y={148} fontSize={10} fill="#22c55e" textAnchor="middle">
                P(word|Ham) = {f.pHam}
              </text>

              {/* Arrow to combiner */}
              <line x1={f.x} y1={155} x2={250} y2={190} stroke="#888" strokeWidth={1} />
            </g>
          ))}

          {/* Combiner */}
          <polygon points="250,185 215,195 250,260 285,195" fill="#8b5cf6" opacity={0.15} stroke="#8b5cf6" strokeWidth={1.5} />
          <text x={250} y={215} fontSize={10} fill="#8b5cf6" textAnchor="middle" fontWeight={600}>
            Nhân xác suất
          </text>
          <text x={250} y={230} fontSize={9} fill="#8b5cf6" textAnchor="middle">
            P(Spam|words) &prop;
          </text>
          <text x={250} y={245} fontSize={9} fill="#8b5cf6" textAnchor="middle">
            P(Spam) &times; &prod;P(wᵢ|Spam)
          </text>

          {/* Arrow to result */}
          <line x1={250} y1={260} x2={250} y2={275} stroke="#888" strokeWidth={1.5} />
          <polygon points="250,280 245,273 255,273" fill="#888" />

          {/* Result */}
          <rect x={180} y={282} width={140} height={30} rx={8} fill="#ef4444" opacity={0.15} stroke="#ef4444" strokeWidth={1.5} />
          <text x={250} y={302} fontSize={12} fill="#ef4444" textAnchor="middle" fontWeight={600}>
            Spam (95.2%)
          </text>
        </svg>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Naive Bayes</strong> dựa trên <strong>định lý Bayes</strong>:
          <em> P(lớp|dữ liệu) &prop; P(dữ liệu|lớp) &times; P(lớp)</em>. Giả định
          &quot;ngây thơ&quot; là các đặc trưng <strong>độc lập có điều kiện</strong> với
          nhau khi biết lớp.
        </p>
        <p>
          Nhờ giả định này, thay vì tính <em>P(x₁, x₂, ..., xₙ | lớp)</em> (rất phức tạp),
          ta chỉ cần nhân: <em>P(x₁|lớp) &times; P(x₂|lớp) &times; ... &times; P(xₙ|lớp)</em>.
          Điều này giúp Naive Bayes <strong>nhanh</strong> và <strong>hiệu quả</strong> ngay
          cả với dữ liệu chiều rất cao.
        </p>
        <p>
          Ứng dụng kinh điển: <strong>lọc spam email</strong>, phân loại văn bản, phân tích
          cảm xúc. Mặc dù giả định độc lập thường sai trong thực tế, Naive Bayes vẫn cho
          kết quả tốt đáng ngạc nhiên.
        </p>
      </ExplanationSection>
    </>
  );
}
