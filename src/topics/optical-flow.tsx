"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "optical-flow",
  title: "Optical Flow",
  titleVi: "Luồng quang học",
  description:
    "Ước lượng chuyển động giữa hai khung hình liên tiếp, biểu diễn bằng trường vector vận tốc.",
  category: "computer-vision",
  tags: ["computer-vision", "motion", "video"],
  difficulty: "intermediate",
  relatedSlugs: ["image-kernels", "feature-extraction-cnn", "object-detection"],
  vizType: "interactive",
};

interface FlowVector {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

function generateFlow(motionType: string): FlowVector[] {
  const vectors: FlowVector[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 10; c++) {
      const x = 40 + c * 55;
      const y = 30 + r * 35;
      let dx = 0;
      let dy = 0;
      switch (motionType) {
        case "right":
          dx = 20;
          dy = 0;
          break;
        case "zoom":
          dx = (x - 300) * 0.08;
          dy = (y - 150) * 0.08;
          break;
        case "rotate":
          dx = -(y - 150) * 0.1;
          dy = (x - 300) * 0.1;
          break;
        case "object": {
          const inObj = x > 150 && x < 350 && y > 80 && y < 220;
          dx = inObj ? 25 : 0;
          dy = inObj ? 5 : 0;
          break;
        }
      }
      vectors.push({ x, y, dx, dy });
    }
  }
  return vectors;
}

const MOTION_TYPES = [
  { key: "right", label: "Camera dịch phải" },
  { key: "zoom", label: "Camera phóng to" },
  { key: "rotate", label: "Camera xoay" },
  { key: "object", label: "Đối tượng di chuyển" },
];

export default function OpticalFlowTopic() {
  const [motionType, setMotionType] = useState("right");
  const vectors = generateFlow(motionType);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang nhìn ra <strong>cửa sổ tàu hỏa</strong>.
          Cảnh vật bên ngoài dường như &quot;chảy&quot; ngược lại — cây gần chạy nhanh,
          núi xa chạy chậm. Bộ não bạn tự động ước lượng{" "}
          <strong>hướng và tốc độ</strong> của mỗi vật thể.
        </p>
        <p>
          Optical Flow mô phỏng khả năng này — nó so sánh hai khung hình liên
          tiếp để tính <strong>vector chuyển động</strong> cho mỗi pixel. Mũi
          tên dài = chuyển động nhanh, mũi tên ngắn = chuyển động chậm. Kết quả
          là một &quot;bản đồ gió&quot; cho thấy mọi thứ đang di chuyển như thế nào!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {MOTION_TYPES.map((mt) => (
              <button
                key={mt.key}
                onClick={() => setMotionType(mt.key)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  motionType === mt.key
                    ? "bg-accent text-white"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                {mt.label}
              </button>
            ))}
          </div>

          <svg viewBox="0 0 600 310" className="w-full max-w-2xl mx-auto">
            <rect x="0" y="0" width="600" height="310" rx="8" fill="#0f172a" />

            {/* Object region (for object motion type) */}
            {motionType === "object" && (
              <rect
                x="150"
                y="80"
                width="200"
                height="140"
                rx="6"
                fill="#334155"
                opacity={0.3}
                stroke="#475569"
                strokeWidth="1"
                strokeDasharray="4,3"
              />
            )}

            <defs>
              <marker id="arrowhead-of" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#22c55e" />
              </marker>
            </defs>

            {/* Flow vectors */}
            {vectors.map((v, i) => {
              const mag = Math.sqrt(v.dx * v.dx + v.dy * v.dy);
              if (mag < 0.5) {
                return (
                  <circle key={i} cx={v.x} cy={v.y} r="2" fill="#334155" />
                );
              }
              return (
                <line
                  key={i}
                  x1={v.x}
                  y1={v.y}
                  x2={v.x + v.dx}
                  y2={v.y + v.dy}
                  stroke="#22c55e"
                  strokeWidth={1.5}
                  opacity={Math.min(1, mag / 20 + 0.3)}
                  markerEnd="url(#arrowhead-of)"
                />
              );
            })}

            <text x="300" y="300" textAnchor="middle" fill="#64748b" fontSize="10">
              Mũi tên = hướng và cường độ chuyển động giữa hai khung hình
            </text>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Optical Flow</strong> (Luồng quang học) ước lượng chuyển động
          pixel giữa hai khung hình liên tiếp trong video, tạo ra trường vector
          2D biểu diễn hướng và tốc độ di chuyển.
        </p>
        <p>Phương pháp và ứng dụng:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Phương pháp cổ điển:</strong> Lucas-Kanade (sparse, theo
            điểm đặc trưng), Horn-Schunck (dense, toàn bộ ảnh).
          </li>
          <li>
            <strong>Phương pháp deep learning:</strong> FlowNet, RAFT — học
            trực tiếp ánh xạ pixel giữa hai khung hình với độ chính xác cao.
          </li>
          <li>
            <strong>Ứng dụng:</strong> Theo dõi đối tượng (tracking), ổn định
            video, nhận dạng hành động, ước lượng độ sâu, nén video.
          </li>
        </ol>
        <p>
          Giả thiết cơ bản: <strong>cường độ sáng không đổi</strong> (brightness
          constancy) và <strong>chuyển động nhỏ</strong> giữa hai khung hình.
          Vi phạm giả thiết này (chiếu sáng thay đổi, occlusion) gây ra lỗi.
        </p>
      </ExplanationSection>
    </>
  );
}
