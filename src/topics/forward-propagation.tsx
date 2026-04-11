"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "forward-propagation",
  title: "Forward Propagation",
  titleVi: "Lan truyền tiến",
  description:
    "Quá trình dữ liệu đi từ đầu vào qua các lớp để tạo ra dự đoán đầu ra.",
  category: "neural-fundamentals",
  tags: ["neural-network", "training", "fundamentals"],
  difficulty: "beginner",
  relatedSlugs: ["mlp", "backpropagation", "activation-functions", "loss-functions"],
  vizType: "interactive",
};

interface StepData {
  label: string;
  detail: string;
  values: string;
}

const steps: StepData[] = [
  {
    label: "1. Đầu vào",
    detail: "Nhận dữ liệu thô",
    values: "x = [0.5, 0.8]",
  },
  {
    label: "2. Nhân trọng số",
    detail: "z = W * x + b",
    values: "z1 = 0.5*0.3 + 0.8*0.7 + 0.1 = 0.81",
  },
  {
    label: "3. Kích hoạt",
    detail: "a = ReLU(z)",
    values: "a1 = ReLU(0.81) = 0.81",
  },
  {
    label: "4. Lớp tiếp theo",
    detail: "Lặp lại bước 2-3",
    values: "z2 = 0.81*0.5 + 0.2 = 0.605",
  },
  {
    label: "5. Đầu ra",
    detail: "Sigmoid cho xác suất",
    values: "y = sigmoid(0.605) = 0.647",
  },
];

export default function ForwardPropagationTopic() {
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);

  const playAnimation = useCallback(() => {
    if (isPlaying) return;
    setIsPlaying(true);
    setCurrentStep(0);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step >= steps.length) {
        clearInterval(interval);
        setTimeout(() => setIsPlaying(false), 1000);
        return;
      }
      setCurrentStep(step);
    }, 1200);
  }, [isPlaying]);

  const reset = useCallback(() => {
    setCurrentStep(-1);
    setIsPlaying(false);
  }, []);

  // SVG pipeline positions
  const pipelineY = 100;
  const stepWidth = 90;
  const startX = 30;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang ở trong một{" "}
          <strong>dây chuyền lắp ráp ô tô</strong>. Khung xe (dữ liệu thô) đi vào
          trạm đầu tiên, được lắp động cơ, rồi chuyển sang trạm tiếp theo để lắp bánh
          xe, rồi sơn, rồi kiểm tra chất lượng.
        </p>
        <p>
          Mỗi trạm (lớp) nhận sản phẩm bán thành phẩm từ trạm trước, thực hiện thao
          tác của mình (nhân trọng số + hàm kích hoạt), rồi chuyển kết quả cho trạm
          tiếp theo. Cuối cùng, ô tô hoàn thiện (đầu ra) ra khỏi dây chuyền.
        </p>
        <p>
          <strong>Lan truyền tiến</strong> chính là quá trình dữ liệu di chuyển{" "}
          <em>một chiều từ trái sang phải</em> qua tất cả các lớp trong mạng, không
          quay lại. Giống như dây chuyền chỉ chạy một hướng!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">
              Theo dõi dữ liệu đi qua từng bước trong mạng
            </p>
            <div className="flex gap-2">
              <button
                onClick={reset}
                className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
              >
                Đặt lại
              </button>
              <button
                onClick={playAnimation}
                disabled={isPlaying}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isPlaying ? "Đang chạy..." : "Bắt đầu"}
              </button>
            </div>
          </div>

          <svg viewBox="0 0 520 220" className="w-full max-w-2xl mx-auto">
            {/* Pipeline arrows */}
            {steps.map((_, i) => {
              if (i === steps.length - 1) return null;
              const x1 = startX + i * stepWidth + 70;
              const x2 = startX + (i + 1) * stepWidth + 10;
              const active = currentStep > i;
              return (
                <g key={`arrow-${i}`}>
                  <motion.line
                    x1={x1}
                    y1={pipelineY}
                    x2={x2}
                    y2={pipelineY}
                    stroke={active ? "#3b82f6" : "#334155"}
                    strokeWidth={active ? 3 : 1.5}
                    initial={false}
                    animate={{
                      stroke: active ? "#3b82f6" : "#334155",
                    }}
                    transition={{ duration: 0.3 }}
                  />
                  <motion.polygon
                    points={`${x2},${pipelineY - 5} ${x2 + 8},${pipelineY} ${x2},${pipelineY + 5}`}
                    fill={active ? "#3b82f6" : "#334155"}
                    initial={false}
                    animate={{ fill: active ? "#3b82f6" : "#334155" }}
                    transition={{ duration: 0.3 }}
                  />
                </g>
              );
            })}

            {/* Step boxes */}
            {steps.map((step, i) => {
              const x = startX + i * stepWidth;
              const active = currentStep >= i;
              const isCurrent = currentStep === i;

              return (
                <g key={`step-${i}`}>
                  <motion.rect
                    x={x}
                    y={pipelineY - 30}
                    width={75}
                    height={60}
                    rx={10}
                    fill={active ? (isCurrent ? "#3b82f6" : "#1e40af") : "#1e293b"}
                    stroke={active ? "#3b82f6" : "#475569"}
                    strokeWidth={isCurrent ? 3 : 1.5}
                    initial={false}
                    animate={{
                      fill: active ? (isCurrent ? "#3b82f6" : "#1e40af") : "#1e293b",
                      scale: isCurrent ? 1.05 : 1,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                  <text
                    x={x + 37.5}
                    y={pipelineY - 5}
                    textAnchor="middle"
                    fill="white"
                    fontSize="9"
                    fontWeight="bold"
                  >
                    {step.label}
                  </text>
                  <text
                    x={x + 37.5}
                    y={pipelineY + 12}
                    textAnchor="middle"
                    fill="#cbd5e1"
                    fontSize="8"
                  >
                    {step.detail}
                  </text>
                </g>
              );
            })}

            {/* Animated data packet */}
            <AnimatePresence>
              {currentStep >= 0 && (
                <motion.circle
                  cx={startX + currentStep * stepWidth + 37.5}
                  cy={pipelineY - 45}
                  r="8"
                  fill="#f59e0b"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.3, 1], opacity: 1 }}
                  transition={{ duration: 0.4 }}
                />
              )}
            </AnimatePresence>

            {/* Current step values */}
            {currentStep >= 0 && (
              <motion.g
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <rect
                  x="60"
                  y="155"
                  width="400"
                  height="35"
                  rx="8"
                  fill="#0f172a"
                  stroke="#334155"
                  strokeWidth="1"
                />
                <text
                  x="260"
                  y="177"
                  textAnchor="middle"
                  fill="#e2e8f0"
                  fontSize="12"
                  fontFamily="monospace"
                >
                  {steps[currentStep].values}
                </text>
              </motion.g>
            )}
          </svg>

          {/* Step description */}
          <AnimatePresence mode="wait">
            {currentStep >= 0 && (
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="rounded-lg bg-background/50 border border-border p-4"
              >
                <p className="text-sm font-semibold text-foreground">
                  {steps[currentStep].label}
                </p>
                <p className="text-sm text-muted mt-1">
                  {currentStep === 0 &&
                    "Dữ liệu đầu vào được đưa vào mạng. Ở đây ta có 2 đặc trưng: x1 = 0.5 và x2 = 0.8."}
                  {currentStep === 1 &&
                    "Mỗi đầu vào được nhân với trọng số tương ứng, cộng bias để tạo ra tổng có trọng số z."}
                  {currentStep === 2 &&
                    "Tổng z đi qua hàm kích hoạt (ở đây là ReLU) để thêm tính phi tuyến. Vì z > 0 nên ReLU giữ nguyên giá trị."}
                  {currentStep === 3 &&
                    "Kết quả từ lớp ẩn được dùng làm đầu vào cho lớp tiếp theo, lặp lại phép nhân trọng số + bias."}
                  {currentStep === 4 &&
                    "Lớp cuối dùng Sigmoid để chuyển kết quả thành xác suất (0-1). Giá trị 0.647 nghĩa là 64.7% khả năng thuộc lớp dương."}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Lan truyền tiến (Forward Propagation)</strong> là quá trình tính toán
          đầu ra của mạng nơ-ron bằng cách đưa dữ liệu qua từng lớp theo một chiều,
          từ lớp đầu vào đến lớp đầu ra.
        </p>
        <p>Tại mỗi lớp, hai phép tính chính xảy ra:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Biến đổi tuyến tính:</strong> z = W &sdot; x + b, trong đó W là ma
            trận trọng số, x là đầu vào, b là bias.
          </li>
          <li>
            <strong>Hàm kích hoạt:</strong> a = f(z), áp dụng hàm phi tuyến lên kết quả
            (ReLU, Sigmoid, v.v.).
          </li>
        </ol>
        <p>
          Kết quả đầu ra cuối cùng (y&#x0302;) được so sánh với nhãn thực tế (y) thông
          qua <strong>hàm mất mát (loss function)</strong> để đo độ sai lệch. Giá trị
          loss này sau đó được dùng trong <strong>lan truyền ngược (backpropagation)</strong>{" "}
          để cập nhật trọng số.
        </p>
        <p>
          Lan truyền tiến xảy ra cả trong quá trình huấn luyện lẫn khi sử dụng mô hình
          (inference). Tuy nhiên, khi inference thì không cần tính gradient, nên nhanh hơn
          nhiều.
        </p>
      </ExplanationSection>
    </>
  );
}
