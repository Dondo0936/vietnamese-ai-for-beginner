"use client";

import { useState } from "react";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, LaTeX,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
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

/* ── data ─────────────────────────────────────────────────── */
interface FlowVector { x: number; y: number; dx: number; dy: number }

function generateFlow(motionType: string): FlowVector[] {
  const vectors: FlowVector[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 10; c++) {
      const x = 40 + c * 55;
      const y = 30 + r * 35;
      let dx = 0, dy = 0;
      switch (motionType) {
        case "right": dx = 20; dy = 0; break;
        case "zoom": dx = (x - 300) * 0.08; dy = (y - 150) * 0.08; break;
        case "rotate": dx = -(y - 150) * 0.1; dy = (x - 300) * 0.1; break;
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
  { key: "object", label: "Xe máy di chuyển" },
];

const QUIZ: QuizQuestion[] = [
  {
    question: "Optical Flow ước lượng gì giữa 2 khung hình liên tiếp?",
    options: [
      "Sự thay đổi màu sắc",
      "Vector chuyển động (hướng + tốc độ) cho mỗi pixel",
      "Số đối tượng mới xuất hiện",
      "Độ sâu (depth) của cảnh",
    ],
    correct: 1,
    explanation: "Optical Flow tính vector (dx, dy) cho mỗi pixel: pixel này đã di chuyển bao xa và theo hướng nào giữa frame t và frame t+1.",
  },
  {
    question: "Lucas-Kanade và Horn-Schunck khác nhau thế nào?",
    options: [
      "Lucas-Kanade cho ảnh màu, Horn-Schunck cho ảnh xám",
      "Lucas-Kanade tính sparse (một số điểm), Horn-Schunck tính dense (mọi pixel)",
      "Cả hai cho kết quả giống nhau",
      "Lucas-Kanade dùng deep learning",
    ],
    correct: 1,
    explanation: "Lucas-Kanade: sparse -- chỉ tính tại các điểm đặc trưng (corner, edge). Nhanh, tốt cho tracking. Horn-Schunck: dense -- tính cho MỌI pixel. Chậm hơn nhưng cho bản đồ chuyển động đầy đủ.",
  },
  {
    question: "Giả thiết 'brightness constancy' trong Optical Flow là gì?",
    options: [
      "Ảnh phải có độ sáng đồng đều",
      "Cường độ pixel không thay đổi khi pixel di chuyển giữa 2 frame",
      "Camera phải đứng yên",
      "Mọi pixel di chuyển cùng tốc độ",
    ],
    correct: 1,
    explanation: "Giả thiết: I(x,y,t) = I(x+dx, y+dy, t+1). Pixel di chuyển nhưng giá trị cường độ không đổi. Vi phạm khi: ánh sáng thay đổi, bóng đổ, phản chiếu, occlusion.",
  },
];

/* ── component ────────────────────────────────────────────── */
export default function OpticalFlowTopic() {
  const [motionType, setMotionType] = useState("right");
  const vectors = generateFlow(motionType);

  return (
    <>
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Camera giao thông quay video. Bạn cần biết xe máy nào đang di chuyển, hướng nào, nhanh hay chậm. Phân tích từng frame riêng hay so sánh 2 frame liên tiếp?"
          options={[
            "Phân tích từng frame riêng là đủ",
            "So sánh 2 frame liên tiếp để thấy chuyển động",
            "Cần ít nhất 10 frame",
          ]}
          correct={1}
          explanation="Chuyển động = sự thay đổi giữa 2 thời điểm. Optical Flow so sánh 2 frame liên tiếp để tính vector chuyển động cho mỗi pixel. Mũi tên dài = nhanh, ngắn = chậm!"
        >

      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {MOTION_TYPES.map((mt) => (
                <button key={mt.key} type="button" onClick={() => setMotionType(mt.key)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    motionType === mt.key ? "bg-accent text-white" : "bg-card border border-border text-muted hover:text-foreground"
                  }`}>
                  {mt.label}
                </button>
              ))}
            </div>

            <svg viewBox="0 0 600 310" className="w-full max-w-2xl mx-auto">
              <rect x="0" y="0" width="600" height="310" rx="8" fill="#0f172a" />
              {motionType === "object" && (
                <rect x="150" y="80" width="200" height="140" rx="6"
                  fill="#334155" opacity={0.3} stroke="#475569" strokeWidth="1" strokeDasharray="4,3" />
              )}
              <defs>
                <marker id="arrowhead-of" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="#22c55e" />
                </marker>
              </defs>
              {vectors.map((v, i) => {
                const mag = Math.sqrt(v.dx * v.dx + v.dy * v.dy);
                if (mag < 0.5) return <circle key={i} cx={v.x} cy={v.y} r="2" fill="#334155" />;
                return (
                  <line key={i} x1={v.x} y1={v.y} x2={v.x + v.dx} y2={v.y + v.dy}
                    stroke="#22c55e" strokeWidth={1.5} opacity={Math.min(1, mag / 20 + 0.3)}
                    markerEnd="url(#arrowhead-of)" />
                );
              })}
              <text x="300" y="300" textAnchor="middle" fill="#64748b" fontSize="11">
                Mũi tên = hướng và tốc độ chuyển động giữa 2 frame
              </text>
            </svg>

            <p className="text-sm text-muted text-center">
              {motionType === "object"
                ? "Chỉ vùng xe máy có mũi tên (di chuyển), nền đứng yên"
                : "Tất cả pixel đều chuyển động do camera di chuyển"}
            </p>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Optical Flow giống <strong>bản đồ gió</strong>{" "}trên dự báo thời tiết: mỗi điểm có mũi tên chỉ
            hướng và tốc độ. Nhưng thay vì gió, đây là <strong>chuyển động pixel</strong>!
            Camera dịch phải? Tất cả mũi tên chỉ trái. Xe máy chạy qua? Chỉ vùng xe có mũi tên.
            <strong>{" "}Pattern mũi tên tiết lộ loại chuyển động!</strong>
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Đèn đường bật sáng giữa 2 frame. Optical Flow nghĩ pixel 'di chuyển' ở vùng đèn dù đèn đứng yên. Tại sao?"
          options={[
            "Vì đèn thay đổi vị trí thật",
            "Vì giả thiết brightness constancy bị vi phạm -- pixel thay đổi cường độ mà không di chuyển",
            "Vì camera bị rung",
          ]}
          correct={1}
          explanation="Optical Flow giả sử pixel di chuyển nhưng không đổi cường độ. Đèn sáng lên = thay đổi cường độ TẠI CHỖ, vi phạm giả thiết. Kết quả: 'flow ảo' ở vùng đèn!"
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={8} label="Giải thích sâu">
        <ExplanationSection>
          <p>
            <strong>Optical Flow</strong>{" "}ước lượng chuyển động pixel giữa 2 frame liên tiếp, tạo ra
            trường vector 2D biểu diễn hướng và tốc độ.
          </p>

          <p><strong>Phương trình cơ bản</strong>{" "}(Brightness Constancy Constraint):</p>
          <LaTeX block>{"I_x u + I_y v + I_t = 0"}</LaTeX>
          <p className="text-sm text-muted">
            Với <LaTeX>{"I_x, I_y"}</LaTeX> là gradient không gian, <LaTeX>{"I_t"}</LaTeX> là gradient thời gian,
            và <LaTeX>{"(u, v)"}</LaTeX> là vector flow cần tìm.
          </p>

          <Callout variant="insight" title="Phương pháp chính">
            <div className="space-y-2 text-sm">
              <p><strong>Lucas-Kanade (1981):</strong>{" "}Sparse flow -- giả sử flow đồng nhất trong cửa sổ nhỏ. Giải least squares. Nhanh, tốt cho feature tracking.</p>
              <p><strong>Horn-Schunck (1981):</strong>{" "}Dense flow -- thêm ràng buộc smoothness. Tính flow cho mọi pixel.</p>
              <p><strong>RAFT (2020):</strong>{" "}Deep learning -- correlation volume + iterative refinement. State-of-the-art hiện nay.</p>
              <p><strong>FlowFormer (2022):</strong>{" "}Transformer-based flow estimation.</p>
            </div>
          </Callout>

          <Callout variant="warning" title="Ứng dụng thực tế">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>Camera giao thông VN:</strong>{" "}Phát hiện xe di chuyển, ước lượng tốc độ</li>
              <li><strong>Ổn định video:</strong>{" "}Ước lượng camera motion để bù rung</li>
              <li><strong>Action recognition:</strong>{" "}Flow là input quan trọng cho nhận dạng hành động</li>
              <li><strong>Video compression:</strong>{" "}Motion estimation cho codec H.264/H.265</li>
            </ul>
          </Callout>

          <CodeBlock language="python" title="Optical Flow với OpenCV">
{`import cv2
import numpy as np

cap = cv2.VideoCapture("giao_thong_hanoi.mp4")
ret, prev = cap.read()
prev_gray = cv2.cvtColor(prev, cv2.COLOR_BGR2GRAY)

while cap.isOpened():
    ret, curr = cap.read()
    if not ret:
        break
    curr_gray = cv2.cvtColor(curr, cv2.COLOR_BGR2GRAY)

    # Dense Optical Flow (Farneback)
    flow = cv2.calcOpticalFlowFarneback(
        prev_gray, curr_gray,
        flow=None,
        pyr_scale=0.5, levels=3,
        winsize=15, iterations=3,
        poly_n=5, poly_sigma=1.2,
        flags=0,
    )
    # flow shape: (H, W, 2) -- dx, dy cho mỗi pixel

    # Tính magnitude và angle
    mag, ang = cv2.cartToPolar(flow[..., 0], flow[..., 1])

    # Visualize bằng HSV (Hue = hướng, Value = tốc độ)
    hsv = np.zeros_like(prev)
    hsv[..., 0] = ang * 180 / np.pi / 2  # Hue
    hsv[..., 1] = 255                      # Saturation
    hsv[..., 2] = cv2.normalize(mag, None, 0, 255, cv2.NORM_MINMAX)
    rgb = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)

    prev_gray = curr_gray`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={8} label="Tóm tắt">
        <MiniSummary points={[
          "Optical Flow = trường vector chuyển động (hướng + tốc độ) giữa 2 frame liên tiếp",
          "Giả thiết brightness constancy: pixel di chuyển nhưng không đổi cường độ",
          "Sparse (Lucas-Kanade): nhanh, tốt cho tracking. Dense (RAFT): mọi pixel, chính xác nhất",
          "Ứng dụng: ước lượng tốc độ xe, ổn định video, nhận dạng hành động, nén video",
        ]} />
      </LessonSection>

      <LessonSection step={7} totalSteps={8} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
