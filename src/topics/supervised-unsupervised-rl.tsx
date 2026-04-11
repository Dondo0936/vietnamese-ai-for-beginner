"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "supervised-unsupervised-rl",
  title: "Learning Paradigms",
  titleVi: "Ba mô hình học — Có giám sát, Không giám sát, Tăng cường",
  description:
    "Ba cách tiếp cận cơ bản trong học máy: học từ nhãn, học từ cấu trúc, và học từ phần thưởng.",
  category: "foundations",
  tags: ["supervised", "unsupervised", "reinforcement-learning"],
  difficulty: "beginner",
  relatedSlugs: ["train-val-test", "data-preprocessing", "neural-network-overview"],
  vizType: "static",
};

export default function SupervisedUnsupervisedRLTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Ba cách học tương ứng với ba cách dạy trẻ em:
        </p>
        <p>
          <strong>Học có giám sát:</strong> Giống dạy bằng <strong>sách giáo khoa</strong> —
          mỗi bài có đáp án sẵn. &quot;Đây là con mèo, đây là con chó.&quot;
        </p>
        <p>
          <strong>Học không giám sát:</strong> Giống cho trẻ <strong>tự khám phá</strong> —
          &quot;Hãy chia đống đồ chơi này thành các nhóm tương tự nhau.&quot;
        </p>
        <p>
          <strong>Học tăng cường:</strong> Giống <strong>học đi xe đạp</strong> — không có
          hướng dẫn chi tiết, chỉ có phản hồi: ngã (phạt) hoặc giữ thăng bằng (thưởng).
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <svg viewBox="0 0 600 260" className="w-full max-w-2xl mx-auto">
            {[
              {
                label: "Học có giám sát",
                sub: "Supervised Learning",
                desc: "Dữ liệu + Nhãn → Dự đoán nhãn cho dữ liệu mới",
                examples: "Phân loại ảnh, dịch máy, phát hiện spam",
                color: "#3b82f6",
                y: 10,
              },
              {
                label: "Học không giám sát",
                sub: "Unsupervised Learning",
                desc: "Chỉ có dữ liệu → Tìm cấu trúc ẩn, nhóm tương tự",
                examples: "Phân cụm khách hàng, giảm chiều, phát hiện bất thường",
                color: "#22c55e",
                y: 95,
              },
              {
                label: "Học tăng cường",
                sub: "Reinforcement Learning",
                desc: "Agent + Môi trường → Tối đa phần thưởng tích luỹ",
                examples: "Chơi game, xe tự lái, điều khiển robot",
                color: "#f59e0b",
                y: 180,
              },
            ].map((item, i) => (
              <g key={i}>
                <rect x={20} y={item.y} width={560} height={72} rx={10} fill="#1e293b" stroke={item.color} strokeWidth={2} />
                <text x={40} y={item.y + 22} fill={item.color} fontSize={12} fontWeight="bold">{item.label}</text>
                <text x={300} y={item.y + 22} fill="#64748b" fontSize={9}>({item.sub})</text>
                <text x={40} y={item.y + 42} fill="#e2e8f0" fontSize={10}>{item.desc}</text>
                <text x={40} y={item.y + 60} fill="#94a3b8" fontSize={9}>Ví dụ: {item.examples}</text>
              </g>
            ))}
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          Ba mô hình học máy cơ bản khác nhau ở <strong>loại dữ liệu</strong> và
          <strong> tín hiệu học</strong>:
        </p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Học có giám sát:</strong> Dữ liệu đã gắn nhãn (input-output).
            Mô hình học ánh xạ từ đầu vào sang nhãn. Phổ biến nhất trong thực tế.
          </li>
          <li>
            <strong>Học không giám sát:</strong> Dữ liệu không có nhãn.
            Mô hình tự phát hiện cấu trúc ẩn — phân cụm, giảm chiều, phát hiện bất thường.
          </li>
          <li>
            <strong>Học tăng cường:</strong> Agent tương tác với môi trường,
            nhận phần thưởng/hình phạt, và học chính sách tối ưu qua thử-sai.
          </li>
        </ol>
        <p>
          Ngoài ra còn có <strong>Học bán giám sát</strong> (ít nhãn + nhiều không nhãn)
          và <strong>Học tự giám sát</strong> (tự tạo nhãn từ dữ liệu — nền tảng của LLM).
        </p>
      </ExplanationSection>
    </>
  );
}
