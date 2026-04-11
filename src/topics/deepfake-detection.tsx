"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "deepfake-detection",
  title: "Deepfake Detection",
  titleVi: "Phát hiện Deepfake",
  description:
    "Các phương pháp phát hiện video và hình ảnh giả mạo được tạo bởi AI",
  category: "ai-safety",
  tags: ["deepfake", "forensics", "detection"],
  difficulty: "intermediate",
  relatedSlugs: ["gan", "adversarial-robustness", "ai-watermarking"],
  vizType: "interactive",
};

const CLUES = [
  { id: "eyes", label: "Ánh sáng mắt", desc: "Phản chiếu trong 2 mắt không khớp", x: 180, y: 95, real: true, fake: false },
  { id: "skin", label: "Da và kết cấu", desc: "Da quá mịn, thiếu chi tiết tự nhiên", x: 300, y: 130, real: true, fake: false },
  { id: "hair", label: "Đường viền tóc", desc: "Ranh giới tóc/da bị nhoè hoặc kỳ lạ", x: 180, y: 55, real: true, fake: false },
  { id: "teeth", label: "Răng", desc: "Răng bị méo hoặc lẫn vào nhau", x: 240, y: 155, real: true, fake: false },
  { id: "temporal", label: "Nhất quán thời gian", desc: "Khuôn mặt nhấp nháy hoặc biến dạng giữa các frame", x: 370, y: 95, real: true, fake: false },
];

export default function DeepfakeDetectionTopic() {
  const [selectedClue, setSelectedClue] = useState<string | null>(null);
  const clue = CLUES.find((c) => c.id === selectedClue);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn là một <strong>thám tử giám định tranh giả</strong>.
          Người thường nhìn bức tranh thấy bình thường, nhưng bạn biết cách tìm
          các dấu hiệu: nét cọ không tự nhiên, tỷ lệ sai, chất liệu không đúng thời kỳ.
        </p>
        <p>
          Phát hiện deepfake cũng vậy: AI &quot;giám định&quot; ảnh/video bằng cách tìm
          <strong> dấu vết mà AI tạo hình để lại</strong> — ánh sáng phản chiếu trong mắt
          không khớp, da quá mịn, đường viền tóc bất thường.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <p className="text-sm text-muted text-center">Nhấp vào các điểm để xem dấu hiệu nhận biết deepfake</p>
          <svg viewBox="0 0 600 300" className="w-full max-w-2xl mx-auto">
            {/* Face outline - Real */}
            <g transform="translate(50, 20)">
              <text x={120} y={0} textAnchor="middle" fontSize={13} fill="#22c55e" fontWeight="bold">Ảnh thật</text>
              <ellipse cx={120} cy={110} rx={75} ry={95} fill="#fef3c7" stroke="#f59e0b" strokeWidth={1.5} />
              {/* Eyes */}
              <ellipse cx={95} cy={90} rx={15} ry={8} fill="white" stroke="#0f172a" strokeWidth={1} />
              <circle cx={95} cy={90} r={5} fill="#0f172a" />
              <circle cx={93} cy={88} r={2} fill="white" />
              <ellipse cx={145} cy={90} rx={15} ry={8} fill="white" stroke="#0f172a" strokeWidth={1} />
              <circle cx={145} cy={90} r={5} fill="#0f172a" />
              <circle cx={143} cy={88} r={2} fill="white" />
              {/* Nose and mouth */}
              <path d="M 115 105 Q 120 120, 125 105" fill="none" stroke="#d97706" strokeWidth={1} />
              <path d="M 100 140 Q 120 155, 140 140" fill="none" stroke="#dc2626" strokeWidth={2} />
            </g>

            {/* Face outline - Fake */}
            <g transform="translate(320, 20)">
              <text x={120} y={0} textAnchor="middle" fontSize={13} fill="#ef4444" fontWeight="bold">Deepfake</text>
              <ellipse cx={120} cy={110} rx={75} ry={95} fill="#fef3c7" stroke="#f59e0b" strokeWidth={1.5} />
              {/* Eyes - mismatched reflections */}
              <ellipse cx={95} cy={90} rx={15} ry={8} fill="white" stroke="#0f172a" strokeWidth={1} />
              <circle cx={95} cy={90} r={5} fill="#0f172a" />
              <circle cx={93} cy={88} r={2} fill="white" />
              <ellipse cx={145} cy={90} rx={15} ry={8} fill="white" stroke="#0f172a" strokeWidth={1} />
              <circle cx={145} cy={90} r={5} fill="#0f172a" />
              <circle cx={148} cy={92} r={1.5} fill="white" />
              {/* Blurred hair boundary */}
              <path d="M 50 60 Q 80 20, 120 15 Q 160 20, 190 60" fill="none" stroke="#ef4444" strokeWidth={2} strokeDasharray="3 2" />
              {/* Nose and mouth */}
              <path d="M 115 105 Q 120 120, 125 105" fill="none" stroke="#d97706" strokeWidth={1} />
              <path d="M 100 140 Q 120 152, 140 140" fill="none" stroke="#dc2626" strokeWidth={2} />
              {/* Anomaly markers */}
              {selectedClue && (
                <g>
                  <circle cx={95} cy={88} r={20} fill="none" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 2" opacity={selectedClue === "eyes" ? 1 : 0} />
                  <circle cx={145} cy={88} r={20} fill="none" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 2" opacity={selectedClue === "eyes" ? 1 : 0} />
                </g>
              )}
            </g>

            {/* Detection clues */}
            <g transform="translate(0, 230)">
              {CLUES.map((c, i) => (
                <g
                  key={c.id}
                  onClick={() => setSelectedClue(c.id === selectedClue ? null : c.id)}
                  style={{ cursor: "pointer" }}
                >
                  <rect
                    x={10 + i * 118}
                    y={0}
                    width={110} height={55}
                    fill={selectedClue === c.id ? "#fee2e2" : "#f8fafc"}
                    rx={6}
                    stroke={selectedClue === c.id ? "#ef4444" : "#e2e8f0"}
                    strokeWidth={selectedClue === c.id ? 2 : 1}
                  />
                  <text x={65 + i * 118} y={20} textAnchor="middle" fontSize={10} fill="#0f172a" fontWeight="bold">
                    {c.label}
                  </text>
                  <text x={65 + i * 118} y={35} textAnchor="middle" fontSize={8} fill="#64748b">
                    {c.desc.split(",")[0]}
                  </text>
                </g>
              ))}
            </g>

            {/* Detail panel */}
            {clue && (
              <g transform="translate(150, 195)">
                <rect x={0} y={0} width={300} height={28} fill="#fee2e2" rx={5} />
                <text x={150} y={18} textAnchor="middle" fontSize={11} fill="#991b1b" fontWeight="bold">
                  🔍 {clue.label}: {clue.desc}
                </text>
              </g>
            )}
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Deepfake</strong> là công nghệ dùng AI (thường là GAN hoặc Diffusion Models)
          để tạo ảnh/video giả mạo khuôn mặt người. <strong>Deepfake Detection</strong> là
          các phương pháp phát hiện nội dung giả mạo này.
        </p>
        <p>Các phương pháp phát hiện chính:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Phân tích sinh trắc:</strong> Kiểm tra nhất quán ánh sáng phản chiếu trong mắt,
            nhịp nháy mắt, chuyển động môi khớp với âm thanh.
          </li>
          <li>
            <strong>Phân tích tần số:</strong> Deepfake thường để lại dấu vết trong miền tần số
            (Fourier spectrum) mà mắt thường không thấy.
          </li>
          <li>
            <strong>Mạng phát hiện:</strong> Huấn luyện CNN/ViT trên tập dữ liệu ảnh thật + giả
            để phân loại. EfficientNet và XceptionNet là kiến trúc phổ biến.
          </li>
          <li>
            <strong>Phân tích thời gian:</strong> Kiểm tra nhất quán giữa các frame video —
            deepfake thường nhấp nháy hoặc biến dạng nhẹ giữa các khung hình.
          </li>
        </ol>
        <p>Thách thức:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li><strong>Cuộc chạy đua:</strong> Kỹ thuật tạo deepfake ngày càng tốt, phát hiện phải liên tục cập nhật.</li>
          <li><strong>Tổng quát hoá:</strong> Detector huấn luyện trên một loại deepfake thường kém trên loại khác.</li>
          <li><strong>Ứng dụng tại Việt Nam:</strong> Deepfake được dùng cho lừa đảo tài chính, giả mạo danh tính — cần công cụ phát hiện phù hợp với khuôn mặt người Việt.</li>
        </ul>
      </ExplanationSection>
    </>
  );
}
