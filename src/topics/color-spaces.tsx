"use client";

import { useState, useMemo } from "react";
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
  slug: "color-spaces",
  title: "Color Spaces",
  titleVi: "Không gian màu",
  description:
    "Các hệ thống biểu diễn màu sắc khác nhau (RGB, HSV, LAB) và ứng dụng trong xử lý ảnh.",
  category: "computer-vision",
  tags: ["computer-vision", "preprocessing", "color"],
  difficulty: "beginner",
  relatedSlugs: ["image-kernels", "data-augmentation", "image-classification"],
  vizType: "interactive",
};

/* ── helpers ──────────────────────────────────────────────── */
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

const QUIZ: QuizQuestion[] = [
  {
    question: "Tại sao HSV tốt hơn RGB cho bài toán phát hiện đèn đỏ giao thông?",
    options: [
      "HSV có nhiều kênh hơn RGB",
      "HSV tách biệt sắc màu (Hue) khỏi độ sáng -- lọc 'màu đỏ' dễ dàng bất kể sáng/tối",
      "HSV nhanh hơn RGB khi xử lý",
      "HSV có độ phân giải cao hơn",
    ],
    correct: 1,
    explanation: "Trong RGB, 'đỏ sáng' và 'đỏ tối' có giá trị rất khác nhau trên cả 3 kênh. Trong HSV, cả 2 đều có H gần 0 hoặc 360 -- chỉ cần lọc theo Hue!",
  },
  {
    question: "Ảnh y tế thường chuyển sang LAB trước khi so sánh màu. Tại sao?",
    options: [
      "LAB nhẹ hơn RGB khi xử lý",
      "LAB đồng đều tri giác -- khoảng cách Euclidean phản ánh đúng sự khác biệt mắt người thấy",
      "LAB có nhiều màu hơn RGB",
      "LAB không cần chuyển đổi",
    ],
    correct: 1,
    explanation: "Trong RGB, 2 màu có cùng khoảng cách Euclidean có thể trông rất khác nhau hoặc rất giống nhau. LAB được thiết kế để khoảng cách = sự khác biệt tri giác. Quan trọng cho ảnh y tế!",
  },
  {
    question: "Chuyển ảnh sang Grayscale mất thông tin gì?",
    options: [
      "Mất thông tin cấu trúc và cạnh",
      "Mất thông tin màu sắc nhưng giữ lại cạnh, kết cấu, hình dạng",
      "Mất toàn bộ thông tin",
      "Không mất gì",
    ],
    correct: 1,
    explanation: "Grayscale giữ nguyên cấu trúc (cạnh, kết cấu, hình dạng) nhưng bỏ thông tin màu. Giảm từ 3 kênh -> 1 kênh, tính toán nhanh hơn 3 lần. Phù hợp cho edge detection, OCR.",
  },
];

/* ── component ────────────────────────────────────────────── */
export default function ColorSpacesTopic() {
  const [mode, setMode] = useState<"rgb" | "hsv">("rgb");
  const [r, setR] = useState(66);
  const [g, setG] = useState(135);
  const [b, setB] = useState(245);
  const [h, setH] = useState(220);
  const [s, setS] = useState(0.8);
  const [v, setV] = useState(0.96);

  const rgbFromHsv = useMemo(() => hsvToRgb(h, s, v), [h, s, v]);
  const displayColor = mode === "rgb"
    ? `rgb(${r},${g},${b})`
    : `rgb(${rgbFromHsv[0]},${rgbFromHsv[1]},${rgbFromHsv[2]})`;

  return (
    <>
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Bạn cần phát hiện đèn đỏ giao thông. Trong ảnh RGB, 'đỏ sáng' có R=255,G=50,B=50 nhưng 'đỏ tối' có R=150,G=20,B=20. Giá trị rất khác! Làm sao lọc dễ dàng hơn?"
          options={[
            "Tăng độ sáng toàn bộ ảnh",
            "Chuyển sang HSV -- chỉ lọc theo Hue (sắc đỏ), bỏ qua sáng/tối",
            "Dùng ảnh đen trắng",
          ]}
          correct={1}
          explanation="HSV tách sắc màu (Hue) khỏi độ sáng (Value). 'Đỏ sáng' và 'đỏ tối' đều có H gần 0-10 hoặc 350-360 -- chỉ cần lọc 1 kênh Hue thay vì 3 kênh RGB!"
        >

      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-6">
            <div className="flex gap-2">
              {(["rgb", "hsv"] as const).map((m) => (
                <button key={m} type="button" onClick={() => setMode(m)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    mode === m ? "bg-accent text-white" : "bg-card border border-border text-muted hover:text-foreground"
                  }`}>
                  {m.toUpperCase()}
                </button>
              ))}
            </div>

            {mode === "rgb" ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium" style={{ color: "#ef4444" }}>Red: {r}</label>
                  <input type="range" min="0" max="255" value={r} onChange={(e) => setR(parseInt(e.target.value))} className="w-full accent-red-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium" style={{ color: "#22c55e" }}>Green: {g}</label>
                  <input type="range" min="0" max="255" value={g} onChange={(e) => setG(parseInt(e.target.value))} className="w-full accent-green-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium" style={{ color: "#3b82f6" }}>Blue: {b}</label>
                  <input type="range" min="0" max="255" value={b} onChange={(e) => setB(parseInt(e.target.value))} className="w-full accent-blue-500" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted">Hue (Sắc): {h} do</label>
                  <input type="range" min="0" max="359" value={h} onChange={(e) => setH(parseInt(e.target.value))} className="w-full accent-accent" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted">Saturation: {(s * 100).toFixed(0)}%</label>
                  <input type="range" min="0" max="1" step="0.01" value={s} onChange={(e) => setS(parseFloat(e.target.value))} className="w-full accent-accent" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted">Value (Sáng): {(v * 100).toFixed(0)}%</label>
                  <input type="range" min="0" max="1" step="0.01" value={v} onChange={(e) => setV(parseFloat(e.target.value))} className="w-full accent-accent" />
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <div className="w-48 h-32 rounded-xl border-2 border-border" style={{ backgroundColor: displayColor }} />
            </div>

            <p className="text-sm text-muted text-center">
              {mode === "rgb" ? "RGB: trộn 3 màu cơ bản (Đỏ, Xanh lá, Xanh dương) -- cách máy tính lưu ảnh" : "HSV: mô tả theo sắc màu, độ đậm, độ sáng -- gần cách con người mô tả màu"}
            </p>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Cùng <strong>một màu</strong>{" "}có thể mô tả bằng nhiều cách: RGB (trộn 3 màu), HSV (sắc + đậm + sáng),
            LAB (sáng + 2 trục màu). Giống như <strong>cùng 1 địa chỉ</strong>{" "}có thể ghi bằng
            toạ độ GPS, tên đường, hay mô tả vị trí. Chọn không gian màu phù hợp cho từng bài toán!
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Bạn cần so sánh màu da trong ảnh y tế để phát hiện tổn thương. RGB cho kết quả không ổn định vì ảnh hưởng bởi ánh sáng. Dùng không gian màu nào?"
          options={[
            "Grayscale -- đơn giản nhất",
            "LAB -- đồng đều tri giác, khoảng cách phản ánh đúng sự khác biệt mắt người thấy",
            "HSV -- tách sắc khỏi sáng",
          ]}
          correct={1}
          explanation="LAB được thiết kế để khoảng cách Euclidean = sự khác biệt tri giác. 2 màu 'cách nhau 10 đơn vị' trong LAB luôn trông khác nhau cùng mức, bất kể vùng màu nào. Quan trọng cho ứng dụng y tế!"
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={8} label="Giải thích sâu">
        <ExplanationSection>
          <p>
            <strong>Không gian màu</strong>{" "}là hệ thống toán học biểu diễn màu sắc. Mỗi không gian phù hợp
            với mục đích khác nhau trong xử lý ảnh và thị giác máy tính.
          </p>

          <Callout variant="insight" title="4 không gian màu quan trọng nhất">
            <div className="space-y-2 text-sm">
              <p><strong>RGB (Red, Green, Blue):</strong>{" "}Chuẩn lưu trữ ảnh. 3 kênh x 0-255. Phụ thuộc ánh sáng, không tách riêng sắc/sáng.</p>
              <p><strong>HSV (Hue, Saturation, Value):</strong>{" "}Tách sắc màu khỏi độ sáng. Lọc màu cụ thể rất dễ. Tốt cho segmentation theo màu.</p>
              <p><strong>LAB (Lightness, A, B):</strong>{" "}Đồng đều tri giác. Khoảng cách Euclidean = sự khác biệt thị giác. Tốt cho so sánh màu.</p>
              <p><strong>Grayscale:</strong>{" "}1 kênh (0-255). Bỏ màu, giữ cấu trúc. Nhanh 3x, tốt cho edge detection, OCR.</p>
            </div>
          </Callout>

          <p><strong>Công thức chuyển RGB sang Grayscale</strong>{" "}(weighted average theo tri giác):</p>
          <LaTeX block>{"Y = 0.299R + 0.587G + 0.114B"}</LaTeX>
          <p className="text-sm text-muted">
            Mắt người nhạy với xanh lá (0.587) hơn đỏ (0.299) và xanh dương (0.114).
          </p>

          <Callout variant="warning" title="Ứng dụng thực tế tại Việt Nam">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>Camera giao thông:</strong>{" "}HSV để phát hiện đèn đỏ, biển báo theo màu</li>
              <li><strong>Nông nghiệp:</strong>{" "}HSV/LAB để phân biệt lá khỏe (xanh) vs lá bệnh (vàng/nâu)</li>
              <li><strong>eKYC:</strong>{" "}Grayscale + edge detection cho OCR trên CCCD</li>
              <li><strong>Thương mại:</strong>{" "}LAB để kiểm tra màu sắc đồng đều sản phẩm in ấn</li>
            </ul>
          </Callout>

          <CodeBlock language="python" title="Chuyển đổi không gian màu với OpenCV">
{`import cv2

# Đọc ảnh BGR (mặc định OpenCV)
img = cv2.imread("den_do_giao_thong.jpg")

# Chuyển sang HSV -- lọc đèn đỏ
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
# Đỏ nằm ở H: 0-10 hoặc 170-180
mask_red1 = cv2.inRange(hsv, (0, 100, 100), (10, 255, 255))
mask_red2 = cv2.inRange(hsv, (170, 100, 100), (180, 255, 255))
mask_red = mask_red1 | mask_red2

# Chuyển sang LAB -- so sánh màu
lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
# Khoảng cách Euclidean trong LAB = sự khác biệt tri giác

# Chuyển sang Grayscale -- OCR, edge detection
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
edges = cv2.Canny(gray, 100, 200)

# YCrCb -- tốt cho skin detection
ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)
# Skin: Cr 133-173, Cb 77-127`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={8} label="Tóm tắt">
        <MiniSummary points={[
          "RGB: chuẩn lưu trữ, 3 kênh x 0-255. HSV: tách sắc/sáng, tốt cho lọc màu",
          "LAB: đồng đều tri giác, khoảng cách = sự khác biệt thị giác. Tốt cho so sánh màu",
          "Grayscale: 1 kênh, bỏ màu giữ cấu trúc, nhanh 3x. Tốt cho edge detection, OCR",
          "Chọn không gian màu phù hợp bài toán: HSV cho phát hiện màu, LAB cho so sánh, Gray cho cấu trúc",
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
