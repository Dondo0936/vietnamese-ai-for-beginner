"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "style-transfer",
  title: "Style Transfer",
  titleVi: "Chuyển đổi phong cách",
  description:
    "Kỹ thuật áp dụng phong cách nghệ thuật của một ảnh lên nội dung của ảnh khác bằng mạng nơ-ron.",
  category: "computer-vision",
  tags: ["computer-vision", "generative", "artistic"],
  difficulty: "intermediate",
  relatedSlugs: ["cnn", "feature-extraction-cnn", "gan"],
  vizType: "static",
};

export default function StyleTransferTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn có bức ảnh phong cảnh Hà Nội và muốn nó trông
          như tranh của <strong>Claude Monet</strong> — giữ nguyên cảnh Hồ Gươm
          nhưng vẽ bằng <strong>nét cọ ấn tượng</strong>, màu sắc rực rỡ đặc
          trưng của Monet.
        </p>
        <p>
          Style Transfer tách ảnh thành hai phần:{" "}
          <strong>nội dung</strong> (cái gì trong ảnh) và{" "}
          <strong>phong cách</strong> (ảnh trông như thế nào). Rồi nó kết hợp
          nội dung của ảnh A với phong cách của ảnh B — như thuê một họa sĩ
          nổi tiếng vẽ lại cảnh quen thuộc!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          <svg viewBox="0 0 600 320" className="w-full max-w-2xl mx-auto">
            {/* Content image */}
            <rect x="20" y="20" width="160" height="120" rx="8" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
            {/* Simple landscape */}
            <rect x="25" y="90" width="150" height="45" fill="#22c55e" opacity={0.4} />
            <circle cx="60" cy="60" r="15" fill="#f59e0b" opacity={0.5} />
            <rect x="100" y="65" width="40" height="50" fill="#64748b" opacity={0.4} />
            <polygon points="100,65 120,40 140,65" fill="#64748b" opacity={0.5} />
            <text x="100" y="160" textAnchor="middle" fill="#3b82f6" fontSize="12" fontWeight="bold">
              Ảnh nội dung
            </text>
            <text x="100" y="175" textAnchor="middle" fill="#64748b" fontSize="9">
              Phong cảnh Hà Nội
            </text>

            {/* Plus */}
            <text x="210" y="85" fill="#94a3b8" fontSize="24" fontWeight="bold">+</text>

            {/* Style image */}
            <rect x="240" y="20" width="160" height="120" rx="8" fill="#1e293b" stroke="#8b5cf6" strokeWidth="2" />
            {/* Abstract art patterns */}
            <circle cx="280" cy="50" r="20" fill="#ef4444" opacity={0.4} />
            <circle cx="340" cy="70" r="25" fill="#3b82f6" opacity={0.3} />
            <circle cx="300" cy="100" r="18" fill="#f59e0b" opacity={0.4} />
            <rect x="360" y="30" width="30" height="30" fill="#22c55e" opacity={0.3} transform="rotate(15,375,45)" />
            {/* Wavy lines for brushstrokes */}
            <path d="M250,60 Q270,40 290,60 Q310,80 330,60" fill="none" stroke="#ec4899" strokeWidth="3" opacity={0.4} />
            <path d="M260,100 Q280,80 300,100 Q320,120 340,100" fill="none" stroke="#8b5cf6" strokeWidth="3" opacity={0.4} />
            <text x="320" y="160" textAnchor="middle" fill="#8b5cf6" fontSize="12" fontWeight="bold">
              Ảnh phong cách
            </text>
            <text x="320" y="175" textAnchor="middle" fill="#64748b" fontSize="9">
              Tranh nghệ thuật
            </text>

            {/* Equals */}
            <text x="430" y="85" fill="#94a3b8" fontSize="24" fontWeight="bold">=</text>

            {/* Result image */}
            <rect x="460" y="20" width="120" height="120" rx="8" fill="#1e293b" stroke="#22c55e" strokeWidth="2" />
            {/* Same landscape but with artistic style */}
            <rect x="465" y="90" width="110" height="45" fill="#22c55e" opacity={0.3} />
            <circle cx="495" cy="60" r="15" fill="#f59e0b" opacity={0.4} />
            <rect x="530" y="65" width="30" height="50" fill="#64748b" opacity={0.3} />
            <polygon points="530,65 545,45 560,65" fill="#64748b" opacity={0.4} />
            {/* Style overlay effects */}
            <path d="M470,55 Q490,45 510,55 Q530,65 550,55" fill="none" stroke="#ec4899" strokeWidth="2" opacity={0.5} />
            <path d="M470,85 Q490,75 510,85 Q530,95 550,85" fill="none" stroke="#8b5cf6" strokeWidth="2" opacity={0.4} />
            <circle cx="510" cy="70" r="8" fill="#ef4444" opacity={0.15} />
            <text x="520" y="160" textAnchor="middle" fill="#22c55e" fontSize="12" fontWeight="bold">
              Kết quả
            </text>
            <text x="520" y="175" textAnchor="middle" fill="#64748b" fontSize="9">
              Nội dung + Phong cách
            </text>

            {/* Process explanation */}
            <rect x="30" y="200" width="540" height="100" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="1" />
            <text x="300" y="225" textAnchor="middle" fill="#e2e8f0" fontSize="12" fontWeight="bold">
              Quá trình Style Transfer qua CNN
            </text>

            {/* Steps */}
            <rect x="50" y="240" width="120" height="40" rx="6" fill="#3b82f6" opacity={0.2} stroke="#3b82f6" strokeWidth="1" />
            <text x="110" y="258" textAnchor="middle" fill="#3b82f6" fontSize="9" fontWeight="bold">Content Loss</text>
            <text x="110" y="272" textAnchor="middle" fill="#64748b" fontSize="8">Lớp sâu (Conv4)</text>

            <text x="190" y="262" fill="#475569" fontSize="14">+</text>

            <rect x="210" y="240" width="120" height="40" rx="6" fill="#8b5cf6" opacity={0.2} stroke="#8b5cf6" strokeWidth="1" />
            <text x="270" y="258" textAnchor="middle" fill="#8b5cf6" fontSize="9" fontWeight="bold">Style Loss</text>
            <text x="270" y="272" textAnchor="middle" fill="#64748b" fontSize="8">Gram matrix</text>

            <text x="348" y="262" fill="#475569" fontSize="14">&rarr;</text>

            <rect x="370" y="240" width="180" height="40" rx="6" fill="#22c55e" opacity={0.2} stroke="#22c55e" strokeWidth="1" />
            <text x="460" y="258" textAnchor="middle" fill="#22c55e" fontSize="9" fontWeight="bold">Tối ưu hóa ảnh đầu ra</text>
            <text x="460" y="272" textAnchor="middle" fill="#64748b" fontSize="8">Gradient descent trên pixel</text>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Neural Style Transfer</strong> (Gatys et al., 2015) sử dụng
          CNN (thường VGG-19) để tách và kết hợp nội dung và phong cách từ
          hai ảnh khác nhau.
        </p>
        <p>Quy trình hoạt động:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Content representation:</strong> Đặc trưng từ lớp sâu của
            CNN nắm bắt nội dung (bố cục, đối tượng). Content loss đo sự
            khác biệt giữa ảnh kết quả và ảnh nội dung.
          </li>
          <li>
            <strong>Style representation:</strong> Gram matrix của đặc trưng
            CNN nắm bắt phong cách (kết cấu, nét cọ, màu sắc). Style loss
            đo sự khác biệt giữa ảnh kết quả và ảnh phong cách.
          </li>
          <li>
            <strong>Tối ưu hóa:</strong> Bắt đầu từ ảnh nhiễu, sử dụng
            gradient descent để giảm thiểu tổng content loss + style loss.
          </li>
        </ol>
        <p>
          Phương pháp gốc chậm (cần tối ưu từng ảnh). Phương pháp nhanh hơn
          dùng <strong>feed-forward network</strong> (Johnson et al.) huấn luyện
          sẵn cho một phong cách cụ thể, hoặc <strong>AdaIN</strong> cho phong
          cách tùy ý trong thời gian thực.
        </p>
      </ExplanationSection>
    </>
  );
}
