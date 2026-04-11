"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "residual-connections",
  title: "Residual Connections",
  titleVi: "Kết nối tắt",
  description: "Đường tắt cho gradient đi qua, cho phép huấn luyện mạng rất sâu mà không bị gradient biến mất",
  category: "dl-architectures",
  tags: ["architecture", "training", "optimization"],
  difficulty: "intermediate",
  relatedSlugs: ["transformer", "cnn", "u-net"],
  vizType: "static",
};

export default function ResidualConnectionsTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang truyền tin nhắn qua <strong>10 người trung gian</strong>.
          Qua mỗi người, tin nhắn bị méo mó một chút. Đến người cuối cùng, tin nhắn gốc
          đã biến dạng hoàn toàn.
        </p>
        <p>
          <strong>Kết nối tắt (skip connection)</strong> giống như <strong>gửi bản sao tin
          nhắn gốc</strong> trực tiếp cho người cuối, bỏ qua tất cả trung gian. Người cuối
          so sánh bản sao với bản đã truyền qua, nên luôn giữ được thông tin gốc.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <svg
          viewBox="0 0 500 300"
          className="w-full rounded-lg border border-border bg-background"
        >
          {/* Without skip connection (left) */}
          <text x={120} y={20} fontSize={12} fill="#ef4444" textAnchor="middle" fontWeight={600}>
            Không có Skip Connection
          </text>

          {["Input x", "Layer 1", "Layer 2", "Output"].map((name, i) => {
            const y = 40 + i * 65;
            const opacity = 1 - i * 0.2;
            return (
              <g key={`no-skip-${i}`}>
                <rect x={60} y={y} width={120} height={35} rx={8}
                  fill="#ef4444" opacity={0.1 * opacity + 0.05}
                  stroke="#ef4444" strokeWidth={1} />
                <text x={120} y={y + 22} fontSize={11} fill="#ef4444" textAnchor="middle"
                  opacity={opacity}>
                  {name}
                </text>
                {i < 3 && (
                  <>
                    <line x1={120} y1={y + 35} x2={120} y2={y + 65}
                      stroke="#ef4444" strokeWidth={1.5} opacity={opacity * 0.5} />
                    <polygon
                      points={`120,${y + 65} 116,${y + 58} 124,${y + 58}`}
                      fill="#ef4444" opacity={opacity * 0.5}
                    />
                  </>
                )}
              </g>
            );
          })}

          <text x={120} y={290} fontSize={10} fill="#ef4444" textAnchor="middle">
            Gradient yếu dần qua mỗi lớp
          </text>

          {/* With skip connection (right) */}
          <text x={370} y={20} fontSize={12} fill="#22c55e" textAnchor="middle" fontWeight={600}>
            Có Skip Connection
          </text>

          {["Input x", "F(x)", "+ (Add)", "Output = F(x) + x"].map((name, i) => {
            const y = 40 + i * 65;
            return (
              <g key={`skip-${i}`}>
                <rect x={300} y={y} width={140} height={35} rx={8}
                  fill={i === 2 ? "#f59e0b" : "#22c55e"}
                  opacity={0.15}
                  stroke={i === 2 ? "#f59e0b" : "#22c55e"}
                  strokeWidth={i === 2 ? 2 : 1} />
                <text x={370} y={y + 22} fontSize={11}
                  fill={i === 2 ? "#f59e0b" : "#22c55e"}
                  textAnchor="middle" fontWeight={i === 2 ? 700 : 400}>
                  {name}
                </text>
                {i < 3 && i !== 2 && (
                  <>
                    <line x1={370} y1={y + 35} x2={370} y2={y + 65}
                      stroke="#22c55e" strokeWidth={1.5} />
                    <polygon points={`370,${y + 65} 366,${y + 58} 374,${y + 58}`} fill="#22c55e" />
                  </>
                )}
              </g>
            );
          })}

          {/* Skip connection arrow (the key visual) */}
          <path
            d="M 295,57 L 268,57 L 268,192 L 295,192"
            fill="none" stroke="#3b82f6" strokeWidth={3} strokeDasharray="8 4"
          />
          <polygon points="295,192 288,186 288,198" fill="#3b82f6" />
          <text x={256} y={130} fontSize={11} fill="#3b82f6" textAnchor="middle" fontWeight={700}
            transform="rotate(-90, 256, 130)">
            Skip (x)
          </text>

          {/* Arrow from add to output */}
          <line x1={370} y1={205} x2={370} y2={235} stroke="#22c55e" strokeWidth={1.5} />
          <polygon points="370,235 366,228 374,228" fill="#22c55e" />

          <text x={370} y={290} fontSize={10} fill="#22c55e" textAnchor="middle">
            Gradient chảy qua đường tắt, luôn mạnh!
          </text>
        </svg>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Residual Connection (Skip Connection)</strong> cộng input x trực tiếp vào
          output của lớp: <em>output = F(x) + x</em>. Thay vì học toàn bộ ánh xạ mong muốn
          H(x), mạng chỉ cần học <strong>phần dư (residual)</strong> F(x) = H(x) - x.
        </p>
        <p>
          Lợi ích chính: gradient có <strong>đường tắt</strong> chảy ngược từ cuối về đầu
          mà không bị suy giảm. Nhờ vậy có thể huấn luyện mạng <strong>rất sâu</strong>
          (100+ lớp). Trước ResNet (2015), mạng sâu hơn 20 lớp gần như không thể huấn luyện.
        </p>
        <p>
          Residual connection có mặt khắp nơi: <strong>ResNet</strong> (CNN), mỗi lớp trong
          <strong> Transformer</strong>, <strong>U-Net</strong>. Biến thể:
          <strong> Pre-Norm</strong> (LayerNorm trước attention, dùng trong GPT) vs
          <strong> Post-Norm</strong> (LayerNorm sau, dùng trong BERT gốc).
        </p>
      </ExplanationSection>
    </>
  );
}
