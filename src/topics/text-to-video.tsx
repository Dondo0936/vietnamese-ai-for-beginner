"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "text-to-video",
  title: "Text-to-Video",
  titleVi: "Tạo video từ văn bản — AI đạo diễn",
  description:
    "Mô hình AI tạo ra đoạn video liền mạch từ mô tả bằng ngôn ngữ tự nhiên, bao gồm cả chuyển động và âm thanh.",
  category: "multimodal",
  tags: ["text-to-video", "generation", "diffusion", "video"],
  difficulty: "advanced",
  relatedSlugs: ["text-to-image", "diffusion-models", "vlm"],
  vizType: "static",
};

export default function TextToVideoTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Nếu text-to-image giống như nhờ hoạ sĩ <strong>vẽ một bức tranh</strong>, thì
          text-to-video giống như nhờ <strong>đạo diễn quay một bộ phim ngắn</strong>.
        </p>
        <p>
          Đạo diễn không chỉ cần tạo ra <strong>từng khung hình đẹp</strong> mà còn phải
          đảm bảo các khung hình <strong>liền mạch với nhau</strong> — nhân vật di chuyển mượt,
          ánh sáng thay đổi tự nhiên, vật lý tuân theo quy luật. Đây là thách thức lớn nhất
          của text-to-video!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <svg viewBox="0 0 600 250" className="w-full max-w-2xl mx-auto">
            {/* Prompt */}
            <rect x={20} y={20} width={560} height={35} rx={8} fill="#3b82f6" />
            <text x={300} y={43} textAnchor="middle" fill="white" fontSize={11} fontWeight="bold">
              Prompt: &quot;Một chú chó chạy trên bãi biển lúc hoàng hôn&quot;
            </text>

            {/* Arrow down */}
            <line x1={300} y1={55} x2={300} y2={85} stroke="#475569" strokeWidth={2} />

            {/* Model box */}
            <rect x={180} y={85} width={240} height={40} rx={10} fill="#1e293b" stroke="#8b5cf6" strokeWidth={2} />
            <text x={300} y={110} textAnchor="middle" fill="white" fontSize={12} fontWeight="bold">
              Mô hình Text-to-Video
            </text>

            {/* Arrow down */}
            <line x1={300} y1={125} x2={300} y2={155} stroke="#475569" strokeWidth={2} />

            {/* Video frames */}
            {[0, 1, 2, 3, 4, 5, 6].map((i) => {
              const x = 80 + i * 70;
              const hue = 200 + i * 15;
              return (
                <g key={i}>
                  <rect x={x} y={160} width={55} height={40} rx={4} fill={`hsl(${hue}, 60%, 35%)`} stroke="#475569" strokeWidth={1} />
                  <text x={x + 27} y={185} textAnchor="middle" fill="white" fontSize={9}>
                    F{i + 1}
                  </text>
                </g>
              );
            })}
            <text x={300} y={225} textAnchor="middle" fill="#94a3b8" fontSize={10}>
              Chuỗi khung hình liên tục tạo thành video
            </text>

            {/* Arrows between frames */}
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <line key={i} x1={135 + i * 70} y1={180} x2={150 + i * 70} y2={180} stroke="#22c55e" strokeWidth={1.5} />
            ))}
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Text-to-Video</strong> mở rộng khái niệm text-to-image bằng cách tạo
          <strong> chuỗi khung hình liên tục</strong> từ mô tả văn bản. Đây là một trong
          những thách thức khó nhất trong AI sinh tạo.
        </p>
        <p>Ba thách thức kỹ thuật chính:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Tính nhất quán thời gian:</strong> Các khung hình phải liên tục,
            nhân vật không biến mất hay thay đổi hình dạng đột ngột.
          </li>
          <li>
            <strong>Tính vật lý:</strong> Chuyển động phải tuân theo quy luật vật lý —
            trọng lực, va chạm, phản xạ ánh sáng.
          </li>
          <li>
            <strong>Tài nguyên tính toán:</strong> Video yêu cầu xử lý hàng chục đến
            hàng trăm khung hình, đòi hỏi GPU mạnh mẽ.
          </li>
        </ol>
        <p>
          Các mô hình tiêu biểu: <strong>Sora</strong> (OpenAI),
          <strong> Runway Gen-3</strong>, <strong>Kling</strong> (Kuaishou).
          Công nghệ này đang cách mạng hoá ngành sản xuất nội dung video.
        </p>
      </ExplanationSection>
    </>
  );
}
