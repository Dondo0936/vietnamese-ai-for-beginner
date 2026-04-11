"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "data-augmentation",
  title: "Data Augmentation",
  titleVi: "Tăng cường dữ liệu",
  description:
    "Kỹ thuật mở rộng tập dữ liệu huấn luyện bằng cách tạo biến thể mới từ dữ liệu gốc, giảm overfitting.",
  category: "computer-vision",
  tags: ["computer-vision", "training", "regularization"],
  difficulty: "beginner",
  relatedSlugs: ["overfitting-underfitting", "image-classification", "regularization"],
  vizType: "interactive",
};

interface AugType {
  name: string;
  transform: string;
  description: string;
}

const AUGMENTATIONS: AugType[] = [
  { name: "Gốc", transform: "", description: "Ảnh gốc không biến đổi" },
  { name: "Lật ngang", transform: "scale(-1, 1) translate(-120, 0)", description: "Phản chiếu theo trục dọc" },
  { name: "Xoay 15 độ", transform: "rotate(15, 60, 60)", description: "Xoay nhẹ quanh tâm" },
  { name: "Phóng to", transform: "scale(1.3) translate(-18, -18)", description: "Thu phóng ngẫu nhiên" },
  { name: "Dịch chuyển", transform: "translate(15, 10)", description: "Dịch vị trí ngẫu nhiên" },
  { name: "Xoay -10 độ", transform: "rotate(-10, 60, 60)", description: "Xoay ngược nhẹ" },
];

export default function DataAugmentationTopic() {
  const [activeAugs, setActiveAugs] = useState<Set<number>>(new Set([0]));

  const toggleAug = (idx: number) => {
    const next = new Set(activeAugs);
    if (next.has(idx)) {
      if (idx !== 0) next.delete(idx);
    } else {
      next.add(idx);
    }
    setActiveAugs(next);
  };

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn dạy con nhận biết <strong>con mèo</strong>,
          nhưng chỉ có 5 tấm ảnh mèo. Quá ít! Bạn thông minh hơn: lật ảnh,
          xoay ảnh, phóng to, thay đổi ánh sáng — bỗng có{" "}
          <strong>30 tấm ảnh khác nhau</strong> từ 5 tấm gốc!
        </p>
        <p>
          Data Augmentation làm đúng như vậy — tạo <strong>biến thể mới</strong>{" "}
          từ dữ liệu có sẵn bằng các phép biến đổi. Mèo lật ngược vẫn là mèo,
          mèo xoay nghiêng vẫn là mèo. Mô hình học được tính{" "}
          <strong>bất biến</strong> (invariance) nhờ nhìn thấy cùng đối tượng
          ở nhiều góc độ!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {AUGMENTATIONS.map((aug, i) => (
              <button
                key={aug.name}
                onClick={() => toggleAug(i)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeAugs.has(i)
                    ? "bg-accent text-white"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                {aug.name}
              </button>
            ))}
          </div>

          <svg viewBox="0 0 600 260" className="w-full max-w-2xl mx-auto">
            {Array.from(activeAugs).map((augIdx, pos) => {
              const aug = AUGMENTATIONS[augIdx];
              const col = pos % 3;
              const row = Math.floor(pos / 3);
              const x = 50 + col * 190;
              const y = 10 + row * 140;

              return (
                <g key={augIdx}>
                  {/* Frame */}
                  <rect
                    x={x}
                    y={y}
                    width="140"
                    height="105"
                    rx="8"
                    fill="#1e293b"
                    stroke={augIdx === 0 ? "#3b82f6" : "#22c55e"}
                    strokeWidth="1.5"
                  />
                  {/* Simple cat drawing with transform */}
                  <g transform={`translate(${x + 10}, ${y + 8})`}>
                    <g transform={aug.transform}>
                      {/* Cat body */}
                      <ellipse cx="60" cy="55" rx="35" ry="25" fill="#94a3b8" opacity={0.6} />
                      {/* Cat head */}
                      <circle cx="60" cy="30" r="18" fill="#94a3b8" opacity={0.7} />
                      {/* Ears */}
                      <polygon points="47,15 42,5 52,12" fill="#94a3b8" />
                      <polygon points="73,15 78,5 68,12" fill="#94a3b8" />
                      {/* Eyes */}
                      <circle cx="54" cy="28" r="3" fill="#22c55e" />
                      <circle cx="66" cy="28" r="3" fill="#22c55e" />
                      {/* Nose */}
                      <circle cx="60" cy="34" r="2" fill="#ec4899" />
                      {/* Tail */}
                      <path d="M95,50 Q110,30 105,55" fill="none" stroke="#94a3b8" strokeWidth="3" />
                    </g>
                  </g>
                  {/* Label */}
                  <text
                    x={x + 70}
                    y={y + 100}
                    textAnchor="middle"
                    fill={augIdx === 0 ? "#3b82f6" : "#22c55e"}
                    fontSize="10"
                    fontWeight="bold"
                  >
                    {aug.name}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
            <p className="text-sm text-muted">
              Đang hiển thị <strong className="text-accent">{activeAugs.size}</strong> biến
              thể từ 1 ảnh gốc. Nhấn các nút để bật/tắt phép biến đổi.
            </p>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Data Augmentation</strong> (Tăng cường dữ liệu) là kỹ thuật
          tạo thêm dữ liệu huấn luyện bằng cách áp dụng các phép biến đổi lên
          dữ liệu gốc. Đây là phương pháp regularization hiệu quả, giảm
          overfitting đáng kể.
        </p>
        <p>Các phép biến đổi phổ biến:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Hình học:</strong> Lật (flip), xoay (rotate), cắt (crop),
            co giãn (scale), dịch chuyển (translate).
          </li>
          <li>
            <strong>Quang học:</strong> Thay đổi độ sáng, contrast, bão hòa
            màu, thêm nhiễu, làm mờ.
          </li>
          <li>
            <strong>Nâng cao:</strong> MixUp (trộn hai ảnh), CutMix (cắt dán
            vùng), AutoAugment (tự động tìm policy tối ưu).
          </li>
        </ol>
        <p>
          Lưu ý quan trọng: phép biến đổi phải <strong>bảo toàn nhãn</strong>.
          Ví dụ: lật ảnh số &quot;6&quot; thành &quot;9&quot; sẽ sai nhãn. Cần chọn augmentation
          phù hợp với từng bài toán cụ thể.
        </p>
      </ExplanationSection>
    </>
  );
}
